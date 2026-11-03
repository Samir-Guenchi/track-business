import { escapeHtml } from '../claims/print-letter';

/** Every printed word, already translated, so this file stays free of i18n. */
export interface InvoiceText {
  readonly title: string;
  readonly dir: 'ltr' | 'rtl';
  readonly seller: readonly string[];
  readonly customer: readonly string[];
  readonly meta: readonly string[];
  readonly headers: readonly [string, string, string, string];
  readonly totals: readonly (readonly [string, string])[];
  readonly lines: readonly (readonly [string, string, string, string])[];
  readonly footer: string;
}

const cells = (values: readonly string[], tag: 'td' | 'th') =>
  values.map((value) => `<${tag}>${escapeHtml(value)}</${tag}>`).join('');

const block = (rows: readonly string[]) => rows.map(escapeHtml).join('<br>');

const STYLE =
  'body{margin:1.5cm;font:13px/1.5 sans-serif}table{width:100%;border-collapse:collapse;margin:16px 0}' +
  'td,th{border-bottom:1px solid #ccc;padding:6px;text-align:start}.cols{display:flex;gap:32px}' +
  '.cols>div{flex:1}h1{font-size:20px}';

/** The invoice as a standalone printable page; every value is escaped. */
export function invoiceHtml(text: InvoiceText): string {
  const lines = text.lines.map((line) => `<tr>${cells(line, 'td')}</tr>`).join('');
  const totals = text.totals.map((row) => `<tr>${cells(row, 'th')}</tr>`).join('');
  return `<!doctype html><html dir="${text.dir}"><meta charset="utf-8"><title>${escapeHtml(text.title)}</title><style>${STYLE}</style><body>
<h1>${escapeHtml(text.title)}</h1><p>${block(text.meta)}</p>
<div class="cols"><div>${block(text.seller)}</div><div>${block(text.customer)}</div></div>
<table><thead><tr>${cells(text.headers, 'th')}</tr></thead><tbody>${lines}</tbody></table>
<table>${totals}</table><p>${escapeHtml(text.footer)}</p></body></html>`;
}

/**
 * Keeps only the lines that have a value. Each value is wrapped in Unicode isolates so a phone
 * or an RC number keeps its order on an Arabic (RTL) page.
 */
export const presentLines = (rows: readonly (readonly [string, string | null])[]): string[] =>
  rows
    .filter(([, value]) => value !== null && value !== '')
    .map(([label, value]) => `${label} \u2068${value ?? ''}\u2069`.trim());
