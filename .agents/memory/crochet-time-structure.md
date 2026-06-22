---
name: Crochet Time app structure
description: Key architecture facts, file layout, character image paths, nav view map, and CSS conventions for the Crochet Time project.
---

## Character images
- Static PNGs live at `client/public/characters/char-<id>-transparent.png` (NOT root `/public/`).
- IDs: aloo, yala, ashi, bee, sheep.
- Yarn ball: `client/public/yarn-ball.png`.
- The app renders these **static** PNGs directly. The old AI-generation path (HomeWorkbench's dead generate flow + unused HeroZone props, plus the `GET /api/characters` + `POST /api/characters/generate` routes and `CHARACTER_DEFS` in `server/routes.ts`) was **fully removed** 2026-06-16 — it had no client consumer. To regenerate characters, the prompts live in git history.

## Routing (wouter)
`App.tsx` is URL-driven via `wouter` `useLocation`. It stays the orchestrator: it
derives `activeView` + pattern/community ids from the URL (`parseLocation`) and
navigates via `pathFor`. Deep links, back button, and shareable `/patterns/:id`
URLs work. The current pattern hydrates from the route id on refresh.

## Family profiles (Phase 6)
- No-login profiles: larissa/vumsh/akka/mummy — defined in `shared/profiles.ts`.
- Active profile in localStorage `crochet-time:profile`; appended as `?profile=` to every /api/ call centrally in `client/src/lib/queryClient.ts` (apiRequest + default queryFn) via `withProfile()`.
- Server resolves with `profileOf(req)` (`server/httpHelpers.ts`), defaulting to larissa. Owner columns: patterns/stash_items/stash_notes `ownerId` (default 'larissa'); community has `creatorId`.
- Picker screen: `/who` → ProfilePickerScreen (after splash on first run; header avatar + sidebar "Switch Profile" reopen it). Switching calls `queryClient.clear()`.
- Per-profile localStorage: streaks (`crochet-time-activity:{id}`, larissa keeps legacy key), community-seen bell.
- e2e: `enterApp()` presets profile via addInitScript; picker has its own test.

## ViewType → screen → URL map
All ViewTypes are in `client/src/lib/types.ts`. Current full list:
- splash → SplashScreen (`/`)
- profile-picker → ProfilePickerScreen (`/who`)
- home → HomeWorkbench (`/home`)
- input → PatternInputRefactored (`/create`)
- loading → GenerationLoadingScreen (`/loading`)
- viewer → PatternViewer (`/patterns/:id`)
- pattern-detail → MERGED into viewer (`/patterns/:id/details` redirects; PatternDetailScreen deleted; description+StashCoverage now in Overview)
- progress → ProgressTrackingScreen (`/patterns/:id/progress`)
- photo-upload → PhotoUploadScreen (`/patterns/:id/photos`)
- stitch-counter → StitchCounterScreen (`/patterns/:id/counter`)
- regenerate → (no dedicated screen; resolves to viewer)
- library → PatternLibrary (`/library`)
- search → MERGED into Library (`/search` redirects; SearchScreen deleted)
- stash → MaterialsInventory (`/stash`) — NOTE: replaced the old StashScreen/YarnStash
- projects → ProjectsScreen (`/projects`) — a real lifecycle screen, NOT an alias for stash
- favorites → FavoritesScreen (`/favorites`)
- yarn-recs → YarnRecsScreen (`/yarn`) — stash-aware "Make From My Stash"
- community → CommunityScreen (`/community`)
- community-detail → CommunityDetailScreen (`/community/:id`)
- community-submit → CommunitySubmitScreen (`/community/submit`)
- tools → ToolsScreen (`/tools`) — "Calculators": gauge sizing & yarn estimating (`lib/crochetMath.ts`); reached from Sidebar + a Home quick button (added 2026-06-16, PR #43)
- settings → SettingsScreen (`/settings`) — backup/export/import

## Tutorial & pattern import (added on main by Replit session, 2026-06-09)
- `client/src/components/TutorialSystem.tsx` — overlay tour (Ashi), rendered inside the shell in App.tsx; auto-opens once per PROFILE (localStorage `crochet-time-tutorial-v1:{profileId}`, with a one-time legacy→Larissa migration); restartable from Settings → "App tour" (`restartTutorial()`).
- `POST /api/parse-pattern` (`server/api/parsePattern.ts`) — AI-structures pasted pattern text; client then saves via the profile-stamped `POST /api/patterns`.
- `server/seedLibraryImages.ts` — boot-time, non-destructive backfill of missing pattern images (runs after seeds in the ensureSchema chain).
- e2e presets BOTH localStorage flags (profile + tutorial-seen) in `enterApp()`.

## Phase 8 systems (2026-06-11)
- Follow Mode (`components/FollowMode.tsx`) now hosts: section-map chips, in-round tally (target parsed from trailing "(N)"), voice control, milestone moments, glossary chips (`lib/glossary.ts`), Ashi coach (`components/CoachChat.tsx` → `POST /api/patterns/:id/coach`, `server/api/coach.ts`), and the photo "check my work" coach (`components/WorkCheckButton.tsx` → `POST /api/patterns/:id/check-work`, `server/api/checkWork.ts`; gentle/non-prescriptive, `on_track|check|unsure`, no score; design in `docs/archive/CROCHET_TIME_PHOTO_COACH_DESIGN.md`).
- Ball-band scanner: `POST /api/stash/scan-label` (`server/api/scanLabel.ts`) ← 📷 button in MaterialsInventory dialog.
- Make-alongs: `server/makealongService.ts`, tables `makealongs`/`makealong_members` (ensureSchema), board UI in CommunityScreen, start button in CommunityDetailScreen.
- Per-profile app_meta keys: `upnext:{id}`, `gauge:{id}` (`/api/up-next`, `/api/gauge`); story cards `lib/storyCard.ts`; cover photo `POST /api/patterns/:id/cover-photo`.
- Doing=starting: PUT /api/patterns/:id auto-promotes status pattern→active when a step completes or counterState>0 (server-side).
- Stash depletion (W18): finishing a project opens `components/StashDepletionSheet.tsx` (after the confetti, via PatternViewer's finish onSuccess) — tick the matched stash yarns (`matchedYarnsForPattern` in `lib/stashMatch.ts`) you used up; each decrements by 1 (removed at 0) via existing `/api/stash` PUT/DELETE. Manual-confirm, yarn-only, no new endpoint.

## Post-roadmap additions (2026-06-16)
- **Calculators** (`pages/ToolsScreen.tsx`, `lib/crochetMath.ts`): gauge sizing + yarn estimating; `tools` ViewType / `/tools`.
- **Work-time tracking** (`components/WorkTimer.tsx`, `lib/timeTracking.ts`): per-project session timer embedded in `StitchCounterScreen`; durable via `patterns.workSessions` jsonb (mirrors `counterState`, write-through on stop, merged on load, carried in export/import). Surfaced per-project on Progress + a lifetime total on the Projects header. Pure helpers `mergeSessions`/`lifetimeMs` are unit-tested.
- **As-built record** (`patterns.finishedRecord`, `pattern-viewer/FinishedRecordCard.tsx`): made-for, yarn/hook used, final measurements, notes/mods — editable on the Overview tab once a project is active/finished; distinct from the pattern's *planned* requirements.
- Both new `patterns` columns are added idempotently in `server/ensureSchema.ts`.
- **Character AI-generation flow fully removed** 2026-06-16 (PR #40/#42): the dead home generate flow + `GET/POST /api/characters` routes + `CHARACTER_DEFS` are gone; the app renders static PNGs only. Regeneration prompts live in git history.

## Cleanup pass (PR #48, merged 2026-06-20)
A code/quality cleanup across six commits; all four CI layers green.
- **Dead code deleted (42 files):** 39 unused shadcn `components/ui/*` plus orphans `SectionImagePlaceholder.tsx`, `hooks/use-debounce.ts`, `hooks/use-mobile.tsx`; and unused exports (`dateUtils` date helpers except `getOrdinalSuffix`; `timeTracking.totalTracked`; `generateImage.generatePartImage`/`generateStitchDiagram`). **The ONLY surviving `ui/` primitives:** `button`, `dialog`, `alert-dialog`, `input`, `label`, `textarea`, `tabs`, `toast`, `toaster`. Need another? Re-add the file **and** its npm dep.
- **33 unused npm deps removed.** Always-unused: `@hookform/resolvers`, `react-icons`, `zod-validation-error`, `google-auth-library`, `@jridgewell/trace-mapping`. Plus 28 that only backed deleted ui files (`recharts`, `embla-carousel-react`, `vaul`, `cmdk`, `input-otp`, `react-resizable-panels`, `react-day-picker`, and 21 `@radix-ui/*`). **Kept radix deps:** dialog, alert-dialog, label, tabs, toast, slot. Lockfile regenerated; `npm ci`-verified.
- **Shared `<BackButton>`** (`client/src/components/BackButton.tsx`) replaced the duplicated icon-only header back button on all 8 screens; carries `aria-label="Go back"`, props `onClick`/`bg`/`color`.
- **File→data-URL helpers consolidated** in `client/src/lib/utils.ts`: `fileToDataUrl` (full `data:…;base64,…`) and `fileToBase64` (payload only) — fixing a footgun where two `fileToBase64`s returned different things. Six inline FileReader copies removed; `pattern-input/helpers.ts` re-exports the canonical pair.
- **Colour tokens:** ~200 hex literals across ~38 files → named keys on `palette` (`client/src/lib/theme.ts`); added purple, cocoa, amber, teal, roseDeep, inkSoft, olive, gold, brown. Use `palette.<token>` in style props, not raw hex. (Hexes inside gradient/rgba strings were left as-is.)
- **`usePatternViewer` slimmed** 534→407 lines: section/step expand + CRUD extracted to `pattern-viewer/useSectionEditing.tsx`. `PatternSection` was deliberately **not** split (audit: "only split if touched").
- **Loading/a11y polish:** skeletons for the last false-empty flashes (Tools stash picker, Community make-along nudge, viewer up-next pin, Progress achievements); CommunityScreen like-button label + keyboard-operable card.

## Refactor/cleanup program (PRs #56–#60, 2026-06-22)
A second code-quality program from a fresh project-state review. No user-facing
change; DOM/behaviour unchanged; all three CI jobs green on every merge.
- **#56** P1: last bespoke `fetch` moved onto the shared axios/`apiRequest` path;
  client photo-size cap enforced; shared `SegmentedControl`.
- **#57** P2: Favorites de-dup; shared `usePhotoUpload` hook (replaced repeated
  `FileReader`+resize+POST flows).
- **#58** B5/B9: vestigial route aliases removed; ~recurring hex literals tokenised.
- **#59** B8.1: `EditableItemList` extracted from `EnhancedMaterialsList`.
- **#60** B8.2 — **server routes split**: `server/routes.ts` went **1409 → 70 lines**
  and is now a thin orchestrator (household gate → per-domain `registerXRoutes(app)`
  → boot `ensureSchema`+seed chain → optional reminder loop). **Every endpoint now
  lives in `server/routes/<domain>Routes.ts`** — `auth`, `push`, `media`, `ai`,
  `pattern`, `stash`, `community` (incl. make-alongs), `account`
  (profiles/activity/up-next/gauge), `diagnostics`, `backup`. Shared helpers:
  `server/httpHelpers.ts` (`profileOf`/`capText`) and `server/pdfParse.ts` (lazy
  `pdfParseFn`, used by both AI import and pattern source-files). **To add/modify a
  route, edit the relevant `server/routes/*Routes.ts`** (and for a new domain wire
  one `registerXRoutes(app)` call into `routes.ts`); the seed chain + reminder loop
  stay in the orchestrator.

## Testing infrastructure
- `server/db.ts` dual driver: Neon WebSocket (prod) vs node-postgres (localhost) — enables real-server testing anywhere.
- `npm run smoke` (`scripts/fullstack-smoke.mjs`): 56 API assertions vs real server+Postgres; in CI as the `fullstack-smoke` job (postgres:16 service). Base DDL: `scripts/create-base-tables.sql`.
- ensureSchema degrades gracefully on a virgin DB (logs db:push hint) — fresh-DB boot crash fixed 2026-06-11; communityService creatorId persistence fixed same day.

## Navigation chrome
- Mobile bottom nav (`AppShell.tsx`, `md:hidden`): 5 tabs — Home, Create,
  Library, Projects, **My Stash**. (Phase 7 set the 5th tab to Community; the
  Batch-1 hardening swap, 2026-06-14, replaced it with My Stash — Community now
  lives on Home cards + the desktop sidebar. Favorites demoted to Library
  filter/Home card/sidebar-secondary in the Phase 7 IA restructure.)
- Desktop/tablet (`Sidebar.tsx`, `md+`): Home / AI Studio (input) / Library /
  Favorites / Projects / **Calculators** (`tools`), plus Community Library, My
  Profile, Settings.
- Community is reached via the Sidebar or Home cards (NOT the bottom nav).

## CSS conventions
- **Colours come from `palette`** (`client/src/lib/theme.ts`) — use `palette.<token>` in style props, not raw hex literals (PR #48 tokenised the recurring ones).
- `no-scrollbar` utility defined in `client/src/index.css`.
- All scrollable screen containers need `pb-20 md:pb-6` for bottom nav clearance.
- AppShell main area: `overflow-hidden flex flex-col`.
- Craft card classes: `craft-card`, `craft-card-rose`, `craft-card-sage`, `craft-card-plum`, `craft-card-honey`.
- Button classes: `btn-craft btn-rose`, `btn-craft btn-sage`, `btn-craft btn-plum`.

## Key file paths
- App shell + nav: `client/src/components/AppShell.tsx`
- All routes: `client/src/App.tsx`
- Home screen: `client/src/components/HomeWorkbench.tsx` — a 262-line orchestrator (header + scroll layout + data queries) that composes presentational pieces from `client/src/components/home/`: `helpers.ts`, `decorations.tsx` (CrochetFlower/YarnBall/FlowerDot), `HeroZone.tsx` (+ HeroScene), `ActionCards.tsx`, `BottomSections.tsx`, `HomeRightPanel.tsx`. `HomeRightPanel` is re-exported from `HomeWorkbench.tsx` so `App.tsx`'s `import HomeWorkbench, { HomeRightPanel }` is unchanged.
- Sidebar (desktop): `client/src/components/Sidebar.tsx`
- Splash: `client/src/pages/SplashScreen.tsx`
- Pages dir: `client/src/pages/`
- Pattern viewer: `client/src/components/PatternViewer.tsx` + `components/pattern-viewer/*` — hooks `usePatternViewer`, `usePatternRegen`, `useSectionEditing` (PR #48).
- Shared header back button: `client/src/components/BackButton.tsx`.
- File→image helpers (`fileToDataUrl`/`fileToBase64`) + `cn()`: `client/src/lib/utils.ts`.
- Colour tokens: `client/src/lib/theme.ts` (`palette`).

**Why:** Needed across multiple sessions since file layout is non-obvious (pages vs components split, public path quirk).
**How to apply:** Check these before adding new screens or characters.
