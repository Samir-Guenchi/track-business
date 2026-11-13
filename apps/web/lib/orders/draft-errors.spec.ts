import { CreateOrderRequestSchema } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { invalidPaths } from '../forms/invalid-paths';
import { draftErrors } from './draft-errors';
import { emptyDraft, toCreateRequest } from './order-draft';

function errorsOf(draft = emptyDraft(), fee: number | null = null) {
  const parsed = CreateOrderRequestSchema.safeParse(toCreateRequest(draft, fee));
  return parsed.success ? new Set() : draftErrors(invalidPaths(parsed.error), draft);
}

describe('draftErrors', () => {
  it('flags every missing field of an empty draft', () => {
    expect([...errorsOf()].sort()).toEqual([
      'address',
      'commune',
      'fee',
      'item',
      'name',
      'phone',
      'wilaya',
    ]);
  });

  it('asks for the stop-desk when the order goes to a desk', () => {
    const paths = new Set(['deliveryType']);
    const draft = { address: '', stopDeskId: '' };

    expect([...draftErrors(paths, { ...draft, deliveryType: 'stopdesk' })]).toEqual(['stopDesk']);
    expect([...draftErrors(paths, { ...draft, deliveryType: 'home' })]).toEqual(['address']);
  });

  it('accepts a complete draft', () => {
    const draft = {
      ...emptyDraft(),
      phone: '0555123456',
      name: 'Client Test',
      wilayaCode: 16,
      communeId: 1601,
      address: 'Cité test',
      items: [{ key: 'a', name: 'Robe', quantity: 1, unitPrice: 2500 }],
    };

    expect(errorsOf(draft, 400).size).toBe(0);
    expect([...errorsOf(draft)]).toEqual(['fee']);
  });
});
