import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const outputDir = path.join("agents", "outputs");
const target = path.join("agents", "all-llm-outputs.zip");

if (!fs.existsSync(outputDir)) {
  console.error("⚠️  No agents/outputs directory found. Skipping bundle.");
  process.exit(0);
}

const zip = new AdmZip();

const addDirectory = (dir: string, base = "") => {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const rel = path.join(base, entry);
    if (fs.statSync(full).isDirectory()) {
      addDirectory(full, rel);
    } else {
      zip.addLocalFile(full, path.dirname(rel) === "." ? "" : path.dirname(rel), path.basename(rel));
    }
  }
};

addDirectory(outputDir);
zip.writeZip(target);
console.log(`Bundled LLM outputs → ${target}`);
