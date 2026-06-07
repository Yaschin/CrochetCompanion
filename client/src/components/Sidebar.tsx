import { FC } from "react";
import {
  Home, Wand2, BookOpen, Heart, FolderOpen,
  Users, User, Settings,
} from "lucide-react";
import { ViewType } from "../lib/types";

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const PRIMARY_NAV: { id: string; view: ViewType; label: string; icon: typeof Home }[] = [
  { id: "home",     view: "home",    label: "Home",      icon: Home },
  { id: "studio",   view: "input",   label: "AI Studio", icon: Wand2 },
  { id: "library",  view: "library", label: "Library",   icon: BookOpen },
  { id: "favorites",view: "library", label: "Favorites", icon: Heart },
  { id: "projects", view: "library", label: "Projects",  icon: FolderOpen },
];

const SECONDARY_NAV: { id: string; view: ViewType; label: string; icon: typeof Home }[] = [
  { id: "community", view: "library", label: "Community Library", icon: Users },
  { id: "profile",   view: "home",    label: "My Profile",         icon: User },
  { id: "settings",  view: "home",    label: "Settings",           icon: Settings },
];

// Maps current activeView to which nav id should be highlighted
function resolveActiveId(view: ViewType): string {
  if (view === "home") return "home";
  if (view === "input" || view === "viewer") return "studio";
  if (view === "library") return "library";
  if (view === "stash") return "projects";
  return "home";
}

function BeeMascot() {
  return (
    <svg viewBox="0 0 80 92" fill="none" className="w-[72px] h-[82px] drop-shadow-sm">
      {/* Wings */}
      <ellipse cx="17" cy="44" rx="15" ry="9" fill="rgba(190,225,255,0.72)" transform="rotate(-25,17,44)" />
      <ellipse cx="63" cy="44" rx="15" ry="9" fill="rgba(190,225,255,0.72)" transform="rotate(25,63,44)" />
      <ellipse cx="17" cy="44" rx="15" ry="9" fill="none" stroke="rgba(120,170,210,0.4)" strokeWidth="0.8" transform="rotate(-25,17,44)" />
      <ellipse cx="63" cy="44" rx="15" ry="9" fill="none" stroke="rgba(120,170,210,0.4)" strokeWidth="0.8" transform="rotate(25,63,44)" />
      {/* Body */}
      <ellipse cx="40" cy="60" rx="21" ry="24" fill="#F0C840" />
      <rect x="19" y="52" width="42" height="7" rx="3.5" fill="rgba(45,25,5,0.65)" />
      <rect x="19" y="65" width="42" height="7" rx="3.5" fill="rgba(45,25,5,0.65)" />
      {/* Head */}
      <circle cx="40" cy="32" r="15" fill="#F0C840" />
      {/* Eyes */}
      <circle cx="35" cy="30" r="3.2" fill="#2D1905" />
      <circle cx="45" cy="30" r="3.2" fill="#2D1905" />
      <circle cx="36" cy="29" r="1.1" fill="white" />
      <circle cx="46" cy="29" r="1.1" fill="white" />
      {/* Smile */}
      <path d="M 34 37 Q 40 42 46 37" stroke="#2D1905" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Antennae */}
      <line x1="35" y1="18" x2="29" y2="7"  stroke="#2D1905" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="29" cy="6"  r="2.5" fill="#C24E6B" />
      <line x1="45" y1="18" x2="51" y2="7"  stroke="#2D1905" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="51" cy="6"  r="2.5" fill="#C24E6B" />
      {/* Crochet stitch dots on body */}
      <circle cx="32" cy="57" r="1.3" fill="rgba(255,255,255,0.45)" />
      <circle cx="40" cy="55" r="1.3" fill="rgba(255,255,255,0.45)" />
      <circle cx="48" cy="57" r="1.3" fill="rgba(255,255,255,0.45)" />
      <circle cx="36" cy="70" r="1.3" fill="rgba(255,255,255,0.45)" />
      <circle cx="44" cy="70" r="1.3" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

function CrochetFlowerSmall({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {[0,72,144,216,288].map((angle) => {
        const r = (angle * Math.PI) / 180;
        const cx = 11 + Math.cos(r) * 5;
        const cy = 11 + Math.sin(r) * 5;
        return <ellipse key={angle} cx={cx} cy={cy} rx="4" ry="2.8"
          transform={`rotate(${angle},${cx},${cy})`}
          fill={color} fillOpacity="0.8" />;
      })}
      <circle cx="11" cy="11" r="3" fill={color} />
      <circle cx="11" cy="11" r="1.4" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

const Sidebar: FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const activeId = resolveActiveId(activeView);

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
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => onNavigate("home")}
          className="flex flex-col items-start leading-none focus:outline-none group"
        >
          <span
            className="font-script leading-tight group-hover:opacity-80 transition-opacity"
            style={{ fontSize: "1.65rem", color: "#A83050", fontWeight: 700 }}
          >
            Crochet
          </span>
          <span
            className="font-script leading-tight group-hover:opacity-80 transition-opacity"
            style={{ fontSize: "1.65rem", color: "#A83050", fontWeight: 700, marginTop: "-2px" }}
          >
            Time ♥
          </span>
        </button>
        {/* Dashed divider */}
        <div className="mt-3 border-t border-dashed" style={{ borderColor: "rgba(140,90,50,0.25)" }} />
      </div>

      {/* ── Primary nav ──────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 pb-2">
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
                      paddingRight: 16,
                      marginLeft: -12,
                      borderRadius: "0 999px 999px 0",
                      background: "rgba(194,78,107,0.14)",
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
              <span style={{ color: active ? "#B04060" : "#5C3A28" }}>{item.label}</span>
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
      <div className="px-4 pb-0">
        {/* Decorative flowers */}
        <div className="flex gap-1.5 mb-2">
          <CrochetFlowerSmall color="#C24E6B" />
          <CrochetFlowerSmall color="#84934F" />
          <CrochetFlowerSmall color="#7C5FA8" />
        </div>

        {/* Made with love label */}
        <div className="text-center mb-1">
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#9A7A68" }}>
            Made with love for
          </p>
          <p className="font-script text-xl leading-tight" style={{ color: "#C24E6B", fontWeight: 700 }}>
            Larissa
          </p>
          <p className="text-xs" style={{ color: "#C24E6B" }}>♡</p>
        </div>
      </div>

      {/* Bee mascot — bottom, centered, slightly overlapping */}
      <div className="flex justify-center" style={{ marginTop: -4, paddingBottom: 0 }}>
        <BeeMascot />
      </div>

      {/* "You're on a roll" chip */}
      <div
        className="mx-3 mb-3 rounded-xl px-3 py-2 text-center"
        style={{
          background: "rgba(255,255,255,0.45)",
          border: "1px dashed rgba(194,78,107,0.3)",
        }}
      >
        <p className="text-[10px] font-bold" style={{ color: "#B04060" }}>
          You're on a roll!
        </p>
        <p className="text-[9.5px] leading-snug" style={{ color: "#9A7A68" }}>
          Keep going, your creativity is blooming. ♡
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
