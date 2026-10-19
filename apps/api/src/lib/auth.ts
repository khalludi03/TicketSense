import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';

export type UserPayload = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'agent' | 'admin';
};

export const SESSION_COOKIE = 'ts_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'bcrypt' });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const [session] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning({ id: sessions.id });
  return session.id;
}

export async function getSessionUser(sessionId: string): Promise<UserPayload | null> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, sql`now()`),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
