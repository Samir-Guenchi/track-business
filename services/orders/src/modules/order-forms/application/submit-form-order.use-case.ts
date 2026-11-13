import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { SubmitFormOrderResponse } from '@trackecom/contracts';
import { CreateOrderUseCase } from '../../orders/application/create-order.use-case.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { type PricedChoice, priceChoice } from '../domain/form-pricing.js';
import type { OrderFormRecord } from '../domain/order-form.js';
import { orderFromForm } from './form-order-input.js';
import { STORE_PRICES, type StorePriceSource } from './order-forms.ports.js';
import { type Submission, SubmissionGate } from './submission-gate.js';

/**
 * A customer orders through a public form (#134). Past the anti-spam gate, the pick is checked
 * and priced, then it becomes a normal `new` order with source `form`, so the confirmation
 * queue, duplicate and fraud checks treat it like any other order.
 */
@Injectable()
export class SubmitFormOrderUseCase {
  constructor(
    private readonly gate: SubmissionGate,
    private readonly create: CreateOrderUseCase,
    @Inject(STORE_PRICES) private readonly prices: StorePriceSource,
  ) {}

  async execute(submission: Submission): Promise<SubmitFormOrderResponse> {
    const { form, attempt } = await this.gate.admit(submission);
    const { body } = submission;
    const priced = priceChoice(form, body, await this.prices.pricesFor(form.storeId));
    const order = await this.create.execute(actorFor(form), orderFromForm(form, body, priced));
    await this.gate.accepted(attempt, order.id);
    return response(order.ref, priced);
  }
}

const actorFor = (form: OrderFormRecord): OrderActor => ({
  storeId: form.storeId,
  userId: 'order-form',
  role: 'owner',
  ip: '',
  correlationId: randomUUID(),
  actorType: 'system',
});

const response = (ref: string, priced: PricedChoice): SubmitFormOrderResponse => ({
  ref,
  subtotal: priced.subtotal,
  shippingFee: priced.shippingFee,
  total: priced.subtotal + (priced.shippingFee ?? 0),
});
