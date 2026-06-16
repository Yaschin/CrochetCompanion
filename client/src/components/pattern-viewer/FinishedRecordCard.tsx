import { useEffect, useState } from "react";
import { palette } from "@/lib/theme";
import { Pattern, FinishedRecord } from "@/lib/types";
import { NotebookPen, Check } from "lucide-react";

/**
 * "Project notebook" — the as-built record of what was *actually* made: the yarn
 * and hook really used, the finished measurements, who it's for, and notes to
 * your future self. Distinct from the pattern's planned requirements; captured
 * while making and finishing. Persists via the pattern's `finishedRecord`.
 */

const EMPTY: Required<FinishedRecord> = { madeFor: "", yarnUsed: "", hookUsed: "", measurements: "", notes: "" };

function normalize(r?: FinishedRecord | null): Required<FinishedRecord> {
  return { ...EMPTY, ...(r ?? {}) };
}

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: palette.muted }}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none"
        style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)", color: palette.ink }}
      />
    </label>
  );
}

interface FinishedRecordCardProps {
  pattern: Pattern;
  onUpdatePattern: (pattern: Pattern) => void;
}

export default function FinishedRecordCard({ pattern, onUpdatePattern }: FinishedRecordCardProps) {
  const saved = normalize(pattern.finishedRecord);
  const [draft, setDraft] = useState<Required<FinishedRecord>>(saved);

  // Re-seed when switching to a different pattern (the card is reused per viewer).
  useEffect(() => { setDraft(normalize(pattern.finishedRecord)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pattern.id]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (key: keyof FinishedRecord) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));

  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <NotebookPen className="h-4 w-4" style={{ color: "#7C5FA8" }} />
        <span className="font-heading font-semibold text-[13px]" style={{ color: palette.ink }}>Project notebook</span>
      </div>
      <p className="text-[11.5px] mb-3" style={{ color: palette.clay }}>
        What you actually used &amp; how it turned out — saved with this make.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Made for" value={draft.madeFor} placeholder="e.g. Mum's birthday, myself…" onChange={set("madeFor")} />
        <Field label="Final size" value={draft.measurements} placeholder="e.g. 18cm tall" onChange={set("measurements")} />
        <Field label="Yarn used" value={draft.yarnUsed} placeholder="e.g. 1.5 balls Catona, Cherry" onChange={set("yarnUsed")} />
        <Field label="Hook used" value={draft.hookUsed} placeholder="e.g. 3.5mm" onChange={set("hookUsed")} />
      </div>

      <label className="flex flex-col gap-1 mt-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: palette.muted }}>Notes &amp; changes</span>
        <textarea
          rows={2}
          value={draft.notes}
          placeholder="Mods you made, what you'd do differently next time…"
          onChange={(e) => set("notes")(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none resize-none"
          style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)", color: palette.ink }}
        />
      </label>

      <button
        onClick={() => onUpdatePattern({ ...pattern, finishedRecord: draft })}
        disabled={!dirty}
        className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-40"
        style={{ background: "rgba(124,95,168,0.12)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.3)" }}
      >
        <Check className="h-3.5 w-3.5" /> {dirty ? "Save notebook" : "Saved"}
      </button>
    </div>
  );
}
