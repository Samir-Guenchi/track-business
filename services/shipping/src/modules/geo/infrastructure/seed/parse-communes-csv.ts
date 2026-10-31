import { z } from 'zod';

/** One row of the communes dataset. Header: id,wilaya_code,name_fr,name_ar,postal_code,aliases */
const CommuneRowSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
  wilayaCode: z.coerce.number().int().min(1).max(99),
  nameFr: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  postalCode: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .pipe(
      z
        .string()
        .regex(/^\d{5}$/)
        .nullable(),
    ),
  aliases: z.string().transform((value) =>
    value
      .split('|')
      .map((alias) => alias.trim())
      .filter(Boolean),
  ),
});

export type CommuneRow = z.infer<typeof CommuneRowSchema>;

const FIELDS = ['id', 'wilayaCode', 'nameFr', 'nameAr', 'postalCode', 'aliases'] as const;

/** Splits one CSV line, honouring double-quoted fields ("Fort de l'Eau, ancien"). */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else cell += char;
  }
  return [...cells, cell];
}

/** Validates the whole file before anything is written; reports the first bad line. */
export function parseCommunesCsv(content: string): CommuneRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    const record = Object.fromEntries(FIELDS.map((field, i) => [field, cells[i] ?? '']));
    const result = CommuneRowSchema.safeParse(record);
    if (!result.success)
      throw new Error(`communes CSV line ${index + 2}: ${z.prettifyError(result.error)}`);
    return result.data;
  });
}
