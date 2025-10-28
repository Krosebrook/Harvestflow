import fs from "fs";
import path from "path";

type Options = {
  retentionDays: number;
  maxSessions: number | null;
  dryRun: boolean;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  let retentionDays = Number(process.env.DROPZONE_RETENTION_DAYS ?? 30);
  let maxSessions: number | null = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith("--retention-days=")) {
      retentionDays = Number(arg.split("=")[1]);
    } else if (arg.startsWith("--max-sessions=")) {
      maxSessions = Number(arg.split("=")[1]);
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  if (!Number.isFinite(retentionDays) || retentionDays < 0) {
    throw new Error("Invalid retention days specified.");
  }
  if (maxSessions !== null && (!Number.isFinite(maxSessions) || maxSessions < 0)) {
    throw new Error("Invalid max sessions specified.");
  }

  return { retentionDays, maxSessions, dryRun };
}

async function removeDirectory(target: string, dryRun: boolean) {
  if (dryRun) {
    console.log(`[dry-run] Would remove ${target}`);
    return;
  }
  await fs.promises.rm(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}

async function main() {
  const dropzoneRoot = path.resolve(process.env.DROPZONE_ROOT ?? path.join(process.cwd(), "dropzone"));
  const sessionsDir = path.join(dropzoneRoot, "sessions");
  const { retentionDays, maxSessions, dryRun } = parseArgs();

  console.log(`Using dropzone sessions directory: ${sessionsDir}`);
  if (!fs.existsSync(sessionsDir)) {
    console.log("No dropzone sessions directory found. Nothing to clean.");
    return;
  }

  const entries = await fs.promises.readdir(sessionsDir, { withFileTypes: true });
  const sessions = entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const fullPath = path.join(sessionsDir, entry.name);
      const stats = fs.statSync(fullPath);
      return {
        name: entry.name,
        fullPath,
        mtimeMs: stats.mtimeMs,
        birthtimeMs: stats.birthtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  console.log(`Found ${sessions.length} session(s).`);
  const now = Date.now();
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  const toRemove = new Set<string>();

  for (const session of sessions) {
    if (session.mtimeMs < cutoff) {
      toRemove.add(session.fullPath);
    }
  }

  if (maxSessions !== null && sessions.length - toRemove.size > maxSessions) {
    const keep = sessions.filter(session => !toRemove.has(session.fullPath));
    const overflow = keep.slice(maxSessions);
    for (const session of overflow) {
      toRemove.add(session.fullPath);
    }
  }

  if (!toRemove.size) {
    console.log("Nothing to clean. All sessions within policy.");
    return;
  }

  console.log(`Preparing to remove ${toRemove.size} session(s):`);
  for (const target of toRemove) {
    await removeDirectory(target, dryRun);
  }
}

main().catch(err => {
  console.error("Dropzone cleanup failed:", err);
  process.exit(1);
});
