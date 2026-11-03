import type { LocatePlacesResponse, ParseOrderTextResponse } from '@trackecom/contracts';
import { findCustomerName } from './customer-name.js';
import {
  type Found,
  findLabeled,
  findPhones,
  findQuantity,
  westernDigits,
} from './message-fields.js';

const ADDRESS_LABELS = ['adresse', 'address', 'adr', 'العنوان'];
/** Field labels left behind once their values are cut out ("Tél :", "ولاية :"). */
const LEFTOVER_LABELS =
  /(?<![\p{L}])(?:t[ée]l[ée]phone|t[ée]l|phone|num[ée]ro|num|mob|wilaya|commune|الهاتف|رقم|ولاية|بلدية)(?![\p{L}])\s*[:：-]?/giu;
const MIN_REST_LETTERS = 2;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Removes the first occurrence of a fragment, tolerant to the spaces and commas around words. */
function cutOnce(text: string, fragment: string): string {
  const words = fragment.trim().split(/\s+/).map(escape);
  if (words.length === 0 || !words[0]) return text;
  return text.replace(new RegExp(words.join('[\\s,.;-]+'), 'u'), ' ');
}

function tidy(text: string): string | null {
  const cleaned = text
    .replace(LEFTOVER_LABELS, ' ')
    .replace(/(?:\s*[,;|/-]\s*){2,}/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:|/-]+|[\s,.;:|/-]+$/g, '');
  const letters = cleaned.match(/\p{L}/gu)?.length ?? 0;
  return letters >= MIN_REST_LETTERS ? cleaned : null;
}

const valueOf = <T>(found: Found<T> | undefined | null): T | null => found?.value ?? null;
const cutAll = (text: string, fragments: readonly string[]) => fragments.reduce(cutOnce, text);

function placeFields(places: LocatePlacesResponse | null) {
  return {
    wilayaCode: places?.wilaya?.code ?? null,
    communeId: places?.commune?.commune.id ?? null,
    placeScore: places?.commune?.score ?? null,
  };
}

function placeTextsOf(places: LocatePlacesResponse | null): string[] {
  return [places?.commune?.matchedText, places?.wilaya?.matchedText].filter(
    (value): value is string => Boolean(value),
  );
}

/**
 * Turns a pasted chat message into order form suggestions. Pure: places come from shipping's
 * locator (null when it could not be reached), everything else is read here. Every value found
 * is cut out of the text, and what is left is returned as `rest` so nothing typed is lost.
 */
export function readOrderText(
  raw: string,
  places: LocatePlacesResponse | null,
): ParseOrderTextResponse {
  const text = westernDigits(raw);
  const placeTexts = placeTextsOf(places);
  const [phone, phone2] = findPhones(text);
  const quantity = findQuantity(text);
  const address = findLabeled(text, ADDRESS_LABELS);
  const name = findCustomerName(text, placeTexts);
  const found = [phone, phone2, quantity, address, name].flatMap((item) =>
    item ? [item.text] : [],
  );
  return {
    name: valueOf(name),
    phone: valueOf(phone),
    phone2: valueOf(phone2),
    ...placeFields(places),
    address: address ? tidy(cutAll(address.value, placeTexts)) : null,
    quantity: valueOf(quantity),
    rest: tidy([...found, ...placeTexts].reduce(cutOnce, text)),
  };
}
