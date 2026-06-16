export function CrochetFlower({ x, y, color, size = 24, rotate = 0 }: {
  x: number; y: number; color: string; size?: number; rotate?: number;
}) {
  const r = size / 2, pr = r * 0.42;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      {[0,72,144,216,288].map((a) => {
        const rad = (a * Math.PI) / 180;
        const cx = Math.cos(rad)*pr, cy = Math.sin(rad)*pr;
        return <ellipse key={a} cx={cx} cy={cy} rx={r*0.38} ry={r*0.25}
          transform={`rotate(${a},${cx},${cy})`} fill={color} fillOpacity="0.8" />;
      })}
      <circle r={r*0.26} fill={color} fillOpacity="0.95" />
      <circle r={r*0.12} fill="white" fillOpacity="0.6" />
    </g>
  );
}

export function YarnBall({ x, y, color, r = 18 }: { x:number; y:number; color:string; r?:number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} fill={color} fillOpacity="0.6" />
      <ellipse rx={r*0.72} ry={r*0.28} fill="none" stroke="white" strokeWidth="1.1" strokeOpacity="0.4" />
      <ellipse rx={r*0.72} ry={r*0.28} fill="none" stroke="white" strokeWidth="1.1" strokeOpacity="0.3"
        transform="rotate(60)" />
      <ellipse rx={r*0.72} ry={r*0.28} fill="none" stroke="white" strokeWidth="1.1" strokeOpacity="0.3"
        transform="rotate(-60)" />
      <circle r={r*0.28} fill="white" fillOpacity="0.12" cx={-r*0.22} cy={-r*0.22} />
    </g>
  );
}

export function FlowerDot({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {[0,72,144,216,288].map((a) => {
        const rad = (a * Math.PI) / 180;
        const cx = 7 + Math.cos(rad) * 3;
        const cy = 7 + Math.sin(rad) * 3;
        return <ellipse key={a} cx={cx} cy={cy} rx="2.2" ry="1.5"
          transform={`rotate(${a},${cx},${cy})`}
          fill={filled ? color : "none"} stroke={filled ? "none" : color}
          strokeWidth="0.8" fillOpacity={filled ? 0.85 : 0} />;
      })}
      <circle cx="7" cy="7" r="2" fill={filled ? color : "none"}
        stroke={filled ? "none" : color} strokeWidth="0.8" />
    </svg>
  );
}
