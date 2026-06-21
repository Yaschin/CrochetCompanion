# Push reminders

Opt-in web-push nudges, per family profile. Two kinds: a daily "crochet time"
nudge at a chosen time, and an "inactive project" nudge when an in-progress
project has gone quiet (`INACTIVE_DAYS = 4`).

## Opt-in / config
- Dormant unless **VAPID keys** are set (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  optional `VAPID_SUBJECT`) — `pushConfigured()` gates everything. So dev, CI and
  smoke need no keys.
- Deploy target is **autoscale** (no always-on process), so sending is driven by
  an external scheduler hitting `POST /api/push/run-due` (protect with
  `CRON_SECRET` → `x-cron-secret` header or `?secret=`; that route is exempt from
  the household gate in `requireAuth`). `ENABLE_REMINDER_LOOP=1` runs an
  in-process `setInterval` instead, for always-on hosts.

## Server
- `server/reminderLogic.ts` — **pure**, unit-tested decision logic (no DB):
  `localNow` (tz→date+minutes via Intl), `dailyDue`, `lastActivity` (max
  workSession `end`, else `createdAt`), `pickInactiveProject`, `inactiveDue`.
- `server/reminders.ts` — orchestration: per-profile prefs in `app_meta`
  (`reminder_prefs:<profileId>` JSON via getMeta/setMeta), reads patterns/subs,
  sends, writes `lastDailySentOn`/`lastInactiveSentOn` for dedupe.
- `server/push.ts` — `web-push` config + `push_subscriptions` table (heal in
  ensureSchema) storage; `sendToSubscriptions` prunes 404/410 (gone) subs.
- Routes: `GET /api/push/vapid-key`, GET/POST `/api/push/prefs`,
  `POST /api/push/subscribe` `{subscription, prefs?}`, `/api/push/unsubscribe`
  `{endpoint}`, `/api/push/test`, `/api/push/run-due`.

## Client
- `client/src/lib/push.ts` — support detection, permission, subscribe/unsubscribe
  (VAPID key → `applicationServerKey`), prefs API, `isIosUninstalled()` hint.
- `client/src/components/RemindersCard.tsx` — Settings card (enable per device,
  toggle daily + time, toggle inactive, send test). Subscription is profile-
  stamped server-side via `?profile=`.
- `client/public/sw.js` — `push` + `notificationclick` handlers (icon =
  char-bee; click focuses/opens the payload `url`). SW registers in prod, or
  on-demand when reminders are enabled.

## Tests
- `tests/unit/reminders.test.ts` (13 cases) cover the pure logic.
- `scripts/fullstack-smoke.mjs` exercises prefs round-trip, subscribe
  validation/storage, run-due no-op (no keys), test→503, unsubscribe.
