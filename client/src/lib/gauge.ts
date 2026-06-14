/**
 * Gauge swatch math. Crochet a swatch of any size, measure it, and normalise
 * to the per-10cm tension the app stores (and feeds into AI resize). Keeping it
 * pure makes it unit-testable and reusable.
 */
export interface SwatchInput {
  stitches: number; // stitches counted across the swatch
  width: number;    // measured width in cm
  rows: number;     // rows counted down the swatch
  height: number;   // measured height in cm
}

export interface GaugeResult {
  stitchesPer10: number | null;
  rowsPer10: number | null;
}

function per10(count: number, measure: number): number | null {
  if (!Number.isFinite(count) || !Number.isFinite(measure) || count <= 0 || measure <= 0) {
    return null;
  }
  return Math.round((count / measure) * 10);
}

export function gaugeFromSwatch(input: SwatchInput): GaugeResult {
  return {
    stitchesPer10: per10(input.stitches, input.width),
    rowsPer10: per10(input.rows, input.height),
  };
}
