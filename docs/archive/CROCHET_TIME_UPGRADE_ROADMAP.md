# Crochet Time — Upgrade Roadmap

> ⚠️ **SUPERSEDED (2026-06-07).** This roadmap predates substantial implementation work; its Phase 0/1 items are largely done (persistence, types, durable media, design system) while others diverged (routing not migrated; characters shipped as PNG). See **[`CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`](CROCHET_TIME_STATUS_REVIEW_2026-06-07.md)** for the current source of truth and next steps. Retained for history only.

**Prepared for:** Yash · **Date:** 2026-06-06 · **Branch:** `claude/gifted-cerf-ckF8q` · **Companion doc:** [`CROCHET_TIME_CURRENT_STATE_ASSESSMENT.md`](./CROCHET_TIME_CURRENT_STATE_ASSESSMENT.md)

This roadmap turns the agreed direction into a phased plan. It assumes the **confirmed decisions** (assessment §9): ambitious scope, **premium-handcrafted-blend** visual identity, **Calendar dropped / Stash reduced to a light materials inventory**, and a **clean data reset**. Yash has authorised **clearing out code and rebuilding from scratch where it makes sense.**

---

## Guiding principles

1. **Preserve the heart, rebuild the body.** Keep the AI generation logic, prompt engineering, error-handling UX, and the generation loader. Rebuild the shell, theming, screens, navigation, persistence, and data model.
2. **Scope is broad, delivery is phased.** "Everything" is the destination, not a single drop. Each phase ships something coherent and demoable.
3. **Mobile-first and reduced-motion-aware** from the start — Larissa crochets with the phone in hand.
4. **Stack stays; implementation changes.** Keep React + Vite + Express + Drizzle/Neon + OpenAI + Tailwind/shadcn. The problems are implementation, not platform. (Add `wouter` for routing and `framer-motion` for the signature animation — both already in `package.json`.)
5. **Personal, but seam-ready.** Build privately for Larissa with a minimal identity seam so multi-user is a later addition, not a rewrite.

### Environment constraint (important)
This sandbox **cannot boot the app** (no `DATABASE_URL`, no `OPENAI_API_KEY`; `server/db.ts` throws at import). Work here is verified via `tsc` and `vite build`; **live runs require a provisioned Neon DB, an OpenAI key, and object storage.** Each phase's "Definition of done" separates *build-verifiable* from *live-verifiable* items.

---

## Phase 0 — Foundation & clean-out  *(in progress)*

**Goal:** Remove dead weight and stand up correct foundations so the rebuild starts clean.

| Work | Reuse / Rebuild | Notes |
|---|---|---|
| Delete dead files | Remove | `pages/HomePage.tsx`, `pages/not-found.tsx`, `components/PatternInput.tsx`, `components/PatternStepCard.tsx`, `hooks/usePatternState.tsx`, `lib/ThemeProvider.tsx`, `client/src/shared/schema.ts` (dup), `server/api/generatePattern.ts.bak` |
| Prune unused deps | Remove | `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore` (+ their `@types`). **Keep** `wouter`, `framer-motion`. |
| Single source-of-truth schema | Rebuild | New Drizzle schema (below). One `shared/schema.ts`, imported by both sides. |
| Fix material persistence | Rebuild | Storage layer must persist **all** fields (hooks/notions/tools/stuffing), not just yarn. |
| Refactor `generatePattern.ts` | Rebuild | Un-nest the malformed functions; restore clean module scope; get `tsc` to zero. |
| Mount `ErrorBoundary` | Reuse | Wrap the app so one query crash doesn't blank the page. |
| Durable-media plan | Decide | Choose object storage (see Risks). AI image URLs must be downloaded & stored; photos must leave local disk. |

**Definition of done** — *build:* `tsc` passes (0 errors), `vite build` succeeds, dead files/deps gone. *live:* n/a this phase.

---

## Phase 1 — Crochet design system + app shell

**Goal:** Replace the generic shell with a coherent, handcrafted identity and real navigation.

- **Routing & nav:** introduce `wouter`; real URLs/deep links/back button; **one** navigation system (retire the dual nav). Retire the Calendar view here.
- **Design tokens:** premium-handcrafted palette (warm naturals + one vivid yarn accent), full color scale (fixes the `*-100/600/800` no-op bug), spacing, radii, elevation, a real type scale (fixes `font-heading`).
- **Crochet identity:** wool/yarn display type for titles; a coherent crochet icon set (replace generic lucide where it matters); subtle knit/linen texture; **one signature "thread" motif** (an animated yarn line that connects prompt → pattern → project) + reduced-motion fallback.
- **Rebuild screens on the system:** Create-Pattern and Viewer/Editor re-skinned and de-bugged (remove dead Edit/Save buttons; debounce saves).

**DoD** — *build:* shell + theme compile; Storybook-style visual check of tokens. *live:* nav works on 390/768/1440; reduced-motion respected.

---

## Phase 2 — Generation & editing core (hardened)

**Goal:** Make the differentiator reliable and delightful.

- **One regeneration contract:** a single, persisted, **lock-aware** path. Locked steps/sections are enforced in the editor *and* preserved server-side; results are saved to the DB (not just React state).
- **Reference image:** either implement true image input (vision model) or remove the control — no fakes. *(Decision D9.)*
- **Stitch counter (mobile-first):** a dedicated full-screen surface — large tap targets, increment/decrement/reset, **row/round tracking**, keep-awake, glanceable while crocheting. Persists per project.
- **Durable images:** generation downloads and stores images via Phase 0 storage.

**DoD** — *build:* types/contracts compile. *live:* lock+regenerate verified end-to-end; counter usable one-handed on a phone; images survive reload.

---

## Phase 3 — Library, Favorites & Projects

**Goal:** Organise and track the making.

- **Library:** search, filter (type/skill/status), sort; durable thumbnails.
- **Larissa's Favorites:** first-class favorite flag + a Favorites view.
- **Projects (new entity):** convert a pattern → active project; progress (steps + milestones); **durable progress-photo gallery**; resume; status.

**DoD** — *build:* schema + queries compile. *live:* create→favorite→start project→track→resume works; photos persist.

---

## Phase 4 — Sharing & light Materials

**Goal:** Close the loop with the remaining "everything" scope.

- **Sharing:** private/family share links with an attractive read-only presentation of a pattern or finished item (images included). *(Public gallery deferred — D8.)*
- **Light Materials inventory:** a simplified "yarn I own," types fixed, folded toward the pattern materials list (replaces the old type-broken Stash). No standalone heavy inventory.

**DoD** — *live:* a shared link renders for a non-editor; materials attach to patterns.

---

## Phase 5 — Polish, performance, accessibility

- Animation polish + a completion celebration (stitch/confetti) with reduced-motion.
- A11y pass (contrast, focus, labels, ≥44px targets), mobile QA at 390/768/1440, perf budget (animation cost, image sizes), minimal tests + CI (none exists today).

---

## Proposed new data model (Phase 0 sketch)

```
users           # seam for later multi-user; seed a single "Larissa" row
patterns        # + favorite:boolean; all material fields persisted
projects        # NEW: patternId, status, startedAt, currentStep, milestones
progress_photos # NEW: projectId, url(object-storage), caption, takenAt
materials       # NEW (light): owned yarn/hooks; optional link to requirements
media           # NEW: durable store for AI images (downloaded), not raw OpenAI URLs
```
Dropped: `project_events`, `stash_items`/`stash_notes` (replaced by `materials`).

---

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| **Object storage choice** (durable images/photos) | Decide early: Replit object storage / S3 / Cloudinary. Blocks FN-2/FN-3 fixes. |
| Can't run/verify here | Verify via `tsc`/`vite build`; live runs after Neon + OpenAI key + storage are provisioned. |
| AI model currency/cost | Re-evaluate `gpt-4o`/`dall-e-3` to current models in Phase 2 (D9). |
| Scope ("everything") vs quality | Strict phase gates; each phase demoable; defer public sharing & heavy inventory. |
| Data reset | Confirmed wipe (D7) — verify nothing in the live DB needs keeping before destructive migration. |

---

## First implementation ticket

**P0-1 — Foundation clean-out & correct persistence**
1. Delete the 8 dead files; prune the 5 unused deps (+types). *(Started.)*
2. Collapse to one `shared/schema.ts`; design the new schema above (no destructive DB migration yet — schema definition + types first).
3. Fix `storage.ts` to persist all material fields; refactor `generatePattern.ts` to clean module scope.
4. Mount `ErrorBoundary` in the app root.
5. Get `tsc` to **0 errors** and `vite build` green.

*DoD:* build is clean and green; no dead files/deps; persistence bug fixed at the type+code level. Live DB migration and durable-media wiring follow once storage is chosen and the DB is provisioned.
