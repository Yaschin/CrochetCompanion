import { useState } from "react";
import { ChevronLeft, ShoppingBag, Heart, Info } from "lucide-react";
import { motion } from "framer-motion";
import { ViewType } from "../lib/types";

interface YarnRecsScreenProps {
  onNavigate: (view: ViewType) => void;
}

interface YarnRec {
  id: string;
  name: string;
  brand: string;
  weight: string;
  fiber: string;
  colors: string[];
  colorNames: string[];
  price: string;
  rating: number;
  note: string;
  saved: boolean;
}

const YARN_RECS: YarnRec[] = [
  {
    id: "1",
    name: "Soft Merino DK",
    brand: "YarnBee",
    weight: "DK / 3",
    fiber: "100% Merino Wool",
    colors: ["#C24E6B", "#7C5FA8", "#84934F", "#D4921A", "#3D8FA3"],
    colorNames: ["Rose Petal", "Lilac Mist", "Sage Leaf", "Honey Gold", "Ocean Blue"],
    price: "$12.99 / 200g",
    rating: 4.8,
    note: "Sheep's top pick for amigurumi — silky soft and holds stitch definition beautifully.",
    saved: false,
  },
  {
    id: "2",
    name: "Chunky Cotton Blend",
    brand: "WoolWorks",
    weight: "Chunky / 5",
    fiber: "60% Cotton, 40% Acrylic",
    colors: ["#F0C840", "#E88050", "#C8A0D8", "#90C898", "#F0A0B8"],
    colorNames: ["Sunshine", "Peach Fuzz", "Lavender", "Mint", "Blush"],
    price: "$9.50 / 150g",
    rating: 4.5,
    note: "Great for home decor projects — machine washable and very durable.",
    saved: true,
  },
  {
    id: "3",
    name: "Fine Mohair Cloud",
    brand: "LuxeCraft",
    weight: "Lace / 0",
    fiber: "70% Mohair, 30% Silk",
    colors: ["#E8D0E0", "#D0C8F0", "#D0E8D8", "#F0E8D0"],
    colorNames: ["Petal Pink", "Iris", "Sage Cloud", "Cream"],
    price: "$18.00 / 25g",
    rating: 4.9,
    note: "Luxurious halo effect — perfect for wearables and accessories.",
    saved: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 12 12" width="12" height="12">
          <path d="M 6 1 L 7.2 4.4 H 11 L 8 6.6 L 9.2 10 L 6 7.8 L 2.8 10 L 4 6.6 L 1 4.4 H 4.8 Z"
            fill={star <= rating ? "#D4921A" : "rgba(180,150,80,0.2)"} />
        </svg>
      ))}
      <span className="text-[10px] font-semibold ml-1" style={{ color: "#9A7868" }}>{rating}</span>
    </div>
  );
}

export default function YarnRecsScreen({ onNavigate }: YarnRecsScreenProps) {
  const [saved, setSaved] = useState<Set<string>>(new Set(YARN_RECS.filter(y => y.saved).map(y => y.id)));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<Record<string, number>>({});

  const toggleSave = (id: string) => {
    setSaved(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => onNavigate("home")}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(132,147,79,0.08)", color: "#84934F" }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>
              Sheep's Yarn Picks
            </h1>
            <p className="text-[12px]" style={{ color: "#9A7868" }}>
              Curated for your next project ♡
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">

        {/* Sheep intro card — use original PNG with a soft sage background so it's never dark */}
        <div className="craft-card craft-card-sage p-4 flex items-center gap-4 overflow-hidden relative">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden"
            style={{ width: 80, height: 80, background: "rgba(132,147,79,0.12)" }}
          >
            <img
              src="/characters/char-sheep-transparent.png"
              alt="Sheep"
              style={{ width: 68, height: 68, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(80,40,10,0.15)) brightness(1.1)" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/characters/char-sheep.png";
              }}
            />
          </div>
          <div>
            <p className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>
              Sheep's Picks
            </p>
            <p className="text-[11.5px] leading-snug mt-0.5" style={{ color: "#6A8048" }}>
              I've found the coziest yarns for your next project — sorted by what works best for amigurumi!
            </p>
          </div>
        </div>

        {/* Yarn cards */}
        {YARN_RECS.map((yarn, i) => {
          const colorIdx = activeColor[yarn.id] ?? 0;
          const isExpanded = expandedId === yarn.id;

          return (
            <motion.div
              key={yarn.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="craft-card overflow-hidden"
            >
              {/* Color swatch bar — taller for better visibility */}
              <div className="h-4 flex" style={{ boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.06)" }}>
                {yarn.colors.map((c, ci) => (
                  <div key={ci} className="flex-1 transition-all"
                    style={{ background: c, opacity: ci === colorIdx ? 1 : 0.5 }} />
                ))}
              </div>

              <div className="p-4">
                {/* Name + save */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-heading font-bold text-[15px]" style={{ color: "#3D2318" }}>
                      {yarn.name}
                    </p>
                    <p className="text-[11px] font-semibold" style={{ color: "#9A7868" }}>
                      by {yarn.brand}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : yarn.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70"
                      style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868" }}>
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleSave(yarn.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-all"
                      style={{
                        background: saved.has(yarn.id) ? "rgba(194,78,107,0.12)" : "rgba(140,100,55,0.08)",
                        color: saved.has(yarn.id) ? "#C24E6B" : "#B0908A",
                      }}>
                      <Heart className="h-3.5 w-3.5" fill={saved.has(yarn.id) ? "#C24E6B" : "none"} />
                    </button>
                  </div>
                </div>

                {/* Color swatches row */}
                <div className="flex gap-2 mb-2.5">
                  {yarn.colors.map((c, ci) => (
                    <button
                      key={ci}
                      onClick={() => setActiveColor(prev => ({ ...prev, [yarn.id]: ci }))}
                      title={yarn.colorNames[ci]}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <div
                        className="rounded-full transition-all"
                        style={{
                          width: ci === colorIdx ? 22 : 18,
                          height: ci === colorIdx ? 22 : 18,
                          background: c,
                          border: ci === colorIdx ? `2.5px solid ${c}` : "1.5px solid rgba(255,255,255,0.5)",
                          boxShadow: ci === colorIdx ? `0 0 0 2px rgba(255,255,255,0.8), 0 2px 8px ${c}66` : "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Selected color name */}
                <p className="text-[10.5px] font-semibold mb-2.5" style={{ color: yarn.colors[colorIdx] }}>
                  {yarn.colorNames[colorIdx]}
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[yarn.weight, yarn.fiber].map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: "rgba(140,100,55,0.09)", color: "#7A5A48" }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Rating + price */}
                <div className="flex items-center justify-between">
                  <StarRating rating={yarn.rating} />
                  <span className="font-heading font-bold text-[13px]" style={{ color: "#3D2318" }}>
                    {yarn.price}
                  </span>
                </div>

                {/* Expanded note */}
                <motion.div
                  style={{ overflow: "hidden" }}
                  animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                >
                  {isExpanded && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px dashed rgba(140,100,55,0.22)" }}>
                      <p className="text-[11.5px] leading-relaxed italic" style={{ color: "#7A5A48" }}>
                        🐑 {yarn.note}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* CTA */}
                <button className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
                  style={{ background: "rgba(132,147,79,0.12)", color: "#84934F", border: "1px dashed rgba(132,147,79,0.4)" }}>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Find This Yarn
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
