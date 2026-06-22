import { palette } from "@/lib/theme";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, X } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { fileToDataUrl } from "../lib/utils";

interface WorkCheckButtonProps {
  patternId: string;
  sectionIndex: number;
  stepIndex: number;
}

type Status = "on_track" | "check" | "unsure";
interface Result {
  status: Status;
  note: string;
}

// Gentle, non-judgmental result styling — no numeric score, by design.
const STYLES: Record<Status, { label: string; emoji: string; bg: string; fg: string; border: string }> = {
  on_track: { label: "Looks on track", emoji: "✓", bg: "rgba(132,147,79,0.12)", fg: palette.olive, border: "rgba(132,147,79,0.4)" },
  check:    { label: "Worth a look",   emoji: "👀", bg: "rgba(212,146,26,0.12)", fg: palette.gold, border: "rgba(212,146,26,0.4)" },
  unsure:   { label: "Hard to tell",   emoji: "🤔", bg: "rgba(140,100,55,0.10)", fg: palette.inkSoft, border: "rgba(140,100,55,0.3)" },
};

/**
 * "Check my work" — photograph the work-in-progress and let Ashi gently judge
 * it against the round you're on (Follow Mode). The photo is ephemeral: it's
 * sent for the check and never stored.
 */
export default function WorkCheckButton({ patternId, sectionIndex, stepIndex }: WorkCheckButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await apiRequest("POST", `/api/patterns/${patternId}/check-work`, {
        sectionIndex,
        stepIndex,
        imageBase64,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Couldn't check your work");
      }
      return res.json() as Promise<Result>;
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Something went wrong"),
  });

  const onPick = (file?: File) => {
    if (!file) return;
    setError(null);
    setOpen(true);
    check.reset();
    fileToDataUrl(file)
      .then((url) => {
        if (url.startsWith("data:image/")) check.mutate(url);
        else setError("That file couldn't be read as a photo.");
      })
      .catch(() => setError("That file couldn't be read."));
  };

  const result = check.data;
  const s = result ? STYLES[result.status] : null;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        aria-label="Check my work with a photo"
        title="Photograph your work — Ashi checks it against this round"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:opacity-80"
        style={{ background: "rgba(132,147,79,0.12)", color: palette.sage, border: "1.5px solid rgba(132,147,79,0.3)" }}
      >
        <Camera className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl px-5 pt-4 pb-[max(1.2rem,env(safe-area-inset-bottom))] shadow-2xl"
          style={{ background: palette.cream, borderTop: "1.5px solid rgba(140,100,55,0.2)" }}
          role="dialog"
          aria-label="Check my work"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/characters/char-ashi-transparent.png"
                alt=""
                style={{ width: 36, height: 36, objectFit: "contain" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <p className="font-heading font-bold text-[14.5px]" style={{ color: palette.ink }}>
                Ashi checks your work
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:opacity-70"
              style={{ background: "rgba(140,100,55,0.08)", color: palette.clay }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 mb-1" aria-live="polite">
            {check.isPending && (
              <p className="text-[13px] py-4 text-center" style={{ color: palette.tealText }}>
                Ashi is looking at your work… 🧶
              </p>
            )}
            {error && (
              <p className="text-[13px] py-3 px-3 rounded-2xl" style={{ background: "rgba(194,78,107,0.08)", color: palette.roseDeep }}>
                {error}
              </p>
            )}
            {result && s && (
              <div className="flex flex-col gap-2">
                <span
                  className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: s.bg, color: s.fg, border: `1.5px solid ${s.border}` }}
                >
                  {s.emoji} {s.label}
                </span>
                <p className="text-[13.5px] leading-relaxed" style={{ color: palette.cocoa }}>{result.note}</p>
              </div>
            )}
          </div>
          <p className="text-[10.5px] mt-2" style={{ color: palette.muted }}>
            A gentle second opinion — trust your own eyes too. 💛
          </p>
        </div>
      )}
    </>
  );
}
