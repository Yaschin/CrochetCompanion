import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, SlidersHorizontal, ChevronLeft, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Pattern, ViewType } from "../lib/types";

interface SearchScreenProps {
  onNavigate: (view: ViewType) => void;
  onPatternSelected: (p: Pattern) => void;
}

const FILTER_CHIPS = [
  { id: "all",        label: "All",         color: "#C24E6B" },
  { id: "amigurumi",  label: "Amigurumi",   color: "#7C5FA8" },
  { id: "wearable",   label: "Wearable",    color: "#3D8FA3" },
  { id: "home",       label: "Home Decor",  color: "#84934F" },
  { id: "accessory",  label: "Accessories", color: "#D4921A" },
];

const SORT_OPTIONS = ["Newest", "Oldest", "A–Z", "Favorites"];

const RECENT_SEARCHES = ["amigurumi bear", "sunflower bag", "granny square", "ribbed hat"];

export default function SearchScreen({ onNavigate, onPatternSelected }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("Newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: patterns = [] } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });

  const filtered = patterns
    .filter((p) => {
      const matchesQuery = query === "" ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesFilter = activeFilter === "all" ||
        p.projectType.toLowerCase().includes(activeFilter.toLowerCase());
      return matchesQuery && matchesFilter;
    })
    .sort((a, b) => {
      if (activeSort === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (activeSort === "A–Z") return a.title.localeCompare(b.title);
      if (activeSort === "Favorites") return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest (default)
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => onNavigate("home")}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(194,78,107,0.08)", color: "#C24E6B" }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>
            Search & Filter
          </h1>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9A7868" }} />
          <input
            type="text"
            placeholder="Search patterns, types, skills…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl text-[13px] font-semibold outline-none transition-all"
            style={{
              background: "rgba(255,252,245,0.95)",
              border: "1.5px solid rgba(140,100,55,0.22)",
              color: "#3D2318",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70">
              <X className="h-4 w-4" style={{ color: "#9A7868" }} />
            </button>
          )}
        </div>

        {/* Filter chips + sort toggle row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={
                activeFilter === chip.id
                  ? { background: chip.color, color: "white", boxShadow: `0 2px 10px ${chip.color}55` }
                  : { background: "rgba(255,252,245,0.9)", color: "#7A5A48", border: "1px solid rgba(140,100,55,0.22)" }
              }
            >
              {chip.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all"
            style={{
              background: showFilters ? "#C24E6B" : "rgba(255,252,245,0.9)",
              color: showFilters ? "white" : "#9A7868",
              border: showFilters ? "none" : "1px solid rgba(140,100,55,0.22)",
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>

        {/* Advanced filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#9A7868" }}>
                  Sort by
                </p>
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setActiveSort(opt)}
                      className="px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all"
                      style={
                        activeSort === opt
                          ? { background: "#C24E6B", color: "white" }
                          : { background: "rgba(255,252,245,0.9)", color: "#7A5A48", border: "1px solid rgba(140,100,55,0.22)" }
                      }>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4">
        {/* Recent searches — shown when query is empty */}
        {!query && patterns.length === 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "#9A7868" }}>
              Try searching for
            </p>
            <div className="flex flex-wrap gap-2">
              {RECENT_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all hover:opacity-80"
                  style={{
                    background: "rgba(255,252,245,0.95)",
                    border: "1px solid rgba(140,100,55,0.22)",
                    color: "#5C3A28",
                  }}
                >
                  <Search className="h-3 w-3" style={{ color: "#9A7868" }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <p className="text-[12px] mb-3 font-semibold" style={{ color: "#9A7868" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <svg viewBox="0 0 64 64" width="52" height="52">
              <defs>
                <radialGradient id="srYarn" cx="36%" cy="32%" r="60%">
                  <stop offset="0%" stopColor="#F5D080" />
                  <stop offset="100%" stopColor="#C24E6B" stopOpacity="0.6" />
                </radialGradient>
                <clipPath id="srClip"><circle cx="32" cy="32" r="28"/></clipPath>
              </defs>
              <circle cx="32" cy="32" r="28" fill="url(#srYarn)" />
              <g clipPath="url(#srClip)">
                <ellipse cx="32" cy="32" rx="26" ry="9" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.4"/>
                <ellipse cx="32" cy="32" rx="26" ry="9" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.3" transform="rotate(50,32,32)"/>
                <ellipse cx="32" cy="32" rx="26" ry="9" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.25" transform="rotate(100,32,32)"/>
              </g>
            </svg>
            <p className="font-heading font-semibold text-[15px]" style={{ color: "#9A7868" }}>
              No patterns found
            </p>
            <p className="text-[12px] text-center" style={{ color: "#B0908A" }}>
              Try a different search or create a new pattern with Yala
            </p>
            <button onClick={() => onNavigate("input")}
              className="btn-craft btn-rose px-5 py-2 text-[12px] mt-1">
              Create with Yala →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { onPatternSelected(p); onNavigate("viewer"); }}
                className="craft-card text-left overflow-hidden group"
              >
                <div className="h-28 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #FBF1F4, #F5EAF0)" }}>
                  {p.endProductImage && !p.endProductImage.startsWith("https://placehold") ? (
                    <img src={p.endProductImage} alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-heading font-bold text-4xl" style={{ color: "#C24E6B", opacity: 0.25 }}>
                        {p.title[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-heading font-semibold text-[12px] leading-tight" style={{ color: "#3D2318" }}>
                    {p.title}
                  </p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: "#9A7868" }}>
                    {p.projectType} · {p.skillLevel}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B" }}>
                      {p.skillLevel}
                    </span>
                    {p.favorite && (
                      <Heart className="h-3.5 w-3.5" style={{ color: "#C24E6B" }} fill="#C24E6B" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
