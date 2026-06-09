import { PROFILES, profileById, isProfileId, type Profile } from "@shared/profiles";

export { PROFILES, profileById };
export type { Profile };

const STORAGE_KEY = "crochet-time:profile";

/** The chosen family profile, or null when nobody has picked yet (first run). */
export function getActiveProfileId(): string | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return isProfileId(id) ? id : null;
  } catch {
    return null;
  }
}

export function getActiveProfile(): Profile {
  return profileById(getActiveProfileId());
}

export function setActiveProfileId(id: string): void {
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* storage unavailable */ }
}

/**
 * Append the active profile to an /api/ URL. Done centrally (apiRequest +
 * default queryFn) so screens never think about profiles, and the service
 * worker's URL-keyed cache stays separate per person for offline use.
 */
export function withProfile(url: string): string {
  if (!url.startsWith("/api/")) return url;
  const id = getActiveProfileId();
  if (!id) return url;
  return url + (url.includes("?") ? "&" : "?") + "profile=" + encodeURIComponent(id);
}
