import { describe, expect, it } from 'vitest';
import { letterHtml } from './print-letter';

describe('letterHtml', () => {
  it('escapes the letter so a note cannot inject markup', () => {
    const html = letterHtml('Note : <script>x</script> & "y"', 'ltr');
    expect(html).toContain('Note : &lt;script&gt;x&lt;/script&gt; &amp; &quot;y&quot;');
    expect(html).not.toContain('<script>');
  });

  it('keeps the direction of an Arabic letter', () => {
    expect(letterHtml('سجل التتبع', 'rtl')).toContain('<html dir="rtl">');
  });
});
