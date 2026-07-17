/**
 * Database migration script
 * Usage: npx tsx scripts/migrate.ts
 */
import { initDb } from '../src/lib/db';

async function main() {
  console.log('Running database migrations...');
  await initDb();
  console.log('Migrations complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
