---
name: Profile seeding system
description: How family profiles and their starter patterns are seeded into the DB
---

# Profile Seeding System

## Profiles
4 profiles defined in `shared/profiles.ts`:
- `larissa` — pink/aloo character (default)
- `vumsh` — purple/yala character
- `akka` — green/ashi character
- `mummy` — yellow/bee character

## Seeding
- `server/seedLibrary.ts` → `seedStarterContentOnce()` seeds Larissa's 3 starter patterns + stash; flag: `starter_content_seeded_v1`
- `server/seedAdditionalPatterns.ts` → `seedAdditionalPatterns()` adds ~23 more patterns for Larissa (called inside seedStarterContentOnce on first run)
- `server/seedProfilePatterns.ts` → `seedProfilePatterns()` seeds 5 patterns each for vumsh, akka, mummy; flag: `profile_content_seeded_v1`

## Startup chain (routes.ts)
```
ensureSchema()
  .then(() => {
    communityService.seedIfEmpty()  // 40 community patterns
    seedStarterContentOnce()
      .then(() => seedProfilePatterns())
      .then(() => seedLibraryImages())
  })
```

## Stash seeding
`seedProfileStash()` also in `server/seedProfilePatterns.ts`; flag: `profile_stash_seeded_v1`
- Vumsh: 9 items (4 yarn, 2 hooks, 2 notions, 1 tool — DK/fingering in bold colours, amigurumi supplies)
- Akka: 9 items (4 yarn, 2 hooks, 2 notions, 1 tool — cotton DK in pastels/naturals)
- Mummy: 9 items (3 yarn, 3 hooks, 1 notion, 2 tools — chunky/aran in neutrals)

Startup chain: `seedProfilePatterns() → seedProfileStash() → seedLibraryImages()`

## Pattern counts (after dedup)
- larissa: ~26 unique patterns + 16 stash items
- vumsh/akka/mummy: 5 patterns + 9 stash items each

## Deduplication
`ensureSchema()` runs a DISTINCT ON dedup on every boot — keeps oldest row per (ownerId, title). Guards against multi-phase seed re-runs that happened before the one-time flags were set.

**Why:** seedAdditionalPatterns was called multiple times across PR phases before the flag was set, creating up to 5x duplicates. The dedup in ensureSchema is the permanent fix.
