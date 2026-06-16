import { palette } from "@/lib/theme";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { PROFILES } from "@shared/profiles";
import { getActiveProfileId } from "../lib/profile";

interface ProfilePickerScreenProps {
  onProfileChosen: (profileId: string) => void;
  onOpenSettings?: () => void;
}

/**
 * "Who's crocheting today?" — Netflix-style family profile picker. No
 * passwords: this is convenience separation for a shared household device.
 */
export default function ProfilePickerScreen({ onProfileChosen, onOpenSettings }: ProfilePickerScreenProps) {
  const activeId = getActiveProfileId();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-6"
      style={{ background: "linear-gradient(165deg, #FFFCF5 0%, #FBF1F4 100%)" }}>
      <div className="text-center">
        <h1 className="font-heading font-bold" style={{ fontSize: 30, color: palette.ink, letterSpacing: "-0.02em" }}>
          Who's crocheting today?
        </h1>
        <p className="mt-1 text-[13.5px]" style={{ color: palette.clay }}>
          Everyone gets their own library, projects and stash ♡
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {PROFILES.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onProfileChosen(p.id)}
            aria-label={`Continue as ${p.name}`}
            className="flex flex-col items-center gap-2.5 rounded-3xl p-4 transition-all hover:scale-[1.04] active:scale-[0.97]"
            style={{
              background: "rgba(255,255,255,0.75)",
              border: p.id === activeId ? `2.5px solid ${p.color}` : "2.5px solid rgba(140,100,55,0.12)",
              boxShadow: p.id === activeId ? `0 6px 24px ${p.color}40` : "0 4px 14px rgba(80,45,10,0.08)",
            }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24"
              style={{ background: `${p.color}1A`, border: `2px dashed ${p.color}55` }}>
              <img
                src={`/characters/char-${p.character}-transparent.png`}
                alt=""
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                style={{ filter: "drop-shadow(0 3px 8px rgba(50,20,5,0.18))" }}
                onError={(e) => {
                  // Fall back to a coloured initial if the character art is missing.
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector("span")) {
                    const span = document.createElement("span");
                    span.textContent = p.name[0];
                    span.style.cssText = `font-size:34px;font-weight:700;color:${p.color}`;
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
            <span className="font-heading text-[15px] font-bold" style={{ color: palette.ink }}>
              {p.name}
            </span>
            {p.id === activeId && (
              <span className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ background: `${p.color}1A`, color: p.color }}>
                last time
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <p className="max-w-[340px] text-center text-[11.5px]" style={{ color: palette.muted }}>
        No passwords — just pick yourself. You can switch any time from the avatar in the top corner.
      </p>

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-all hover:opacity-75"
          style={{ background: "rgba(255,252,245,0.9)", color: palette.clay, border: "1px solid rgba(140,100,55,0.2)" }}
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </button>
      )}
    </div>
  );
}
