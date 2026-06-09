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
- pattern-detail → PatternDetailScreen (`/patterns/:id/details`)
- progress → ProgressTrackingScreen (`/patterns/:id/progress`)
- photo-upload → PhotoUploadScreen (`/patterns/:id/photos`)
- stitch-counter → StitchCounterScreen (`/patterns/:id/counter`)
- regenerate → (no dedicated screen; resolves to viewer)
- library → PatternLibrary (`/library`)
- search → SearchScreen (`/search`)
- stash → MaterialsInventory (`/stash`) — NOTE: replaced the old StashScreen/YarnStash
- projects → ProjectsScreen (`/projects`) — a real lifecycle screen, NOT an alias for stash
- favorites → FavoritesScreen (`/favorites`)
- yarn-recs → YarnRecsScreen (`/yarn`) — stash-aware "Make From My Stash"
- community → CommunityScreen (`/community`)
- community-detail → CommunityDetailScreen (`/community/:id`)
- community-submit → CommunitySubmitScreen (`/community/submit`)
- settings → SettingsScreen (`/settings`) — backup/export/import

## Navigation chrome
- Mobile bottom nav (`AppShell.tsx`, `md:hidden`): 5 tabs — Home→"home",
  Create→"input", Library→"library", Favorites→"favorites", Projects→"projects".
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
- Home screen: `client/src/components/HomeWorkbench.tsx` (975 lines)
- Sidebar (desktop): `client/src/components/Sidebar.tsx`
- Splash: `client/src/pages/SplashScreen.tsx`
- Pages dir: `client/src/pages/`

**Why:** Needed across multiple sessions since file layout is non-obvious (pages vs components split, public path quirk).
**How to apply:** Check these before adding new screens or characters.
