export type Vector = number[];
export type EmbedFn = (text: string) => Vector;

export interface VectorStore {
  upsert(id: string, vector: Vector, meta: Record<string, any>): Promise<void>;
  query(vector: Vector, k: number): Promise<{ id: string; score: number; meta: any }[]>;
}
