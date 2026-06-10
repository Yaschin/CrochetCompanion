import { sql } from "drizzle-orm";
import { db } from "./db";
import { PROFILES } from "../shared/profiles";

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

  // ── Family profiles (Phase 6) ──────────────────────────────────────────────
  // Owner columns default to 'larissa': all pre-profile data is hers, and old
  // clients that omit ?profile= keep working unchanged.
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS profiles (
      id text PRIMARY KEY,
      name text NOT NULL,
      color text NOT NULL,
      character text NOT NULL
    )`
  );
  for (const p of PROFILES) {
    await db.execute(
      sql`INSERT INTO profiles (id, name, color, character)
          VALUES (${p.id}, ${p.name}, ${p.color}, ${p.character})
          ON CONFLICT (id) DO NOTHING`
    );
  }
  await db.execute(
    sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS "ownerId" text NOT NULL DEFAULT 'larissa'`
  );
  await db.execute(
    sql`ALTER TABLE stash_items ADD COLUMN IF NOT EXISTS "ownerId" text NOT NULL DEFAULT 'larissa'`
  );
  await db.execute(
    sql`ALTER TABLE stash_notes ADD COLUMN IF NOT EXISTS "ownerId" text NOT NULL DEFAULT 'larissa'`
  );
  await db.execute(
    sql`ALTER TABLE community_patterns ADD COLUMN IF NOT EXISTS "creatorId" text`
  );

  // ── Device-local data made durable (Phase 5) ───────────────────────────────
  // Crochet-activity days drive the streak; the counter position rides on the
  // pattern row. Both still write-through localStorage for offline use.
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS activity_days (
      "ownerId" text NOT NULL,
      day text NOT NULL,
      PRIMARY KEY ("ownerId", day)
    )`
  );
  await db.execute(
    sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS "counterState" jsonb`
  );

  // The legacy project_events table predates shared/schema.ts and has no code
  // references anywhere — confirmed orphaned in the Jun-8 walkthrough.
  await db.execute(sql`DROP TABLE IF EXISTS project_events`);

  // ── Deduplicate patterns (idempotent) ──────────────────────────────────────
  // Guard against re-seeds that ran before the one-time flag was set:
  // keep only the earliest row for each (ownerId, title) pair.
  await db.execute(sql`
    DELETE FROM patterns
    WHERE id NOT IN (
      SELECT DISTINCT ON ("ownerId", title) id
      FROM patterns
      ORDER BY "ownerId", title, "createdAt" ASC
    )
  `);
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
