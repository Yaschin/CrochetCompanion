---
name: Crochet Time app structure
description: Key architecture facts, file layout, character image paths, nav view map, and CSS conventions for the Crochet Time project.
---

## Character images
- Static PNGs live at `client/public/characters/char-<id>-transparent.png` (NOT root `/public/`).
- IDs: aloo, yala, ashi, bee, sheep.
- Yarn ball: `client/public/yarn-ball.png`.
- Generated via POST `/api/characters/generate` → stored in object storage → served via `/api/characters` map.

## Routing (wouter)
`App.tsx` is URL-driven via `wouter` `useLocation`. It stays the orchestrator: it
derives `activeView` + pattern/community ids from the URL (`parseLocation`) and
navigates via `pathFor`. Deep links, back button, and shareable `/patterns/:id`
URLs work. The current pattern hydrates from the route id on refresh.

## Family profiles (Phase 6)
- No-login profiles: larissa/vumsh/akka/mummy — defined in `shared/profiles.ts`.
- Active profile in localStorage `crochet-time:profile`; appended as `?profile=` to every /api/ call centrally in `client/src/lib/queryClient.ts` (apiRequest + default queryFn) via `withProfile()`.
- Server resolves with `profileOf(req)` (routes.ts), defaulting to larissa. Owner columns: patterns/stash_items/stash_notes `ownerId` (default 'larissa'); community has `creatorId`.
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
- settings → SettingsScreen (`/settings`) — backup/export/import

## Tutorial & pattern import (added on main by Replit session, 2026-06-09)
- `client/src/components/TutorialSystem.tsx` — overlay tour (Ashi), rendered inside the shell in App.tsx; auto-opens once per PROFILE (localStorage `crochet-time-tutorial-v1:{profileId}`, with a one-time legacy→Larissa migration); restartable from Settings → "App tour" (`restartTutorial()`).
- `POST /api/parse-pattern` (`server/api/parsePattern.ts`) — AI-structures pasted pattern text; client then saves via the profile-stamped `POST /api/patterns`.
- `server/seedLibraryImages.ts` — boot-time, non-destructive backfill of missing pattern images (runs after seeds in the ensureSchema chain).
- e2e presets BOTH localStorage flags (profile + tutorial-seen) in `enterApp()`.

## Phase 8 systems (2026-06-11)
- Follow Mode (`components/FollowMode.tsx`) now hosts: section-map chips, in-round tally (target parsed from trailing "(N)"), voice control, milestone moments, glossary chips (`lib/glossary.ts`), Ashi coach (`components/CoachChat.tsx` → `POST /api/patterns/:id/coach`, `server/api/coach.ts`), and the photo "check my work" coach (`components/WorkCheckButton.tsx` → `POST /api/patterns/:id/check-work`, `server/api/checkWork.ts`; gentle/non-prescriptive, `on_track|check|unsure`, no score; design in `docs/CROCHET_TIME_PHOTO_COACH_DESIGN.md`).
- Ball-band scanner: `POST /api/stash/scan-label` (`server/api/scanLabel.ts`) ← 📷 button in MaterialsInventory dialog.
- Make-alongs: `server/makealongService.ts`, tables `makealongs`/`makealong_members` (ensureSchema), board UI in CommunityScreen, start button in CommunityDetailScreen.
- Per-profile app_meta keys: `upnext:{id}`, `gauge:{id}` (`/api/up-next`, `/api/gauge`); story cards `lib/storyCard.ts`; cover photo `POST /api/patterns/:id/cover-photo`.
- Doing=starting: PUT /api/patterns/:id auto-promotes status pattern→active when a step completes or counterState>0 (server-side).
- Stash depletion (W18): finishing a project opens `components/StashDepletionSheet.tsx` (after the confetti, via PatternViewer's finish onSuccess) — tick the matched stash yarns (`matchedYarnsForPattern` in `lib/stashMatch.ts`) you used up; each decrements by 1 (removed at 0) via existing `/api/stash` PUT/DELETE. Manual-confirm, yarn-only, no new endpoint.

## Testing infrastructure
- `server/db.ts` dual driver: Neon WebSocket (prod) vs node-postgres (localhost) — enables real-server testing anywhere.
- `npm run smoke` (`scripts/fullstack-smoke.mjs`): 36 API assertions vs real server+Postgres; in CI as the `fullstack-smoke` job (postgres:16 service). Base DDL: `scripts/create-base-tables.sql`.
- ensureSchema degrades gracefully on a virgin DB (logs db:push hint) — fresh-DB boot crash fixed 2026-06-11; communityService creatorId persistence fixed same day.

## Navigation chrome
- Mobile bottom nav (`AppShell.tsx`, `md:hidden`): 5 tabs — Home, Create,
  Library, Projects, Community. (Favorites demoted to Library filter/Home
  card/sidebar-secondary in the Phase 7 IA restructure.)
- Desktop/tablet (`Sidebar.tsx`, `md+`): Home / AI Studio (input) / Library /
  Favorites / Projects, plus Community Library, My Profile, Settings.
- Community is reached via the Sidebar or the Favorites CTA (NOT the bottom nav).

## CSS conventions
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

**Why:** Needed across multiple sessions since file layout is non-obvious (pages vs components split, public path quirk).
**How to apply:** Check these before adding new screens or characters.
