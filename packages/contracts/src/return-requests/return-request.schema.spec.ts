import { describe, expect, it } from 'vitest';
import { CreateReturnRequestSchema } from './return-request.schema.js';
import { DecideReturnRequestSchema } from './seller-return-request.schema.js';

describe('return request contracts', () => {
  it('takes an exchange with the wanted size', () => {
    const body = { kind: 'exchange', reason: 'wrong_size', wanted: ' taille L ' };
    expect(CreateReturnRequestSchema.parse(body).wanted).toBe('taille L');
  });

  it('needs the exchange order to accept an exchange and a message to refuse', () => {
    expect(DecideReturnRequestSchema.safeParse({ decision: 'accept_exchange' }).success).toBe(
      false,
    );
    expect(DecideReturnRequestSchema.safeParse({ decision: 'refuse' }).success).toBe(false);
    expect(DecideReturnRequestSchema.safeParse({ decision: 'accept_return' }).success).toBe(true);
  });
});
