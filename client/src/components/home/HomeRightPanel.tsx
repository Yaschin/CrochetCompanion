import { palette } from "@/lib/theme";
import { Pattern, ViewType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { PatternThumb } from "@/components/PatternThumb";
import { FolderOpen, Heart } from "lucide-react";
import { patternProgress, formatTimeSpent } from "./helpers";

export function HomeRightPanel({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  const { data: patterns = [], isLoading } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });

  const active = patterns.find((p) => p.status === "active") ?? patterns.find((p) => p.status !== "finished") ?? patterns[0] ?? null;
  const overview = patterns.slice(0, 3);
  const pct = active ? patternProgress(active) : 0;
  const steps = active?.sections?.flatMap(s => s.steps) ?? [];
  const doneRows = steps.filter(s => s.completed).length;
  const timeSpent = formatTimeSpent(active?.startedAt);

  return (
    <div className="flex flex-col gap-3 p-4 relative">
      {/* Large decorative flower — top-right corner */}
      <div className="absolute -top-3 -right-4 pointer-events-none z-0">
        <svg viewBox="0 0 56 56" width="80" height="80">
          {[0,72,144,216,288].map((a) => {
            const rad = (a * Math.PI) / 180;
            const cx = 28 + Math.cos(rad) * 11;
            const cy = 28 + Math.sin(rad) * 11;
            return <ellipse key={a} cx={cx} cy={cy} rx="9.5" ry="6.5"
              transform={`rotate(${a},${cx},${cy})`}
              fill="#C24E6B" fillOpacity="0.72" />;
          })}
          <circle cx="28" cy="28" r="7" fill="#C24E6B" fillOpacity="0.88" />
          <circle cx="28" cy="28" r="3" fill="white" fillOpacity="0.55" />
        </svg>
      </div>

      {/* Active Project */}
      <div className="craft-card p-3.5 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-semibold text-[13px]" style={{ color: palette.ink }}>
            Active Project
          </span>
          <FolderOpen className="h-4 w-4" style={{ color: palette.clay }} />
        </div>
        {active ? (
          <div>
            <div className="flex items-start gap-2.5 mb-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.12)", containerType: "inline-size" }}>
                <PatternThumb image={active.endProductImage} title={active.title} projectType={active.projectType} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[13px] truncate" style={{ color: palette.ink }}>
                  {active.title}
                </p>
                <span className="badge-green inline-block mt-0.5">In Progress</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-[10.5px] mb-1" style={{ color: palette.clay }}>
                <span>Row {doneRows} of {steps.length || "—"}</span>
                <span>{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill-rose h-full rounded-full"
                  style={{ width: `${pct}%`, transition: "width 0.7s ease" }} />
              </div>
            </div>
            {/* Time spent row */}
            <div className="flex justify-between items-center text-[10.5px] mb-2"
              style={{ color: palette.clay, borderTop: "1px dashed rgba(140,100,55,0.18)", paddingTop: 6 }}>
              <span>Time since start</span>
              <span className="font-semibold" style={{ color: "#5C3A28" }}>{timeSpent}</span>
            </div>
            <button onClick={() => onNavigate("viewer")}
              className="btn-craft btn-rose w-full justify-center text-[11px] py-1.5">
              Open Workspace →
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-3 flex flex-col gap-2 animate-pulse" aria-hidden="true">
            <div className="h-12 rounded-xl" style={{ background: "rgba(140,100,55,0.10)" }} />
            <div className="h-2 rounded-full w-2/3" style={{ background: "rgba(140,100,55,0.10)" }} />
          </div>
        ) : (
          <p className="text-[12px] text-center py-3" style={{ color: palette.clay }}>
            No active project yet
          </p>
        )}
      </div>

      {/* Projects Overview */}
      {overview.length > 0 && (
        <div className="craft-card p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-heading font-semibold text-[13px]" style={{ color: palette.ink }}>
              Projects Overview
            </span>
            <button onClick={() => onNavigate("library")}
              className="text-[10.5px] font-semibold hover:opacity-70" style={{ color: palette.rose }}>
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {overview.map((p) => {
              const pp = patternProgress(p);
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ containerType: "inline-size" }}>
                    <PatternThumb image={p.endProductImage} title={p.title} projectType={p.projectType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-semibold truncate" style={{ color: palette.ink }}>{p.title}</p>
                    <p className="text-[10px]" style={{ color: palette.clay }}>In Progress</p>
                    <div className="progress-track mt-1">
                      <div className="progress-fill-rose h-full rounded-full"
                        style={{ width: `${pp}%`, transition: "width 0.7s ease" }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: palette.clay }}>
                    {pp}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivational quote */}
      <div className="craft-card p-3.5 text-center">
        <Heart className="h-4 w-4 mx-auto mb-2" style={{ color: palette.rose }} fill="#C24E6B" />
        <p className="font-heading text-[12px] leading-relaxed italic" style={{ color: "#5C3A28" }}>
          "Every stitch brings you closer to something beautiful."
        </p>
        <p className="mt-1.5 font-script text-[15px]" style={{ color: palette.rose }}>♡</p>
      </div>
    </div>
  );
}
