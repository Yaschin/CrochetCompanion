import { palette } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { Check, X, ShoppingBag, Sparkles } from "lucide-react";
import { Pattern, StashItem } from "../lib/types";
import { analyzeStashCoverage } from "../lib/stashMatch";
import { useToast } from "../hooks/use-toast";

interface StashCoverageProps {
  pattern: Pattern;
  /** Inline pill version for cards/lists. */
  compact?: boolean;
  onOpenStash?: () => void;
}

/**
 * "Can I make this right now?" — compares the pattern's material requirements
 * against the real materials inventory (`/api/stash`).
 */
export default function StashCoverage({ pattern, compact, onOpenStash }: StashCoverageProps) {
  const { toast } = useToast();
  const { data: stash = [], isLoading } = useQuery<StashItem[]>({ queryKey: ["/api/stash"] });

  const copyShoppingList = async (missing: string[]) => {
    const text = `Shopping list for "${pattern.title}":\n${missing.map((m) => `• ${m}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Shopping list copied 🛍️", description: "Paste it into your notes or a message." });
    } catch {
      toast({ title: "Couldn't copy automatically", description: text, duration: 10000 });
    }
  };

  const coverage = analyzeStashCoverage(pattern, stash);

  // Nothing to compare against — don't render a misleading "ready" badge.
  if (coverage.totalCount === 0) return null;

  if (compact) {
    const ok = coverage.canMake;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{
          background: ok ? "rgba(132,147,79,0.14)" : "rgba(212,146,26,0.14)",
          color: ok ? "#6A7A3A" : "#A8761A",
        }}
        title={ok ? "You have the materials for this" : `Missing: ${coverage.missing.join(", ")}`}
      >
        {ok ? <Check className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
        {ok ? "Ready to make" : `Missing ${coverage.missing.length}`}
      </span>
    );
  }

  return (
    <div className="craft-card p-4" style={isLoading ? { opacity: 0.6 } : undefined}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: coverage.canMake ? palette.sage : "#D4921A" }} />
          <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
            {coverage.canMake ? "You can make this now! ♡" : "Almost there"}
          </p>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background: coverage.canMake ? "rgba(132,147,79,0.14)" : "rgba(212,146,26,0.14)",
            color: coverage.canMake ? "#6A7A3A" : "#A8761A",
          }}
        >
          {coverage.haveCount}/{coverage.totalCount} in stash
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {coverage.categories.map((cat) => (
          <div key={cat.category}>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: palette.clay }}>
              {cat.title}
            </p>
            <div className="flex flex-col gap-1">
              {cat.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[12.5px]">
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: item.have ? "rgba(132,147,79,0.18)" : "rgba(194,78,107,0.12)",
                      color: item.have ? "#6A7A3A" : palette.rose,
                    }}
                  >
                    {item.have ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                  </span>
                  <span style={{ color: item.have ? "#5C3A28" : palette.clay }}>
                    {item.label}
                    {item.have && item.matchedWith ? (
                      <span className="text-[10.5px]" style={{ color: palette.sage }}> — {item.matchedWith}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!coverage.canMake && (
        <div className="flex gap-2 mt-3">
          {onOpenStash && (
            <button
              onClick={onOpenStash}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
              style={{ background: "rgba(212,146,26,0.12)", color: "#A8761A", border: "1px dashed rgba(212,146,26,0.4)" }}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Check my stash
            </button>
          )}
          <button
            onClick={() => copyShoppingList(coverage.missing)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(194,78,107,0.10)", color: palette.rose, border: "1px dashed rgba(194,78,107,0.35)" }}
          >
            📋 Copy shopping list
          </button>
        </div>
      )}
    </div>
  );
}
