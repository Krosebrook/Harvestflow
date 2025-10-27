import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export function zipFlow(flowId: string) {
  const dir = path.join("out", "flows", flowId);
  if (!fs.existsSync(dir)) return;
  const zip = new AdmZip();
  const addDir = (base: string, relative = "") => {
    const items = fs.readdirSync(base);
    for (const item of items) {
      const full = path.join(base, item);
      const relPath = path.join(relative, item);
      if (fs.statSync(full).isDirectory()) {
        addDir(full, relPath);
      } else {
        zip.addLocalFile(full, path.dirname(relPath) === "." ? "" : path.dirname(relPath), path.basename(relPath));
      }
    }
  };
  addDir(dir);
  const target = path.join("out", "flows", `${flowId}.zip`);
  zip.writeZip(target);
}

export function zipMaster() {
  const flowsDir = path.join("out", "flows");
  if (!fs.existsSync(flowsDir)) return;
  const zip = new AdmZip();
  const files = fs.readdirSync(flowsDir).filter(file => file.endsWith(".zip"));
  for (const file of files) {
    zip.addLocalFile(path.join(flowsDir, file), "flows");
  }
  const target = path.join("out", "master.zip");
  zip.writeZip(target);
}
