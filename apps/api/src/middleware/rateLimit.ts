import { createMiddleware } from 'hono/factory';
import { AppError } from '../lib/errors.js';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitEntry>();

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export function rateLimit(maxAttempts = 10, windowMs = 60_000) {
  return createMiddleware(async (c, next) => {
    const ip = getClientIp(c);
    const now = Date.now();

    const entry = attempts.get(ip);
    if (!entry || now > entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > maxAttempts) {
        throw new AppError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
      }
    }

    await next();
  });
}
