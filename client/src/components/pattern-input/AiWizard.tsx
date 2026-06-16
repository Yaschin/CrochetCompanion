import { Dispatch, SetStateAction, ChangeEvent } from "react";
import { palette } from "@/lib/theme";
import { PatternInputFormData } from "@/lib/types";
import { Sparkles } from "lucide-react";
import { CATEGORIES, SIZE_OPTIONS, COLOR_PALETTE } from "./constants";
import { CategoryPicker, SkillPicker, YarnPicker } from "./Pickers";

interface AiWizardProps {
  formData: PatternInputFormData;
  setFormData: Dispatch<SetStateAction<PatternInputFormData>>;
  wizardStep: number;
  setWizardStep: Dispatch<SetStateAction<number>>;
  wizardColors: string[];
  setWizardColors: Dispatch<SetStateAction<string[]>>;
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isGenerating: boolean;
  handleGeneratePattern: () => void;
  canAdvance: () => boolean;
}

/** The "Create with AI" 5-step wizard (item → details → yarn → photo → review). */
export default function AiWizard({
  formData, setFormData, wizardStep, setWizardStep, wizardColors, setWizardColors,
  file, setFile, handleFileChange, isGenerating, handleGeneratePattern, canAdvance,
}: AiWizardProps) {
  const activeCategory = CATEGORIES.find(c => c.id === formData.projectType);
  return (
    <>
          {/* Step 0 — What are you making? */}
          {wizardStep === 0 && (
            <div>
              <div className="text-center mb-5">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>What are you making?</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Pick a category to get started</p>
              </div>
              <CategoryPicker formData={formData} setFormData={setFormData} />
            </div>
          )}

          {/* Step 1 — Details */}
          {wizardStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Tell us about it</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Describe your vision and skill level</p>
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Describe your idea ✨</label>
                <textarea rows={4}
                  placeholder="e.g. A cosy sunflower bag for everyday use, in pastel yellow and green…"
                  value={formData.prompt}
                  onChange={e => setFormData(p => ({ ...p, prompt: e.target.value }))}
                  className="w-full p-4 rounded-2xl text-[13px] leading-relaxed outline-none resize-none transition-all"
                  style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.22)", color: palette.ink }} />
              </div>
              <SkillPicker formData={formData} setFormData={setFormData} />
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Approximate Size</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map(sz => (
                    <button key={sz} onClick={() => setFormData(p => ({ ...p, size: sz }))}
                      className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: formData.size === sz ? "rgba(132,147,79,0.14)" : "rgba(255,252,245,0.9)",
                        border: `1.5px solid ${formData.size === sz ? palette.sage : "rgba(140,100,55,0.18)"}`,
                        color: formData.size === sz ? palette.sage : "#5C3A28",
                      }}>{sz}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Yarn & Colours */}
          {wizardStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Yarn & Colours</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Choose your materials (optional)</p>
              </div>
              <YarnPicker formData={formData} setFormData={setFormData} />
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>
                  Colour Palette
                  {wizardColors.length > 0 && <span className="ml-2 text-[11px] font-normal" style={{ color: palette.clay }}>({wizardColors.length} selected)</span>}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_PALETTE.map(c => (
                    <button key={c}
                      onClick={() => setWizardColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                      className="w-9 h-9 rounded-xl transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: c,
                        border: wizardColors.includes(c) ? "3px solid #3D2318" : "2px solid rgba(255,255,255,0.6)",
                        boxShadow: wizardColors.includes(c) ? "0 0 0 2px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.12)",
                      }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Inspiration photo */}
          {wizardStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Inspiration Photo</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Upload a reference image (optional)</p>
              </div>
              <div
                onClick={() => document.getElementById("wizard-file-input")?.click()}
                className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                style={{ borderColor: file ? palette.sage : "rgba(140,100,55,0.35)", background: file ? "rgba(132,147,79,0.06)" : "rgba(255,252,245,0.7)", minHeight: 200 }}>
                <input id="wizard-file-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <div className="text-center px-4">
                    <span style={{ fontSize: 40 }}>🖼️</span>
                    <p className="font-semibold text-[14px] mt-2" style={{ color: palette.sage }}>{file.name}</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-[11px] mt-1 underline" style={{ color: palette.clay }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: 44 }}>📸</span>
                    <div className="text-center">
                      <p className="font-heading font-semibold text-[14px]" style={{ color: "#5C3A28" }}>Drop a photo here</p>
                      <p className="text-[12px] mt-0.5" style={{ color: palette.clay }}>or tap to browse</p>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setWizardStep(4)}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{ background: "rgba(140,100,55,0.08)", color: palette.clay, border: "1px dashed rgba(140,100,55,0.25)" }}>
                Skip this step →
              </button>
            </div>
          )}

          {/* Step 4 — Review & Generate */}
          {wizardStep === 4 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Ready to create!</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Yala will craft your pattern ✨</p>
              </div>
              <div className="craft-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 pb-2.5" style={{ borderBottom: "1px dashed rgba(140,100,55,0.2)" }}>
                  <span style={{ fontSize: 28 }}>{activeCategory?.emoji ?? "🧶"}</span>
                  <div>
                    <p className="font-heading font-bold text-[15px]" style={{ color: palette.ink }}>{formData.projectType || "—"}</p>
                    <p className="text-[11px]" style={{ color: palette.clay }}>{formData.skillLevel}</p>
                  </div>
                </div>
                {formData.prompt && (
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: palette.muted }}>Description</p>
                    <p className="text-[12.5px] leading-snug" style={{ color: "#5C3A28" }}>{formData.prompt}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.size && <span className="badge-green">{formData.size}</span>}
                  {formData.yarnType && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(212,146,26,0.12)", color: "#D4921A" }}>{formData.yarnType}</span>}
                  {wizardColors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {wizardColors.slice(0, 5).map(c => (
                        <div key={c} className="w-4 h-4 rounded-full border-2 border-white" style={{ background: c, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                      ))}
                      {wizardColors.length > 5 && <span className="text-[10px]" style={{ color: palette.clay }}>+{wizardColors.length - 5}</span>}
                    </div>
                  )}
                  {file && <span className="text-[11px]" style={{ color: palette.sage }}>📸 Reference image</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl" style={{ background: "rgba(124,95,168,0.08)", border: "1px dashed rgba(124,95,168,0.25)" }}>
                <img src="/characters/char-yala-transparent.png" alt="Yala"
                  style={{ width: 48, height: 48, objectFit: "contain" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <p className="text-[12px] italic leading-snug" style={{ color: "#7C5FA8" }}>
                  "I've got everything I need. Let me weave some magic for you!"
                </p>
              </div>
              <button onClick={handleGeneratePattern} disabled={isGenerating}
                className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: isGenerating ? "rgba(194,78,107,0.4)" : "linear-gradient(135deg, #C24E6B, #A83050)",
                  color: "white",
                  boxShadow: isGenerating ? "none" : "0 6px 24px rgba(194,78,107,0.4)",
                }}>
                {isGenerating ? <><span className="animate-spin">🧶</span> Generating…</> : <><Sparkles className="h-5 w-5" /> Generate with Yala</>}
              </button>
            </div>
          )}

          {/* AI nav */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setWizardStep(s => Math.max(0, s - 1))} disabled={wizardStep === 0}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-80 disabled:opacity-30"
              style={{ background: "rgba(140,100,55,0.09)", color: "#5C3A28" }}>← Back</button>
            {wizardStep < 4 && (
              <button onClick={() => canAdvance() && setWizardStep(s => s + 1)} disabled={!canAdvance()}
                className="px-6 py-2.5 rounded-xl font-heading font-bold text-[13px] transition-all hover:opacity-90 disabled:opacity-35"
                style={{
                  background: canAdvance() ? "linear-gradient(135deg, #C24E6B, #A83050)" : "rgba(140,100,55,0.12)",
                  color: canAdvance() ? "white" : palette.clay,
                  boxShadow: canAdvance() ? "0 3px 12px rgba(194,78,107,0.35)" : "none",
                }}>
                {wizardStep === 3 ? "Review →" : "Next →"}
              </button>
            )}
          </div>
        </>
  );
}
