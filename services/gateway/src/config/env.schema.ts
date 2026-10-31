import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
});

export type Env = z.infer<typeof EnvSchema>;
