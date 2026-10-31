import type { ParcelMoney } from '@trackecom/contracts';
import type { ParcelRecord } from '../application/ports/money.repository.js';

export const toParcelMoneyDto = (parcel: ParcelRecord): ParcelMoney => ({
  carrier: parcel.carrier,
  trackingNumber: parcel.trackingNumber,
  orderId: parcel.orderId,
  status: parcel.status,
  expectedCod: parcel.expectedCod,
  receivedCod: parcel.receivedCod,
  fees: parcel.fees,
  deliveredAt: parcel.deliveredAt?.toISOString() ?? null,
  payoutId: parcel.payoutId,
});
