# Imported source files (original PDFs)

The PDF-import wizard (`pattern-input/PdfWizard.tsx` → `POST /api/parse-pdf` →
`parsePattern.ts`) parses a PDF into a structured pattern. This feature **also
keeps the original PDF** so you can refer back to it.

## Data
- `patterns.sourceFiles` jsonb column (`SourceFile[]`), healed in `ensureSchema`
  (`ADD COLUMN IF NOT EXISTS`). Type in `shared/schema.ts` (`SourceFile`) +
  `patternSchema` zod; mirrored in client `types.ts`.
- `SourceFile = { key, name, type:"pdf", size?, pages?, addedAt }`. Bytes live in
  object storage (`uploadBuffer` → `/api/media/<key>`); this is metadata only.
- `storage.ts` round-trips it via `rowToPattern` + `patternToColumns` (must be
  listed in both, like `workSessions`).

## Server (`routes.ts`)
- `POST /api/patterns/:id/source-files` `{ files:[{name, base64}] }` — validates
  `%PDF-` header + 10 MB cap, derives `pages` via the lazy `pdfParseFn`, uploads
  as `application/pdf`, appends metadata. **Stored at save, not at parse**, so
  cancelled imports never orphan an upload. Returns 503 if object storage is
  unconfigured.
- `DELETE /api/patterns/:id/source-files/:key` — drops metadata + `deleteObject`.
- Pattern delete now also `deleteObject`s each source file (no orphans).
- Served by existing `GET /api/media/:key` — `streamObject` sets `Content-Type`
  from stored metadata, so PDFs render inline in an `<iframe>`.

## Client
- `lib/documents.ts` — pure helpers (`formatBytes`, `fileMetaLabel`,
  `collectDocuments`, `totalDocumentCount`, `isIos`) + API (`attachSourceFiles`,
  `deleteSourceFile`). PdfWizard calls `attachSourceFiles` after save.
- `SourcePdfViewer.tsx` — file switcher + `<iframe>` (desktop/Android) or an
  "Open PDF" button on iOS (iframe PDFs are unreliable there).
- `PatternViewer` — adds a **Source** tab *only when files exist*, kept mounted
  (toggled with `hidden`) so the PDF keeps its page when you flip away; plus a
  floating "Original" button → a lazy-mounted **peek sheet** (bottom sheet /
  desktop right panel) for reading alongside a step.
- Files library — `DocumentsList.tsx` rendered as a **segment in `PatternLibrary`**
  ("Patterns / Files"); `ViewType "documents"` (`/documents`, Sidebar "Files")
  lands on that segment. Tap a file → full-screen viewer; "Open pattern" → viewer.

## Tests
- `tests/unit/documents.test.ts` — the pure helpers.
- `fullstack-smoke.mjs` — validation (400/415 without storage) + happy path
  (store → read on pattern → `/api/media` serves `application/pdf` → delete),
  tolerating a 503 where object storage isn't configured.
