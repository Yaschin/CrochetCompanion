# Phase 6 — Family Profiles (detailed plan)

**Date:** 2026-06-09 · **Status:** Approved, in build
**Decisions (Yash):** ① other profiles start empty ② avatar map approved (Larissa→Aloo/rose, Vumsh→Yala/plum, Akka→Ashi/sage, Mummy→Bee/honey) ③ picker shown after splash ④ build proceeds on the same branch; PR #23 merge can happen in parallel (schema heals are idempotent).

**Concept:** Netflix-style profiles, no passwords. Convenience separation for a household — explicitly NOT security. Anyone at the device can switch. Real auth remains out of scope.

---

## A. Schema & data (via `ensureSchema()` boot-heals + `shared/schema.ts`)

1. `profiles` table: `id` text PK (`larissa|vumsh|akka|mummy`), `name`, `color`, `character`. Seeded idempotently (`ON CONFLICT DO NOTHING`).
2. `patterns.ownerId` text NOT NULL DEFAULT `'larissa'` — one column scopes library, projects, favorites, trophy shelf.
3. `stashItems.ownerId`, `stashNotes.ownerId` — same default; stash notes become one row per profile.
4. `communityPatterns.creatorId` text NULL — family shares carry the sharer; the 40 curated seeds keep their fictional `creator` names with NULL `creatorId`.
5. Backfill = the DEFAULT itself: every existing row (live DB included) belongs to Larissa, which matches reality.

## B. Server scoping

- Profile resolved from `?profile=<id>` query param; helper defaults to `'larissa'` when absent (full back-compat for old clients / SW-cached requests).
- **Scoped:** `GET/POST /api/patterns` (list filter + create stamps owner), `GET/POST/PUT/DELETE /api/stash*`, `GET/PUT /api/stash-notes` (per-owner row), `GET /api/export` (active profile only, format v2), `POST /api/import` (assigns to active profile; v1 backups accepted → active profile).
- **Deliberately unscoped:** `GET/PUT/DELETE /api/patterns/:id` and all sub-resources (regenerate, photos, alignment, resize) — pattern IDs are UUIDs, household trust model, and this keeps deep links (`/patterns/:id`) working across profiles.
- `POST /api/community` stamps `creator` = profile display name + `creatorId` (replaces hardcoded `'Larissa'`).
- New `GET /api/profiles` for the picker.
- Starter-content seeding unchanged (one-time, already marker-guarded) — lands as Larissa's; new profiles start empty by decision ①.

## C. Client core

- `client/src/lib/profile.ts`: profile list types, `getActiveProfileId()` / `setActiveProfileId()` (localStorage `crochet-time:profile`), `withProfile(url)` appender.
- `queryClient.ts`: `apiRequest` + the default queryFn append `profile=` to every `/api/` URL — one central change, no per-screen edits; PWA cache keys become per-profile automatically (URL-keyed SW cache).
- **Picker** (`ProfilePickerScreen`, route `/who`): shown after the splash CTA when no stored profile; otherwise splash goes straight home. Header avatar (top-right, currently hardcoded "L") shows active profile colour/initial; tapping it opens the picker to switch. Switch = set localStorage → `queryClient.clear()` → navigate home.

## D. Personalization & device-local data

- Replace hardcoded "Larissa" in: Home greeting + favorites card, FavoritesScreen title, Sidebar footer ("Made with love for {name}"), PatternViewer share payload.
- Per-profile localStorage keys: activity/streak log (`crochet-time:activity:{profileId}`), community-seen bell count. Counter keys are already per-pattern (pattern IDs are per-owner) — no change.
- Community cards show the creator name; family creators get their profile colour chip.

## E. Backup, tests, docs

- Export v2: `{ version: 2, profile, patterns, stash, stashNotes }`. Import accepts v1 (assign active) and v2 (assign active; additive as before).
- e2e: mock `GET /api/profiles`; verify route globs in `tests/e2e/helpers.ts` still match URLs carrying `?profile=`; add a picker → home flow test.
- Update roadmap progress log + structure memory file.

## Acceptance criteria

1. Fresh visit: splash → picker → choose Mummy → empty library with friendly CTA; community shows the full gallery.
2. Patterns created as Vumsh appear only in Vumsh's library/projects/favorites; Larissa's existing content untouched.
3. Sharing as Akka shows "by Akka" in community for everyone.
4. Switching profiles never shows the previous profile's library (cache cleared), including after offline use.
5. Streak chip and bell badge are per-person.
6. Export as Mummy contains only Mummy's data; importing a pre-profiles (v1) backup lands in the active profile.
7. `tsc` clean · build OK · e2e green.

## Rollback

Single revertable commit batch; all DDL is `IF NOT EXISTS` + defaults, so reverting the code leaves harmless extra columns and the app keeps working (everything reads as Larissa's again).
