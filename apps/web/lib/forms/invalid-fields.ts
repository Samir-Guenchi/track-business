import type { z } from 'zod';

/** Names of the top-level fields a zod parse rejected; the form shows one message per field. */
export function invalidFields(error: z.ZodError): ReadonlySet<string> {
  return new Set(
    error.issues
      .map((issue) => issue.path[0])
      .filter((key): key is string => typeof key === 'string'),
  );
}
