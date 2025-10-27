import fs from "fs";
import path from "path";
import levenshtein from "fast-levenshtein";

const liveRoot = "agents/outputs";
const goldenRoot = "snapshots/golden";
const settingsPath = path.join("drift", "settings.json");

let snapshotEditBudgetPct = 0.03;
if (fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    if (typeof settings.snapshotEditBudgetPct === "number") {
      snapshotEditBudgetPct = settings.snapshotEditBudgetPct;
    }
  } catch (err) {
    console.warn("⚠️  Unable to read drift/settings.json; falling back to default snapshot budget.");
  }
}

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

if (!fs.existsSync(goldenRoot)) {
  console.log("No golden snapshots found. Skipping drift comparison.");
  process.exit(0);
}

const goldenFiles = listFiles(goldenRoot).filter(file => /\.(md|json)$/i.test(file));
let failures = 0;

for (const goldenFile of goldenFiles) {
  const rel = goldenFile.replace(goldenRoot + path.sep, "");
  const liveFile = path.join(liveRoot, rel);
  if (!fs.existsSync(liveFile)) {
    console.error("❌ Missing live file:", rel);
    failures += 1;
    continue;
  }
  const goldenText = fs.readFileSync(goldenFile, "utf8");
  const liveText = fs.readFileSync(liveFile, "utf8");
  const lev = levenshtein.get(goldenText, liveText);
  const budget = Math.ceil(goldenText.length * snapshotEditBudgetPct);
  if (lev > budget) {
    console.error(`❌ Snapshot drift: ${rel} (lev=${lev} > budget=${budget})`);
    failures += 1;
  }
}

if (failures) process.exit(4);
console.log("✅ Snapshots within drift budget");
