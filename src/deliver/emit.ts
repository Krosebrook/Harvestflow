import fs from "fs";
import path from "path";
import { Flow } from "../schema/types.js";

export function writeDeliverables(flow: Flow) {
  const base = path.join("out", "flows", flow.id);
  fs.mkdirSync(base, { recursive: true });

  const readme = `# ${flow.title}\n\nAuto-generated deliverables for flow \"${flow.id}\".\n`;
  fs.writeFileSync(path.join(base, "README.md"), readme, "utf8");

  for (const deliverable of flow.deliverables) {
    const destination = path.join(base, deliverable.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, deliverable.content, "utf8");
  }
}
