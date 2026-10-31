/** One dependency a service needs to serve traffic (database, Redis, ...). */
export interface HealthCheck {
  readonly name: string;
  /** Resolves true when reachable. Must not throw and should time out quickly. */
  isHealthy(): Promise<boolean>;
}

export const HEALTH_OPTIONS = Symbol('HEALTH_OPTIONS');

export interface HealthOptions {
  readonly service: string;
  readonly checks: readonly HealthCheck[];
}
