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

## Pattern counts (after dedup)
- larissa: ~26 unique patterns
- vumsh/akka/mummy: 5 each

## Deduplication
`ensureSchema()` runs a DISTINCT ON dedup on every boot — keeps oldest row per (ownerId, title). Guards against multi-phase seed re-runs that happened before the one-time flags were set.

**Why:** seedAdditionalPatterns was called multiple times across PR phases before the flag was set, creating up to 5x duplicates. The dedup in ensureSchema is the permanent fix.
