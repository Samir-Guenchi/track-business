import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../config/env.schema.js';

/**
 * Shared Redis connection (rate limits, caches, event bus). The service still starts when Redis
 * is down; `/health/ready` reports it so the load balancer keeps traffic away.
 */
@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(ENV) env: Env) {
    super(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
    this.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
  }

  async onModuleInit(): Promise<void> {
    await this.connect().catch(() => undefined);
  }

  onModuleDestroy(): void {
    this.disconnect();
  }
}
