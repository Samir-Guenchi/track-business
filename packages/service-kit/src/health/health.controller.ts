import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { HealthStatus } from '@trackecom/contracts';
import { HEALTH_OPTIONS, type HealthOptions } from './health-check.port.js';

/** `/health/live` = process is up. `/health/ready` = every dependency answers (503 otherwise). */
@Controller('health')
export class HealthController {
  constructor(@Inject(HEALTH_OPTIONS) private readonly options: HealthOptions) {}

  @Get('live')
  live(): HealthStatus {
    return { status: 'ok', service: this.options.service, checks: {} };
  }

  @Get('ready')
  async ready(): Promise<HealthStatus> {
    const results = await Promise.all(
      this.options.checks.map(async (check) => [check.name, await check.isHealthy()] as const),
    );
    const checks = Object.fromEntries(
      results.map(([name, ok]) => [name, ok ? 'ok' : 'down'] as const),
    );
    const isReady = results.every(([, ok]) => ok);
    const status: HealthStatus = {
      status: isReady ? 'ok' : 'down',
      service: this.options.service,
      checks,
    };
    if (!isReady) throw new ServiceUnavailableException(status);
    return status;
  }
}
