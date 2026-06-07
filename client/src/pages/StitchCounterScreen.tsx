import { useState } from "react";
import { ChevronLeft, RotateCcw, History, Plus, Minus, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewType } from "../lib/types";

interface StitchCounterScreenProps {
  onNavigate: (view: ViewType) => void;
}

interface CounterState {
  stitches: number;
  rows: number;
}

interface HistoryEntry {
  id: string;
  type: "stitch" | "row";
  delta: number;
  value: number;
  time: string;
}

export default function StitchCounterScreen({ onNavigate }: StitchCounterScreenProps) {
  const [counts, setCounts] = useState<CounterState>({ stitches: 0, rows: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sound, setSound] = useState(true);

  const MAX_STITCHES_PER_ROW = 20;

  const addEntry = (type: "stitch" | "row", delta: number, value: number) => {
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    setHistory(h => [{ id: Date.now().toString(), type, delta, value, time }, ...h.slice(0, 19)]);
  };

  const changeStitches = (delta: number) => {
    setCounts(c => {
      const next = Math.max(0, c.stitches + delta);
      addEntry("stitch", delta, next);
      return { ...c, stitches: next };
    });
  };

  const changeRows = (delta: number) => {
    setCounts(c => {
      const next = Math.max(0, c.rows + delta);
      addEntry("row", delta, next);
      return { ...c, rows: next };
    });
  };

  const reset = () => {
    setCounts({ stitches: 0, rows: 0 });
    setHistory([]);
  };

  const stitchProgress = (counts.stitches % MAX_STITCHES_PER_ROW) / MAX_STITCHES_PER_ROW;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate("progress")}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(132,147,79,0.08)", color: "#84934F" }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>
              Stitch Counter
            </h1>
            <p className="text-[12px]" style={{ color: "#9A7868" }}>Track your stitches & rows</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSound(s => !s)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: sound ? "rgba(132,147,79,0.12)" : "rgba(180,160,140,0.1)", color: sound ? "#84934F" : "#B0908A" }}>
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowHistory(s => !s)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: showHistory ? "rgba(124,95,168,0.15)" : "rgba(255,252,245,0.9)", color: showHistory ? "#7C5FA8" : "#9A7868",
              border: "1px solid rgba(140,100,55,0.2)" }}>
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

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
              style={{ background: "rgba(132,147,79,0.12)", color: "#84934F",
                border: "2px dashed rgba(132,147,79,0.4)" }}>
              <Minus className="h-7 w-7" />
            </motion.button>

            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={counts.rows}
                  className="font-heading font-bold leading-none block"
                  style={{ fontSize: 72, color: "#84934F" }}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {counts.rows}
                </motion.span>
              </AnimatePresence>
              <span className="text-[12px] font-bold" style={{ color: "#9A7868" }}>rows</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => changeRows(1)}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all"
              style={{ background: "#84934F", color: "white",
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
              style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B" }}>
              {counts.stitches % MAX_STITCHES_PER_ROW} / {MAX_STITCHES_PER_ROW} this row
            </span>
          </div>

          {/* Mini progress track for stitches in current row */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: MAX_STITCHES_PER_ROW }).map((_, i) => (
              <div key={i} className="flex-1 rounded-full transition-all"
                style={{
                  height: 8,
                  background: i < (counts.stitches % MAX_STITCHES_PER_ROW)
                    ? "#C24E6B"
                    : "rgba(194,78,107,0.15)",
                }} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStitches(-1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B", border: "1.5px dashed rgba(194,78,107,0.4)" }}>
              <Minus className="h-5 w-5" />
            </motion.button>
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={counts.stitches}
                  className="font-heading font-bold leading-none block"
                  style={{ fontSize: 48, color: "#C24E6B" }}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {counts.stitches}
                </motion.span>
              </AnimatePresence>
              <span className="text-[11px] font-bold" style={{ color: "#9A7868" }}>total stitches</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStitches(1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#C24E6B", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.4)" }}>
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all hover:opacity-80"
          style={{ background: "rgba(180,160,140,0.1)", color: "#9A7868",
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
                <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: "#3D2318" }}>
                  Recent Activity
                </p>
                {history.length === 0 ? (
                  <p className="text-[12px] text-center py-3" style={{ color: "#B0908A" }}>
                    No activity yet — start counting!
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-[11.5px]">
                        <span className="font-semibold" style={{ color: h.type === "stitch" ? "#C24E6B" : "#84934F" }}>
                          {h.type === "stitch" ? "Stitch" : "Row"} {h.delta > 0 ? "+" : ""}{h.delta}
                        </span>
                        <span style={{ color: "#9A7868" }}>→ {h.value} · {h.time}</span>
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
