import { palette } from "@/lib/theme";
import { Pattern, ViewType } from "@/lib/types";
import { printPattern } from "@/lib/printPattern";
import PatternProgressBar from "@/components/PatternProgressBar";
import StashCoverage from "@/components/StashCoverage";
import EnhancedMaterialsList from "@/components/EnhancedMaterialsList";
import { RefreshCw, Download, FileText, Play, CheckCircle2, Share2, Scissors, Shuffle } from "lucide-react";

interface OverviewTabProps {
  pattern: Pattern;
  formattedDate: string;
  onNavigate?: (view: ViewType) => void;
  onUpdatePattern: (pattern: Pattern) => void;
  onRegenerateImage: () => void;
  onExportPattern: () => void;
  onStoryCard: () => void;
  sharingStory: boolean;
  coverInputRef: React.RefObject<HTMLInputElement>;
  onCoverPhoto: (file: File) => void;
  coverPhotoPending: boolean;
  isUpNext: boolean;
  onToggleUpNext: () => void;
  upNextPending: boolean;
  onOpenShare: () => void;
  sharePending: boolean;
  onOpenCounter: () => void;
  adaptOpen: boolean;
  onToggleAdapt: () => void;
  adaptMode: "resize" | "substitute";
  onAdaptModeChange: (mode: "resize" | "substitute") => void;
  adaptInstruction: string;
  onAdaptInstructionChange: (value: string) => void;
  onAdapt: () => void;
  adaptPending: boolean;
}

/** Overview tab — cover/specs, lifecycle actions, tools grid, adapt panel, materials. */
const OverviewTab: React.FC<OverviewTabProps> = ({
  pattern,
  formattedDate,
  onNavigate,
  onUpdatePattern,
  onRegenerateImage,
  onExportPattern,
  onStoryCard,
  sharingStory,
  coverInputRef,
  onCoverPhoto,
  coverPhotoPending,
  isUpNext,
  onToggleUpNext,
  upNextPending,
  onOpenShare,
  sharePending,
  onOpenCounter,
  adaptOpen,
  onToggleAdapt,
  adaptMode,
  onAdaptModeChange,
  adaptInstruction,
  onAdaptInstructionChange,
  onAdapt,
  adaptPending,
}) => (
  <div className="flex flex-col gap-4">

    {/* Image + specs card */}
    <div className="surface-card p-4">
      <div className="flex gap-4">
        {pattern.endProductImage ? (
          <div className="relative flex-shrink-0 group">
            <img
              src={pattern.endProductImage}
              alt={pattern.title}
              className="w-32 h-32 rounded-xl object-cover"
            />
            <button
              onClick={onRegenerateImage}
              className="absolute bottom-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              title="Regenerate image"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-xl flex items-center justify-center flex-shrink-0 text-4xl"
            style={{ background: "rgba(140,100,55,0.08)" }}>
            🧶
          </div>
        )}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1.5">
            {[
              { label: "Type",  value: pattern.projectType },
              { label: "Level", value: pattern.skillLevel },
              { label: "Yarn",  value: pattern.yarnType },
              { label: "Size",  value: pattern.size },
              { label: "Created", value: formattedDate },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider w-14 flex-shrink-0"
                  style={{ color: "#B0908A" }}>{label}</span>
                <span className="text-[12px] font-medium truncate" style={{ color: palette.ink }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {pattern.status === 'pattern' && (
              <button
                onClick={onToggleUpNext}
                disabled={upNextPending}
                aria-pressed={isUpNext}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={isUpNext
                  ? { background: "#7C5FA8", color: "white" }
                  : { background: "rgba(124,95,168,0.10)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.25)" }}
              >
                ⏭ {isUpNext ? "Up next ✓" : "Make this next"}
              </button>
            )}
            {pattern.status === 'finished' && (
              <>
                <button
                  onClick={onStoryCard}
                  disabled={sharingStory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(124,95,168,0.10)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.25)" }}
                >
                  🎞 {sharingStory ? "Making…" : "Story card"}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onCoverPhoto(f); e.target.value = ''; }}
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverPhotoPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(132,147,79,0.12)", color: palette.sage, border: "1px solid rgba(132,147,79,0.3)" }}
                >
                  📷 {coverPhotoPending ? "Saving…" : "Finished photo"}
                </button>
              </>
            )}
            <button
              onClick={() => printPattern(pattern)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(194,78,107,0.1)", color: palette.rose, border: "1px solid rgba(194,78,107,0.2)" }}
            >
              <FileText className="h-3 w-3" /> Print / PDF
            </button>
            <button
              onClick={onExportPattern}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(194,78,107,0.1)", color: palette.rose, border: "1px solid rgba(194,78,107,0.2)" }}
            >
              <Download className="h-3 w-3" /> Download
            </button>
            <button
              onClick={onRegenerateImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(132,147,79,0.1)", color: palette.sage, border: "1px solid rgba(132,147,79,0.2)" }}
            >
              <RefreshCw className="h-3 w-3" /> New Image
            </button>
            <button
              onClick={onOpenShare}
              disabled={sharePending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(124,95,168,0.1)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.2)" }}
            >
              <Share2 className="h-3 w-3" /> {sharePending ? "Sharing…" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Progress bar */}
    <PatternProgressBar sections={pattern.sections} />

    {/* Project lifecycle */}
    <div className="flex gap-2">
      {pattern.status !== 'active' && pattern.status !== 'finished' && (
        <button
          onClick={() => onUpdatePattern({ ...pattern, status: 'active', startedAt: new Date().toISOString() })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.3)" }}
        >
          <Play className="h-3.5 w-3.5" /> Start project
        </button>
      )}
      {pattern.status === 'active' && (
        <button
          onClick={() => onUpdatePattern({ ...pattern, status: 'finished', finishedAt: new Date().toISOString() })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "rgba(132,147,79,0.14)", color: "#5F6B36", border: "1px solid rgba(132,147,79,0.3)" }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark finished
        </button>
      )}
      {pattern.status === 'finished' && (
        <button
          onClick={() => onUpdatePattern({ ...pattern, status: 'active', finishedAt: null })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "rgba(140,100,55,0.08)", color: palette.bark, border: "1px solid rgba(140,100,55,0.22)" }}
        >
          <Play className="h-3.5 w-3.5" /> Reopen project
        </button>
      )}
    </div>

    {/* Tools grid */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { emoji: "🧮", label: "Row Counter",  action: onOpenCounter,                      color: "#7C5FA8" },
        { emoji: "📊", label: "Progress",      action: () => onNavigate?.("progress"),    color: palette.sage },
        { emoji: "📷", label: "Photos",         action: () => onNavigate?.("photo-upload"),color: "#3D8FA3" },
        { emoji: "🧶", label: "From My Stash", action: () => onNavigate?.("yarn-recs"),   color: "#D4921A" },
      ].map(({ emoji, label, action, color }) => (
        <button
          key={label}
          onClick={action}
          className="flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: `${color}10`, border: `1.5px solid ${color}28` }}
        >
          <span style={{ fontSize: 22 }}>{emoji}</span>
          <span className="font-heading font-semibold text-[13px]" style={{ color }}>{label}</span>
        </button>
      ))}
    </div>

    {/* Adapt this pattern */}
    <div className="surface-card p-4">
      <button
        onClick={onToggleAdapt}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-[18px]">✂️</span>
          <span className="font-heading font-semibold text-[13px]" style={{ color: palette.ink }}>Adapt this Pattern</span>
        </div>
        <span className="text-[11px] font-semibold" style={{ color: palette.rose }}>
          {adaptOpen ? "Close ▲" : "Open ▼"}
        </span>
      </button>
      {adaptOpen && (
        <div className="flex flex-col gap-3 mt-3">
          <p className="text-[11.5px]" style={{ color: palette.clay }}>
            Creates a brand-new pattern — your original is kept safe.
          </p>
          <div className="flex gap-2">
            {(["resize", "substitute"] as const).map((m) => (
              <button key={m} onClick={() => onAdaptModeChange(m)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: adaptMode === m ? palette.rose : "rgba(140,100,55,0.08)",
                  color: adaptMode === m ? "white" : palette.clay,
                  border: adaptMode === m ? "none" : "1px solid rgba(140,100,55,0.18)",
                }}>
                {m === "resize" ? <><Scissors className="h-3.5 w-3.5" /> Resize</> : <><Shuffle className="h-3.5 w-3.5" /> Swap Yarn</>}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            placeholder={adaptMode === "resize" ? "e.g. 30% bigger, baby size, adult large…" : "e.g. DK weight, chunky cotton, fingering…"}
            value={adaptInstruction}
            onChange={(e) => onAdaptInstructionChange(e.target.value)}
            className="w-full p-3 rounded-xl text-[12.5px] outline-none resize-none"
            style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)", color: palette.ink }}
          />
          <button
            onClick={onAdapt}
            disabled={!adaptInstruction.trim() || adaptPending}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.25)" }}
          >
            {adaptPending ? "Creating…" : "✨ Create Adapted Version"}
          </button>
        </div>
      )}
    </div>

    {/* Description (was on the retired Details screen) */}
    {pattern.description && (
      <div className="surface-card p-4">
        <p className="font-heading font-semibold text-[13px] mb-1.5" style={{ color: "#5C3A28" }}>About this pattern</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#7A5A48" }}>{pattern.description}</p>
      </div>
    )}

    {/* Can I make this? — stash coverage (was on the retired Details screen) */}
    <StashCoverage pattern={pattern} onOpenStash={() => onNavigate?.("stash")} />

    {/* Materials */}
    <EnhancedMaterialsList
      yarnRequirements={pattern.yarnRequirements || []}
      hookRequirements={pattern.hookRequirements || []}
      notionsRequirements={pattern.notionsRequirements || []}
      toolRequirements={pattern.toolRequirements || []}
      needsStuffing={pattern.needsStuffing || ""}
      materialsNotes={pattern.materialsNotes || ""}
      onUpdate={(updatedMaterials) => {
        onUpdatePattern({
          ...pattern,
          yarnRequirements: updatedMaterials.yarnRequirements,
          hookRequirements: updatedMaterials.hookRequirements,
          notionsRequirements: updatedMaterials.notionsRequirements,
          toolRequirements: updatedMaterials.toolRequirements,
          needsStuffing: updatedMaterials.needsStuffing,
          materialsNotes: updatedMaterials.materialsNotes,
        });
      }}
    />
  </div>
);

export default OverviewTab;
