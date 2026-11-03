import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  freeShippingApplies,
  RESELLER_DAILY_ORDERS,
  type ResellerOrderCreated,
  type ResellerOrderRequestSchema,
  type ResellerPortal,
  type StorePricesResponse,
} from '@trackecom/contracts';
import type { z } from 'zod';
import { CreateOrderUseCase } from '../../orders/application/create-order.use-case.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { priceItems } from '../domain/reseller-margin.js';
import {
  ResellerDailyLimitError,
  ResellerDeliveryError,
  ResellerNotFoundError,
  ResellerPausedError,
} from '../domain/reseller.errors.js';
import {
  type PortalReseller,
  RESELLER_PRICES,
  type ResellerPriceSource,
  RESELLERS_STORE,
  type ResellersStore,
} from './resellers.ports.js';

type OrderRequest = z.output<typeof ResellerOrderRequestSchema>;
const DAY_MS = 86_400_000;
/** Orders whose delivery price could not be read: the agent confirms it on the call. */
const FEE_CHECK_TAG = 'fee-check';

/** The reseller's portal (#198): the catalogue, their own orders and margins, and new orders. */
@Injectable()
export class ResellerPortalService {
  constructor(
    @Inject(RESELLERS_STORE) private readonly store: ResellersStore,
    @Inject(RESELLER_PRICES) private readonly prices: ResellerPriceSource,
    private readonly create: CreateOrderUseCase,
  ) {}

  async portal(portalCode: string): Promise<ResellerPortal> {
    const reseller = await this.reseller(portalCode);
    const [catalogue, orders, stats] = await Promise.all([
      this.store.catalogue(reseller.storeId),
      this.store.orders(reseller),
      this.store.stats(reseller),
    ]);
    const offered = catalogue.filter((product) => product.active);
    return { name: reseller.name, active: reseller.active, catalogue: offered, stats, orders };
  }

  async order(portalCode: string, body: OrderRequest): Promise<ResellerOrderCreated> {
    const reseller = await this.reseller(portalCode);
    if (!reseller.active) throw new ResellerPausedError('The supplier paused this reseller');
    const today = await this.store.ordersSince(reseller, new Date(Date.now() - DAY_MS));
    if (today >= RESELLER_DAILY_ORDERS) throw new ResellerDailyLimitError('Daily limit reached');
    const priced = priceItems(await this.store.catalogue(reseller.storeId), body.items);
    const shippingFee = shippingFeeOf(await this.prices.pricesFor(reseller.storeId), {
      ...body,
      subtotal: priced.subtotal,
    });
    const order = await this.create.execute(actorFor(reseller), {
      customer: body.customer,
      items: priced.items,
      deliveryType: body.deliveryType,
      stopDeskId: body.stopDeskId,
      shippingFee: shippingFee ?? 0,
      discount: 0,
      notes: [`Revendeur: ${reseller.name}`, body.notes].filter(Boolean).join(' · '),
      tags: shippingFee === null ? ['reseller', FEE_CHECK_TAG] : ['reseller'],
      source: 'reseller',
    });
    await this.store.link(reseller, { orderId: order.id, margin: priced.margin });
    return { ref: order.ref, codAmount: order.codAmount, margin: priced.margin, shippingFee };
  }

  private async reseller(portalCode: string): Promise<PortalReseller> {
    const reseller = await this.store.byPortalCode(portalCode);
    if (!reseller) throw new ResellerNotFoundError('No reseller for this link');
    return reseller;
  }
}

function shippingFeeOf(
  prices: StorePricesResponse | null,
  order: OrderRequest & { subtotal: number },
): number | null {
  if (!prices) return null;
  const { wilayaCode } = order.customer;
  const row = prices.items.find(
    (item) => item.wilayaCode === wilayaCode && item.deliveryType === order.deliveryType,
  );
  if (row?.price === null || row?.price === undefined) {
    throw new ResellerDeliveryError('The supplier does not deliver there this way');
  }
  return freeShippingApplies(prices, { wilayaCode, subtotal: order.subtotal }) ? 0 : row.price;
}

const actorFor = (reseller: PortalReseller): OrderActor => ({
  storeId: reseller.storeId,
  userId: 'reseller',
  role: 'owner',
  ip: '',
  correlationId: randomUUID(),
  actorType: 'system',
});
