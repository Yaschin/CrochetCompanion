import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Edit3, Heart, Package, Share2, Loader2, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ViewType } from "../lib/types";

interface HomeWorkbenchProps {
  onNavigate: (view: ViewType) => void;
}

const CHARACTERS = [
  {
    id: "aloo",
    name: "Aloo",
    role: "Your project companion",
    description: "Helps you track progress, save your place and celebrate every stitch.",
    color: "#C24E6B",
    lightColor: "#FBF1F4",
    midColor: "#F0CACF",
    size: "lg",
    delay: 0.1,
  },
  {
    id: "yala",
    name: "Yala",
    role: "Your creative guide",
    description: "Guides AI creation, editing and pattern refinement. Helps ideas come to life.",
    color: "#7C5FA8",
    lightColor: "#F5F0FB",
    midColor: "#D9CAEE",
    size: "xl",
    delay: 0.2,
  },
  {
    id: "ashi",
    name: "Ashi",
    role: "Your community explorer",
    description: "Helps you discover patterns and share your creations with the world.",
    color: "#3D8FA3",
    lightColor: "#EEF7FA",
    midColor: "#C0DDE5",
    size: "lg",
    delay: 0.3,
  },
  {
    id: "bee",
    name: "Bee",
    role: "Your celebration friend",
    description: "Celebrates milestones, completions and all your wins.",
    color: "#D4921A",
    lightColor: "#FDF6E3",
    midColor: "#F0D499",
    size: "md",
    delay: 0.4,
  },
  {
    id: "sheep",
    name: "Sheep",
    role: "Your yarn expert",
    description: "Suggests yarns, colours and materials to make every project perfect.",
    color: "#84934F",
    lightColor: "#F5F7EF",
    midColor: "#D4DCAA",
    size: "md",
    delay: 0.5,
  },
];

const ACTIONS = [
  { icon: Sparkles, label: "Create", description: "Bring ideas to life", view: "input" as ViewType },
  { icon: Edit3, label: "Refine", description: "Edit, lock and improve", view: "library" as ViewType },
  { icon: Heart, label: "Save", description: "Organise your favourites", view: "library" as ViewType },
  { icon: Package, label: "Make", description: "Start with confidence", view: "input" as ViewType },
  { icon: Share2, label: "Share", description: "Inspire and be inspired", view: "library" as ViewType },
];

const sizeMap = {
  xl: { width: 155, height: 195 },
  lg: { width: 138, height: 175 },
  md: { width: 118, height: 152 },
};

function CrochetFlower({ x, y, color, size = 28, rotate = 0 }: {
  x: number; y: number; color: string; size?: number; rotate?: number;
}) {
  const r = size / 2;
  const pr = r * 0.42;
  const petals = 5;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i / petals) * 360;
        const rad = (angle * Math.PI) / 180;
        const cx = Math.cos(rad) * pr;
        const cy = Math.sin(rad) * pr;
        return (
          <ellipse key={i} cx={cx} cy={cy} rx={r * 0.38} ry={r * 0.26}
            transform={`rotate(${angle}, ${cx}, ${cy})`}
            fill={color} fillOpacity="0.75" />
        );
      })}
      <circle cx={0} cy={0} r={r * 0.25} fill={color} fillOpacity="0.95" />
      <circle cx={0} cy={0} r={r * 0.12} fill="white" fillOpacity="0.6" />
    </g>
  );
}

function YarnBasket() {
  return (
    <svg width="110" height="95" viewBox="0 0 120 100" fill="none">
      <ellipse cx="60" cy="72" rx="48" ry="22" fill="#C4A882" fillOpacity="0.5" />
      <path d="M12 55 Q60 75 108 55 L104 72 Q60 92 16 72 Z" fill="#C4A882" fillOpacity="0.7" />
      <path d="M16 45 Q60 65 104 45 Q60 35 16 45Z" fill="#D4BC9A" fillOpacity="0.8" />
      <ellipse cx="60" cy="45" rx="44" ry="16" fill="#D4BC9A" fillOpacity="0.6" />
      <circle cx="44" cy="52" r="9" fill="#C24E6B" fillOpacity="0.7" />
      <circle cx="44" cy="52" r="6" fill="#D97A90" fillOpacity="0.5" />
      <circle cx="62" cy="48" r="8" fill="#84934F" fillOpacity="0.7" />
      <circle cx="62" cy="48" r="5" fill="#A8B87A" fillOpacity="0.5" />
      <circle cx="78" cy="50" r="7" fill="#7C5FA8" fillOpacity="0.7" />
      <circle cx="78" cy="50" r="4.5" fill="#A898CC" fillOpacity="0.5" />
      <path d="M56 12 Q80 8 104 28" stroke="#C24E6B" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function CharacterPortrait({
  character,
  imageUrl,
  isGenerating,
}: {
  character: typeof CHARACTERS[0];
  imageUrl: string | null;
  isGenerating: boolean;
}) {
  const { width, height } = sizeMap[character.size as keyof typeof sizeMap];
  const borderRadius = "50% 50% 46% 46% / 54% 54% 46% 46%";

  return (
    <motion.div
      animate={{ y: [0, -7, 0] }}
      transition={{
        duration: 3.8 + character.delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay: character.delay * 0.4,
      }}
      style={{ width, height }}
      className="relative flex-shrink-0"
    >
      <div
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          borderRadius,
          background: imageUrl
            ? undefined
            : `radial-gradient(ellipse at 40% 30%, white 0%, ${character.lightColor} 30%, ${character.midColor} 70%, ${character.color}44 100%)`,
          border: `2.5px solid ${character.color}50`,
          boxShadow: `0 16px 48px ${character.color}28, 0 4px 12px ${character.color}18, inset 0 1px 0 rgba(255,255,255,0.7)`,
        }}
      >
        <AnimatePresence mode="wait">
          {imageUrl ? (
            <motion.img
              key="photo"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              src={imageUrl}
              alt={character.name}
              className="w-full h-full object-cover"
              style={{ borderRadius }}
            />
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Loader2
                className="animate-spin"
                style={{ color: character.color, width: 28, height: 28 }}
              />
              <span className="text-xs font-medium" style={{ color: character.color }}>
                Creating…
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              {/* Stitch texture */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 60 60">
                <defs>
                  <pattern id={`stitch-${character.id}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="2.5" fill={character.color} />
                    <circle cx="0" cy="0" r="1" fill={character.color} />
                    <circle cx="8" cy="0" r="1" fill={character.color} />
                    <circle cx="0" cy="8" r="1" fill={character.color} />
                    <circle cx="8" cy="8" r="1" fill={character.color} />
                  </pattern>
                </defs>
                <rect width="60" height="60" fill={`url(#stitch-${character.id})`} />
              </svg>
              <span
                className="relative z-10 font-heading font-bold select-none leading-none"
                style={{
                  fontSize: character.size === "xl" ? 68 : character.size === "lg" ? 60 : 50,
                  color: character.color,
                  opacity: 0.2,
                  letterSpacing: "-0.04em",
                }}
              >
                {character.name[0]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name tag — only on placeholder */}
        {!imageUrl && !isGenerating && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
            <span
              className="px-3 py-0.5 text-xs font-semibold rounded-full"
              style={{
                background: `${character.color}22`,
                color: character.color,
                border: `1px solid ${character.color}44`,
              }}
            >
              {character.name}
            </span>
          </div>
        )}

        {/* Sheen */}
        {!imageUrl && (
          <div className="absolute top-0 left-0 right-0 h-2/5 rounded-t-full opacity-40 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.55), transparent)" }} />
        )}
      </div>
    </motion.div>
  );
}

function YarnTrailSVG() {
  return (
    <svg
      className="absolute bottom-6 left-0 right-0 w-full pointer-events-none"
      height="32"
      viewBox="0 0 900 32"
      preserveAspectRatio="none"
    >
      <path
        d="M 60 20 C 100 8, 140 28, 200 18 C 260 8, 300 26, 370 16 C 430 8, 480 24, 540 16 C 600 8, 650 26, 720 18 C 770 12, 820 24, 860 16"
        stroke="#C24E6B"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
        strokeDasharray="6 4"
      />
      <circle cx="840" cy="17" r="5" fill="#C24E6B" fillOpacity="0.4" />
    </svg>
  );
}

function StitchedLabelTag() {
  return (
    <div className="relative inline-flex flex-col items-center gap-0.5 px-4 py-3 rounded-sm"
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1.5px dashed #C4A88255",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-gray-400">
        Handmade with care
      </span>
      <div className="h-px w-10 bg-gray-200 my-0.5" />
      <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-400">
        Built for
      </span>
      <span
        className="text-lg leading-tight"
        style={{ fontFamily: "'Dancing Script', cursive", color: "#C24E6B", fontWeight: 700 }}
      >
        Larissa
      </span>
      <Heart className="h-3 w-3 text-rose-300 mt-0.5" fill="currentColor" />
    </div>
  );
}

function CharacterInfoCard({ character, index }: { character: typeof CHARACTERS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 + index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center px-4 py-4 rounded-2xl flex-1 min-w-[140px] max-w-[180px]"
      style={{
        background: `${character.lightColor}ee`,
        border: `1.5px solid ${character.color}30`,
        boxShadow: `0 2px 12px ${character.color}12`,
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center mb-2 flex-shrink-0"
        style={{ background: `${character.color}18`, border: `1.5px solid ${character.color}35` }}
      >
        <span className="text-base font-bold font-heading" style={{ color: character.color }}>
          {character.name[0]}
        </span>
      </div>
      <span
        className="text-xl font-semibold leading-tight mb-0.5"
        style={{ fontFamily: "'Dancing Script', cursive", color: character.color, fontWeight: 700 }}
      >
        {character.name}
      </span>
      <span className="text-xs font-semibold text-gray-500 tracking-wide mb-2 leading-tight">
        {character.role}
      </span>
      <div className="w-8 h-px mb-2" style={{ background: `${character.color}40` }} />
      <p className="text-xs text-gray-500 leading-relaxed">{character.description}</p>
    </motion.div>
  );
}

export default function HomeWorkbench({ onNavigate }: HomeWorkbenchProps) {
  const qc = useQueryClient();
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  // Fetch existing character image URLs
  const { data: characterImages = {} } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/characters"],
    staleTime: 1000 * 60 * 5,
  });

  const generateMutation = useMutation({
    mutationFn: (characterId: string) =>
      apiRequest("POST", "/api/characters/generate", { characterId }).then((r) => r.json()),
    onMutate: (characterId) => {
      setGeneratingIds((s) => { const n = new Set(s); n.add(characterId); return n; });
    },
    onSettled: (_, __, characterId) => {
      setGeneratingIds((s) => {
        const next = new Set(s);
        next.delete(characterId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  const allGenerated = CHARACTERS.every((c) => characterImages[c.id]);
  const anyMissing = CHARACTERS.some((c) => !characterImages[c.id]);
  const isGeneratingAny = generatingIds.size > 0;

  const handleGenerateAll = () => {
    CHARACTERS.forEach((c) => {
      if (!characterImages[c.id] && !generatingIds.has(c.id)) {
        generateMutation.mutate(c.id);
      }
    });
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #FDF7EE 0%, #F7EFE2 40%, #F2E8D8 100%)" }}
      />
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(212,188,154,0.12), transparent)" }}
      />

      {/* Decorative SVG flowers */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <CrochetFlower x={48} y={130} color="#C24E6B" size={32} rotate={15} />
        <CrochetFlower x={30} y={195} color="#D4921A" size={20} rotate={-20} />
        <CrochetFlower x={78} y={168} color="#84934F" size={16} rotate={40} />
        <CrochetFlower x={850} y={145} color="#7C5FA8" size={28} rotate={-10} />
        <CrochetFlower x={880} y={210} color="#C24E6B" size={18} rotate={30} />
        <CrochetFlower x={825} y={190} color="#3D8FA3" size={14} rotate={55} />
        <CrochetFlower x={155} y={490} color="#C24E6B" size={22} rotate={20} />
        <CrochetFlower x={740} y={485} color="#84934F" size={19} rotate={-35} />
      </svg>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 sm:py-10">

        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <StitchedLabelTag />
          <div className="opacity-80 hidden sm:block">
            <YarnBasket />
          </div>
        </div>

        {/* Hero heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-2"
        >
          <h1
            className="leading-tight mb-1"
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(2.6rem, 6vw, 4rem)",
              color: "#6B3A4A",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            Crochet Time
            <span style={{ color: "#C24E6B" }}>♥</span>
          </h1>
          <p className="font-heading text-gray-600 text-base sm:text-lg font-medium tracking-wide">
            Your crochet studio. Your creative world.
          </p>
        </motion.div>

        {/* Pink dashed divider */}
        <div className="flex justify-center mb-5">
          <svg width="220" height="12" viewBox="0 0 220 12">
            <path d="M 10 6 Q 55 1 110 6 Q 165 11 210 6"
              stroke="#C24E6B" strokeWidth="2" strokeLinecap="round" fill="none"
              strokeDasharray="5 4" opacity="0.5" />
            <circle cx="110" cy="6" r="3" fill="#C24E6B" opacity="0.4" />
          </svg>
        </div>

        <p className="text-center text-sm text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
          Meet your amigurumi companions. Each character has a special role
          to support you on your crochet journey.
        </p>

        {/* Character stage */}
        <div className="relative mb-3">
          <div className="absolute bottom-0 left-4 right-4 h-10 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 100%, #E8D8C0 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <YarnTrailSVG />

          <div className="flex items-end justify-center gap-4 sm:gap-6 pb-2">
            {CHARACTERS.map((character) => (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: character.delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <CharacterPortrait
                  character={character}
                  imageUrl={characterImages[character.id] ?? null}
                  isGenerating={generatingIds.has(character.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Generate companions button */}
          <AnimatePresence>
            {anyMissing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="flex justify-center mt-5"
              >
                <button
                  onClick={handleGenerateAll}
                  disabled={isGeneratingAny}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isGeneratingAny
                      ? "rgba(194,78,107,0.08)"
                      : "linear-gradient(135deg, #C24E6B 0%, #9B3B53 100%)",
                    color: isGeneratingAny ? "#C24E6B" : "white",
                    border: "1.5px solid rgba(194,78,107,0.3)",
                    boxShadow: isGeneratingAny ? "none" : "0 4px 16px rgba(194,78,107,0.3)",
                  }}
                >
                  {isGeneratingAny ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating companions…
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      Generate companions with AI
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {allGenerated && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Your companions are ready ♥
            </p>
          )}
        </div>

        {/* Character info cards */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 mb-10">
          {CHARACTERS.map((character, i) => (
            <CharacterInfoCard key={character.id} character={character} index={i} />
          ))}
        </div>

        {/* Bottom strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-10"
          style={{
            background: "rgba(196,168,130,0.13)",
            border: "1.5px solid rgba(196,168,130,0.3)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="flex-shrink-0 text-center sm:text-left">
            <p className="font-heading text-gray-600 text-sm font-medium">
              Together, we make every project
            </p>
            <p
              className="text-2xl leading-tight"
              style={{ fontFamily: "'Dancing Script', cursive", color: "#C24E6B", fontWeight: 700 }}
            >
              beautifully yours. ♥
            </p>
          </div>

          <div className="hidden sm:block w-px self-stretch bg-amber-200 opacity-60" />

          <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
            {ACTIONS.map(({ icon: Icon, label, description, view }) => (
              <motion.button
                key={label}
                onClick={() => onNavigate(view)}
                className="flex flex-col items-center gap-1.5 group focus:outline-none"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150"
                  style={{
                    background: "rgba(194,78,107,0.09)",
                    border: "1.5px solid rgba(194,78,107,0.22)",
                  }}
                >
                  <Icon className="h-4 w-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
                  {label}
                </span>
                <span className="text-[10px] text-gray-400 hidden sm:block text-center leading-tight max-w-[72px]">
                  {description}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
