import { Vector, VectorStore } from "./types.js";

const db = new Map<string, { vector: Vector; meta: any }>();

export const MemStore: VectorStore = {
  async upsert(id, vector, meta) {
    db.set(id, { vector, meta });
  },
  async query(queryVector, k) {
    const results = [...db.entries()].map(([id, { vector, meta }]) => {
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
