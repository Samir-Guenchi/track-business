function trigrams(text: string): Map<string, number> {
  const padded = `  ${text} `;
  const grams = new Map<string, number>();
  for (let i = 0; i < padded.length - 2; i += 1) {
    const gram = padded.slice(i, i + 3);
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  return grams;
}

/** Dice coefficient over character trigrams, 0 (nothing shared) to 1 (identical). */
export function trigramSimilarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;
  const left = trigrams(a);
  const right = trigrams(b);
  let shared = 0;
  for (const [gram, count] of left) shared += Math.min(count, right.get(gram) ?? 0);
  const total = [...left.values(), ...right.values()].reduce((sum, count) => sum + count, 0);
  return (2 * shared) / total;
}
