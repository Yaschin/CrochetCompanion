import { ChevronLeft, Heart, Bookmark, Layers, ListChecks, Scissors } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pattern, ViewType } from "../lib/types";
import type { CommunityPattern } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QueryError } from "@/components/QueryError";

interface CommunityDetailScreenProps {
  onNavigate: (view: ViewType) => void;
  communityId: string | null;
  onPatternSelected: (p: Pattern) => void;
}

export default function CommunityDetailScreen({ onNavigate, communityId, onPatternSelected }: CommunityDetailScreenProps) {
  const makealongMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/makealongs", { communityId });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/makealongs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      toast({ title: "Make-along started! 🏁", description: "A copy is in your library — the family can join from the Community page." });
      onNavigate("community");
    },
    onError: (e) => toast({ title: "Couldn't start the make-along", description: e instanceof Error ? e.message : undefined, variant: "destructive" }),
  });

  const { toast } = useToast();

  const { data: pattern, isLoading, isError, refetch, isFetching } = useQuery<CommunityPattern>({
    queryKey: ["/api/community", communityId],
    enabled: !!communityId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/${communityId}/like`, {});
      if (!res.ok) throw new Error("like failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community", communityId] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
    },
    onError: () => toast({ title: "Could not like pattern", variant: "destructive" }),
  });

  // Import a community pattern into Larissa's library as a new, editable pattern.
  // `open` controls whether we jump straight into the viewer after importing.
  const importMutation = useMutation({
    mutationFn: async (_opts: { open: boolean }) => {
      if (!pattern) throw new Error("No pattern");
      const body = {
        title: pattern.title,
        projectType: pattern.projectType,
        skillLevel: pattern.skillLevel,
        description: pattern.description || "",
        endProductImage: pattern.endProductImage,
        yarnType: pattern.yarnType,
        size: pattern.size,
        sections: pattern.sections,
        yarnRequirements: pattern.yarnRequirements || [],
        hookRequirements: pattern.hookRequirements || [],
        notionsRequirements: pattern.notionsRequirements || [],
        toolRequirements: pattern.toolRequirements || [],
        needsStuffing: pattern.needsStuffing,
      };
      const res = await apiRequest("POST", "/api/patterns", body);
      if (!res.ok) throw new Error("import failed");
      return res.json();
    },
    onSuccess: (saved: Pattern, opts) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      if (opts.open) {
        onPatternSelected(saved);
      } else {
        toast({ title: "Added to your library", description: `"${saved.title}" is now in your patterns.` });
      }
    },
    onError: () => toast({ title: "Could not add pattern", variant: "destructive" }),
  });

  if (!communityId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="font-heading font-semibold text-[15px]" style={{ color: "#9A7868" }}>No pattern selected</p>
        <button onClick={() => onNavigate("community")} className="btn-craft btn-rose px-5 py-2.5">Back to Community →</button>
      </div>
    );
  }

  const totalSteps = pattern?.sections?.reduce((a, s) => a + s.steps.length, 0) ?? 0;
  const included = pattern
    ? [
        "Written Pattern",
        ...(pattern.endProductImage ? ["Project Photo"] : []),
        ...((pattern.yarnRequirements?.length ?? 0) > 0 ? ["Yarn Suggestions"] : []),
        ...((pattern.hookRequirements?.length ?? 0) > 0 ? ["Hook Guide"] : []),
      ]
    : [];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <button onClick={() => onNavigate("community")}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
          style={{ background: "rgba(140,100,55,0.08)", color: "#6B4B38" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-heading font-bold text-[16px] flex-1 truncate" style={{ color: "#3D2318" }}>
          Pattern Detail
        </span>
        <button onClick={() => likeMutation.mutate()}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
          style={{ background: "rgba(194,78,107,0.12)", color: "#C24E6B" }}>
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {isError ? (
        <QueryError
          onRetry={() => refetch()}
          isRetrying={isFetching}
          title="Couldn't load this pattern"
        />
      ) : isLoading || !pattern ? (
        <div className="px-4 pt-4 flex flex-col gap-4">
          <div className="h-36 rounded-2xl animate-pulse" style={{ background: "rgba(140,100,55,0.08)" }} />
          <div className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(140,100,55,0.08)" }} />
        </div>
      ) : (
        <div className="px-4 pt-4 flex flex-col gap-4">
          {/* Hero + title */}
          <div className="flex gap-3">
            <div className="w-36 h-36 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #FBF1F4, #F5EAF0)" }}>
              {pattern.endProductImage ? (
                <img src={pattern.endProductImage} alt={pattern.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-heading font-bold text-4xl" style={{ color: "#C24E6B", opacity: 0.3 }}>{pattern.title[0]}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <h1 className="font-heading font-bold text-[17px] leading-snug" style={{ color: "#3D2318" }}>
                  {pattern.title}
                </h1>
                <p className="text-[12px] mt-0.5" style={{ color: "#9A7868" }}>by {pattern.creator}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[pattern.skillLevel, pattern.projectType].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: "rgba(140,100,55,0.1)", color: "#6B4B38" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Heart className="h-4 w-4" />, label: "Likes", value: String(pattern.likes ?? 0), color: "#C24E6B" },
              { icon: <Layers className="h-4 w-4" />, label: "Parts", value: String(pattern.sections.length), color: "#7C5FA8" },
              { icon: <ListChecks className="h-4 w-4" />, label: "Steps", value: String(totalSteps), color: "#D4921A" },
              { icon: <Scissors className="h-4 w-4" />, label: "Yarn", value: pattern.yarnType || "—", color: "#84934F" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-3 rounded-2xl"
                style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.12)" }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <p className="font-heading font-bold text-[13px] truncate max-w-full px-1" style={{ color: "#3D2318" }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: "#9A7868" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {pattern.description && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.12)" }}>
              <p className="font-heading font-semibold text-[13px] mb-2" style={{ color: "#3D2318" }}>Description</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "#6B4B38" }}>{pattern.description}</p>
            </div>
          )}

          {/* What's Included */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.12)" }}>
            <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: "#3D2318" }}>What's Included</p>
            <div className="flex flex-col gap-2">
              {included.map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(132,147,79,0.15)" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#84934F" }} />
                  </div>
                  <span className="text-[13px]" style={{ color: "#6B4B38" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Family make-along: everyone makes it together */}
          <button
            onClick={() => makealongMutation.mutate()}
            disabled={makealongMutation.isPending}
            className="w-full py-3 rounded-2xl font-bold text-[13.5px] transition-all hover:opacity-85 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "rgba(124,95,168,0.12)", color: "#7C5FA8", border: "1.5px dashed rgba(124,95,168,0.45)" }}>
            🏁 {makealongMutation.isPending ? "Starting…" : "Start a family make-along"}
          </button>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pb-2">
            <button
              onClick={() => importMutation.mutate({ open: false })}
              disabled={importMutation.isPending}
              className="py-3.5 rounded-2xl font-bold text-[14px] transition-all hover:opacity-85 flex items-center justify-center gap-1.5"
              style={{ background: "rgba(132,147,79,0.15)", color: "#5F6B36", border: "1.5px solid rgba(132,147,79,0.4)" }}>
              <Bookmark className="h-4 w-4" /> Add to Library
            </button>
            <button
              onClick={() => importMutation.mutate({ open: true })}
              disabled={importMutation.isPending}
              className="py-3.5 rounded-2xl font-bold text-[14px] transition-all hover:opacity-85"
              style={{ background: "#C24E6B", color: "white", boxShadow: "0 4px 16px rgba(194,78,107,0.35)" }}>
              {importMutation.isPending ? "Adding…" : "Make This Pattern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
