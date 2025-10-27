import fs from "fs";

if (!fs.existsSync("out/master.zip")) {
  console.error("master.zip missing");
  process.exit(1);
}

console.log("Smoke OK");
