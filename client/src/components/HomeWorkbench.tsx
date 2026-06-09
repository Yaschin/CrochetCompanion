import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Bell, Loader2, ChevronRight,
  Heart, Wand2, FolderOpen, Trophy, ChevronRight as ChevRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Pattern, ViewType } from "../lib/types";
import { PatternThumb } from "@/components/PatternThumb";
import { getStreak } from "../lib/activityLog";
import { loadCounter } from "../hooks/useStitchCounter";

// ─── Notification helpers ──────────────────────────────────────────────────────
const NOTIF_KEY = "crochet-time-community-seen";
function getLastSeenCount(): number {
  try { return parseInt(localStorage.getItem(NOTIF_KEY) ?? "0", 10) || 0; } catch { return 0; }
}
function markCommunityRead(count: number): void {
  try { localStorage.setItem(NOTIF_KEY, String(count)); } catch { /* ignore */ }
}

// ─── Time helpers ──────────────────────────────────────────────────────────────
function formatTimeSpent(startedAt?: string | null): string {
  if (!startedAt) return "—";
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  const totalMins = Math.floor(ms / 60_000);
  if (totalMins < 1) return "Just started";
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface HomeWorkbenchProps {
  onNavigate: (view: ViewType) => void;
  currentPattern?: Pattern | null;
  onPatternSelected?: (p: Pattern) => void;
  onResumeCounting?: (p: Pattern) => void;
}

const CHAR = {
  aloo:  { color: "#C24E6B", light: "#FBF1F4", mid: "#F0CACF", label: "Aloo" },
  yala:  { color: "#7C5FA8", light: "#F5F0FB", mid: "#D9CAEE", label: "Yala" },
  ashi:  { color: "#3D8FA3", light: "#EEF7FA", mid: "#C0DDE5", label: "Ashi" },
  bee:   { color: "#D4921A", light: "#FDF6E3", mid: "#F0D499", label: "Bee" },
  sheep: { color: "#84934F", light: "#F5F7EF", mid: "#D4DCAA", label: "Sheep" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning",   emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌸" };
  return        { text: "Good evening",   emoji: "🌙" };
}

function patternProgress(p: Pattern) {
  const steps = p.sections?.flatMap((s) => s.steps) ?? [];
  const done  = steps.filter((s) => s.completed).length;
  return steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
}

// ─── SVG decorations ──────────────────────────────────────────────────────────

function CrochetFlower({ x, y, color, size = 24, rotate = 0 }: {
  x: number; y: number; color: string; size?: number; rotate?: number;
}) {
  const r = size / 2, pr = r * 0.42;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      {[0,72,144,216,288].map((a) => {
        const rad = (a * Math.PI) / 180;
        const cx = Math.cos(rad)*pr, cy = Math.sin(rad)*pr;
        return <ellipse key={a} cx={cx} cy={cy} rx={r*0.38} ry={r*0.25}
          transform={`rotate(${a},${cx},${cy})`} fill={color} fillOpacity="0.8" />;
      })}
      <circle r={r*0.26} fill={color} fillOpacity="0.95" />
      <circle r={r*0.12} fill="white" fillOpacity="0.6" />
    </g>
  );
}

function YarnBall({ x, y, color, r = 18 }: { x:number; y:number; color:string; r?:number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} fill={color} fillOpacity="0.6" />
      <ellipse rx={r*0.72} ry={r*0.28} fill="none" stroke="white" strokeWidth="1.1" strokeOpacity="0.4" />
      <ellipse rx={r*0.72} ry={r*0.28} fill="none" stroke="white" strokeWidth="1.1" strokeOpacity="0.3"
        transform="rotate(60)" />
      <ellipse rx={r*0.72} ry={r*0.28} fill="none" stroke="white" strokeWidth="1.1" strokeOpacity="0.3"
        transform="rotate(-60)" />
      <circle r={r*0.28} fill="white" fillOpacity="0.12" cx={-r*0.22} cy={-r*0.22} />
    </g>
  );
}

// Small flower for milestone dots
function FlowerDot({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {[0,72,144,216,288].map((a) => {
        const rad = (a * Math.PI) / 180;
        const cx = 7 + Math.cos(rad) * 3;
        const cy = 7 + Math.sin(rad) * 3;
        return <ellipse key={a} cx={cx} cy={cy} rx="2.2" ry="1.5"
          transform={`rotate(${a},${cx},${cy})`}
          fill={filled ? color : "none"} stroke={filled ? "none" : color}
          strokeWidth="0.8" fillOpacity={filled ? 0.85 : 0} />;
      })}
      <circle cx="7" cy="7" r="2" fill={filled ? color : "none"}
        stroke={filled ? "none" : color} strokeWidth="0.8" />
    </svg>
  );
}

// ─── Hero zone (rich CSS scene + free-standing transparent chars) ──────────────

function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base warm wood gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(175deg, #7A4A28 0%, #9A6035 12%, #B87A45 28%, #C8935A 42%, #D4A870 58%, #C8935A 72%, #A8723A 88%, #8A5528 100%)"
      }} />

      {/* Warm lamp glow — upper right */}
      <div className="absolute" style={{
        top: -60, right: -40, width: 340, height: 340,
        background: "radial-gradient(ellipse, rgba(255,220,120,0.55) 0%, rgba(255,190,80,0.28) 35%, transparent 70%)",
        borderRadius: "50%",
      }} />

      {/* Secondary ambient glow — left */}
      <div className="absolute" style={{
        top: -20, left: -60, width: 260, height: 260,
        background: "radial-gradient(ellipse, rgba(255,200,100,0.22) 0%, transparent 65%)",
        borderRadius: "50%",
      }} />

      {/* Wooden shelf top edge */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 28 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #5C3018 0%, #7A4828 60%, #9A6035 100%)",
        }} />
        {/* Shelf grain lines */}
        {[18, 42, 70, 110, 148, 190, 240, 290, 340, 400, 460, 520, 580, 640, 700, 750].map((x, i) => (
          <div key={i} className="absolute top-0 bottom-0" style={{
            left: x, width: 1,
            background: "linear-gradient(180deg, rgba(40,18,5,0.4) 0%, rgba(60,30,10,0.15) 100%)",
          }} />
        ))}
        {/* Shelf front edge highlight */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: "linear-gradient(90deg, #A06030, #C08040, #A06030)", opacity: 0.7 }} />
      </div>

      {/* Shelf items SVG layer */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: "none" }}>
        {/* Yarn basket — left side on shelf */}
        <g transform="translate(48, 2)">
          {/* Basket body */}
          <ellipse cx="28" cy="28" rx="26" ry="16" fill="#8B6035" fillOpacity="0.9" />
          <rect x="2" y="16" width="52" height="22" rx="6" fill="#A07040" />
          <rect x="2" y="16" width="52" height="22" rx="6" fill="none" stroke="#7A5025" strokeWidth="1.2" />
          {/* Weave lines */}
          {[20, 25, 30, 35].map(y => (
            <line key={y} x1="2" y1={y} x2="54" y2={y} stroke="#7A5025" strokeWidth="0.7" strokeOpacity="0.6" />
          ))}
          {[10, 18, 26, 34, 42, 50].map(x => (
            <line key={x} x1={x} y1="16" x2={x} y2="38" stroke="#7A5025" strokeWidth="0.7" strokeOpacity="0.5" />
          ))}
          {/* Handle */}
          <path d="M 8 16 Q 28 4 48 16" fill="none" stroke="#8B6035" strokeWidth="3" strokeLinecap="round" />
          {/* Yarn balls peeking out */}
          <circle cx="16" cy="14" r="8" fill="#C24E6B" fillOpacity="0.9" />
          <circle cx="28" cy="11" r="9" fill="#84934F" fillOpacity="0.9" />
          <circle cx="40" cy="13" r="8" fill="#D4921A" fillOpacity="0.9" />
          <ellipse cx="16" cy="14" rx="5.5" ry="2.5" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <ellipse cx="28" cy="11" rx="6.5" ry="2.8" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <ellipse cx="40" cy="13" rx="5.8" ry="2.5" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        </g>

        {/* Ceramic mug — right of basket */}
        <g transform="translate(118, 6)">
          <ellipse cx="16" cy="7" rx="13" ry="5" fill="#7A9A70" fillOpacity="0.9" />
          <rect x="3" y="7" width="26" height="24" rx="3" fill="#8AAA80" />
          <ellipse cx="16" cy="31" rx="13" ry="5" fill="#7A9A70" fillOpacity="0.8" />
          {/* Handle */}
          <path d="M 29 13 Q 38 14 38 20 Q 38 26 29 27" fill="none" stroke="#7A9A70" strokeWidth="3" strokeLinecap="round" />
          {/* Crochet heart on mug */}
          <path d="M 12 16 Q 12 13 15 13 Q 16 13 16 14.5 Q 16 13 17 13 Q 20 13 20 16 Q 20 19 16 22 Q 12 19 12 16Z" fill="#C24E6B" fillOpacity="0.7" />
        </g>

        {/* Crochet hook standing up */}
        <g transform="translate(158, 0)">
          <rect x="3" y="1" width="4" height="28" rx="2" fill="#A07040" fillOpacity="0.8" />
          <path d="M 3 4 Q 0 4 0 7 Q 0 10 4 10" fill="none" stroke="#8A6030" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="2" y="22" width="6" height="8" rx="1.5" fill="#C24E6B" fillOpacity="0.7" />
        </g>

        {/* Right side — yarn balls scattered on table */}
        <YarnBall x={780} y={22} color="#7C5FA8" r={18} />
        <YarnBall x={815} y={14} color="#3D8FA3" r={13} />
        <YarnBall x={798} y={8}  color="#C24E6B" r={10} />

        {/* Lavender sprigs — right of scene */}
        <g transform="translate(845, 0)">
          <line x1="10" y1="32" x2="10" y2="4" stroke="#9BA860" strokeWidth="2.2" strokeOpacity="0.8" />
          <ellipse cx="10" cy="2"  rx="4"   ry="8"   fill="#9878C0" fillOpacity="0.65" />
          <ellipse cx="5"  cy="8"  rx="3"   ry="7"   fill="#9878C0" fillOpacity="0.55" transform="rotate(-18,5,8)" />
          <ellipse cx="15" cy="7"  rx="3"   ry="7"   fill="#9878C0" fillOpacity="0.55" transform="rotate(18,15,7)" />
          <ellipse cx="4"  cy="14" rx="2.5" ry="5.5" fill="#9878C0" fillOpacity="0.4" transform="rotate(-22,4,14)" />
          <ellipse cx="16" cy="13" rx="2.5" ry="5.5" fill="#9878C0" fillOpacity="0.4" transform="rotate(22,16,13)" />
        </g>

        {/* Crocheted green mat / rug on table surface */}
        <ellipse cx="420" cy="292" rx="200" ry="22" fill="#6A8A48" fillOpacity="0.45" />
        <ellipse cx="420" cy="292" rx="186" ry="18" fill="none" stroke="#5A7A38" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6,4" />
        <ellipse cx="420" cy="292" rx="165" ry="14" fill="none" stroke="#5A7A38" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4,3" />

        {/* Scattered yarn snippet on table */}
        <path d="M 200 288 Q 220 282 240 290 Q 255 296 270 284" fill="none" stroke="#C24E6B" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M 560 286 Q 580 278 600 286 Q 615 292 630 280" fill="none" stroke="#7C5FA8" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />

        {/* Floor lamp silhouette — far right */}
        <g transform="translate(870, 20)">
          <line x1="12" y1="0" x2="12" y2="280" stroke="#5A3818" strokeWidth="3" strokeOpacity="0.6" />
          {/* Lamp shade */}
          <path d="M 0 0 L 24 0 L 20 28 L 4 28 Z" fill="#D4921A" fillOpacity="0.5" />
          <ellipse cx="12" cy="0" rx="12" ry="4" fill="#E8A830" fillOpacity="0.6" />
          {/* Base */}
          <ellipse cx="12" cy="278" rx="16" ry="5" fill="#5A3818" fillOpacity="0.5" />
        </g>

        {/* Table surface warm grain overlay at bottom */}
        <rect x="0" y="270" width="900" height="30" fill="url(#woodGrain)" />
        <defs>
          <linearGradient id="woodGrain" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7A4A28" stopOpacity="0.45" />
            <stop offset="20%" stopColor="#9A6035" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#B07840" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#9A6035" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7A4A28" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Decorative crochet flowers on table */}
        <CrochetFlower x={168} y={268} color="#C24E6B" size={28} rotate={20} />
        <CrochetFlower x={190} y={282} color="#84934F" size={18} rotate={-30} />
        <CrochetFlower x={640} y={265} color="#7C5FA8" size={24} rotate={15} />
        <CrochetFlower x={665} y={280} color="#D4921A" size={16} rotate={40} />
      </svg>

      {/* Top shadow — shelf depth */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 44, background: "linear-gradient(180deg, rgba(30,12,3,0.55) 0%, transparent 100%)" }} />
      {/* Bottom table edge gradient */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 32, background: "linear-gradient(0deg, rgba(50,24,6,0.5) 0%, transparent 100%)" }} />
    </div>
  );
}

function HeroZone({
  characterImages, generatingIds, onNavigate,
}: {
  characterImages: Record<string, string | null>;
  generatingIds: Set<string>;
  onGenerateAll?: () => void;
  onNavigate: (v: ViewType) => void;
}) {
  const alooSrc = "/characters/char-aloo-transparent.png";
  const ashiSrc = "/characters/char-ashi-transparent.png";
  const yalaSrc = "/characters/char-yala-transparent.png";

  return (
    // Outer wrapper: no overflow-hidden so characters can bleed past bottom rounded corners
    <div
      className="relative w-full h-[220px] sm:h-[270px] md:h-[310px]"
    >
      {/* Background scene — clipped inside rounded box */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 6px 30px rgba(60,30,8,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <HeroScene />

        {/* "Crochet is my happy place" tag — hanging from top centre */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          {/* Rope — thick + fully opaque */}
          <div style={{
            width: 4, height: 18,
            background: "linear-gradient(180deg, #4A2808, #8A5828)",
            borderRadius: 2,
            opacity: 1,
          }} />
          <div
            className="px-4 py-2.5 rounded-b-xl rounded-t-sm text-center"
            style={{
              background: "rgba(255,252,244,0.95)",
              border: "1.5px dashed rgba(140,95,45,0.35)",
              borderTop: "none",
              boxShadow: "0 4px 14px rgba(60,28,6,0.18), inset 0 -1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <p className="font-heading text-[11px] font-semibold leading-tight" style={{ color: "#6A4A30" }}>
              Crochet is my
            </p>
            <p className="font-script text-[15px] leading-tight" style={{ color: "#A83050", fontWeight: 700 }}>
              happy place ♡
            </p>
          </div>
        </div>
      </div>

      {/* Speech bubbles — outside clip so always fully visible */}
      <div className="absolute z-20 hidden sm:block" style={{ top: 18, left: "7%" }}>
        <div className="speech-bubble" style={{ maxWidth: 140 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Aloo is here to cheer you on! 🐾
          </p>
        </div>
      </div>

      <div className="absolute z-20 hidden sm:block" style={{ top: 14, left: "43%" }}>
        <div className="speech-bubble" style={{ maxWidth: 144 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Ashi loves cosy patterns! 🪡
          </p>
        </div>
      </div>

      <div className="absolute z-20 hidden sm:block" style={{ bottom: 80, right: "7%" }}>
        <div className="speech-bubble" style={{ maxWidth: 148 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Yala is ready to create something magical. ✨
          </p>
        </div>
      </div>

      {/* Aloo — left, free-standing */}
      <div className="absolute bottom-0 z-10" style={{ left: "6%" }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={alooSrc}
            alt="Aloo"
            style={{
              width: "min(155px, 22vw)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 20px rgba(50,20,5,0.35))",
            }}
          />
        </motion.div>
      </div>

      {/* Ashi — centre, slightly smaller */}
      <div className="absolute bottom-0 z-10" style={{ left: "50%", transform: "translateX(-50%)" }}>
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <img
            src={ashiSrc}
            alt="Ashi"
            style={{
              width: "min(145px, 21vw)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 7px 18px rgba(50,20,5,0.32))",
            }}
          />
        </motion.div>
      </div>

      {/* Yala — right, larger */}
      <div className="absolute bottom-0 z-10" style={{ right: "5%" }}>
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        >
          <img
            src={yalaSrc}
            alt="Yala"
            style={{
              width: "min(190px, 27vw)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 24px rgba(50,20,5,0.38))",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Action cards — overlap hero by 32px ──────────────────────────────────────

function ContinueProjectCard({
  pattern, onNavigate, onResumeCounting,
}: { pattern: Pattern | null; onNavigate: (v: ViewType) => void; onResumeCounting?: (p: Pattern) => void }) {
  const pct = pattern ? patternProgress(pattern) : 0;
  const steps = pattern?.sections?.flatMap(s => s.steps) ?? [];
  const totalRows = steps.length;
  const doneRows = steps.filter(s => s.completed).length;
  // Last counted row from the shared per-pattern counter store — lets the
  // "resume counting" shortcut say exactly where Larissa left off.
  const counterRows = pattern ? loadCounter(pattern.id).rows : 0;

  return (
    <div className="craft-card craft-card-rose flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">🐾</span>
          <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
            Continue Your Project
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "#9A7868" }}>Pick up where you left off</p>
      </div>

      {pattern ? (
        <div className="flex items-start gap-2.5 flex-1">

          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.14)", containerType: "inline-size" }}>
            <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-[13px] truncate" style={{ color: "#3D2318" }}>
              {pattern.title}
            </p>
            <p className="text-[11px] mb-1.5" style={{ color: "#9A7868" }}>
              {totalRows > 0 ? `Row ${doneRows} of ${totalRows}` : pattern.skillLevel}
            </p>
            <div className="progress-track">
              <div className="progress-fill-rose h-full rounded-full"
                style={{ width: `${pct}%`, transition: "width 0.7s ease" }} />
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "#9A7868" }}>{pct}%</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-3 px-1">
          <img
            src="/characters/char-aloo-transparent.png"
            alt="Aloo"
            style={{ width: 62, height: 62, objectFit: "contain", filter: "drop-shadow(0 3px 8px rgba(50,20,5,0.18))", flexShrink: 0 }}
          />
          <p className="text-[12px] leading-snug" style={{ color: "#B0908A" }}>
            No patterns yet — start your first one!
          </p>
        </div>
      )}

      <button
        onClick={() => onNavigate(pattern ? "viewer" : "input")}
        className="btn-craft btn-rose w-full justify-center text-[12px] py-2"
      >
        {pattern ? "Open Project" : "Start Creating"} →
      </button>
      {pattern && onResumeCounting && (
        <button
          onClick={() => onResumeCounting(pattern)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(132,147,79,0.10)", color: "#84934F", border: "1.5px solid rgba(132,147,79,0.25)" }}
        >
          🧶 {counterRows > 0 ? `Resume counting · Row ${counterRows}` : "Start counting rows"}
        </button>
      )}
    </div>
  );
}

function CreateWithYalaCard({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  return (
    <div className="craft-card craft-card-plum flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Wand2 className="h-4 w-4 flex-shrink-0" style={{ color: "#7C5FA8" }} />
          <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
            Create with Yala
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "#9A7868" }}>Design a pattern with AI</p>
      </div>

      <div className="flex flex-1 gap-2.5 items-center">
        {/* Yala character */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 68, height: 68 }}>
          <img
            src="/characters/char-yala-transparent.png"
            alt="Yala"
            style={{ width: 68, height: 68, objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(50,20,5,0.22))" }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <p className="text-[12px] leading-snug" style={{ color: "#6A4A5A" }}>
            Describe your idea and Yala will bring it to life.
          </p>
          <div className="rounded-xl px-2.5 py-1.5 text-[11px] italic"
            style={{ background: "rgba(124,95,168,0.1)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.2)" }}>
            e.g. A cosy sunflower bag for everyday use
          </div>
        </div>
      </div>

      <button onClick={() => onNavigate("input")} className="btn-craft btn-plum w-full justify-center text-[12px] py-2">
        Start Creating →
      </button>
    </div>
  );
}

function FavoritesCard({
  count, onNavigate,
}: { count: number; onNavigate: (v: ViewType) => void }) {
  return (
    <div className="craft-card craft-card-sage flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Heart className="h-4 w-4 flex-shrink-0" style={{ color: "#84934F" }} fill="#84934F" />
          <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
            Larissa's Favorites
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "#9A7868" }}>Your saved patterns</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        {count === 0 ? (
          <img
            src="/characters/char-ashi-transparent.png"
            alt="Ashi"
            style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 3px 10px rgba(50,20,5,0.18))" }}
          />
        ) : (
          <>
            <span className="font-heading font-bold" style={{ fontSize: 38, color: "#84934F", lineHeight: 1 }}>
              {count}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "#9A7868" }}>
              {count === 1 ? "pattern saved" : "patterns saved"}
            </span>
          </>
        )}
      </div>

      <button onClick={() => onNavigate("favorites")} className="btn-craft btn-sage w-full justify-center text-[12px] py-2">
        View Favorites →
      </button>
    </div>
  );
}

// ─── Bottom sections ──────────────────────────────────────────────────────────

function RecentPatternsSection({
  patterns, onNavigate,
}: { patterns: Pattern[]; onNavigate: (v: ViewType) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
          Recent Patterns
        </span>
        <button onClick={() => onNavigate("library")}
          className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ color: "#C24E6B" }}>
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-2.5">
        {patterns.length === 0 && (
          <p className="text-[12px]" style={{ color: "#B0908A" }}>No patterns yet.</p>
        )}
        {patterns.map((p) => (
          <button key={p.id} onClick={() => onNavigate("library")}
            className="flex flex-col items-start gap-1 group flex-shrink-0" style={{ width: 82 }}>
            <div className="w-full h-20 rounded-xl overflow-hidden"
              style={{ containerType: "inline-size" }}>
              <PatternThumb image={p.endProductImage} title={p.title} projectType={p.projectType} />
            </div>
            <p className="text-[10.5px] font-semibold leading-tight text-left line-clamp-2" style={{ color: "#5C3A28" }}>
              {p.title}
            </p>
            <p className="text-[9.5px]" style={{ color: "#9A7868" }}>{p.projectType} · {p.skillLevel}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommunitySpotlightSection({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  const { data: community = [] } = useQuery<{ id: string; title: string; creator: string; endProductImage?: string; likes: number }[]>({
    queryKey: ["/api/community"],
  });
  const top = [...community].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
          Community Spotlight
        </span>
        <button onClick={() => onNavigate("community")}
          className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ color: "#C24E6B" }}>
          View library <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onNavigate("community")}
        className="craft-card p-3 flex gap-3 items-start w-full text-left hover:opacity-90 transition-opacity"
      >
        <div className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden"
          style={{ containerType: "inline-size" }}>
          <PatternThumb image={top?.endProductImage} title={top?.title ?? "Community"} projectType={top ? undefined : undefined} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="font-heading font-semibold text-[12px] leading-tight" style={{ color: "#3D2318" }}>
            {top ? top.title : "Explore the community gallery"}
          </p>
          <p className="text-[10.5px]" style={{ color: "#9A7868" }}>
            {top ? `by ${top.creator}` : "Share your patterns with others"}
          </p>
          {top && (
            <div className="flex items-center gap-1 mt-0.5">
              <Heart className="h-3 w-3 flex-shrink-0" style={{ color: "#C24E6B" }} fill="#C24E6B" />
              <span className="text-[10.5px] font-semibold" style={{ color: "#C24E6B" }}>{top.likes}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function UpcomingMilestoneSection({ projectsCount, onNavigate }: { projectsCount: number; onNavigate: (v: ViewType) => void }) {
  const next = Math.ceil((projectsCount + 1) / 5) * 5;
  const need = next - projectsCount;
  const filled = 5 - need;

  return (
    <div>
      <div className="mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
          Upcoming Milestone
        </span>
      </div>
      <button onClick={() => onNavigate("progress")} className="craft-card craft-card-honey p-3 flex items-center gap-3 w-full text-left hover:opacity-90 transition-opacity">
        {/* Amigurumi bee character */}
        <img
          src="/characters/char-bee-transparent.png"
          alt="Bee"
          className="flex-shrink-0"
          style={{ width: 46, height: 46, objectFit: "contain", filter: "drop-shadow(0 3px 8px rgba(50,30,0,0.2))" }}
        />

        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-[12px]" style={{ color: "#3D2318" }}>You're close!</p>
          <p className="text-[10.5px] leading-snug mt-0.5" style={{ color: "#7A6040" }}>
            Complete {need} more {need === 1 ? "project" : "projects"} to unlock a special reward.
          </p>
          {/* Flower dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <FlowerDot key={i} filled={i < filled} color="#D4921A" />
            ))}
          </div>
        </div>

        {/* Chevron */}
        <ChevRight className="flex-shrink-0 h-4 w-4" style={{ color: "#D4921A", opacity: 0.7 }} />
      </button>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({
  projectsCount, favoritesCount, milestonesCount, onNavigate,
}: { projectsCount: number; favoritesCount: number; milestonesCount: number; onNavigate: (v: ViewType) => void }) {
  const STATS = [
    { value: projectsCount,   label: "Projects",
      icon: <svg viewBox="0 0 22 22" width="20" height="20"><circle cx="11" cy="11" r="8" fill="none" stroke="rgba(255,200,120,0.8)" strokeWidth="1.5" strokeDasharray="4,2.5"/><circle cx="11" cy="11" r="3.5" fill="rgba(255,200,120,0.6)"/><ellipse cx="11" cy="11" rx="5.5" ry="2.5" fill="none" stroke="rgba(255,200,120,0.5)" strokeWidth="0.9"/></svg>
    },
    { value: favoritesCount,  label: "Favorites",
      icon: <svg viewBox="0 0 22 22" width="20" height="20"><path d="M 11 18 Q 4 12 3 8 Q 2 4 6 3 Q 9 2 11 6 Q 13 2 16 3 Q 20 4 19 8 Q 18 12 11 18 Z" fill="#F090A0" fillOpacity="0.85"/></svg>
    },
    { value: milestonesCount, label: "Milestones",
      icon: <svg viewBox="0 0 22 22" width="20" height="20">{[0,72,144,216,288].map(a => { const rad = a*Math.PI/180; return <ellipse key={a} cx={11+Math.cos(rad)*4.5} cy={11+Math.sin(rad)*4.5} rx="2.8" ry="2" transform={`rotate(${a},${11+Math.cos(rad)*4.5},${11+Math.sin(rad)*4.5})`} fill="rgba(255,200,120,0.8)" fillOpacity="0.85"/>; })}<circle cx="11" cy="11" r="2.8" fill="rgba(255,200,120,0.9)"/></svg>
    },
  ];

  return (
    <div
      className="rounded-2xl px-4 py-3 md:px-6 md:py-4 flex flex-wrap items-center justify-between gap-2"
      style={{
        background: "linear-gradient(135deg, #7A4A28 0%, #9A6235 40%, #8A5428 100%)",
        boxShadow: "0 4px 20px rgba(60,30,8,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      <div className="flex flex-wrap items-center gap-4 md:gap-8">
        {STATS.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2 md:gap-3">
            {i > 0 && <div className="hidden md:block w-px h-8" style={{ background: "rgba(255,255,255,0.2)" }} />}
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">{item.icon}</div>
              <div>
                <p className="font-heading font-bold leading-none" style={{ fontSize: 20, color: "rgba(255,248,235,0.95)" }}>
                  {item.value}
                </p>
                <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: "rgba(255,220,160,0.8)" }}>
                  {item.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNavigate("progress")}
        className="hidden sm:flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-bold transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #D4921A, #E8A830)",
          color: "white",
          boxShadow: "0 3px 12px rgba(150,80,10,0.4)",
        }}>
        <Trophy className="h-3.5 w-3.5" />
        View Achievements →
      </button>
    </div>
  );
}

// ─── Right panel ──────────────────────────────────────────────────────────────

export function HomeRightPanel({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  const { data: patterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });

  const active = patterns.find((p) => p.status === "active") ?? patterns.find((p) => p.status !== "finished") ?? patterns[0] ?? null;
  const overview = patterns.slice(0, 3);
  const pct = active ? patternProgress(active) : 0;
  const steps = active?.sections?.flatMap(s => s.steps) ?? [];
  const doneRows = steps.filter(s => s.completed).length;
  const timeSpent = formatTimeSpent(active?.startedAt);

  return (
    <div className="flex flex-col gap-3 p-4 relative">
      {/* Large decorative flower — top-right corner */}
      <div className="absolute -top-3 -right-4 pointer-events-none z-0">
        <svg viewBox="0 0 56 56" width="80" height="80">
          {[0,72,144,216,288].map((a) => {
            const rad = (a * Math.PI) / 180;
            const cx = 28 + Math.cos(rad) * 11;
            const cy = 28 + Math.sin(rad) * 11;
            return <ellipse key={a} cx={cx} cy={cy} rx="9.5" ry="6.5"
              transform={`rotate(${a},${cx},${cy})`}
              fill="#C24E6B" fillOpacity="0.72" />;
          })}
          <circle cx="28" cy="28" r="7" fill="#C24E6B" fillOpacity="0.88" />
          <circle cx="28" cy="28" r="3" fill="white" fillOpacity="0.55" />
        </svg>
      </div>

      {/* Active Project */}
      <div className="craft-card p-3.5 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>
            Active Project
          </span>
          <FolderOpen className="h-4 w-4" style={{ color: "#9A7868" }} />
        </div>
        {active ? (
          <div>
            <div className="flex items-start gap-2.5 mb-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.12)", containerType: "inline-size" }}>
                <PatternThumb image={active.endProductImage} title={active.title} projectType={active.projectType} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[13px] truncate" style={{ color: "#3D2318" }}>
                  {active.title}
                </p>
                <span className="badge-green inline-block mt-0.5">In Progress</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-[10.5px] mb-1" style={{ color: "#9A7868" }}>
                <span>Row {doneRows} of {steps.length || "—"}</span>
                <span>{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill-rose h-full rounded-full"
                  style={{ width: `${pct}%`, transition: "width 0.7s ease" }} />
              </div>
            </div>
            {/* Time spent row */}
            <div className="flex justify-between items-center text-[10.5px] mb-2"
              style={{ color: "#9A7868", borderTop: "1px dashed rgba(140,100,55,0.18)", paddingTop: 6 }}>
              <span>Time since start</span>
              <span className="font-semibold" style={{ color: "#5C3A28" }}>{timeSpent}</span>
            </div>
            <button onClick={() => onNavigate("viewer")}
              className="btn-craft btn-rose w-full justify-center text-[11px] py-1.5">
              Open Workspace →
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-center py-3" style={{ color: "#9A7868" }}>
            No active project yet
          </p>
        )}
      </div>

      {/* Projects Overview */}
      {overview.length > 0 && (
        <div className="craft-card p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>
              Projects Overview
            </span>
            <button onClick={() => onNavigate("library")}
              className="text-[10.5px] font-semibold hover:opacity-70" style={{ color: "#C24E6B" }}>
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {overview.map((p) => {
              const pp = patternProgress(p);
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ containerType: "inline-size" }}>
                    <PatternThumb image={p.endProductImage} title={p.title} projectType={p.projectType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-semibold truncate" style={{ color: "#3D2318" }}>{p.title}</p>
                    <p className="text-[10px]" style={{ color: "#9A7868" }}>In Progress</p>
                    <div className="progress-track mt-1">
                      <div className="progress-fill-rose h-full rounded-full"
                        style={{ width: `${pp}%`, transition: "width 0.7s ease" }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "#9A7868" }}>
                    {pp}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivational quote */}
      <div className="craft-card p-3.5 text-center">
        <Heart className="h-4 w-4 mx-auto mb-2" style={{ color: "#C24E6B" }} fill="#C24E6B" />
        <p className="font-heading text-[12px] leading-relaxed italic" style={{ color: "#5C3A28" }}>
          "Every stitch brings you closer to something beautiful."
        </p>
        <p className="mt-1.5 font-script text-[15px]" style={{ color: "#C24E6B" }}>♡</p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomeWorkbench({ onNavigate, onPatternSelected, onResumeCounting }: HomeWorkbenchProps) {
  const qc = useQueryClient();
  const { text, emoji } = greeting();

  const { data: patterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const { data: characterImages = {} } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/characters"],
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: communityPatterns = [] } = useQuery<{ id: string }[]>({ queryKey: ["/api/community"] });

  const [streak] = useState(() => getStreak());
  const [lastSeenCount, setLastSeenCount] = useState(() => getLastSeenCount());
  const unreadCount = Math.max(0, communityPatterns.length - lastSeenCount);

  const handleBellClick = () => {
    markCommunityRead(communityPatterns.length);
    setLastSeenCount(communityPatterns.length);
    onNavigate("community");
  };

  const [generatingIds, setGeneratingIds] = useState(new Set<string>());

  const generateMutation = useMutation({
    mutationFn: (characterId: string) =>
      apiRequest("POST", "/api/characters/generate", { characterId }).then((r) => r.json()),
    onMutate: (characterId) => {
      setGeneratingIds((s) => { const n = new Set(s); n.add(characterId); return n; });
    },
    onSettled: (_d, _e, characterId) => {
      setGeneratingIds((s) => { const n = new Set(s); n.delete(characterId); return n; });
      qc.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  const handleGenerateAll = () => {
    ["aloo", "yala", "ashi", "bee", "sheep"].forEach((id) => {
      if (!characterImages[id] && !generatingIds.has(id)) {
        generateMutation.mutate(id);
      }
    });
  };

  const activePattern = patterns.find((p) => p.status === "active") ?? patterns.find((p) => p.status !== "finished") ?? patterns[0] ?? null;
  const favoritesCount = patterns.filter((p) => p.favorite).length;
  const projectsCount = patterns.length;
  const milestonesCount = patterns.filter((p) => p.status === 'finished').length;
  const recentPatterns = patterns.slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div>
          <h1 className="font-heading font-bold" style={{ fontSize: 28, color: "#3D2318", letterSpacing: "-0.02em" }}>
            {text},{" "}
            <span className="font-script" style={{ fontSize: 30, color: "#A83050" }}>Larissa!</span>{" "}
            {emoji}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#9A7868" }}>
            Let's create something beautiful today.
          </p>
          {/* Motivational chip — visible only on mobile (sidebar hidden) */}
          {streak.current > 0 ? (
            <div
              className="md:hidden inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(212,146,26,0.09)", color: "#B07010", border: "1px dashed rgba(212,146,26,0.35)" }}
            >
              🔥 {streak.current}-day streak{streak.activeToday ? " — keep it up!" : " — crochet today!"}
            </div>
          ) : (
            <div
              className="md:hidden inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(194,78,107,0.09)", color: "#C24E6B", border: "1px dashed rgba(194,78,107,0.3)" }}
            >
              ✨ Start a streak — crochet something today!
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate("search")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
            style={{ background: "rgba(255,252,245,0.8)", border: "1px solid rgba(140,100,55,0.2)" }}>
            <Search className="h-4 w-4" style={{ color: "#9A7868" }} />
          </button>
          <button
            onClick={handleBellClick}
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
            style={{ background: "rgba(255,252,245,0.8)", border: "1px solid rgba(140,100,55,0.2)" }}>
            <Bell className="h-4 w-4" style={{ color: "#9A7868" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: "#C24E6B" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
          {/* Avatar + chevron → Settings */}
          <button onClick={() => onNavigate("settings")} className="flex items-center gap-1 cursor-pointer group">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-script text-lg"
              style={{ background: "linear-gradient(135deg,#E0A0B0,#C24E6B)", color: "white", fontWeight: 700,
                boxShadow: "0 2px 8px rgba(194,78,107,0.3)" }}>
              L
            </div>
            <ChevronRight className="h-3.5 w-3.5 rotate-90 group-hover:opacity-70 transition-opacity" style={{ color: "#9A7868" }} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">

        {/* Hero zone */}
        <HeroZone
          characterImages={characterImages}
          generatingIds={generatingIds}
          onGenerateAll={handleGenerateAll}
          onNavigate={onNavigate}
        />

        {/* Action cards — slight overlap on sm+, flush on mobile so characters don't clash */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 mt-3 sm:-mt-7">
          <div style={{ minHeight: 190 }}>
            <ContinueProjectCard pattern={activePattern} onNavigate={onNavigate} onResumeCounting={onResumeCounting} />
          </div>
          <div style={{ minHeight: 190 }}>
            <CreateWithYalaCard onNavigate={onNavigate} />
          </div>
          <div style={{ minHeight: 190 }}>
            <FavoritesCard count={favoritesCount} onNavigate={onNavigate} />
          </div>
        </div>

        {/* Active Projects — mobile main column (desktop has right panel) */}
        {activePattern && (
          <div className="block md:hidden mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-[15px]" style={{ color: "#3D2318" }}>Active Project</h3>
              <button onClick={() => onNavigate("library")}
                className="text-[11px] font-semibold" style={{ color: "#9A7868" }}>
                All projects →
              </button>
            </div>
            <div className="craft-card p-4 flex gap-3 items-center"
              style={{ cursor: "pointer" }}
              onClick={() => onPatternSelected?.(activePattern)}>
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                style={{ containerType: "inline-size" }}>
                <PatternThumb image={activePattern.endProductImage} title={activePattern.title} projectType={activePattern.projectType} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-[14px] truncate" style={{ color: "#3D2318" }}>
                  {activePattern.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9A7868" }}>
                  {activePattern.projectType} · {activePattern.skillLevel}
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(140,100,55,0.15)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        (activePattern.sections.reduce((a, s) => a + s.steps.filter(st => st.completed).length, 0) /
                        Math.max(1, activePattern.sections.reduce((a, s) => a + s.steps.length, 0))) * 100
                      )}%`,
                      background: "linear-gradient(90deg, #C24E6B, #A83050)",
                    }} />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#9A7868" }} />
            </div>
          </div>
        )}

        {/* Bottom sections — 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 mb-4">
          <RecentPatternsSection patterns={recentPatterns} onNavigate={onNavigate} />
          <CommunitySpotlightSection onNavigate={onNavigate} />
          <UpcomingMilestoneSection projectsCount={projectsCount} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Stats bar — outside scroll area so always visible at bottom */}
      <div className="flex-shrink-0 px-6 pb-20 md:pb-5 pt-0">
        <StatsBar
          projectsCount={projectsCount}
          favoritesCount={favoritesCount}
          milestonesCount={milestonesCount}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
