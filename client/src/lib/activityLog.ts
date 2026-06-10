/**
 * Lightweight, device-local crochet activity log used for streaks.
 * Stored in localStorage (no backend / migration) — records the *days* on which
 * Larissa actually crocheted (counted rows, completed steps, finished a project).
 */
import { getActiveProfileId, withProfile } from "./profile";

// Per-profile streaks; pre-profile history stays under the legacy key, which
// doubles as Larissa's (she owns all pre-profile data).
function storageKey(): string {
  const id = getActiveProfileId();
  return !id || id === "larissa" ? "crochet-time-activity" : `crochet-time-activity:${id}`;
}

function todayKey(d = new Date()): string {
  // Local date YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadDays(): string[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((d) => typeof d === "string");
  } catch { /* ignore */ }
  return [];
}

function saveDays(days: Iterable<string>): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify([...new Set(days)].sort()));
  } catch { /* ignore */ }
}

/** Record that crochet activity happened today (idempotent per day). */
export function recordActivity(): void {
  const today = todayKey();
  const days = new Set(loadDays());
  days.add(today);
  saveDays(days);
  // Fire-and-forget durable copy — survives cache clears, follows the profile
  // across devices. Offline failures are fine; syncActivity() reconciles later.
  fetch(withProfile("/api/activity"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ days: [today] }),
  }).catch(() => { /* offline — local copy is enough for now */ });
}

/**
 * Two-way reconcile with the server: pull the profile's recorded days into
 * localStorage, and push any local-only days (e.g. recorded offline) up.
 * Called on app load and after profile switches.
 */
export async function syncActivity(): Promise<void> {
  try {
    const res = await fetch(withProfile("/api/activity"), { credentials: "same-origin" });
    if (!res.ok) return;
    const { days: serverDays } = (await res.json()) as { days: string[] };
    const local = new Set(loadDays());
    const server = new Set(Array.isArray(serverDays) ? serverDays : []);

    const localOnly = [...local].filter((d) => !server.has(d));
    if (localOnly.length > 0) {
      await fetch(withProfile("/api/activity"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ days: localOnly }),
      }).catch(() => { /* push can retry next time */ });
    }

    saveDays([...local, ...server]);
  } catch { /* offline — keep using the local copy */ }
}

export interface StreakInfo {
  current: number;
  longest: number;
  totalDays: number;
  activeToday: boolean;
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / 86_400_000);
}

export function getStreak(): StreakInfo {
  const days = [...new Set(loadDays())].sort(); // ascending
  if (days.length === 0) return { current: 0, longest: 0, totalDays: 0, activeToday: false };

  // Longest run of consecutive days.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (diffDays(days[i], days[i - 1]) === 1) run += 1;
    else run = 1;
    if (run > longest) longest = run;
  }

  // Current streak: consecutive days ending today (or yesterday — grace day).
  const today = todayKey();
  const last = days[days.length - 1];
  const gap = diffDays(today, last);
  let current = 0;
  if (gap <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (diffDays(days[i], days[i - 1]) === 1) current += 1;
      else break;
    }
  }

  return { current, longest, totalDays: days.length, activeToday: gap === 0 };
}
