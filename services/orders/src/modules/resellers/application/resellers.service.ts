import { Inject, Injectable } from '@nestjs/common';
import type {
  ListResellerOrdersResponse,
  ListResellersResponse,
  Reseller,
  ResellerCatalogue,
  ResellerPayoutResponse,
  ResellerProduct,
} from '@trackecom/contracts';
import { newPortalCode } from '../domain/reseller-margin.js';
import { ResellerNotFoundError, ResellerProductNotFoundError } from '../domain/reseller.errors.js';
import {
  type ProductFields,
  type ResellerFields,
  type ResellerScope,
  RESELLERS_STORE,
  type ResellersStore,
} from './resellers.ports.js';

/** The supplier's side (#198): resellers, the catalogue they sell from, their orders and payouts. */
@Injectable()
export class ResellersService {
  constructor(@Inject(RESELLERS_STORE) private readonly store: ResellersStore) {}

  async list(storeId: string): Promise<ListResellersResponse> {
    return { items: await this.store.resellers(storeId) };
  }

  async create(storeId: string, fields: ResellerFields): Promise<Reseller> {
    const portalCode = newPortalCode();
    await this.store.createReseller(storeId, { ...fields, portalCode });
    const created = (await this.store.resellers(storeId)).find((r) => r.portalCode === portalCode);
    if (!created) throw new ResellerNotFoundError('The reseller was not saved');
    return created;
  }

  async update(scope: ResellerScope, fields: ResellerFields): Promise<Reseller> {
    if (!(await this.store.updateReseller(scope, fields))) {
      throw new ResellerNotFoundError('No such reseller');
    }
    const reseller = (await this.store.resellers(scope.storeId)).find(
      (item) => item.id === scope.resellerId,
    );
    if (!reseller) throw new ResellerNotFoundError('No such reseller');
    return reseller;
  }

  async catalogue(storeId: string): Promise<ResellerCatalogue> {
    return { items: await this.store.catalogue(storeId) };
  }

  createProduct(storeId: string, fields: ProductFields): Promise<ResellerProduct> {
    return this.store.createProduct(storeId, fields);
  }

  async updateProduct(
    scope: { storeId: string; productId: string },
    fields: ProductFields,
  ): Promise<ResellerProduct> {
    const product = await this.store.updateProduct(scope, fields);
    if (!product) throw new ResellerProductNotFoundError('No such product');
    return product;
  }

  async orders(scope: ResellerScope): Promise<ListResellerOrdersResponse> {
    return { items: await this.store.orders(scope) };
  }

  payout(scope: ResellerScope): Promise<ResellerPayoutResponse> {
    return this.store.payout(scope);
  }
}
