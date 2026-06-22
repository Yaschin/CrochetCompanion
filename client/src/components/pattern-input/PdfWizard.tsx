import { useState, useEffect, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { palette } from "@/lib/theme";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pattern } from "@/lib/types";
import { FileUp, ChevronRight, Plus } from "lucide-react";
import { CATEGORIES, SKILL_LEVELS, YARN_TYPES, PDF_STEPS, PDF_TIPS, PDF_LOADING_MSGS } from "./constants";
import { fileToBase64, buildPatternToSave } from "./helpers";
import { attachSourceFiles } from "@/lib/documents";
import WizardChrome from "./WizardChrome";

interface PdfWizardProps {
  onPatternCreated: (pattern: Pattern, skipLoading?: boolean) => void;
}

/** The "Import PDF" 2-step wizard (upload → review & edit → save). Self-contained:
 *  it owns all PDF state, its parse/save mutations, and renders its own chrome. */
export default function PdfWizard({ onPatternCreated }: PdfWizardProps) {
  const { toast } = useToast();

  const [pdfStep, setPdfStep]         = useState(0);
  const [pdfFiles, setPdfFiles]       = useState<File[]>([]);
  const [pdfParsing, setPdfParsing]   = useState(false);
  const [pdfResult, setPdfResult]     = useState<any>(null);
  const [pdfEditTitle, setPdfEditTitle] = useState("");
  const [pdfSaving, setPdfSaving]         = useState(false);
  const [pdfEditType, setPdfEditType]     = useState("");
  const [pdfEditSkill, setPdfEditSkill]   = useState("");
  const [pdfEditYarnType, setPdfEditYarnType] = useState("");
  const [pdfEditYarnReqs, setPdfEditYarnReqs] = useState<Array<{color: string; volume: string}>>([]);
  const [pdfEditHooks, setPdfEditHooks]   = useState<Array<{size: string; note: string}>>([]);
  const [pdfEditSections, setPdfEditSections] = useState<Array<{name: string; steps: Array<{instruction: string; count?: string}>}>>([]);
  const [pdfExpandedSec, setPdfExpandedSec]   = useState<number | null>(null);
  const [pdfLoadingMsgIdx, setPdfLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!pdfParsing) { setPdfLoadingMsgIdx(0); return; }
    const id = setInterval(() => setPdfLoadingMsgIdx(i => (i + 1) % PDF_LOADING_MSGS.length), 2800);
    return () => clearInterval(id);
  }, [pdfParsing]);

  const parsePdfMutation = useMutation({
    mutationFn: async (filesBase64: string[]) => {
      const res = await apiRequest('POST', '/api/parse-pdf', { filesBase64 });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to process PDF');
      }
      return res.json();
    },
  });

  const savePatternMutation = useMutation({
    mutationFn: async (pattern: Omit<Pattern, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/patterns', pattern);
      return res.json();
    },
  });

  const handlePdfFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const incoming = Array.from(e.target.files);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of incoming) {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`${f.name} is not a PDF`); continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        errors.push(`${f.name} is over 10 MB`); continue;
      }
      valid.push(f);
    }
    if (errors.length) toast({ title: "Some files skipped", description: errors.join(' · '), variant: "destructive" });
    setPdfFiles(prev => {
      const combined = [...prev, ...valid];
      if (combined.length > 5) {
        toast({ title: "Max 5 PDFs", description: "Only the first 5 files will be used.", variant: "destructive" });
        return combined.slice(0, 5);
      }
      return combined;
    });
    e.target.value = "";
  };

  const handlePdfUpload = async () => {
    if (!pdfFiles.length) return;
    setPdfParsing(true);
    try {
      const allBase64 = await Promise.all(pdfFiles.map(fileToBase64));
      const result = await parsePdfMutation.mutateAsync(allBase64);
      setPdfResult(result);
      setPdfEditTitle(result.title || "Imported Pattern");
      setPdfEditType(result.projectType || "Other");
      setPdfEditSkill(result.skillLevel || "Beginner");
      setPdfEditYarnType(result.yarnType || "Not specified");
      setPdfEditYarnReqs(result.yarnRequirements || []);
      setPdfEditHooks(result.hookRequirements || []);
      setPdfEditSections(result.sections || []);
      setPdfExpandedSec(null);
      setPdfStep(1);
    } catch (err: any) {
      const raw = err.message || "Something went wrong.";
      const clean = raw.replace(/^API request failed \(\d+\):\s*/i, "");
      toast({
        title: "Couldn't read PDF",
        description: clean || "Try 'Add my own' and paste the text manually.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setPdfParsing(false);
    }
  };

  const handlePdfSave = async () => {
    if (!pdfResult) return;
    setPdfSaving(true);
    try {
      const title = pdfEditTitle.trim() || pdfResult.title || "Imported Pattern";
      const merged = {
        ...pdfResult,
        title,
        projectType: pdfEditType || "Other",
        skillLevel:  pdfEditSkill || "Beginner",
        yarnType:    pdfEditYarnType === "Not specified" ? "" : (pdfEditYarnType || ""),
        yarnRequirements: pdfEditYarnReqs.filter(y => y.color.trim()),
        hookRequirements: pdfEditHooks.filter(h => h.size.trim()),
        sections:    pdfEditSections,
      };
      const patternToSave = buildPatternToSave(
        merged,
        {
          prompt: title,
          projectType: merged.projectType,
          skillLevel:  merged.skillLevel,
          yarnType:    merged.yarnType,
          size: "",
        },
        undefined,
      );
      const savedPattern = await savePatternMutation.mutateAsync(patternToSave);
      // Keep the original PDF(s) so you can refer back to them later. Best-effort:
      // a storage hiccup shouldn't lose the pattern you just imported.
      let withFiles = savedPattern;
      try {
        if (pdfFiles.length) {
          const sourceFiles = await attachSourceFiles(savedPattern.id, pdfFiles);
          withFiles = { ...savedPattern, sourceFiles };
        }
      } catch (e) {
        console.warn('Could not store original PDF(s):', e);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      onPatternCreated(withFiles, true);
      toast({
        title: "Pattern imported! 🎉",
        description: `"${savedPattern.title}" is now in your library. Tap any step to edit it.`,
        duration: 6000,
      });
    } catch (err) {
      console.error('Error saving PDF pattern:', err);
      toast({ title: "Couldn't save", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setPdfSaving(false);
    }
  };

  return (
    <>
      <WizardChrome
        steps={PDF_STEPS}
        currentStep={pdfStep}
        tips={PDF_TIPS}
        modeAccent={palette.teal}
        modeAccentRgb="61,143,163"
        charImg="/characters/char-ashi-transparent.png"
      />

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
                    <p className="text-[14px] transition-all duration-700" style={{ color: palette.teal }}>
                      {PDF_LOADING_MSGS[pdfLoadingMsgIdx]}
                    </p>
                  </div>

                  {/* Animated dots */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: palette.teal,
                          opacity: 0.3 + (pdfLoadingMsgIdx % 3 === i ? 0.7 : 0),
                          transform: pdfLoadingMsgIdx % 3 === i ? "scale(1.4)" : "scale(1)",
                          transition: "all 0.4s ease",
                        }} />
                    ))}
                  </div>

                  <p className="text-[11px] text-center" style={{ color: palette.muted }}>
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
                      borderColor: pdfFiles.length ? palette.teal : "rgba(61,143,163,0.40)",
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
                            style={{ color: palette.teal, fontSize: 12, fontWeight: 600 }}>
                            <FileUp className="h-3.5 w-3.5" /> Add another PDF
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <FileUp className="h-10 w-10" style={{ color: "rgba(61,143,163,0.55)" }} />
                        <div className="text-center">
                          <p className="font-heading font-semibold text-[14px]" style={{ color: palette.cocoa }}>Tap to choose PDFs</p>
                          <p className="text-[12px] mt-0.5" style={{ color: palette.clay }}>Up to 5 files · 10 MB each · Text-based only</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personal use note */}
                  <p className="text-[11px] text-center" style={{ color: palette.muted }}>
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
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Pattern name</label>
                <input
                  type="text"
                  value={pdfEditTitle}
                  onChange={e => setPdfEditTitle(e.target.value)}
                  placeholder="Pattern name…"
                  className="w-full p-3.5 rounded-2xl text-[14px] outline-none"
                  style={{
                    background: "rgba(255,252,245,0.95)",
                    border: `1.5px solid ${pdfEditTitle.trim() ? palette.teal : "rgba(140,100,55,0.22)"}`,
                    color: palette.ink,
                  }}
                />
              </div>

              {/* ── Project type ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Type</label>
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
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Skill level</label>
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
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Yarn type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {YARN_TYPES.map(yt => (
                    <button key={yt} onClick={() => setPdfEditYarnType(yt)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditYarnType === yt ? palette.amber : "rgba(140,100,55,0.08)",
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
                  <label className="font-heading font-semibold text-[13px]" style={{ color: palette.cocoa }}>Yarn needed</label>
                  <button onClick={() => setPdfEditYarnReqs(p => [...p, { color: "", volume: "" }])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(61,143,163,0.12)", color: "#2A6B7D" }}>
                    + Add
                  </button>
                </div>
                {pdfEditYarnReqs.length === 0 && (
                  <p className="text-[12px] italic" style={{ color: palette.muted }}>Nothing detected — tap + Add to add yarn</p>
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
                  <label className="font-heading font-semibold text-[13px]" style={{ color: palette.cocoa }}>Hook size</label>
                  <button onClick={() => setPdfEditHooks(p => [...p, { size: "", note: "" }])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(61,143,163,0.12)", color: "#2A6B7D" }}>
                    + Add
                  </button>
                </div>
                {pdfEditHooks.length === 0 && (
                  <p className="text-[12px] italic" style={{ color: palette.muted }}>Nothing detected — tap + Add to add a hook</p>
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
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>
                  Sections & steps
                  <span className="ml-1.5 font-normal text-[11px]" style={{ color: palette.clay }}>tap a section to edit its steps</span>
                </label>
                {pdfEditSections.map((sec, si) => (
                  <div key={si} className="mb-2 rounded-2xl overflow-hidden"
                    style={{ border: "1.5px solid rgba(140,100,55,0.18)" }}>
                    {/* Section header row */}
                    <div className="flex items-center gap-2 px-3 py-2.5"
                      style={{ background: pdfExpandedSec === si ? "rgba(61,143,163,0.08)" : "rgba(255,252,245,0.7)" }}>
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: palette.teal }}>§{si + 1}</span>
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
                            <span className="text-[10px] font-semibold mt-2.5 w-4 text-right flex-shrink-0" style={{ color: palette.muted }}>{sti + 1}</span>
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
