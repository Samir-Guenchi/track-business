import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  type ConnectShopRequest,
  ConnectShopRequestSchema,
  type ConnectorsResponse,
  type Integration,
  type IntegrationsResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { ConnectionsService } from '../application/connections.service.js';
import { toConnectorInfo, toIntegration } from './connection.mapper.js';

export const ConnectionIdPipe = new ZodValidationPipe(z.uuid());

/** Which shop platforms exist and which shops the store in `x-store-id` connected (#47). */
@Controller('integrations')
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get('connectors')
  @RequirePermission('store.read')
  connectors(): ConnectorsResponse {
    return { items: this.connections.connectors().map(toConnectorInfo) };
  }

  @Get()
  @RequirePermission('store.read')
  async list(@CurrentStore() store: StoreContext): Promise<IntegrationsResponse> {
    return { items: (await this.connections.list(store.storeId)).map(toIntegration) };
  }

  @Post()
  @RequirePermission('store.update')
  async connect(
    @Body(new ZodValidationPipe(ConnectShopRequestSchema)) body: ConnectShopRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<Integration> {
    return toIntegration(await this.connections.connect(store.storeId, body));
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.update')
  async disconnect(
    @Param('id', ConnectionIdPipe) id: string,
    @CurrentStore() store: StoreContext,
  ): Promise<void> {
    await this.connections.disconnect(store.storeId, id);
  }
}
