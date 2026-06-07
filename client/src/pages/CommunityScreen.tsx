import { useState } from "react";
import { Search, Heart, ChevronDown, Sparkles } from "lucide-react";
import { ViewType } from "../lib/types";

interface CommunityScreenProps {
  onNavigate: (view: ViewType) => void;
  onPatternSelect?: (id: string) => void;
}

interface CommunityPattern {
  id: string;
  title: string;
  creator: string;
  difficulty: "Easy" | "Intermediate" | "Advanced";
  diffColor: string;
  hearts: string;
  img: string;
  type: string;
}

const COMMUNITY_PATTERNS: CommunityPattern[] = [
  {
    id: "c1", title: "Granny Square Flower Blanket", creator: "Omm",
    difficulty: "Intermediate", diffColor: "#D4921A", hearts: "1.2k",
    img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80", type: "Home Decor",
  },
  {
    id: "c2", title: "Tiny Dragon", creator: "YarnDaries",
    difficulty: "Advanced", diffColor: "#C24E6B", hearts: "980",
    img: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&q=80", type: "Toy",
  },
  {
    id: "c3", title: "Bumblebee", creator: "HookedByHana",
    difficulty: "Easy", diffColor: "#84934F", hearts: "860",
    img: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=300&q=80", type: "Toy",
  },
  {
    id: "c4", title: "Ocean Turtle", creator: "StitchJoy",
    difficulty: "Intermediate", diffColor: "#D4921A", hearts: "1k",
    img: "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=300&q=80", type: "Toy",
  },
  {
    id: "c5", title: "Tulip Bouquet", creator: "CozyCrops",
    difficulty: "Easy", diffColor: "#84934F", hearts: "790",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80", type: "Home Decor",
  },
  {
    id: "c6", title: "Bear Backpack", creator: "KnottingArt",
    difficulty: "Intermediate", diffColor: "#D4921A", hearts: "950",
    img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80", type: "Accessory",
  },
  {
    id: "c7", title: "Daisy Bucket Hat", creator: "YarnLily",
    difficulty: "Easy", diffColor: "#84934F", hearts: "720",
    img: "https://images.unsplash.com/photo-1575029292585-6f3dd97b7b91?w=300&q=80", type: "Wearable",
  },
  {
    id: "c8", title: "Sunflower Coaster Set", creator: "CrochetLily",
    difficulty: "Easy", diffColor: "#84934F", hearts: "640",
    img: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=300&q=80", type: "Home Decor",
  },
  {
    id: "c9", title: "Sleepy Panda", creator: "WoolWhimsy",
    difficulty: "Intermediate", diffColor: "#D4921A", hearts: "1.1k",
    img: "https://images.unsplash.com/photo-1575029292585-6f3dd97b7b91?w=300&q=80", type: "Toy",
  },
];

const TYPE_FILTERS = ["All Types", "Toy", "Wearable", "Home Decor", "Accessory"];
const SKILL_FILTERS = ["All Skill Levels", "Easy", "Intermediate", "Advanced"];
const SORT_OPTIONS = ["Popular", "Most Recent", "Most Saves"];

export default function CommunityScreen({ onNavigate, onPatternSelect }: CommunityScreenProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [skillFilter, setSkillFilter] = useState("All Skill Levels");
  const [sort, setSort] = useState("Popular");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const filtered = COMMUNITY_PATTERNS.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.creator.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All Types" || p.type === typeFilter;
    const matchSkill = skillFilter === "All Skill Levels" || p.difficulty === skillFilter;
    return matchSearch && matchType && matchSkill;
  });

  const toggleLike = (id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading font-bold text-[20px]" style={{ color: "#3D2318" }}>
            Community Library
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
              {SORT_OPTIONS.map(o => <option key={o}>Sort: {o}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9A7868" }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => onNavigate("community-detail")}
              className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              style={{ background: "rgba(255,252,245,0.95)", boxShadow: "0 2px 12px rgba(80,40,10,0.10)", border: "1px solid rgba(140,100,55,0.12)" }}>
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80"; }} />
                {/* Difficulty badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: "rgba(255,252,245,0.92)", color: p.diffColor }}>
                  {p.difficulty}
                </div>
              </div>
              {/* Info */}
              <div className="px-2 pt-1.5 pb-2">
                <p className="font-heading font-bold text-[11px] leading-tight truncate" style={{ color: "#3D2318" }}>
                  {p.title}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "#9A7868" }}>
                  by {p.creator}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={e => { e.stopPropagation(); toggleLike(p.id); }}>
                    <Heart className={`h-3 w-3 ${liked.has(p.id) ? "fill-current" : ""}`}
                      style={{ color: "#C24E6B" }} />
                  </button>
                  <span className="text-[10px] font-semibold" style={{ color: "#C24E6B" }}>{p.hearts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-heading font-semibold text-[15px]" style={{ color: "#9A7868" }}>
              No patterns found
            </p>
            <p className="text-[13px] mt-1" style={{ color: "#B0908A" }}>Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
