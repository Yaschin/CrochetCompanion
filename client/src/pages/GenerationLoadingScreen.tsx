import { palette } from "@/lib/theme";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ViewType } from "../lib/types";

interface GenerationLoadingScreenProps {
  /** Legacy/uncontrolled: when omitted, the screen self-drives a timer and
   *  calls onComplete("viewer") at 100%. */
  onComplete?: (view: ViewType) => void;
  /** Controlled mode: when provided, the ring reflects the REAL generation
   *  request and the parent owns navigation — no internal timer, no
   *  auto-complete. This is what makes the progress honest. */
  progress?: number;
}

const STAGES = [
  { emoji: "🧶", label: "Winding yarn…",        round: "Round 1–4" },
  { emoji: "🪡", label: "Setting up stitches…", round: "Round 5–8" },
  { emoji: "🧵", label: "Shaping the body…",    round: "Round 9–14" },
  { emoji: "✂️", label: "Finishing details…",   round: "Round 15–18" },
  { emoji: "✨", label: "Magic touches!",        round: "Round 19–20" },
];

const YALA_TIPS = [
  "Use a magic ring for amigurumi — it closes the center gap perfectly!",
  "Count your stitches at the end of each round to stay on track.",
  "Stuff firmly as you go — it's much easier than at the end!",
  "Switch to a smaller hook if you can see stuffing through your stitches.",
  "Blocking your finished piece can really bring the shape to life! 🌟",
];

export default function GenerationLoadingScreen({ onComplete, progress: controlledProgress }: GenerationLoadingScreenProps) {
  const controlled = controlledProgress !== undefined;
  const [internalProgress, setInternalProgress] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * YALA_TIPS.length));

  useEffect(() => {
    if (controlled) return; // controlled mode: progress is driven by the prop
    const interval = setInterval(() => {
      setInternalProgress((p) => {
        const next = p + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.("viewer"), 600);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete, controlled]);

  const progress = controlled ? Math.max(0, Math.min(100, controlledProgress)) : internalProgress;
  const circumference = 2 * Math.PI * 70;
  const stroke = circumference - (progress / 100) * circumference;
  const stageIdx = Math.min(Math.floor((progress / 100) * STAGES.length), STAGES.length - 1);
  const currentStage = STAGES[stageIdx];

  return (
    <div
      className="flex flex-col items-center justify-between h-full py-8 px-6 gap-4"
      style={{ background: "linear-gradient(155deg, #F9EDD8 0%, #F2E4CE 60%, #EDD5B8 100%)" }}
    >
      {/* Top: heading */}
      <div className="text-center pt-2">
        <motion.h1
          className="font-heading font-bold text-[22px]"
          style={{ color: palette.ink }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          Yala is creating your pattern…
        </motion.h1>
        <p className="text-[13px] mt-1" style={{ color: palette.clay }}>
          Stitch by stitch, row by row ✨
        </p>
      </div>

      {/* Middle: Yala + progress ring */}
      <div className="flex flex-col items-center gap-5 flex-1 justify-center">
        {/* Yala floating */}
        <motion.div
          animate={{ y: [0, -12, 0, -8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/characters/char-yala-transparent.png"
            alt="Yala"
            style={{ width: 130, height: "auto", filter: "drop-shadow(0 8px 20px rgba(80,40,10,0.22))" }}
          />
        </motion.div>

        {/* Circular progress ring */}
        <div className="relative flex items-center justify-center" style={{ width: 150, height: 150 }}>
          <svg width="150" height="150" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(194,78,107,0.12)" strokeWidth="8" />
            <motion.circle
              cx="80" cy="80" r="70" fill="none"
              stroke="url(#progGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={stroke}
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
            <defs>
              <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#C24E6B" />
                <stop offset="100%" stopColor="#D4921A" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-heading font-bold text-[26px] leading-none" style={{ color: palette.rose }}>
              {progress}%
            </span>
            <span className="text-[10px] font-semibold mt-0.5" style={{ color: palette.clay }}>complete</span>
          </div>
        </div>

        {/* Stage indicators */}
        <div className="flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={stageIdx}
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.2)" }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <span style={{ fontSize: 16 }}>{currentStage.emoji}</span>
              <span className="text-[13px] font-semibold" style={{ color: "#5C3A28" }}>
                {currentStage.label}
              </span>
              <span className="text-[11px]" style={{ color: palette.clay }}>
                {currentStage.round}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Emoji progress dots */}
          <div className="flex gap-2 mt-1">
            {STAGES.map((s, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-center"
                animate={{
                  scale: i === stageIdx ? 1.3 : 1,
                  opacity: i <= stageIdx ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
              >
                <span style={{ fontSize: i === stageIdx ? 18 : 13 }}>{s.emoji}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Tip from Yala card */}
      <motion.div
        className="w-full rounded-2xl p-4 flex gap-3 items-center"
        style={{
          background: "rgba(255,252,245,0.95)",
          border: "1.5px solid rgba(140,100,55,0.2)",
          boxShadow: "0 4px 20px rgba(60,28,6,0.12)",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <img
          src="/characters/char-yala-transparent.png"
          alt="Yala"
          style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0,
            filter: "drop-shadow(0 3px 8px rgba(80,40,10,0.2))" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold mb-0.5" style={{ color: palette.rose }}>
            💡 Tip from Yala
          </p>
          <p className="text-[12px] leading-snug" style={{ color: "#5C3A28" }}>
            {YALA_TIPS[tipIdx]}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
