import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { postgresAdapterOptions } from '@trackecom/service-kit';
import { type Env, ENV } from '../../config/env.schema.js';
import { PrismaClient } from '../../generated/prisma/client.js';

/** The payments database client. Only payments has credentials to this database. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    const options = postgresAdapterOptions(env.DATABASE_URL);
    // Raw SQL (the confirmation queue) resolves table names through search_path, so it must
    // point at the same schema the models use.
    const pool = {
      connectionString: env.DATABASE_URL,
      ...(options.schema ? { options: `-c search_path="${options.schema}"` } : {}),
    };
    super({ adapter: new PrismaPg(pool, options) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
