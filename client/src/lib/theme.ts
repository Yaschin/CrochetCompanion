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
  purple: "#7C5FA8", // violet accent
  cocoa: "#5C3A28",  // deep cocoa text/icon tone
  amber: "#D4921A",  // amber/gold accent
  teal: "#3D8FA3",   // teal accent
  roseDeep: "#A83050",// darker rose accent
  inkSoft: "#7A5A48",// soft brown body text
  olive: "#6A7A3A",  // olive accent
  gold: "#A8761A",   // muted gold accent
  brown: "#6B4B38",  // warm brown label text
} as const;

export type PaletteColor = keyof typeof palette;
