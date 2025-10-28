const fs = require("fs");

const baseline = JSON.parse(fs.readFileSync("drift/fingerprint.baseline.json", "utf8"));
const current = JSON.parse(fs.readFileSync("drift/fingerprint.current.json", "utf8"));

const changed = [];
for (const key of Object.keys(current)) {
  if (!baseline[key]) continue;
  if (baseline[key] !== current[key]) changed.push(key);
}

if (changed.length) {
  console.error("❌ Prompt/Config drift detected:\n" + changed.map(item => ` - ${item}`).join("\n"));
  process.exit(2);
}

console.log("✅ No fingerprint drift");
