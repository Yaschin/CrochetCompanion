import { profileById } from "@shared/profiles";
import { useState } from "react";
import { Search, Heart, ChevronDown, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pattern, ViewType } from "../lib/types";
import { useToast } from "@/hooks/use-toast";
import { getActiveProfile } from "../lib/profile";
import type { CommunityPattern } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PatternThumb } from "@/components/PatternThumb";
import { QueryError } from "@/components/QueryError";

interface CommunityScreenProps {
  onNavigate: (view: ViewType) => void;
  onPatternSelect?: (id: string) => void;
  onOpenPattern?: (p: Pattern) => void;
}

interface MakeAlongMember {
  profileId: string;
  name: string;
  color: string;
  patternId: string;
  pct: number;
  finished: boolean;
}

interface MakeAlong {
  id: string;
  title: string;
  communityId: string;
  createdAt: string;
  members: MakeAlongMember[];
}

const TYPE_FILTERS = ["All Types", "Toy", "Wearable", "Home Decor", "Accessory"];
const SKILL_FILTERS = ["All Skill Levels", "Easy", "Intermediate", "Advanced"];
const SORT_OPTIONS = ["Popular", "Most Recent"];

function diffColor(skill: string): string {
  const s = skill.toLowerCase();
  if (s.startsWith("adv")) return "#C24E6B";
  if (s.startsWith("int")) return "#D4921A";
  return "#84934F";
}

export default function CommunityScreen({ onNavigate, onPatternSelect, onOpenPattern }: CommunityScreenProps) {
  const { toast } = useToast();
  const myId = getActiveProfile().id;
  const { data: makealongsRaw } = useQuery<MakeAlong[]>({ queryKey: ["/api/makealongs"] });
  const makealongs = Array.isArray(makealongsRaw) ? makealongsRaw : [];

  const joinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/makealongs/${id}/join`, {});
      if (!res.ok) throw new Error("join failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/makealongs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      toast({ title: "You're in! 🏁", description: "A copy is now in your library — happy racing!" });
    },
    onError: () => toast({ title: "Couldn't join", variant: "destructive" }),
  });

  const openMyCopy = async (patternId: string) => {
    try {
      const res = await fetch(`/api/patterns/${patternId}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error();
      onOpenPattern?.(await res.json());
    } catch {
      toast({ title: "Couldn't open your copy", variant: "destructive" });
    }
  };
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [skillFilter, setSkillFilter] = useState("All Skill Levels");
  const [sort, setSort] = useState("Popular");

  const { data: patterns = [], isLoading, isError, refetch, isFetching } = useQuery<CommunityPattern[]>({ queryKey: ["/api/community"] });

  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/community/${id}/like`, {});
      if (!res.ok) throw new Error("like failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/community"] }),
  });

  const filtered = patterns
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.creator.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All Types" || p.projectType === typeFilter;
      const matchSkill = skillFilter === "All Skill Levels" || p.skillLevel === skillFilter;
      return matchSearch && matchType && matchSkill;
    })
    .sort((a, b) => (sort === "Most Recent"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (b.likes || 0) - (a.likes || 0)));

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading font-bold text-[20px]" style={{ color: "#3D2318" }}>
            Community
          </h1>
          <button onClick={() => onNavigate("community-submit")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={{ background: "#C24E6B", color: "white" }}>
            <Sparkles className="h-3.5 w-3.5" />
            Share Pattern
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#B0908A" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search community patterns..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.2)", color: "#3D2318" }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { value: typeFilter, options: TYPE_FILTERS, set: setTypeFilter },
            { value: skillFilter, options: SKILL_FILTERS, set: setSkillFilter },
          ].map((f, i) => (
            <div key={i} className="relative flex-shrink-0">
              <select
                value={f.value}
                onChange={e => f.set(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer outline-none"
                style={{
                  background: f.value.startsWith("All") ? "rgba(255,252,245,0.9)" : "rgba(194,78,107,0.1)",
                  color: f.value.startsWith("All") ? "#6B4B38" : "#C24E6B",
                  border: `1px solid ${f.value.startsWith("All") ? "rgba(140,100,55,0.25)" : "rgba(194,78,107,0.3)"}`,
                }}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9A7868" }} />
            </div>
          ))}
          <div className="relative flex-shrink-0">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer outline-none"
              style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.25)", color: "#6B4B38" }}>
              {SORT_OPTIONS.map(o => <option key={o} value={o}>Sort: {o}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9A7868" }} />
          </div>
        </div>
      </div>

      {/* Family make-alongs — the shared race board */}
      {makealongs.length > 0 && (
        <div className="px-4 pt-4">
          <h2 className="font-heading font-bold text-[14px] mb-2" style={{ color: "#3D2318" }}>
            🏁 Family make-alongs
          </h2>
          <div className="flex flex-col gap-3">
            {makealongs.map((ma) => {
              const mine = ma.members.find((m) => m.profileId === myId);
              return (
                <div key={ma.id} className="craft-card p-4">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="font-heading font-bold text-[13.5px] truncate" style={{ color: "#3D2318" }}>
                      {ma.title}
                    </p>
                    {mine ? (
                      <button
                        onClick={() => openMyCopy(mine.patternId)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold hover:opacity-85"
                        style={{ background: "#84934F", color: "white" }}>
                        Open my copy →
                      </button>
                    ) : (
                      <button
                        onClick={() => joinMutation.mutate(ma.id)}
                        disabled={joinMutation.isPending}
                        className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold hover:opacity-85 disabled:opacity-60"
                        style={{ background: "#7C5FA8", color: "white" }}>
                        {joinMutation.isPending ? "Joining…" : "Join in 🏁"}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {ma.members.map((m) => (
                      <div key={m.profileId} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: m.color }}>
                          {m.name[0]}
                        </span>
                        <span className="text-[11px] font-semibold w-14 truncate" style={{ color: "#5C3A28" }}>{m.name}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(140,100,55,0.12)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${m.finished ? 100 : m.pct}%`, background: m.color }} />
                        </div>
                        <span className="text-[10.5px] font-bold w-9 text-right" style={{ color: m.finished ? "#84934F" : "#9A7868" }}>
                          {m.finished ? "✓ 🏆" : `${m.pct}%`}
                        </span>
                      </div>
                    ))}
                    {ma.members.length === 0 && (
                      <p className="text-[11px]" style={{ color: "#9A7868" }}>Nobody has joined yet — be first!</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nudge: make-alongs are invisible until someone starts one — explain how */}
      {!isLoading && !isError && makealongs.length === 0 && patterns.length > 0 && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ background: "rgba(124,95,168,0.06)", border: "1px dashed rgba(124,95,168,0.30)" }}>
            <span className="text-[22px] shrink-0" aria-hidden>🏁</span>
            <div className="min-w-0">
              <p className="font-heading font-bold text-[12.5px]" style={{ color: "#3D2318" }}>
                Start a family make-along
              </p>
              <p className="text-[11px] leading-snug" style={{ color: "#7A5A48" }}>
                Open any pattern below and tap “Start a family make-along” — everyone makes the
                same one and races together on a shared board.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl aspect-square animate-pulse" style={{ background: "rgba(140,100,55,0.08)" }} />
            ))}
          </div>
        ) : isError ? (
          <QueryError onRetry={() => refetch()} isRetrying={isFetching} compact />
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => onPatternSelect?.(p.id)}
                className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ background: "rgba(255,252,245,0.95)", boxShadow: "0 2px 12px rgba(80,40,10,0.10)", border: "1px solid rgba(140,100,55,0.12)" }}>
                {/* Image */}
                <div className="relative aspect-square overflow-hidden" style={{ containerType: "inline-size" }}>
                  <PatternThumb image={p.endProductImage} title={p.title} projectType={p.projectType} />
                  {/* Difficulty badge */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: "rgba(255,252,245,0.92)", color: diffColor(p.skillLevel) }}>
                    {p.skillLevel}
                  </div>
                </div>
                {/* Info */}
                <div className="px-2 pt-1.5 pb-2">
                  <p className="font-heading font-bold text-[11px] leading-tight truncate" style={{ color: "#3D2318" }}>
                    {p.title}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate font-semibold"
                    style={{ color: p.creatorId ? profileById(p.creatorId).color : "#9A7868" }}>
                    by {p.creator}{p.creatorId ? " ♡" : ""}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={e => { e.stopPropagation(); likeMutation.mutate(p.id); }}>
                      <Heart className="h-3 w-3 fill-current" style={{ color: "#C24E6B" }} />
                    </button>
                    <span className="text-[10px] font-semibold" style={{ color: "#C24E6B" }}>{p.likes ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading font-semibold text-[15px]" style={{ color: "#9A7868" }}>
              No patterns found
            </p>
            <p className="text-[13px] mt-1" style={{ color: "#B0908A" }}>Try a different search or share your own!</p>
          </div>
        )}
      </div>
    </div>
  );
}
