import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Pattern, PatternStep } from '../lib/types';

interface FollowModeProps {
  pattern: Pattern;
  open: boolean;
  onClose: () => void;
  onUpdateStep: (sectionIndex: number, stepIndex: number, step: PatternStep) => void;
}

interface FlatStep {
  sectionIndex: number;
  stepIndex: number;
  sectionName: string;
  step: PatternStep;
}

/**
 * Row-by-row follow mode: a distraction-free, full-screen view that walks
 * through the pattern one step at a time. "Done" checks the step off (same
 * persistence path as the section list) and advances; progress survives
 * closing because it derives from the steps' completed flags.
 */
const FollowMode = ({ pattern, open, onClose, onUpdateStep }: FollowModeProps) => {
  const steps = useMemo<FlatStep[]>(
    () =>
      pattern.sections.flatMap((section, sectionIndex) =>
        // Materials "sections" aren't crochet steps; skip them but keep the
        // original sectionIndex so updates address the right section.
        section.name.toLowerCase() === 'materials'
          ? []
          : section.steps.map((step, stepIndex) => ({
              sectionIndex,
              stepIndex,
              sectionName: section.name,
              step,
            })),
      ),
    [pattern.sections],
  );

  const firstOpen = useMemo(() => {
    const i = steps.findIndex((s) => !s.step.completed);
    return i === -1 ? Math.max(0, steps.length - 1) : i;
  }, [steps]);

  const [pos, setPos] = useState(firstOpen);
  const wakeLockRef = useRef<any>(null);

  // Resume from the first unfinished step each time follow mode opens.
  useEffect(() => {
    if (open) setPos(firstOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the screen awake + lock body scroll while following.
  useEffect(() => {
    if (!open) return;
    const request = async () => {
      try {
        const anyNav = navigator as any;
        if (anyNav.wakeLock?.request) {
          wakeLockRef.current = await anyNav.wakeLock.request('screen');
        }
      } catch { /* wake lock denied/unsupported */ }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      document.body.style.overflow = prevOverflow;
      try { wakeLockRef.current?.release?.(); } catch { /* ignore */ }
      wakeLockRef.current = null;
    };
  }, [open]);

  const current = steps[pos];
  const doneCount = steps.filter((s) => s.step.completed).length;
  const allDone = doneCount === steps.length && steps.length > 0;
  const buzz = (ms: number) => { try { navigator.vibrate?.(ms); } catch { /* unsupported */ } };

  const advance = useCallback(() => {
    setPos((p) => Math.min(steps.length - 1, p + 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setPos((p) => Math.max(0, p - 1));
  }, []);

  const markDoneAndAdvance = useCallback(() => {
    if (!current) return;
    if (!current.step.completed) {
      onUpdateStep(current.sectionIndex, current.stepIndex, { ...current.step, completed: true });
      buzz(20);
    }
    if (pos < steps.length - 1) advance();
  }, [current, pos, steps.length, onUpdateStep, advance]);

  const unmark = useCallback(() => {
    if (!current || !current.step.completed) return;
    onUpdateStep(current.sectionIndex, current.stepIndex, { ...current.step, completed: false });
  }, [current, onUpdateStep]);

  // Keyboard: space/enter advance, left/right navigate, Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); markDoneAndAdvance(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); advance(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, markDoneAndAdvance, back, advance, onClose]);

  if (!open || !current) return null;

  const pct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" role="dialog" aria-modal="true" aria-label="Follow mode"
      style={{ background: "#FFFCF5" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide" style={{ color: "#9A7868" }}>
            {current.sectionName}
          </p>
          <p className="truncate font-heading text-[16px] font-semibold" style={{ color: "#3D2318" }}>
            Step {pos + 1} of {steps.length}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close follow mode"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:opacity-70"
          style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868" }}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(140,100,55,0.15)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #84934F, #6A7A3A)" }} />
        </div>
        <p className="text-[11px] mt-1" style={{ color: "#9A7868" }}>{doneCount} of {steps.length} steps done · {pct}%</p>
      </div>

      {/* Current step */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center justify-center text-center gap-4">
        {current.step.completed && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ background: "rgba(132,147,79,0.12)", color: "#84934F" }}>
            <Check className="h-3.5 w-3.5" /> Done
            <button onClick={unmark} className="underline ml-1 hover:opacity-70">undo</button>
          </span>
        )}
        <p className="font-heading font-semibold leading-snug max-w-[560px]"
          style={{ fontSize: "clamp(19px, 5.5vw, 26px)", color: "#3D2318" }}>
          {current.step.text}
        </p>
        {current.step.notes && (
          <p className="text-[13.5px] italic max-w-[480px]" style={{ color: "#7A5A48" }}>
            “{current.step.notes}”
          </p>
        )}
        {allDone && (
          <p className="text-[14px] font-semibold" style={{ color: "#84934F" }}>
            🎉 Every step is done — time to mark the project finished!
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 flex items-center gap-3"
        style={{ borderTop: "1px solid rgba(140,100,55,0.15)", background: "rgba(255,252,245,0.95)" }}>
        <button
          onClick={back}
          disabled={pos === 0}
          aria-label="Previous step"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80 disabled:opacity-35"
          style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868", border: "1.5px solid rgba(140,100,55,0.2)" }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={markDoneAndAdvance}
          className="flex-1 h-14 rounded-2xl font-heading font-bold text-[16px] transition-all hover:opacity-90 active:scale-[0.99]"
          style={current.step.completed
            ? { background: "rgba(132,147,79,0.12)", color: "#84934F", border: "1.5px solid rgba(132,147,79,0.3)" }
            : { background: "linear-gradient(135deg, #84934F, #6A7A3A)", color: "white", boxShadow: "0 4px 16px rgba(132,147,79,0.4)" }}
        >
          {current.step.completed ? (pos < steps.length - 1 ? "Next step →" : "All caught up ✓") : "✓ Done — next"}
        </button>
        <button
          onClick={advance}
          disabled={pos >= steps.length - 1}
          aria-label="Skip to next step"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80 disabled:opacity-35"
          style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868", border: "1.5px solid rgba(140,100,55,0.2)" }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default FollowMode;
