import fs from "fs";
import crypto from "crypto";

const config = JSON.parse(fs.readFileSync("drift/fingerprint.config.json", "utf8"));
const hashes: Record<string, string> = {};

for (const file of config.lock as string[]) {
  if (!fs.existsSync(file)) continue;
  const data = fs.readFileSync(file, "utf8");
  hashes[file] = crypto.createHash("sha256").update(data).digest("hex");
}

fs.mkdirSync("drift", { recursive: true });
fs.writeFileSync("drift/fingerprint.current.json", JSON.stringify(hashes, null, 2));
console.log("Wrote drift/fingerprint.current.json");
