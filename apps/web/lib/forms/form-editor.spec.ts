import { describe, expect, it } from 'vitest';
import { emptyDraft, embedSnippet, productIdOf, requestOf } from './form-editor';

describe('form editor', () => {
  it('derives product ids from names', () => {
    expect(productIdOf('Sac en cuir Noir', 0)).toBe('sac-en-cuir-noir');
    expect(productIdOf('Écharpe été', 1)).toBe('echarpe-ete');
    expect(productIdOf('حقيبة', 2)).toBe('produit-3');
  });

  it('turns the draft into a request with variants split', () => {
    const draft = {
      ...emptyDraft,
      name: ' Landing ',
      title: 'Boutique',
      products: [{ id: '', name: 'Sac', unitPrice: '3500', variants: 'S, M,, L ' }],
    };
    expect(requestOf(draft)).toMatchObject({
      name: 'Landing',
      products: [{ id: 'sac', name: 'Sac', unitPrice: 3500, variants: ['S', 'M', 'L'] }],
    });
  });

  it('builds the snippet with the key and language', () => {
    expect(embedSnippet('https://app.example.dz', 'KEY', 'ar')).toBe(
      '<script src="https://app.example.dz/embed/order-form.js" data-form="KEY" data-locale="ar" async></script>',
    );
  });
});
