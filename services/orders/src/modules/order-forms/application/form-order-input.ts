import type { SubmitFormOrderRequest } from '@trackecom/contracts';
import type { CreateOrderInput } from '../../orders/application/create-order.use-case.js';
import type { PricedChoice } from '../domain/form-pricing.js';
import type { OrderFormRecord } from '../domain/order-form.js';

/** Tag on orders whose delivery price could not be checked: the agent confirms it on the call. */
export const FEE_CHECK_TAG = 'fee-check';

/** The order a form submission becomes. */
export function orderFromForm(
  form: OrderFormRecord,
  body: SubmitFormOrderRequest,
  priced: PricedChoice,
): CreateOrderInput {
  const campaign = body.utm?.campaign ? ` · ${body.utm.campaign}` : '';
  return {
    customer: {
      name: body.name,
      phone: body.phone,
      wilayaCode: body.wilayaCode,
      communeId: body.communeId,
      address: body.address,
    },
    items: [
      {
        productId: priced.product.id,
        name: priced.itemName,
        quantity: body.quantity,
        unitPrice: priced.product.unitPrice,
      },
    ],
    deliveryType: body.deliveryType,
    stopDeskId: body.stopDeskId,
    shippingFee: priced.shippingFee ?? 0,
    discount: 0,
    notes: `${form.name}${campaign}`,
    tags: priced.shippingFee === null ? [FEE_CHECK_TAG] : [],
    source: 'form',
  };
}
