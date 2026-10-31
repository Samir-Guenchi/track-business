import { type DynamicModule, Module, type ModuleMetadata } from '@nestjs/common';
import { HEALTH_OPTIONS, type HealthCheck } from './health-check.port.js';
import { HealthController } from './health.controller.js';

export interface HealthModuleOptions {
  readonly service: string;
  /** Modules that export what `inject` needs. */
  readonly imports?: ModuleMetadata['imports'];
  /** Factory so checks can use injected clients (Prisma, Redis). */
  readonly useFactory: (...deps: never[]) => readonly HealthCheck[];
  readonly inject?: readonly (string | symbol | (abstract new (...args: never[]) => unknown))[];
}

@Module({})
export class HealthModule {
  static forRoot(options: HealthModuleOptions): DynamicModule {
    return {
      module: HealthModule,
      imports: options.imports ?? [],
      controllers: [HealthController],
      providers: [
        {
          provide: HEALTH_OPTIONS,
          useFactory: (...deps: never[]) => ({
            service: options.service,
            checks: options.useFactory(...deps),
          }),
          inject: [...(options.inject ?? [])],
        },
      ],
    };
  }
}
