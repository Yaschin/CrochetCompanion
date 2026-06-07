import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ViewType } from "../lib/types";
import { YalaSVG } from "../components/Characters";

interface GenerationLoadingScreenProps {
  onComplete: (view: ViewType) => void;
}

const MESSAGES = [
  "Weaving your pattern together…",
  "Counting stitches and rows…",
  "Yala is adding magical details…",
  "Checking your gauge…",
  "Almost ready! Just a few more rounds…",
];

export default function GenerationLoadingScreen({ onComplete }: GenerationLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete("viewer"), 600);
          return 100;
        }
        if (next % 20 === 0) setMsgIdx(i => (i + 1) % MESSAGES.length);
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete]);

  const circumference = 2 * Math.PI * 70;
  const stroke = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8"
      style={{ background: "linear-gradient(155deg, #F9EDD8 0%, #F2E4CE 60%, #EDD5B8 100%)" }}>

      {/* Yala animating */}
      <motion.div
        animate={{ y: [0, -14, 0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <YalaSVG size={160} />
      </motion.div>

      {/* Speech bubble */}
      <div className="relative">
        <div className="rounded-2xl px-5 py-3 max-w-[220px] text-center"
          style={{
            background: "rgba(255,252,245,0.96)",
            border: "1.5px dashed rgba(140,95,45,0.35)",
            boxShadow: "0 4px 14px rgba(60,28,6,0.14)",
          }}>
          <p className="font-heading text-[13px] font-semibold" style={{ color: "#5C3A28" }}>
            Please wait…
          </p>
          <motion.p
            key={msgIdx}
            className="text-[11.5px] mt-1 leading-snug"
            style={{ color: "#9A7868" }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {MESSAGES[msgIdx]}
          </motion.p>
        </div>
        {/* Bubble tail */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{ borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "12px solid rgba(255,252,245,0.96)" }} />
      </div>

      {/* Circular progress */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
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
          <span className="font-heading font-bold text-[28px] leading-none" style={{ color: "#C24E6B" }}>
            {progress}%
          </span>
          <span className="text-[10.5px] font-semibold mt-0.5" style={{ color: "#9A7868" }}>complete</span>
        </div>
      </div>

      {/* Dots row */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={i}
            className="rounded-full"
            style={{ width: 8, height: 8, background: "#C24E6B", opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
