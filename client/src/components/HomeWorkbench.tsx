import { palette } from "@/lib/theme";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ChevronRight } from "lucide-react";
import { Pattern, ViewType } from "@/lib/types";
import { PatternThumb } from "@/components/PatternThumb";
import { getStreak } from "@/lib/activityLog";
import { getActiveProfile } from "@/lib/profile";
import { greeting, getLastSeenCount, markCommunityRead } from "./home/helpers";
import { HeroZone } from "./home/HeroZone";
import { ContinueProjectCard, CreateWithYalaCard, FavoritesCard } from "./home/ActionCards";
import { RecentPatternsSection, CommunitySpotlightSection, UpcomingMilestoneSection, StatsBar } from "./home/BottomSections";

export { HomeRightPanel } from "./home/HomeRightPanel";

interface HomeWorkbenchProps {
  onNavigate: (view: ViewType) => void;
  onNavigateToPdf?: () => void;
  currentPattern?: Pattern | null;
  onPatternSelected?: (p: Pattern) => void;
  onResumeCounting?: (p: Pattern) => void;
}

export default function HomeWorkbench({ onNavigate, onNavigateToPdf, onPatternSelected, onResumeCounting }: HomeWorkbenchProps) {
  const { text, emoji } = greeting();

  const { data: patterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const { data: communityPatterns = [] } = useQuery<{ id: string }[]>({ queryKey: ["/api/community"] });

  const [streak] = useState(() => getStreak());
  const [lastSeenCount, setLastSeenCount] = useState(() => getLastSeenCount());
  const unreadCount = Math.max(0, communityPatterns.length - lastSeenCount);

  const handleBellClick = () => {
    markCommunityRead(communityPatterns.length);
    setLastSeenCount(communityPatterns.length);
    onNavigate("community");
  };

  const activePattern = patterns.find((p) => p.status === "active") ?? patterns.find((p) => p.status !== "finished") ?? patterns[0] ?? null;
  const { data: upNextData } = useQuery<{ patternId: string | null }>({ queryKey: ["/api/up-next"] });
  const upNextPattern =
    patterns.find((p) => p.id === upNextData?.patternId && p.status === "pattern" && p.id !== activePattern?.id) ?? null;
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
          <h1 className="font-heading font-bold" style={{ fontSize: 28, color: palette.ink, letterSpacing: "-0.02em" }}>
            {text},{" "}
            <span className="font-script" style={{ fontSize: 30, color: "#A83050" }}>{getActiveProfile().name}!</span>{" "}
            {emoji}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: palette.clay }}>
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
              style={{ background: "rgba(194,78,107,0.09)", color: palette.rose, border: "1px dashed rgba(194,78,107,0.3)" }}
            >
              ✨ Start a streak — crochet something today!
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate("library")}
            aria-label="Search patterns"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
            style={{ background: "rgba(255,252,245,0.8)", border: "1px solid rgba(140,100,55,0.2)" }}>
            <Search className="h-4 w-4" style={{ color: palette.clay }} />
          </button>
          <button
            onClick={handleBellClick}
            aria-label="Community notifications"
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
            style={{ background: "rgba(255,252,245,0.8)", border: "1px solid rgba(140,100,55,0.2)" }}>
            <Bell className="h-4 w-4" style={{ color: palette.clay }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: palette.rose }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
          {/* Avatar + chevron → switch profile */}
          <button onClick={() => onNavigate("profile-picker")} aria-label="Switch profile"
            className="flex items-center gap-1 cursor-pointer group">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-script text-lg"
              style={{ background: `linear-gradient(135deg, ${getActiveProfile().color}99, ${getActiveProfile().color})`,
                color: "white", fontWeight: 700, boxShadow: `0 2px 8px ${getActiveProfile().color}4D` }}>
              {getActiveProfile().name[0]}
            </div>
            <ChevronRight className="h-3.5 w-3.5 rotate-90 group-hover:opacity-70 transition-opacity" style={{ color: palette.clay }} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">

        {/* Hero zone */}
        <HeroZone />

        {/* Action cards — slight overlap on sm+, flush on mobile so characters don't clash */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 mt-3 sm:-mt-7">
          <div style={{ minHeight: 190 }}>
            <ContinueProjectCard pattern={activePattern} onNavigate={onNavigate} onResumeCounting={onResumeCounting} />
          </div>

          <div style={{ minHeight: 190 }}>
            <CreateWithYalaCard onNavigate={onNavigate} onNavigateToPdf={onNavigateToPdf} />
          </div>
          <div style={{ minHeight: 190 }}>
            <FavoritesCard count={favoritesCount} onNavigate={onNavigate} />
          </div>
        </div>

        {/* Stash quick access — materials are a first-class concept */}
        <div className="flex gap-2.5 mt-3 relative z-10">
          <button
            onClick={() => onNavigate("stash")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[12px] font-bold transition-all hover:opacity-85"
            style={{ background: "rgba(140,100,55,0.08)", color: "#7A5A48", border: "1.5px dashed rgba(140,100,55,0.3)" }}
          >
            🧺 My Stash
          </button>
          <button
            onClick={() => onNavigate("yarn-recs")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[12px] font-bold transition-all hover:opacity-85"
            style={{ background: "rgba(132,147,79,0.10)", color: palette.sage, border: "1.5px dashed rgba(132,147,79,0.35)" }}
          >
            ✨ Make From My Stash
          </button>
        </div>

        {/* Up next — the one pattern pinned to make after the current project */}
        {upNextPattern && (
          <button
            onClick={() => onPatternSelected?.(upNextPattern)}
            className="w-full mt-3 flex items-center gap-3 p-3 rounded-2xl text-left transition-all hover:shadow-md active:scale-[0.99]"
            style={{ background: "rgba(124,95,168,0.08)", border: "1.5px dashed rgba(124,95,168,0.35)" }}
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ containerType: "inline-size" }}>
              <PatternThumb image={upNextPattern.endProductImage} title={upNextPattern.title} projectType={upNextPattern.projectType} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "#7C5FA8" }}>⏭ Up next</p>
              <p className="font-heading font-bold text-[13.5px] truncate" style={{ color: palette.ink }}>{upNextPattern.title}</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#7C5FA8" }} />
          </button>
        )}

        {/* Active Projects — mobile main column (desktop has right panel) */}
        {activePattern && (
          <div className="block md:hidden mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-[15px]" style={{ color: palette.ink }}>Active Project</h3>
              <button onClick={() => onNavigate("library")}
                className="text-[11px] font-semibold" style={{ color: palette.clay }}>
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
                <p className="font-heading font-bold text-[14px] truncate" style={{ color: palette.ink }}>
                  {activePattern.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: palette.clay }}>
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
              <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: palette.clay }} />
            </div>
          </div>
        )}

        {/* Bottom sections — 3 col */}
        <div className={`grid grid-cols-1 ${recentPatterns.length ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4 mt-5 mb-4`}>
          {recentPatterns.length > 0 && (
            <RecentPatternsSection patterns={recentPatterns} onNavigate={onNavigate} />
          )}
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
