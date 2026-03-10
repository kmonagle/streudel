import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pool for standard PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Standard pool size for Railway
  idleTimeoutMillis: 30000, // Release idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // 5 second connection timeout
});

export const db = drizzle({ client: pool, schema });
