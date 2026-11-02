import { Inject, Injectable } from '@nestjs/common';
import type { CreateOrderFormRequest, UpdateOrderFormRequest } from '@trackecom/contracts';
import {
  type Clock,
  type IdGenerator,
  ORDERS_PORTS,
} from '../../orders/application/ports/orders.ports.js';
import { type OrderFormRecord, newFormKey } from '../domain/order-form.js';
import { OrderFormNotFoundError } from '../domain/order-form.errors.js';
import { ORDER_FORM_STORE, type OrderFormStore } from './order-forms.ports.js';

const editable = (body: CreateOrderFormRequest) => ({
  name: body.name,
  title: body.title,
  products: body.products,
  deliveryTypes: body.deliveryTypes,
  maxQuantity: body.maxQuantity,
  accent: body.theme.accent,
});

/** The seller's side of order forms (#134): create one per landing page, edit, switch off. */
@Injectable()
export class OrderFormsService {
  constructor(
    @Inject(ORDER_FORM_STORE) private readonly forms: OrderFormStore,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
    @Inject(ORDERS_PORTS.ids) private readonly newId: IdGenerator,
  ) {}

  list(storeId: string): Promise<OrderFormRecord[]> {
    return this.forms.list(storeId);
  }

  async create(storeId: string, body: CreateOrderFormRequest): Promise<OrderFormRecord> {
    const now = this.now();
    const form: OrderFormRecord = {
      ...editable(body),
      id: this.newId(),
      storeId,
      key: newFormKey(),
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    await this.forms.insert(form);
    return form;
  }

  async update(storeId: string, id: string, body: UpdateOrderFormRequest) {
    const current = await this.forms.byId(storeId, id);
    if (!current) throw new OrderFormNotFoundError('No order form with this id');
    const form = { ...current, ...editable(body), enabled: body.enabled, updatedAt: this.now() };
    if (!(await this.forms.update(form))) throw new OrderFormNotFoundError('Order form is gone');
    return form;
  }
}
