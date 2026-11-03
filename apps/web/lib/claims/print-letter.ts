const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** The letter as a standalone printable page; every character of the text is escaped. */
export function letterHtml(text: string, dir: 'ltr' | 'rtl'): string {
  const safe = text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
  return `<!doctype html><html dir="${dir}"><meta charset="utf-8"><body style="margin:2cm;font:14px/1.6 sans-serif;white-space:pre-wrap">${safe}</body></html>`;
}

/** Prints only the letter, not the page behind the dialog. */
export function printLetter(text: string, dir: 'ltr' | 'rtl'): void {
  const page = window.open('', '_blank');
  if (!page) return;
  page.document.write(letterHtml(text, dir));
  page.document.close();
  page.print();
}
