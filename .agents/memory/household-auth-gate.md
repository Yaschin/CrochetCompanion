# Household auth gate

Optional shared-passcode gate protecting the whole app (one family, one
passcode). Added after the roadmap was delivered.

## Server (`server/auth.ts`)
- Opt-in via `HOUSEHOLD_PASSCODE` env. **Unset/blank ⇒ gate off** — that's why
  dev, CI, e2e and smoke stay open with no extra setup.
- Stateless sessions: signed httpOnly cookie `hh_session` = `"<expiryMs>.<HMAC>"`
  (HMAC-SHA256). No DB/session store, so autoscale-safe. Key = `SESSION_SECRET`
  if set, else derived from the passcode (rotating passcode logs everyone out).
- Cookie is ~1 year and **slides forward** when under half its life remains, so a
  device that logged in once stays trusted — only a new device (no cookie) sees
  the lock screen ("only ask on a new device").
- `requireAuth` middleware (registered first in `registerRoutes`) gates every
  `/api/*` except `/api/auth/*`. Constant-time passcode compare; per-IP in-memory
  login throttle (8 tries / 15 min ⇒ 429).
- Routes: `GET /api/auth/status` (public → `{required, authenticated}`),
  `POST /api/auth/login` `{passcode}`, `POST /api/auth/logout`.

## Client
- `client/src/components/AuthGate.tsx` wraps `<App/>` in `main.tsx` (provider-free,
  does its own `fetch`). Boots → `GET /api/auth/status`; shows the lock screen
  only when `required && !authenticated`. Server unreachable ⇒ falls through to
  the app (don't trap the user behind an unverifiable lock).
- A 401 from any request re-locks via the `hh-auth-locked` window event
  dispatched from `queryClient.ts` (`onAuthExpired`). Requests already send the
  cookie (`credentials: "same-origin"`, same origin as the API).
- e2e mocks `/api/auth/*` in `tests/e2e/helpers.ts` (gate reported off).
