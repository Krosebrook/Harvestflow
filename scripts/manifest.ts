import fs from "fs";
import path from "path";
import crypto from "crypto";

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const targets = [path.join("agents", "outputs"), path.join("out", "flows")];
const manifest: { spec_version: string; created: string; files: { path: string; sha256: string; bytes: number }[] } = {
  spec_version: "3.1.0",
  created: new Date().toISOString(),
  files: []
};

for (const root of targets) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const buffer = fs.readFileSync(file);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    manifest.files.push({ path: file, sha256, bytes: buffer.length });
  }
}

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync(path.join("out", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Wrote out/manifest.json");
