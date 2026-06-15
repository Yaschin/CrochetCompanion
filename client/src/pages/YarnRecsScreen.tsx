import { palette } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Check, ShoppingBag, Sparkles, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Pattern, StashItem, ViewType } from "../lib/types";
import { rankByStash, RankedPattern } from "../lib/stashMatch";
import { PatternThumb } from "@/components/PatternThumb";
import { QueryError } from "@/components/QueryError";

interface YarnRecsScreenProps {
  onNavigate: (view: ViewType) => void;
  onPatternSelected?: (pattern: Pattern) => void;
}

function PatternRow({ rp, onClick }: { rp: RankedPattern; onClick?: () => void }) {
  const { pattern, coverage } = rp;
  const ok = coverage.canMake;
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="craft-card p-3.5 flex items-center gap-3 text-left w-full transition-all hover:opacity-90"
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden"
        style={{ containerType: "inline-size" }}
      >
        <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-[14px] truncate" style={{ color: palette.ink }}>
          {pattern.title}
        </p>
        <p className="text-[11px] truncate" style={{ color: palette.clay }}>
          {pattern.projectType} · {pattern.skillLevel}
        </p>
      </div>
      <span
        className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold"
        style={{
          background: ok ? "rgba(132,147,79,0.14)" : "rgba(212,146,26,0.14)",
          color: ok ? "#6A7A3A" : "#A8761A",
        }}
      >
        {ok ? <Check className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
        {ok ? "Ready" : `Missing ${coverage.missing.length}`}
      </span>
    </motion.button>
  );
}

export default function YarnRecsScreen({ onNavigate, onPatternSelected }: YarnRecsScreenProps) {
  const { data: patterns = [], isLoading: loadingPatterns, isError: errPatterns, refetch: refetchPatterns, isFetching: fetchingPatterns } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const { data: stash = [], isLoading: loadingStash, isError: errStash, refetch: refetchStash, isFetching: fetchingStash } = useQuery<StashItem[]>({ queryKey: ["/api/stash"] });
  const isError = errPatterns || errStash;

  const ranked = rankByStash(patterns, stash);
  const ready = ranked.filter((r) => r.coverage.canMake && r.coverage.totalCount > 0);
  const almost = ranked.filter((r) => !r.coverage.canMake && r.coverage.missing.length <= 3);

  const yarnCount = stash.filter((s) => s.type === "yarn").length;
  const hookCount = stash.filter((s) => s.type === "hook").length;
  const otherCount = stash.filter((s) => s.type === "notion" || s.type === "tool").length;

  const isLoading = loadingPatterns || loadingStash;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => onNavigate("home")}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(132,147,79,0.08)", color: palette.sage }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>
              Make From My Stash
            </h1>
            <p className="text-[12px]" style={{ color: palette.clay }}>
              Patterns you can make with what you already have ♡
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">
        {/* Sheep intro + stash summary */}
        <div className="craft-card craft-card-sage p-4 flex items-center gap-4 overflow-hidden relative">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden"
            style={{ width: 72, height: 72, background: "rgba(132,147,79,0.12)" }}
          >
            <img
              src="/characters/char-sheep-transparent.png"
              alt="Sheep"
              style={{ width: 60, height: 60, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(80,40,10,0.15)) brightness(1.1)" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/characters/char-sheep.png"; }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-[13px]" style={{ color: palette.ink }}>Sheep's stash check</p>
            <p className="text-[11.5px] leading-snug mt-0.5" style={{ color: "#6A8048" }}>
              You have <b>{yarnCount}</b> yarn{yarnCount === 1 ? "" : "s"}, <b>{hookCount}</b> hook{hookCount === 1 ? "" : "s"}
              {otherCount ? <> and <b>{otherCount}</b> other item{otherCount === 1 ? "" : "s"}</> : null}. Let me find what you can make!
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="craft-card p-3.5 flex items-center gap-3 animate-pulse">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl" style={{ background: "rgba(140,100,55,0.12)" }} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3.5 rounded-full w-3/4" style={{ background: "rgba(140,100,55,0.10)" }} />
                  <div className="h-2.5 rounded-full w-1/2" style={{ background: "rgba(140,100,55,0.07)" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Couldn't reach the server */}
        {!isLoading && isError && (
          <QueryError
            onRetry={() => { refetchPatterns(); refetchStash(); }}
            isRetrying={fetchingPatterns || fetchingStash}
            compact
          />
        )}

        {/* Empty: no stash yet */}
        {!isLoading && !isError && stash.length === 0 && (
          <div className="craft-card p-6 flex flex-col items-center text-center gap-3">
            <ShoppingBag className="h-7 w-7" style={{ color: palette.sage }} />
            <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>Your stash is empty</p>
            <p className="text-[12px]" style={{ color: palette.clay }}>Add the yarn and hooks you own and I'll show you what you can make.</p>
            <button onClick={() => onNavigate("stash")} className="btn-craft btn-sage px-5 py-2.5 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add materials
            </button>
          </div>
        )}

        {/* Ready to make now */}
        {ready.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" style={{ color: palette.sage }} />
              <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
                Ready to make now ({ready.length})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {ready.map((rp) => (
                <PatternRow key={rp.pattern.id} rp={rp} onClick={() => onPatternSelected?.(rp.pattern)} />
              ))}
            </div>
          </div>
        )}

        {/* Almost — just a couple of items short */}
        {almost.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4" style={{ color: "#A8761A" }} />
              <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
                Almost there ({almost.length})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {almost.map((rp) => (
                <PatternRow key={rp.pattern.id} rp={rp} onClick={() => onPatternSelected?.(rp.pattern)} />
              ))}
            </div>
          </div>
        )}

        {/* Nothing matched but stash + patterns exist */}
        {!isLoading && stash.length > 0 && ready.length === 0 && almost.length === 0 && (
          <div className="craft-card p-6 flex flex-col items-center text-center gap-3">
            <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
              Nothing's a close match yet
            </p>
            <p className="text-[12px]" style={{ color: palette.clay }}>
              {patterns.length === 0
                ? "Create a pattern first, then I can match it to your stash."
                : "Add more yarn or hooks, or create a pattern that fits what you have."}
            </p>
            <button onClick={() => onNavigate(patterns.length === 0 ? "input" : "stash")} className="btn-craft btn-sage px-5 py-2.5">
              {patterns.length === 0 ? "Create a pattern" : "Add materials"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
