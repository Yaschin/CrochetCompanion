import { useState } from "react";
import { ChevronLeft, Trophy, TrendingUp, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Pattern, ViewType } from "../lib/types";

interface ProgressTrackingScreenProps {
  pattern: Pattern | null;
  onNavigate: (view: ViewType) => void;
}

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 280, h = 80, pad = 8;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const area = `M ${pad} ${h - pad} ` + data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `L ${x} ${y}`;
  }).join(" ") + ` L ${w - pad} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="80" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - (v / max) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2" />;
      })}
    </svg>
  );
}

const MOCK_PROGRESS = [2, 5, 8, 12, 15, 18, 22, 26, 30, 34, 38, 40];
const DAYS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const DAYS_SHORT = DAYS_FULL.filter((_, i) => i % 2 === 0);

const ACHIEVEMENTS = [
  { icon: "🌸", label: "First Stitch",   unlocked: true,  color: "#C24E6B" },
  { icon: "🧶", label: "10 Rows Done",   unlocked: true,  color: "#7C5FA8" },
  { icon: "⭐", label: "Half Way",        unlocked: true,  color: "#D4921A" },
  { icon: "🏆", label: "Pattern Done",   unlocked: false, color: "#84934F" },
  { icon: "🎉", label: "5 Projects",     unlocked: false, color: "#3D8FA3" },
];

export default function ProgressTrackingScreen({ pattern, onNavigate }: ProgressTrackingScreenProps) {
  const steps = pattern?.sections?.flatMap(s => s.steps) ?? [];
  const done = steps.filter(s => s.completed).length;
  const total = steps.length || 1;
  const pct = Math.round((done / total) * 100);

  const [currentRow, setCurrentRow] = useState(done);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <button onClick={() => onNavigate("viewer")}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
          style={{ background: "rgba(194,78,107,0.08)", color: "#C24E6B" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>
            Progress Tracking
          </h1>
          {pattern && (
            <p className="text-[12px]" style={{ color: "#9A7868" }}>{pattern.title}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">

        {/* Progress ring + stat — responsive: side-by-side on sm+, stacked on mobile */}
        <div className="craft-card p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(194,78,107,0.12)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#C24E6B" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - pct / 100)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading font-bold text-[22px] leading-none" style={{ color: "#C24E6B" }}>
                {pct}%
              </span>
              <span className="text-[9px] font-semibold" style={{ color: "#9A7868" }}>done</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <div>
              <p className="font-heading font-bold text-[28px] leading-none" style={{ color: "#3D2318" }}>
                {done}/{total}
              </p>
              <p className="text-[12px]" style={{ color: "#9A7868" }}>rows complete</p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: "#84934F" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#84934F" }}>On track!</span>
            </div>
          </div>
        </div>

        {/* Row counter widget */}
        <div className="craft-card craft-card-rose p-4">
          <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: "#3D2318" }}>
            Row Counter
          </p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setCurrentRow(r => Math.max(0, r - 1))}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(194,78,107,0.12)", color: "#C24E6B", border: "1.5px dashed rgba(194,78,107,0.35)" }}>
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center">
              <motion.span
                key={currentRow}
                className="font-heading font-bold leading-none block"
                style={{ fontSize: 52, color: "#C24E6B" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                {currentRow}
              </motion.span>
              <span className="text-[11px] font-semibold" style={{ color: "#9A7868" }}>current row</span>
            </div>
            <button
              onClick={() => setCurrentRow(r => r + 1)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ background: "#C24E6B", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.4)" }}>
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress chart */}
        <div className="craft-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>
              Rows per Day
            </p>
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(132,147,79,0.12)", color: "#84934F" }}>
              Last 12 days
            </span>
          </div>
          <MiniLineChart data={MOCK_PROGRESS} color="#C24E6B" />
          {/* Day labels — every other day to avoid crowding */}
          <div className="flex justify-between mt-1">
            {DAYS_SHORT.map((d, i) => (
              <span key={i} className="text-[8.5px]" style={{ color: "#B0908A" }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="craft-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4" style={{ color: "#D4921A" }} />
            <p className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>
              Achievements
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.label}
                className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl"
                style={{
                  background: a.unlocked ? `${a.color}14` : "rgba(180,160,140,0.08)",
                  border: `1.5px dashed ${a.unlocked ? a.color + "55" : "rgba(180,160,140,0.25)"}`,
                  opacity: a.unlocked ? 1 : 0.5,
                }}>
                <span className="text-2xl" style={{ filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                <span className="text-[9.5px] font-bold text-center leading-tight" style={{ color: a.unlocked ? a.color : "#B0908A" }}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button onClick={() => onNavigate("photo-upload")}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(60,143,163,0.12)", color: "#3D8FA3", border: "1px dashed rgba(60,143,163,0.4)" }}>
            📷 Add Photo
          </button>
          <button onClick={() => onNavigate("stitch-counter")}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(132,147,79,0.12)", color: "#84934F", border: "1px dashed rgba(132,147,79,0.4)" }}>
            🧮 Stitch Counter
          </button>
        </div>
      </div>
    </div>
  );
}
