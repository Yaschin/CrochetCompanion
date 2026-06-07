import { useState } from "react";
import { Heart, Search, MoreHorizontal, ChevronLeft } from "lucide-react";
import { ViewType } from "../lib/types";

interface FavoritesScreenProps {
  onNavigate: (view: ViewType) => void;
}

interface FavPattern {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  img: string;
}

const FAV_PATTERNS: FavPattern[] = [
  { id: "1", title: "Cuddle Bunny",       type: "Toy",       difficulty: "Interm.",  img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" },
  { id: "2", title: "Daisy Bucket Hat",   type: "Wearable",  difficulty: "Easy",     img: "https://images.unsplash.com/photo-1575029292585-6f3dd97b7b91?w=300&q=80" },
  { id: "3", title: "Sunflower Coaster",  type: "Home Decor",difficulty: "Easy",     img: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=300&q=80" },
  { id: "4", title: "Granny Square Bag",  type: "Accessory", difficulty: "Easy",     img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80" },
  { id: "5", title: "Sleepy Bear",        type: "Toy",       difficulty: "Easy",     img: "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=300&q=80" },
  { id: "6", title: "Pocket Dragon",      type: "Toy",       difficulty: "Advanced", img: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&q=80" },
];

export default function FavoritesScreen({ onNavigate }: FavoritesScreenProps) {
  const [favs, setFavs] = useState<Set<string>>(new Set(FAV_PATTERNS.map(p => p.id)));

  const toggle = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visible = FAV_PATTERNS.filter(p => favs.has(p.id));

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
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
          style={{ color: "#9A7868" }}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Grid */}
      <div className="px-4 pt-4">
        {visible.length === 0 ? (
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
            {visible.map(p => (
              <div key={p.id} className="relative rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,252,245,0.9)", boxShadow: "0 2px 12px rgba(80,40,10,0.10)", border: "1px solid rgba(140,100,55,0.12)" }}>
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img src={p.img} alt={p.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80"; }} />
                  {/* Heart button */}
                  <button
                    onClick={() => toggle(p.id)}
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
                  <p className="text-[10px] mt-0.5" style={{ color: "#9A7868" }}>
                    {p.type} · {p.difficulty}
                  </p>
                </div>
              </div>
            ))}
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
