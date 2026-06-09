import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Package } from "lucide-react";
import { Pattern, ViewType } from "../lib/types";
import { PatternThumb } from "@/components/PatternThumb";

interface ProjectsScreenProps {
  onNavigate: (view: ViewType) => void;
  onPatternSelected: (p: Pattern) => void;
}

function patternProgress(p: Pattern) {
  const steps = p.sections?.flatMap((s) => s.steps) ?? [];
  const done = steps.filter((s) => s.completed).length;
  return { pct: steps.length > 0 ? Math.round((done / steps.length) * 100) : 0, done, total: steps.length };
}

function ProjectCard({ pattern, onSelect, index }: { pattern: Pattern; onSelect: () => void; index: number }) {
  const { pct, done, total } = patternProgress(pattern);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onSelect}
      className="craft-card p-4 flex gap-3 items-center cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
    >
      <div className="w-[60px] h-[60px] rounded-xl overflow-hidden flex-shrink-0"
        style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.14)", containerType: "inline-size" }}>
        <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-[14px] truncate" style={{ color: "#3D2318" }}>{pattern.title}</p>
        <p className="text-[11px] mt-0.5 mb-2" style={{ color: "#9A7868" }}>
          {pattern.projectType} · {pattern.skillLevel}
        </p>
        {pattern.status !== 'finished' ? (
          <>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(140,100,55,0.15)" }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${pct}%`,
                background: pct > 0 ? "linear-gradient(90deg, #C24E6B, #A83050)" : "transparent",
              }} />
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "#9A7868" }}>
              {total > 0 ? `${done}/${total} steps · ${pct}%` : "Not started yet"}
            </p>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
            style={{ background: "rgba(132,147,79,0.12)", color: "#84934F" }}>
            ✓ Completed
          </span>
        )}
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#C0A090" }} />
    </motion.div>
  );
}

// Trophy-shelf card for the finished gallery: photo-first, with finish date
// and how long the project took.
function TrophyCard({ pattern, onSelect, index }: { pattern: Pattern; onSelect: () => void; index: number }) {
  const finished = pattern.finishedAt ? new Date(pattern.finishedAt) : null;
  const started = pattern.startedAt ? new Date(pattern.startedAt) : null;
  const days =
    finished && started
      ? Math.max(1, Math.round((finished.getTime() - started.getTime()) / 86_400_000))
      : null;
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onSelect}
      className="craft-card overflow-hidden text-left cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="aspect-square w-full overflow-hidden" style={{ containerType: "inline-size" }}>
        <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
      </div>
      <div className="p-2.5">
        <p className="font-heading font-bold text-[12.5px] truncate" style={{ color: "#3D2318" }}>
          {pattern.title}
        </p>
        <p className="text-[10.5px] mt-0.5" style={{ color: "#84934F" }}>
          {finished
            ? `✓ ${finished.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
            : "✓ Completed"}
          {days ? ` · ${days} ${days === 1 ? "day" : "days"}` : ""}
        </p>
      </div>
    </motion.button>
  );
}

export default function ProjectsScreen({ onNavigate, onPatternSelected }: ProjectsScreenProps) {
  const { data: patterns = [], isLoading } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });

  const inProgress = patterns.filter(p => p.status === 'active');
  const completed = patterns
    .filter(p => p.status === 'finished')
    .sort((a, b) => new Date(b.finishedAt ?? 0).getTime() - new Date(a.finishedAt ?? 0).getTime());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-[26px]" style={{ color: "#3D2318", letterSpacing: "-0.02em" }}>
              My Projects
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#9A7868" }}>
              {isLoading ? "Loading…" : patterns.length === 0
                ? "Start your first crochet project"
                : `${inProgress.length} in progress · ${completed.length} completed`}
            </p>
          </div>
          <button
            onClick={() => onNavigate("input")}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #C24E6B, #A83050)",
              color: "white",
              boxShadow: "0 4px 16px rgba(194,78,107,0.35)",
            }}>
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="craft-card p-4 h-[88px] animate-pulse"
                style={{ background: "rgba(140,100,55,0.06)" }} />
            ))}
          </div>
        ) : inProgress.length === 0 && completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/characters/char-aloo-transparent.png" alt="Aloo"
                style={{ width: 110, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(50,20,5,0.2))" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </motion.div>
            <div>
              <p className="font-heading font-bold text-[18px]" style={{ color: "#3D2318" }}>No projects yet!</p>
              <p className="text-[13px] mt-1 max-w-[240px] mx-auto" style={{ color: "#9A7868" }}>
                Create your first pattern and start crafting something beautiful.
              </p>
            </div>
            <button
              onClick={() => onNavigate("input")}
              className="flex items-center gap-2 rounded-full px-6 py-3 font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #C24E6B, #A83050)",
                color: "white",
                boxShadow: "0 4px 16px rgba(194,78,107,0.35)",
              }}>
              <Plus className="h-4 w-4" /> Start your first project
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* In progress */}
            {inProgress.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-heading font-bold text-[14px]" style={{ color: "#3D2318" }}>
                    🧶 In Progress
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(194,78,107,0.10)", color: "#C24E6B" }}>
                    {inProgress.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {inProgress.map((p, i) => (
                    <ProjectCard key={p.id} pattern={p} onSelect={() => onPatternSelected(p)} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed — trophy shelf gallery */}
            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-heading font-bold text-[14px]" style={{ color: "#3D2318" }}>
                    ✨ Trophy Shelf
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(132,147,79,0.10)", color: "#84934F" }}>
                    {completed.length}
                  </span>
                </div>
                <p className="text-[11.5px] mb-3" style={{ color: "#9A7868" }}>
                  Every finished make, side by side — be proud!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {completed.map((p, i) => (
                    <TrophyCard key={p.id} pattern={p} onSelect={() => onPatternSelected(p)} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Stash shortcut */}
            <button
              onClick={() => onNavigate("stash")}
              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-80"
              style={{ background: "rgba(140,100,55,0.06)", border: "1px dashed rgba(140,100,55,0.22)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(140,100,55,0.1)" }}>
                  <Package className="h-5 w-5" style={{ color: "#9A7868" }} />
                </div>
                <div className="text-left">
                  <p className="font-heading font-semibold text-[13px]" style={{ color: "#5C3A28" }}>My Stash</p>
                  <p className="text-[11px]" style={{ color: "#9A7868" }}>Yarn, hooks & materials</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4" style={{ color: "#C0A090" }} />
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
