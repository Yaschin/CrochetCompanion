import { motion } from "framer-motion";
import { CrochetFlower, YarnBall } from "./decorations";

function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base warm wood gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(175deg, #7A4A28 0%, #9A6035 12%, #B87A45 28%, #C8935A 42%, #D4A870 58%, #C8935A 72%, #A8723A 88%, #8A5528 100%)"
      }} />

      {/* Warm lamp glow — upper right */}
      <div className="absolute" style={{
        top: -60, right: -40, width: 340, height: 340,
        background: "radial-gradient(ellipse, rgba(255,220,120,0.55) 0%, rgba(255,190,80,0.28) 35%, transparent 70%)",
        borderRadius: "50%",
      }} />

      {/* Secondary ambient glow — left */}
      <div className="absolute" style={{
        top: -20, left: -60, width: 260, height: 260,
        background: "radial-gradient(ellipse, rgba(255,200,100,0.22) 0%, transparent 65%)",
        borderRadius: "50%",
      }} />

      {/* Wooden shelf top edge */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 28 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #5C3018 0%, #7A4828 60%, #9A6035 100%)",
        }} />
        {/* Shelf grain lines */}
        {[18, 42, 70, 110, 148, 190, 240, 290, 340, 400, 460, 520, 580, 640, 700, 750].map((x, i) => (
          <div key={i} className="absolute top-0 bottom-0" style={{
            left: x, width: 1,
            background: "linear-gradient(180deg, rgba(40,18,5,0.4) 0%, rgba(60,30,10,0.15) 100%)",
          }} />
        ))}
        {/* Shelf front edge highlight */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: "linear-gradient(90deg, #A06030, #C08040, #A06030)", opacity: 0.7 }} />
      </div>

      {/* Shelf items SVG layer */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: "none" }}>
        {/* Yarn basket — left side on shelf */}
        <g transform="translate(48, 2)">
          {/* Basket body */}
          <ellipse cx="28" cy="28" rx="26" ry="16" fill="#8B6035" fillOpacity="0.9" />
          <rect x="2" y="16" width="52" height="22" rx="6" fill="#A07040" />
          <rect x="2" y="16" width="52" height="22" rx="6" fill="none" stroke="#7A5025" strokeWidth="1.2" />
          {/* Weave lines */}
          {[20, 25, 30, 35].map(y => (
            <line key={y} x1="2" y1={y} x2="54" y2={y} stroke="#7A5025" strokeWidth="0.7" strokeOpacity="0.6" />
          ))}
          {[10, 18, 26, 34, 42, 50].map(x => (
            <line key={x} x1={x} y1="16" x2={x} y2="38" stroke="#7A5025" strokeWidth="0.7" strokeOpacity="0.5" />
          ))}
          {/* Handle */}
          <path d="M 8 16 Q 28 4 48 16" fill="none" stroke="#8B6035" strokeWidth="3" strokeLinecap="round" />
          {/* Yarn balls peeking out */}
          <circle cx="16" cy="14" r="8" fill="#C24E6B" fillOpacity="0.9" />
          <circle cx="28" cy="11" r="9" fill="#84934F" fillOpacity="0.9" />
          <circle cx="40" cy="13" r="8" fill="#D4921A" fillOpacity="0.9" />
          <ellipse cx="16" cy="14" rx="5.5" ry="2.5" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <ellipse cx="28" cy="11" rx="6.5" ry="2.8" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <ellipse cx="40" cy="13" rx="5.8" ry="2.5" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        </g>

        {/* Ceramic mug — right of basket */}
        <g transform="translate(118, 6)">
          <ellipse cx="16" cy="7" rx="13" ry="5" fill="#7A9A70" fillOpacity="0.9" />
          <rect x="3" y="7" width="26" height="24" rx="3" fill="#8AAA80" />
          <ellipse cx="16" cy="31" rx="13" ry="5" fill="#7A9A70" fillOpacity="0.8" />
          {/* Handle */}
          <path d="M 29 13 Q 38 14 38 20 Q 38 26 29 27" fill="none" stroke="#7A9A70" strokeWidth="3" strokeLinecap="round" />
          {/* Crochet heart on mug */}
          <path d="M 12 16 Q 12 13 15 13 Q 16 13 16 14.5 Q 16 13 17 13 Q 20 13 20 16 Q 20 19 16 22 Q 12 19 12 16Z" fill="#C24E6B" fillOpacity="0.7" />
        </g>

        {/* Crochet hook standing up */}
        <g transform="translate(158, 0)">
          <rect x="3" y="1" width="4" height="28" rx="2" fill="#A07040" fillOpacity="0.8" />
          <path d="M 3 4 Q 0 4 0 7 Q 0 10 4 10" fill="none" stroke="#8A6030" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="2" y="22" width="6" height="8" rx="1.5" fill="#C24E6B" fillOpacity="0.7" />
        </g>

        {/* Right side — yarn balls scattered on table */}
        <YarnBall x={780} y={22} color="#7C5FA8" r={18} />
        <YarnBall x={815} y={14} color="#3D8FA3" r={13} />
        <YarnBall x={798} y={8}  color="#C24E6B" r={10} />

        {/* Lavender sprigs — right of scene */}
        <g transform="translate(845, 0)">
          <line x1="10" y1="32" x2="10" y2="4" stroke="#9BA860" strokeWidth="2.2" strokeOpacity="0.8" />
          <ellipse cx="10" cy="2"  rx="4"   ry="8"   fill="#9878C0" fillOpacity="0.65" />
          <ellipse cx="5"  cy="8"  rx="3"   ry="7"   fill="#9878C0" fillOpacity="0.55" transform="rotate(-18,5,8)" />
          <ellipse cx="15" cy="7"  rx="3"   ry="7"   fill="#9878C0" fillOpacity="0.55" transform="rotate(18,15,7)" />
          <ellipse cx="4"  cy="14" rx="2.5" ry="5.5" fill="#9878C0" fillOpacity="0.4" transform="rotate(-22,4,14)" />
          <ellipse cx="16" cy="13" rx="2.5" ry="5.5" fill="#9878C0" fillOpacity="0.4" transform="rotate(22,16,13)" />
        </g>

        {/* Crocheted green mat / rug on table surface */}
        <ellipse cx="420" cy="292" rx="200" ry="22" fill="#6A8A48" fillOpacity="0.45" />
        <ellipse cx="420" cy="292" rx="186" ry="18" fill="none" stroke="#5A7A38" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6,4" />
        <ellipse cx="420" cy="292" rx="165" ry="14" fill="none" stroke="#5A7A38" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4,3" />

        {/* Scattered yarn snippet on table */}
        <path d="M 200 288 Q 220 282 240 290 Q 255 296 270 284" fill="none" stroke="#C24E6B" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M 560 286 Q 580 278 600 286 Q 615 292 630 280" fill="none" stroke="#7C5FA8" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />

        {/* Floor lamp silhouette — far right */}
        <g transform="translate(870, 20)">
          <line x1="12" y1="0" x2="12" y2="280" stroke="#5A3818" strokeWidth="3" strokeOpacity="0.6" />
          {/* Lamp shade */}
          <path d="M 0 0 L 24 0 L 20 28 L 4 28 Z" fill="#D4921A" fillOpacity="0.5" />
          <ellipse cx="12" cy="0" rx="12" ry="4" fill="#E8A830" fillOpacity="0.6" />
          {/* Base */}
          <ellipse cx="12" cy="278" rx="16" ry="5" fill="#5A3818" fillOpacity="0.5" />
        </g>

        {/* Table surface warm grain overlay at bottom */}
        <rect x="0" y="270" width="900" height="30" fill="url(#woodGrain)" />
        <defs>
          <linearGradient id="woodGrain" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7A4A28" stopOpacity="0.45" />
            <stop offset="20%" stopColor="#9A6035" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#B07840" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#9A6035" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7A4A28" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Decorative crochet flowers on table */}
        <CrochetFlower x={168} y={268} color="#C24E6B" size={28} rotate={20} />
        <CrochetFlower x={190} y={282} color="#84934F" size={18} rotate={-30} />
        <CrochetFlower x={640} y={265} color="#7C5FA8" size={24} rotate={15} />
        <CrochetFlower x={665} y={280} color="#D4921A" size={16} rotate={40} />
      </svg>

      {/* Top shadow — shelf depth */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 44, background: "linear-gradient(180deg, rgba(30,12,3,0.55) 0%, transparent 100%)" }} />
      {/* Bottom table edge gradient */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 32, background: "linear-gradient(0deg, rgba(50,24,6,0.5) 0%, transparent 100%)" }} />
    </div>
  );
}

export function HeroZone() {
  const alooSrc = "/characters/char-aloo-transparent.png";
  const ashiSrc = "/characters/char-ashi-transparent.png";
  const yalaSrc = "/characters/char-yala-transparent.png";

  return (
    // Outer wrapper: no overflow-hidden so characters can bleed past bottom rounded corners
    <div
      className="relative w-full h-[220px] sm:h-[270px] md:h-[310px]"
    >
      {/* Background scene — clipped inside rounded box */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 6px 30px rgba(60,30,8,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <HeroScene />

        {/* "Crochet is my happy place" tag — hanging from top centre */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          {/* Rope — thick + fully opaque */}
          <div style={{
            width: 4, height: 18,
            background: "linear-gradient(180deg, #4A2808, #8A5828)",
            borderRadius: 2,
            opacity: 1,
          }} />
          <div
            className="px-4 py-2.5 rounded-b-xl rounded-t-sm text-center"
            style={{
              background: "rgba(255,252,244,0.95)",
              border: "1.5px dashed rgba(140,95,45,0.35)",
              borderTop: "none",
              boxShadow: "0 4px 14px rgba(60,28,6,0.18), inset 0 -1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <p className="font-heading text-[11px] font-semibold leading-tight" style={{ color: "#6A4A30" }}>
              Crochet is my
            </p>
            <p className="font-script text-[15px] leading-tight" style={{ color: "#A83050", fontWeight: 700 }}>
              happy place ♡
            </p>
          </div>
        </div>
      </div>

      {/* Speech bubbles — outside clip so always fully visible */}
      <div className="absolute z-20 hidden sm:block" style={{ top: 18, left: "7%" }}>
        <div className="speech-bubble" style={{ maxWidth: 140 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Aloo is here to cheer you on! 🐾
          </p>
        </div>
      </div>

      <div className="absolute z-20 hidden sm:block" style={{ top: 14, left: "43%" }}>
        <div className="speech-bubble" style={{ maxWidth: 144 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Ashi loves cosy patterns! 🪡
          </p>
        </div>
      </div>

      <div className="absolute z-20 hidden sm:block" style={{ bottom: 80, right: "7%" }}>
        <div className="speech-bubble" style={{ maxWidth: 148 }}>
          <p className="text-[10.5px] leading-snug" style={{ color: "#5C3D28" }}>
            Yala is ready to create something magical. ✨
          </p>
        </div>
      </div>

      {/* Aloo — left, free-standing */}
      <div className="absolute bottom-0 z-10" style={{ left: "6%" }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={alooSrc}
            alt="Aloo"
            style={{
              width: "min(155px, 22vw)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 20px rgba(50,20,5,0.35))",
            }}
          />
        </motion.div>
      </div>

      {/* Ashi — centre, slightly smaller */}
      <div className="absolute bottom-0 z-10" style={{ left: "50%", transform: "translateX(-50%)" }}>
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <img
            src={ashiSrc}
            alt="Ashi"
            style={{
              width: "min(145px, 21vw)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 7px 18px rgba(50,20,5,0.32))",
            }}
          />
        </motion.div>
      </div>

      {/* Yala — right, larger */}
      <div className="absolute bottom-0 z-10" style={{ right: "5%" }}>
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        >
          <img
            src={yalaSrc}
            alt="Yala"
            style={{
              width: "min(190px, 27vw)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 24px rgba(50,20,5,0.38))",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
