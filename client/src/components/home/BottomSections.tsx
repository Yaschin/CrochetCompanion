import { palette } from "@/lib/theme";
import { Pattern, ViewType } from "@/lib/types";
import { PatternThumb } from "@/components/PatternThumb";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Heart, Trophy } from "lucide-react";
import { FlowerDot } from "./decorations";

export function RecentPatternsSection({
  patterns, onNavigate,
}: { patterns: Pattern[]; onNavigate: (v: ViewType) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
          Recent Patterns
        </span>
        <button onClick={() => onNavigate("library")}
          className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ color: palette.rose }}>
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-2.5">
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
            <p className="text-[9.5px]" style={{ color: palette.clay }}>{p.projectType} · {p.skillLevel}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CommunitySpotlightSection({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  const { data: community = [] } = useQuery<{ id: string; title: string; creator: string; endProductImage?: string; likes: number }[]>({
    queryKey: ["/api/community"],
  });
  const top = [...community].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
          Community Spotlight
        </span>
        <button onClick={() => onNavigate("community")}
          className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ color: palette.rose }}>
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
          <p className="font-heading font-semibold text-[12px] leading-tight" style={{ color: palette.ink }}>
            {top ? top.title : "Explore the community gallery"}
          </p>
          <p className="text-[10.5px]" style={{ color: palette.clay }}>
            {top ? `by ${top.creator}` : "Share your patterns with others"}
          </p>
          {top && (
            <div className="flex items-center gap-1 mt-0.5">
              <Heart className="h-3 w-3 flex-shrink-0" style={{ color: palette.rose }} fill="#C24E6B" />
              <span className="text-[10.5px] font-semibold" style={{ color: palette.rose }}>{top.likes}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export function UpcomingMilestoneSection({ projectsCount, onNavigate }: { projectsCount: number; onNavigate: (v: ViewType) => void }) {
  const next = Math.ceil((projectsCount + 1) / 5) * 5;
  const need = next - projectsCount;
  const filled = 5 - need;

  return (
    <div>
      <div className="mb-2.5">
        <span className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
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
          <p className="font-heading font-semibold text-[12px]" style={{ color: palette.ink }}>You're close!</p>
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
        <ChevronRight className="flex-shrink-0 h-4 w-4" style={{ color: "#D4921A", opacity: 0.7 }} />
      </button>
    </div>
  );
}

export function StatsBar({
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
