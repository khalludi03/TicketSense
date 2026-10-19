import { createMiddleware } from 'hono/factory';
import { AppError } from '../lib/errors.js';

const allowedOrigins = new Set(
  process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [],
);

export const csrf = createMiddleware(async (c, next) => {
  // Only protect state-changing requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    return next();
  }

  const origin = c.req.header('origin');
  // Non-browser clients (curl, server-to-server) don't send Origin
  if (!origin) {
    return next();
  }

  if (!allowedOrigins.has(origin)) {
    throw new AppError(403, 'FORBIDDEN', 'Invalid origin');
  }

  await next();
});
