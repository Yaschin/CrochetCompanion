---
name: Production audit fixes
description: 10 bugs found and fixed in the deep multi-round production audit session.
---

## DB Schema Drift
- Run `npx drizzle-kit push` when schema columns exist in shared/schema.ts but not in the live DB. The patterns table was missing columns causing `column "description" does not exist` on every GET /api/patterns.

## Client Fixes Applied

### SearchScreen
- Always destructure `isLoading` from `useQuery` and show a skeleton grid while loading (prevents false "no patterns" empty state).
- Filter chips need `aria-pressed={activeFilter === chip.id}` for accessibility.
- Sort chips need `aria-pressed={activeSort === opt}`.
- Clear-search (X) button needs `aria-label="Clear search"`.
- When combining `isLoading` with a ternary JSX chain (`condition ? A : B`), always close with `: null` to avoid parse errors.

### FavoritesScreen
- Heart unfav button was `w-6 h-6` (24px) — too small for mobile. Increased to `w-8 h-8` (32px).

### CommunityDetailScreen
- `likeMutation` was missing `onError` handler — silent failure on network error. Always add `onError: () => toast({ ... variant: "destructive" })` to every mutation.

### PatternDetailScreen
- "Show more / Show less" toggle button needs `aria-expanded={showMore}` for screen reader state.

### YarnRecsScreen
- `isLoading` was computed but no skeleton shown while both queries resolved. Added a 3-row animated skeleton below the character intro card, gated on `isLoading`.

### ProgressTrackingScreen
- SVG progress ring outer `<div>` needs `role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={...}` for accessibility tools.

### SettingsScreen
- Export was a plain `<a href="/api/export">` click — always toasted "Backup started" even when server returned 500. Converted to `fetch()` with blob download; shows error toast on failure; button shows "Exporting…" while in-flight.

### MaterialsInventory
- `saveNotesMutation.onSuccess` only toasted but never called `queryClient.invalidateQueries({ queryKey: ['/api/stash-notes'] })`. Added invalidation.

### PatternSection
- Step completion toggle has `role="checkbox"` but a `<button>` element. Added explicit `onKeyDown` to handle Space/Enter for completeness (browser behavior varies with mixed ARIA roles).

## Rule
Every `useMutation` must have an `onError` that toasts with `variant: "destructive"`. Every `useQuery` result should destructure `isLoading` and render a skeleton, not an empty/error state, while loading.
