// Family profiles — trust-based convenience separation, NOT authentication.
// The ids are stable keys used in ownerId columns and localStorage; display
// fields can change freely.
export interface Profile {
  id: string;
  name: string;
  color: string;
  character: string; // matches /characters/char-<character>-transparent.png
}

export const PROFILES: Profile[] = [
  { id: "larissa", name: "Larissa", color: "#C24E6B", character: "aloo" },
  { id: "vumsh", name: "Vumsh", color: "#7C5FA8", character: "yala" },
  { id: "akka", name: "Akka", color: "#84934F", character: "ashi" },
  { id: "mummy", name: "Mummy", color: "#D4921A", character: "bee" },
];

export const DEFAULT_PROFILE_ID = "larissa";

export function isProfileId(id: unknown): id is string {
  return typeof id === "string" && PROFILES.some((p) => p.id === id);
}

export function profileById(id: string | null | undefined): Profile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}
