import { sql } from "drizzle-orm";
import { db } from "./db";

// Idempotent boot-time schema/data fixes. This project has no migration files
// (schema changes go out via `drizzle-kit push`), so one-off DDL/data heals
// that must reach the live DB without manual SQL live here.
export async function ensureSchema(): Promise<void> {
  // Tiny key-value table for one-time flags (e.g. "starter content seeded").
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY, value text NOT NULL)`
  );

  // Heal rows written with the invalid "project" status by the Jun-8 seed bug —
  // they carried a startedAt date but were invisible in the Projects screen.
  await db.execute(
    sql`UPDATE patterns SET status = 'active' WHERE status = 'project'`
  );

  // Per-pattern user notes (moved from device-local storage to the DB).
  await db.execute(
    sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS "userNotes" text`
  );
}

export async function getMeta(key: string): Promise<string | null> {
  const result = await db.execute(
    sql`SELECT value FROM app_meta WHERE key = ${key}`
  );
  const row = result.rows?.[0] as { value?: string } | undefined;
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.execute(
    sql`INSERT INTO app_meta (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );
}
