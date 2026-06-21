import { palette } from "@/lib/theme";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, Shield, Heart, HelpCircle, Activity, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ViewType } from "../lib/types";
import { getActiveProfile, withProfile } from "../lib/profile";
import { restartTutorial } from "../components/TutorialSystem";
import { gaugeFromSwatch } from "../lib/gauge";
import RemindersCard from "../components/RemindersCard";

interface SettingsScreenProps {
  onNavigate: (view: ViewType) => void;
}

interface DiagnosticCheck {
  name: string;
  ok: boolean;
  detail: string;
  ms: number;
}

interface DiagnosticsReport {
  ok: boolean;
  ranAt: string;
  checks: DiagnosticCheck[];
}

export default function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(withProfile("/api/export"));
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crochet-time-backup-${getActiveProfile().id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Backup downloaded", description: "Your data has been saved as a JSON file." });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not download your backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [checking, setChecking] = useState<false | "quick" | "deep">(false);

  const runChecks = async (mode: "quick" | "deep") => {
    setChecking(mode);
    try {
      const res =
        mode === "quick"
          ? await fetch("/api/diagnostics")
          : await apiRequest("POST", "/api/diagnostics/deep", {});
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: DiagnosticsReport = await res.json();
      setReport(data);
      toast(
        data.ok
          ? { title: "All checks passed ✓", description: "Everything is connected and working." }
          : { title: "Some checks failed", description: "See the results below for what needs attention.", variant: "destructive" },
      );
    } catch (err) {
      setReport(null);
      toast({
        title: "Couldn't run checks",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  // Personal gauge (tension) — used by AI resize to fit YOUR hands.
  const [gauge, setGauge] = useState<{ stitches: string; rows: string }>({ stitches: "", rows: "" });
  const [savingGauge, setSavingGauge] = useState(false);
  // Swatch calculator: measure any swatch, normalise to the per-10cm gauge.
  const [swatchOpen, setSwatchOpen] = useState(false);
  const [swatch, setSwatch] = useState({ stitches: "", width: "", rows: "", height: "" });
  const applySwatch = () => {
    const r = gaugeFromSwatch({
      stitches: Number(swatch.stitches),
      width: Number(swatch.width),
      rows: Number(swatch.rows),
      height: Number(swatch.height),
    });
    if (r.stitchesPer10 == null && r.rowsPer10 == null) {
      toast({ title: "Check your swatch numbers", description: "Enter the stitches/rows you counted and the size you measured.", variant: "destructive" });
      return;
    }
    setGauge((g) => ({
      stitches: r.stitchesPer10 != null ? String(r.stitchesPer10) : g.stitches,
      rows: r.rowsPer10 != null ? String(r.rowsPer10) : g.rows,
    }));
    toast({ title: "Gauge filled in ✓", description: "Tap Save to keep it." });
  };
  useEffect(() => {
    fetch(withProfile("/api/gauge"), { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => { if (g) setGauge({ stitches: g.stitches ? String(g.stitches) : "", rows: g.rows ? String(g.rows) : "" }); })
      .catch(() => {});
  }, []);
  const saveGauge = async () => {
    setSavingGauge(true);
    try {
      const res = await apiRequest("PUT", "/api/gauge", { stitches: Number(gauge.stitches) || null, rows: Number(gauge.rows) || null });
      if (!res.ok) throw new Error("save failed");
      toast({ title: "Gauge saved 📏", description: "Resizing will now use your tension." });
    } catch {
      toast({ title: "Couldn't save gauge", variant: "destructive" });
    } finally {
      setSavingGauge(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await apiRequest("POST", "/api/import", data);
      const result = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stash"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stash-notes"] });
      const skipped = (result.skippedPatterns ?? 0) + (result.skippedStash ?? 0);
      toast({
        title: "Backup restored",
        description:
          `Imported ${result.importedPatterns ?? 0} pattern(s) and ${result.importedStash ?? 0} material(s).` +
          (skipped > 0 ? ` Skipped ${skipped} item(s) that couldn't be read.` : ""),
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "That file couldn't be read.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <BackButton onClick={() => onNavigate("home")} bg="rgba(140,100,55,0.08)" color={palette.clay} />
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Settings</h1>
          <p className="text-[12px]" style={{ color: palette.clay }}>Backup & data</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">
        {/* Backup */}
        <div className="craft-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" style={{ color: palette.sage }} />
            <p className="font-heading font-semibold text-[15px]" style={{ color: palette.ink }}>Backup your crochet life</p>
          </div>
          <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: palette.inkSoft }}>
            Download everything — every pattern, project, and material — as a single file you can keep safe.
            Restoring is additive, so importing never overwrites what's already here.
          </p>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #84934F, #6A7A3A)", color: "white", boxShadow: "0 4px 16px rgba(132,147,79,0.35)" }}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export backup (.json)"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "rgba(132,147,79,0.10)", color: palette.sage, border: "1.5px solid rgba(132,147,79,0.25)" }}
          >
            <Upload className="h-4 w-4" />
            {importing ? "Restoring…" : "Restore from backup"}
          </button>
        </div>

        {/* Take the tour */}
        <div className="craft-card p-5">
          <p className="font-heading font-semibold text-[13px] mb-1" style={{ color: palette.ink }}>
            App tour
          </p>
          <p className="text-[12px] mb-3" style={{ color: palette.clay }}>
            Let Ashi walk you through every screen again from the beginning.
          </p>
          <button
            onClick={() => restartTutorial()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
              color: "white",
              boxShadow: "0 3px 12px rgba(61,143,163,0.35)",
            }}
          >
            <HelpCircle className="h-4 w-4" />
            Take the tour again
          </button>
        </div>

        {/* Reminders */}
        <RemindersCard />

        {/* My gauge */}
        <div className="craft-card p-5">
          <p className="font-heading font-semibold text-[13px] mb-1" style={{ color: palette.ink }}>
            My gauge 📏
          </p>
          <p className="text-[12px] mb-3" style={{ color: palette.clay }}>
            Crochet a 10×10&nbsp;cm square in SC, count the stitches and rows, and save them here —
            pattern resizing will use <em>your</em> tension instead of a generic one.
          </p>
          <div className="flex items-end gap-3">
            <label className="flex-1 text-[11.5px] font-semibold" style={{ color: palette.inkSoft }}>
              Stitches / 10cm
              <input
                type="number" min={1} inputMode="numeric" value={gauge.stitches}
                onChange={(e) => setGauge((g) => ({ ...g, stitches: e.target.value }))}
                className="mt-1 w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.25)", color: palette.ink }}
              />
            </label>
            <label className="flex-1 text-[11.5px] font-semibold" style={{ color: palette.inkSoft }}>
              Rows / 10cm
              <input
                type="number" min={1} inputMode="numeric" value={gauge.rows}
                onChange={(e) => setGauge((g) => ({ ...g, rows: e.target.value }))}
                className="mt-1 w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.25)", color: palette.ink }}
              />
            </label>
            <button
              onClick={saveGauge}
              disabled={savingGauge}
              className="px-4 py-2.5 rounded-xl text-[12.5px] font-bold disabled:opacity-60"
              style={{ background: palette.sage, color: "white" }}
            >
              {savingGauge ? "…" : "Save"}
            </button>
          </div>

          {/* Swatch calculator — not a 10cm square? Measure any swatch. */}
          <button
            onClick={() => setSwatchOpen((o) => !o)}
            className="mt-3 text-[11.5px] font-semibold hover:opacity-80"
            style={{ color: palette.sage }}
          >
            📐 {swatchOpen ? "Hide swatch calculator" : "Not a 10cm square? Calculate from any swatch"}
          </button>
          {swatchOpen && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(132,147,79,0.06)", border: "1px dashed rgba(132,147,79,0.3)" }}>
              <p className="text-[11px] mb-2.5" style={{ color: palette.inkSoft }}>
                Count the stitches across and rows down your swatch, then measure it.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  ["stitches", "Stitches across"],
                  ["width", "Width (cm)"],
                  ["rows", "Rows down"],
                  ["height", "Height (cm)"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="text-[10.5px] font-semibold" style={{ color: palette.inkSoft }}>
                    {label}
                    <input
                      type="number" min={0} step="any" inputMode="decimal"
                      value={swatch[key]}
                      onChange={(e) => setSwatch((s) => ({ ...s, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none"
                      style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.25)", color: palette.ink }}
                    />
                  </label>
                ))}
              </div>
              <button
                onClick={applySwatch}
                className="mt-3 w-full py-2 rounded-lg text-[12px] font-bold hover:opacity-90"
                style={{ background: "rgba(132,147,79,0.15)", color: palette.olive, border: "1.5px solid rgba(132,147,79,0.35)" }}
              >
                Calculate &amp; fill gauge above
              </button>
            </div>
          )}
        </div>

        {/* App health */}
        <div className="craft-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: palette.rose }} />
            <p className="font-heading font-semibold text-[15px]" style={{ color: palette.ink }}>App health</p>
          </div>
          <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: palette.inkSoft }}>
            Check that the database, photo storage and AI are all connected. The deep test runs a real
            (tiny) AI generation, so it uses a little API credit.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => runChecks("quick")}
              disabled={checking !== false}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "rgba(194,78,107,0.10)", color: palette.rose, border: "1.5px solid rgba(194,78,107,0.25)" }}
            >
              <Activity className="h-4 w-4" />
              {checking === "quick" ? "Checking…" : "Run checks"}
            </button>
            <button
              onClick={() => runChecks("deep")}
              disabled={checking !== false}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)", color: "white", boxShadow: "0 4px 16px rgba(194,78,107,0.3)" }}
            >
              <Sparkles className="h-4 w-4" />
              {checking === "deep" ? "Testing AI…" : "Deep AI test"}
            </button>
          </div>
          {report && (
            <div className="mt-4 flex flex-col gap-2" aria-live="polite">
              {report.checks.map((c) => (
                <div
                  key={c.name}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: c.ok ? "rgba(132,147,79,0.08)" : "rgba(194,78,107,0.08)" }}
                >
                  {c.ok ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: palette.sage }} />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: palette.rose }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold" style={{ color: palette.ink }}>
                      {c.name} <span className="font-normal" style={{ color: palette.clay }}>· {c.ms} ms</span>
                    </p>
                    <p className="text-[12px] leading-snug break-words" style={{ color: c.ok ? palette.inkSoft : palette.roseDeep }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About */}
        <div className="craft-card p-5 flex items-center gap-3">
          <img
            src="/characters/char-bee-transparent.png"
            alt="Bee"
            style={{ width: 48, height: 48, objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>Crochet Time</p>
            <p className="text-[12px] flex items-center gap-1" style={{ color: palette.rose }}>
              Made with <Heart className="h-3 w-3" style={{ fill: palette.rose }} /> for {getActiveProfile().name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
