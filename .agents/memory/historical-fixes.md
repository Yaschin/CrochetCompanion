---
name: Historical fixes & durable conventions
description: Condensed, still-true rules and invariants distilled from the pre-launch review/audit/walkthrough passes (2026-06-07/08). The blow-by-blow bug lists live in git history.
---

# Historical fixes & durable conventions

This file consolidates three early point-in-time debugging logs —
*deep review*, *production audit*, and *full walkthrough* (all 2026-06-07/08,
pre-launch). The individual "bug N: fixed X" entries are in git history; what's
kept here are the **durable rules and architecture invariants** those passes
established, which still hold.

## Durable client conventions (enforce on every PR)
- **Every `useMutation` needs an `onError`** that toasts `variant: "destructive"`
  — and reverts optimistic local state. A silent network failure that leaves the
  UI in a wrong state (e.g. a favourite shown saved when it wasn't) is the bug.
- **Every `useQuery` should destructure `isLoading`** and render a skeleton while
  loading — never let a pending fetch fall through to an empty/"none yet" state.
  (This was the single most common defect across screens.)
- **Mutations send partial bodies.** `PUT /api/patterns/:id` uses
  `patternSchema.partial()`, so send only the changed fields (e.g.
  `{ favorite }`), never the whole pattern object incl. section text/images.
- **Invalidate the shared cache after writes.** Anything that changes patterns/
  stash must `queryClient.invalidateQueries` the relevant key
  (`['/api/patterns']`, `['/api/stash-notes']`, …) or other screens show stale
  data. Don't add a per-screen custom `queryFn`/`staleTime` for a shared key —
  it desyncs screens (Library once drifted 2 min behind everything else).
- **Icon-only / role-mismatched controls need ARIA.** `aria-pressed` on toggles,
  `aria-expanded` on disclosure buttons, `role="progressbar"` + `aria-value*` on
  progress rings, `aria-label` on icon buttons; a `<button>` carrying
  `role="checkbox"` needs an explicit Space/Enter `onKeyDown`. Touch targets ≥32px.
- Auto-saves are **silent** — no toast on incremental step/counter/favourite
  saves; only the "finished" celebration fires.

## Durable architecture invariants
- **Pattern lifecycle** is `"pattern" → "active" → "finished"`. ProjectsScreen
  shows only `active`/`finished`; unstarted `"pattern"` rows live in the Library
  until started. "Active project" selection prefers
  `find(active) ?? find(!finished) ?? [0]` — never blind `patterns[0]`.
- `getAllPatterns()` is ordered `desc(createdAt)` so "newest first" is stable.
- Default query fetcher joins the key: `["/api/community", id]` → `/api/community/${id}`.
- Community-seen bell is **dynamic**: `communityPatterns.length - lastSeenCount`
  (localStorage `crochet-time-community-seen`) — not a hardcoded badge.
- Community seed records carry **no** `endProductImage` (the old Unsplash IDs
  showed unrelated stock photos); the first-letter pink-gradient fallback is the
  intended look.

## Method note
These passes read every file and cross-checked claims against source; the
`fileToBase64` footgun, the dead character flow, and the orphaned `project_events`
table they flagged were all subsequently resolved (see the roadmap progress log
and `crochet-time-structure.md`).
