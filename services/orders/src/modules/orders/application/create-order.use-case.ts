import { Inject, Injectable } from '@nestjs/common';
import { ORDER_EVENTS, type OrderSource } from '@trackecom/contracts';
import type { OrderRecord } from '../domain/order.js';
import { AlreadyImportedError } from '../domain/order.errors.js';
import { DUPLICATE_WINDOW_MS, newOrderRef } from '../domain/order-identity.js';
import type { OrderActor } from './order-actor.js';
import { OrderChangeRecorder } from './order-change.recorder.js';
import { draftFromInput, type OrderInput } from './order-draft.js';
import { ORDERS_PORTS, type OrderRepository, RefTakenError } from './ports/orders.ports.js';

export interface CreateOrderInput extends OrderInput {
  readonly source: OrderSource;
  readonly externalRef?: string | undefined;
}

const REF_ATTEMPTS = 3;

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(actor: OrderActor, input: CreateOrderInput): Promise<OrderRecord> {
    await this.rejectReimport(actor.storeId, input);
    const now = this.recorder.now();
    const draft: OrderRecord = {
      ...draftFromInput(input, this.recorder.newId),
      id: this.recorder.newId(),
      storeId: actor.storeId,
      ref: newOrderRef(),
      status: 'new',
      source: input.source,
      externalRef: input.externalRef ?? null,
      assignedAgentId: null,
      carrier: null,
      trackingNumber: null,
      possibleDuplicateOfId: null,
      postponedUntil: null,
      statusChangedAt: now,
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
    const since = new Date(now.getTime() - DUPLICATE_WINDOW_MS);
    const order = { ...draft, possibleDuplicateOfId: await this.orders.findRecentDuplicate(draft, since) };
    return this.insertWithFreshRef(actor, order);
  }

  private async rejectReimport(storeId: string, input: CreateOrderInput): Promise<void> {
    if (!input.externalRef) return;
    const existing = await this.orders.findIdByExternalRef(storeId, input.source, input.externalRef);
    if (existing) throw new AlreadyImportedError(existing);
  }

  private async insertWithFreshRef(actor: OrderActor, order: OrderRecord): Promise<OrderRecord> {
    for (let attempt = 1; ; attempt += 1) {
      const candidate = attempt === 1 ? order : { ...order, ref: newOrderRef() };
      try {
        await this.orders.insert(candidate, this.recorder.effects(actor, this.created(candidate)));
        return candidate;
      } catch (error) {
        if (!(error instanceof RefTakenError) || attempt >= REF_ATTEMPTS) throw error;
      }
    }
  }

  private created(order: OrderRecord) {
    const data = {
      orderId: order.id,
      ref: order.ref,
      status: order.status,
      wilayaCode: order.customer.wilayaCode,
      codAmount: order.codAmount,
    };
    return {
      action: 'created',
      before: null,
      after: order,
      events: [{ type: ORDER_EVENTS.created, data }],
    };
  }
}
