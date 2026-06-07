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
