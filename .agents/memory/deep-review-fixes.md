---
name: Deep review fixes
description: Bugs found and fixed during the full end-to-end code review of all app files.
---

## Confirmed bugs fixed

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
  - Server `/api/patterns/:id/regenerate` appends the note to the prompt: `${title}. Additional instructions: ${userNote}`.

**5. `editedNotes` in `PatternSection` didn't sync with prop changes**
- File: `client/src/components/PatternSection.tsx`
- Added a `useEffect` that updates `editedNotes` from `section.notes` whenever `section.notes` changes and the user isn't currently editing.

## Default query fetcher behaviour
- `queryKey.map(String).join("/")` — so `["/api/community", id]` → `/api/community/${id}`. Array keys with a leading-slash first segment correctly build hierarchical API paths.
