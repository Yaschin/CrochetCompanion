---
name: Walkthrough bugs fixed
description: Bugs found and fixed during full app walkthrough — DB seeding, community images, pattern sort order, activePattern logic.
---

## Bug 1 — community_patterns table missing (FIXED)
The community_patterns DB table did not exist on first boot. Created via direct SQL (`executeSql`). `drizzle-kit push` is interactive and cannot be used non-interactively for new tables.

## Bug 2 — Community seed images showed wrong Unsplash photos (FIXED)
Seed data in `server/communityService.ts` had Unsplash photo IDs that showed completely unrelated stock images (man with drill, toy trains). Removed all `endProductImage` fields from the 6 seed records. Also ran `UPDATE community_patterns SET "endProductImage" = NULL` to clear already-inserted rows. The fallback (pattern title first letter in pink gradient) is the clean solution.

## Bug 3 — getAllPatterns had no ORDER BY (FIXED)
`server/storage.ts getAllPatterns()` returned patterns in undefined DB order. Added `.orderBy(desc(patternsTable.createdAt))` so newest pattern is always first.

**Why:** Without ORDER BY, `patterns[0]` on the home screen was unpredictable with multiple patterns.

## Bug 4 — HomeWorkbench showed wrong pattern as "Active Project" (FIXED)
Both `HomeWorkbench` (line ~892) and `HomeRightPanel` (line ~719) used `patterns[0]` for the Active Project card, ignoring the `status` field. Changed to: `patterns.find(p => p.status === "active") ?? patterns.find(p => p.status !== "finished") ?? patterns[0] ?? null`.

**Why:** Pattern lifecycle is `"pattern"` → `"active"` → `"finished"`. The "Continue Project" card should prefer an actively started project over an unstarted one.

## Non-bugs (by design)
- Bell notification badge shows hardcoded "3" — button has no action handler (UI placeholder)
- "Time spent: 4h 20m" in right panel Active Project card is hardcoded placeholder
- "3-day streak" in mobile motivational chip is hardcoded
- "My Profile" sidebar item navigates to home (no profile screen)
- Stash (`/stash`) highlights "Projects" in sidebar — intentional in `resolveActiveId()`
- `project_events` DB table exists but is not in `shared/schema.ts` and not used anywhere (orphaned legacy table, harmless)
