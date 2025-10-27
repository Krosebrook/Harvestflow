import { randomUUID } from "node:crypto";
import { Message } from "../schema/types.js";
import { embed } from "../semantic/localEmbed.js";
import { MemStore } from "../semantic/memStore.js";

export async function cluster(messages: Message[]) {
  const relevant = messages.filter(m => m.role !== "tool");
  for (const msg of relevant) {
    const text = msg.text ?? msg.content ?? "";
    await MemStore.upsert(msg.id || randomUUID(), embed(text), {
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
    const hits = await MemStore.query(embed(seed.title), 50);
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
