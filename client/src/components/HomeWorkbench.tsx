import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Bell, ImageIcon, Loader2, ChevronRight,
  Heart, Wand2, FolderOpen, Trophy,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Pattern, ViewType } from "../lib/types";

interface HomeWorkbenchProps {
  onNavigate: (view: ViewType) => void;
  currentPattern?: Pattern | null;
  onPatternSelected?: (p: Pattern) => void;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

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

// ─── Small SVG decorations ─────────────────────────────────────────────────────

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
          transform={`rotate(${a},${cx},${cy})`} fill={color} fillOpacity="0.75" />;
      })}
      <circle r={r*0.26} fill={color} fillOpacity="0.95" />
      <circle r={r*0.12} fill="white"  fillOpacity="0.55" />
    </g>
  );
}

function YarnBall({ x, y, color, r = 18 }: { x:number; y:number; color:string; r?:number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} fill={color} fillOpacity="0.55" />
      <circle r={r} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <ellipse rx={r*0.72} ry={r*0.32} fill="none" stroke="white" strokeWidth="0.9" strokeOpacity="0.35" />
      <ellipse rx={r*0.72} ry={r*0.32} fill="none" stroke="white" strokeWidth="0.9" strokeOpacity="0.25"
        transform="rotate(60)" />
      <ellipse rx={r*0.72} ry={r*0.32} fill="none" stroke="white" strokeWidth="0.9" strokeOpacity="0.25"
        transform="rotate(-60)" />
    </g>
  );
}

// ─── Character oval (hero) ────────────────────────────────────────────────────

function CharacterOval({
  charKey, width, height, imageUrl, isGenerating,
}: {
  charKey: keyof typeof CHAR; width: number; height: number;
  imageUrl: string | null; isGenerating: boolean;
}) {
  const c = CHAR[charKey];
  const br = "50% 50% 46% 46% / 54% 54% 46% 46%";
  // Try static path first (instant load), fall back to API url, then to placeholder
  const staticUrl = `/characters/char-${charKey}.png`;
  const [src, setSrc] = useState<string | null>(staticUrl);
  const [failed, setFailed] = useState(false);

  // If static url fails, fall back to the API-provided url
  const handleError = () => {
    if (src === staticUrl && imageUrl) {
      setSrc(imageUrl);
    } else {
      setSrc(null);
      setFailed(true);
    }
  };

  const showImage = src && !failed;
  const showSpinner = isGenerating && !showImage;

  return (
    <div
      className="relative overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width, height,
        borderRadius: br,
        border: `2.5px solid ${c.color}55`,
        boxShadow: `0 16px 48px ${c.color}30, 0 4px 12px ${c.color}18, inset 0 1px 0 rgba(255,255,255,0.7)`,
        background: showImage
          ? undefined
          : `radial-gradient(ellipse at 40% 32%, white 0%, ${c.light} 28%, ${c.mid} 70%, ${c.color}40 100%)`,
      }}
    >
      {showImage ? (
        <img src={src} alt={c.label} onError={handleError}
          className="w-full h-full object-cover" style={{ borderRadius: br }} />
      ) : showSpinner ? (
        <Loader2 className="animate-spin" style={{ color: c.color, width: 26, height: 26 }} />
      ) : (
        <>
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 60 60">
            <defs>
              <pattern id={`dots-${charKey}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="2.4" fill={c.color} />
              </pattern>
            </defs>
            <rect width="60" height="60" fill={`url(#dots-${charKey})`} />
          </svg>
          <span className="font-heading font-bold select-none"
            style={{ fontSize: width * 0.42, color: c.color, opacity: 0.2, letterSpacing: "-0.04em" }}>
            {c.label[0]}
          </span>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}40` }}>
              {c.label}
            </span>
          </div>
          <div className="absolute inset-0 rounded-t-full opacity-35 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)", height: "42%" }} />
        </>
      )}
    </div>
  );
}

// ─── Hero zone ────────────────────────────────────────────────────────────────

function HeroZone({
  characterImages, generatingIds, onGenerateAll, onNavigate,
}: {
  characterImages: Record<string, string | null>;
  generatingIds: Set<string>;
  onGenerateAll: () => void;
  onNavigate: (v: ViewType) => void;
}) {
  const alooImg = characterImages.aloo ?? null;
  const yalaImg = characterImages.yala ?? null;
  const anyMissing = !alooImg || !yalaImg;
  const isGenerating = generatingIds.has("aloo") || generatingIds.has("yala");

  return (
    <div
      className="relative w-full mb-4 rounded-2xl overflow-hidden"
      style={{
        height: 280,
        background: "linear-gradient(145deg, #B07840 0%, #C89060 18%, #D8AA78 38%, #EAC890 55%, #D8AA78 72%, #C08858 88%, #A87040 100%)",
        boxShadow: "0 4px 20px rgba(80,45,10,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      {/* Top shelf shadow */}
      <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(60,30,5,0.25), transparent)" }} />

      {/* SVG scene props layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 780 260"
        preserveAspectRatio="xMidYMid meet">
        {/* Yarn balls */}
        <YarnBall x={50}  y={42}  color="#C24E6B" r={20} />
        <YarnBall x={85}  y={28}  color="#84934F" r={15} />
        <YarnBall x={24}  y={68}  color="#D4921A" r={13} />
        <YarnBall x={700} y={35}  color="#7C5FA8" r={18} />
        <YarnBall x={730} y={55}  color="#3D8FA3" r={13} />
        <YarnBall x={712} y={18}  color="#C24E6B" r={11} />
        {/* Decorative flowers */}
        <CrochetFlower x={140} y={220} color="#C24E6B" size={26} rotate={20} />
        <CrochetFlower x={160} y={240} color="#84934F" size={16} rotate={-30} />
        <CrochetFlower x={620} y={215} color="#7C5FA8" size={22} rotate={15} />
        <CrochetFlower x={645} y={238} color="#D4921A" size={14} rotate={40} />
        {/* Stem / lavender sprigs */}
        <line x1="680" y1="260" x2="680" y2="180" stroke="#84934F" strokeWidth="2" strokeOpacity="0.6" />
        <ellipse cx="680" cy="175" rx="4" ry="8" fill="#7C5FA8" fillOpacity="0.5" />
        <ellipse cx="676" cy="188" rx="3" ry="7" fill="#7C5FA8" fillOpacity="0.45" transform="rotate(-15,676,188)" />
        <ellipse cx="684" cy="185" rx="3" ry="7" fill="#7C5FA8" fillOpacity="0.45" transform="rotate(15,684,185)" />
      </svg>

      {/* "Crochet is my happy place" tag — hanging from top centre */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        <div className="w-px h-3" style={{ background: "rgba(120,70,20,0.45)" }} />
        <div className="px-4 py-2 rounded-b-xl rounded-t-sm text-center"
          style={{
            background: "rgba(255,252,245,0.92)",
            border: "1.5px dashed rgba(140,100,55,0.32)",
            borderTop: "none",
            boxShadow: "0 3px 10px rgba(80,45,10,0.14), inset 0 -1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <p className="font-heading text-[11px] font-semibold leading-tight" style={{ color: "#6A4A30" }}>
            Crochet is my
          </p>
          <p className="font-script text-[14px] leading-tight" style={{ color: "#A83050", fontWeight: 700 }}>
            happy place ♡
          </p>
        </div>
      </div>

      {/* Aloo speech bubble — top left, floating */}
      <div className="absolute z-20" style={{ top: 18, left: "12%" }}>
        <div className="speech-bubble" style={{ maxWidth: 148 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Aloo is here to cheer you on while you work on your project. 🐾
          </p>
        </div>
      </div>

      {/* Yala speech bubble — top right, floating */}
      <div className="absolute z-20" style={{ top: 18, right: "11%" }}>
        <div className="speech-bubble" style={{ maxWidth: 152 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Yala is ready to create something magical with you. ✨
          </p>
        </div>
      </div>

      {/* Aloo — left character, sits at bottom, smaller so scene breathes */}
      <div className="absolute bottom-0 z-10" style={{ left: "7%" }}>
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <CharacterOval charKey="aloo" width={108} height={136}
            imageUrl={alooImg} isGenerating={generatingIds.has("aloo")} />
        </motion.div>
      </div>

      {/* Yala — right character (larger), sits at bottom */}
      <div className="absolute bottom-0 z-10" style={{ right: "6%" }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <CharacterOval charKey="yala" width={126} height={158}
            imageUrl={yalaImg} isGenerating={generatingIds.has("yala")} />
        </motion.div>
      </div>

      {/* Wooden surface line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(80,40,8,0.28), transparent)" }} />

      {/* Generate button — visible at centre-right area */}
      <AnimatePresence>
        {anyMissing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onGenerateAll}
            disabled={isGenerating}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all disabled:opacity-60 z-20"
            style={{
              background: isGenerating ? "rgba(255,252,245,0.7)" : "rgba(255,252,245,0.92)",
              color: "#A83050",
              border: "1.5px dashed rgba(194,78,107,0.4)",
              boxShadow: "0 2px 10px rgba(80,45,10,0.12)",
              backdropFilter: "blur(4px)",
            }}
          >
            {isGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating companions…</>
              : <><ImageIcon className="h-3.5 w-3.5" />Generate companions with AI</>}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Action cards ─────────────────────────────────────────────────────────────

function ContinueProjectCard({
  pattern, onNavigate,
}: { pattern: Pattern | null; onNavigate: (v: ViewType) => void }) {
  const pct = pattern ? patternProgress(pattern) : 0;
  return (
    <div className="craft-card craft-card-rose flex flex-col gap-2.5 p-4 h-full">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">🐾</span>
          <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
            Continue Your Project
          </span>
        </div>
        <p className="text-[11px] font-sans" style={{ color: "#9A7868" }}>Pick up where you left off</p>
      </div>

      {pattern ? (
        <div className="flex items-start gap-2.5 flex-1">
          {pattern.imgUrl && !pattern.imgUrl.startsWith("https://placehold") && (
            <img src={pattern.imgUrl} alt={pattern.title}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.12)" }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-[13px] truncate" style={{ color: "#3D2318" }}>
              {pattern.title}
            </p>
            <p className="text-[11px] mb-1.5" style={{ color: "#9A7868" }}>{pattern.skillLevel}</p>
            <div className="progress-track">
              <div className="progress-fill-rose h-full rounded-full"
                style={{ width: `${pct}%`, transition: "width 0.7s ease" }} />
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "#9A7868" }}>{pct}% complete</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center px-2">
          <p className="text-[12px]" style={{ color: "#B0908A" }}>
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
        <p className="text-[11px] font-sans" style={{ color: "#9A7868" }}>Design a pattern with AI</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <p className="text-[12px] leading-snug" style={{ color: "#6A4A5A" }}>
          Describe your idea and Yala will bring it to life.
        </p>
        <div className="rounded-xl px-3 py-2 text-[11px] italic"
          style={{ background: "rgba(124,95,168,0.08)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.18)" }}>
          e.g. A cosy sunflower bag for everyday use
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
        <p className="text-[11px] font-sans" style={{ color: "#9A7868" }}>Your saved patterns</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <span className="font-heading font-bold" style={{ fontSize: 36, color: "#84934F", lineHeight: 1 }}>
          {count}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: "#9A7868" }}>
          {count === 1 ? "pattern saved" : "patterns saved"}
        </span>
      </div>

      <button onClick={() => onNavigate("library")} className="btn-craft btn-sage w-full justify-center text-[12px] py-2">
        View Favorites →
      </button>
    </div>
  );
}

// ─── Bottom sections ─────────────────────────────────────────────────────────

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
          <p className="text-[12px] text-brown-muted">No patterns yet.</p>
        )}
        {patterns.map((p) => (
          <button
            key={p.id}
            onClick={() => onNavigate("library")}
            className="flex flex-col items-start gap-1 group flex-shrink-0"
            style={{ width: 80 }}
          >
            <div className="w-full h-20 rounded-xl overflow-hidden craft-card p-0"
              style={{ background: p.imgUrl && !p.imgUrl.startsWith("https://placehold")
                ? undefined : `hsl(${CHAR.aloo.light})` }}>
              {p.imgUrl && !p.imgUrl.startsWith("https://placehold") ? (
                <img src={p.imgUrl} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-heading font-bold text-2xl" style={{ color: "#C24E6B", opacity: 0.3 }}>
                    {p.title[0]}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10.5px] font-semibold leading-tight text-left line-clamp-2 group-hover:opacity-75 transition-opacity"
              style={{ color: "#5C3A28" }}>
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
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
          Community Spotlight
        </span>
        <button onClick={() => onNavigate("library")}
          className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ color: "#C24E6B" }}>
          View library <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="craft-card p-3 flex flex-col gap-2">
        <div className="w-full h-20 rounded-lg overflow-hidden" style={{ background: "linear-gradient(135deg, #E8D0B8 0%, #D4B898 100%)" }}>
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-60">🌸</span>
          </div>
        </div>
        <p className="font-heading font-semibold text-[12px]" style={{ color: "#3D2318" }}>
          Granny Square Flower Blanket
        </p>
        <p className="text-[10.5px]" style={{ color: "#9A7868" }}>by CrochetLily</p>
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3" style={{ color: "#C24E6B" }} fill="#C24E6B" />
          <span className="text-[10.5px] font-semibold" style={{ color: "#C24E6B" }}>1.2k</span>
        </div>
      </div>
    </div>
  );
}

function UpcomingMilestoneSection({ projectsCount }: { projectsCount: number }) {
  const next = Math.ceil((projectsCount + 1) / 5) * 5;
  const need = next - projectsCount;
  return (
    <div>
      <div className="mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>
          Upcoming Milestone
        </span>
      </div>
      <div className="craft-card craft-card-honey p-3 flex flex-col items-center text-center gap-2">
        {/* Small bee decoration */}
        <svg viewBox="0 0 60 65" fill="none" className="w-14 h-16">
          <ellipse cx="12" cy="32" rx="11" ry="7" fill="rgba(190,225,255,0.7)" transform="rotate(-20,12,32)" />
          <ellipse cx="48" cy="32" rx="11" ry="7" fill="rgba(190,225,255,0.7)" transform="rotate(20,48,32)" />
          <ellipse cx="30" cy="44" rx="16" ry="18" fill="#F0C840" />
          <rect x="14" y="38" width="32" height="5.5" rx="2.75" fill="rgba(45,25,5,0.65)" />
          <rect x="14" y="49" width="32" height="5.5" rx="2.75" fill="rgba(45,25,5,0.65)" />
          <circle cx="30" cy="25" r="11" fill="#F0C840" />
          <circle cx="26" cy="23" r="2.5" fill="#2D1905" /><circle cx="34" cy="23" r="2.5" fill="#2D1905" />
          <circle cx="27" cy="22.5" r="0.9" fill="white" /><circle cx="35" cy="22.5" r="0.9" fill="white" />
          <path d="M 25 29 Q 30 33 35 29" stroke="#2D1905" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <line x1="26" y1="15" x2="21" y2="7" stroke="#2D1905" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="21" cy="6" r="2" fill="#C24E6B" />
          <line x1="34" y1="15" x2="39" y2="7" stroke="#2D1905" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="39" cy="6" r="2" fill="#C24E6B" />
        </svg>
        <div>
          <p className="font-heading font-semibold text-[12px]" style={{ color: "#3D2318" }}>
            You're close!
          </p>
          <p className="text-[11px] leading-snug mt-0.5" style={{ color: "#7A6040" }}>
            Complete {need} more {need === 1 ? "project" : "projects"} to unlock a special reward.
          </p>
        </div>
        {/* Milestone dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-full"
              style={{
                width: i < (5 - need) ? 10 : 8,
                height: i < (5 - need) ? 10 : 8,
                background: i < (5 - need) ? "#D4921A" : "rgba(212,146,26,0.25)",
                border: `1.5px solid ${i < (5 - need) ? "#D4921A" : "rgba(212,146,26,0.4)"}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({
  projectsCount, favoritesCount, milestonesCount,
}: { projectsCount: number; favoritesCount: number; milestonesCount: number }) {
  const items = [
    { value: projectsCount,   label: "Projects",   icon: "🧶" },
    { value: favoritesCount,  label: "Favorites",  icon: "♡" },
    { value: milestonesCount, label: "Milestones", icon: "🌸" },
  ];
  return (
    <div className="craft-card flex items-center justify-between px-6 py-3.5"
      style={{ background: "rgba(255,252,245,0.7)" }}>
      <div className="flex items-center gap-8">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-3">
            {i > 0 && <div className="w-px h-8" style={{ background: "rgba(140,100,55,0.2)" }} />}
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="font-heading font-bold leading-none" style={{ fontSize: 22, color: "#3D2318" }}>
                  {item.value}
                </p>
                <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: "#9A7868" }}>
                  {item.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-craft btn-honey flex items-center gap-1.5 text-[12px] py-2 px-4">
        <Trophy className="h-3.5 w-3.5" />
        View Achievements →
      </button>
    </div>
  );
}

// ─── Right panel (exported) ───────────────────────────────────────────────────

export function HomeRightPanel({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  const { data: patterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });

  const active = patterns[0] ?? null;
  const overview = patterns.slice(0, 3);
  const pct = active ? patternProgress(active) : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Active Project */}
      <div className="craft-card p-3.5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>
            Active Project
          </span>
          <FolderOpen className="h-4 w-4" style={{ color: "#9A7868" }} />
        </div>
        {active ? (
          <div>
            <div className="flex items-start gap-2.5 mb-2.5">
              {active.imgUrl && !active.imgUrl.startsWith("https://placehold") && (
                <img src={active.imgUrl} alt={active.title}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  style={{ boxShadow: "0 2px 8px rgba(80,45,10,0.12)" }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[13px] truncate" style={{ color: "#3D2318" }}>
                  {active.title}
                </p>
                <span className="badge-green inline-block mt-0.5">In Progress</span>
              </div>
            </div>
            <div className="mb-1.5">
              <div className="flex justify-between text-[10.5px] mb-1" style={{ color: "#9A7868" }}>
                <span>Progress</span><span>{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill-rose h-full rounded-full"
                  style={{ width: `${pct}%`, transition: "width 0.7s ease" }} />
              </div>
            </div>
            <button
              onClick={() => onNavigate("viewer")}
              className="btn-craft btn-rose w-full justify-center text-[11px] py-1.5 mt-2"
            >
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
                  {p.imgUrl && !p.imgUrl.startsWith("https://placehold") ? (
                    <img src={p.imgUrl} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#FBF1F4" }}>
                      <span className="font-heading font-bold text-sm" style={{ color: "#C24E6B", opacity: 0.5 }}>
                        {p.title[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-semibold truncate" style={{ color: "#3D2318" }}>{p.title}</p>
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

export default function HomeWorkbench({ onNavigate }: HomeWorkbenchProps) {
  const qc = useQueryClient();
  const { text, emoji } = greeting();

  const { data: patterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const { data: characterImages = {} } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/characters"],
    staleTime: 0,
    refetchOnMount: "always",
  });

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

  const activePattern = patterns[0] ?? null;
  const favoritesCount = patterns.filter((p) => p.favorite).length;
  const projectsCount = patterns.length;
  const milestonesCount = patterns.filter((p) => p.completed).length;
  const recentPatterns = patterns.slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div>
          <h1 className="font-heading font-bold" style={{ fontSize: 24, color: "#3D2318", letterSpacing: "-0.02em" }}>
            {text}, Larissa! {emoji}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#9A7868" }}>
            Let's create something beautiful today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
            style={{ background: "rgba(255,252,245,0.8)", border: "1.5px dashed rgba(140,100,55,0.25)" }}>
            <Search className="h-4 w-4" style={{ color: "#9A7868" }} />
          </button>
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
            style={{ background: "rgba(255,252,245,0.8)", border: "1.5px dashed rgba(140,100,55,0.25)" }}>
            <Bell className="h-4 w-4" style={{ color: "#9A7868" }} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: "#C24E6B" }}>3</span>
          </button>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-script text-lg"
            style={{ background: "linear-gradient(135deg,#E0A0B0,#C24E6B)", color: "white", fontWeight: 700 }}>
            L
          </div>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 pb-20 md:pb-6">

        {/* Hero zone */}
        <HeroZone
          characterImages={characterImages}
          generatingIds={generatingIds}
          onGenerateAll={handleGenerateAll}
          onNavigate={onNavigate}
        />

        {/* Action cards — 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" style={{ minHeight: 180 }}>
          <ContinueProjectCard pattern={activePattern} onNavigate={onNavigate} />
          <CreateWithYalaCard onNavigate={onNavigate} />
          <FavoritesCard count={favoritesCount} onNavigate={onNavigate} />
        </div>

        {/* Bottom sections — 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <RecentPatternsSection patterns={recentPatterns} onNavigate={onNavigate} />
          <CommunitySpotlightSection onNavigate={onNavigate} />
          <UpcomingMilestoneSection projectsCount={projectsCount} />
        </div>

        {/* Stats bar */}
        <StatsBar
          projectsCount={projectsCount}
          favoritesCount={favoritesCount}
          milestonesCount={milestonesCount}
        />
      </div>
    </div>
  );
}

