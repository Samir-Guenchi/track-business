import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { CONNECTIONS_RUNTIME, ConnectionsService } from './application/connections.service.js';
import { CONNECTION_REPOSITORY } from './application/ports/connection.repository.js';
import { connectorProviders } from './infrastructure/connectors.providers.js';
import { PrismaConnectionRepository } from './infrastructure/prisma-connection.repository.js';
import { ConnectionsController } from './interface/connections.controller.js';

/** Shop platforms and each store's encrypted shop connections (#47, ADR-0003). */
@Module({
  controllers: [ConnectionsController],
  providers: [
    ...connectorProviders,
    ConnectionsService,
    { provide: CONNECTION_REPOSITORY, useClass: PrismaConnectionRepository },
    { provide: CONNECTIONS_RUNTIME, useValue: { now: () => new Date(), newId: randomUUID } },
  ],
  exports: [ConnectionsService, CONNECTION_REPOSITORY],
})
export class ConnectionsModule {}
