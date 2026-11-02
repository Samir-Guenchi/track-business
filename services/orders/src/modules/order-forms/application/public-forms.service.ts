import { Inject, Injectable } from '@nestjs/common';
import type { PublicOrderForm } from '@trackecom/contracts';
import { type OrderFormRecord, offeredPrices } from '../domain/order-form.js';
import { OrderFormNotFoundError } from '../domain/order-form.errors.js';
import {
  ORDER_FORM_STORE,
  type OrderFormStore,
  STORE_PRICES,
  type StorePriceSource,
} from './order-forms.ports.js';

/** The customer's side (#134): an enabled form found by its public key, with live prices. */
@Injectable()
export class PublicFormsService {
  constructor(
    @Inject(ORDER_FORM_STORE) private readonly forms: OrderFormStore,
    @Inject(STORE_PRICES) private readonly prices: StorePriceSource,
  ) {}

  async enabledForm(key: string): Promise<OrderFormRecord> {
    const form = await this.forms.byKey(key);
    if (!form?.enabled) throw new OrderFormNotFoundError('No order form with this key');
    return form;
  }

  async view(key: string): Promise<PublicOrderForm> {
    const form = await this.enabledForm(key);
    const prices = await this.prices.pricesFor(form.storeId);
    return {
      key: form.key,
      title: form.title,
      products: [...form.products],
      deliveryTypes: [...form.deliveryTypes],
      maxQuantity: form.maxQuantity,
      theme: { accent: form.accent },
      prices: offeredPrices(prices?.items ?? [], form.deliveryTypes),
      freeShippingFrom: prices?.freeShippingFrom ?? null,
    };
  }
}
