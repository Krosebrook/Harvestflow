import levenshtein from 'fast-levenshtein';

export function calculateSimilarity(a: string, b: string): number {
  const distance = levenshtein.get(a, b);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}
