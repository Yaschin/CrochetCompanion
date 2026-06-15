import { palette } from "@/lib/theme";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Check } from "lucide-react";
import { Pattern, StashItem } from "../lib/types";
import { matchedYarnsForPattern } from "../lib/stashMatch";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

interface StashDepletionSheetProps {
  pattern: Pattern;
  open: boolean;
  onClose: () => void;
}

/**
 * Offered when a project is finished: deduct the yarn you used up from your
 * stash. Manual + by count — you tick the skeins you actually finished and each
 * drops by one (removed at zero). Nothing changes unless you confirm, and if no
 * stash yarn matches the pattern it quietly dismisses rather than nagging.
 */
export default function StashDepletionSheet({ pattern, open, onClose }: StashDepletionSheetProps) {
  const { toast } = useToast();
  const { data: stash = [], isLoading } = useQuery<StashItem[]>({
    queryKey: ["/api/stash"],
    enabled: open,
  });
  const matched = useMemo(() => matchedYarnsForPattern(pattern, stash), [pattern, stash]);
  const [used, setUsed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Nothing matched (and the stash has loaded) → silently dismiss.
  useEffect(() => {
    if (open && !isLoading && matched.length === 0) onClose();
  }, [open, isLoading, matched.length, onClose]);

  if (!open || matched.length === 0) return null;

  const toggle = (id: string) => setUsed((u) => ({ ...u, [id]: !u[id] }));
  const selected = matched.filter((m) => used[m.id]);

  const apply = async () => {
    setSaving(true);
    try {
      for (const item of selected) {
        const nextQty = (item.quantity ?? 1) - 1;
        if (nextQty <= 0) {
          await apiRequest("DELETE", `/api/stash/${item.id}`);
        } else {
          await apiRequest("PUT", `/api/stash/${item.id}`, { ...item, quantity: nextQty });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/stash"] });
      toast({
        title: "Stash updated 🧶",
        description: `Took a skein off ${selected.length} yarn${selected.length === 1 ? "" : "s"}.`,
      });
      onClose();
    } catch {
      toast({ title: "Couldn't update your stash", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl px-5 pt-4 pb-[max(1.2rem,env(safe-area-inset-bottom))] shadow-2xl"
      style={{ background: palette.cream, borderTop: "1.5px solid rgba(140,100,55,0.2)", maxHeight: "70vh" }}
      role="dialog"
      aria-label="Update your stash"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-[15px]" style={{ color: palette.ink }}>Used up any yarn? 🧶</p>
          <p className="text-[11.5px] mt-0.5" style={{ color: palette.clay }}>
            Tick what you finished and I'll take a skein off your stash.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Not now"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:opacity-70"
          style={{ background: "rgba(140,100,55,0.08)", color: palette.clay }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "40vh" }}>
        {matched.map((item) => {
          const on = !!used[item.id];
          const qty = item.quantity ?? 1;
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              aria-pressed={on}
              className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
              style={on
                ? { background: "rgba(132,147,79,0.12)", border: "1.5px solid rgba(132,147,79,0.45)" }
                : { background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)" }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={on ? { background: palette.sage, color: "white" } : { border: "1.5px solid rgba(140,100,55,0.4)" }}
              >
                {on && <Check className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-[13px] truncate" style={{ color: palette.ink }}>
                  {item.name}{item.color ? ` · ${item.color}` : ""}
                </p>
                <p className="text-[11px]" style={{ color: palette.clay }}>
                  {qty} in stash → {Math.max(0, qty - 1)} after
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: "rgba(140,100,55,0.08)", color: palette.bark }}
        >
          Not now
        </button>
        <button
          onClick={apply}
          disabled={saving || selected.length === 0}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
          style={{ background: palette.sage, color: "white" }}
        >
          {saving ? "Updating…" : selected.length > 0 ? `Update stash (${selected.length})` : "Update stash"}
        </button>
      </div>
    </div>
  );
}
