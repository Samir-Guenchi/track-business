import type { ParseOrderTextResponse } from '@trackecom/contracts';
import type { OrderDraft } from './order-draft';

/** "+213555123456" -> "0555 12 34 56", the spelling agents type and read. */
export function localPhone(e164: string): string {
  const digits = `0${e164.replace(/\D/g, '').slice(-9)}`;
  return digits.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4');
}

const appendLine = (text: string, line: string | null) =>
  !line ? text : text.trim() === '' ? line : `${text}\n${line}`;

function withQuantity(draft: OrderDraft, quantity: number | null): OrderDraft['items'] {
  const [first, ...others] = draft.items;
  if (!first || quantity === null || first.name !== '') return draft.items;
  return [{ ...first, quantity }, ...others];
}

function withPlace(draft: OrderDraft, parsed: ParseOrderTextResponse) {
  if (draft.wilayaCode !== undefined || parsed.wilayaCode === null) {
    return { wilayaCode: draft.wilayaCode, communeId: draft.communeId };
  }
  return { wilayaCode: parsed.wilayaCode, communeId: parsed.communeId ?? undefined };
}

/**
 * Fills the order form from a pasted message (#193), keeping anything the agent already typed.
 * What the parser could not place (product, size, colour) goes to the notes, never lost.
 */
export function withPastedOrder(draft: OrderDraft, parsed: ParseOrderTextResponse): OrderDraft {
  return {
    ...draft,
    phone: draft.phone || (parsed.phone ? localPhone(parsed.phone) : ''),
    name: draft.name || (parsed.name ?? ''),
    ...withPlace(draft, parsed),
    address: draft.address || (parsed.address ?? ''),
    items: withQuantity(draft, parsed.quantity),
    notes: appendLine(draft.notes, parsed.rest),
  };
}

/** The fields the paste filled, to tell the agent what to check. */
export function filledFields(parsed: ParseOrderTextResponse): string[] {
  const fields: [string, unknown][] = [
    ['phone', parsed.phone],
    ['name', parsed.name],
    ['commune', parsed.communeId ?? parsed.wilayaCode],
    ['address', parsed.address],
    ['quantity', parsed.quantity],
  ];
  return fields.filter(([, value]) => value !== null).map(([field]) => field);
}
