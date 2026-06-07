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
