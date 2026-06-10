# Crochet Time — Delivery Roadmap (2026-06-09)

**Status of this document: CURRENT SOURCE OF TRUTH for sequencing and scope.**
Supersedes the backlog sections (§2, §4, §5) of `CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`; that review remains accurate as the architectural record of Batches A–D and Phases 1–3.

**Branch policy:** all work on `claude/focused-albattani-6l3u6p`, PR'd to `main` as draft.

---

## Current state (updated 2026-06-09, end of day)

- **Phases 1–4 are MERGED to `main`** (PR #23, merged by Yash 2026-06-09 19:25).
- **Phase 6 (family profiles) is in PR #24** (draft, CI green), which also merges in the
  Replit session's same-day additions and **repairs `main`'s typecheck** (see below).
- **Delivered outside this roadmap** by a Replit session on `main` (post-#23):
  interactive **tutorial/onboarding system** (`TutorialSystem.tsx`, restartable from
  Settings), **import existing patterns** (`POST /api/parse-pattern` + wizard path),
  **library image backfill** (`seedLibraryImages.ts`, non-destructive), dashboard
  discoverability polish, and the app was **published/deployed**.
- ⚠️ That session also edited `server/routes.ts` against a stale base, reverting the
  Phase 1/3 startup imports — `main`'s typecheck is **red** until PR #24 merges
  (the PR restores `ensureSchema()` → one-time seeds → `seedLibraryImages()` and the
  diagnostics imports, keeping all the new features).
- Verification at PR #24 head: `tsc` clean · build OK · Playwright e2e **42/42**
  (mobile/tablet/desktop) locally and on CI.
- Still outstanding: the **live post-deploy checklist** below (especially
  Settings → App health → Deep AI test) and Phase 5.

---

## Original baseline & decisions (2026-06-09, morning — for the record)

**Verified baseline at audit time:**
- `main` = `8f544c0`; the Jun-8 Replit session pushed ~19 polish commits directly to main (seed content, 40-pattern community gallery, regen confirmations, ~24 bug fixes logged in `.agents/memory/`).
- Production build: ✅ green (719 kB main chunk — splitting tracked in Phase 5).
- Playwright e2e: ✅ green (39/39 across mobile/tablet/desktop, on CI and re-run locally).
- `tsc` / CI typecheck: ❌ RED — 9 errors introduced Jun-8 (fixed in Phase 1).
- Live AI flows: never formally validated (diagnostics panel closes this — Phase 3).

**Owner decisions (2026-06-09, Yash):**
1. AI validation → build a **self-test diagnostics panel** in Settings (not a manual checklist).
2. Demo content → **one-time starter set**: seed once, deletions stick forever.
3. Data sync → **notes persist to the existing Postgres DB now**; streaks/counter persistence deferred to Phase 5. (No new database needed — Replit Postgres + Drizzle already provisioned.)
4. New features → **all four approved**: finished-projects gallery, continue-where-I-left-off, row-by-row follow mode, PDF export.

---

## Phase 1 — "Green & Safe" (P0: broken things, data loss, security)

| # | Item | Files | Acceptance criteria |
|---|------|-------|---------------------|
| B1 | Fix invalid `status: "project"` in seeds (8 sites) → `"active"` | `server/seedLibrary.ts:91,291`, `server/seedAdditionalPatterns.ts:187,335,601,771,1013,1197` | `tsc` clean; seeded WIP patterns show in Projects → In progress |
| B2 | Type the library query (`useQuery<Pattern[]>`), drop inline casts | `client/src/components/PatternLibrary.tsx:40,141` | `tsc` clean |
| B3 | Boot-time data heal: `UPDATE patterns SET status='active' WHERE status='project'` (idempotent; fixes rows already in the live DB) | new `server/ensureSchema.ts`, wired in `server/routes.ts` | Live rows healed on next deploy without manual SQL |
| B4 | Defuse destructive community reseed — never delete rows; seed only when table is empty | `server/communityService.ts:97–102` | <30 rows no longer triggers deletion |
| B5 | One-time library/stash seed: `app_meta` marker (`CREATE TABLE IF NOT EXISTS` at boot); seeds run once, deletions stick | `server/ensureSchema.ts`, `server/seedLibrary.ts:424`, `server/seedAdditionalPatterns.ts:1309` | Delete a seed → restart → it does not return |
| B6 | Remove `POST /api/characters/store-file` (arbitrary file read on a public, auth-less deploy) | `server/routes.ts:131–148` | Endpoint gone; characters still load |
| B7 | `onError` + retry affordance on generate/save mutations | `client/src/components/PatternInputRefactored.tsx:138–175` | Forced failure → destructive toast + retry, no stuck loading screen |

**Do not touch in Phase 1:** design system, AI prompts, routing, PWA/service worker, e2e fixtures.
**Rollback:** single revertable commit; B3/B5 DDL is `IF NOT EXISTS`-idempotent. Take a `GET /api/export` backup before deploying.

## Phase 2 — Trust & sync (P1 upgrades to existing features)

| # | Item | Files | Acceptance criteria |
|---|------|-------|---------------------|
| T1 | Pattern notes → DB: `notes` column (boot-ensured), schema/zod/storage wiring, viewer Notes tab saves via debounced PUT; one-time migration of existing localStorage note per pattern | `shared/schema.ts`, `server/storage.ts`, `server/ensureSchema.ts`, `client/src/components/PatternViewer.tsx` | Notes survive cache clear and appear on another device |
| T2 | Confirm dialog before "Share to community" (currently one-click publish) | `client/src/components/PatternViewer.tsx:829` | No publish without explicit confirm |
| T3 | Unify stitch counters: shared `useStitchCounter(patternId)` hook on the per-pattern key; standalone screen + modal read the same state | `client/src/pages/StitchCounterScreen.tsx`, `client/src/components/StitchCounter.tsx`, new `client/src/hooks/useStitchCounter.ts` | Counting in one surface reflects in the other |

## Phase 3 — AI diagnostics self-test (owner decision #1)

| # | Item | Files | Acceptance criteria |
|---|------|-------|---------------------|
| D1 | `GET /api/diagnostics` — checks DB, object storage, OpenAI key validity/model availability (cheap calls); optional `POST /api/diagnostics/deep` running one tiny text-gen + one image-gen | new `server/diagnostics.ts`, `server/routes.ts` | JSON pass/fail per subsystem with messages |
| D2 | Settings → "App health" panel: run checks, show per-service pass/fail, surface remediation hints (e.g. "OPENAI_API_KEY invalid") | `client/src/pages/SettingsScreen.tsx` | Yash can validate live AI flows in one click on the deployed app |

## Phase 4 — Approved new features (P1)

Order chosen so each step builds on the previous:

| # | Feature | Depends on | Effort |
|---|---------|-----------|--------|
| F1 | **Finished-projects gallery** — "trophy shelf" with final photos, finish dates, time-on-project; entry from Projects screen + Home | — | Low |
| F2 | **Continue-where-I-left-off** — Home CTA jumps into the active project's counter at the last counted row | T3 | Low |
| F3 | **PDF pattern export** — branded printable view (extends existing `printPattern` save-as-PDF) | — | Medium |
| F4 | **Row-by-row follow mode** — viewer mode binding the counter to actual pattern steps; auto-advance + check-off | T3 | Medium |

## Phase 5 — Polish & tech debt — ✅ DONE 2026-06-09 (except one consciously deferred item)

- [x] **Streaks → DB**: `activity_days` table + `GET/POST /api/activity`; client write-through (localStorage fast path) with two-way `syncActivity()` reconcile on app load and profile switch.
- [x] **Counter positions → DB**: `patterns.counterState` jsonb; `useStitchCounter` adopts the server copy when the device has none and saves back debounced (1.5 s) — offline-safe.
- [x] **Dead code removed**: `server/replit_integrations/object_storage/*` (GCS client init inlined into `server/objectStorage.ts`), `sectionImageFocus` param, orphaned Jest file; `project_events` table dropped via ensureSchema.
- [x] **Code splitting**: 14 secondary screens are `React.lazy` chunks behind Suspense; main bundle 719 kB → 650 kB and screens load on demand.
- [x] **Accessibility**: aria-labels on icon-only buttons (home search/bell, counter toggles), `aria-pressed` on toggles, `aria-live` count regions, voice counter now shows "Heard: …" transcript feedback.
- [x] **AI prompt caps**: `capText()` (500 chars) on `userNote`, `refinements`, resize/substitute `instruction`.
- [x] **Unit tests**: vitest (`npm run test:unit`, in the CI typecheck job) — 14 tests over yarn-complexity/colour/volume estimation and stash coverage/ranking; replaces the orphaned Jest file.
- [x] **Per-profile tutorial**: each family member gets Ashi's tour on their first session (key `crochet-time-tutorial-v1:{profileId}`, legacy flag migrates to Larissa); Settings → App tour restarts it for the active person.
- [ ] **Drizzle migration files** — consciously deferred: `ensureSchema()` is the working migration mechanism (idempotent boot heals) and swapping workflows can't be safely validated without the live DB. Revisit in a maintenance window.

## Phase 6 — Family Profiles (approved 2026-06-09)

Netflix-style no-login profiles (Larissa, Vumsh, Akka, Mummy): per-profile library/stash/notes/streaks, shared community with real creator attribution, picker after splash. Full detail in `CROCHET_TIME_PROFILES_PLAN_2026-06-09.md`.

## Explicitly not pursued (agreed scope guard)

Multi-user **auth** / real social community; AI provider swaps; offline write-sync queue. Each adds large surface area against the household design. (Phase 6 profiles are trust-based convenience separation, not auth.)

---

## Sequencing rationale

1. Phase 1 first because CI is red (no trustworthy signal for anything else), the status bug is user-visible, and B4/B6 are open data-loss/security holes.
2. Phase 2 before features: notes persistence and counter unification are foundations F2/F4 build on.
3. Phase 3 diagnostics before the feature push so live AI regressions can't hide under new work.
4. Features in low→medium effort order with dependencies respected.
5. Phase 5 only once the core experience is proven.

## Progress log

- [x] Phase 1 — Green & Safe *(2026-06-09: B1–B6 done; B7 verified already-implemented — the generate flow has a full error taxonomy + retry via re-enabled button. tsc/build/e2e green. **Merged in PR #23.**)*
- [x] Phase 2 — Trust & sync *(2026-06-09: T1 notes→DB with legacy localStorage migration; T2 share confirm dialog; T3 shared per-pattern counter hook. **Merged in PR #23.**)*
- [x] Phase 3 — AI diagnostics *(2026-06-09: GET /api/diagnostics + POST /api/diagnostics/deep + Settings "App health" panel. **Merged in PR #23.** Run the deep test on the live deploy to validate AI end-to-end)*
- [x] Phase 4 — F1 trophy-shelf gallery · F2 continue-where-left-off · F3 branded Print/PDF · F4 row-by-row follow mode *(2026-06-09; also fixed a latent Pattern-tab index bug where filtering "materials" sections before mapping could corrupt step edits. **Merged in PR #23.**)*
- [ ] Phase 5 — deferred polish (not scheduled)
- [x] Phase 6 — Family profiles *(2026-06-09: profiles table + ownerId scoping (patterns/stash/notes), `?profile=` resolved centrally (apiRequest + default queryFn + SW-cache-safe), picker at `/who` after splash, per-profile streaks/bell/export-import v2, community shares stamped with the real family creator. Pre-profile data backfills to Larissa; old clients default to Larissa. **In PR #24** together with the main-merge: tutorial + pattern-import + library-images kept, adapt-copies owner-stamped, main's reverted startup block restored.)*

**Post-deploy checklist for Yash (live Replit app):**
1. Deploy this branch; watch boot logs for `ensureSchema` + seed messages.
2. Settings → App health → "Run checks", then "Deep AI test" — all should pass.
3. Spot-check: Projects shows seeded WIP patterns under In Progress; delete a seed pattern, restart, confirm it stays deleted; save a note on a pattern and reload; counter shows same rows in viewer modal and full-screen counter; "Follow step-by-step" advances and persists check-offs; Print/PDF renders with cover photo.
