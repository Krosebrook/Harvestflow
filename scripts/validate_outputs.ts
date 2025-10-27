import fs from "fs";
import path from "path";
import { Validator } from "jsonschema";

const validator = new Validator();
const schemaPath = path.join("schema", "deliverable.schema.json");

if (!fs.existsSync(schemaPath)) {
  console.error("❌ schema/deliverable.schema.json not found.");
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function collect(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) return collect(full);
    return full.endsWith(".json") ? [full] : [];
  });
}

const roots = [
  path.join("agents", "outputs", "claude-run"),
  path.join("agents", "outputs", "codex-run"),
  path.join("agents", "outputs", "gemini-run")
];

const files = roots.flatMap(collect);
let failures = 0;

for (const file of files) {
  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const result = validator.validate(json, schema);
    if (!result.valid) {
      console.error(`❌ Schema invalid: ${file}\n${result.errors.map(err => err.stack).join("\n")}\n`);
      failures += 1;
    }
  } catch (err: any) {
    console.error(`❌ Bad JSON: ${file} → ${err.message}`);
    failures += 1;
  }
}

if (failures) process.exit(3);
console.log("✅ Output schema valid");
