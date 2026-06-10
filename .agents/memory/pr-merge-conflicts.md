---
name: PR merge conflict pattern
description: Recurring merge conflicts from remote PRs and how to resolve them
---

# PR Merge Conflict Pattern

## Context
Remote PRs (e.g. PR #23 "Roadmap Phases 1–4") introduce changes to files we also edit locally. This creates diverged branches requiring merge.

## Recurring conflict files
1. `client/src/pages/SettingsScreen.tsx`
   - Import line: merge ALL icons — `HelpCircle` (ours, tutorial) + `Activity, CheckCircle2, XCircle, Sparkles` (theirs, diagnostics)
   - JSX: keep BOTH "App tour" card AND "App health" diagnostics card

2. `server/routes.ts`
   - Imports: use `seedStarterContentOnce` (not `seedLibraryIfEmpty`) + keep `seedAdditionalPatterns`, `seedLibraryImages`, `ensureSchema`, `runQuickDiagnostics`, `runDeepDiagnostics`
   - Startup: `ensureSchema().then(() => { communityService.seedIfEmpty(); seedStarterContentOnce().then(() => seedProfilePatterns()).then(() => seedLibraryImages()) })`

## CLI resolution (user runs in Shell tab)
```bash
git pull origin main --no-rebase -X ours --no-edit
```
`-X ours` picks our local version for conflicts (which already has both sides merged). Works because we manually resolve in advance.

**Why:** The main agent sandbox blocks `git pull` as a destructive operation. User must run in Shell. After the pull, the app restarts cleanly.

## Post-merge checks
- Verify no `<<<<<<<` markers: `grep -r '<<<<<<' .` (should return nothing)
- Check workflow logs for any import errors
- Run quick visual test via screenshots
