import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNodePg, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Production uses Neon's WebSocket driver (Replit-provisioned). A plain
// localhost Postgres (local dev / full-stack e2e in CI sandboxes) speaks
// ordinary TCP, so use node-postgres there — same drizzle API either way.
const isLocalPg = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL);

let db: NodePgDatabase<typeof schema>;
let pool: pg.Pool | NeonPool;

if (isLocalPg) {
  const localPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  pool = localPool;
  db = drizzleNodePg(localPool, { schema });
} else {
  neonConfig.webSocketConstructor = ws;
  const neonPool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  pool = neonPool;
  db = drizzleNeon(neonPool, { schema }) as unknown as NodePgDatabase<typeof schema>;
}

export { db, pool };
