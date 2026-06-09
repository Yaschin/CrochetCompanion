import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, X, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStitchCounter, loadCounter, EMPTY_COUNTER } from '../hooks/useStitchCounter';

interface StitchCounterProps {
  patternId: string;
  patternTitle?: string;
  open: boolean;
  onClose: () => void;
}

/**
 * A mobile-first, full-screen stitch counter built for crocheting with the
 * phone in hand: a giant tap-to-count target, separate row tracking, and
 * keep-awake. Counts persist per pattern via the shared useStitchCounter
 * store (also used by the full-screen counter). Respects reduced-motion
 * via the global guard in index.css.
 */
const StitchCounter = ({ patternId, patternTitle, open, onClose }: StitchCounterProps) => {
  const [state, setState] = useStitchCounter(patternId);
  const [celebrate, setCelebrate] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const buzz = (ms: number) => {
    try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
  };

  // Re-load saved counts when opened (the full-screen counter may have
  // changed them since this component mounted).
  useEffect(() => {
    if (!open) return;
    setState(loadCounter(patternId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patternId]);

  // Keep the screen awake + lock body scroll while counting
  useEffect(() => {
    if (!open) return;

    const request = async () => {
      try {
        // Screen Wake Lock API — not available everywhere, so guard it.
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

  const increment = useCallback(() => {
    setState((s) => {
      const stitches = s.stitches + 1;
      if (s.target > 0 && stitches === s.target) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1200);
        buzz(30);
      } else {
        buzz(8);
      }
      return { ...s, stitches };
    });
  }, []);

  const decrement = useCallback(() => {
    setState((s) => ({ ...s, stitches: Math.max(0, s.stitches - 1) }));
    buzz(8);
  }, []);

  const nextRow = useCallback(() => {
    setState((s) => ({ ...s, rows: s.rows + 1, stitches: 0 }));
    buzz(20);
  }, []);

  const prevRow = useCallback(() => {
    setState((s) => ({ ...s, rows: Math.max(0, s.rows - 1) }));
  }, []);

  const resetAll = useCallback(() => {
    if (window.confirm('Reset stitch and row counts to zero?')) {
      setState(EMPTY_COUNTER);
      buzz(20);
    }
  }, [setState]);

  // Keyboard support (desktop): space/up to count, down to undo, Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); increment(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); decrement(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, increment, decrement, onClose]);

  if (!open) return null;

  const atTarget = state.target > 0 && state.stitches >= state.target;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Stitch counter">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Stitch counter</p>
          <p className="truncate font-heading text-lg font-semibold text-foreground">{patternTitle || 'Counting'}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close stitch counter"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Big tap-to-count area */}
      <button
        onClick={increment}
        aria-label={`Add a stitch. Current count ${state.stitches}`}
        className={cn(
          'relative flex flex-1 select-none flex-col items-center justify-center px-6 transition-colors',
          atTarget ? 'bg-honey-50' : 'bg-primary-50/60 active:bg-primary-50',
        )}
      >
        <span className="text-sm font-medium uppercase tracking-wide text-primary-700/70">
          Row {state.rows + 1}
        </span>
        <span
          className={cn(
            'font-sans text-8xl font-extrabold tabular-nums leading-none text-primary-700 sm:text-9xl',
            celebrate && 'motion-safe:animate-pulse',
          )}
        >
          {state.stitches}
        </span>
        <span className="mt-2 text-base text-muted-foreground">
          {state.target > 0 ? (
            <span className={cn(atTarget && 'font-semibold text-honey-600')}>
              of {state.target} {atTarget ? '🎉 row complete' : 'stitches'}
            </span>
          ) : (
            'stitches — tap anywhere to count'
          )}
        </span>
      </button>

      {/* Controls */}
      <div className="border-t border-border bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {/* Stitch +/- (decrement is small; the big area increments) */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={decrement}
            aria-label="Remove a stitch"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-gray-700 hover:bg-gray-100"
          >
            <Minus className="h-6 w-6" />
          </button>
          <button
            onClick={increment}
            aria-label="Add a stitch"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary-600"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        {/* Row controls */}
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 p-2">
          <div className="flex items-center gap-2 pl-2">
            <span className="text-sm font-medium text-foreground">Row {state.rows}</span>
            <button onClick={prevRow} aria-label="Previous row" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-200">
              <Minus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={nextRow}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary-600"
          >
            Next row
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Target + reset */}
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Target / row
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={state.target || ''}
              onChange={(e) => setState((s) => ({ ...s, target: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
              placeholder="—"
              className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-center text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default StitchCounter;
