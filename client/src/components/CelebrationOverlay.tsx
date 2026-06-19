import { palette } from "@/lib/theme";
import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationOverlayProps {
  show: boolean;
  onDone: () => void;
  title?: string;
  subtitle?: string;
}

const COLORS = [palette.rose, palette.purple, palette.sage, palette.amber, palette.teal, "#E88050"];

/**
 * A warm confetti + mascot celebration shown when a project is finished.
 * Auto-dismisses after a few seconds (or on tap).
 */
export default function CelebrationOverlay({ show, onDone, title = "You did it! 🎉", subtitle = "Another finished project ♡" }: CelebrationOverlayProps) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [],
  );

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "rgba(61,35,24,0.45)", backdropFilter: "blur(2px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          {/* Confetti */}
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              className="absolute top-0"
              style={{ left: `${c.left}%`, width: c.size, height: c.size, background: c.color, borderRadius: 2 }}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{ y: "100vh", opacity: [0, 1, 1, 0.8], rotate: c.rotate }}
              transition={{ delay: c.delay, duration: c.duration, ease: "easeIn" }}
            />
          ))}

          <motion.div
            className="relative flex flex-col items-center gap-3 px-8 py-7 rounded-3xl"
            style={{ background: "rgba(255,252,245,0.97)", boxShadow: "0 12px 48px rgba(61,35,24,0.3)" }}
            initial={{ scale: 0.7, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src="/characters/char-bee-transparent.png"
              alt="Celebrating bee"
              style={{ width: 96, height: 96, objectFit: "contain" }}
              animate={{ rotate: [-6, 6, -6], y: [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <p className="font-heading font-bold text-[22px] text-center" style={{ color: palette.rose }}>{title}</p>
            <p className="text-[13px] text-center" style={{ color: palette.inkSoft }}>{subtitle}</p>
            <button
              onClick={onDone}
              className="mt-1 px-5 py-2 rounded-full text-[13px] font-bold"
              style={{ background: "rgba(194,78,107,0.12)", color: palette.rose }}
            >
              Yay! ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
