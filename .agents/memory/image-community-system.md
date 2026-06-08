---
name: Image & Community System
description: How auto-image generation and the 40-pattern community seed work
---

## Auto-image after pattern creation
- `POST /api/patterns` responds 201 immediately, then fires an async IIFE that calls `generateImage()` and `patternService.updatePattern()` — no await on the caller side.
- Skips if `endProductImage` already exists and doesn't contain "placehold".
- Same pattern used for community seeds: `generateCommunityImages()` in communityService.ts processes batches of 3 with a 3s delay between batches.

## Community seed
- 40 patterns: exactly 10 per type (Toy, Wearable, Home Decor, Accessory).
- `seedIfEmpty()` re-seeds when count < 30 (handles old 6-pattern seed and first run).
- Re-seed deletes all existing community patterns then inserts 40 fresh ones.
- Background image generation fires after all 40 are inserted.

**Why:** Clearing and reseeding at count < 30 means any genuine user-submitted community patterns (more than 30) are preserved, but old sparse seeds get replaced cleanly.

## PatternThumb component
- File: `client/src/components/PatternThumb.tsx`
- Used in: PatternLibrary, CommunityScreen, FavoritesScreen, SearchScreen
- Shows real image if available; otherwise a typed gradient card (emoji + title).
- Type → theme map: Toy→rose, Wearable→purple, Home Decor→sage, Accessory→amber.
- Parent containers need `style={{ containerType: "inline-size" }}` for cqw font sizing.
- Falls back to 🧶 and neutral gradient for unknown types.
