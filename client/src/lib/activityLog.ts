/**
 * Lightweight, device-local crochet activity log used for streaks.
 * Stored in localStorage (no backend / migration) — records the *days* on which
 * Larissa actually crocheted (counted rows, completed steps, finished a project).
 */
const KEY = "crochet-time-activity";

function todayKey(d = new Date()): string {
  // Local date YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadDays(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((d) => typeof d === "string");
  } catch { /* ignore */ }
  return [];
}

/** Record that crochet activity happened today (idempotent per day). */
export function recordActivity(): void {
  try {
    const days = new Set(loadDays());
    days.add(todayKey());
    localStorage.setItem(KEY, JSON.stringify([...days].sort()));
  } catch { /* ignore */ }
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
