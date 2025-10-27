import fs from "fs";
import path from "path";

const releaseRoot = path.join(process.cwd(), "releases");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const targetDir = path.join(releaseRoot, `harvestflow-${timestamp}`);

const artefacts: Array<{ src: string; dest: string }> = [
  { src: path.join("out", "master.zip"), dest: "master.zip" },
  { src: path.join("out", "manifest.json"), dest: "manifest.json" },
  { src: path.join("out", "metrics.json"), dest: "metrics.json" },
  { src: path.join("agents", "all-llm-outputs.zip"), dest: "all-llm-outputs.zip" }
];

fs.mkdirSync(targetDir, { recursive: true });

for (const artefact of artefacts) {
  if (!fs.existsSync(artefact.src)) continue;
  fs.copyFileSync(artefact.src, path.join(targetDir, artefact.dest));
}

fs.writeFileSync(
  path.join(targetDir, "README.txt"),
  [
    "HarvestFlow Release Bundle", 
    `Generated: ${new Date().toISOString()}`,
    "Contents:",
    "- master.zip",
    "- manifest.json",
    "- metrics.json",
    "- all-llm-outputs.zip (if present)",
    ""
  ].join("\n")
);

console.log(`Release bundle staged at ${path.relative(process.cwd(), targetDir)}`);
