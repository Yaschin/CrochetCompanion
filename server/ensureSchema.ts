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

  // The base tables (patterns, stash_items, …) are owned by drizzle-kit
  // (`npm run db:push`). On a brand-new database they don't exist yet — skip
  // the heals that depend on them instead of crashing the whole boot chain.
  const base = await db.execute(sql`SELECT to_regclass('patterns') AS t`);
  if (!(base.rows?.[0] as { t?: string | null } | undefined)?.t) {
    console.error(
      "ensureSchema: base tables missing — run `npm run db:push` against this database, then restart."
    );
    return;
  }

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
  // Actual crocheting time + the as-built finished record now persist on the
  // pattern row (were device-local), so they survive restore and reach backups.
  await db.execute(
    sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS "workSessions" jsonb`
  );
  await db.execute(
    sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS "finishedRecord" jsonb`
  );

  // The legacy project_events table predates shared/schema.ts and has no code
  // references anywhere — confirmed orphaned in the Jun-8 walkthrough.
  await db.execute(sql`DROP TABLE IF EXISTS project_events`);

  // ── Family make-alongs (Phase 8) ───────────────────────────────────────────
  // One shared challenge per community pattern; each member crochets their own
  // library copy, so progress comes from the data that already exists.
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS makealongs (
      id text PRIMARY KEY,
      title text NOT NULL,
      "communityId" text NOT NULL,
      "createdAt" text NOT NULL
    )`
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS makealong_members (
      "makealongId" text NOT NULL,
      "profileId" text NOT NULL,
      "patternId" text NOT NULL,
      PRIMARY KEY ("makealongId", "profileId")
    )`
  );
  // Enforce one make-along per community pattern so concurrent "start"
  // taps collapse to a single board instead of racing into duplicates.
  // Guarded: a pre-existing duplicate would block the unique index, and we
  // must not abort the rest of ensureSchema — so dedupe first (keep the
  // lowest id per community), then create the index, both best-effort.
  try {
    await db.execute(
      sql`DELETE FROM makealongs a USING makealongs b
          WHERE a."communityId" = b."communityId" AND a.id > b.id`
    );
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS makealongs_community_uniq ON makealongs ("communityId")`
    );
  } catch (e) {
    console.warn("[ensureSchema] could not enforce make-along uniqueness:", e);
  }

  // ── Deduplicate patterns (ONE-TIME, marker-guarded) ────────────────────────
  // This exists to undo re-seeds that ran before the one-time seed flags
  // existed: it keeps only the earliest row per (ownerId, title) pair.
  //
  // It MUST NOT run on every boot. Doing so silently deletes *legitimate* user
  // data — any two patterns a person saves under the same title (and any
  // freshly-imported duplicates, since /api/import is additive) — on the next
  // restart. Guard it behind an app_meta marker so it cleans up the historical
  // double-seeds exactly once, then never touches user patterns again.
  if (!(await getMeta("patterns_deduped_v1"))) {
    await db.execute(sql`
      DELETE FROM patterns
      WHERE id NOT IN (
        SELECT DISTINCT ON ("ownerId", title) id
        FROM patterns
        ORDER BY "ownerId", title, "createdAt" ASC
      )
    `);
    await setMeta("patterns_deduped_v1", new Date().toISOString());
  }

  // Web-push subscriptions for reminder notifications (one row per device).
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint text PRIMARY KEY,
      "profileId" text NOT NULL,
      p256dh text NOT NULL,
      auth text NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )`
  );

  // Original imported PDFs kept alongside the parsed pattern (object-storage keys).
  await db.execute(
    sql`ALTER TABLE patterns ADD COLUMN IF NOT EXISTS "sourceFiles" jsonb`
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
