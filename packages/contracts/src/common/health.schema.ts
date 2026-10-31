import { z } from 'zod';

export const HealthStatusSchema = z.strictObject({
  status: z.enum(['ok', 'degraded', 'down']),
  service: z.string().min(1),
  checks: z.record(z.string(), z.enum(['ok', 'down'])).default({}),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;
