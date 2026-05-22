import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../util/env.js';
import * as schema from '../infrastructure/repositories/schema.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  return drizzle(getPool(), { schema });
}

export type Database = ReturnType<typeof getDatabase>;

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
