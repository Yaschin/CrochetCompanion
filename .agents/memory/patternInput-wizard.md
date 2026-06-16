---
name: PatternInput wizard
description: How the 5-step wizard was implemented in PatternInputRefactored
---

PatternInputRefactored (`client/src/components/PatternInputRefactored.tsx`) was converted from a single-form to a 5-step wizard:
- Step 0: Item type (category buttons)
- Step 1: Description + skill level + size
- Step 2: Yarn type + colour swatches
- Step 3: Inspiration image upload (skippable)
- Step 4: Review summary + Generate button

**Approach**: All API mutations (lines 1–~340) were preserved exactly. Only the `return` JSX block was replaced + new state vars added (wizardStep, wizardColors, constants).

**Pitfall**: When using `edit` to replace only the opening part of a `return` block, the rest of the old JSX stays in the file as broken code. Solution: use `sed -i 'N,Md'` to delete the stale lines after replacement.

**Why:** The original flat form was hard to navigate and showed all fields at once. The wizard improves progressive disclosure.

## Component decomposition (2026-06-16)
`PatternInputRefactored.tsx` (was 1389 lines) is now a 553-line orchestrator that
owns all state/mutations/handlers + the shared chrome (mode toggle, progress bar,
character tip) and composes pieces from `client/src/components/pattern-input/`:
- `constants.ts` — CATEGORIES/SKILL_LEVELS/YARN_TYPES/COLOR_PALETTE/SIZE_OPTIONS, the *_STEPS, *_TIPS, PDF_LOADING_MSGS arrays
- `helpers.ts` — fileToDataUrl, fileToBase64, buildPatternToSave
- `Pickers.tsx` — CategoryPicker/SkillPicker/YarnPicker/SizePicker (take `{ formData, setFormData }`)
- `AiWizard.tsx` / `OwnWizard.tsx` — the AI/own flows (presentational, take props)
- `PdfWizard.tsx` — **self-contained** (2026-06-16): owns all PDF state + its parse/save
  mutations + handlers and renders its own chrome; the parent passes only `onPatternCreated`.
- `WizardChrome.tsx` — shared progress-bar + character-tip; rendered by the parent for
  the ai/own wizards and by `PdfWizard` for itself.

The parent (`PatternInputRefactored.tsx`, ~320 lines) keeps the mode toggle + AI/own
state. Mode switching resets each flow via unmount (PdfWizard) or `switchMode`
(ai/own) — behavior-equivalent. AiWizard/OwnWizard still take props; co-locating their
state too would let the parent shed its `switchMode`/chrome plumbing entirely.
