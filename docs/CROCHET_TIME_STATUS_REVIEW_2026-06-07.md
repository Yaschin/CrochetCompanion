# Crochet Time — Current State & Next Steps Review

**Date:** 2026-06-07
**Branch:** `claude/project-status-audit-HkgQL` (identical to `main` — no divergence at time of writing)
**Status of this document:** **Current source of truth.** Supersedes `CROCHET_TIME_CURRENT_STATE_ASSESSMENT.md` and `CROCHET_TIME_UPGRADE_ROADMAP.md` (both dated 2026-06-06), which describe an earlier, broken state that no longer matches the code.
**Method:** Read every `.md`; cross-checked claims against source; ran `tsc` (0 real errors); mapped the REST surface; traced each screen to its data source. No application code was changed in producing this document.

---

## 0. Headline

The two prior planning docs are **stale**. They describe a broken app (78 type errors, ephemeral images, no favorites, dead files). The *actual* codebase is well past that — it type-checks cleanly, persists durably, and has Favorites/Projects scaffolding. The real problem now is **not breakage, it's half-wired features and mockups masquerading as finished screens.** This document reflects the verified code, not the older docs.

---

## 1. Current Position

### Completed & verified in code
- **Type safety restored.** `tsc` passes with **0 real errors** (one trivial `baseUrl` deprecation warning). The assessment's "78 errors / requires rebuild" is obsolete.
- **Material persistence fixed** (was FN-1/P0). `server/storage.ts` persists *all* fields (hooks, notions, tools, stuffing, favorite, status) via a centralised `patternToColumns`.
- **Durable media** (was FN-2/FN-3/P0). AI images are downloaded into object storage (`generateImage.ts` → `uploadFromUrl`); step/section photos go to object storage via `uploadBuffer`. No more ephemeral DALL·E URLs or local-disk photos.
- **Dead files / unused deps cleaned.** `PatternInput.tsx`, `CalendarPlanner.tsx`, `usePatternState`, `ThemeProvider`, `pages/HomePage`, `generatePattern.ts.bak`, duplicate `client/src/shared/schema.ts`, and `passport*`/`express-session`/`memorystore` are gone.
- **Favorites — the real engine works.** Schema has `favorite`; `PatternLibrary` (filter + heart toggle), `PatternViewer` (heart), and `HomeWorkbench` (live count) all PUT `/api/patterns`.
- **Design system shipped.** Warm palette, Fraunces/Nunito fonts, linen texture, `craft-card`/`btn-craft` utilities, `framer-motion` view transitions, `AppShell` with bottom-nav + sidebar, splash screen, 5 character assets, error boundaries mounted.
- **AI generation core** intact with retries/fallbacks; lock-merge logic (`mergeWithLockedSteps`) exists and is correct.

### Partially completed
- **Projects lifecycle — schema done, never writable.** `patterns` has `status: pattern|active|finished`, `startedAt`, `finishedAt`. `PatternViewer`/`ProjectsView` *read* status, but **nothing ever sets a pattern to `active` or `finished`** — there is no working "Start project" action. Every pattern stays `status:"pattern"`, so the lifecycle is inert.
- **Selective regeneration locks** (was FN-4). The merge logic is correct, but the persisting endpoint `POST /api/patterns/:id/regenerate` does **not** pass `unlockedStepsOnly`, so `isRegeneration` is false and locked steps are not preserved on that path. Editor-side lock enforcement still needs confirming.
- **Stitch counter** exists (`StitchCounterScreen`, 251 lines) but appears to use local state only — no per-project persistence confirmed.

### Outstanding / mockups pretending to be done
- **FavoritesScreen** (bottom-nav "Favorites" tab) is a **mockup** — hardcoded Unsplash photos + local `useState`, disconnected from the real `favorite` data. The *tab* shows fake patterns while the *Library filter* shows real ones (direct contradiction).
- **Community** (Screen/Detail/Submit, ~560 lines) — **entirely frontend mock** (`COMMUNITY_PATTERNS` array). No API, no table.
- **ProgressTrackingScreen** — `MOCK_PROGRESS` hardcoded array drives the chart.
- **PhotoUploadScreen** — `SAMPLE_PHOTOS` seed data (real photo endpoints exist though).
- **Fake alignment-check** (`Math.random()` "AI match %") still live at `server/routes.ts:618`.
- **No routing.** `wouter` is installed and the roadmap says "adopt it," but App still uses `useState` view-switching. No URLs/deep links/back button.

### Documentation vs implementation mismatches
| Doc claim | Reality |
|---|---|
| Assessment: "78 tsc errors, doesn't compile" | **0 errors** — resolved |
| Assessment: images/photos ephemeral | **Durable** in object storage |
| Roadmap: "Calendar dropped, Stash → light Materials" | Done — `MaterialsInventory` replaces Stash; no calendar |
| Roadmap Phase 1: "adopt wouter routing" | **Not done** — still `useState` |
| Visual plan: characters as WebP/AVIF in object storage | Reality: **PNG** in `client/public/characters/` (+ stale duplicate set in root `/public/characters/`) |
| Memory: "projects → alias for stash" | App now has a real `projects` view (ProjectsScreen) |

### Duplicated / no-longer-relevant
- **Two Projects implementations:** `components/ProjectsView.tsx` (schema-correct, uses `status`) is **orphaned**; the wired `pages/ProjectsScreen.tsx` uses a **nonexistent `completed` field** → its "in progress / completed" split is always wrong.
- **Two `Pattern` types:** `shared/schema.ts` (canonical) vs `client/src/lib/types.ts` (phantom `description`, `imgUrl`, `difficultyLevel`, `completed` not in the DB). Root cause of the ProjectsScreen bug.
- **Duplicate character assets:** `client/public/characters/` (live) vs root `public/characters/` (stale, missing bee/sheep).
- **Both prior planning docs** are now historically misleading and are superseded by this document.

---

## 2. Pending Work

**MVP-critical** (generate → edit → library/favorites → track → count):

| Task | Status | Why it matters | Files / routes | Deps | Pri | Effort | Independent? |
|---|---|---|---|---|---|---|---|
| Unify `Pattern` type (drop phantom fields) | In progress (drift) | Root cause of Projects bug & future breakage | `lib/types.ts`, `shared/schema.ts` | — | **P0** | Low | Yes |
| Fix ProjectsScreen to use `status` not `completed` | Impl. but broken | Projects tab mis-categorises every project | `pages/ProjectsScreen.tsx`, `components/ProjectsView.tsx` | type unify | **P0** | Low | Yes |
| Add "Start project" / "Mark finished" actions | Not started | Lifecycle inert without writes | `PatternViewer.tsx`, `routes.ts` PUT | type unify | **P0** | Med | Yes |
| Wire FavoritesScreen to real `/api/patterns` | Not started (mock) | Tab shows fake data | `pages/FavoritesScreen.tsx` | — | **P0** | Low | Yes |
| Make `/regenerate` lock-aware + enforce locks in editor | Partially impl. | Locked work silently overwritten | `routes.ts:694`, `PatternViewer`, `PatternSection` | — | **P0** | Med | Yes |
| Remove/replace fake `Math.random()` alignment-check | Not started | Fabricated trust signal | `routes.ts:618` | Decision 2 | **P1** | Low | Needs dir |
| Confirm & add stitch-counter persistence | Needs validation | Core craft use-case | `StitchCounterScreen`, `StitchCounter.tsx` | — | **P1** | Med | Yes |
| Reconcile/archive stale docs (this doc) | In progress | Prevents future confusion | `docs/*` | — | **P1** | Low | Yes |
| Remove duplicate root `/public/characters` | Not started | Asset drift | `/public/characters` | — | **P2** | Low | Yes |
| `tsc` baseUrl deprecation warning | Trivial | Clean build | `tsconfig.json` | — | **P2** | Low | Yes |

**Optional enhancements (not MVP):**

| Task | Status | Pri | Effort | Independent? |
|---|---|---|---|---|
| Real Community backend (or cut the tab) | Mock only | P2 | High | Needs Decision 1 |
| Real Progress charts from step data | Mock | P2 | Med | Yes |
| `wouter` routing migration (URLs/back) | Not started | P2 | Med | Yes |
| AI model refresh (gpt-4o/dall-e-3 → current) | Not started | P2 | Low | Needs Decision 3 |
| Reference-image vision input (or remove) | Cosmetic | P2 | Med | Needs Decision 3 |
| Convert character PNGs → WebP/AVIF | PNG now | P3 | Low | Yes |

---

## 3. Decisions — CONFIRMED (2026-06-07)

Yash chose the ambitious "build everything for real" path on all four:

| # | Decision | Choice |
|---|---|---|
| 1 | Community tab | **Build the real backend now** — community table, endpoints, wire the Screen/Detail/Submit flows to real data. |
| 2 | Alignment-check | **Make it real now** — replace the `Math.random()` fake with a genuine vision-based pattern↔photo comparison. |
| 3 | AI models & reference image | **Upgrade now** — move off `gpt-4o`/`dall-e-3` to current OpenAI models, and implement true vision-based reference-image input (no cosmetic filename-only). |
| 4 | Projects implementation | **Fix `ProjectsScreen`** — port the correct `status` logic into it; delete the orphaned `ProjectsView`. |

> **Note for build time:** Decisions 2 & 3 share a dependency — a current OpenAI **vision** model. Confirm exact model IDs at implementation (e.g. an image model such as `gpt-image-1`, and a current GPT-4.1/4o-class vision model for text+image input); do not hard-code IDs from memory. Confirm OpenAI remains the provider.

These choices materially expand scope beyond a single batch. To protect quality and avoid rework, delivery is **phased**: a foundation batch first (no decisions needed, de-risks everything else), then the three confirmed build-outs.

---

## 4. Recommended Sequence (phased)

### Batch A — Foundation & honest core *(P0, no external dependencies, do first)*
1. **Unify the `Pattern` type** — match `lib/types.ts` to `shared/schema.ts`; remove phantom fields (`description`, `imgUrl`, `difficultyLevel`, `completed`). **AC:** one Pattern shape; `tsc` clean; no `.completed` references.
2. **Fix Projects (Decision 4)** — ProjectsScreen filters on `status`; delete orphaned `ProjectsView`. **AC:** buckets reflect real `status`.
3. **Add lifecycle write actions** — "Start project" (`status:'active'`, `startedAt`) and "Mark finished" (`status:'finished'`, `finishedAt`) in PatternViewer. **AC:** clicking moves a pattern between buckets and persists across reload.
4. **Wire FavoritesScreen to real data** — query `/api/patterns`, filter `favorite`, reuse the existing favorite mutation; remove `FAV_PATTERNS`. **AC:** the tab matches the Library favorites filter exactly.
5. **Make regenerate lock-aware** — pass `unlockedStepsOnly:true` from the persisting path; enforce locked steps/sections as read-only in the editor. **AC:** a locked step survives a regenerate, verified end-to-end.

### Batch B — AI upgrade (Decision 3)
6. Move text/vision generation to a current OpenAI model; **dall-e-3 → current image model**. **AC:** generation still works with retries/fallbacks; models confirmed.
7. **Real reference-image input** — send image bytes to a vision model (not the filename). **AC:** uploaded reference demonstrably influences output.

### Batch C — Real alignment-check (Decision 2)
8. Replace the `Math.random()` endpoint with a vision comparison of the section photo vs the pattern section. **AC:** score derives from actual image analysis; remove the fabricated variance.

### Batch D — Community backend (Decision 1)
9. New `community_patterns` table + CRUD/list/submit endpoints; durable images via object storage. **AC:** submitted patterns persist and list for other sessions.
10. Wire `CommunityScreen` / `CommunityDetailScreen` / `CommunitySubmitScreen` to the API; remove `COMMUNITY_PATTERNS` mock. **AC:** no hardcoded data remains.

### Cross-cutting (fold in opportunistically)
- Remove duplicate root `/public/characters`; fix `tsc` `baseUrl` warning; keep this SSOT current.

---

## 5. Suggested First Execution Batch

**Start with Batch A.** It needs no model/provider confirmation, removes the type drift that would otherwise cause churn in Batches B–D, and turns three misleading surfaces (Projects, Favorites tab, regenerate) into honest working features. Batches B and C then share the vision-model wiring (do B first so C reuses it); Batch D is independent and can follow.

---

---

## 6. Batch A — Execution Log (2026-06-07)

Batch A (foundation & honest core) was implemented on branch `claude/batch-a-foundation`.

**Done:**
1. **Unified `Pattern` type** — removed phantom fields (`imgUrl`, `difficultyLevel`, `completed`) from `client/src/lib/types.ts`; repointed all consumers to real schema fields (`imgUrl→endProductImage`, `difficultyLevel→skillLevel`, pattern-level `completed→status==='finished'`). Added a real, persisted **`description`** column (schema + storage + zod) since the AI generates one and two screens display it.
2. **Projects (Decision 4)** — `ProjectsScreen` now buckets by real `status` (`active`/`finished`); empty-state is project-aware. Deleted the orphaned `ProjectsView.tsx`.
3. **Lifecycle writes** — `PatternViewer` now has Start project / Mark finished / Reopen actions that persist `status` + `startedAt`/`finishedAt`.
4. **FavoritesScreen** — rewritten to use real `/api/patterns` data + the favorite mutation (was a hardcoded Unsplash mock). Wired `onPatternSelected` in `App.tsx`.
5. **Lock-aware regenerate** — server `/api/patterns/:id/regenerate` now passes `unlockedStepsOnly`; the client regen path uses this persisting endpoint; locked steps/sections are now read-only in the editor (`PatternSection`).

**Important correction — `tsc` was silently passing:** the `baseUrl` deprecation (TS5101) was making `tsc` **exit before type-checking the program**, so the earlier "0 errors" (this doc §1 and the visual-system plan) was a false positive. Adding `ignoreDeprecations: "6.0"` to `tsconfig.json` makes the checker actually run. It then revealed ~15 **pre-existing** latent errors (none from Batch A), which were fixed: missing lucide imports in `PatternInputRefactored`, `PatternViewer.onNavigate` typed `string` instead of `ViewType`, `HomeWorkbench` not destructuring `onPatternSelected`, two implicit-`any` stream handlers, and three confirmed-dead files removed (`ObjectUploader.tsx`, `use-upload.ts`, `Navigation.tsx`).

**Verification:**
- `tsc` (with the checker now actually running) is clean except **2 errors** — both `Cannot find module '@google-cloud/storage'` — which are an artifact of this sandbox's broken `npm` (the package is never unpacked here). In a properly-installed environment these resolve, leaving `tsc` genuinely green.
- `vite build` succeeded with the core Batch A changes; the sandbox's esbuild later became unstable (unrelated to code), so the final build couldn't be re-run here. Re-verify build + live behaviour in an environment with a working install + Neon DB + OpenAI key.

**Next:** Batches B (AI upgrade), C (real alignment-check), D (Community backend) per §4.

---

## 7. Batch B — Execution Log (2026-06-07)

Implemented on `claude/batch-b-ai-upgrade` (stacked on Batch A).

**Context discovered:** a web check confirmed **`dall-e-3` was removed from the OpenAI API on 2026-05-12** — so image generation was effectively **broken in production**, making this batch necessary rather than optional. `gpt-4o` is likewise superseded.

**Done (Decision 3 — upgrade now + real reference image):**
1. **Image model** — `dall-e-3` → **`gpt-image-1`** (`server/api/generateImage.ts`). gpt-image-1 returns base64 (not a hosted URL), so the response is decoded and stored via `uploadBuffer`; URL fallback retained. Quality maps `final→high`, others→`medium`; timeout raised to 60s.
2. **Text + vision model** — `gpt-4o` → **`gpt-4.1`** in both call sites (`server/api/generatePattern.ts`).
3. **Real reference-image input** — the inspiration image is now sent to the vision model as actual bytes (base64 data URL) instead of only appending the filename. Wired client → route → `generatePattern` (`PatternInputRefactored.tsx`, `routes.ts`, `generatePattern.ts`), with a system-prompt instruction to match the image's subject/shape/colours/style.

**Model choice & override:** both models are **env-overridable** — `OPENAI_TEXT_MODEL` and `OPENAI_IMAGE_MODEL`. Defaults (`gpt-4.1`, `gpt-image-1`) are confirmed-available, vision-capable, cost-reasonable choices. To move tiers (flagship `gpt-5.5`/`gpt-5.4`, or cheaper `gpt-image-1-mini`), set the env var — no code change. **Provider remains OpenAI** (confirm if that should change).

**Not in this batch:** the regenerate "based on section image" path is still text-only (it references the section in the prompt but doesn't yet send the stored section image to the vision model — would need a server-side fetch of the object-storage bytes). Flagged as a small follow-up.

**Verification:** `tsc` clean except the 2 environment-only `@google-cloud/storage` "cannot find module" errors. Build/live unverifiable here (broken sandbox esbuild + no OpenAI key) — **re-verify generation end-to-end on a real environment**, confirming the chosen model IDs are valid for the account and that reference-image generation visibly reflects the uploaded image.

**Next:** Batch C (real vision-based alignment-check — reuses this batch's vision wiring), then Batch D (Community backend).

---

*End of review. (§1–§5 produced with no code changes; §6–§7 log the Batch A and B implementations that followed.)*
