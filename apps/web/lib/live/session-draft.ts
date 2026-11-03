import type { CreateLiveSession } from '@trackecom/contracts';

export interface ProductRow {
  readonly key: number;
  readonly code: string;
  readonly name: string;
  readonly unitPrice: number;
}

/** "A1", "A2"... "A9", then "B1": the next free code after the rows already there. */
export function nextCode(rows: readonly Pick<ProductRow, 'code'>[]): string {
  const used = new Set(rows.map((row) => row.code.toUpperCase()));
  for (let letter = 0; letter < 26; letter += 1) {
    for (let digit = 1; digit <= 9; digit += 1) {
      const code = `${String.fromCharCode(65 + letter)}${digit}`;
      if (!used.has(code)) return code;
    }
  }
  return '';
}

/** The request, keeping only rows with a name. */
export function toCreateSession(title: string, rows: readonly ProductRow[]): CreateLiveSession {
  return {
    title: title.trim(),
    products: rows
      .filter((row) => row.name.trim() !== '')
      .map(({ code, name, unitPrice }) => ({ code: code.trim().toUpperCase(), name, unitPrice })),
  };
}
