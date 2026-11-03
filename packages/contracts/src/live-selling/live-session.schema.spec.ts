import { describe, expect, it } from 'vitest';
import { CreateLiveSessionSchema } from './live-session.schema.js';

describe('CreateLiveSessionSchema', () => {
  it('upper-cases codes and refuses the same code twice', () => {
    const product = { code: 'a1', name: 'Robe', unitPrice: 2500 };
    const ok = CreateLiveSessionSchema.parse({ title: 'Live soir', products: [product] });
    expect(ok.products[0]?.code).toBe('A1');
    const twice = { title: 'Live', products: [product, { ...product, name: 'Jupe' }] };
    expect(CreateLiveSessionSchema.safeParse(twice).success).toBe(false);
  });
});
