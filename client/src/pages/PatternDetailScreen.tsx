import { useState } from "react";
import { ChevronLeft, Download, Copy, Heart, RefreshCw, Printer } from "lucide-react";
import { printPattern } from "../lib/printPattern";
import { motion } from "framer-motion";
import { Pattern, ViewType } from "../lib/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import StashCoverage from "../components/StashCoverage";
import PatternAdaptCard from "../components/PatternAdaptCard";

interface PatternDetailScreenProps {
  pattern: Pattern;
  onNavigate: (view: ViewType) => void;
  onOpenPattern?: (pattern: Pattern) => void;
}

export default function PatternDetailScreen({ pattern, onNavigate, onOpenPattern }: PatternDetailScreenProps) {
  const { toast } = useToast();
  const [showMore, setShowMore] = useState(false);
  const [isFav, setIsFav] = useState(pattern.favorite ?? false);

  const favMutation = useMutation({
    mutationFn: async (fav: boolean) => {
      const res = await apiRequest("PUT", `/api/patterns/${pattern.id}`, { favorite: fav });
      return res.json();
    },
    onSuccess: (_, fav) => {
      setIsFav(fav);
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      toast({ title: fav ? "Added to Favourites ❤️" : "Removed from Favourites" });
    },
    onError: (_, fav) => {
      setIsFav(!fav);
      toast({ title: "Couldn't update favourite", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleCopy = () => {
    const text = pattern.sections
      .map(s => `## ${s.name}\n` + s.steps.map(st => `${st.id}. ${st.text}`).join("\n"))
      .join("\n\n");
    navigator.clipboard.writeText(`# ${pattern.title}\n\n${text}`).then(() =>
      toast({ title: "Copied!", description: "Pattern copied to clipboard." })
    );
  };

  const handleDownload = () => {
    const chunks: string[] = [`# ${pattern.title}\n\nType: ${pattern.projectType}\nLevel: ${pattern.skillLevel}\n\n`];
    pattern.sections.forEach(s => {
      chunks.push(`## ${s.name}\n`);
      s.steps.forEach(st => chunks.push(`${st.id}. ${st.text}\n`));
      chunks.push("\n");
    });
    const blob = new Blob([chunks.join("")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pattern.title.replace(/\s+/g, "_")}_pattern.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  const desc = pattern.description || "A beautiful crochet pattern crafted with care.";
  const truncated = desc.length > 160 && !showMore;

  const tags = [
    { label: pattern.projectType,  color: "#C24E6B" },
    { label: pattern.skillLevel,   color: "#7C5FA8" },
    ...(pattern.yarnType ? [{ label: `🧶 ${pattern.yarnType}`, color: "#D4921A" }] : []),
    ...(pattern.size ? [{ label: `📐 ${pattern.size}`, color: "#3D8FA3" }] : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 no-scrollbar"
      style={{ background: "linear-gradient(160deg, #FFF8F0 0%, #FFEEF4 100%)" }}>

      {/* Back button */}
      <div className="sticky top-0 z-10 px-5 pt-5 pb-2"
        style={{ background: "linear-gradient(to bottom, rgba(255,248,240,0.97) 0%, transparent 100%)" }}>
        <button
          onClick={() => onNavigate("viewer")}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-all hover:opacity-75"
          style={{ background: "rgba(194,78,107,0.10)", color: "#C24E6B", border: "1px solid rgba(194,78,107,0.22)" }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to pattern
        </button>
      </div>

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="px-5 mt-2"
      >
        {pattern.endProductImage ? (
          <div className="relative rounded-3xl overflow-hidden"
            style={{ height: 260, boxShadow: "0 8px 40px rgba(194,78,107,0.18)" }}>
            <img src={pattern.endProductImage} alt={pattern.title}
              className="w-full h-full object-cover" />
            {/* Gradient overlay */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(61,35,24,0.5) 0%, transparent 60%)" }} />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="font-heading font-bold text-[22px] text-white leading-tight drop-shadow-md">
                {pattern.title}
              </h1>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl flex flex-col items-center justify-center gap-3"
            style={{ height: 220, background: "linear-gradient(135deg, rgba(194,78,107,0.1), rgba(124,95,168,0.1))",
              border: "1.5px dashed rgba(140,100,55,0.25)" }}>
            <span style={{ fontSize: 64 }}>🧶</span>
            <h1 className="font-heading font-bold text-[20px]" style={{ color: "#3D2318" }}>{pattern.title}</h1>
          </div>
        )}
      </motion.div>

      <div className="px-5 mt-4 flex flex-col gap-4">

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map(({ label, color }) => (
            <span key={label}
              className="px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
              {label}
            </span>
          ))}
        </div>

        {/* Description */}
        <div className="surface-card p-4">
          <p className="font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>About this pattern</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "#5C3A28" }}>
            {truncated ? desc.slice(0, 160) + "…" : desc}
          </p>
          {desc.length > 160 && (
            <button
              onClick={() => setShowMore(s => !s)}
              aria-expanded={showMore}
              className="text-[12px] font-semibold mt-2 transition-opacity hover:opacity-70"
              style={{ color: "#C24E6B" }}>
              {showMore ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sections", value: pattern.sections.filter(s => s.name.toLowerCase() !== "materials").length },
            { label: "Steps",    value: pattern.sections.reduce((acc, s) => acc + s.steps.length, 0) },
            { label: "Created",  value: new Date(pattern.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
          ].map(({ label, value }) => (
            <div key={label} className="surface-card p-3 text-center">
              <p className="font-heading font-bold text-[18px]" style={{ color: "#C24E6B" }}>{value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9A7868" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Can I make this? — real stash coverage */}
        <StashCoverage pattern={pattern} onOpenStash={() => onNavigate("stash")} />

        {/* Adapt: resize / swap yarn (AI) */}
        <PatternAdaptCard pattern={pattern} onOpenPattern={onOpenPattern} />

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)", color: "white",
              boxShadow: "0 6px 24px rgba(194,78,107,0.35)" }}>
            <Download className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            Download Pattern
          </button>

          <button
            onClick={() => printPattern(pattern)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "rgba(60,143,163,0.10)", color: "#3D8FA3",
              border: "1.5px solid rgba(60,143,163,0.25)" }}>
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "rgba(124,95,168,0.10)", color: "#7C5FA8",
              border: "1.5px solid rgba(124,95,168,0.25)" }}>
            <Copy className="h-4 w-4" />
            Copy Pattern Text
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => favMutation.mutate(!isFav)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-[13px] transition-all hover:opacity-90"
              style={{
                background: isFav ? "rgba(194,78,107,0.10)" : "rgba(140,100,55,0.08)",
                color: isFav ? "#C24E6B" : "#9A7868",
                border: `1.5px solid ${isFav ? "rgba(194,78,107,0.25)" : "rgba(140,100,55,0.2)"}`,
              }}>
              <Heart className="h-4 w-4" style={{ fill: isFav ? "#C24E6B" : "none" }} />
              {isFav ? "Favourited" : "Favourite"}
            </button>

            <button
              onClick={() => onNavigate("viewer")}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-[13px] transition-all hover:opacity-90"
              style={{ background: "rgba(132,147,79,0.10)", color: "#84934F",
                border: "1.5px solid rgba(132,147,79,0.25)" }}>
              <RefreshCw className="h-4 w-4" />
              Open Editor
            </button>
          </div>
        </div>

        {/* Yala tip */}
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-2"
          style={{ background: "rgba(124,95,168,0.07)", border: "1px dashed rgba(124,95,168,0.2)" }}>
          <img src="/characters/char-yala-transparent.png" alt="Yala"
            style={{ width: 40, height: 40, objectFit: "contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-[12px] italic leading-snug flex-1" style={{ color: "#7C5FA8" }}>
            "Take your time with each section — crochet is about the journey, not just the destination ✨"
          </p>
        </div>
      </div>
    </div>
  );
}
