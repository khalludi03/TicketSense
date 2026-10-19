import { Hono } from 'hono';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  addCommentSchema,
  aiSuggestionActionSchema,
  assignTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema,
} from '@ticketsense/shared';
import { classifyTicket } from '../ai/classify.js';
import { db } from '../db/index.js';
import {
  aiSuggestions,
  categories,
  ticketComments,
  tickets,
  users,
} from '../db/schema.js';
import type { UserPayload } from '../lib/auth.js';
import { AppError } from '../lib/errors.js';
import { isAutoClosable, statusTransition, type Status } from '../lib/status.js';
import { validate } from '../lib/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const customers = alias(users, 'customer');
const agents = alias(users, 'agent');

async function getTicketWithAccess(ticketId: string, user: UserPayload) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) throw new AppError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  if (user.role === 'customer' && ticket.customerId !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this ticket');
  }
  return ticket;
}

async function loadTicketDetail(ticketId: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return null;

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, ticket.categoryId))
    .limit(1);

  const [customer] = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.id, ticket.customerId))
    .limit(1);

  const [agent] = ticket.assignedAgentId
    ? await db
        .select({ id: agents.id, name: agents.name })
        .from(agents)
        .where(eq(agents.id, ticket.assignedAgentId))
        .limit(1)
    : [null];

  const comments = await db
    .select({
      id: ticketComments.id,
      body: ticketComments.body,
      createdAt: ticketComments.createdAt,
      author: { id: users.id, name: users.name, role: users.role },
    })
    .from(ticketComments)
    .innerJoin(users, eq(ticketComments.authorId, users.id))
    .where(eq(ticketComments.ticketId, ticketId))
    .orderBy(ticketComments.createdAt);

  const [aiSuggestion] = await db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.ticketId, ticketId))
    .limit(1);

  return { ticket, category, customer, agent, comments, aiSuggestion };
}

const ticketsApp = new Hono<{ Variables: { user: UserPayload } }>();

// List tickets
// GET /api/tickets
// GET /api/tickets?status=...&category=...&priority=...&q=...&sort=newest|priority
ticketsApp.get('/', requireAuth, async (c) => {
  const user = c.get('user');
  const { status, category, priority, q, sort = 'newest' } = c.req.query();

  const conditions = [];
  if (user.role === 'customer') {
    conditions.push(eq(tickets.customerId, user.id));
  }
  if (status) conditions.push(eq(tickets.status, status as Status));
  if (category) conditions.push(eq(tickets.categoryId, Number(category)));
  if (priority) conditions.push(eq(tickets.priority, priority as 'low' | 'medium' | 'high'));
  if (q) {
    conditions.push(or(ilike(tickets.title, `%${q}%`), ilike(tickets.description, `%${q}%`)));
  }

  const orderBy =
    sort === 'priority'
      ? sql`case ${tickets.priority} when 'high' then 1 when 'medium' then 2 when 'low' then 3 end`
      : desc(tickets.createdAt);

  const list = await db
    .select({ ticket: tickets, category: categories })
    .from(tickets)
    .leftJoin(categories, eq(tickets.categoryId, categories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy);

  return c.json({ tickets: list.map((row) => ({ ...row.ticket, category: row.category })) });
});

// Create ticket
// POST /api/tickets
ticketsApp.post('/', requireAuth, requireRole('customer'), async (c) => {
  const user = c.get('user');
  const body = validate(createTicketSchema, await c.req.json());

  let suggestedCategory = 'General';
  let suggestedPriority: 'low' | 'medium' | 'high' = 'medium';
  let confidence = 0;

  try {
    const suggestion = classifyTicket(`${body.title} ${body.description}`);
    suggestedCategory = suggestion.category;
    suggestedPriority = suggestion.priority as 'low' | 'medium' | 'high';
    confidence = suggestion.confidence;
  } catch (err) {
    console.error('Classifier failed, using fallback', err);
  }

  const [categoryRow] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, suggestedCategory))
    .limit(1);
  const categoryId = categoryRow?.id ?? 4;

  const [ticket] = await db
    .insert(tickets)
    .values({
      title: body.title,
      description: body.description,
      customerId: user.id,
      categoryId,
      priority: suggestedPriority,
    })
    .returning();

  await db.insert(aiSuggestions).values({
    ticketId: ticket.id,
    suggestedCategoryId: categoryId,
    suggestedPriority,
    confidence,
    wasAccepted: null,
  });

  return c.json({ ticket }, 201);
});

// Get ticket detail
// GET /api/tickets/:id
ticketsApp.get('/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const ticket = await getTicketWithAccess(id, user);
  if (ticket.status === 'resolved' && isAutoClosable(ticket.resolvedAt, new Date())) {
    await db.update(tickets).set({ status: 'closed' }).where(eq(tickets.id, id));
    ticket.status = 'closed';
  }

  const detail = await loadTicketDetail(id);
  return c.json(detail);
});

// Update status
// PATCH /api/tickets/:id/status
ticketsApp.patch('/:id/status', requireAuth, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = validate(updateTicketStatusSchema, await c.req.json());

  const ticket = await getTicketWithAccess(id, user);
  if (ticket.status === 'resolved' && isAutoClosable(ticket.resolvedAt, new Date())) {
    await db.update(tickets).set({ status: 'closed' }).where(eq(tickets.id, id));
    ticket.status = 'closed';
  }

  const transition = statusTransition(ticket.status, body.status, {
    role: user.role,
    resolvedAt: ticket.resolvedAt,
  });
  if (!transition.allowed) {
    throw new AppError(409, 'INVALID_TRANSITION', transition.reason ?? 'Invalid status transition');
  }

  const updates: Partial<typeof tickets.$inferInsert> = { status: body.status };
  if (body.status === 'resolved') {
    updates.resolvedAt = new Date();
    updates.resolutionNote = body.resolutionNote;
  }
  if (body.status === 'open') {
    updates.resolvedAt = null;
    updates.resolutionNote = null;
  }

  const [updated] = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning();
  return c.json({ ticket: updated });
});

// Assign ticket
// PATCH /api/tickets/:id/assign
ticketsApp.patch('/:id/assign', requireAuth, requireRole('agent', 'admin'), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = validate(assignTicketSchema, await c.req.json());

  const ticket = await getTicketWithAccess(id, user);
  if (ticket.status === 'closed') {
    throw new AppError(409, 'INVALID_STATE', 'Cannot assign a closed ticket');
  }

  let agentId = body.agentId;
  if (!agentId) {
    agentId = user.id;
  } else if (user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'Only an Admin can reassign to another agent');
  }

  const updates: Partial<typeof tickets.$inferInsert> = { assignedAgentId: agentId };
  if (ticket.status === 'open') {
    updates.status = 'in_progress';
  }

  const [updated] = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning();
  return c.json({ ticket: updated });
});

// Accept or override AI suggestion
// PATCH /api/tickets/:id/suggestion
ticketsApp.patch('/:id/suggestion', requireAuth, requireRole('agent', 'admin'), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = validate(aiSuggestionActionSchema, await c.req.json());

  const ticket = await getTicketWithAccess(id, user);

  if (body.accept) {
    await db.update(aiSuggestions).set({ wasAccepted: true }).where(eq(aiSuggestions.ticketId, id));
    return c.json({ ticket });
  }

  const [categoryRow] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, body.categoryId))
    .limit(1);
  if (!categoryRow) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }

  const [updated] = await db
    .update(tickets)
    .set({ categoryId: body.categoryId, priority: body.priority })
    .where(eq(tickets.id, id))
    .returning();

  await db.update(aiSuggestions).set({ wasAccepted: false }).where(eq(aiSuggestions.ticketId, id));

  return c.json({ ticket: updated });
});

// Add comment
// POST /api/tickets/:id/comments
ticketsApp.post('/:id/comments', requireAuth, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = validate(addCommentSchema, await c.req.json());

  const ticket = await getTicketWithAccess(id, user);
  if (ticket.status === 'closed') {
    throw new AppError(409, 'INVALID_STATE', 'Cannot comment on a closed ticket');
  }

  const [comment] = await db
    .insert(ticketComments)
    .values({
      ticketId: id,
      authorId: user.id,
      body: body.body,
    })
    .returning();

  return c.json({ comment }, 201);
});

export default ticketsApp;
