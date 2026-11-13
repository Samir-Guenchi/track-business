import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  type AddLiveComments,
  AddLiveCommentsSchema,
  type AddLiveCommentsResponse,
  type CreateLiveSession,
  CreateLiveSessionSchema,
  type LinkLiveOrder,
  LinkLiveOrderSchema,
  type ListLiveSessionsResponse,
  type LiveSession,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { LiveSellingService } from '../application/live-selling.service.js';

const uuid = new ZodValidationPipe(z.uuid());
const ReservationParamsSchema = z.object({ id: z.uuid(), reservationId: z.uuid() });
type ReservationParams = z.infer<typeof ReservationParamsSchema>;

/** Live selling (#199): products shown with codes, viewers' comments turned into reservations. */
@Controller('live-sessions')
export class LiveSellingController {
  constructor(private readonly live: LiveSellingService) {}

  @Post()
  @RequirePermission('orders.write')
  create(
    @Body(new ZodValidationPipe(CreateLiveSessionSchema)) body: CreateLiveSession,
    @CurrentStore() store: StoreContext,
  ): Promise<LiveSession> {
    return this.live.create(store.storeId, body);
  }

  @Get()
  @RequirePermission('orders.read')
  list(@CurrentStore() store: StoreContext): Promise<ListLiveSessionsResponse> {
    return this.live.list(store.storeId);
  }

  @Get(':id')
  @RequirePermission('orders.read')
  get(@Param('id', uuid) id: string, @CurrentStore() store: StoreContext): Promise<LiveSession> {
    return this.live.get({ storeId: store.storeId, id });
  }

  /** POST so viewers' phone numbers stay out of URLs and access logs. */
  @Post(':id/comments')
  @HttpCode(200)
  @RequirePermission('orders.write')
  addComments(
    @Param('id', uuid) id: string,
    @Body(new ZodValidationPipe(AddLiveCommentsSchema)) body: AddLiveComments,
    @CurrentStore() store: StoreContext,
  ): Promise<AddLiveCommentsResponse> {
    return this.live.addComments({ storeId: store.storeId, id }, body.text);
  }

  @Patch(':id/reservations/:reservationId')
  @RequirePermission('orders.write')
  linkOrder(
    @Param(new ZodValidationPipe(ReservationParamsSchema)) params: ReservationParams,
    @Body(new ZodValidationPipe(LinkLiveOrderSchema)) body: LinkLiveOrder,
    @CurrentStore() store: StoreContext,
  ): Promise<LiveSession> {
    const ref = { storeId: store.storeId, id: params.id };
    return this.live.linkOrder(ref, params.reservationId, body.orderId);
  }
}
