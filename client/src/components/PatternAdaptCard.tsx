import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Maximize2, Repeat, Sparkles, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pattern } from "../lib/types";

interface PatternAdaptCardProps {
  pattern: Pattern;
  /** Open the freshly-created adapted pattern. */
  onOpenPattern?: (pattern: Pattern) => void;
}

/**
 * Phase 2 — adapt a pattern with AI: resize it, or swap the yarn weight.
 * Each adaptation creates a NEW pattern (the original is never overwritten).
 */
export default function PatternAdaptCard({ pattern, onOpenPattern }: PatternAdaptCardProps) {
  const { toast } = useToast();
  const [resizeText, setResizeText] = useState("");
  const [yarnText, setYarnText] = useState("");

  const mutation = useMutation({
    mutationFn: async ({ path, instruction }: { path: "resize" | "substitute"; instruction: string }) => {
      const res = await apiRequest("POST", `/api/patterns/${pattern.id}/${path}`, { instruction });
      return res.json() as Promise<Pattern>;
    },
    onSuccess: (created) => {
      toast({ title: "New pattern created ♡", description: `"${created.title}" was added to your library.` });
      onOpenPattern?.(created);
    },
    onError: (err) => {
      toast({
        title: "Couldn't adapt the pattern",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const pending = mutation.isPending;
  const pendingPath = (mutation.variables as { path?: string } | undefined)?.path;

  const quickResize = ["30% bigger", "Half size", "Double size"];

  return (
    <div className="craft-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4" style={{ color: "#7C5FA8" }} />
        <p className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>Adapt this pattern</p>
      </div>
      <p className="text-[11.5px] mb-3" style={{ color: "#9A7868" }}>
        Make a resized or different-yarn version — saved as a new pattern, the original stays put.
      </p>

      {/* Resize */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Maximize2 className="h-3.5 w-3.5" style={{ color: "#C24E6B" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#5C3A28" }}>Resize</span>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {quickResize.map((q) => (
            <button
              key={q}
              onClick={() => setResizeText(q)}
              className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(194,78,107,0.10)", color: "#C24E6B" }}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={resizeText}
            onChange={(e) => setResizeText(e.target.value)}
            placeholder="e.g. 30% bigger, or 'fit a 2-year-old'"
            className="flex-1 px-3 py-2 rounded-xl text-[12.5px] outline-none"
            style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.22)", color: "#3D2318" }}
          />
          <button
            onClick={() => resizeText.trim() && mutation.mutate({ path: "resize", instruction: resizeText.trim() })}
            disabled={pending || !resizeText.trim()}
            className="px-4 py-2 rounded-xl text-[12px] font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)" }}
          >
            {pending && pendingPath === "resize" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Maximize2 className="h-3.5 w-3.5" />}
            Resize
          </button>
        </div>
      </div>

      {/* Yarn substitution */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Repeat className="h-3.5 w-3.5" style={{ color: "#84934F" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#5C3A28" }}>Swap the yarn</span>
        </div>
        <div className="flex gap-2">
          <input
            value={yarnText}
            onChange={(e) => setYarnText(e.target.value)}
            placeholder="e.g. DK weight, or 'chunky acrylic'"
            className="flex-1 px-3 py-2 rounded-xl text-[12.5px] outline-none"
            style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.22)", color: "#3D2318" }}
          />
          <button
            onClick={() => yarnText.trim() && mutation.mutate({ path: "substitute", instruction: yarnText.trim() })}
            disabled={pending || !yarnText.trim()}
            className="px-4 py-2 rounded-xl text-[12px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "rgba(132,147,79,0.14)", color: "#6A7A3A", border: "1px solid rgba(132,147,79,0.3)" }}
          >
            {pending && pendingPath === "substitute" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat className="h-3.5 w-3.5" />}
            Swap
          </button>
        </div>
      </div>

      {pending && (
        <p className="text-[11px] mt-3 text-center" style={{ color: "#9A7868" }}>
          Adapting your pattern… this can take a few seconds ♡
        </p>
      )}
    </div>
  );
}
