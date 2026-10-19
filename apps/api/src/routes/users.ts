import { Hono } from 'hono';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { updateUserSchema } from '@ticketsense/shared';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import type { UserPayload } from '../lib/auth.js';
import { revokeAllUserSessions } from '../lib/auth.js';
import { AppError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const usersApp = new Hono<{ Variables: { user: UserPayload } }>();

usersApp.get('/', requireAuth, requireRole('admin'), async (c) => {
  const all = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.name);

  return c.json({ users: all });
});

usersApp.patch('/:id', requireAuth, requireRole('admin'), async (c) => {
  const adminUser = c.get('user');
  const id = c.req.param('id');
  const body = validate(updateUserSchema, await c.req.json());

  if (id === adminUser.id) {
    throw new AppError(403, 'FORBIDDEN', 'You cannot modify your own account');
  }

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (body.isActive === false && target.role === 'admin') {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    if (Number(result.count) <= 1) {
      throw new AppError(409, 'LAST_ADMIN', 'Cannot deactivate the last active admin');
    }
  }

  const [updated] = await db.update(users).set(body).where(eq(users.id, id)).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  });

  // If role or activation changed, revoke existing sessions so the change takes effect immediately
  if (body.role !== undefined || body.isActive !== undefined) {
    await revokeAllUserSessions(id);
  }

  return c.json({ user: updated });
});

export default usersApp;
