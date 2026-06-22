# Crochet Time — Delivery Roadmap (2026-06-09)

**Status of this document: CURRENT SOURCE OF TRUTH for sequencing and scope.**
Supersedes the backlog sections (§2, §4, §5) of `CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`; that review remains accurate as the architectural record of Batches A–D and Phases 1–3.

**Branch policy:** work on a per-task feature branch, PR'd to `main` as a draft.

---

## Current state — ✅ ROADMAP FULLY DELIVERED (2026-06-11) · 🚀 LIVE-VERIFIED & LAUNCHED (2026-06-20)

Every phase is built, verified and **merged to `main`**:

| Delivered via | Contents |
|---|---|
| PR #23 | Phases 1–4: CI/data-safety fixes, notes→DB, diagnostics, trophy shelf, follow mode, PDF |
| PR #24 | Phase 6: family profiles (+ repaired a Replit-session typecheck break) |
| PR #25 | Phase 5: durable streaks/counters, per-member tutorial, code splitting, a11y, unit tests |
| PR #26 | Phase 7: IA restructure (5-tab nav, doing=starting, merged screens) + walkthrough tools |
| PR #27 | Sense-of-place batch + Phase 8 innovations (voice follow, glossary, up-next, milestones, story cards, ball-band scanner, make-alongs, gauge resize, Ashi coach) |
| PR #28 | True full-stack e2e: real-server+Postgres smoke in CI (caught & fixed the fresh-DB boot crash and the dead `creatorId`) |
| Replit sessions | Tutorial system, pattern/PDF import, per-profile starter content, library image backfill |

**Test layers, all green in CI on every PR:** typecheck · 81 unit tests · browser e2e
(mocked API, 3 viewports) · **56-assertion full-stack smoke against real Postgres** ·
on-demand visual walkthroughs (`npm run walkthrough`, `npm run walkthrough:deep`).

> **Note (2026-06-16):** the original phase scope was delivered 2026-06-11, but
> `main` has continued to evolve. See **"Delivered since 2026-06-11"** below for
> work this progress log was extended to cover (Calculators, work-time tracking,
> finished-project record, PDF import, and a large refactor/cleanup program).

**Live verification — ✅ PASSED 2026-06-20 (Yash, on the deployed app):**
App health → Run checks + Deep AI test · scan a real ball band · ask Ashi a question ·
start/join a make-along across two profiles · share a pattern (check family colour) ·
set a finished photo (exercises object storage). **All confirmed working — the app is
now fully launched; no outstanding gate items remain.**

**Consciously deferred:** drizzle migration files (boot-time `ensureSchema` is the working,
now smoke-tested mechanism); per-person community likes; count-by-N voice commands;
WebP/AVIF character conversion (perf-only, P2).
**Still not pursued by design:** real auth, public social, AR row-counting, offline write-queue.

---

## Delivered since 2026-06-11 (post-roadmap continuation)

The original eight-phase scope shipped 2026-06-11; the items below landed on `main`
**after** that and after the 2026-06-14 hardening batches (W18 is the last entry in the
progress log). All are verified: `tsc` clean · 81 unit tests · build green · CI green on
the latest `main` merge (#48) · features traced into routing/nav. New features remain
gated on the same **live deploy verification** as the rest of the app.

| Delivered via | Contents |
|---|---|
| PR #43 | **Calculators / Tools screen** (`pages/ToolsScreen.tsx`, `lib/crochetMath.ts`) — gauge sizing + yarn estimating; reached from the Sidebar ("Calculators") and a Home quick button. New `tools` ViewType / `/tools` route. |
| PR #44 | **Work-session timer** (`components/WorkTimer.tsx`, `lib/timeTracking.ts`) — tracks actual crocheting time per project, with a per-session history; embedded in the stitch-counter screen. |
| PR #45 | **Durable time + as-built record** — work sessions persist via a new `patterns.workSessions` column (mirrors `counterState`, carried in export/import); per-project "X crocheted" on Progress + a lifetime total on the Projects header; **`finishedRecord`** (`pattern-viewer/FinishedRecordCard.tsx`) captures what was actually used vs the planned requirements. New columns added idempotently in `ensureSchema`. |
| PRs (PDF import) | **Pattern PDF import** from the homepage, including **multiple PDF** upload. |
| PRs #34–#42 | **Refactor / cleanup program** — `PatternViewer`, `HomeWorkbench`, `PatternInput` split into focused modules under `components/{pattern-viewer,home}/`; `usePatternViewer` / `usePatternRegen` / self-contained `PdfWizard` extracted; shared `aiErrorToast`; palette tokenised; muted-label a11y contrast fix. **Dead character AI-generation flow + unused `/api/characters` endpoints removed** (no client consumer). DOM unchanged — e2e selects by visible text/role, so behaviour is preserved. |
| PR #48 (2026-06-20) | **Cleanup / quality pass** (6 commits) — removed **42 dead files** (39 unused shadcn `ui/*` + 3 orphan modules) and **33 unused npm deps** (~4.4k LOC; `npm ci`-verified); consolidated the file→data-URL helpers into `lib/utils` (fixed a `fileToBase64` footgun) and removed 6 inline `FileReader` copies; extracted a shared `<BackButton>` (aria-labelled) across 8 screens; tokenised ~200 more hex literals into `palette`; split section/step editing out of `usePatternViewer` into `useSectionEditing`; closed the last loading-state false-empty flashes. Surviving `ui/` primitives: button, dialog, alert-dialog, input, label, textarea, tabs, toast, toaster. All three CI jobs (typecheck/e2e/fullstack-smoke) green; DOM/behaviour unchanged. |

**Unit test count:** grew 20 → **55** (yarn-calc, stash-matcher, gauge, time-tracking,
sections, activity-log and crochet-math helpers). Browser e2e runs across 3 viewports;
the full-stack smoke has 56 assertions.

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

## Phase 7 — IA & craft-logic restructure (approved 2026-06-10, "change everything pre-launch")

Deep critique of navigation/logic intuitiveness led to:
- **Doing = starting**: completing a step or counting on a saved pattern auto-promotes it to an active project server-side (`PUT /api/patterns/:id` heals status) — the "Start project" button is optional, not required. Follow Mode offers **"Mark project finished ♡"** when every step is done.
- **One denominator**: materials checklists excluded from progress everywhere (`client/src/lib/progress.ts` is the single source).
- **5-tab nav**: Home · Create · Library · Projects · Community. Favorites demoted to Library filter + Home card + sidebar secondary; **My Stash & Make-From-My-Stash get real entry points** (Home quick row, sidebar, relabelled viewer tool — was the unreachable "Yarn Info").
- **Search merged into Library** (route redirects), **Details screen merged into the viewer Overview** (description + stash coverage moved in; duplicate adapt card deleted).
- **Naming pass**: Community (not "Community Library"), My Stash (not "My Materials"), Create everywhere.
- **Unified counting**: Follow Mode embeds a stitch tally whose target parses from the round's trailing "(N)".
- AI prompt hardening (round labels/counts, US terms, skill-level stitch vocabulary) tracked as the remaining craft-content item.

## Phase 8 — Innovations (approved 2026-06-11: all Tier 1 + #6/#7/#8/#9)

- **Tier 1 delight**: voice control in Follow Mode (done/back/stitch); tappable stitch-glossary
  chips with explainers + how-to video links (`lib/glossary.ts`); "Up next" pinned pattern
  (Home card + viewer chip, app_meta per profile); mid-make milestone moments at 25/50/75%;
  shareable project story card (`lib/storyCard.ts`, canvas → native share/download).
- **#6 Ball-band scanner**: `POST /api/stash/scan-label` (vision) + 📷 button in the stash
  dialog pre-fills the form from a photo of the label.
- **#7 Family make-alongs**: `makealongs`/`makealong_members` tables, start from any community
  pattern, join imports a personal copy, shared progress board on Community with per-member
  colour bars and 🏆 finishes.
- **#8 Gauge-aware resize**: per-profile gauge (Settings card, `/api/gauge`); resize prompts
  automatically include the maker's tension.
- **#9 Ashi the coach**: `POST /api/patterns/:id/coach` (capped, contextual) + chat sheet in
  Follow Mode — answers about the exact round you're on.

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
- [x] Post-delivery hardening — Batch 1 "Make it trustworthy" *(2026-06-14, after a full audit re-verifying the build against code + a live server on real Postgres. Five fixes: **(1) data-loss bug** — the `ensureSchema` pattern dedup ran on EVERY boot and silently deleted any two same-title patterns within a profile (reproduced live: create 2 → restart → 1 survived); now one-time + `patterns_deduped_v1` marker-guarded (re-verified: 2 → restart → 2). **(2)** real error/retry states via shared `QueryError` on Projects/Favorites/YarnRecs/Community/CommunityDetail (a failed fetch no longer masquerades as an empty state). **(3)** the AI fallback template is flagged `aiUnavailable` server-side and the Create flow shows a clear "AI offline — sample saved" toast. **(4)** the fake fixed-timer generation interstitial is replaced by a progress-bound loader driven by the REAL request (`GenerationLoadingScreen` made controllable), then straight to the viewer. **(5)** mobile bottom nav swaps Community → My Stash (Community stays on Home cards + desktop sidebar). Smoke grew 31→34 with dedup + fallback-flag regression guards; tsc/build green. **Merged in PR #30.**)*
- [x] Post-delivery hardening — Batch 2 "Finish hardening & polish" *(2026-06-14. **(1) W8 backup-restore validation** — `/api/import` now validates each pattern against `patternSchema.omit({id,createdAt})` (same as POST /api/patterns): valid rows import, malformed rows are skipped and **reported** (`skippedPatterns`/`skippedStash`), and the Settings toast surfaces "Skipped N item(s)". Previously a single corrupt row could crash the whole restore or land malformed data. **(2)** "Start a family make-along" nudge on Community when none exist yet (the board was invisible until someone started one). **(3)** "upload a PDF" false-promise copy removed from Community Submit (PDF import lives in Create). Plus tutorial per-device→per-profile doc fix. Smoke 34→35 (import skip-and-report guard); tsc/build green. Photo "fix-my-mistake" coach chosen as the next innovation — design-now/build-later.)*
- [x] Innovation — Photo "fix-my-mistake" coach *(2026-06-14, designed then built same day. In Follow Mode, a 📷 "Check my work" button photographs the work-in-progress and Ashi gently judges it against the round you're on. New `server/api/checkWork.ts` (vision, gentle/non-prescriptive, explicit "unsure" state, no numeric score, honest throw without a key) + `POST /api/patterns/:id/check-work` (reuses `getObjectDataUrl` for the optional section reference image) + `client/src/components/WorkCheckButton.tsx` (camera capture + result sheet ✓/👀/🤔). Design + decisions in `docs/CROCHET_TIME_PHOTO_COACH_DESIGN.md`. Smoke 35→36 (work-check degrades cleanly without a key); tsc/build green.)*
- [x] Post-delivery hardening — Batch 3 "Upgrades + tech debt" *(2026-06-14. **W17 Gauge swatch calculator** — Settings gauge card gains a "calculate from any swatch" helper (`client/src/lib/gauge.ts`, 3 new unit tests) that normalises a measured swatch to the per-10cm gauge feeding AI resize. **W10 Bundle split** — `manualChunks` (vendor + charts) drops the main app chunk 694 kB → **266 kB** (gzip 206 → 66) and clears the >500 kB warning. **W11 Route validation** — zod on `/api/up-next` and `/api/gauge` (accepts valid, rejects bad/out-of-range with 400; verified live). **W12 Make-along N+1** — `getPatternsByIds` batches the board's per-member pattern reads into one query. **W15 Error hygiene** — 5xx responses no longer echo internal error text (global handler + 24 routes sanitised; details still logged), and the diagnostics object-storage probe is now deleted after the check (`deleteObject`). Unit 14→17; smoke 36/36; tsc/build green. **W18 stash-depletion deferred** — it's a strategic feature with an ambiguous data model (deducting "~50g" from skein-counted stash), so it needs its own design pass rather than a guess.)*
- [x] W18 — Stash depletion *(2026-06-14, after the owner chose "manual confirm, by count" to sidestep the grams ambiguity. When a project is finished, after the confetti, a sheet offers the stash yarns that match the pattern (`matchedYarnsForPattern` in `lib/stashMatch.ts`); you tick the skeins you actually used up and each drops by one — removed at zero — via the existing `/api/stash` PUT/DELETE. Nothing changes unless you confirm; if no stash yarn matches, it dismisses silently. New `client/src/components/StashDepletionSheet.tsx`, wired into PatternViewer's finish flow (covers both the viewer button and Follow Mode's "Mark finished"). Yarn-only (hooks/notions aren't "used up"). Unit 17→20 (matcher tests); PUT-decrement + DELETE verified live; tsc/build green.)*

**Post-deploy checklist for Yash (live Replit app) — ✅ completed 2026-06-20:**
1. Deploy this branch; watch boot logs for `ensureSchema` + seed messages.
2. Settings → App health → "Run checks", then "Deep AI test" — all should pass.
3. Spot-check: Projects shows seeded WIP patterns under In Progress; delete a seed pattern, restart, confirm it stays deleted; save a note on a pattern and reload; counter shows same rows in viewer modal and full-screen counter; "Follow step-by-step" advances and persists check-offs; Print/PDF renders with cover photo.
