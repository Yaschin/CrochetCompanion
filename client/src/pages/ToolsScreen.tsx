import { palette } from "@/lib/theme";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ruler, Scissors, Info, Settings as SettingsIcon } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { withProfile } from "../lib/profile";
import { StashItem, ViewType } from "../lib/types";
import {
  stitchesForLength,
  lengthForStitches,
  ballsNeeded,
  parseYards,
  yardsToMeters,
} from "../lib/crochetMath";

interface ToolsScreenProps {
  onNavigate: (view: ViewType) => void;
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,252,245,0.95)",
  border: "1.5px solid rgba(140,100,55,0.25)",
  color: palette.ink,
};

/** A compact labelled number field shared across the calculators. */
function NumField({
  label, value, onChange, suffix, min = 0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <label className="flex-1 text-[11.5px] font-semibold" style={{ color: palette.inkSoft }}>
      {label}
      <div className="relative mt-1">
        <input
          type="number" min={min} step="any" inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
          style={{ ...inputStyle, paddingRight: suffix ? 38 : undefined }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none" style={{ color: palette.clay }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

/** A read-only result chip: big number + unit, with a caption. */
function ResultChip({ value, unit, caption, tone = "sage" }: {
  value: string;
  unit: string;
  caption: string;
  tone?: "sage" | "rose";
}) {
  const c = tone === "rose"
    ? { bg: "rgba(194,78,107,0.10)", border: "rgba(194,78,107,0.25)", fg: palette.rose }
    : { bg: "rgba(132,147,79,0.10)", border: "rgba(132,147,79,0.28)", fg: palette.olive };
  return (
    <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: c.bg, border: `1.5px solid ${c.border}` }}>
      <p className="font-heading font-bold leading-none" style={{ color: c.fg, fontSize: 22 }}>
        {value}<span className="text-[12px] font-semibold ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] mt-1 font-semibold uppercase tracking-wide" style={{ color: palette.clay }}>{caption}</p>
    </div>
  );
}

type SizeMode = "toStitches" | "toLength";

export default function ToolsScreen({ onNavigate }: ToolsScreenProps) {
  // ── Gauge (prefilled from the saved personal gauge, editable here) ──────────
  const [stGauge, setStGauge] = useState("");
  const [rowGauge, setRowGauge] = useState("");
  useEffect(() => {
    fetch(withProfile("/api/gauge"), { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => {
        if (!g) return;
        if (g.stitches) setStGauge(String(g.stitches));
        if (g.rows) setRowGauge(String(g.rows));
      })
      .catch(() => {});
  }, []);
  const stG = Number(stGauge);
  const rowG = Number(rowGauge);
  const hasGauge = stG > 0 || rowG > 0;

  // ── Sizing converter ────────────────────────────────────────────────────────
  const [sizeMode, setSizeMode] = useState<SizeMode>("toStitches");
  const [inWidth, setInWidth] = useState("");
  const [inHeight, setInHeight] = useState("");
  const [inSts, setInSts] = useState("");
  const [inRows, setInRows] = useState("");

  const size = useMemo(() => {
    if (sizeMode === "toStitches") {
      return {
        a: stitchesForLength(Number(inWidth), stG),
        b: stitchesForLength(Number(inHeight), rowG),
      };
    }
    return {
      a: lengthForStitches(Number(inSts), stG),
      b: lengthForStitches(Number(inRows), rowG),
    };
  }, [sizeMode, inWidth, inHeight, inSts, inRows, stG, rowG]);

  // ── Yarn estimator ──────────────────────────────────────────────────────────
  const { data: stash = [], isLoading: stashLoading } = useQuery<StashItem[]>({ queryKey: ["/api/stash"] });
  const yarns = useMemo(() => stash.filter((s) => s.type === "yarn"), [stash]);

  const [unit, setUnit] = useState<"yd" | "m">("yd");
  const [total, setTotal] = useState("");
  const [perBall, setPerBall] = useState("");
  const [margin, setMargin] = useState("10");
  const [stashId, setStashId] = useState("");

  const selectedYarn = yarns.find((y) => y.id === stashId);
  // Stash "volume"/notes are free text — pull a yardage figure if one's there.
  const yardageOf = (y?: StashItem) =>
    y ? (parseYards(y.volume) ?? parseYards(y.notes) ?? parseYards(y.description)) : null;
  const onPickYarn = (id: string) => {
    setStashId(id);
    const yd = yardageOf(yarns.find((s) => s.id === id));
    if (yd != null) setPerBall(String(unit === "m" ? Math.round(yardsToMeters(yd)) : yd));
  };
  const selectedNoYardage = !!selectedYarn && yardageOf(selectedYarn) == null;

  const balls = ballsNeeded(Number(total), Number(perBall), Number(margin));
  const owned = selectedYarn?.quantity ?? null;
  const enough = balls != null && owned != null ? owned >= balls : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="flex items-center gap-3">
          <BackButton onClick={() => onNavigate("home")} bg="rgba(132,147,79,0.08)" color={palette.sage} />
          <div>
            <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>
              Calculators
            </h1>
            <p className="text-[12px]" style={{ color: palette.clay }}>
              Gauge sizing & how much yarn you need ♡
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">
        {/* ── Gauge & sizing ─────────────────────────────────────────────────── */}
        <div className="craft-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="h-4 w-4" style={{ color: palette.sage }} />
            <p className="font-heading font-semibold text-[15px]" style={{ color: palette.ink }}>Gauge &amp; sizing</p>
          </div>
          <p className="text-[12px] mb-3" style={{ color: palette.clay }}>
            Turn a measurement into a stitch count (or back), using your tension.
          </p>

          {/* Gauge inputs */}
          <div className="flex items-end gap-3">
            <NumField label="Stitches / 10cm" value={stGauge} onChange={setStGauge} min={1} />
            <NumField label="Rows / 10cm" value={rowGauge} onChange={setRowGauge} min={1} />
          </div>
          <button
            onClick={() => onNavigate("settings")}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold hover:opacity-80"
            style={{ color: palette.sage }}
          >
            <SettingsIcon className="h-3 w-3" />
            Measure or save your gauge in Settings
          </button>

          {!hasGauge ? (
            <div className="mt-3 rounded-xl px-3 py-2.5 text-[11.5px] flex items-start gap-2" style={{ background: "rgba(212,146,26,0.10)", color: palette.gold }}>
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              Enter your gauge above to use the converter.
            </div>
          ) : (
            <>
              {/* Direction toggle */}
              <div className="mt-4 flex rounded-xl p-0.5" style={{ background: "rgba(140,100,55,0.08)" }}>
                {([
                  ["toStitches", "Length → Stitches"],
                  ["toLength", "Stitches → Length"],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSizeMode(mode)}
                    className="flex-1 py-1.5 rounded-[10px] text-[11.5px] font-bold transition-all"
                    style={sizeMode === mode
                      ? { background: "white", color: palette.sage, boxShadow: "0 1px 4px rgba(80,40,10,0.10)" }
                      : { background: "transparent", color: palette.clay }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {sizeMode === "toStitches" ? (
                <>
                  <div className="mt-3 flex items-end gap-3">
                    <NumField label="Width" value={inWidth} onChange={setInWidth} suffix="cm" />
                    <NumField label="Height" value={inHeight} onChange={setInHeight} suffix="cm" />
                  </div>
                  <div className="mt-3 flex gap-3">
                    <ResultChip value={size.a != null ? String(size.a) : "—"} unit="sts" caption="Stitches across" />
                    <ResultChip value={size.b != null ? String(size.b) : "—"} unit="rows" caption="Rows tall" />
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-end gap-3">
                    <NumField label="Stitches" value={inSts} onChange={setInSts} suffix="sts" min={1} />
                    <NumField label="Rows" value={inRows} onChange={setInRows} suffix="rows" min={1} />
                  </div>
                  <div className="mt-3 flex gap-3">
                    <ResultChip value={size.a != null ? String(size.a) : "—"} unit="cm" caption="Width" />
                    <ResultChip value={size.b != null ? String(size.b) : "—"} unit="cm" caption="Height" />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Yarn estimator ─────────────────────────────────────────────────── */}
        <div className="craft-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="h-4 w-4" style={{ color: palette.rose }} />
            <p className="font-heading font-semibold text-[15px]" style={{ color: palette.ink }}>How much yarn?</p>
          </div>
          <p className="text-[12px] mb-3" style={{ color: palette.clay }}>
            How many balls to buy for a project, with a little extra for safety.
          </p>

          {/* Unit toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11.5px] font-semibold" style={{ color: palette.inkSoft }}>Length unit</span>
            <div className="flex rounded-lg p-0.5" style={{ background: "rgba(140,100,55,0.08)" }}>
              {(["yd", "m"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-3 py-1 rounded-md text-[11.5px] font-bold transition-all"
                  style={unit === u
                    ? { background: "white", color: palette.rose, boxShadow: "0 1px 4px rgba(80,40,10,0.10)" }
                    : { background: "transparent", color: palette.clay }}
                >
                  {u === "yd" ? "Yards" : "Metres"}
                </button>
              ))}
            </div>
          </div>

          {/* Stash yarn picker */}
          {stashLoading ? (
            <div className="h-9 rounded-xl mb-3 animate-pulse" style={{ background: "rgba(140,100,55,0.10)" }} aria-hidden="true" />
          ) : yarns.length > 0 && (
            <label className="block text-[11.5px] font-semibold mb-3" style={{ color: palette.inkSoft }}>
              Use a yarn from my stash
              <select
                value={stashId}
                onChange={(e) => onPickYarn(e.target.value)}
                className="mt-1 w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={inputStyle}
              >
                <option value="">Pick a yarn…</option>
                {yarns.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}{y.color ? ` · ${y.color}` : ""}{y.volume ? ` (${y.volume})` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedNoYardage && (
            <p className="text-[11px] -mt-1 mb-3 flex items-start gap-1.5" style={{ color: palette.gold }}>
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              No yardage saved on this yarn — type its per-ball length below.
            </p>
          )}

          <div className="flex items-end gap-3">
            <NumField label={`Total needed`} value={total} onChange={setTotal} suffix={unit} min={1} />
            <NumField label={`Per ball`} value={perBall} onChange={setPerBall} suffix={unit} min={1} />
            <NumField label="Extra" value={margin} onChange={setMargin} suffix="%" />
          </div>

          <div className="mt-4 flex gap-3 items-stretch">
            <ResultChip
              value={balls != null ? String(balls) : "—"}
              unit={balls === 1 ? "ball" : "balls"}
              caption="To buy"
              tone="rose"
            />
            {enough != null && (
              <div
                className="flex-1 rounded-xl px-3 py-2.5 flex flex-col items-center justify-center text-center"
                style={{
                  background: enough ? "rgba(132,147,79,0.12)" : "rgba(212,146,26,0.12)",
                  border: `1.5px solid ${enough ? "rgba(132,147,79,0.3)" : "rgba(212,146,26,0.3)"}`,
                }}
              >
                <p className="font-heading font-bold text-[13px]" style={{ color: enough ? palette.olive : palette.gold }}>
                  {enough ? "You have enough ✓" : `Buy ${(balls ?? 0) - (owned ?? 0)} more`}
                </p>
                <p className="text-[10.5px] mt-0.5" style={{ color: palette.clay }}>
                  You own {owned} {owned === 1 ? "ball" : "balls"}
                </p>
              </div>
            )}
          </div>

          {balls != null && (
            <p className="text-[11px] mt-3 text-center" style={{ color: palette.clay }}>
              ≈ {Math.round(Number(total) * (1 + (Number(margin) || 0) / 100))} {unit} total with {Number(margin) || 0}% extra
              {unit === "yd" ? ` (~${Math.round(yardsToMeters(Number(total) * (1 + (Number(margin) || 0) / 100)))} m)` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
