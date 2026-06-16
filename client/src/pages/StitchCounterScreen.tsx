import { palette } from "@/lib/theme";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, RotateCcw, History, Plus, Minus, Volume2, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewType } from "../lib/types";
import { recordActivity } from "../lib/activityLog";
import { useStitchCounter, EMPTY_COUNTER, CounterHistoryEntry } from "../hooks/useStitchCounter";
import WorkTimer from "../components/WorkTimer";

interface StitchCounterScreenProps {
  onNavigate: (view: ViewType) => void;
  backView?: ViewType;
  patternId?: string;
  patternTitle?: string;
}

const MAX_STITCHES_PER_ROW = 20;

function pushEntry(
  history: CounterHistoryEntry[],
  type: "stitch" | "row",
  delta: number,
  value: number,
): CounterHistoryEntry[] {
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
  return [{ id: Date.now().toString(), type, delta, value, time }, ...history.slice(0, 19)];
}

export default function StitchCounterScreen({ onNavigate, backView = "home", patternId, patternTitle }: StitchCounterScreenProps) {
  // Shared per-pattern store — the same counts the in-viewer modal shows.
  const [counts, setCounts] = useStitchCounter(patternId);
  const [showHistory, setShowHistory] = useState(false);
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const [lastHeard, setLastHeard] = useState<string | null>(null);

  // Keep the screen awake while counting (re-acquire after tab switches).
  useEffect(() => {
    let lock: { release?: () => void } | null = null;
    const request = async () => {
      try { lock = await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release?: () => void }> } }).wakeLock?.request("screen") ?? null; }
      catch { /* unsupported or denied */ }
    };
    request();
    const onVisible = () => { if (document.visibilityState === "visible") request(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      try { lock?.release?.(); } catch { /* ignore */ }
    };
  }, []);

  const buzz = () => { if (sound) { try { navigator.vibrate?.(8); } catch { /* ignore */ } } };

  const changeStitches = (delta: number) => {
    buzz();
    if (delta > 0) recordActivity();
    setCounts(c => {
      const next = Math.max(0, c.stitches + delta);
      return { ...c, stitches: next, history: pushEntry(c.history, "stitch", delta, next) };
    });
  };

  const changeRows = (delta: number) => {
    buzz();
    if (delta > 0) recordActivity();
    setCounts(c => {
      const next = Math.max(0, c.rows + delta);
      return { ...c, rows: next, history: pushEntry(c.history, "row", delta, next) };
    });
  };

  const reset = () => {
    setCounts(EMPTY_COUNTER);
  };

  // Latest handlers for the voice recognizer (avoids stale closures / effect churn).
  const handlersRef = useRef({ changeRows, changeStitches, reset });
  handlersRef.current = { changeRows, changeStitches, reset };

  // Hands-free voice control: say "next"/"row" (+1 row), "stitch" (+1 stitch),
  // "back"/"undo" (−1 row), "reset". Uses the Web Speech API where available.
  useEffect(() => {
    if (!voice) { setLastHeard(null); return; }
    const SR = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SR) { setVoice(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const t = String(e.results[e.results.length - 1][0].transcript || "").toLowerCase();
      setLastHeard(t.trim());
      const h = handlersRef.current;
      if (/(reset|clear)/.test(t)) h.reset();
      else if (/(back|undo|minus|down)/.test(t)) h.changeRows(-1);
      else if (/(stitch)/.test(t)) h.changeStitches(1);
      else if (/(next|row|up|plus|count|done)/.test(t)) h.changeRows(1);
    };
    rec.onend = () => { try { rec.start(); } catch { /* already stopped */ } };
    try { rec.start(); } catch { /* needs user gesture / unsupported */ }
    return () => { rec.onend = null; try { rec.stop(); } catch { /* ignore */ } };
  }, [voice]);

  const stitchesInRow = counts.stitches % MAX_STITCHES_PER_ROW;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate(backView)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(132,147,79,0.08)", color: palette.sage }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>
              Stitch Counter
            </h1>
            <p className="text-[12px] truncate max-w-[180px]" style={{ color: palette.clay }}>
              {patternTitle ? `Counting for “${patternTitle}”` : "Track your stitches & rows"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVoice(v => !v)}
            title="Hands-free voice counting"
            aria-label="Toggle hands-free voice counting"
            aria-pressed={voice}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: voice ? "rgba(194,78,107,0.15)" : "rgba(255,252,245,0.9)", color: voice ? palette.rose : palette.clay, border: "1px solid rgba(140,100,55,0.2)" }}>
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSound(s => !s)}
            aria-label="Toggle haptic feedback"
            aria-pressed={sound}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: sound ? "rgba(132,147,79,0.12)" : "rgba(180,160,140,0.1)", color: sound ? palette.sage : palette.muted }}>
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowHistory(s => !s)}
            aria-label="Toggle activity history"
            aria-pressed={showHistory}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: showHistory ? "rgba(124,95,168,0.15)" : "rgba(255,252,245,0.9)", color: showHistory ? "#7C5FA8" : palette.clay,
              border: "1px solid rgba(140,100,55,0.2)" }}>
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 pb-20 md:pb-5 flex flex-col gap-5">

        {/* Big hands-free tap target — count a row without precise tapping */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => changeRows(1)}
          className="w-full rounded-3xl flex flex-col items-center justify-center gap-1"
          style={{ minHeight: 92, background: "linear-gradient(135deg, #84934F, #6A7A3A)", color: "white", boxShadow: "0 6px 20px rgba(132,147,79,0.4)" }}>
          <span className="font-heading font-bold text-[18px]">Tap to count a row</span>
          <span className="text-[11px] opacity-85" aria-live="polite">
            {voice
              ? lastHeard
                ? `🎙️ Heard: “${lastHeard}”`
                : "🎙️ Listening — say “next”, “stitch”, “back”"
              : "or turn on 🎙️ voice for hands-free"}
          </span>
        </motion.button>

        {/* Work-session timer — actual crocheting time on this project */}
        {patternId && <WorkTimer patternId={patternId} />}

        {/* Row counter — primary big counter */}
        <div className="craft-card craft-card-sage p-6">
          <p className="font-heading font-semibold text-[13px] mb-4 text-center" style={{ color: "#5C3A28" }}>
            Row Counter
          </p>
          <div className="flex items-center justify-center gap-8">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => changeRows(-1)}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all"
              style={{ background: "rgba(132,147,79,0.12)", color: palette.sage,
                border: "2px dashed rgba(132,147,79,0.4)" }}>
              <Minus className="h-7 w-7" />
            </motion.button>

            <div className="text-center" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait">
                <motion.span
                  key={counts.rows}
                  className="font-heading font-bold leading-none block"
                  style={{ fontSize: 72, color: palette.sage }}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {counts.rows}
                </motion.span>
              </AnimatePresence>
              <span className="text-[12px] font-bold" style={{ color: palette.clay }}>rows</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => changeRows(1)}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all"
              style={{ background: palette.sage, color: "white",
                boxShadow: "0 4px 16px rgba(132,147,79,0.45)" }}>
              <Plus className="h-7 w-7" />
            </motion.button>
          </div>
        </div>

        {/* Stitch counter — secondary */}
        <div className="craft-card craft-card-rose p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading font-semibold text-[13px]" style={{ color: "#5C3A28" }}>
              Stitch Counter
            </p>
            <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(194,78,107,0.1)", color: palette.rose }}>
              {stitchesInRow} / {MAX_STITCHES_PER_ROW} this row
            </span>
          </div>

          {/* Dot grid — 2 rows × 10 dots, looks like a scoreboard */}
          <div className="flex flex-col gap-1.5 mb-4">
            {[0, 1].map((rowIdx) => (
              <div key={rowIdx} className="flex gap-1.5 justify-center">
                {Array.from({ length: 10 }).map((_, colIdx) => {
                  const dotIndex = rowIdx * 10 + colIdx;
                  const filled = dotIndex < stitchesInRow;
                  return (
                    <div key={colIdx}
                      className="rounded-full transition-all"
                      style={{
                        width: 11, height: 11,
                        background: filled ? palette.rose : "rgba(194,78,107,0.15)",
                        boxShadow: filled ? "0 1px 4px rgba(194,78,107,0.4)" : "none",
                        transform: filled ? "scale(1.1)" : "scale(1)",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStitches(-1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(194,78,107,0.1)", color: palette.rose, border: "1.5px dashed rgba(194,78,107,0.4)" }}>
              <Minus className="h-5 w-5" />
            </motion.button>
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={counts.stitches}
                  className="font-heading font-bold leading-none block"
                  style={{ fontSize: 48, color: palette.rose }}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {counts.stitches}
                </motion.span>
              </AnimatePresence>
              <span className="text-[11px] font-bold" style={{ color: palette.clay }}>total stitches</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStitches(1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: palette.rose, color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.4)" }}>
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all hover:opacity-80"
          style={{ background: "rgba(180,160,140,0.1)", color: palette.clay,
            border: "1.5px dashed rgba(140,100,55,0.3)" }}>
          <RotateCcw className="h-4 w-4" />
          Reset All
        </button>

        {/* History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="craft-card p-4">
                <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: palette.ink }}>
                  Recent Activity
                </p>
                {counts.history.length === 0 ? (
                  <p className="text-[12px] text-center py-3" style={{ color: palette.muted }}>
                    No activity yet — start counting!
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {counts.history.map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-[11.5px]">
                        <span className="font-semibold" style={{ color: h.type === "stitch" ? palette.rose : palette.sage }}>
                          {h.type === "stitch" ? "Stitch" : "Row"} {h.delta > 0 ? "+" : ""}{h.delta}
                        </span>
                        <span style={{ color: palette.clay }}>→ {h.value} · {h.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
