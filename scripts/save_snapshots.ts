import fs from "fs";
import path from "path";

const SOURCE_ROOT = path.join(process.cwd(), "agents", "outputs");
const TARGET_ROOT = path.join(process.cwd(), "snapshots", "golden");
const INCLUDE_EXT = new Set([".md", ".json"]);

function copyFile(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}

if (!fs.existsSync(SOURCE_ROOT)) {
  console.error("⚠️  No agents/outputs directory found. Run the workflow before saving snapshots.");
  process.exit(1);
}

const files = walk(SOURCE_ROOT).filter(file => INCLUDE_EXT.has(path.extname(file)));
if (!files.length) {
  console.error("⚠️  No eligible output files found. Ensure the CLI runs emitted markdown/JSON artefacts.");
  process.exit(1);
}

for (const file of files) {
  const rel = path.relative(SOURCE_ROOT, file);
  const target = path.join(TARGET_ROOT, rel);
  copyFile(file, target);
  console.log(`Saved snapshot: ${path.relative(process.cwd(), target)}`);
}

console.log("✅ Golden snapshots updated.");
