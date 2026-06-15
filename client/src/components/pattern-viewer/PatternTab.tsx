import { palette } from "@/lib/theme";
import { Pattern, PatternStep } from "@/lib/types";
import PatternSection from "@/components/PatternSection";
import { Plus, Hash, RefreshCw, Play } from "lucide-react";

interface PatternTabProps {
  pattern: Pattern;
  expandedSections: Set<string>;
  onToggleSection: (name: string) => void;
  onUpdateStep: (sectionIndex: number, stepIndex: number, updatedStep: PatternStep) => void;
  onDeleteStep: (sectionIndex: number, stepIndex: number) => void;
  onAddStep: (sectionIndex: number) => void;
  onUpdatePattern: (pattern: Pattern) => void;
  onAddSection: () => void;
  onOpenFollow: () => void;
  regenSection: number | null;
  regenNote: string;
  onRegenSectionChange: (sectionIndex: number | null) => void;
  onRegenNoteChange: (value: string) => void;
  onRegenerateSection: (note: string) => void;
  alignmentResults: Record<number, { score: number; feedback: string }>;
  alignmentLoading: Record<number, boolean>;
  onCheckAlignment: (sectionIndex: number) => void;
  onOpenCounter: () => void;
  isRegenerating: boolean;
  onOpenRegenAll: () => void;
}

/** Pattern tab — follow CTA, per-section editing + regen + alignment, regenerate-all. */
const PatternTab: React.FC<PatternTabProps> = ({
  pattern,
  expandedSections,
  onToggleSection,
  onUpdateStep,
  onDeleteStep,
  onAddStep,
  onUpdatePattern,
  onAddSection,
  onOpenFollow,
  regenSection,
  regenNote,
  onRegenSectionChange,
  onRegenNoteChange,
  onRegenerateSection,
  alignmentResults,
  alignmentLoading,
  onCheckAlignment,
  onOpenCounter,
  isRegenerating,
  onOpenRegenAll,
}) => (
  <div className="flex flex-col gap-4">
    <button
      onClick={onOpenFollow}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-[13.5px] transition-all hover:opacity-90 active:scale-[0.99]"
      style={{ background: "linear-gradient(135deg, #84934F, #6A7A3A)", color: "white", boxShadow: "0 4px 16px rgba(132,147,79,0.35)" }}
    >
      <Play className="h-4 w-4" /> Follow step-by-step
    </button>
    {pattern.sections
      // Keep the original index — updateStep addresses pattern.sections,
      // so filtering before mapping would corrupt edits whenever a
      // "Materials" section sits before the crochet sections.
      .map((section, sectionIndex) => ({ section, sectionIndex }))
      .filter(({ section }) => section.name.toLowerCase() !== "materials")
      .map(({ section, sectionIndex }) => (
      <div key={`section-${sectionIndex}`} className="flex flex-col gap-1.5">
        <PatternSection
          section={{...section, patternId: pattern.id}}
          projectType={pattern.projectType}
          sectionIndex={sectionIndex}
          isExpanded={expandedSections.has(section.name)}
          onToggleExpand={() => onToggleSection(section.name)}
          onUpdateStep={(stepIndex, updatedStep) => onUpdateStep(sectionIndex, stepIndex, updatedStep)}
          onDeleteStep={(stepIndex) => onDeleteStep(sectionIndex, stepIndex)}
          onAddStep={() => onAddStep(sectionIndex)}
          onUpdateSection={(updatedSection) => {
            const updatedSections = [...pattern.sections];
            updatedSections[sectionIndex] = updatedSection;
            onUpdatePattern({ ...pattern, sections: updatedSections });
          }}
        />
        {/* Inline section regen */}
        {regenSection === sectionIndex ? (
          <div className="p-3 rounded-2xl" style={{ background: "rgba(124,95,168,0.08)", border: "1px dashed rgba(124,95,168,0.3)" }}>
            <div className="flex items-center gap-2 mb-2">
              <img src="/characters/char-yala-transparent.png" alt="Yala"
                style={{ width: 28, height: 28, objectFit: "contain" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="text-[11px] font-semibold" style={{ color: "#7C5FA8" }}>Yala's regen tips</span>
            </div>
            <textarea
              rows={2}
              placeholder="Any specific instructions for this section? (optional)"
              value={regenNote}
              onChange={(e) => onRegenNoteChange(e.target.value)}
              className="w-full p-2.5 rounded-xl text-[12px] outline-none resize-none mb-2"
              style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(124,95,168,0.25)", color: palette.ink }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { onRegenerateSection(regenNote); onRegenSectionChange(null); }}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{ background: "linear-gradient(135deg, #7C5FA8, #5C3F88)", color: "white" }}
              >
                ⚡ Regenerate
              </button>
              <button
                onClick={() => onRegenSectionChange(null)}
                className="px-3 py-2 rounded-xl text-[12px]"
                style={{ color: palette.clay }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { onRegenSectionChange(sectionIndex); onRegenNoteChange(""); }}
            className="py-2 rounded-xl text-[11.5px] font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(124,95,168,0.07)", color: "#7C5FA8", border: "1px dashed rgba(124,95,168,0.22)" }}
          >
            ⚡ Regenerate this section
          </button>
        )}

        {/* Alignment check — only shown when the section has a photo */}
        {section.partImageUrl && (
          alignmentResults[sectionIndex] ? (
            <div className="p-3 rounded-2xl" style={{ background: "rgba(61,131,163,0.06)", border: "1px solid rgba(61,131,163,0.2)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold" style={{ color: palette.ink }}>📷 Photo alignment</span>
                <span className="text-[13px] font-bold" style={{
                  color: alignmentResults[sectionIndex].score >= 70 ? palette.sage
                    : alignmentResults[sectionIndex].score >= 40 ? "#D4921A"
                    : palette.rose,
                }}>
                  {alignmentResults[sectionIndex].score}/100
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed mb-1.5" style={{ color: palette.bark }}>
                {alignmentResults[sectionIndex].feedback}
              </p>
              <button
                onClick={() => onCheckAlignment(sectionIndex)}
                className="text-[11px] font-semibold hover:opacity-70"
                style={{ color: "#3D8FA3" }}
              >
                Re-check →
              </button>
            </div>
          ) : (
            <button
              onClick={() => onCheckAlignment(sectionIndex)}
              disabled={!!alignmentLoading[sectionIndex]}
              className="w-full py-2 rounded-xl text-[11.5px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(61,131,163,0.07)", color: "#3D8FA3", border: "1px dashed rgba(61,131,163,0.3)" }}
            >
              {alignmentLoading[sectionIndex] ? "⏳ Checking alignment…" : "📷 AI Photo Check"}
            </button>
          )
        )}
      </div>
    ))}

    <button
      className="w-full flex items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 transition-colors"
      onClick={onAddSection}
    >
      <Plus className="h-5 w-5 mr-2" />
      <span>Add New Section</span>
    </button>

    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary-600"
        onClick={onOpenCounter}
      >
        <Hash className="h-5 w-5" /> Stitch Counter
      </button>
      <button
        className={`inline-flex justify-center items-center px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark ${isRegenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
        onClick={onOpenRegenAll}
        disabled={isRegenerating}
      >
        {isRegenerating ? (
          <><RefreshCw className="h-5 w-5 mr-2 animate-spin" />Regenerating…</>
        ) : (
          <><RefreshCw className="h-5 w-5 mr-2" />Regenerate All</>
        )}
      </button>
    </div>
  </div>
);

export default PatternTab;
