import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4002),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
