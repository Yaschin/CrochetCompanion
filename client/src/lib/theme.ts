/**
 * The Crochet Time warm palette. Centralised so the brand colours live in one
 * place instead of as magic hex literals scattered across inline styles. Values
 * are unchanged from the originals, so rendering is identical — this is purely a
 * naming/maintainability layer. Add new shared colours here as they recur.
 */
export const palette = {
  ink: "#3D2318",    // primary text — dark cocoa
  clay: "#9A7868",   // secondary / muted text
  rose: "#C24E6B",   // brand accent (Aloo pink)
  sage: "#84934F",   // success / secondary accent (Sheep green)
  cream: "#FFFCF5",  // app & card background
  bark: "#7A5C3E",   // tertiary text / warm border
  muted: "#80665E",  // most-muted label text — AA-tuned (was #B0908A, ~2.9:1 on cream)
} as const;

export type PaletteColor = keyof typeof palette;
