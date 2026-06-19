import { palette } from "@/lib/theme";
import { Pattern, ViewType } from "@/lib/types";
import { PatternThumb } from "@/components/PatternThumb";
import { loadCounter } from "@/hooks/useStitchCounter";
import { getActiveProfile } from "@/lib/profile";
import { patternProgress } from "./helpers";
import { Wand2, FileUp, BookOpen, Heart } from "lucide-react";

export function ContinueProjectCard({
  pattern, onNavigate, onResumeCounting, isLoading = false,
}: { pattern: Pattern | null; onNavigate: (v: ViewType) => void; onResumeCounting?: (p: Pattern) => void; isLoading?: boolean }) {
  const pct = pattern ? patternProgress(pattern) : 0;
  const steps = pattern?.sections?.flatMap(s => s.steps) ?? [];
  const totalRows = steps.length;
  const doneRows = steps.filter(s => s.completed).length;
  // Last counted row from the shared per-pattern counter store — lets the
  // "resume counting" shortcut say exactly where Larissa left off.
  const counterRows = pattern ? loadCounter(pattern.id).rows : 0;

  return (
    <div className="craft-card craft-card-rose flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">🐾</span>
          <span className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
            Continue Your Project
          </span>
        </div>
        <p className="text-[11px]" style={{ color: palette.clay }}>Pick up where you left off</p>
      </div>

      {pattern ? (
        <div className="flex items-start gap-2.5 flex-1">

          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.14)", containerType: "inline-size" }}>
            <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-[13px] truncate" style={{ color: palette.ink }}>
              {pattern.title}
            </p>
            <p className="text-[11px] mb-1.5" style={{ color: palette.clay }}>
              {totalRows > 0 ? `Row ${doneRows} of ${totalRows}` : pattern.skillLevel}
            </p>
            <div className="progress-track">
              <div className="progress-fill-rose h-full rounded-full"
                style={{ width: `${pct}%`, transition: "width 0.7s ease" }} />
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: palette.clay }}>{pct}%</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center gap-2.5 px-1 animate-pulse" aria-hidden="true">
          <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: "rgba(140,100,55,0.10)" }} />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(140,100,55,0.10)" }} />
            <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(140,100,55,0.10)" }} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-3 px-1">
          <img
            src="/characters/char-aloo-transparent.png"
            alt="Aloo"
            style={{ width: 62, height: 62, objectFit: "contain", filter: "drop-shadow(0 3px 8px rgba(50,20,5,0.18))", flexShrink: 0 }}
          />
          <p className="text-[12px] leading-snug" style={{ color: palette.muted }}>
            No patterns yet — start your first one!
          </p>
        </div>
      )}

      <button
        onClick={() => onNavigate(pattern ? "viewer" : "input")}
        className="btn-craft btn-rose w-full justify-center text-[12px] py-2"
      >
        {pattern ? "Open Project" : "Start Creating"} →
      </button>
      {pattern && onResumeCounting && (
        <button
          onClick={() => onResumeCounting(pattern)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(132,147,79,0.10)", color: palette.sage, border: "1.5px solid rgba(132,147,79,0.25)" }}
        >
          🧶 {counterRows > 0 ? `Resume counting · Row ${counterRows}` : "Start counting rows"}
        </button>
      )}
    </div>
  );
}

export function CreateWithYalaCard({ onNavigate, onNavigateToPdf }: { onNavigate: (v: ViewType) => void; onNavigateToPdf?: () => void }) {
  return (
    <div className="craft-card craft-card-plum flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Wand2 className="h-4 w-4 flex-shrink-0" style={{ color: palette.purple }} />
          <span className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
            Create a Pattern
          </span>
        </div>
        <p className="text-[11px]" style={{ color: palette.clay }}>AI-generated, PDF import, or write your own</p>
      </div>

      <div className="flex flex-1 gap-2.5 items-center">
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 68, height: 68 }}>
          <img
            src="/characters/char-yala-transparent.png"
            alt="Yala"
            style={{ width: 68, height: 68, objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(50,20,5,0.22))" }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <p className="text-[12px] leading-snug" style={{ color: "#6A4A5A" }}>
            Describe an idea and Yala brings it to life — or import a PDF pattern directly.
          </p>
        </div>
      </div>

      <button onClick={() => onNavigate("input")} className="btn-craft btn-plum w-full justify-center text-[12px] py-2">
        <Wand2 className="h-3.5 w-3.5" /> Create with AI →
      </button>
      <button
        onClick={() => onNavigateToPdf ? onNavigateToPdf() : onNavigate("input")}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
        style={{ background: "rgba(194,78,107,0.10)", color: palette.rose, border: "1.5px solid rgba(194,78,107,0.28)" }}
      >
        <FileUp className="h-3.5 w-3.5" /> Import PDF →
      </button>
      <button
        onClick={() => onNavigate("input")}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-70"
        style={{ background: "transparent", color: palette.clay }}
      >
        <BookOpen className="h-3 w-3" /> Write my own
      </button>
    </div>
  );
}

export function FavoritesCard({
  count, onNavigate,
}: { count: number; onNavigate: (v: ViewType) => void }) {
  return (
    <div className="craft-card craft-card-sage flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Heart className="h-4 w-4 flex-shrink-0" style={{ color: palette.sage }} fill={palette.sage} />
          <span className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
            {getActiveProfile().name}'s Favorites
          </span>
        </div>
        <p className="text-[11px]" style={{ color: palette.clay }}>Your saved patterns</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        {count === 0 ? (
          <img
            src="/characters/char-ashi-transparent.png"
            alt="Ashi"
            style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 3px 10px rgba(50,20,5,0.18))" }}
          />
        ) : (
          <>
            <span className="font-heading font-bold" style={{ fontSize: 38, color: palette.sage, lineHeight: 1 }}>
              {count}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: palette.clay }}>
              {count === 1 ? "pattern saved" : "patterns saved"}
            </span>
          </>
        )}
      </div>

      <button onClick={() => onNavigate("favorites")} className="btn-craft btn-sage w-full justify-center text-[12px] py-2">
        View Favorites →
      </button>
    </div>
  );
}
