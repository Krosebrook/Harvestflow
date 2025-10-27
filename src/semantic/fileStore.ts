import fs from "fs";
import path from "path";
import { Vector, VectorStore } from "./types.js";

const STORE_PATH = path.join("out", "vector-store.json");
let hydrated = false;
let cache = new Map<string, { vector: Vector; meta: any }>();

function hydrate() {
  if (hydrated) return;
  if (fs.existsSync(STORE_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
      cache = new Map(parsed.map((entry: any) => [entry.id, { vector: entry.vector, meta: entry.meta }]));
    } catch (err) {
      console.warn("⚠️  Unable to hydrate vector-store.json, starting with empty cache.");
      cache.clear();
    }
  }
  hydrated = true;
}

function persist() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  const serialised = [...cache.entries()].map(([id, value]) => ({ id, ...value }));
  fs.writeFileSync(STORE_PATH, JSON.stringify(serialised, null, 2));
}

export const FileStore: VectorStore = {
  async upsert(id, vector, meta) {
    hydrate();
    cache.set(id, { vector, meta });
    persist();
  },
  async query(queryVector, k) {
    hydrate();
    const results = [...cache.entries()].map(([id, { vector, meta }]) => {
      let dot = 0;
      let qNorm = 0;
      let vNorm = 0;
      for (let i = 0; i < queryVector.length; i += 1) {
        const q = queryVector[i];
        const v = vector[i] ?? 0;
        dot += q * v;
        qNorm += q * q;
        vNorm += v * v;
      }
      const score = dot / ((Math.sqrt(qNorm) || 1) * (Math.sqrt(vNorm) || 1));
      return { id, score, meta };
    });
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }
};
