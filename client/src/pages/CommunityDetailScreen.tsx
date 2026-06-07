import { useState } from "react";
import { ChevronLeft, Heart, Share2, Bookmark, Clock, Scissors } from "lucide-react";
import { ViewType } from "../lib/types";

interface CommunityDetailScreenProps {
  onNavigate: (view: ViewType) => void;
}

const PATTERN = {
  title: "Granny Square Flower Blanket",
  creator: "CrochetLily",
  tags: ["Intermediate", "Home Decor"],
  img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
  likes: "1.2k",
  saves: "942",
  timeEst: "6–8 hrs",
  yarn: "DK",
  description:
    "A cosy blanket made from classic granny squares with a floral center. The pattern includes step-by-step photo tutorials for joining and edging.",
  included: ["Written Pattern", "Photo Tutorial", "Colour Guide", "Yarn Suggestions"],
};

export default function CommunityDetailScreen({ onNavigate }: CommunityDetailScreenProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

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
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868" }}>
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={() => setLiked(l => !l)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: liked ? "rgba(194,78,107,0.12)" : "rgba(140,100,55,0.08)", color: "#C24E6B" }}>
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Hero + title */}
        <div className="flex gap-3">
          <div className="w-36 h-36 rounded-2xl overflow-hidden flex-shrink-0">
            <img src={PATTERN.img} alt={PATTERN.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <h1 className="font-heading font-bold text-[17px] leading-snug" style={{ color: "#3D2318" }}>
                {PATTERN.title}
              </h1>
              <p className="text-[12px] mt-0.5" style={{ color: "#9A7868" }}>
                by {PATTERN.creator}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PATTERN.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(140,100,55,0.1)", color: "#6B4B38" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Heart className="h-4 w-4" />, label: "Likes",    value: PATTERN.likes,   color: "#C24E6B" },
            { icon: <Bookmark className="h-4 w-4" />, label: "Saves",  value: PATTERN.saves,   color: "#7C5FA8" },
            { icon: <Clock className="h-4 w-4" />,   label: "Est.",    value: PATTERN.timeEst, color: "#D4921A" },
            { icon: <Scissors className="h-4 w-4" />,label: "Yarn",    value: PATTERN.yarn,    color: "#84934F" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-3 rounded-2xl"
              style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.12)" }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <p className="font-heading font-bold text-[14px]" style={{ color: "#3D2318" }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: "#9A7868" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.12)" }}>
          <p className="font-heading font-semibold text-[13px] mb-2" style={{ color: "#3D2318" }}>Description</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "#6B4B38" }}>{PATTERN.description}</p>
        </div>

        {/* What's Included */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.12)" }}>
          <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: "#3D2318" }}>What's Included</p>
          <div className="flex flex-col gap-2">
            {PATTERN.included.map(item => (
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

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pb-2">
          <button
            onClick={() => setSaved(s => !s)}
            className="py-3.5 rounded-2xl font-bold text-[14px] transition-all hover:opacity-85"
            style={{
              background: saved ? "rgba(132,147,79,0.15)" : "#84934F",
              color: saved ? "#84934F" : "white",
              border: saved ? "1.5px solid rgba(132,147,79,0.4)" : "none",
            }}>
            {saved ? "✓ Saved to Library" : "Add to Library"}
          </button>
          <button
            onClick={() => onNavigate("input")}
            className="py-3.5 rounded-2xl font-bold text-[14px] transition-all hover:opacity-85"
            style={{ background: "#C24E6B", color: "white", boxShadow: "0 4px 16px rgba(194,78,107,0.35)" }}>
            Make This Pattern
          </button>
        </div>
      </div>
    </div>
  );
}
