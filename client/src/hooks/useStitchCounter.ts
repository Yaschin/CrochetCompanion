import { useEffect, useState } from "react";

export interface CounterHistoryEntry {
  id: string;
  type: "stitch" | "row";
  delta: number;
  value: number;
  time: string;
}

export interface StitchCounterState {
  stitches: number;
  rows: number;
  target: number; // 0 = no target
  history: CounterHistoryEntry[];
}

export const EMPTY_COUNTER: StitchCounterState = { stitches: 0, rows: 0, target: 0, history: [] };

const LEGACY_GLOBAL_KEY = "crochet-time-counter";
const counterKey = (patternId: string) => `crochet-time:counter:${patternId}`;

export function loadCounter(patternId: string | undefined): StitchCounterState {
  try {
    const key = patternId ? counterKey(patternId) : LEGACY_GLOBAL_KEY;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // The old standalone screen stored { counts: {stitches, rows}, history }.
      const counts = parsed.counts ?? parsed;
      return {
        ...EMPTY_COUNTER,
        stitches: counts.stitches ?? 0,
        rows: counts.rows ?? 0,
        target: parsed.target ?? counts.target ?? 0,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    }
    // First per-pattern use: adopt counts from the legacy global counter so
    // anything counted on the old standalone screen isn't lost.
    if (patternId) {
      const legacy = localStorage.getItem(LEGACY_GLOBAL_KEY);
      if (legacy) return loadCounter(undefined);
    }
  } catch {
    /* fall through to empty */
  }
  return EMPTY_COUNTER;
}

export function saveCounter(patternId: string | undefined, state: StitchCounterState): void {
  try {
    const key = patternId ? counterKey(patternId) : LEGACY_GLOBAL_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

// One shared, per-pattern counter store for both the in-viewer modal and the
// full-screen counter, so counting in one place always shows in the other.
export function useStitchCounter(patternId: string | undefined) {
  const [state, setState] = useState<StitchCounterState>(() => loadCounter(patternId));

  // Re-load when switching patterns.
  useEffect(() => {
    setState(loadCounter(patternId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  // Persist on every change.
  useEffect(() => {
    saveCounter(patternId, state);
  }, [patternId, state]);

  return [state, setState] as const;
}
