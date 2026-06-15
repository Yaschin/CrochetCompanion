import { palette } from "@/lib/theme";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ViewType } from "../lib/types";

interface SplashScreenProps {
  onNavigate: (view: ViewType) => void;
}

function FloatingFlower({ x, y, color, size, delay }: { x: number; y: number; color: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${Math.min(x, 82)}%`, top: `${y}%` }}
      animate={{ y: [0, -10, 0], rotate: [0, 8, -5, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        {[0, 72, 144, 216, 288].map((a) => {
          const rad = (a * Math.PI) / 180;
          const cx = 20 + Math.cos(rad) * 8;
          const cy = 20 + Math.sin(rad) * 8;
          return <ellipse key={a} cx={cx} cy={cy} rx="7" ry="4.5"
            transform={`rotate(${a},${cx},${cy})`} fill={color} fillOpacity="0.72" />;
        })}
        <circle cx="20" cy="20" r="5.5" fill={color} fillOpacity="0.88" />
        <circle cx="20" cy="20" r="2.5" fill="white" fillOpacity="0.5" />
      </svg>
    </motion.div>
  );
}

function FloatingStar({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
      transition={{ duration: 2.2 + delay * 0.4, repeat: Infinity, ease: "easeInOut", delay }}>
      <span style={{ fontSize: 13 }}>✦</span>
    </motion.div>
  );
}

const THREAD_PATH = "M -10,80 Q 60,30 160,70 Q 260,110 360,55 Q 460,0 560,60 Q 660,115 760,50 Q 860,0 960,65 Q 1010,85 1050,75";

export default function SplashScreen({ onNavigate }: SplashScreenProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1800);
    const t2 = setTimeout(() => setStage(2), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full overflow-hidden"
      style={{ background: "linear-gradient(155deg, #F9EDD8 0%, #F2E4CE 35%, #EDD5B8 70%, #F2E4CE 100%)" }}
    >
      {/* Stitch grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1.5" fill="#8A5528" />
            <line x1="4" y1="16" x2="12" y2="16" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="20" y1="16" x2="28" y2="16" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="16" y1="4" x2="16" y2="12" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="16" y1="20" x2="16" y2="28" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg)" />
      </svg>

      {/* ── Stage 0: Yarn thread draws itself across screen ── */}
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ top: "28%", height: "20%" }}
        viewBox="0 0 1040 160"
        preserveAspectRatio="none"
      >
        <motion.path
          d={THREAD_PATH}
          fill="none"
          stroke="#C24E6B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.28"
          strokeDasharray="6 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut", delay: 0.1 }}
        />
        {/* Second decorative thread */}
        <motion.path
          d="M -10,100 Q 80,60 200,95 Q 320,130 440,80 Q 560,30 680,90 Q 800,145 920,75 Q 980,50 1050,95"
          fill="none"
          stroke="#7C5FA8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.18"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
        />
      </svg>

      {/* Floating flowers — appear after stage 1 */}
      {stage >= 1 && (
        <>
          <FloatingFlower x={6}  y={8}  color="#C24E6B" size={36} delay={0} />
          <FloatingFlower x={80} y={7}  color="#7C5FA8" size={28} delay={1.2} />
          <FloatingFlower x={4}  y={70} color="#84934F" size={32} delay={2.1} />
          <FloatingFlower x={82} y={68} color="#D4921A" size={24} delay={0.7} />
          <FloatingFlower x={48} y={4}  color="#3D8FA3" size={20} delay={1.8} />
          <FloatingFlower x={18} y={88} color="#C24E6B" size={16} delay={3.0} />
          <FloatingFlower x={74} y={85} color="#84934F" size={18} delay={1.5} />
          <FloatingStar x={30} y={20} delay={0.3} />
          <FloatingStar x={65} y={15} delay={1.1} />
          <FloatingStar x={12} y={45} delay={2.0} />
          <FloatingStar x={88} y={40} delay={0.8} />
          <FloatingStar x={55} y={82} delay={1.6} />
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-col items-center z-10 px-6 text-center w-full max-w-sm">

        {/* Stage 0 — yarn ball spinning while thread draws */}
        {stage === 0 && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 15, -10, 15, 0] }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4"
          >
            <span style={{ fontSize: 80, display: "block", filter: "drop-shadow(0 8px 20px rgba(80,40,10,0.25))" }}>🧶</span>
          </motion.div>
        )}

        {/* Stage 1+ — Characters emerge */}
        {stage >= 1 && (
          <motion.div
            className="flex items-end justify-center gap-2 mb-5 w-full"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Aloo */}
            <motion.div
              className="flex flex-col items-center gap-1"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="rounded-full p-2"
                style={{ background: "rgba(194,78,107,0.08)", border: "1.5px dashed rgba(194,78,107,0.22)" }}>
                <img src="/characters/char-aloo-transparent.png" alt="Aloo"
                  style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 5px 14px rgba(50,20,5,0.25))" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: palette.rose }}>Aloo</span>
            </motion.div>

            {/* Ashi — centre hero */}
            <motion.div
              className="flex flex-col items-center gap-1"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            >
              <div className="rounded-full p-2"
                style={{ background: "rgba(61,143,163,0.08)", border: "1.5px dashed rgba(61,143,163,0.25)" }}>
                <img src="/characters/char-ashi-transparent.png" alt="Ashi"
                  style={{ width: 88, height: 88, objectFit: "contain", filter: "drop-shadow(0 6px 16px rgba(50,20,5,0.28))" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: "#3D8FA3" }}>Ashi</span>
            </motion.div>

            {/* Yala */}
            <motion.div
              className="flex flex-col items-center gap-1"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            >
              <div className="rounded-full p-2"
                style={{ background: "rgba(124,95,168,0.08)", border: "1.5px dashed rgba(124,95,168,0.22)" }}>
                <img src="/characters/char-yala-transparent.png" alt="Yala"
                  style={{ width: 84, height: 84, objectFit: "contain", filter: "drop-shadow(0 5px 14px rgba(50,20,5,0.25))" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: "#7C5FA8" }}>Yala</span>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 2 — Logo + tagline + CTA */}
        {stage >= 2 && (
          <>
            <motion.div className="mb-2 flex items-center justify-center gap-3"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

              {/* Realistic wool ball — left */}
              <motion.svg viewBox="0 0 80 80" width="62" height="62" style={{ flexShrink: 0 }}
                animate={{ rotate: [0, 6, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                <defs>
                  <radialGradient id="wb1" cx="36%" cy="32%" r="62%">
                    <stop offset="0%" stopColor="#E87898" />
                    <stop offset="45%" stopColor="#C24E6B" />
                    <stop offset="100%" stopColor="#7A1E38" />
                  </radialGradient>
                  <clipPath id="wbc"><circle cx="40" cy="40" r="34" /></clipPath>
                </defs>
                <circle cx="40" cy="40" r="34" fill="url(#wb1)" />
                <g clipPath="url(#wbc)" fill="none" strokeWidth="2.2">
                  <ellipse cx="40" cy="40" rx="34" ry="13" stroke="rgba(255,255,255,0.28)" transform="rotate(-35,40,40)" />
                  <ellipse cx="40" cy="40" rx="34" ry="13" stroke="rgba(255,255,255,0.22)" transform="rotate(15,40,40)" />
                  <ellipse cx="40" cy="40" rx="34" ry="13" stroke="rgba(255,255,255,0.18)" transform="rotate(60,40,40)" />
                  <ellipse cx="40" cy="40" rx="22" ry="9"  stroke="rgba(255,255,255,0.14)" transform="rotate(-10,40,40)" />
                </g>
                {/* Highlight */}
                <ellipse cx="30" cy="27" rx="9" ry="5.5" fill="rgba(255,255,255,0.2)" transform="rotate(-30,30,27)" />
                {/* Shadow */}
                <circle cx="44" cy="48" r="30" fill="rgba(0,0,0,0.08)" />
                {/* Yarn tail */}
                <path d="M 66 46 Q 74 40 70 30" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
              </motion.svg>

              {/* Text */}
              <div className="text-center">
                <p className="font-script leading-none" style={{ fontSize: "3.2rem", color: "#A83050", fontWeight: 700 }}>
                  Crochet
                </p>
                <p className="font-script leading-none" style={{ fontSize: "3.2rem", color: "#A83050", fontWeight: 700, marginTop: "-10px" }}>
                  Time ♥
                </p>
              </div>

              {/* Realistic thread spool — right */}
              <motion.svg viewBox="0 0 56 80" width="44" height="62" style={{ flexShrink: 0 }}
                animate={{ rotate: [0, -5, 3, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
                <defs>
                  <linearGradient id="sp1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4A7A5A" />
                    <stop offset="40%" stopColor="#6AA870" />
                    <stop offset="100%" stopColor="#3A6048" />
                  </linearGradient>
                  <linearGradient id="sp2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A5038" />
                    <stop offset="100%" stopColor="#4A8058" />
                  </linearGradient>
                </defs>
                {/* Top flange */}
                <ellipse cx="28" cy="10" rx="24" ry="8" fill="#2A5038" />
                <ellipse cx="28" cy="8"  rx="24" ry="8" fill="url(#sp2)" />
                {/* Body */}
                <rect x="8" y="8" width="40" height="52" rx="3" fill="url(#sp1)" />
                {/* Thread wraps */}
                {[16,23,30,37,44,51].map((y, i) => (
                  <ellipse key={i} cx="28" cy={y} rx="20" ry="4.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" />
                ))}
                {/* Bottom flange */}
                <ellipse cx="28" cy="60" rx="24" ry="8" fill="#2A5038" />
                <ellipse cx="28" cy="60" rx="24" ry="8" fill="url(#sp2)" opacity="0.85" />
                {/* Highlight on body */}
                <rect x="10" y="12" width="8" height="44" rx="4" fill="rgba(255,255,255,0.12)" />
                {/* Thread tail */}
                <path d="M 48 34 Q 56 30 54 20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" />
              </motion.svg>
            </motion.div>

            <motion.p className="text-[12px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: palette.clay, letterSpacing: "0.18em" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}>
              Your creative companion
            </motion.p>

            <motion.div className="mb-6"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}>
              <p className="font-heading font-semibold text-[16px]" style={{ color: "#5C3A28" }}>Your crochet studio</p>
              <p className="font-heading font-semibold text-[16px]" style={{ color: "#5C3A28" }}>Your creative world ✨</p>
            </motion.div>

            <motion.button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-3 rounded-full px-8 py-4 font-heading font-bold text-[16px] w-full justify-center"
              style={{
                background: "linear-gradient(135deg, #C24E6B, #A83050)",
                color: "white",
                boxShadow: "0 8px 30px rgba(194,78,107,0.45), 0 2px 8px rgba(60,20,30,0.2)",
              }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ scale: 1.04, boxShadow: "0 10px 36px rgba(194,78,107,0.55)" }}
              whileTap={{ scale: 0.97 }}>
              Enter Your Studio <span style={{ fontSize: 20 }}>→</span>
            </motion.button>

            {/* Secondary characters — Bee & Sheep */}
            <motion.div className="flex gap-3 mt-5 items-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}>
              {[
                { id: "bee",   color: "#D4921A", delay: 0 },
                { id: "sheep", color: palette.sage, delay: 0.4 },
              ].map((c, i) => (
                <motion.div key={c.id}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: c.delay }}>
                  <div className="rounded-full overflow-hidden flex items-center justify-center"
                    style={{ width: 40, height: 40, background: `${c.color}15`, border: `1.5px solid ${c.color}40` }}>
                    <img src={`/characters/char-${c.id}-transparent.png`} alt={c.id}
                      style={{ width: 32, height: 32, objectFit: "contain" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                </motion.div>
              ))}
              <span className="text-[11px] ml-1" style={{ color: "#B0908A" }}>& friends</span>
            </motion.div>
          </>
        )}

        {/* Skip button — always visible in stage 0 */}
        {stage === 0 && (
          <motion.button
            onClick={() => { setStage(2); onNavigate("home"); }}
            className="mt-8 text-[12px] font-semibold underline underline-offset-2"
            style={{ color: "#B0908A" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}>
            Skip intro →
          </motion.button>
        )}
      </div>
    </div>
  );
}
