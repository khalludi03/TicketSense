import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { signInSchema, signUpSchema } from '@ticketsense/shared';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import {
  createSession,
  deleteSession,
  hashPassword,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
  type UserPayload,
} from '../lib/auth.js';
import { AppError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const auth = new Hono<{ Variables: { user: UserPayload } }>();

auth.post('/signup', async (c) => {
  const body = validate(signUpSchema, await c.req.json());

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);
  if (existing.length > 0) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(body.password);
  const [user] = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      passwordHash,
      role: 'customer',
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  const sessionId = await createSession(user.id);
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return c.json({ user }, 201);
});

auth.post('/signin', rateLimit(10, 60_000), async (c) => {
  const body = validate(signInSchema, await c.req.json());

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const sessionId = await createSession(user.id);
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const { passwordHash: _, ...publicUser } = user;
  return c.json({ user: publicUser });
});

auth.post('/signout', requireAuth, async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    await deleteSession(sessionId);
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

auth.get('/me', requireAuth, async (c) => {
  return c.json({ user: c.get('user') });
});

export default auth;
