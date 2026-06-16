import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Square, Clock } from "lucide-react";
import { palette } from "@/lib/theme";
import { recordActivity } from "@/lib/activityLog";
import {
  WorkSession,
  getSessions,
  saveSessions,
  mergeSessions,
  getRunningStart,
  setRunningStart,
  makeSession,
  totalMs,
  formatDuration,
  formatClock,
} from "@/lib/timeTracking";

const VIOLET = "#7C5FA8";

/** Write the durable copy of the sessions to the pattern row (fire-and-forget). */
function putWorkSessions(patternId: string, sessions: WorkSession[]): Promise<unknown> {
  return fetch(`/api/patterns/${patternId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ workSessions: sessions }),
  });
}

/** "16 Jun, 2:30 PM" — when a past session happened. */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Start/stop work-session timer for a project. Accumulates actual crocheting
 * time (distinct from the calendar "time since started" on Home) and persists a
 * running session so the stopwatch survives navigation and refreshes.
 */
export default function WorkTimer({ patternId }: { patternId: string }) {
  const queryClient = useQueryClient();
  const [sessions, setSessions] = useState<WorkSession[]>(() => getSessions(patternId));
  const [startMs, setStartMs] = useState<number | null>(() => getRunningStart(patternId));
  const [now, setNow] = useState(() => Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);

  const refreshTimeViews = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
    queryClient.invalidateQueries({ queryKey: ["/api/patterns", patternId] });
  };

  // On mount / pattern change: show the local cache immediately, then reconcile
  // with the durable copy on the pattern. Merge (never replace) so nothing is
  // lost, adopting the server's sessions on a fresh device and pushing up any
  // the server is missing (tracked before this shipped, or made offline).
  useEffect(() => {
    const local = getSessions(patternId);
    setSessions(local);
    setStartMs(getRunningStart(patternId));
    if (!patternId) return;
    let cancelled = false;
    fetch(`/api/patterns/${patternId}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (cancelled || !p) return;
        const remote: WorkSession[] = Array.isArray(p.workSessions) ? p.workSessions : [];
        const merged = mergeSessions(remote, local);
        if (merged.length !== local.length) {
          setSessions(merged);
          saveSessions(patternId, merged);
        }
        if (merged.length !== remote.length) {
          putWorkSessions(patternId, merged).then(refreshTimeViews).catch(() => { /* offline */ });
        }
      })
      .catch(() => { /* offline — local cache stands */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  // Tick once a second while a session is running.
  useEffect(() => {
    if (startMs == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startMs]);

  const running = startMs != null;
  const liveMs = running ? Math.max(0, now - startMs) : 0;
  const total = totalMs(sessions) + liveMs;

  const start = () => {
    const t = Date.now();
    setStartMs(t);
    setRunningStart(patternId, t);
    recordActivity(); // crocheting now counts toward today's streak
  };

  const stop = () => {
    if (startMs == null) return;
    const session = makeSession(startMs, Date.now());
    setStartMs(null);
    setRunningStart(patternId, null);
    if (!session) return;
    const next = mergeSessions([session], sessions);
    setSessions(next);
    saveSessions(patternId, next);            // fast, offline-safe cache
    putWorkSessions(patternId, next).then(refreshTimeViews).catch(() => { /* offline — cache holds it */ });
  };

  return (
    <div
      className="craft-card p-4"
      style={{ background: running ? "rgba(124,95,168,0.08)" : undefined, border: running ? `1.5px solid ${VIOLET}3a` : undefined }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(124,95,168,0.12)", color: VIOLET }}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-[12.5px]" style={{ color: "#5C3A28" }}>
              Time on this project
            </p>
            <p className="font-heading font-bold leading-none mt-0.5" style={{ color: VIOLET, fontSize: 22 }}>
              {formatDuration(total)}
            </p>
            <p className="text-[10.5px] mt-1" style={{ color: palette.clay }}>
              {sessions.length === 0 ? "No sessions yet" : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
              {running && (
                <span className="font-bold" style={{ color: VIOLET }}>
                  {" · "}
                  <span aria-hidden="true">● </span>
                  {formatClock(liveMs)}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={running ? stop : start}
          aria-label={running ? "Stop the work timer" : "Start the work timer"}
          aria-pressed={running}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={
            running
              ? { background: "rgba(194,78,107,0.12)", color: palette.rose, border: "1.5px solid rgba(194,78,107,0.3)" }
              : { background: VIOLET, color: "white", boxShadow: "0 3px 12px rgba(124,95,168,0.35)" }
          }
        >
          {running ? <><Square className="h-3.5 w-3.5" /> Stop</> : <><Play className="h-3.5 w-3.5" /> Start</>}
        </button>
      </div>

      {sessions.length > 0 && (
        <>
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="mt-3 text-[11px] font-semibold hover:opacity-80"
            style={{ color: VIOLET }}
          >
            {historyOpen ? "Hide sessions ▴" : "View sessions ▾"}
          </button>
          {historyOpen && (
            <div className="mt-2 flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {sessions.map((s, i) => (
                <div key={`${s.start}-${i}`} className="flex items-center justify-between text-[11.5px]">
                  <span style={{ color: palette.clay }}>{formatWhen(s.end)}</span>
                  <span className="font-semibold" style={{ color: "#5C3A28" }}>{formatDuration(s.ms)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
