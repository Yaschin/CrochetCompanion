/**
 * Crochet planning math — gauge-based sizing and yarn-quantity estimation.
 *
 * These are the *applied* counterparts to gauge.ts (which only normalises a
 * measured swatch to a per-10cm tension). Everything here is pure so it stays
 * unit-testable and reusable; the Calculators screen is a thin shell over it.
 */

/** One yard in metres (exact, by international definition). */
export const YARD_IN_METERS = 0.9144;

export function yardsToMeters(yards: number): number {
  return yards * YARD_IN_METERS;
}

export function metersToYards(meters: number): number {
  return meters / YARD_IN_METERS;
}

function positive(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/**
 * Stitches (or rows) needed to span a length, given a per-10cm gauge.
 * e.g. 20 sts/10cm over 25cm → 50 stitches. Returns null for invalid input.
 */
export function stitchesForLength(lengthCm: number, per10: number): number | null {
  if (!positive(lengthCm) || !positive(per10)) return null;
  return Math.round((lengthCm / 10) * per10);
}

/**
 * The length in cm that a stitch/row count spans at a per-10cm gauge, rounded
 * to one decimal place. The inverse of {@link stitchesForLength}.
 */
export function lengthForStitches(count: number, per10: number): number | null {
  if (!positive(count) || !positive(per10)) return null;
  return Math.round((count / per10) * 100) / 10;
}

/**
 * Balls/skeins needed to cover a total length of yarn, including a waste
 * margin (default 10%). Always rounds up to whole balls. Returns null for
 * invalid input; a negative margin is treated as 0.
 */
export function ballsNeeded(totalLength: number, lengthPerBall: number, marginPct = 10): number | null {
  if (!positive(totalLength) || !positive(lengthPerBall)) return null;
  const margin = Number.isFinite(marginPct) && marginPct > 0 ? marginPct : 0;
  const ratio = (totalLength * (1 + margin / 100)) / lengthPerBall;
  // Shave off floating-point noise so an exact fit (e.g. 200yd + 10% = one
  // 220yd ball) rounds to 1 ball rather than spuriously to 2.
  return Math.ceil(ratio - 1e-9);
}

/**
 * Best-effort extraction of a length figure from free-text stash "volume"
 * notes like "~80 yards", "200m", or "50g (120 yd)", normalised to yards.
 * Yards are preferred when both appear. Grams alone can't be converted without
 * a weight→length ratio, so they yield null.
 */
export function parseYards(text?: string | null): number | null {
  if (!text) return null;
  const yd = text.match(/(\d+(?:\.\d+)?)\s*(?:yds?|yards?)\b/i);
  if (yd) return Math.round(parseFloat(yd[1]));
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:m|met(?:er|re)s?)\b/i);
  if (m) return Math.round(metersToYards(parseFloat(m[1])));
  return null;
}
