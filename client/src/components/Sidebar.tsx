import { palette } from "@/lib/theme";
import { Package } from "lucide-react";
import { getActiveProfile } from "../lib/profile";
import { FC, useState } from "react";
import {
  Home, Wand2, BookOpen, Heart, Users, User, Settings, Sparkles,
} from "lucide-react";
import { ViewType } from "../lib/types";
import { getStreak } from "../lib/activityLog";

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const PRIMARY_NAV: { id: string; view: ViewType; label: string; icon: typeof Home }[] = [
  { id: "home",      view: "home",      label: "Home",      icon: Home },
  { id: "studio",    view: "input",     label: "Create",    icon: Wand2 },
  { id: "library",   view: "library",   label: "Library",   icon: BookOpen },
  { id: "projects",  view: "projects",  label: "Projects",  icon: BasketIcon as typeof Home },
  { id: "community", view: "community", label: "Community", icon: Users },
];

const SECONDARY_NAV: { id: string; view: ViewType; label: string; icon: typeof Home }[] = [
  { id: "stash",     view: "stash",      label: "My Stash",          icon: Package },
  { id: "yarn-recs", view: "yarn-recs",  label: "Make From My Stash", icon: Sparkles },
  { id: "favorites", view: "favorites",  label: "Favorites",         icon: Heart },
  { id: "profile",   view: "profile-picker", label: "Switch Profile",    icon: User },
  { id: "settings",  view: "settings",   label: "Settings",          icon: Settings },
];

function resolveActiveId(view: ViewType): string {
  if (view === "home") return "home";
  if (view === "input" || view === "viewer") return "studio";
  if (view === "library" || view === "search") return "library";
  if (view === "favorites") return "favorites";
  if (view === "stash") return "stash";
  if (view === "projects") return "projects";
  if (view === "community" || view === "community-detail" || view === "community-submit") return "community";
  if (view === "yarn-recs") return "yarn-recs";
  if (view === "settings") return "settings";
  return "home";
}

// Wicker basket icon for Projects
function BasketIcon({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={style} className={className}>
      <ellipse cx="10" cy="8" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 2 8 Q 2 16 10 16 Q 18 16 18 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="2.5" y1="13.5" x2="17.5" y2="13.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M 6 8 Q 10 2 14 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CrochetFlowerSmall({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {[0, 72, 144, 216, 288].map((angle) => {
        const r = (angle * Math.PI) / 180;
        const cx = 11 + Math.cos(r) * 5;
        const cy = 11 + Math.sin(r) * 5;
        return <ellipse key={angle} cx={cx} cy={cy} rx="4" ry="2.8"
          transform={`rotate(${angle},${cx},${cy})`} fill={color} fillOpacity="0.82" />;
      })}
      <circle cx="11" cy="11" r="3" fill={color} />
      <circle cx="11" cy="11" r="1.4" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

// Large decorative flower — top-right of sidebar, partially clipped
function LargeDecorativeFlower() {
  return (
    <div className="absolute pointer-events-none" style={{ top: 10, right: -12, zIndex: 0 }}>
      <svg viewBox="0 0 70 70" width="70" height="70">
        {[0, 72, 144, 216, 288].map((a) => {
          const rad = (a * Math.PI) / 180;
          const cx = 35 + Math.cos(rad) * 14;
          const cy = 35 + Math.sin(rad) * 14;
          return <ellipse key={a} cx={cx} cy={cy} rx="12" ry="8"
            transform={`rotate(${a},${cx},${cy})`}
            fill="#C24E6B" fillOpacity="0.5" />;
        })}
        <circle cx="35" cy="35" r="9" fill="#C24E6B" fillOpacity="0.65" />
        <circle cx="35" cy="35" r="4" fill="white" fillOpacity="0.45" />
        {/* Stitch dots on petals */}
        {[0, 72, 144, 216, 288].map((a) => {
          const rad = (a * Math.PI) / 180;
          const cx = 35 + Math.cos(rad) * 22;
          const cy = 35 + Math.sin(rad) * 22;
          return <circle key={a} cx={cx} cy={cy} r="1.5" fill="white" fillOpacity="0.5" />;
        })}
      </svg>
    </div>
  );
}

// Small decorative motif inside active pill
function ActivePillDecor() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" style={{ flexShrink: 0 }}>
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        const cx = 9 + Math.cos(rad) * 4.5;
        const cy = 9 + Math.sin(rad) * 4.5;
        return <circle key={a} cx={cx} cy={cy} r="1.6" fill="#C24E6B" fillOpacity="0.7" />;
      })}
      <circle cx="9" cy="9" r="2" fill="#C24E6B" fillOpacity="0.85" />
    </svg>
  );
}

const Sidebar: FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const activeId = resolveActiveId(activeView);
  const [streak] = useState(() => getStreak());

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full select-none"
      style={{
        width: 220,
        background: "hsl(var(--sidebar-background))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Large decorative flower — top-right, clipped by overflow:hidden */}
      <LargeDecorativeFlower />

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 relative z-10">
        <button
          onClick={() => onNavigate("home")}
          className="flex flex-col items-start leading-none focus:outline-none group"
        >
          <span
            className="font-script leading-tight group-hover:opacity-80 transition-opacity"
            style={{ fontSize: "1.75rem", color: "#A83050", fontWeight: 700 }}
          >
            Crochet
          </span>
          <span
            className="font-script leading-tight group-hover:opacity-80 transition-opacity"
            style={{ fontSize: "1.75rem", color: "#A83050", fontWeight: 700, marginTop: "-3px" }}
          >
            Time ♥
          </span>
        </button>
        <div className="mt-3 border-t border-dashed" style={{ borderColor: "rgba(140,90,50,0.25)" }} />
      </div>

      {/* ── Primary nav ──────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 pb-2 relative z-10">
        {PRIMARY_NAV.map((item) => {
          const active = activeId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.view)}
              className="flex items-center gap-3 py-2.5 text-sm font-semibold transition-all duration-150 focus:outline-none group"
              style={
                active
                  ? {
                      paddingLeft: 20,
                      paddingRight: 12,
                      marginLeft: -12,
                      borderRadius: "0 999px 999px 0",
                      background: "rgba(194,78,107,0.16)",
                      color: "#B04060",
                    }
                  : {
                      paddingLeft: 8,
                      paddingRight: 8,
                      borderRadius: 8,
                      color: "#6A4A38",
                    }
              }
            >
              <Icon
                className="flex-shrink-0 transition-colors"
                style={{ width: 18, height: 18, color: active ? "#B04060" : "#8A6A58" }}
              />
              <span className="flex-1" style={{ color: active ? "#B04060" : "#5C3A28" }}>{item.label}</span>
              {/* Small decorative motif inside active pill */}
              {active && item.id === "home" && <ActivePillDecor />}
            </button>
          );
        })}

        {/* Dashed separator */}
        <div className="my-2 border-t border-dashed" style={{ borderColor: "rgba(140,90,50,0.22)" }} />

        {SECONDARY_NAV.map((item) => {
          const active = activeId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.view)}
              className="flex items-center gap-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none"
              style={{
                paddingLeft: 8,
                paddingRight: 8,
                borderRadius: 8,
                color: active ? "#B04060" : "#7A5A48",
              }}
            >
              <Icon style={{ width: 17, height: 17, color: active ? "#B04060" : "#9A7A68", flexShrink: 0 }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Bottom section ───────────────────────────── */}
      <div className="px-4 pb-0 relative z-10">
        {/* Decorative flowers */}
        <div className="flex gap-1.5 mb-2">
          <CrochetFlowerSmall color="#C24E6B" />
          <CrochetFlowerSmall color="#84934F" />
          <CrochetFlowerSmall color="#7C5FA8" />
        </div>

        {/* Made with love label */}
        <div className="text-center mb-0">
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#9A7A68" }}>
            Made with love for
          </p>
          <p className="font-script text-xl leading-tight" style={{ color: palette.rose, fontWeight: 700 }}>
            {getActiveProfile().name}
          </p>
          <p className="text-xs" style={{ color: palette.rose }}>♡</p>
        </div>
      </div>

      {/* Amigurumi bee mascot */}
      <div className="flex justify-center relative z-10" style={{ marginTop: -4 }}>
        <img
          src="/characters/char-bee-transparent.png"
          alt="Bee"
          style={{ width: 88, height: 88, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(50,30,0,0.22))" }}
        />
      </div>

      {/* Streak chip */}
      <div
        className="mx-3 mb-3 rounded-xl px-3 py-2 text-center relative z-10"
        style={{
          background: streak.current > 0
            ? "linear-gradient(135deg, rgba(212,146,26,0.18), rgba(212,146,26,0.10))"
            : "linear-gradient(135deg, rgba(194,78,107,0.10), rgba(194,78,107,0.06))",
          border: streak.current > 0 ? "1px dashed rgba(212,146,26,0.45)" : "1px dashed rgba(194,78,107,0.35)",
        }}
      >
        {streak.current > 0 ? (
          <>
            <p className="text-[10px] font-bold" style={{ color: "#A06010" }}>
              🔥 {streak.current}-day streak!
            </p>
            <p className="text-[9.5px] leading-snug" style={{ color: "#9A7A68" }}>
              {streak.activeToday ? "Today counts ♡" : "Crochet today to keep it!"}
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] font-bold" style={{ color: "#B04060" }}>
              Start a streak ♡
            </p>
            <p className="text-[9.5px] leading-snug" style={{ color: "#9A7A68" }}>
              Crochet something today!
            </p>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
