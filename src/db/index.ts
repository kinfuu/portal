import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const { Pool } = pg;

function createPool(connStr?: string) {
  if (connStr) {
    return new Pool({
      connectionString: connStr,
      ssl: connStr.includes('supabase') || process.env.SQL_SSL === 'true' || connStr.includes('sslmode=')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return new Pool({
    host: process.env.SQL_HOST || 'localhost',
    port: parseInt(process.env.SQL_PORT || '5432', 10),
    user: process.env.SQL_USER || 'ai_studio_app_user',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'cloud_sql_development_database',
    ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
  });
}

const initialConnStr = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

export let pool = createPool(initialConnStr);
export let db = drizzle(pool, { schema });

export function updatePool(newConnStr: string) {
  pool = createPool(newConnStr);
  db = drizzle(pool, { schema });
  return pool;
}


