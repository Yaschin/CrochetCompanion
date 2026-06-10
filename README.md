# Crochet Time 🧶

A cozy, AI-assisted crochet companion built for one family. Generate patterns
with AI (text + vision + images), follow them step-by-step, count rows
hands-free, track projects to a celebratory finish, manage a yarn stash, and
share makes in a family community gallery.

**Live app:** deployed on Replit (autoscale) · **Status & plans:**
[`docs/CROCHET_TIME_ROADMAP_2026-06-09.md`](docs/CROCHET_TIME_ROADMAP_2026-06-09.md)
is the source of truth.

## Highlights

- **AI pattern studio** — describe an item (or upload an inspiration photo /
  paste an existing pattern) and get a structured, editable pattern with
  materials, sections and steps; per-section regeneration preserves locked steps
- **Family profiles** — "Who's crocheting today?" (Larissa, Vumsh, Akka,
  Mummy): no passwords, each with their own library, projects, stash, notes,
  streaks and backups; community is the shared space
- **Making tools** — row-by-row follow mode, voice-controlled stitch counter
  with wake-lock, progress photos with AI alignment-check, AI resize / yarn
  substitution, branded Print/PDF export
- **Trust** — durable object storage for media, JSON backup/restore,
  installable offline-first PWA, Settings → App health self-diagnostics
- **Guided onboarding** — interactive tour (restartable from Settings)

## Stack

React 18 + Vite + Tailwind (client) · Express + Drizzle ORM on Replit
Postgres/Neon (server) · OpenAI (`gpt-4.1` text/vision, `gpt-image-1` images —
env-overridable via `OPENAI_TEXT_MODEL` / `OPENAI_IMAGE_MODEL`) · Google Cloud
object storage via Replit integration · wouter routing · TanStack Query.

## Running

```bash
npm install
npm run dev        # needs DATABASE_URL (+ OPENAI_API_KEY for AI features)
npm run check      # typecheck
npm run build      # production build
npm run test:e2e   # Playwright suite — fully mocked API, no DB/key needed
```

Schema changes apply automatically at boot via idempotent heals in
`server/ensureSchema.ts`; one-time starter content is marker-guarded.

## Docs

| Doc | Purpose |
|---|---|
| [`docs/CROCHET_TIME_ROADMAP_2026-06-09.md`](docs/CROCHET_TIME_ROADMAP_2026-06-09.md) | **SSOT** — current state, phases, progress log, post-deploy checklist |
| [`docs/CROCHET_TIME_PROFILES_PLAN_2026-06-09.md`](docs/CROCHET_TIME_PROFILES_PLAN_2026-06-09.md) | Family profiles design + implementation notes |
| [`docs/E2E_TESTING.md`](docs/E2E_TESTING.md) | Playwright suite: coverage, mocks, how to run |
| [`docs/material-calculation-system.md`](docs/material-calculation-system.md) | Yarn estimation + stash matching internals |
| [`docs/CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`](docs/CROCHET_TIME_STATUS_REVIEW_2026-06-07.md) | Historical architecture record (Batches A–D) |
| `docs/archive/` | Superseded early planning docs |

Made with ♡ for Larissa — and now the whole family.
