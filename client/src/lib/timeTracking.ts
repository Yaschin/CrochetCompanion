/**
 * Per-project work-session time tracking. The app already records *calendar*
 * elapsed since a project was started (formatTimeSpent); this tracks the actual
 * time spent crocheting via a start/stop timer, accumulated into sessions.
 *
 * localStorage is the fast, offline path (profile-scoped, like the activity
 * log). The durable copy rides on the pattern row's `workSessions` column —
 * WorkTimer write-throughs to the server and merges the two on load — so
 * tracked time now survives a reinstall and lands in the backup export. The
 * pure helpers below are unit-tested; the storage wrappers are failure-tolerant.
 */
import { getActiveProfile } from "./profile";

export interface WorkSession {
  start: string; // ISO timestamp the session began
  end: string;   // ISO timestamp the session ended
  ms: number;    // duration in milliseconds (end - start)
}

const sessionsKey = (patternId: string) => `crochet-time:work-sessions:${getActiveProfile().id}:${patternId}`;
const runningKey = (patternId: string) => `crochet-time:work-running:${getActiveProfile().id}:${patternId}`;

/** Cumulative duration, "1h 23m" / "23m" / "45s" — for totals at a glance. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** Stopwatch face, "M:SS" or "H:MM:SS" — for the live, ticking session. */
export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** Sum of valid session durations; ignores any malformed/negative entries. */
export function totalMs(sessions: WorkSession[]): number {
  return sessions.reduce((sum, s) => sum + (s && Number.isFinite(s.ms) && s.ms > 0 ? s.ms : 0), 0);
}

/** Build a session from start/end epoch-ms, or null if the span is invalid. */
export function makeSession(startMs: number, endMs: number): WorkSession | null {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  const ms = endMs - startMs;
  if (ms <= 0) return null;
  return { start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString(), ms };
}

/**
 * Union two session lists, de-duplicating by `start` (each session is stamped
 * once at creation, so the same session has the same start in both copies) and
 * ordering newest-first. Used to reconcile the device-local cache with the
 * durable copy on the pattern without ever double-counting a session.
 */
export function mergeSessions(a: WorkSession[], b: WorkSession[]): WorkSession[] {
  const byStart = new Map<string, WorkSession>();
  for (const s of [...(a ?? []), ...(b ?? [])]) {
    if (s && Number.isFinite(s.ms) && s.ms > 0 && typeof s.start === "string" && s.start.length > 0) {
      if (!byStart.has(s.start)) byStart.set(s.start, s);
    }
  }
  return [...byStart.values()].sort((x, y) => (x.start < y.start ? 1 : -1)).slice(0, 200);
}

/** Total time crocheted across every project — for a lifetime stat. */
export function lifetimeMs(patterns: { workSessions?: WorkSession[] }[]): number {
  return patterns.reduce((sum, p) => sum + totalMs(p?.workSessions ?? []), 0);
}

// ── localStorage wrappers (failure-tolerant) ──────────────────────────────────
export function getSessions(patternId: string): WorkSession[] {
  try {
    const raw = localStorage.getItem(sessionsKey(patternId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x.ms === "number") : [];
  } catch {
    return [];
  }
}

/** Overwrite the local session cache with the full (already-merged) list. */
export function saveSessions(patternId: string, sessions: WorkSession[]): void {
  try { localStorage.setItem(sessionsKey(patternId), JSON.stringify(sessions.slice(0, 200))); } catch { /* ignore */ }
}

export function totalTracked(patternId: string): number {
  return totalMs(getSessions(patternId));
}

/**
 * The epoch-ms a still-running timer began, persisted so the stopwatch survives
 * navigation and refreshes. null when no timer is running for this pattern.
 */
export function getRunningStart(patternId: string): number | null {
  try {
    const raw = localStorage.getItem(runningKey(patternId));
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setRunningStart(patternId: string, startMs: number | null): void {
  try {
    if (startMs == null) localStorage.removeItem(runningKey(patternId));
    else localStorage.setItem(runningKey(patternId), String(startMs));
  } catch {
    /* ignore */
  }
}
