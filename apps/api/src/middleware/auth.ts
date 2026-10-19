import { createMiddleware } from 'hono/factory';
import { getCookie, deleteCookie } from 'hono/cookie';
import { getSessionUser, SESSION_COOKIE } from '../lib/auth.js';
import { AppError } from '../lib/errors.js';

export const requireAuth = createMiddleware(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const user = await getSessionUser(sessionId);
  if (!user) {
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    throw new AppError(401, 'UNAUTHORIZED', 'Session expired or invalid');
  }

  c.set('user', user);
  await next();
});

export const requireRole = (...roles: string[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    await next();
  });
