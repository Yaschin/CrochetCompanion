---
name: Crochet Time app structure
description: Key architecture facts, file layout, character image paths, nav view map, and CSS conventions for the Crochet Time project.
---

## Character images
- Static PNGs live at `client/public/characters/char-<id>-transparent.png` (NOT root `/public/`).
- IDs: aloo, yala, ashi, bee, sheep.
- Yarn ball: `client/public/yarn-ball.png`.
- Generated via POST `/api/characters/generate` → stored in object storage → served via `/api/characters` map.

## ViewType → screen map
All ViewTypes are in `client/src/lib/types.ts`. Current full list:
- home → HomeWorkbench
- input → PatternInputRefactored
- viewer → PatternViewer
- library → PatternLibrary
- stash → StashScreen
- search → SearchScreen
- yarn-recs → YarnRecsScreen
- progress → ProgressTrackingScreen
- stitch-counter → StitchCounterScreen
- photo-upload → PhotoUploadScreen
- loading → GenerationLoadingScreen
- favorites → FavoritesScreen
- projects → (alias for stash)
- community → CommunityScreen
- community-detail → CommunityDetailScreen
- community-submit → CommunitySubmitScreen

## Bottom nav (AppShell.tsx)
5 tabs: Home→"home", Create→"input", Library→"library", Favorites→"favorites", Community→"community"

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
