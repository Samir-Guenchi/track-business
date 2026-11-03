/** A run of consecutive words inside one line of a message, kept as the user typed it. */
export interface Ngram {
  readonly text: string;
  readonly words: number;
}

/** Letters only: digits (phones, prices) never name a place. Apostrophes join "Aïn M'lila". */
const WORD = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;

function lineNgrams(line: string, maxWords: number): Ngram[] {
  const words = [...line.matchAll(WORD)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
  const ngrams: Ngram[] = [];
  for (let size = Math.min(maxWords, words.length); size >= 1; size -= 1) {
    for (let first = 0; first + size <= words.length; first += 1) {
      const start = words[first]?.start ?? 0;
      const end = words[first + size - 1]?.end ?? start;
      ngrams.push({ text: line.slice(start, end), words: size });
    }
  }
  return ngrams;
}

/** Every run of 1..maxWords words, longest first, never across a line break. */
export function messageNgrams(text: string, maxWords: number): Ngram[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => lineNgrams(line, maxWords))
    .sort((a, b) => b.words - a.words);
}
