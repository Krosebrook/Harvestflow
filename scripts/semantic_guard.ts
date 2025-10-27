import fs from "fs";
import path from "path";
import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const settingsPath = path.join("drift", "settings.json");

let minSimilarity = 0.93;
if (fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    if (typeof settings.semanticMinSim === "number") {
      minSimilarity = settings.semanticMinSim;
    }
  } catch (err) {
    console.warn("⚠️  Unable to parse drift/settings.json; using default semantic threshold.");
  }
}

function embed(text: string): number[] {
  const DIM = 512;
  const vec = new Array(DIM).fill(0);
  for (const token of tokenizer.tokenize(text.toLowerCase())) {
    let hash = 7;
    for (const char of token) hash = (hash * 33 + char.charCodeAt(0)) | 0;
    vec[Math.abs(hash) % DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vec.map(value => value / norm);
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }
  return dot / ((Math.sqrt(aNorm) || 1) * (Math.sqrt(bNorm) || 1));
}

const PAIRS: [string, string][] = [
  ["snapshots/golden/claude-run/context_map.md", "agents/outputs/claude-run/context_map.md"],
  ["snapshots/golden/codex-run/context_map.md", "agents/outputs/codex-run/context_map.md"],
  ["snapshots/golden/gemini-run/context_map.md", "agents/outputs/gemini-run/context_map.md"]
];

let failures = 0;
for (const [golden, live] of PAIRS) {
  if (!fs.existsSync(golden) || !fs.existsSync(live)) continue;
  const sim = cosine(embed(fs.readFileSync(golden, "utf8")), embed(fs.readFileSync(live, "utf8")));
  if (sim < minSimilarity) {
    console.error(`❌ Semantic drift: ${live} (sim=${sim.toFixed(3)} < ${minSimilarity})`);
    failures += 1;
  }
}

if (failures) process.exit(5);
console.log("✅ Semantic similarity within thresholds");
