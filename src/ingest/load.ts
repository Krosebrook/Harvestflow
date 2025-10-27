import fs from "fs";
import { ChatExport } from "../schema/types.js";

export function loadChat(path: string) {
  const raw = fs.readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  return ChatExport.parse(json);
}
