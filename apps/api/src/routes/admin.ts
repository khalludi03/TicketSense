import { Hono } from 'hono';
import { count, eq, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { aiSuggestions } from '../db/schema.js';
import type { UserPayload } from '../lib/auth.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminApp = new Hono<{ Variables: { user: UserPayload } }>();

adminApp.get('/ai-acceptance-rate', requireAuth, requireRole('admin'), async (c) => {
  const [totalResult] = await db
    .select({ count: count() })
    .from(aiSuggestions)
    .where(isNotNull(aiSuggestions.wasAccepted));

  const [acceptedResult] = await db
    .select({ count: count() })
    .from(aiSuggestions)
    .where(eq(aiSuggestions.wasAccepted, true));

  const total = Number(totalResult.count);
  const accepted = Number(acceptedResult.count);
  const rate = total > 0 ? accepted / total : 0;

  return c.json({ rate, total, accepted });
});

export default adminApp;
