import { db } from './index.js';
import * as schema from './schema.js';

const DEMO_PASSWORD = 'password123';

async function seed() {
  const categories = await db
    .insert(schema.categories)
    .values([
      { name: 'Billing', description: 'Payments, invoices, refunds' },
      { name: 'Technical', description: 'Bugs, errors, performance' },
      { name: 'Account', description: 'Login, profile, access' },
      { name: 'General', description: 'Other inquiries' },
    ])
    .onConflictDoNothing({ target: schema.categories.name })
    .returning();

  const users = await db
    .insert(schema.users)
    .values([
      {
        name: 'Jashim',
        email: 'jashim@example.com',
        passwordHash: await Bun.password.hash(DEMO_PASSWORD, { algorithm: 'bcrypt' }),
        role: 'customer',
        isActive: true,
      },
      {
        name: 'Nusrat',
        email: 'nusrat@example.com',
        passwordHash: await Bun.password.hash(DEMO_PASSWORD, { algorithm: 'bcrypt' }),
        role: 'customer',
        isActive: true,
      },
      {
        name: 'Shirin',
        email: 'shirin@example.com',
        passwordHash: await Bun.password.hash(DEMO_PASSWORD, { algorithm: 'bcrypt' }),
        role: 'customer',
        isActive: true,
      },
      {
        name: 'Bullet',
        email: 'bullet@example.com',
        passwordHash: await Bun.password.hash(DEMO_PASSWORD, { algorithm: 'bcrypt' }),
        role: 'agent',
        isActive: true,
      },
      {
        name: 'Rafiq',
        email: 'rafiq@example.com',
        passwordHash: await Bun.password.hash(DEMO_PASSWORD, { algorithm: 'bcrypt' }),
        role: 'admin',
        isActive: true,
      },
    ])
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  console.log(`Seeded ${categories.length} categories and ${users.length} users`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
