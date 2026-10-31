import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { postgresAdapterOptions } from '@trackecom/service-kit';
import { type Env, ENV } from '../../config/env.schema.js';
import { PrismaClient } from '../../generated/prisma/client.js';

/** The orders database client. Only orders has credentials to this database. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    const options = postgresAdapterOptions(env.DATABASE_URL);
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }, options) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
