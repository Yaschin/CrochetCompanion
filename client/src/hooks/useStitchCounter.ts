import { useEffect, useRef, useState } from "react";

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

function isEmptyState(s: StitchCounterState): boolean {
  return s.stitches === 0 && s.rows === 0 && s.target === 0 && s.history.length === 0;
}

// One shared, per-pattern counter store for both the in-viewer modal and the
// full-screen counter, so counting in one place always shows in the other.
// localStorage is the fast path; the pattern row's counterState column is the
// durable copy (survives cache clears, follows the pattern across devices).
export function useStitchCounter(patternId: string | undefined) {
  const [state, setState] = useState<StitchCounterState>(() => loadCounter(patternId));
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const adopted = useRef(false);

  // Re-load when switching patterns; if this device has nothing for the
  // pattern, adopt the durable copy from the server.
  useEffect(() => {
    adopted.current = false;
    const local = loadCounter(patternId);
    setState(local);
    if (!patternId || !isEmptyState(local)) return;
    let cancelled = false;
    fetch(`/api/patterns/${patternId}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        const remote = p?.counterState;
        if (cancelled || !remote || typeof remote.rows !== "number") return;
        adopted.current = true;
        setState({ ...EMPTY_COUNTER, ...remote });
      })
      .catch(() => { /* offline — local empty state stands */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  // Persist on every change: localStorage immediately, server debounced.
  useEffect(() => {
    saveCounter(patternId, state);
    if (!patternId) return;
    // Don't write empties back (initial mount / just-adopted state).
    if (isEmptyState(state)) return;
    if (adopted.current) { adopted.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/patterns/${patternId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ counterState: state }),
      }).catch(() => { /* offline — localStorage copy is enough */ });
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [patternId, state]);

  return [state, setState] as const;
}
