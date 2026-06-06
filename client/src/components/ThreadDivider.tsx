import { FC } from 'react';
import { cn } from '../lib/utils';

interface ThreadDividerProps {
  className?: string;
  /** Animate the stitches drawing in on mount. Respects prefers-reduced-motion. */
  animated?: boolean;
}

/**
 * A signature "running stitch" divider — a dashed thread that reads as hand-sewn.
 * Used to separate sections in a way that feels crocheted rather than generic.
 */
const ThreadDivider: FC<ThreadDividerProps> = ({ className, animated = false }) => {
  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      <svg
        viewBox="0 0 400 8"
        preserveAspectRatio="none"
        className="w-full h-2 text-primary/40"
      >
        <line
          x1="2"
          y1="4"
          x2="398"
          y2="4"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="9 8"
          style={animated ? { ['--stitch-length' as any]: 420 } : undefined}
          className={animated ? 'animate-stitch-draw' : undefined}
        />
      </svg>
    </div>
  );
};

export default ThreadDivider;
