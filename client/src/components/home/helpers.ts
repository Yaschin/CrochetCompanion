import { getActiveProfile } from "@/lib/profile";
import { Pattern } from "@/lib/types";
import { patternProgress as sharedProgress } from "@/lib/progress";

export const notifKey = () => `crochet-time-community-seen:${getActiveProfile().id}`;

export function getLastSeenCount(): number {
  try { return parseInt(localStorage.getItem(notifKey()) ?? "0", 10) || 0; } catch { return 0; }
}

export function markCommunityRead(count: number): void {
  try { localStorage.setItem(notifKey(), String(count)); } catch { /* ignore */ }
}

export function formatTimeSpent(startedAt?: string | null): string {
  if (!startedAt) return "—";
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  const totalMins = Math.floor(ms / 60_000);
  if (totalMins < 1) return "Just started";
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning",   emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌸" };
  return        { text: "Good evening",   emoji: "🌙" };
}

export function patternProgress(p: Pattern) {
  return sharedProgress(p).pct;
}
