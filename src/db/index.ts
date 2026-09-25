import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.SQL_HOST || 'localhost',
  port: parseInt(process.env.SQL_PORT || '5432', 10),
  user: process.env.SQL_USER || 'ai_studio_app_user',
  password: process.env.SQL_PASSWORD || '',
  database: process.env.SQL_DB_NAME || 'cloud_sql_development_database',
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
