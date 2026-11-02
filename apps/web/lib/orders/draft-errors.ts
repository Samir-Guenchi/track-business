import type { OrderDraft } from './order-draft';

export type DraftField =
  'phone' | 'name' | 'wilaya' | 'commune' | 'address' | 'stopDesk' | 'item' | 'fee';

const FIELD_OF_PATH: Readonly<Record<string, DraftField>> = {
  'customer.phone': 'phone',
  'customer.name': 'name',
  'customer.wilayaCode': 'wilaya',
  'customer.communeId': 'commune',
  'customer.address': 'address',
  stopDeskId: 'stopDesk',
  shippingFee: 'fee',
};

/** Turns the zod paths of `CreateOrderRequestSchema` into the fields the form shows errors on. */
export function draftErrors(
  paths: ReadonlySet<string>,
  draft: Pick<OrderDraft, 'deliveryType' | 'address' | 'stopDeskId'>,
): ReadonlySet<DraftField> {
  const fields = new Set<DraftField>();
  const deliveryField = draft.deliveryType === 'home' ? 'address' : 'stopDesk';
  for (const path of paths) {
    const field = FIELD_OF_PATH[path];
    if (field) fields.add(field);
    if (path === 'items' || path.startsWith('items.')) fields.add('item');
    // The schema reports a missing address or stop-desk on `deliveryType`.
    if (path === 'deliveryType') fields.add(deliveryField);
  }
  // zod skips that check while other fields fail; show it in the same pass.
  const deliveryValue = draft.deliveryType === 'home' ? draft.address : draft.stopDeskId;
  if (fields.size > 0 && deliveryValue.trim() === '') fields.add(deliveryField);
  return fields;
}
