import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  type DropParcel,
  DropParcelSchema,
  type HandoverResponse,
  type ListPickupParcelsResponse,
  type PickupParcelState,
  PickupParcelStateSchema,
  type PickupStatement,
  PickupStatementQuerySchema,
  type ReleaseParcel,
  ReleaseParcelSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { PickupParcelsService } from '../application/pickup-parcels.service.js';

const uuid = new ZodValidationPipe(z.uuid());
const ParcelParamsSchema = z.object({ id: z.uuid(), shipmentId: z.uuid() });
const StateQuerySchema = z.strictObject({ state: PickupParcelStateSchema.optional() });

/** Parcels at a partner shop (#202): drop, list, release with the customer's code, cash. */
@Controller('pickup-points/:id')
export class PickupParcelsController {
  constructor(private readonly parcels: PickupParcelsService) {}

  @Post('parcels')
  @RequirePermission('shipments.manage')
  drop(
    @Param('id', uuid) pointId: string,
    @Body(new ZodValidationPipe(DropParcelSchema)) body: DropParcel,
    @CurrentStore() store: StoreContext,
  ): Promise<ListPickupParcelsResponse> {
    return this.parcels.drop({ storeId: store.storeId, pointId }, body.shipmentId);
  }

  @Get('parcels')
  @RequirePermission('orders.read')
  list(
    @Param('id', uuid) pointId: string,
    @Query(new ZodValidationPipe(StateQuerySchema)) query: { state?: PickupParcelState },
    @CurrentStore() store: StoreContext,
  ): Promise<ListPickupParcelsResponse> {
    return this.parcels.parcels({ storeId: store.storeId, pointId }, query.state);
  }

  @Post('parcels/:shipmentId/release')
  @RequirePermission('shipments.manage')
  release(
    @Param(new ZodValidationPipe(ParcelParamsSchema)) params: z.infer<typeof ParcelParamsSchema>,
    @Body(new ZodValidationPipe(ReleaseParcelSchema)) body: ReleaseParcel,
    @CurrentStore() store: StoreContext,
  ): Promise<ListPickupParcelsResponse> {
    const scope = { storeId: store.storeId, pointId: params.id };
    return this.parcels.release(scope, params.shipmentId, body);
  }

  @Post('handover')
  @RequirePermission('money.manage')
  handover(
    @Param('id', uuid) pointId: string,
    @CurrentStore() store: StoreContext,
  ): Promise<HandoverResponse> {
    return this.parcels.handover({ storeId: store.storeId, pointId });
  }

  @Get('statement')
  @RequirePermission('money.read')
  statement(
    @Param('id', uuid) pointId: string,
    @Query(new ZodValidationPipe(PickupStatementQuerySchema)) query: { month: string },
    @CurrentStore() store: StoreContext,
  ): Promise<PickupStatement> {
    return this.parcels.statement({ storeId: store.storeId, pointId }, query.month);
  }
}
