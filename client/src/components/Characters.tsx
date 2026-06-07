/**
 * Crochet-amigurumi SVG characters.
 * Each character has a viewBox of 0 0 120 160 for consistent scaling.
 */

// ── Aloo — White/Gray Shih Tzu ───────────────────────────────────────────────
export function AlooSVG({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 160 / 120);
  return (
    <svg viewBox="0 0 120 160" width={size} height={h} style={{ overflow: "visible" }}>
      {/* === EARS (behind head) === */}
      {/* Left ear */}
      <ellipse cx="22" cy="65" rx="17" ry="22" fill="#C0C0B8" transform="rotate(-15,22,65)" />
      <ellipse cx="22" cy="65" rx="10" ry="14" fill="#F2F2EE" transform="rotate(-15,22,65)" />
      {/* Right ear */}
      <ellipse cx="98" cy="65" rx="17" ry="22" fill="#C0C0B8" transform="rotate(15,98,65)" />
      <ellipse cx="98" cy="65" rx="10" ry="14" fill="#F2F2EE" transform="rotate(15,98,65)" />

      {/* === BODY === */}
      <ellipse cx="60" cy="130" rx="33" ry="28" fill="#F4F4F0" />
      {/* Gray saddle patch */}
      <ellipse cx="60" cy="128" rx="22" ry="16" fill="#C8C8C0" fillOpacity="0.55" />
      {/* Crochet stitch texture on body */}
      {[0,1,2,3,4,5].map(i => (
        <circle key={i} cx={37 + i * 9} cy={140} r="1.8" fill="rgba(160,160,148,0.38)" />
      ))}

      {/* === HEAD === */}
      <circle cx="60" cy="62" r="46" fill="#F5F5F2" />
      {/* Subtle gray shading bottom of head */}
      <ellipse cx="60" cy="82" rx="38" ry="20" fill="#D0D0C8" fillOpacity="0.30" />
      {/* Hair texture on head — small curved bumps */}
      {[[-20,30],[20,28],[0,14],[-30,48],[30,46]].map(([dx,dy],i) => (
        <ellipse key={i} cx={60+dx} cy={dy} rx="9" ry="5"
          fill="none" stroke="#C4C4BC" strokeWidth="1.2" strokeOpacity="0.5" />
      ))}

      {/* === TOP KNOT + BOW === */}
      {/* Fluffy top tuft */}
      <ellipse cx="60" cy="18" rx="14" ry="11" fill="#EEEEE8" />
      <ellipse cx="48" cy="24" rx="11" ry="8" fill="#EEEEE8" />
      <ellipse cx="72" cy="24" rx="11" ry="8" fill="#EEEEE8" />
      {/* Bow left wing */}
      <path d="M 44 14 Q 54 20 60 14 Q 54 8 44 14 Z" fill="#C24E6B" fillOpacity="0.92" />
      {/* Bow right wing */}
      <path d="M 76 14 Q 66 20 60 14 Q 66 8 76 14 Z" fill="#C24E6B" fillOpacity="0.92" />
      {/* Bow knot */}
      <circle cx="60" cy="14" r="4" fill="#A83050" />
      <circle cx="60" cy="14" r="1.8" fill="rgba(255,255,255,0.35)" />

      {/* === SNOUT (Shih Tzu characteristic flat pushed-in muzzle) === */}
      <ellipse cx="60" cy="80" rx="24" ry="17" fill="#F0F0EC" />
      <ellipse cx="60" cy="82" rx="19" ry="12" fill="#E6E6E0" />
      {/* Snout stitch border */}
      <ellipse cx="60" cy="80" rx="24" ry="17" fill="none"
        stroke="#C0C0B8" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.5" />

      {/* === NOSE === */}
      <ellipse cx="60" cy="74" rx="7.5" ry="5.5" fill="#1C1C1C" />
      {/* Nose highlight */}
      <ellipse cx="57" cy="72.5" rx="2.5" ry="1.8" fill="rgba(255,255,255,0.35)" />
      {/* Nostrils */}
      <circle cx="56" cy="76" r="1.5" fill="#0A0A0A" />
      <circle cx="64" cy="76" r="1.5" fill="#0A0A0A" />

      {/* === EYES === */}
      {/* Left eye */}
      <circle cx="40" cy="58" r="9" fill="#111111" />
      <circle cx="40" cy="58" r="7" fill="#0A0A0A" />
      <circle cx="42.5" cy="55.5" r="3" fill="white" />
      <circle cx="37.5" cy="61" r="1.2" fill="rgba(255,255,255,0.2)" />
      {/* Right eye */}
      <circle cx="80" cy="58" r="9" fill="#111111" />
      <circle cx="80" cy="58" r="7" fill="#0A0A0A" />
      <circle cx="82.5" cy="55.5" r="3" fill="white" />
      <circle cx="77.5" cy="61" r="1.2" fill="rgba(255,255,255,0.2)" />

      {/* Eyebrow tufts (Shih Tzu) */}
      <path d="M 32 47 Q 40 44 48 47" fill="none" stroke="#A8A8A0" strokeWidth="2" strokeLinecap="round" />
      <path d="M 72 47 Q 80 44 88 47" fill="none" stroke="#A8A8A0" strokeWidth="2" strokeLinecap="round" />

      {/* === ROSY CHEEKS === */}
      <circle cx="30" cy="72" r="9" fill="#F090A0" fillOpacity="0.22" />
      <circle cx="90" cy="72" r="9" fill="#F090A0" fillOpacity="0.22" />

      {/* === MOUTH === */}
      <path d="M 55 86 Q 60 91 65 86" fill="none" stroke="#999990" strokeWidth="1.5" strokeLinecap="round" />

      {/* === PAWS === */}
      <ellipse cx="36" cy="152" rx="16" ry="10" fill="#F0F0EC" />
      {/* Paw toe dividers */}
      <line x1="31" y1="148" x2="31" y2="156" stroke="#C0C0B8" strokeWidth="1" />
      <line x1="36" y1="147" x2="36" y2="157" stroke="#C0C0B8" strokeWidth="1" />
      <line x1="41" y1="148" x2="41" y2="156" stroke="#C0C0B8" strokeWidth="1" />

      <ellipse cx="84" cy="152" rx="16" ry="10" fill="#F0F0EC" />
      <line x1="79" y1="148" x2="79" y2="156" stroke="#C0C0B8" strokeWidth="1" />
      <line x1="84" y1="147" x2="84" y2="157" stroke="#C0C0B8" strokeWidth="1" />
      <line x1="89" y1="148" x2="89" y2="156" stroke="#C0C0B8" strokeWidth="1" />

      {/* === TAIL (fluffy, curled up) === */}
      <path d="M 88 120 Q 104 114 106 104 Q 108 94 100 90"
        fill="none" stroke="#E0E0D8" strokeWidth="10" strokeLinecap="round" />
      <path d="M 88 120 Q 104 114 106 104 Q 108 94 100 90"
        fill="none" stroke="#C8C8C0" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

// ── Ashi — Brown/Black Maltipoo ───────────────────────────────────────────────
export function AshiSVG({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 160 / 120);
  return (
    <svg viewBox="0 0 120 160" width={size} height={h} style={{ overflow: "visible" }}>
      {/* === EARS (floppy, Maltipoo style — slightly wavy) === */}
      {/* Left ear */}
      <ellipse cx="20" cy="68" rx="16" ry="26" fill="#5C2E0A" transform="rotate(-8,20,68)" />
      <ellipse cx="20" cy="72" rx="10" ry="18" fill="#7A3E12" transform="rotate(-8,20,72)" />
      {/* Curly texture on ear */}
      <ellipse cx="18" cy="65" rx="5" ry="3" fill="none" stroke="#3D1A05" strokeWidth="1" strokeOpacity="0.5" />
      <ellipse cx="22" cy="74" rx="4" ry="2.5" fill="none" stroke="#3D1A05" strokeWidth="1" strokeOpacity="0.4" />
      {/* Right ear */}
      <ellipse cx="100" cy="68" rx="16" ry="26" fill="#5C2E0A" transform="rotate(8,100,68)" />
      <ellipse cx="100" cy="72" rx="10" ry="18" fill="#7A3E12" transform="rotate(8,100,72)" />
      <ellipse cx="98" cy="65" rx="5" ry="3" fill="none" stroke="#3D1A05" strokeWidth="1" strokeOpacity="0.5" />
      <ellipse cx="102" cy="74" rx="4" ry="2.5" fill="none" stroke="#3D1A05" strokeWidth="1" strokeOpacity="0.4" />

      {/* === BODY === */}
      <ellipse cx="60" cy="132" rx="34" ry="27" fill="#8B4513" />
      {/* Dark saddle patch (Maltipoo characteristic) */}
      <ellipse cx="60" cy="130" rx="23" ry="15" fill="#3D1A05" fillOpacity="0.65" />
      {/* Curly body texture */}
      {[[-15,120],[0,116],[15,120],[-20,134],[20,134],[0,142]].map(([dx,dy],i) => (
        <ellipse key={i} cx={60+dx} cy={dy} rx="7" ry="4"
          fill="none" stroke="#5C2E0A" strokeWidth="1.5" strokeOpacity="0.5" />
      ))}

      {/* === HEAD === */}
      <circle cx="60" cy="62" r="46" fill="#8B4513" />
      {/* Black patch around upper head / between eyes */}
      <ellipse cx="60" cy="52" rx="30" ry="20" fill="#3D1A05" fillOpacity="0.45" />
      {/* Curly fur texture all over head */}
      {[[-28,40],[28,40],[-10,30],[10,30],[0,44],[-32,58],[32,58],[-18,70],[18,70]].map(([dx,dy],i) => (
        <ellipse key={i} cx={60+dx} cy={dy} rx="8" ry="5"
          fill="none" stroke="#5C2E0A" strokeWidth="1.4" strokeOpacity="0.55" />
      ))}
      {/* Lighter brown belly-chin area */}
      <ellipse cx="60" cy="78" rx="26" ry="18" fill="#A0522D" fillOpacity="0.6" />

      {/* === MUZZLE === */}
      <ellipse cx="60" cy="80" rx="22" ry="15" fill="#9A4E25" />
      <ellipse cx="60" cy="82" rx="17" ry="11" fill="#7A3812" fillOpacity="0.4" />
      {/* Muzzle stitch edge */}
      <ellipse cx="60" cy="80" rx="22" ry="15" fill="none"
        stroke="#5C2E0A" strokeWidth="1" strokeDasharray="3,2.5" strokeOpacity="0.5" />

      {/* === NOSE === */}
      <ellipse cx="60" cy="74" rx="7" ry="5" fill="#0D0808" />
      <ellipse cx="57.5" cy="72.5" rx="2.2" ry="1.6" fill="rgba(255,255,255,0.3)" />
      <circle cx="57" cy="76" r="1.3" fill="#050505" />
      <circle cx="63" cy="76" r="1.3" fill="#050505" />

      {/* === EYES === */}
      {/* Left */}
      <circle cx="40" cy="58" r="9.5" fill="#0A0505" />
      <circle cx="40" cy="58" r="7.5" fill="#0D0808" />
      <circle cx="42.5" cy="55.5" r="3" fill="white" />
      <circle cx="38" cy="61.5" r="1.2" fill="rgba(255,255,255,0.18)" />
      {/* Left dark ring (Maltipoo marking) */}
      <circle cx="40" cy="58" r="11" fill="none" stroke="#1A0A00" strokeWidth="2.5" strokeOpacity="0.55" />
      {/* Right */}
      <circle cx="80" cy="58" r="9.5" fill="#0A0505" />
      <circle cx="80" cy="58" r="7.5" fill="#0D0808" />
      <circle cx="82.5" cy="55.5" r="3" fill="white" />
      <circle cx="78" cy="61.5" r="1.2" fill="rgba(255,255,255,0.18)" />
      <circle cx="80" cy="58" r="11" fill="none" stroke="#1A0A00" strokeWidth="2.5" strokeOpacity="0.55" />

      {/* Brow tufts */}
      <path d="M 32 46 Q 40 43 48 46" fill="none" stroke="#3D1A05" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 72 46 Q 80 43 88 46" fill="none" stroke="#3D1A05" strokeWidth="2.2" strokeLinecap="round" />

      {/* === ROSY CHEEKS === */}
      <circle cx="30" cy="72" r="9" fill="#F090A0" fillOpacity="0.20" />
      <circle cx="90" cy="72" r="9" fill="#F090A0" fillOpacity="0.20" />

      {/* === MOUTH === */}
      <path d="M 55 87 Q 60 92 65 87" fill="none" stroke="#3D1A05" strokeWidth="1.5" strokeLinecap="round" />

      {/* === PAWS === */}
      <ellipse cx="35" cy="152" rx="17" ry="10" fill="#7A3E12" />
      <ellipse cx="35" cy="152" rx="17" ry="10" fill="none"
        stroke="#5C2E0A" strokeWidth="1" strokeDasharray="3,2.5" strokeOpacity="0.5" />
      <line x1="29" y1="148" x2="29" y2="157" stroke="#3D1A05" strokeWidth="1" />
      <line x1="35" y1="147" x2="35" y2="158" stroke="#3D1A05" strokeWidth="1" />
      <line x1="41" y1="148" x2="41" y2="157" stroke="#3D1A05" strokeWidth="1" />

      <ellipse cx="85" cy="152" rx="17" ry="10" fill="#7A3E12" />
      <ellipse cx="85" cy="152" rx="17" ry="10" fill="none"
        stroke="#5C2E0A" strokeWidth="1" strokeDasharray="3,2.5" strokeOpacity="0.5" />
      <line x1="79" y1="148" x2="79" y2="157" stroke="#3D1A05" strokeWidth="1" />
      <line x1="85" y1="147" x2="85" y2="158" stroke="#3D1A05" strokeWidth="1" />
      <line x1="91" y1="148" x2="91" y2="157" stroke="#3D1A05" strokeWidth="1" />

      {/* === TAIL (curled, brown/black) === */}
      <path d="M 88 122 Q 108 112 110 100 Q 112 90 104 86"
        fill="none" stroke="#8B4513" strokeWidth="11" strokeLinecap="round" />
      <path d="M 88 122 Q 108 112 110 100 Q 112 90 104 86"
        fill="none" stroke="#5C2E0A" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

// ── Yala — Desi Theme Elephant ────────────────────────────────────────────────
export function YalaSVG({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 160 / 120);
  return (
    <svg viewBox="0 0 120 160" width={size} height={h} style={{ overflow: "visible" }}>
      {/* === DECORATED EARS === */}
      {/* Left ear — large fan shape with mandala border */}
      <ellipse cx="14" cy="68" rx="22" ry="32" fill="#8B3A9A" transform="rotate(-12,14,68)" />
      <ellipse cx="14" cy="68" rx="22" ry="32" fill="none"
        stroke="#FFD700" strokeWidth="2" strokeOpacity="0.8" transform="rotate(-12,14,68)" />
      {/* Mandala dots on left ear */}
      {[0,60,120,180,240,300].map((a,i) => {
        const r = (a * Math.PI) / 180;
        return <circle key={i} cx={14 + Math.cos(r)*12} cy={68 + Math.sin(r)*18}
          r="2.5" fill="#FFD700" fillOpacity="0.75" />;
      })}
      <circle cx="14" cy="68" r="5" fill="#FFD700" fillOpacity="0.5" />

      {/* Right ear — large fan with mandala */}
      <ellipse cx="106" cy="68" rx="22" ry="32" fill="#8B3A9A" transform="rotate(12,106,68)" />
      <ellipse cx="106" cy="68" rx="22" ry="32" fill="none"
        stroke="#FFD700" strokeWidth="2" strokeOpacity="0.8" transform="rotate(12,106,68)" />
      {[0,60,120,180,240,300].map((a,i) => {
        const r = (a * Math.PI) / 180;
        return <circle key={i} cx={106 + Math.cos(r)*12} cy={68 + Math.sin(r)*18}
          r="2.5" fill="#FFD700" fillOpacity="0.75" />;
      })}
      <circle cx="106" cy="68" r="5" fill="#FFD700" fillOpacity="0.5" />

      {/* === BODY with JHOOLA (decorated saddle cloth) === */}
      <ellipse cx="60" cy="130" rx="35" ry="28" fill="#9B4DAB" />
      {/* Jhoola — draped cloth over body */}
      <path d="M 28 118 Q 60 110 92 118 L 90 145 Q 60 152 30 145 Z"
        fill="#E91E8C" fillOpacity="0.85" />
      {/* Jhoola border — gold trim */}
      <path d="M 28 118 Q 60 110 92 118" fill="none" stroke="#FFD700" strokeWidth="2.5" />
      <path d="M 30 145 Q 60 152 90 145" fill="none" stroke="#FFD700" strokeWidth="2" />
      {/* Jhoola geometric desi pattern */}
      {[0,1,2,3,4].map(i => (
        <g key={i} transform={`translate(${38 + i * 11}, 128)`}>
          <path d="M 0 -6 L 4 0 L 0 6 L -4 0 Z" fill="#FFD700" fillOpacity="0.7" />
        </g>
      ))}
      {/* Desi dots along top jhoola edge */}
      {[35,46,57,68,79,90].map((x,i) => (
        <circle key={i} cx={x} cy={119} r="2.2" fill="#FFD700" />
      ))}
      {/* Fringe at bottom of jhoola */}
      {[33,42,51,60,69,78,87].map((x,i) => (
        <line key={i} x1={x} y1={145} x2={x} y2={152} stroke="#FFD700" strokeWidth="1.5" />
      ))}

      {/* === HEAD === */}
      <circle cx="60" cy="65" r="46" fill="#9B4DAB" />
      {/* Head shading */}
      <ellipse cx="60" cy="80" rx="38" ry="22" fill="#7A3A8C" fillOpacity="0.30" />

      {/* === MAANG TIKKA (forehead jewel/headpiece) === */}
      {/* Central chain */}
      <line x1="60" y1="22" x2="60" y2="30" stroke="#FFD700" strokeWidth="2" />
      {/* Central gem */}
      <circle cx="60" cy="19" r="5" fill="#FFD700" />
      <circle cx="60" cy="19" r="3" fill="#E91E8C" />
      <circle cx="60" cy="19" r="1.5" fill="rgba(255,255,255,0.5)" />
      {/* Side chains */}
      <path d="M 42 28 Q 50 24 60 22 Q 70 24 78 28"
        fill="none" stroke="#FFD700" strokeWidth="1.5" />
      {/* Side gems */}
      <circle cx="40" cy="29" r="3.5" fill="#FFD700" />
      <circle cx="40" cy="29" r="2" fill="#E91E8C" />
      <circle cx="80" cy="29" r="3.5" fill="#FFD700" />
      <circle cx="80" cy="29" r="2" fill="#E91E8C" />

      {/* === BINDI (between eyes) === */}
      <circle cx="60" cy="53" r="5.5" fill="#E91E8C" />
      <circle cx="60" cy="53" r="3.5" fill="#C4006A" />
      <circle cx="60" cy="53" r="1.5" fill="rgba(255,255,255,0.4)" />

      {/* === EYES (kind elephant eyes with lashes) === */}
      {/* Left eye */}
      <ellipse cx="38" cy="65" rx="10" ry="8" fill="#2D1A3A" />
      <ellipse cx="38" cy="65" rx="7.5" ry="6" fill="#3D2250" />
      <circle cx="40" cy="63" r="2.8" fill="white" />
      <circle cx="39.5" cy="62.5" r="1.5" fill="rgba(255,255,255,0.6)" />
      {/* Lashes */}
      {[-3,-1,1,3].map((dx,i) => (
        <line key={i} x1={38+dx} y1={57} x2={38+dx*1.4} y2={53}
          stroke="#2D1A3A" strokeWidth="1.3" strokeLinecap="round" />
      ))}
      {/* Right eye */}
      <ellipse cx="82" cy="65" rx="10" ry="8" fill="#2D1A3A" />
      <ellipse cx="82" cy="65" rx="7.5" ry="6" fill="#3D2250" />
      <circle cx="84" cy="63" r="2.8" fill="white" />
      <circle cx="83.5" cy="62.5" r="1.5" fill="rgba(255,255,255,0.6)" />
      {[-3,-1,1,3].map((dx,i) => (
        <line key={i} x1={82+dx} y1={57} x2={82+dx*1.4} y2={53}
          stroke="#2D1A3A" strokeWidth="1.3" strokeLinecap="round" />
      ))}

      {/* === ROSY CHEEKS === */}
      <circle cx="26" cy="76" r="9" fill="#E91E8C" fillOpacity="0.22" />
      <circle cx="94" cy="76" r="9" fill="#E91E8C" fillOpacity="0.22" />

      {/* === SMALL TUSKS === */}
      <path d="M 44 88 Q 38 94 40 100" fill="none" stroke="#FFFDE0" strokeWidth="5" strokeLinecap="round" />
      <path d="M 44 88 Q 38 94 40 100" fill="none" stroke="#FFF8C0" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 76 88 Q 82 94 80 100" fill="none" stroke="#FFFDE0" strokeWidth="5" strokeLinecap="round" />
      <path d="M 76 88 Q 82 94 80 100" fill="none" stroke="#FFF8C0" strokeWidth="3.5" strokeLinecap="round" />

      {/* === TRUNK (curling upward — auspicious) === */}
      <path d="M 60 92 Q 50 100 44 110 Q 38 120 44 128 Q 48 134 54 130 Q 60 126 58 118"
        fill="none" stroke="#7A3A8C" strokeWidth="16" strokeLinecap="round" />
      <path d="M 60 92 Q 50 100 44 110 Q 38 120 44 128 Q 48 134 54 130 Q 60 126 58 118"
        fill="none" stroke="#9B4DAB" strokeWidth="12" strokeLinecap="round" />
      {/* Trunk tip */}
      <circle cx="58" cy="118" r="6" fill="#7A3A8C" />
      {/* Trunk stitch lines */}
      <path d="M 60 92 Q 50 100 44 110 Q 38 120 44 128 Q 48 134 54 130 Q 60 126 58 118"
        fill="none" stroke="#8B3A9A" strokeWidth="1.5" strokeDasharray="4,3" strokeOpacity="0.5" />

      {/* === FEET === */}
      <ellipse cx="36" cy="152" rx="18" ry="10" fill="#8B3A9A" />
      {/* Gold anklet */}
      <ellipse cx="36" cy="143" rx="16" ry="4" fill="none" stroke="#FFD700" strokeWidth="2.5" />
      {[30,36,42].map((x,i) => (
        <circle key={i} cx={x} cy={143} r="2" fill="#FFD700" />
      ))}

      <ellipse cx="84" cy="152" rx="18" ry="10" fill="#8B3A9A" />
      <ellipse cx="84" cy="143" rx="16" ry="4" fill="none" stroke="#FFD700" strokeWidth="2.5" />
      {[78,84,90].map((x,i) => (
        <circle key={i} cx={x} cy={143} r="2" fill="#FFD700" />
      ))}

      {/* === SMALL LOTUS on body === */}
      {[0,60,120,180,240,300].map((a,i) => {
        const rad = (a * Math.PI) / 180;
        return <ellipse key={i} cx={60 + Math.cos(rad)*7} cy={130 + Math.sin(rad)*5}
          rx="5" ry="3" transform={`rotate(${a},${60 + Math.cos(rad)*7},${130 + Math.sin(rad)*5})`}
          fill="#E91E8C" fillOpacity="0.65" />;
      })}
      <circle cx="60" cy="130" r="4" fill="#FFD700" fillOpacity="0.75" />
    </svg>
  );
}

// ── Bee — Yellow Bee (unchanged) ──────────────────────────────────────────────
export function BeeSVG({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 160 / 120);
  return (
    <svg viewBox="0 0 120 160" width={size} height={h} style={{ overflow: "visible" }}>
      {/* Wings */}
      <ellipse cx="20" cy="70" rx="20" ry="12" fill="rgba(190,225,255,0.75)" transform="rotate(-25,20,70)" />
      <ellipse cx="100" cy="70" rx="20" ry="12" fill="rgba(190,225,255,0.75)" transform="rotate(25,100,70)" />
      <ellipse cx="20" cy="70" rx="20" ry="12" fill="none" stroke="rgba(120,170,210,0.45)"
        strokeWidth="1" transform="rotate(-25,20,70)" />
      <ellipse cx="100" cy="70" rx="20" ry="12" fill="none" stroke="rgba(120,170,210,0.45)"
        strokeWidth="1" transform="rotate(25,100,70)" />
      {/* Body */}
      <ellipse cx="60" cy="105" rx="28" ry="32" fill="#F0C840" />
      <rect x="32" y="92" width="56" height="10" rx="5" fill="rgba(35,16,2,0.68)" />
      <rect x="32" y="110" width="56" height="10" rx="5" fill="rgba(35,16,2,0.68)" />
      {/* Body highlight */}
      <ellipse cx="48" cy="92" rx="10" ry="5" fill="rgba(255,255,255,0.18)" />
      {/* Head */}
      <circle cx="60" cy="60" r="28" fill="#F0C840" />
      {/* Eyes */}
      <circle cx="48" cy="57" r="6" fill="#2D1905" />
      <circle cx="72" cy="57" r="6" fill="#2D1905" />
      <circle cx="49.5" cy="55.5" r="2.2" fill="white" />
      <circle cx="73.5" cy="55.5" r="2.2" fill="white" />
      {/* Smile */}
      <path d="M 50 66 Q 60 74 70 66" stroke="#2D1905" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <circle cx="40" cy="63" r="6" fill="#F09090" fillOpacity="0.35" />
      <circle cx="80" cy="63" r="6" fill="#F09090" fillOpacity="0.35" />
      {/* Antennae */}
      <line x1="50" y1="33" x2="40" y2="18" stroke="#2D1905" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="16" r="4.5" fill="#C24E6B" />
      <line x1="70" y1="33" x2="80" y2="18" stroke="#2D1905" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="16" r="4.5" fill="#C24E6B" />
      {/* Crochet dots */}
      <circle cx="48" cy="100" r="2.2" fill="rgba(255,255,255,0.5)" />
      <circle cx="60" cy="98" r="2.2" fill="rgba(255,255,255,0.5)" />
      <circle cx="72" cy="100" r="2.2" fill="rgba(255,255,255,0.5)" />
      <circle cx="54" cy="116" r="2.2" fill="rgba(255,255,255,0.5)" />
      <circle cx="66" cy="116" r="2.2" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

// ── Sheep — White Fluffy Sheep (unchanged) ────────────────────────────────────
export function SheepSVG({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 160 / 120);
  return (
    <svg viewBox="0 0 120 160" width={size} height={h} style={{ overflow: "visible" }}>
      {/* Fluffy body clouds */}
      <circle cx="44" cy="110" r="26" fill="#F0EEE8" />
      <circle cx="76" cy="110" r="26" fill="#F0EEE8" />
      <circle cx="60" cy="100" r="28" fill="#F0EEE8" />
      <circle cx="38" cy="125" r="20" fill="#F0EEE8" />
      <circle cx="82" cy="125" r="20" fill="#F0EEE8" />
      <circle cx="60" cy="130" r="22" fill="#F0EEE8" />
      {/* Body center */}
      <ellipse cx="60" cy="118" rx="30" ry="22" fill="#F5F4F0" />
      {/* Fleece texture */}
      {[[-12,102],[8,96],[28,102],[-22,118],[18,118],[0,130]].map(([dx,dy],i) => (
        <circle key={i} cx={60+dx} cy={dy} r="7" fill="none"
          stroke="rgba(160,155,140,0.4)" strokeWidth="1.5" />
      ))}
      {/* Head */}
      <circle cx="60" cy="56" r="32" fill="#8B7355" />
      {/* Ears */}
      <ellipse cx="28" cy="62" rx="12" ry="8" fill="#6B5538" transform="rotate(-15,28,62)" />
      <ellipse cx="92" cy="62" rx="12" ry="8" fill="#6B5538" transform="rotate(15,92,62)" />
      <ellipse cx="28" cy="62" rx="7" ry="5" fill="#C4A882" transform="rotate(-15,28,62)" />
      <ellipse cx="92" cy="62" rx="7" ry="5" fill="#C4A882" transform="rotate(15,92,62)" />
      {/* Fleece cap on head */}
      <ellipse cx="60" cy="44" rx="28" ry="20" fill="#F0EEE8" />
      {/* Eyes */}
      <circle cx="46" cy="58" r="7" fill="#2A1A08" />
      <circle cx="74" cy="58" r="7" fill="#2A1A08" />
      <circle cx="48" cy="56.5" r="2.5" fill="white" />
      <circle cx="76" cy="56.5" r="2.5" fill="white" />
      {/* Snout */}
      <ellipse cx="60" cy="72" rx="16" ry="10" fill="#C4A882" />
      <ellipse cx="55" cy="70" r="3.5" fill="#7A5535" />
      <ellipse cx="65" cy="70" r="3.5" fill="#7A5535" />
      <path d="M 54 75 Q 60 80 66 75" fill="none" stroke="#7A5535" strokeWidth="1.5" strokeLinecap="round" />
      {/* Rosy cheeks */}
      <circle cx="36" cy="68" r="7" fill="#F090A0" fillOpacity="0.25" />
      <circle cx="84" cy="68" r="7" fill="#F090A0" fillOpacity="0.25" />
      {/* Legs */}
      <rect x="38" y="144" width="14" height="16" rx="7" fill="#8B7355" />
      <rect x="68" y="144" width="14" height="16" rx="7" fill="#8B7355" />
      {/* Hooves */}
      <ellipse cx="45" cy="158" rx="8" ry="4" fill="#3A2010" />
      <ellipse cx="75" cy="158" rx="8" ry="4" fill="#3A2010" />
    </svg>
  );
}

// ── Character ID → Component map ──────────────────────────────────────────────
export const CHARACTER_SVGS: Record<string, (props: { size?: number }) => JSX.Element> = {
  aloo:  AlooSVG,
  ashi:  AshiSVG,
  yala:  YalaSVG,
  bee:   BeeSVG,
  sheep: SheepSVG,
};
