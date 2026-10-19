import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['customer', 'agent', 'admin']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const statusEnum = pgEnum('status', ['open', 'in_progress', 'resolved', 'closed']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('customer'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
});

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    assignedAgentId: uuid('assigned_agent_id').references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    priority: priorityEnum('priority').notNull(),
    status: statusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => ({
    customerIdx: index('tickets_customer_id_idx').on(table.customerId),
    statusIdx: index('tickets_status_idx').on(table.status),
    agentIdx: index('tickets_assigned_agent_id_idx').on(table.assignedAgentId),
  }),
);

export const ticketComments = pgTable('ticket_comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiSuggestions = pgTable('ai_suggestions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' })
    .unique(),
  suggestedCategoryId: integer('suggested_category_id')
    .notNull()
    .references(() => categories.id),
  suggestedPriority: priorityEnum('suggested_priority').notNull(),
  confidence: real('confidence').notNull(),
  wasAccepted: boolean('was_accepted'),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => ({
    userExpiresIdx: index('sessions_user_id_expires_at_idx').on(table.userId, table.expiresAt),
  }),
);
