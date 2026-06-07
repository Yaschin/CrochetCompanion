import { Heart } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pattern, ViewType } from "../lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FavoritesScreenProps {
  onNavigate: (view: ViewType) => void;
  onPatternSelected: (p: Pattern) => void;
}

export default function FavoritesScreen({ onNavigate, onPatternSelected }: FavoritesScreenProps) {
  const { toast } = useToast();
  const { data: patterns = [], isLoading } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });

  const favorites = patterns.filter((p) => p.favorite);

  const favoriteMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const res = await apiRequest("PUT", `/api/patterns/${id}`, { favorite });
      if (!res.ok) throw new Error("Failed to update favorite");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/patterns"] }),
    onError: () => toast({ title: "Could not update favorite", variant: "destructive" }),
  });

  const open = (p: Pattern) => {
    onPatternSelected(p);
    onNavigate("viewer");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <div className="flex items-center gap-2.5">
          <Heart className="h-5 w-5 fill-current" style={{ color: "#C24E6B" }} />
          <h1 className="font-heading font-bold text-[20px]" style={{ color: "#3D2318" }}>
            Larissa's Favorites
          </h1>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl aspect-square animate-pulse"
                style={{ background: "rgba(140,100,55,0.08)" }} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Heart className="h-12 w-12" style={{ color: "rgba(194,78,107,0.25)" }} />
            <p className="font-heading font-semibold text-[15px]" style={{ color: "#9A7868" }}>
              No favorites yet
            </p>
            <p className="text-[13px] text-center" style={{ color: "#B0908A" }}>
              Tap the ♥ on any pattern to save it here
            </p>
            <button onClick={() => onNavigate("library")}
              className="mt-2 px-5 py-2.5 rounded-full font-semibold text-[13px]"
              style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B", border: "1px solid rgba(194,78,107,0.25)" }}>
              Browse Library →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {favorites.map((p) => {
              const thumb = p.endProductImage && !p.endProductImage.startsWith("https://placehold") ? p.endProductImage : null;
              return (
                <div key={p.id} className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
                  onClick={() => open(p)}
                  style={{ background: "rgba(255,252,245,0.9)", boxShadow: "0 2px 12px rgba(80,40,10,0.10)", border: "1px solid rgba(140,100,55,0.12)" }}>
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #FBF1F4, #F5EAF0)" }}>
                        <span className="font-heading font-bold text-3xl" style={{ color: "#C24E6B", opacity: 0.25 }}>
                          {p.title[0]}
                        </span>
                      </div>
                    )}
                    {/* Heart button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); favoriteMutation.mutate({ id: p.id, favorite: false }); }}
                      aria-label="Remove from favorites"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,252,245,0.9)" }}>
                      <Heart className="h-3.5 w-3.5 fill-current" style={{ color: "#C24E6B" }} />
                    </button>
                  </div>
                  {/* Info */}
                  <div className="px-2 py-2">
                    <p className="font-heading font-bold text-[12px] leading-tight truncate" style={{ color: "#3D2318" }}>
                      {p.title}
                    </p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: "#9A7868" }}>
                      {p.projectType} · {p.skillLevel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Community browse CTA */}
        <div className="mt-6 rounded-2xl p-4 text-center"
          style={{ background: "rgba(194,78,107,0.06)", border: "1.5px dashed rgba(194,78,107,0.25)" }}>
          <p className="font-heading font-semibold text-[13px] mb-1" style={{ color: "#C24E6B" }}>
            Discover more patterns
          </p>
          <p className="text-[11.5px] mb-3" style={{ color: "#9A7868" }}>
            Browse the community library for inspiration
          </p>
          <button onClick={() => onNavigate("community")}
            className="px-5 py-2 rounded-full font-bold text-[12px]"
            style={{ background: "#C24E6B", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.35)" }}>
            Community Library →
          </button>
        </div>
      </div>
    </div>
  );
}
