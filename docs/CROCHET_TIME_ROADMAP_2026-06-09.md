# Crochet Time — Delivery Roadmap (2026-06-09)

**Status of this document: CURRENT SOURCE OF TRUTH for sequencing and scope.**
Supersedes the backlog sections (§2, §4, §5) of `CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`; that review remains accurate as the architectural record of Batches A–D and Phases 1–3.

**Branch policy:** all work on `claude/focused-albattani-6l3u6p`, PR'd to `main` as draft.

**Verified baseline (2026-06-09):**
- `main` = `8f544c0`; the Jun-8 Replit session pushed ~19 polish commits directly to main (seed content, 40-pattern community gallery, regen confirmations, ~24 bug fixes logged in `.agents/memory/`).
- Production build: ✅ green (719 kB main chunk — splitting tracked in Phase 5).
- Playwright e2e: ✅ green (39/39 across mobile/tablet/desktop, on CI and re-run locally).
- `tsc` / CI typecheck: ❌ **RED** — 9 errors introduced Jun-8 (see B1/B2).
- Live AI flows: never formally validated (diagnostics panel will close this — Phase 3).

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

## Phase 5 — Deferred polish & tech debt (P2)

- Streak/activity + counter positions → DB (extends T1 pattern).
- Remove dead code: `server/replit_integrations/object_storage/*` (unused duplicate), `sectionImageFocus` param (`server/api/generatePattern.ts:33`), `tests/yarn-calculator.test.js` (no runner), orphaned `project_events` table.
- Route-level code splitting (719 kB chunk), `React.memo` on thumbs, font-display.
- Accessibility pass: aria-labels on icon buttons, counter ARIA live region; voice-counter transcript feedback.
- Length-cap user text interpolated into AI prompts (`userNote`, `refinements`).
- Adopt drizzle migration files as the long-term replacement for boot-time ensure.
- Unit tests for yarn-estimate + stash-match math.

## Explicitly not pursued (agreed scope guard)

Multi-user auth / real social community; AI provider swaps; offline write-sync queue. Each adds large surface area against the deliberate single-user design.

---

## Sequencing rationale

1. Phase 1 first because CI is red (no trustworthy signal for anything else), the status bug is user-visible, and B4/B6 are open data-loss/security holes.
2. Phase 2 before features: notes persistence and counter unification are foundations F2/F4 build on.
3. Phase 3 diagnostics before the feature push so live AI regressions can't hide under new work.
4. Features in low→medium effort order with dependencies respected.
5. Phase 5 only once the core experience is proven.

## Progress log

- [ ] Phase 1 — Green & Safe
- [ ] Phase 2 — Trust & sync
- [ ] Phase 3 — AI diagnostics
- [ ] Phase 4 — F1 gallery · F2 continue · F3 PDF · F4 follow mode
- [ ] Phase 5 — deferred polish (not scheduled)
