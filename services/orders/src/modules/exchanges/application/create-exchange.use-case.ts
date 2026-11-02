import { Inject, Injectable } from '@nestjs/common';
import { type CreateExchangeRequestSchema, type ExchangeLine } from '@trackecom/contracts';
import type { z } from 'zod';
import {
  type CreateOrderInput,
  CreateOrderUseCase,
} from '../../orders/application/create-order.use-case.js';
import { loadOrder, nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import type { OrderRecord } from '../../orders/domain/order.js';
import { AlreadyImportedError } from '../../orders/domain/order.errors.js';
import { type ExchangePlan, exchangeRefusal, planExchange } from '../domain/exchange.js';
import { ExchangeRefusedError } from '../domain/exchange.errors.js';

type ExchangeRequest = z.output<typeof CreateExchangeRequestSchema>;

/**
 * A size or colour swap (#138): one new order to the same customer, delivered while the courier
 * takes the old items back. Both orders' histories show the link.
 */
@Injectable()
export class CreateExchangeUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly create: CreateOrderUseCase,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(
    actor: OrderActor,
    orderId: string,
    request: ExchangeRequest,
  ): Promise<OrderRecord> {
    const original = await loadOrder(this.orders, actor.storeId, orderId);
    const lines: readonly Required<ExchangeLine>[] = request.lines;
    const refusal = exchangeRefusal(original, lines);
    if (refusal) throw new ExchangeRefusedError(refusal);
    const plan = planExchange(original, { ...request, lines });
    const exchange = await this.createOnce(actor, exchangeInput(original, plan, request.notes));
    const touched = nextVersion(original, {}, this.recorder.now());
    await this.orders.update(
      touched,
      this.recorder.effects(actor, {
        action: 'exchange_created',
        before: original,
        after: touched,
        extra: { reason: exchange.ref },
      }),
    );
    return exchange;
  }

  private async createOnce(actor: OrderActor, input: CreateOrderInput): Promise<OrderRecord> {
    try {
      return await this.create.execute(actor, input);
    } catch (error) {
      if (error instanceof AlreadyImportedError)
        throw new ExchangeRefusedError('already_exchanged');
      throw error;
    }
  }
}

function exchangeInput(
  original: OrderRecord,
  plan: ExchangePlan,
  notes: string | undefined,
): CreateOrderInput {
  const { customer } = original;
  const pin = customer.location;
  return {
    customer: {
      name: customer.name,
      phone: customer.phone,
      phone2: customer.phone2 ?? undefined,
      wilayaCode: customer.wilayaCode,
      communeId: customer.communeId,
      address: customer.address ?? undefined,
      landmark: customer.landmark ?? undefined,
      location: pin ? { lat: pin.lat, lng: pin.lng } : undefined,
    },
    items: plan.items,
    deliveryType: original.deliveryType,
    stopDeskId: original.stopDeskId ?? undefined,
    shippingFee: plan.shippingFee,
    discount: 0,
    notes,
    tags: ['echange'],
    source: 'exchange',
    externalRef: original.id,
    exchangeCollect: plan.collect,
  };
}
