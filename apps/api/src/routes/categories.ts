import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { categorySchema } from '@ticketsense/shared';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import type { UserPayload } from '../lib/auth.js';
import { AppError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const categoriesApp = new Hono<{ Variables: { user: UserPayload } }>();

categoriesApp.get('/', requireAuth, async (c) => {
  const all = await db.select().from(categories).orderBy(categories.name);
  return c.json({ categories: all });
});

categoriesApp.post('/', requireAuth, requireRole('admin'), async (c) => {
  const body = validate(categorySchema, await c.req.json());

  try {
    const [category] = await db.insert(categories).values(body).returning();
    return c.json({ category }, 201);
  } catch (err: any) {
    if (err.message?.includes('unique constraint')) {
      throw new AppError(409, 'NAME_TAKEN', 'A category with that name already exists');
    }
    throw err;
  }
});

categoriesApp.patch('/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = Number(c.req.param('id'));
  const body = validate(categorySchema.partial(), await c.req.json());

  if (Object.keys(body).length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No fields provided');
  }

  const [updated] = await db.update(categories).set(body).where(eq(categories.id, id)).returning();
  if (!updated) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }

  return c.json({ category: updated });
});

export default categoriesApp;
