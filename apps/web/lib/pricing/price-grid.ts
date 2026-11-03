import type {
  DeliveryType,
  StorePricesResponse,
  UpdateStorePricesRequest,
} from '@trackecom/contracts';

/** One wilaya as the settings table edits it; '' means "we do not deliver this way". */
export interface PriceRow {
  readonly wilayaCode: number;
  readonly home: string;
  readonly stopdesk: string;
  /** Keeps paying delivery above the free-delivery threshold. */
  readonly excluded: boolean;
}

export interface PriceGridDraft {
  readonly rows: readonly PriceRow[];
  /** '' turns free delivery off. */
  readonly freeShippingFrom: string;
}

const TYPES: readonly DeliveryType[] = ['home', 'stopdesk'];
const asText = (price: number | null | undefined) => (price == null ? '' : String(price));
const asPrice = (text: string) => (text.trim() === '' ? null : Number(text));

export function draftOf(saved: StorePricesResponse): PriceGridDraft {
  const codes = [...new Set(saved.items.map((item) => item.wilayaCode))].sort((a, b) => a - b);
  const priceOf = (wilayaCode: number, type: DeliveryType) =>
    saved.items.find((item) => item.wilayaCode === wilayaCode && item.deliveryType === type)?.price;
  return {
    rows: codes.map((wilayaCode) => ({
      wilayaCode,
      home: asText(priceOf(wilayaCode, 'home')),
      stopdesk: asText(priceOf(wilayaCode, 'stopdesk')),
      excluded: saved.freeShippingExcludedWilayas.includes(wilayaCode),
    })),
    freeShippingFrom: asText(saved.freeShippingFrom),
  };
}

/** Fills every empty cell of one delivery type, e.g. "500 DA stop-desk everywhere". */
export function fillEmpty(
  draft: PriceGridDraft,
  type: DeliveryType,
  price: number,
): PriceGridDraft {
  return {
    ...draft,
    rows: draft.rows.map((row) => (row[type] === '' ? { ...row, [type]: String(price) } : row)),
  };
}

function changedItems(draft: PriceGridDraft, saved: PriceGridDraft) {
  const before = new Map(saved.rows.map((row) => [row.wilayaCode, row]));
  return draft.rows.flatMap((row) =>
    TYPES.filter((type) => before.get(row.wilayaCode)?.[type] !== row[type]).map((type) => ({
      wilayaCode: row.wilayaCode,
      deliveryType: type,
      price: asPrice(row[type]),
    })),
  );
}

const excludedOf = (draft: PriceGridDraft) =>
  draft.rows.filter((row) => row.excluded).map((row) => row.wilayaCode);

/** The `PUT /pricing/store-prices` body with only what changed; null when nothing did. */
export function priceChanges(
  draft: PriceGridDraft,
  saved: PriceGridDraft,
): UpdateStorePricesRequest | null {
  const items = changedItems(draft, saved);
  const excluded = excludedOf(draft);
  const excludedChanged = excluded.join() !== excludedOf(saved).join();
  const thresholdChanged = draft.freeShippingFrom.trim() !== saved.freeShippingFrom;
  if (items.length === 0 && !excludedChanged && !thresholdChanged) return null;
  return {
    items,
    ...(thresholdChanged ? { freeShippingFrom: asPrice(draft.freeShippingFrom) } : {}),
    ...(excludedChanged ? { freeShippingExcludedWilayas: excluded } : {}),
  };
}
