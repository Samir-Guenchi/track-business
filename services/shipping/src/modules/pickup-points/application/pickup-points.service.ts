import { Inject, Injectable } from '@nestjs/common';
import type { ListPickupPointsResponse, PickupPoint } from '@trackecom/contracts';
import { PickupPointNotFoundError } from '../domain/pickup.errors.js';
import {
  PICKUP_POINTS_STORE,
  type PickupPointsStore,
  type PointFields,
  type PointScope,
} from './pickup-points.ports.js';

/** The store's partner shops (#202): register, edit, list with what each holds. */
@Injectable()
export class PickupPointsService {
  constructor(@Inject(PICKUP_POINTS_STORE) private readonly store: PickupPointsStore) {}

  async list(storeId: string): Promise<ListPickupPointsResponse> {
    return { items: await this.store.points(storeId) };
  }

  async create(storeId: string, fields: PointFields): Promise<PickupPoint> {
    const pointId = await this.store.createPoint(storeId, fields);
    return this.get({ storeId, pointId });
  }

  async update(scope: PointScope, fields: PointFields): Promise<PickupPoint> {
    if (!(await this.store.updatePoint(scope, fields))) {
      throw new PickupPointNotFoundError('No such pickup point');
    }
    return this.get(scope);
  }

  async get(scope: PointScope): Promise<PickupPoint> {
    const [point] = await this.store.points(scope.storeId, scope.pointId);
    if (!point) throw new PickupPointNotFoundError('No such pickup point');
    return point;
  }
}
