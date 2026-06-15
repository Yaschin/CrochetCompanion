---
name: PatternViewer tabs design
description: PatternViewer redesign details — tabs, props, inline regen, tools grid
---

PatternViewer (`client/src/components/PatternViewer.tsx`) was redesigned with 3 tabs:
- **Overview**: two-col card (image + specs), progress bar, 4-button tools grid (Row Counter / Progress / Photos / Yarn Info), Materials list, Download + New Image buttons
- **Pattern**: sections accordion + per-section inline regen panel (⚡ button per section expands textarea + Regenerate)
- **Notes**: free textarea saved locally

Props interface: `{ pattern, onPatternUpdated, onNavigate? }` — `onNavigate` is used for the tools grid shortcuts.

State added: `activeTab`, `regenSection`, `regenNote`, `notes`.

Header shows "Saved just now" chip + favorites heart button.

**Why:** Flat-card layout was hard to scan; tabs separate overview/editing/notes concerns clearly.

## Component decomposition (2026-06-15)
`PatternViewer.tsx` (was 1486 lines) is now a thin orchestrator that keeps all
state/mutations/handlers and composes presentational children in
`client/src/components/pattern-viewer/`:
- `PatternViewerHeader.tsx` — editable title, status/spec badges, favorite toggle
- `OverviewTab.tsx` — cover/specs, lifecycle buttons, tools grid, adapt panel, materials
- `PatternTab.tsx` — sections accordion, per-section inline regen + alignment check, regenerate-all
- `NotesTab.tsx` — notes textarea + save
- `PatternViewerDialogs.tsx` — the 3 modals (regenerate-all, share-to-community, image regen)

Children are pure/presentational: every callback + value is passed as a typed prop,
so the rendered DOM is unchanged (e2e selects by visible text/role). The parent still
owns the 9 mutations + the AI-error-handling blocks — a future cleanup could lift those
into a `usePatternViewer` hook.
