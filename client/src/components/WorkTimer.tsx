import { useState, useEffect } from "react";
import { Play, Square, Clock } from "lucide-react";
import { palette } from "@/lib/theme";
import { recordActivity } from "@/lib/activityLog";
import {
  WorkSession,
  getSessions,
  addSession,
  getRunningStart,
  setRunningStart,
  makeSession,
  totalMs,
  formatDuration,
  formatClock,
} from "@/lib/timeTracking";

const VIOLET = "#7C5FA8";

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
  const [sessions, setSessions] = useState<WorkSession[]>(() => getSessions(patternId));
  const [startMs, setStartMs] = useState<number | null>(() => getRunningStart(patternId));
  const [now, setNow] = useState(() => Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);

  // Reload when the pattern changes (component is reused across patterns).
  useEffect(() => {
    setSessions(getSessions(patternId));
    setStartMs(getRunningStart(patternId));
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
    if (session) setSessions(addSession(patternId, session));
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
