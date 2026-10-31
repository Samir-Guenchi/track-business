import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@trackecom/contracts';

export const SERVICE_NAME = 'gateway';

/** Liveness and readiness probes for the orchestrator and load balancer. */
@Controller('health')
export class HealthController {
  @Get('live')
  live(): HealthStatus {
    return { status: 'ok', service: SERVICE_NAME, checks: {} };
  }

  @Get('ready')
  ready(): HealthStatus {
    // Downstream checks (identity, Redis) are added with #12.
    return { status: 'ok', service: SERVICE_NAME, checks: {} };
  }
}
