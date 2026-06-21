/**
 * Pure reminder-scheduling logic — no DB, no I/O — so it's straightforward to
 * unit-test. The orchestration that reads prefs/subscriptions and actually sends
 * lives in `reminders.ts`.
 */

export const INACTIVE_DAYS = 4; // a project quiet this long is "waiting"
export const INACTIVE_MIN_GAP_DAYS = 3; // don't re-nudge about inactivity more often than this

export interface ReminderPrefs {
  dailyEnabled: boolean;
  dailyTime: string; // "HH:MM" 24h, in the profile's timezone
  timezone: string; // IANA, e.g. "America/New_York"
  inactiveEnabled: boolean;
  lastDailySentOn?: string; // "YYYY-MM-DD" (profile-local) — daily dedupe
  lastInactiveSentOn?: string; // "YYYY-MM-DD" (profile-local) — inactivity dedupe
}

export const DEFAULT_PREFS: ReminderPrefs = {
  dailyEnabled: false,
  dailyTime: "18:00",
  timezone: "UTC",
  inactiveEnabled: false,
};

/** The local calendar date ("YYYY-MM-DD") and minutes-past-midnight in a tz. */
export function localNow(now: Date, timezone: string): { date: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(now);
  } catch {
    if (timezone !== "UTC") return localNow(now, "UTC"); // unknown tz → UTC, don't throw
    throw new Error("UTC formatting failed");
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24 || Number.isNaN(hour)) hour = 0; // some engines render midnight as "24"
  const minutes = hour * 60 + (parseInt(get("minute"), 10) || 0);
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes };
}

function parseHHMM(t: string): number {
  const [h, m] = (t || "").split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

/** Is the daily nudge due now (enabled, past the chosen time, not yet sent today)? */
export function dailyDue(prefs: ReminderPrefs, now: Date): boolean {
  if (!prefs.dailyEnabled || !prefs.dailyTime) return false;
  const { date, minutes } = localNow(now, prefs.timezone);
  if (prefs.lastDailySentOn === date) return false;
  return minutes >= parseHHMM(prefs.dailyTime);
}

export interface ActivityPattern {
  id: string;
  title: string;
  status?: string;
  workSessions?: { end: string }[] | null;
  createdAt: string;
}

/** Epoch ms of the most recent work on a pattern (falls back to its creation). */
export function lastActivity(p: ActivityPattern): number {
  const ends = (p.workSessions ?? [])
    .map((s) => Date.parse(s.end))
    .filter((n) => !Number.isNaN(n));
  if (ends.length) return Math.max(...ends);
  const created = Date.parse(p.createdAt);
  return Number.isNaN(created) ? 0 : created;
}

/**
 * The in-progress project most worth nudging about: among "active" patterns,
 * the most-recently-touched one — but only if even that has gone quiet for at
 * least `days`. (If your latest project is still warm, nothing is "waiting".)
 */
export function pickInactiveProject(patterns: ActivityPattern[], now: Date, days = INACTIVE_DAYS): ActivityPattern | null {
  const cutoff = now.getTime() - days * 86400000;
  const active = patterns.filter((p) => p.status === "active");
  if (!active.length) return null;
  const top = active.slice().sort((a, b) => lastActivity(b) - lastActivity(a))[0];
  return lastActivity(top) <= cutoff ? top : null;
}

/** Whether an inactivity nudge may go out now (enabled + outside the min gap). */
export function inactiveDue(prefs: ReminderPrefs, now: Date, minGapDays = INACTIVE_MIN_GAP_DAYS): boolean {
  if (!prefs.inactiveEnabled) return false;
  if (!prefs.lastInactiveSentOn) return true;
  const last = Date.parse(`${prefs.lastInactiveSentOn}T00:00:00Z`);
  return Number.isNaN(last) || now.getTime() - last >= minGapDays * 86400000;
}

export function daysSince(ms: number, now: Date): number {
  return Math.max(1, Math.floor((now.getTime() - ms) / 86400000));
}
