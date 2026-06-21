/**
 * Lightweight household gate.
 *
 * One shared passcode protects the whole app (it's built for a single family).
 * Enforcement is server-side: every `/api/*` route except `/api/auth/*` runs
 * through `requireAuth`, so the data is actually protected — not just the UI.
 *
 * Sessions are stateless: on success we set a signed, httpOnly cookie (HMAC of
 * an expiry timestamp). No DB/session store, so it works fine on Replit
 * autoscale where requests may hit different instances. The cookie is
 * long-lived and slides forward on use, so a device that has logged in once
 * stays trusted — only a genuinely new device (no cookie) sees the lock screen.
 *
 * The gate is OPT-IN: when `HOUSEHOLD_PASSCODE` is unset/blank the app is open,
 * so local dev, CI, e2e and smoke keep working without extra setup. Set the
 * secret in the deployment environment to switch it on.
 */
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const COOKIE = "hh_session";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_AGE_MS = 365 * DAY_MS; // trusted device ~1 year
const RENEW_BELOW_MS = 180 * DAY_MS; // slide the cookie forward when under half its life remains

/** The configured shared passcode, or "" when the gate is disabled. */
function passcode(): string {
  return (process.env.HOUSEHOLD_PASSCODE ?? "").trim();
}

/** Whether the household gate is switched on (a passcode is configured). */
export function authRequired(): boolean {
  return passcode().length > 0;
}

/**
 * Key used to sign session cookies. A dedicated SESSION_SECRET is preferred;
 * otherwise we derive it from the passcode so that rotating the passcode also
 * invalidates every existing session. The literal passcode never leaves the
 * server — only an HMAC of an expiry timestamp does.
 */
function signingKey(): string {
  const secret = (process.env.SESSION_SECRET ?? "").trim();
  return secret || `hh-session:${passcode()}`;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/** Constant-time string compare that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Compare something of equal length to keep timing roughly constant.
    crypto.timingSafeEqual(bb, bb);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/** Issue a fresh session token: "<expiryEpochMs>.<signature>". */
export function issueToken(now = Date.now()): string {
  const exp = String(now + MAX_AGE_MS);
  return `${exp}.${sign(exp)}`;
}

function verifyToken(token: string | undefined, now = Date.now()): { ok: boolean; exp?: number } {
  if (!token) return { ok: false };
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return { ok: false };
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(exp))) return { ok: false };
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs <= now) return { ok: false };
  return { ok: true, exp: expMs };
}

/** Validate a passcode attempt against the configured one (constant-time). */
export function checkPasscode(input: unknown): boolean {
  const expected = passcode();
  if (!expected) return false;
  return safeEqual(typeof input === "string" ? input.trim() : "", expected);
}

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function readToken(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[COOKIE];
}

/** True when the request carries a valid, unexpired session cookie. */
export function isAuthenticated(req: Request): boolean {
  return verifyToken(readToken(req)).ok;
}

function secureCookie(req: Request): boolean {
  return (
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production"
  );
}

export function setSessionCookie(req: Request, res: Response, token = issueToken()): void {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(req),
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE, { path: "/" });
}

// ── Brute-force throttle ─────────────────────────────────────────────────────
// Per-IP, in-memory. Enough to blunt online guessing of a shared passcode; not
// a distributed limiter (each autoscale instance keeps its own counters).
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; first: number }>();

export function loginThrottled(ip: string): boolean {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > ATTEMPT_WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

export function noteFailedLogin(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > ATTEMPT_WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
  } else {
    rec.count += 1;
  }
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}

/**
 * Gate middleware: protects `/api/*` (except `/api/auth/*`) when the household
 * passcode is configured. Renews a near-expiry cookie so active devices stay
 * trusted. Non-API requests (the client bundle, the lock screen) pass through.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith("/api") || req.path.startsWith("/api/auth/")) return next();
  // The reminder scheduler is called by external cron without a session cookie;
  // it authenticates itself with CRON_SECRET inside the handler.
  if (req.path === "/api/push/run-due") return next();
  if (!authRequired()) return next();

  const { ok, exp } = verifyToken(readToken(req));
  if (!ok) {
    res.status(401).json({ message: "Locked", code: "auth_required" });
    return;
  }
  if (exp && exp - Date.now() < RENEW_BELOW_MS) setSessionCookie(req, res);
  next();
}
