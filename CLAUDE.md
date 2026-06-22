# CLAUDE.md

Quick-start for Claude Code in this repo. **Single sources of truth:** delivery
state & plans live in `docs/CROCHET_TIME_ROADMAP_2026-06-09.md`; architecture
facts in `.agents/memory/` (start at `MEMORY.md`). This file is the fast path.

## What this is

Crochet Time — a cozy, AI-assisted crochet companion built for one family.
React 18 + Vite + Tailwind (client) · Express + Drizzle ORM on Postgres
(Neon/Replit) (server) · OpenAI text/vision/image · TanStack Query · wouter.

## Commands

```bash
npm run dev        # dev server — needs DATABASE_URL (+ OPENAI_API_KEY for AI)
npm run check      # tsc typecheck — run before every commit
npm run build      # production build
npm run test:unit  # vitest — yarn-estimate + stash-match + time-merge math
npm run test:e2e   # Playwright — fully mocked API, no DB/key needed
npm run smoke      # full-stack API smoke vs a REAL server + Postgres
```

CI gates on three jobs: **typecheck + e2e + fullstack-smoke** — keep all green.

## Conventions that bite

- **Verify before committing:** `npm run check` + `npm run test:unit` +
  `npm run build`. e2e/smoke select by visible **text/role**, so keep DOM text
  and roles stable through refactors.
- **Colours → tokens.** Use `palette.<token>` from `client/src/lib/theme.ts`
  (ink, clay, rose, sage, purple, amber, teal, gold, brown, …). Do **not** add
  new raw hex literals in `style` props.
- **Back buttons → shared component.** Use
  `<BackButton onClick bg color />` (`client/src/components/BackButton.tsx`); it
  carries the `aria-label`. Don't hand-roll header back buttons.
- **File → image data → shared helpers.** Use `fileToDataUrl` (full
  `data:…;base64,…`) or `fileToBase64` (payload only) from
  `client/src/lib/utils.ts`. Do **not** re-implement `FileReader`.
- **UI primitives are minimal.** Only these `components/ui/*` exist (the rest
  were deleted as unused in PR #48): **button, dialog, alert-dialog, input,
  label, textarea, tabs, toast, toaster**. Need another shadcn primitive?
  Re-add the file **and** its npm dep — don't assume it's installed.
- **Profiles are automatic.** Every `/api/` call is profile-stamped centrally in
  `client/src/lib/queryClient.ts`; never append `?profile=` by hand.
- **Schema heals at boot.** Apply DB changes via idempotent heals in
  `server/ensureSchema.ts` — there are no drizzle migrations.

## Layout

- Routes / orchestrator: `client/src/App.tsx` (wouter, URL-driven)
- Shell + mobile nav: `client/src/components/AppShell.tsx`; desktop `Sidebar.tsx`
- Screens: `client/src/pages/`; shared components: `client/src/components/`
- Home: `components/HomeWorkbench.tsx` + presentational pieces in `components/home/`
- Pattern viewer: `components/PatternViewer.tsx` + `components/pattern-viewer/*`
  (hooks: `usePatternViewer`, `usePatternRegen`, `useSectionEditing`)
- Server: `server/` — `routes.ts` is a thin orchestrator; endpoints live in
  `server/routes/<domain>Routes.ts` (auth, push, media, ai, pattern, stash,
  community, account, diagnostics, backup). Also `ensureSchema.ts`, `api/*`.
- Architecture memory: `.agents/memory/` (index: `MEMORY.md`)
