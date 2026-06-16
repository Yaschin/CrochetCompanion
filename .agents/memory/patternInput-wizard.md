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
- `AiWizard.tsx` / `OwnWizard.tsx` / `PdfWizard.tsx` — the three mode flows, each rendered as `{mode === X && <…Wizard …/>}`

Pure structural extraction: the wizards are presentational — every state value/setter/
handler is passed as a prop (PdfWizard has ~28 props, reflecting the PDF-edit state),
so the rendered DOM is unchanged. A future cleanup could co-locate each mode's state
into its wizard to shrink those prop lists.
