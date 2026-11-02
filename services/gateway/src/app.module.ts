import { type DynamicModule, Module } from '@nestjs/common';
import { HealthModule, loggingModule } from '@trackecom/service-kit';
import type { Env } from './config/env.schema.js';

export const SERVICE_NAME = 'gateway';

/** Public entry point. Forwarding to the services is registered in `create-gateway-app.ts`. */
@Module({})
export class AppModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppModule,
      imports: [
        loggingModule({ service: SERVICE_NAME, level: env.LOG_LEVEL }),
        // Downstream readiness (identity, Redis) is added when the gateway starts proxying.
        HealthModule.forRoot({ service: SERVICE_NAME, useFactory: () => [] }),
      ],
    };
  }
}
