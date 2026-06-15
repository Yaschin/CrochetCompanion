import { palette } from "@/lib/theme";
import { ChevronLeft, Trophy, Clock, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Pattern, ViewType } from "../lib/types";
import StreakCard from "../components/StreakCard";

interface ProgressTrackingScreenProps {
  pattern: Pattern | null;
  onNavigate: (view: ViewType) => void;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

export default function ProgressTrackingScreen({ pattern, onNavigate }: ProgressTrackingScreenProps) {
  // Real finished-project count (for the "5 Projects" achievement).
  const { data: allPatterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const finishedCount = allPatterns.filter((p) => p.status === "finished").length;

  const realSections = (pattern?.sections ?? []).filter((s) => s.name.toLowerCase() !== "materials");
  const steps = realSections.flatMap((s) => s.steps);
  const done = steps.filter((s) => s.completed).length;
  const total = steps.length || 1;
  const pct = Math.round((done / total) * 100);

  // Real time-on-project from the lifecycle timestamps.
  const started = pattern?.startedAt ? new Date(pattern.startedAt) : null;
  const finished = pattern?.finishedAt ? new Date(pattern.finishedAt) : null;
  let timeLabel: string | null = null;
  if (started && finished) timeLabel = `Finished in ${daysBetween(started, finished)} day(s)`;
  else if (started) timeLabel = `Day ${daysBetween(started, new Date()) + 1} in progress`;

  const achievements = [
    { icon: "🌸", label: "First Stitch", unlocked: done >= 1, color: palette.rose },
    { icon: "🧶", label: "10 Steps Done", unlocked: done >= 10, color: "#7C5FA8" },
    { icon: "⭐", label: "Half Way", unlocked: pct >= 50, color: "#D4921A" },
    { icon: "🏆", label: "Pattern Done", unlocked: pct >= 100, color: palette.sage },
    { icon: "🎉", label: "5 Projects", unlocked: finishedCount >= 5, color: "#3D8FA3" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <button onClick={() => onNavigate("viewer")} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: "rgba(194,78,107,0.08)", color: palette.rose }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Progress Tracking</h1>
          {pattern && <p className="text-[12px]" style={{ color: palette.clay }}>{pattern.title}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">
        <StreakCard />
        {!pattern ? (
          <div className="craft-card p-6 flex flex-col items-center text-center gap-3">
            <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>No project selected</p>
            <p className="text-[12px]" style={{ color: palette.clay }}>Open a pattern from your library to track its progress.</p>
            <button onClick={() => onNavigate("library")} className="btn-craft btn-rose px-5 py-2.5">Browse Library →</button>
          </div>
        ) : (
          <>
            {/* Progress ring + real stats */}
            <div className="craft-card p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div
                className="relative flex-shrink-0"
                style={{ width: 100, height: 100 }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% complete`}
              >
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(194,78,107,0.12)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#C24E6B" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - pct / 100)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading font-bold text-[22px] leading-none" style={{ color: palette.rose }}>{pct}%</span>
                  <span className="text-[9px] font-semibold" style={{ color: palette.clay }}>done</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <div>
                  <p className="font-heading font-bold text-[28px] leading-none" style={{ color: palette.ink }}>{done}/{total}</p>
                  <p className="text-[12px]" style={{ color: palette.clay }}>steps complete</p>
                </div>
                {timeLabel && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Clock className="h-3.5 w-3.5" style={{ color: palette.sage }} />
                    <span className="text-[11px] font-semibold" style={{ color: palette.sage }}>{timeLabel}</span>
                  </div>
                )}
                {pattern.status && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" style={{ color: "#7C5FA8" }} />
                    <span className="text-[11px] font-semibold capitalize" style={{ color: "#7C5FA8" }}>{pattern.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Real per-section breakdown */}
            <div className="craft-card p-4">
              <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: palette.ink }}>By section</p>
              <div className="flex flex-col gap-3">
                {realSections.length === 0 && (
                  <p className="text-[12px]" style={{ color: palette.clay }}>This pattern has no sections yet.</p>
                )}
                {realSections.map((s, i) => {
                  const sDone = s.steps.filter((st) => st.completed).length;
                  const sTotal = s.steps.length || 1;
                  const sPct = Math.round((sDone / sTotal) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold" style={{ color: "#5C3A28" }}>{s.name}</span>
                        <span className="text-[11px]" style={{ color: palette.clay }}>{sDone}/{s.steps.length}</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(194,78,107,0.10)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${sPct}%`, background: sPct === 100 ? palette.sage : palette.rose }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements (real, derived) */}
            <div className="craft-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4" style={{ color: "#D4921A" }} />
                <p className="font-heading font-semibold text-[13px]" style={{ color: palette.ink }}>Achievements</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {achievements.map((a) => (
                  <div key={a.label} className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl"
                    style={{ background: a.unlocked ? `${a.color}14` : "rgba(180,160,140,0.08)", border: `1.5px dashed ${a.unlocked ? a.color + "55" : "rgba(180,160,140,0.25)"}`, opacity: a.unlocked ? 1 : 0.5 }}>
                    <span className="text-2xl" style={{ filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                    <span className="text-[9.5px] font-bold text-center leading-tight" style={{ color: a.unlocked ? a.color : "#B0908A" }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <button onClick={() => onNavigate("photo-upload")} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(60,143,163,0.12)", color: "#3D8FA3", border: "1px dashed rgba(60,143,163,0.4)" }}>📷 Progress Photos</button>
              <button onClick={() => onNavigate("stitch-counter")} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(132,147,79,0.12)", color: palette.sage, border: "1px dashed rgba(132,147,79,0.4)" }}>🧮 Stitch Counter</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
