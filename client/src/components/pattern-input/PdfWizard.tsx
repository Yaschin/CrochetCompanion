import { Dispatch, SetStateAction, ChangeEvent } from "react";
import { palette } from "@/lib/theme";
import { FileUp, ChevronRight, Plus } from "lucide-react";
import { CATEGORIES, SKILL_LEVELS, YARN_TYPES, PDF_LOADING_MSGS } from "./constants";

interface PdfWizardProps {
  pdfStep: number;
  setPdfStep: Dispatch<SetStateAction<number>>;
  pdfParsing: boolean;
  pdfFiles: File[];
  setPdfFiles: Dispatch<SetStateAction<File[]>>;
  handlePdfFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handlePdfUpload: () => void;
  pdfResult: any;
  setPdfResult: Dispatch<SetStateAction<any>>;
  pdfEditTitle: string;
  setPdfEditTitle: Dispatch<SetStateAction<string>>;
  pdfEditType: string;
  setPdfEditType: Dispatch<SetStateAction<string>>;
  pdfEditSkill: string;
  setPdfEditSkill: Dispatch<SetStateAction<string>>;
  pdfEditYarnType: string;
  setPdfEditYarnType: Dispatch<SetStateAction<string>>;
  pdfEditYarnReqs: Array<{ color: string; volume: string }>;
  setPdfEditYarnReqs: Dispatch<SetStateAction<Array<{ color: string; volume: string }>>>;
  pdfEditHooks: Array<{ size: string; note: string }>;
  setPdfEditHooks: Dispatch<SetStateAction<Array<{ size: string; note: string }>>>;
  pdfEditSections: Array<{ name: string; steps: Array<{ instruction: string; count?: string }> }>;
  setPdfEditSections: Dispatch<SetStateAction<Array<{ name: string; steps: Array<{ instruction: string; count?: string }> }>>>;
  pdfExpandedSec: number | null;
  setPdfExpandedSec: Dispatch<SetStateAction<number | null>>;
  pdfLoadingMsgIdx: number;
  handlePdfSave: () => void;
  pdfSaving: boolean;
}

/** The "Import PDF" 2-step wizard (upload → review & edit → save). */
export default function PdfWizard({
  pdfStep, setPdfStep, pdfParsing, pdfFiles, setPdfFiles, handlePdfFileChange, handlePdfUpload,
  pdfResult, setPdfResult, pdfEditTitle, setPdfEditTitle, pdfEditType, setPdfEditType, pdfEditSkill, setPdfEditSkill,
  pdfEditYarnType, setPdfEditYarnType, pdfEditYarnReqs, setPdfEditYarnReqs, pdfEditHooks, setPdfEditHooks,
  pdfEditSections, setPdfEditSections, pdfExpandedSec, setPdfExpandedSec, pdfLoadingMsgIdx,
  handlePdfSave, pdfSaving,
}: PdfWizardProps) {
  return (
    <>
          {/* Step 0 — Upload */}
          {pdfStep === 0 && (
            <div className="flex flex-col gap-4">

              {/* ── Aloo loading card (shown while processing) ── */}
              {pdfParsing ? (
                <div className="flex flex-col items-center gap-5 py-8 px-4">
                  {/* Aloo with bounce animation */}
                  <div style={{ animation: "alooFloat 2s ease-in-out infinite" }}>
                    <img
                      src="/characters/char-aloo-transparent.png"
                      alt="Aloo is reading your pattern"
                      style={{ width: 110, height: 110, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  <div className="text-center">
                    <p className="font-heading font-bold text-[18px] mb-1" style={{ color: palette.ink }}>
                      Aloo is on it!
                    </p>
                    <p className="text-[14px] transition-all duration-700" style={{ color: "#3D8FA3" }}>
                      {PDF_LOADING_MSGS[pdfLoadingMsgIdx]}
                    </p>
                  </div>

                  {/* Animated dots */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: "#3D8FA3",
                          opacity: 0.3 + (pdfLoadingMsgIdx % 3 === i ? 0.7 : 0),
                          transform: pdfLoadingMsgIdx % 3 === i ? "scale(1.4)" : "scale(1)",
                          transition: "all 0.4s ease",
                        }} />
                    ))}
                  </div>

                  <p className="text-[11px] text-center" style={{ color: "#B0908A" }}>
                    This usually takes 10–30 seconds
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-1">
                    <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Upload your PDF</h2>
                    <p className="text-[13px] mt-1" style={{ color: palette.clay }}>From Etsy, Ravelry, a blog — anywhere</p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => document.getElementById("pdf-file-input")?.click()}
                    className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                    style={{
                      borderColor: pdfFiles.length ? "#3D8FA3" : "rgba(61,143,163,0.40)",
                      background: pdfFiles.length ? "rgba(61,143,163,0.06)" : "rgba(255,252,245,0.7)",
                      minHeight: pdfFiles.length ? "auto" : 180,
                      padding: pdfFiles.length ? "14px 16px" : "24px 16px",
                    }}>
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      className="hidden"
                      onChange={handlePdfFileChange}
                    />
                    {pdfFiles.length > 0 ? (
                      <div className="w-full flex flex-col gap-2">
                        {pdfFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                            style={{ background: "rgba(61,143,163,0.10)" }}>
                            <span style={{ fontSize: 20, flexShrink: 0 }}>📄</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[12px] truncate" style={{ color: "#2A6B7D" }}>{f.name}</p>
                              <p className="text-[10px]" style={{ color: palette.clay }}>{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setPdfFiles(prev => prev.filter((_, j) => j !== i)); }}
                              className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-lg hover:opacity-75"
                              style={{ color: palette.clay, background: "rgba(0,0,0,0.06)" }}>
                              ✕
                            </button>
                          </div>
                        ))}
                        {pdfFiles.length < 5 && (
                          <div className="flex items-center justify-center gap-1.5 pt-1"
                            style={{ color: "#3D8FA3", fontSize: 12, fontWeight: 600 }}>
                            <FileUp className="h-3.5 w-3.5" /> Add another PDF
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <FileUp className="h-10 w-10" style={{ color: "rgba(61,143,163,0.55)" }} />
                        <div className="text-center">
                          <p className="font-heading font-semibold text-[14px]" style={{ color: "#5C3A28" }}>Tap to choose PDFs</p>
                          <p className="text-[12px] mt-0.5" style={{ color: palette.clay }}>Up to 5 files · 10 MB each · Text-based only</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personal use note */}
                  <p className="text-[11px] text-center" style={{ color: "#B0908A" }}>
                    📋 Imported patterns are for your personal use only
                  </p>

                  <button
                    onClick={handlePdfUpload}
                    disabled={!pdfFiles.length}
                    className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: !pdfFiles.length ? "rgba(61,143,163,0.35)" : "linear-gradient(135deg, #3D8FA3, #2A6B7D)",
                      color: "white",
                      boxShadow: !pdfFiles.length ? "none" : "0 6px 24px rgba(61,143,163,0.38)",
                    }}>
                    <FileUp className="h-5 w-5" />
                    {pdfFiles.length > 1 ? `Read & Extract (${pdfFiles.length} PDFs)` : "Read & Extract Pattern"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 1 — Review & Edit */}
          {pdfStep === 1 && pdfResult && (
            <div className="flex flex-col gap-5">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Review & edit</h2>
                <p className="text-[13px] mt-1" style={{ color: palette.clay }}>Fix anything the AI got wrong before saving</p>
              </div>

              {/* Import banner */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl"
                style={{ background: "rgba(61,143,163,0.09)", border: "1px solid rgba(61,143,163,0.28)" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                <p className="text-[12px] leading-snug" style={{ color: "#2A6B7D" }}>
                  <strong>From:</strong> {pdfFiles.map(f => f.name).join(', ')} · Diagrams weren't imported, only written instructions.
                </p>
              </div>

              {/* ── Title ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Pattern name</label>
                <input
                  type="text"
                  value={pdfEditTitle}
                  onChange={e => setPdfEditTitle(e.target.value)}
                  placeholder="Pattern name…"
                  className="w-full p-3.5 rounded-2xl text-[14px] outline-none"
                  style={{
                    background: "rgba(255,252,245,0.95)",
                    border: `1.5px solid ${pdfEditTitle.trim() ? "#3D8FA3" : "rgba(140,100,55,0.22)"}`,
                    color: palette.ink,
                  }}
                />
              </div>

              {/* ── Project type ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Type</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setPdfEditType(c.id)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditType === c.id ? c.color : "rgba(140,100,55,0.08)",
                        color: pdfEditType === c.id ? "white" : "#7A5A4A",
                        border: pdfEditType === c.id ? "none" : "1.5px solid rgba(140,100,55,0.15)",
                      }}>
                      {c.emoji} {c.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Skill level ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Skill level</label>
                <div className="flex gap-2">
                  {SKILL_LEVELS.map(s => (
                    <button key={s.id} onClick={() => setPdfEditSkill(s.id)}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditSkill === s.id ? palette.ink : "rgba(140,100,55,0.08)",
                        color: pdfEditSkill === s.id ? "white" : "#7A5A4A",
                        border: pdfEditSkill === s.id ? "none" : "1.5px solid rgba(140,100,55,0.15)",
                      }}>
                      {s.emoji} {s.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Yarn type ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Yarn type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {YARN_TYPES.map(yt => (
                    <button key={yt} onClick={() => setPdfEditYarnType(yt)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditYarnType === yt ? "#D4921A" : "rgba(140,100,55,0.08)",
                        color: pdfEditYarnType === yt ? "white" : "#7A5A4A",
                        border: pdfEditYarnType === yt ? "none" : "1.5px solid rgba(140,100,55,0.15)",
                      }}>
                      {yt}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Yarn requirements ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-heading font-semibold text-[13px]" style={{ color: "#5C3A28" }}>Yarn needed</label>
                  <button onClick={() => setPdfEditYarnReqs(p => [...p, { color: "", volume: "" }])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(61,143,163,0.12)", color: "#2A6B7D" }}>
                    + Add
                  </button>
                </div>
                {pdfEditYarnReqs.length === 0 && (
                  <p className="text-[12px] italic" style={{ color: "#B0908A" }}>Nothing detected — tap + Add to add yarn</p>
                )}
                {pdfEditYarnReqs.map((y, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input value={y.color}
                      onChange={e => setPdfEditYarnReqs(p => p.map((r, j) => j === i ? { ...r, color: e.target.value } : r))}
                      placeholder="Colour / name"
                      className="flex-1 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: palette.ink }} />
                    <input value={y.volume}
                      onChange={e => setPdfEditYarnReqs(p => p.map((r, j) => j === i ? { ...r, volume: e.target.value } : r))}
                      placeholder="Amount (e.g. 50g)"
                      className="w-28 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: palette.ink }} />
                    <button onClick={() => setPdfEditYarnReqs(p => p.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
                      style={{ background: "rgba(194,78,107,0.12)", color: palette.rose }}>×</button>
                  </div>
                ))}
              </div>

              {/* ── Hook requirements ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-heading font-semibold text-[13px]" style={{ color: "#5C3A28" }}>Hook size</label>
                  <button onClick={() => setPdfEditHooks(p => [...p, { size: "", note: "" }])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(61,143,163,0.12)", color: "#2A6B7D" }}>
                    + Add
                  </button>
                </div>
                {pdfEditHooks.length === 0 && (
                  <p className="text-[12px] italic" style={{ color: "#B0908A" }}>Nothing detected — tap + Add to add a hook</p>
                )}
                {pdfEditHooks.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input value={h.size}
                      onChange={e => setPdfEditHooks(p => p.map((r, j) => j === i ? { ...r, size: e.target.value } : r))}
                      placeholder="e.g. 4.0mm"
                      className="w-28 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: palette.ink }} />
                    <input value={h.note}
                      onChange={e => setPdfEditHooks(p => p.map((r, j) => j === i ? { ...r, note: e.target.value } : r))}
                      placeholder="Note (optional)"
                      className="flex-1 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: palette.ink }} />
                    <button onClick={() => setPdfEditHooks(p => p.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
                      style={{ background: "rgba(194,78,107,0.12)", color: palette.rose }}>×</button>
                  </div>
                ))}
              </div>

              {/* ── Sections & steps ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>
                  Sections & steps
                  <span className="ml-1.5 font-normal text-[11px]" style={{ color: palette.clay }}>tap a section to edit its steps</span>
                </label>
                {pdfEditSections.map((sec, si) => (
                  <div key={si} className="mb-2 rounded-2xl overflow-hidden"
                    style={{ border: "1.5px solid rgba(140,100,55,0.18)" }}>
                    {/* Section header row */}
                    <div className="flex items-center gap-2 px-3 py-2.5"
                      style={{ background: pdfExpandedSec === si ? "rgba(61,143,163,0.08)" : "rgba(255,252,245,0.7)" }}>
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "#3D8FA3" }}>§{si + 1}</span>
                      <input
                        value={sec.name}
                        onChange={e => setPdfEditSections(p => p.map((s, j) => j === si ? { ...s, name: e.target.value } : s))}
                        className="flex-1 bg-transparent outline-none text-[13px] font-semibold"
                        style={{ color: palette.ink }}
                        placeholder="Section name"
                      />
                      <button
                        onClick={() => setPdfExpandedSec(pdfExpandedSec === si ? null : si)}
                        className="flex items-center gap-1 flex-shrink-0"
                        style={{ color: palette.clay }}>
                        <span className="text-[10px]">{sec.steps?.length ?? 0} steps</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform"
                          style={{ transform: pdfExpandedSec === si ? "rotate(90deg)" : "rotate(0deg)" }} />
                      </button>
                      <button onClick={() => { setPdfEditSections(p => p.filter((_, j) => j !== si)); if (pdfExpandedSec === si) setPdfExpandedSec(null); }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                        style={{ background: "rgba(194,78,107,0.10)", color: palette.rose }}>×</button>
                    </div>

                    {/* Steps (expanded) */}
                    {pdfExpandedSec === si && (
                      <div className="px-3 py-3 flex flex-col gap-2"
                        style={{ background: "rgba(255,252,245,0.5)", borderTop: "1px solid rgba(140,100,55,0.10)" }}>
                        {(sec.steps || []).map((step: any, sti: number) => (
                          <div key={sti} className="flex gap-2 items-start">
                            <span className="text-[10px] font-semibold mt-2.5 w-4 text-right flex-shrink-0" style={{ color: "#B0908A" }}>{sti + 1}</span>
                            <textarea
                              value={step.instruction}
                              onChange={e => setPdfEditSections(p => p.map((s, j) => j === si
                                ? { ...s, steps: s.steps.map((st: any, k: number) => k === sti ? { ...st, instruction: e.target.value } : st) }
                                : s))}
                              rows={2}
                              className="flex-1 p-2 rounded-xl text-[12px] outline-none resize-none leading-snug"
                              style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.15)", color: palette.ink }}
                            />
                            <button
                              onClick={() => setPdfEditSections(p => p.map((s, j) => j === si
                                ? { ...s, steps: s.steps.filter((_: any, k: number) => k !== sti) }
                                : s))}
                              className="w-6 h-6 mt-1.5 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                              style={{ background: "rgba(194,78,107,0.10)", color: palette.rose }}>×</button>
                          </div>
                        ))}
                        <button
                          onClick={() => setPdfEditSections(p => p.map((s, j) => j === si
                            ? { ...s, steps: [...(s.steps || []), { instruction: "", count: "" }] }
                            : s))}
                          className="text-[11px] font-semibold py-1.5 rounded-xl w-full"
                          style={{ background: "rgba(61,143,163,0.10)", color: "#2A6B7D" }}>
                          + Add step
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => { setPdfEditSections(p => [...p, { name: "New section", steps: [{ instruction: "", count: "" }] }]); setPdfExpandedSec(pdfEditSections.length); }}
                  className="w-full py-2 rounded-xl text-[12px] font-semibold mt-1"
                  style={{ background: "rgba(140,100,55,0.06)", color: palette.clay, border: "1.5px dashed rgba(140,100,55,0.22)" }}>
                  + Add section
                </button>
              </div>

              <button
                onClick={handlePdfSave}
                disabled={pdfSaving || !pdfEditTitle.trim()}
                className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: pdfSaving ? "rgba(61,143,163,0.35)" : "linear-gradient(135deg, #3D8FA3, #2A6B7D)",
                  color: "white",
                  boxShadow: pdfSaving ? "none" : "0 6px 24px rgba(61,143,163,0.38)",
                }}>
                {pdfSaving
                  ? <><span className="animate-spin">🧶</span> Saving…</>
                  : <><Plus className="h-5 w-5" /> Save to my library</>}
              </button>

              <button
                onClick={() => { setPdfStep(0); setPdfResult(null); setPdfFiles([]); }}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: "rgba(140,100,55,0.08)", color: palette.clay }}>
                ← Try a different PDF
              </button>
            </div>
          )}
        </>
  );
}
