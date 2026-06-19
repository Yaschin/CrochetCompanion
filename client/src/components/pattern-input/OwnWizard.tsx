import { Dispatch, SetStateAction } from "react";
import { palette } from "@/lib/theme";
import { PatternInputFormData } from "@/lib/types";
import { Plus } from "lucide-react";
import { CATEGORIES, SKILL_LEVELS } from "./constants";
import { CategoryPicker, YarnPicker, SizePicker } from "./Pickers";

interface OwnWizardProps {
  formData: PatternInputFormData;
  setFormData: Dispatch<SetStateAction<PatternInputFormData>>;
  ownStep: number;
  setOwnStep: Dispatch<SetStateAction<number>>;
  ownTitle: string;
  setOwnTitle: Dispatch<SetStateAction<string>>;
  ownRawText: string;
  setOwnRawText: Dispatch<SetStateAction<string>>;
  ownParsing: boolean;
  handleSaveOwn: () => void;
  ownCanAdvance: () => boolean;
}

/** The "Add my own" 3-step wizard (name+type → details → paste & save). */
export default function OwnWizard({
  formData, setFormData, ownStep, setOwnStep, ownTitle, setOwnTitle,
  ownRawText, setOwnRawText, ownParsing, handleSaveOwn, ownCanAdvance,
}: OwnWizardProps) {
  return (
    <>
          {/* Step 0 — Name + Type */}
          {ownStep === 0 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Name your pattern</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>What's it called and what type is it?</p>
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Pattern name *</label>
                <input
                  type="text"
                  value={ownTitle}
                  onChange={e => setOwnTitle(e.target.value)}
                  placeholder="e.g. Mum's Granny Square Blanket"
                  className="w-full p-4 rounded-2xl text-[14px] outline-none transition-all"
                  style={{ background: "rgba(255,252,245,0.95)", border: `1.5px solid ${ownTitle.trim() ? palette.sage : "rgba(140,100,55,0.22)"}`, color: palette.ink }}
                />
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Pattern type *</label>
                <CategoryPicker formData={formData} setFormData={setFormData} />
              </div>
            </div>
          )}

          {/* Step 1 — Details */}
          {ownStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>A few details</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Helps with tracking and yarn recs</p>
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>
                  Skill Level <span style={{ color: palette.rose }}>*</span>
                </label>
                <div className="flex gap-2">
                  {SKILL_LEVELS.map((lvl) => (
                    <button key={lvl.id}
                      onClick={() => setFormData(p => ({ ...p, skillLevel: lvl.id }))}
                      className="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
                      style={{
                        background: formData.skillLevel === lvl.id ? "rgba(194,78,107,0.10)" : "rgba(255,252,245,0.9)",
                        border: `1.5px solid ${formData.skillLevel === lvl.id ? palette.rose : "rgba(140,100,55,0.18)"}`,
                      }}>
                      <span style={{ fontSize: 22 }}>{lvl.emoji}</span>
                      <span className="text-[11px] font-bold" style={{ color: formData.skillLevel === lvl.id ? palette.rose : palette.cocoa }}>{lvl.id}</span>
                      <span className="text-[9.5px] text-center" style={{ color: palette.clay }}>{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <YarnPicker formData={formData} setFormData={setFormData} />
              <SizePicker formData={formData} setFormData={setFormData} />
            </div>
          )}

          {/* Step 2 — Paste + Save */}
          {ownStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Paste your pattern</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>From a book, website, or your own notes</p>
              </div>

              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>
                  Pattern instructions <span className="font-normal" style={{ color: palette.clay }}>(optional)</span>
                </label>
                <textarea
                  rows={10}
                  placeholder={"Paste your pattern text here — rounds, rows, materials, anything.\n\nLeave blank to create an empty pattern you can fill in manually."}
                  value={ownRawText}
                  onChange={e => setOwnRawText(e.target.value)}
                  className="w-full p-4 rounded-2xl text-[13px] leading-relaxed outline-none resize-none"
                  style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.22)", color: palette.ink }}
                />
                {ownRawText.trim() && (
                  <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: palette.sage }}>
                    ✨ AI will organise this into sections and steps for you
                  </p>
                )}
                {!ownRawText.trim() && (
                  <p className="text-[11px] mt-1.5" style={{ color: palette.clay }}>
                    No text? No problem — we'll create a blank pattern you can fill in as you go.
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="craft-card p-4 flex flex-col gap-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: palette.muted }}>Summary</p>
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: 24 }}>{CATEGORIES.find(c => c.id === formData.projectType)?.emoji ?? "🧶"}</span>
                  <div>
                    <p className="font-heading font-bold text-[14px]" style={{ color: palette.ink }}>{ownTitle}</p>
                    <p className="text-[11px]" style={{ color: palette.clay }}>{formData.projectType} · {formData.skillLevel}{formData.yarnType ? ` · ${formData.yarnType}` : ""}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveOwn}
                disabled={ownParsing}
                className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: ownParsing ? "rgba(132,147,79,0.4)" : "linear-gradient(135deg, #84934F, #5A6E30)",
                  color: "white",
                  boxShadow: ownParsing ? "none" : "0 6px 24px rgba(132,147,79,0.4)",
                }}>
                {ownParsing
                  ? <><span className="animate-spin">🧶</span> {ownRawText.trim() ? "Organising your pattern…" : "Saving…"}</>
                  : <><Plus className="h-5 w-5" /> Add to my library</>}
              </button>
            </div>
          )}

          {/* Own nav */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setOwnStep(s => Math.max(0, s - 1))} disabled={ownStep === 0}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-80 disabled:opacity-30"
              style={{ background: "rgba(140,100,55,0.09)", color: palette.cocoa }}>← Back</button>
            {ownStep < 2 && (
              <button onClick={() => ownCanAdvance() && setOwnStep(s => s + 1)} disabled={!ownCanAdvance()}
                className="px-6 py-2.5 rounded-xl font-heading font-bold text-[13px] transition-all hover:opacity-90 disabled:opacity-35"
                style={{
                  background: ownCanAdvance() ? "linear-gradient(135deg, #84934F, #5A6E30)" : "rgba(140,100,55,0.12)",
                  color: ownCanAdvance() ? "white" : palette.clay,
                  boxShadow: ownCanAdvance() ? "0 3px 12px rgba(132,147,79,0.35)" : "none",
                }}>
                Next →
              </button>
            )}
          </div>
        </>
  );
}
