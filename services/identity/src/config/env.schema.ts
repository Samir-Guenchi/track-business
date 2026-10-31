import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** ES256 private key (PKCS#8 PEM, `\n` escaped). Required in production; dev/test use a throwaway key. */
  JWT_PRIVATE_KEY: z.string().min(1).optional(),
  JWT_KEY_ID: z.string().min(1).default('identity-1'),
  /** Base URL of the web app, used in email links. */
  APP_URL: z.url().default('http://localhost:3000'),
  SMTP_URL: z.url({ protocol: /^smtps?$/ }).default('smtp://localhost:1025'),
  MAIL_FROM: z.string().min(3).default('TrackEcom <no-reply@trackecom.local>'),
}).refine((env) => env.NODE_ENV !== 'production' || env.JWT_PRIVATE_KEY !== undefined, {
  message: 'JWT_PRIVATE_KEY is required in production',
  path: ['JWT_PRIVATE_KEY'],
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
