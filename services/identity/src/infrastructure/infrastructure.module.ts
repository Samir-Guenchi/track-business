import { type DynamicModule, Global, Module } from '@nestjs/common';
import { type Env, ENV } from '../config/env.schema.js';
import { PrismaService } from './prisma/prisma.service.js';
import { RedisService } from './redis/redis.service.js';

/** Database, Redis and validated config, available to every feature module of identity. */
@Global()
@Module({})
export class InfrastructureModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: InfrastructureModule,
      providers: [{ provide: ENV, useValue: env }, PrismaService, RedisService],
      exports: [ENV, PrismaService, RedisService],
    };
  }
}
