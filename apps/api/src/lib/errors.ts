import type { Context } from 'hono';

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function httpError(status: number, code: string, message: string, details?: unknown): AppError {
  return new AppError(status, code, message, details);
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status as any,
    );
  }

  console.error('[unhandled error]', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    500,
  );
}
