import { type DynamicModule, Global, Module } from '@nestjs/common';
import { type Env, ENV } from '../config/env.schema.js';
import { OutboxRelayWorker } from './outbox/outbox-relay.worker.js';
import { PrismaOutboxStore } from './outbox/prisma-outbox.store.js';
import { PrismaService } from './prisma/prisma.service.js';
import { RedisService } from './redis/redis.service.js';

/** Database, Redis, the outbox relay and validated config, available to every feature module of shipping. */
@Global()
@Module({})
export class InfrastructureModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: InfrastructureModule,
      providers: [
        { provide: ENV, useValue: env },
        PrismaService,
        RedisService,
        PrismaOutboxStore,
        OutboxRelayWorker,
      ],
      exports: [ENV, PrismaService, RedisService],
    };
  }
}
