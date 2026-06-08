---
name: Deep review fixes
description: Bugs found and fixed during the full end-to-end code review of all app files.
---

## Session 1 — confirmed bugs fixed

**1. Noisy "Pattern Updated" toast on every auto-save**
- File: `client/src/components/PatternViewer.tsx`, `updatePatternMutation.onSuccess`
- Every step count/completion change and favorite toggle triggered the toast. Removed the toast from `onSuccess`; only the "finished" celebration fires now.
- **Why:** These are incremental, silent auto-saves — showing a toast on every step click is disruptive.

**2. `wizardColors` never sent to pattern generation API**
- File: `client/src/components/PatternInputRefactored.tsx`
- The color picker in Step 2 collected colors but never passed them. Fixed by appending color hex codes as a "Colour palette:" hint in the prompt string.
- **Why:** `generatePatternMutation` only received `PatternInputFormData` which has no color field; the `wizardColors` state was local-only.

**3. `/api/patterns` cache not invalidated after new pattern creation**
- File: `client/src/components/PatternInputRefactored.tsx`
- After `savePatternMutation` succeeds, `queryClient.invalidateQueries({ queryKey: ['/api/patterns'] })` now runs. Without this, the library showed stale data for up to 5 minutes.

**4. `regenNote` in "Regenerate this section" panel was ignored**
- Files: `PatternViewer.tsx` (frontend) + `server/routes.ts` (backend)
- The inline section-regen textarea accepted a note but never passed it. Fixed:
  - `handleRegeneratePattern(userNote?)` now accepts an optional note.
  - `regenerateStepsMutation` sends `{ userNote }` in the POST body.
  - Server `/api/patterns/:id/regenerate` appends the note to the prompt.

**5. `editedNotes` in `PatternSection` didn't sync with prop changes**
- File: `client/src/components/PatternSection.tsx`
- Added a `useEffect` that updates `editedNotes` from `section.notes` whenever `section.notes` changes and the user isn't currently editing.

## Session 2 — confirmed bugs fixed

**6. PatternDetailScreen favMutation — missing cache invalidation**
- `PatternDetailScreen.tsx` toggling favourite updated local `isFav` state but never called `queryClient.invalidateQueries({ queryKey: ["/api/patterns"] })`. Library and Favourites screens would not reflect the change until cache expired.
- Fixed: imported `queryClient` and added `invalidateQueries` in `onSuccess`.

**7. PatternDetailScreen favMutation — sending full pattern body**
- `favMutation` was sending `{ ...pattern, favorite: fav }` — the entire pattern object including all section text and image data. Changed to `{ favorite: fav }` only.
- Server PUT endpoint uses `patternSchema.partial()` so partial bodies are always accepted.

**8. SearchScreen "RECENT SEARCHES" label**
- Hardcoded suggestion chips were labelled "RECENT SEARCHES" (factually wrong — static, not user history). Changed to "Try searching for".

**9. CommunitySubmitScreen step-0 name validation gap**
- "Next: Photos" button advanced without requiring a Pattern Name; the name check only blocked the final submit button.
- Fixed: early-return toast fires on step 0 when `form.name` is empty.

**10. ProjectsScreen invalid Tailwind class**
- Stash shortcut icon used `h-4.5 w-4.5` (not a valid Tailwind utility). Changed to `h-5 w-5`.

## Key architecture notes (from walkthrough)
- PatternViewer "Start Project" button (Overview tab) changes status `"pattern" → "active"` + sets `startedAt`. "Mark finished" → `"finished"`. Both via `updatePatternMutation`.
- ProjectsScreen intentionally shows only `active` and `finished` — `"pattern"` status patterns live in the Library until user starts them. By design.
- Server PUT `/api/patterns/:id` uses `patternSchema.partial()` — always safe to send partial bodies.
- Notification bell on Home: `communityPatterns.length - lastSeenCount` (localStorage key `crochet-time-community-seen`). Dynamic, not hardcoded.
- Default query fetcher: `queryKey.map(String).join("/")` — so `["/api/community", id]` → `/api/community/${id}`.
