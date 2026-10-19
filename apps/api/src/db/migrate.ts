import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
