import type { ZodSchema } from 'zod';
import { AppError } from './errors.js';

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input', result.error.issues);
  }
  return result.data;
}
