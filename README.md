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
  streaks, gauge, up-next pin and backups; community is the shared space with
  **family make-alongs** (everyone makes the same pattern, shared race board)
- **Making tools** — row-by-row follow mode with a "you are here" section map,
  in-round stitch tally, voice control ("done"/"back"/"stitch"), tappable stitch
  glossary with how-to videos, 25/50/75% milestone moments, and Ashi the AI
  coach for "I'm stuck on this exact round"; voice stitch counter with
  wake-lock; progress photos with AI alignment-check; gauge-aware AI resize /
  yarn substitution; branded Print/PDF export; shareable project story cards
- **Trust** — durable object storage for media, JSON backup/restore,
  installable offline-first PWA, Settings → App health self-diagnostics,
  📸 ball-band scanner (photo a yarn label → stash item pre-filled)
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
npm run test:e2e   # Playwright browser suite — fully mocked API, no DB/key needed
npm run test:unit  # vitest — yarn-estimate + stash-match math
npm run smoke      # full-stack API smoke vs a REAL server + Postgres (see below)
npm run walkthrough        # on-demand: screenshot every screen (mobile+desktop)
npm run walkthrough:deep   # on-demand: 17 interaction journeys (mobile+tablet)
```

### Full-stack testing locally

`server/db.ts` speaks Neon WebSocket in production and plain node-postgres for
localhost URLs, so a real end-to-end run needs only a local Postgres:

```bash
createdb crochet
psql crochet -f scripts/create-base-tables.sql
DATABASE_URL=postgresql://localhost/crochet npx tsx server/index.ts &
npm run smoke      # 36 assertions; also runs in CI via a postgres:16 service
```

Schema changes apply automatically at boot via idempotent heals in
`server/ensureSchema.ts`; one-time starter content is marker-guarded.

### Household passcode (optional gate)

Set `HOUSEHOLD_PASSCODE` to require a shared passcode before the app opens.
Enforcement is server-side (`server/auth.ts`): every `/api/*` route except
`/api/auth/*` is gated, and a signed, httpOnly cookie keeps a device trusted for
~1 year (sliding), so only a new device sees the lock screen. Leave the variable
**unset to disable the gate** — that's why dev, CI, e2e and smoke stay open.
Optionally set `SESSION_SECRET` to sign sessions independently of the passcode
(otherwise the key is derived from the passcode, so rotating it logs everyone
out). To turn it on in production, add `HOUSEHOLD_PASSCODE` as a Replit secret.

### Push reminders (optional)

Web-push nudges (a daily crochet-time reminder + a "your project is waiting"
poke), opt-in per person in **Settings → Reminders**. Off unless the server has
VAPID keys, so dev/CI/smoke need no setup. To enable:

1. Generate keys once: `npx web-push generate-vapid-keys`.
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (and optionally `VAPID_SUBJECT`,
   a `mailto:` / URL) as secrets.
3. Drive the scheduler. The app deploys to **autoscale** (no always-on process),
   so reminders are sent when something hits `POST /api/push/run-due`. Point a
   periodic trigger (Replit Scheduled Deployment, GitHub Actions cron, or a free
   service like cron-job.org) at it every ~10–15 min, and protect it by setting
   `CRON_SECRET` and sending it as the `x-cron-secret` header (or `?secret=`).
   On an always-on host you can instead set `ENABLE_REMINDER_LOOP=1` to run the
   loop in-process.

Note: iOS only delivers web push to a PWA that's been **added to the home
screen** — the Settings card says so when it detects an uninstalled iOS browser.

## Docs

| Doc | Purpose |
|---|---|
| [`docs/CROCHET_TIME_ROADMAP_2026-06-09.md`](docs/CROCHET_TIME_ROADMAP_2026-06-09.md) | **SSOT** — current state, phases, progress log, post-deploy checklist |
| [`docs/CROCHET_TIME_PROFILES_PLAN_2026-06-09.md`](docs/CROCHET_TIME_PROFILES_PLAN_2026-06-09.md) | Family profiles design + implementation notes |
| [`docs/E2E_TESTING.md`](docs/E2E_TESTING.md) | Playwright suite: coverage, mocks, how to run |
| [`docs/material-calculation-system.md`](docs/material-calculation-system.md) | Yarn estimation + stash matching internals |
| [`docs/CROCHET_TIME_PHOTO_COACH_DESIGN.md`](docs/CROCHET_TIME_PHOTO_COACH_DESIGN.md) | Design + build record for the photo "fix-my-mistake" coach (shipped 2026-06-14) |
| [`docs/CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`](docs/CROCHET_TIME_STATUS_REVIEW_2026-06-07.md) | Historical architecture record (Batches A–D) |
| `docs/archive/` | Superseded early planning docs |

Made with ♡ for Larissa — and now the whole family.
