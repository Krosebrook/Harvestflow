import { randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";
import { Message } from "../schema/types.js";
import { embed } from "../semantic/localEmbed.js";
import { MemStore } from "../semantic/memStore.js";
import { FileStore } from "../semantic/fileStore.js";

const configPath = path.join(process.cwd(), "config.json");
let storeType: "mem" | "file" = "mem";
if (fs.existsSync(configPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (cfg.vectorStore === "file") storeType = "file";
  } catch (err) {
    console.warn("⚠️  Unable to parse config.json; defaulting to mem store.");
  }
}

const store = storeType === "file" ? FileStore : MemStore;

export async function cluster(messages: Message[]) {
  const relevant = messages.filter(m => m.role !== "tool");
  for (const msg of relevant) {
    const text = msg.text ?? msg.content ?? "";
    await store.upsert(msg.id || randomUUID(), embed(text), {
      role: msg.role,
      text
    });
  }

  const seeds = messages
    .filter(m => m.role === "user")
    .map(m => ({ id: m.id, title: (m.text ?? m.content ?? "").split("\n")[0]?.slice(0, 80) || "" }))
    .filter(seed => seed.title)
    .slice(0, 12);

  const topics: { title: string; ids: string[] }[] = [];
  for (const seed of seeds) {
    const hits = await store.query(embed(seed.title), 50);
    const ids = Array.from(new Set([seed.id, ...hits.map(hit => hit.id)]));
    topics.push({ title: seed.title, ids });
  }

  const assigned = new Set<string>();
  return topics.map(topic => ({
    title: topic.title,
    ids: topic.ids.filter(id => {
      if (assigned.has(id)) return false;
      assigned.add(id);
      return true;
    })
  }));
}
