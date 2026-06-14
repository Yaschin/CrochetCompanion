# Testing — the four layers

| Layer | Command | Where it runs | What it proves |
|---|---|---|---|
| Unit | `npm run test:unit` | CI (typecheck job) | yarn-estimate + stash-coverage math |
| Browser e2e | `npm run test:e2e` | CI | every screen & journey, mocked API, 3 viewports |
| **Full-stack smoke** | `npm run smoke` | **CI (postgres:16 service)** | 36 assertions vs a real server + real Postgres: scoping, doing=starting, make-alongs, exports, AI fallbacks, same-title dedup safety, import skip-and-report, work-check degradation |
| Visual walkthroughs | `npm run walkthrough[:deep]` | on demand | full-page screenshots of every screen / 17 interaction journeys |

The full-stack smoke needs `scripts/create-base-tables.sql` + a localhost
Postgres (see README). It exists because the browser suite mocks the API —
on its first run it caught a fresh-DB boot crash and a silently-dead
`creatorId` column that mocks could never see.

# End-to-End Testing (Playwright)

A cross-screen, cross-viewport Playwright suite lives in [`tests/e2e/`](../tests/e2e).

## What it covers

For **every primary screen** and the key **deep flows**, at **three viewports**
(mobile 390×844, tablet 768×1024, desktop 1440×900), it asserts:

- the screen renders (a known element is visible),
- there is **no horizontal overflow** at that viewport,
- **no real console / page errors** fired (environmental noise like blocked
  external images is filtered out),

and saves a **full-page screenshot** per screen per viewport into `test-results/`
for visual responsive review.

Screens exercised: splash, the first-run **family profile picker** (splash →
"Who's crocheting today?" → enter as Mummy → personalised home), home, create
(AI Studio), library, favorites, projects, community, community detail,
community submit wizard, pattern viewer (+ Overview/Pattern/Notes tabs), the
stitch-counter modal, and the pattern detail screen — **14 scenarios × 3
viewports = 42 tests**.

Two device-local flags are preset by `enterApp()` (via `addInitScript`) so
ordinary tests skip first-run flows deterministically:

- `crochet-time:profile = "larissa"` — skips the profile picker;
- `crochet-time-tutorial-v1 = "completed"` — keeps the tutorial welcome
  overlay from intercepting clicks.

The picker has its own dedicated test that deliberately leaves the profile
unset. Fixtures also mock `GET /api/profiles`, and the mock router dispatches
on `pathname`, so the `?profile=` query parameter appended to every API call
is transparently tolerated.

## No database required

The suite is **frontend-only**. `tests/e2e/helpers.ts` intercepts every
`/api/**` request with fixtures, so you do **not** need `DATABASE_URL`, an
OpenAI key, object storage, or the Express server. It builds the client and
serves it with `vite preview`.

## Running it

```bash
# 1) install deps (needs a working npm — see note below)
npm install

# 2) one-time: download the Playwright browser
npm run test:e2e:install

# 3) run the suite across all three viewports
npm run test:e2e

# optional: open the HTML report (and see the per-viewport screenshots)
npm run test:e2e:report
```

Run a single project (viewport):

```bash
npx playwright test --project=mobile      # or tablet / desktop
```

### Running against the real, running app instead of the mocked build

If you have the full stack running (e.g. `npm run dev` with a provisioned DB +
OpenAI key on port 5000), point the suite at it — the `/api` mocks still apply,
so behaviour is consistent:

```bash
E2E_BASE_URL=http://localhost:5000 npm run test:e2e
```

## ⚠️ Not yet executed in the cloud sandbox

This suite was **authored but could not be executed** in the Claude Code web
sandbox, because that environment cannot run the app or install Playwright:

- `DATABASE_URL` / `OPENAI_API_KEY` are unset, and `server/db.ts` throws at
  import — the Express server cannot boot.
- `npm` is broken in the sandbox (`ENOTEMPTY` on install; `node_modules/.bin`
  binaries such as `vite`/`tsx`/`playwright` are not linked), so
  `@playwright/test` and its browsers cannot be installed.

Because of this, **run it once on a real machine / CI and expect a first-pass
selector tweak**: the app is a single-page `useState` view-switcher (no URL
routes), so navigation is done by clicking nav controls. The two nav systems use
slightly different labels per breakpoint (mobile bottom bar “Create” vs desktop
sidebar “AI Studio”), which `navByLabel()` already accounts for, but real UI text
should be confirmed on first run.

## Suggested CI

A GitHub Actions workflow can run this on every PR (none exists today):

```yaml
# .github/workflows/e2e.yml
name: e2e
on: [pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: playwright-report }
```
