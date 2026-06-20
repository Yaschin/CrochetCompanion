import { palette } from "@/lib/theme";
// Beautiful themed thumbnail for pattern cards.
// Shows a real image if available; falls back to a gradient card styled by project type.
// Uses React state so broken URLs gracefully show the themed placeholder.

import { useState } from "react";

const TYPE_THEMES: Record<string, { gradient: string; color: string; emoji: string }> = {
  "Toy":        { gradient: "linear-gradient(145deg, #FBF1F4 0%, #EFC1D2 100%)", color: palette.rose, emoji: "🧸" },
  "Wearable":   { gradient: "linear-gradient(145deg, #F3EEFB 0%, #D8C7F0 100%)", color: palette.purple, emoji: "🧥" },
  "Home Decor": { gradient: "linear-gradient(145deg, #EEF5E8 0%, #C5DBA5 100%)", color: "#5A7A35", emoji: "🏡" },
  "Accessory":  { gradient: "linear-gradient(145deg, #FDF5E3 0%, #F4DFA4 100%)", color: "#B97210", emoji: "👜" },
};

function getTheme(projectType?: string) {
  if (!projectType) return { gradient: "linear-gradient(145deg, #FBF1F4 0%, #EAE0D8 100%)", color: palette.clay, emoji: "🧶" };
  const key = Object.keys(TYPE_THEMES).find((k) =>
    projectType.toLowerCase().includes(k.toLowerCase()),
  );
  return key
    ? TYPE_THEMES[key]
    : { gradient: "linear-gradient(145deg, #FBF1F4 0%, #EAE0D8 100%)", color: palette.clay, emoji: "🧶" };
}

interface PatternThumbProps {
  image?: string | null;
  title: string;
  projectType?: string;
  className?: string;
}

export function PatternThumb({ image, title, projectType, className = "" }: PatternThumbProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const isReal = !!image && !image.includes("placehold") && !imgFailed;
  const theme = getTheme(projectType);

  if (isReal) {
    return (
      <img
        src={image!}
        alt={title}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center select-none ${className}`}
      style={{ background: theme.gradient }}
    >
      <span
        className="leading-none mb-1.5"
        style={{ fontSize: "clamp(1.4rem, 6cqw, 2.4rem)" }}
        aria-hidden
      >
        {theme.emoji}
      </span>
      <span
        className="font-heading font-semibold text-center px-2 leading-tight"
        style={{
          color: theme.color,
          opacity: 0.72,
          fontSize: "clamp(0.5rem, 2cqw, 0.7rem)",
          maxWidth: "90%",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {title}
      </span>
    </div>
  );
}

export default PatternThumb;
