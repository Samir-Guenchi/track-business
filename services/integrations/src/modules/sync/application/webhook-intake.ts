import { Inject, Injectable } from '@nestjs/common';
import { ConnectorError, type WebhookRequest } from '@trackecom/connectors';
import { ConnectionsService } from '../../connections/application/connections.service.js';
import {
  CONNECTION_REPOSITORY,
  type ConnectionRepository,
} from '../../connections/application/ports/connection.repository.js';
import { BadWebhookSignatureError, UnknownShopError } from '../domain/sync.errors.js';
import { OrderImporter } from './order-importer.js';

/**
 * Orders a shop pushes to `POST /webhooks/shops/:connectionId`. The connector checks the
 * signature over the exact bytes received before anything is read; then the orders take the
 * same path as polling, so a webhook and the next poll never import one order twice.
 */
@Injectable()
export class WebhookIntake {
  constructor(
    @Inject(CONNECTION_REPOSITORY) private readonly repository: ConnectionRepository,
    private readonly connections: ConnectionsService,
    private readonly importer: OrderImporter,
  ) {}

  async receive(connectionId: string, request: WebhookRequest): Promise<number> {
    const connection = await this.repository.findForWebhook(connectionId);
    if (!connection) throw new UnknownShopError();
    const { connector, ctx } = await this.connections.open(connection);
    const orders = await connector.parseWebhook(ctx, request).catch((error: unknown) => {
      if (error instanceof ConnectorError && error.kind === 'auth') {
        throw new BadWebhookSignatureError();
      }
      throw error;
    });
    return this.importer.import(connection, orders);
  }
}
