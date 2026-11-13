const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);

/** The letter as a standalone printable page; every character of the text is escaped. */
export function letterHtml(text: string, dir: 'ltr' | 'rtl'): string {
  const safe = escapeHtml(text);
  return `<!doctype html><html dir="${dir}"><meta charset="utf-8"><body style="margin:2cm;font:14px/1.6 sans-serif;white-space:pre-wrap">${safe}</body></html>`;
}

/** Opens a standalone page and prints it, so nothing of the app behind it is printed. */
export function printPage(html: string): void {
  const page = window.open('', '_blank');
  if (!page) return;
  page.document.write(html);
  page.document.close();
  page.print();
}

export const printLetter = (text: string, dir: 'ltr' | 'rtl'): void =>
  printPage(letterHtml(text, dir));
