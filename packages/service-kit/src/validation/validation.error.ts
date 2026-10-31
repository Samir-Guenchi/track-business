import type { z } from 'zod';
import { DomainError } from '../errors/domain-error.js';

export interface FieldIssue {
  readonly path: string;
  readonly message: string;
}

/** Input did not match its contract. `details` lists field paths, never the rejected values. */
export class ValidationError extends DomainError {
  readonly code = 'validation_failed';
  readonly kind = 'invalid';

  static fromZod(error: z.ZodError): ValidationError {
    const issues: FieldIssue[] = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return new ValidationError('Request validation failed', issues);
  }
}
