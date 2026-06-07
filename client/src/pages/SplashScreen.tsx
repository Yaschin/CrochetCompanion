import { motion } from "framer-motion";
import { ViewType } from "../lib/types";

interface SplashScreenProps {
  onNavigate: (view: ViewType) => void;
}

function YarnBallAnim() {
  return (
    <motion.div
      animate={{ rotate: [0, 15, -10, 15, 0], y: [0, -12, 0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <radialGradient id="splashYarn" cx="38%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#F5D080" />
            <stop offset="45%" stopColor="#D4921A" />
            <stop offset="100%" stopColor="#9A6010" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="url(#splashYarn)" />
        <ellipse cx="60" cy="60" rx="38" ry="16" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.45" />
        <ellipse cx="60" cy="60" rx="38" ry="16" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.38" transform="rotate(55,60,60)" />
        <ellipse cx="60" cy="60" rx="38" ry="16" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.32" transform="rotate(-55,60,60)" />
        <ellipse cx="60" cy="60" rx="38" ry="16" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.22" transform="rotate(100,60,60)" />
        <circle cx="44" cy="44" r="11" fill="white" fillOpacity="0.14" />
        {/* Trailing yarn thread */}
        <path d="M 108 30 Q 115 20 112 10 Q 109 2 105 5" fill="none" stroke="#D4921A" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

function FloatingFlower({ x, y, color, size, delay }: { x: number; y: number; color: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ y: [0, -10, 0], rotate: [0, 8, -5, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        {[0, 72, 144, 216, 288].map((a) => {
          const rad = (a * Math.PI) / 180;
          const cx = 20 + Math.cos(rad) * 8;
          const cy = 20 + Math.sin(rad) * 8;
          return <ellipse key={a} cx={cx} cy={cy} rx="7" ry="4.5"
            transform={`rotate(${a},${cx},${cy})`} fill={color} fillOpacity="0.7" />;
        })}
        <circle cx="20" cy="20" r="5.5" fill={color} fillOpacity="0.85" />
        <circle cx="20" cy="20" r="2.5" fill="white" fillOpacity="0.5" />
      </svg>
    </motion.div>
  );
}

export default function SplashScreen({ onNavigate }: SplashScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden"
      style={{ background: "linear-gradient(155deg, #F9EDD8 0%, #F2E4CE 35%, #EDD5B8 70%, #F2E4CE 100%)" }}>

      {/* Background stitch grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="stitchGrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1.5" fill="#8A5528" />
            <line x1="4" y1="16" x2="12" y2="16" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="20" y1="16" x2="28" y2="16" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="16" y1="4" x2="16" y2="12" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="16" y1="20" x2="16" y2="28" stroke="#8A5528" strokeWidth="1" strokeDasharray="2,2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stitchGrid)" />
      </svg>

      {/* Floating flowers */}
      <FloatingFlower x={8}  y={10} color="#C24E6B" size={38} delay={0} />
      <FloatingFlower x={85} y={8}  color="#7C5FA8" size={30} delay={1.2} />
      <FloatingFlower x={5}  y={72} color="#84934F" size={34} delay={2.1} />
      <FloatingFlower x={88} y={68} color="#D4921A" size={26} delay={0.7} />
      <FloatingFlower x={50} y={5}  color="#3D8FA3" size={22} delay={1.8} />
      <FloatingFlower x={20} y={85} color="#C24E6B" size={18} delay={3.0} />
      <FloatingFlower x={75} y={82} color="#84934F" size={20} delay={1.5} />

      {/* Main content */}
      <motion.div
        className="flex flex-col items-center z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <motion.p
            className="font-script leading-none"
            style={{ fontSize: "3.8rem", color: "#A83050", fontWeight: 700 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Crochet
          </motion.p>
          <motion.p
            className="font-script leading-none"
            style={{ fontSize: "3.8rem", color: "#A83050", fontWeight: 700, marginTop: "-8px" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Time ♥
          </motion.p>
          <motion.p
            className="text-[13px] font-semibold tracking-widest uppercase mt-2"
            style={{ color: "#9A7868", letterSpacing: "0.18em" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            Your creative companion
          </motion.p>
        </div>

        {/* Yarn ball */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring", bounce: 0.4 }}
        >
          <YarnBallAnim />
        </motion.div>

        {/* Tag line */}
        <motion.div
          className="text-center mt-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="font-heading font-semibold text-[16px]" style={{ color: "#5C3A28" }}>
            Patterns made for you, by Yala ✨
          </p>
          <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>
            AI-powered crochet pattern creation
          </p>
        </motion.div>

        {/* Enter button */}
        <motion.button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 rounded-full px-8 py-4 font-heading font-bold text-[16px] text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #C24E6B, #A83050)",
            boxShadow: "0 8px 30px rgba(194,78,107,0.45), 0 2px 8px rgba(60,20,30,0.2)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          whileHover={{ boxShadow: "0 10px 36px rgba(194,78,107,0.55)" }}
        >
          Enter Your Studio
          <span className="text-xl">→</span>
        </motion.button>

        {/* Stitch character row */}
        <motion.div
          className="flex gap-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
        >
          {[
            { emoji: "🐾", color: "#C24E6B", label: "Aloo" },
            { emoji: "🐘", color: "#7C5FA8", label: "Yala" },
            { emoji: "🐑", color: "#84934F", label: "Sheep" },
            { emoji: "🐝", color: "#D4921A", label: "Bee" },
          ].map(c => (
            <div key={c.label} className="flex flex-col items-center gap-0.5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: `${c.color}22`, border: `1.5px dashed ${c.color}66` }}>
                {c.emoji}
              </div>
              <span className="text-[9px] font-semibold" style={{ color: c.color }}>{c.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
