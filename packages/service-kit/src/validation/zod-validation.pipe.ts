import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ValidationError } from './validation.error.js';

/**
 * Validates one request part against a contract schema: `@Body(new ZodValidationPipe(Schema))`.
 * Contracts are strict, so unknown fields are rejected here.
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) throw ValidationError.fromZod(result.error);
    return result.data;
  }
}
