'use client';

import type { DeliveryType, PublicOrderForm, SubmitFormOrderResponse } from '@trackecom/contracts';
import { useState } from 'react';
import { apiBaseUrl } from '../../lib/api/api-base-url';
import { type Totals, totalsOf, utmFrom } from '../../lib/forms/form-total';

export interface CodFields {
  readonly productId: string;
  readonly variant: string;
  readonly quantity: number;
  readonly name: string;
  readonly phone: string;
  readonly wilayaCode: number | undefined;
  readonly communeId: number | undefined;
  readonly deliveryType: DeliveryType | undefined;
  readonly address: string;
  /** Our desk id from the picker (#137); empty when the wilaya has no known desk. */
  readonly stopDeskId: string;
  /** Honeypot, hidden from people. */
  readonly website: string;
}

export type FormErrorKey =
  | 'duplicate'
  | 'rate_limited'
  | 'spam'
  | 'invalid_product'
  | 'delivery_unavailable'
  | 'validation'
  | 'generic';

const KNOWN_CODES = new Set([
  'duplicate',
  'rate_limited',
  'spam',
  'invalid_product',
  'delivery_unavailable',
]);

/** State of the customer's form: the picks, the live total, sending and the answer. */
export function useCodForm(form: PublicOrderForm) {
  const [fields, setFields] = useState<CodFields>(() => initialFields(form));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [done, setDone] = useState<SubmitFormOrderResponse | null>(null);
  const patch = (next: Partial<CodFields>) => setFields((current) => ({ ...current, ...next }));
  const totals: Totals = totalsOf(form, fields);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const response = await postOrder(form.key, fields);
      if (response.ok) setDone((await response.json()) as SubmitFormOrderResponse);
      else setError(await errorKeyOf(response));
    } catch {
      setError('generic');
    } finally {
      setSending(false);
    }
  };
  return { fields, patch, totals, submit, sending, error, done };
}

export type CodForm = ReturnType<typeof useCodForm>;

function initialFields(form: PublicOrderForm): CodFields {
  return {
    productId: form.products[0]?.id ?? '',
    variant: '',
    quantity: 1,
    name: '',
    phone: '',
    wilayaCode: undefined,
    communeId: undefined,
    deliveryType: form.deliveryTypes.length === 1 ? form.deliveryTypes[0] : undefined,
    address: '',
    stopDeskId: '',
    website: '',
  };
}

function postOrder(key: string, fields: CodFields) {
  const isHome = fields.deliveryType === 'home';
  const utm = utmFrom(new URLSearchParams(window.location.search));
  const body = {
    name: fields.name,
    phone: fields.phone,
    wilayaCode: fields.wilayaCode,
    communeId: fields.communeId,
    deliveryType: fields.deliveryType,
    productId: fields.productId,
    quantity: fields.quantity,
    ...(isHome ? { address: fields.address } : { stopDeskId: fields.stopDeskId || 'to-confirm' }),
    ...(fields.variant ? { variant: fields.variant } : {}),
    ...(fields.website ? { website: fields.website } : {}),
    ...(utm ? { utm } : {}),
  };
  return fetch(`${apiBaseUrl}/public/forms/${encodeURIComponent(key)}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function errorKeyOf(response: Response): Promise<FormErrorKey> {
  const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
  const code = body?.error?.code?.replace(/^forms\./, '') ?? '';
  if (KNOWN_CODES.has(code)) return code as FormErrorKey;
  return response.status === 400 ? 'validation' : 'generic';
}
