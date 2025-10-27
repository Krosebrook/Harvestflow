import natural from "natural";

const tokenizer = new natural.WordTokenizer();

export function embed(text: string): number[] {
  const DIM = 1024;
  const vec = new Array(DIM).fill(0);
  for (const token of tokenizer.tokenize(text.toLowerCase())) {
    const stem = natural.PorterStemmer.stem(token);
    const hash = Math.abs(
      stem.split("").reduce((acc, char) => (acc * 33 + char.charCodeAt(0)) | 0, 7)
    );
    vec[hash % DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vec.map(value => value / norm);
}
