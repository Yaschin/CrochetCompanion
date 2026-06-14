import { describe, it, expect } from "vitest";
import { gaugeFromSwatch } from "../../client/src/lib/gauge";

describe("gaugeFromSwatch", () => {
  it("normalises a measured swatch to per-10cm", () => {
    // 16 sts over 8cm → 20 / 10cm; 20 rows over 8cm → 25 / 10cm.
    expect(gaugeFromSwatch({ stitches: 16, width: 8, rows: 20, height: 8 })).toEqual({
      stitchesPer10: 20,
      rowsPer10: 25,
    });
  });

  it("passes a 10cm swatch straight through (rounded)", () => {
    expect(gaugeFromSwatch({ stitches: 22, width: 10, rows: 28, height: 10 })).toEqual({
      stitchesPer10: 22,
      rowsPer10: 28,
    });
  });

  it("returns null for non-positive or invalid inputs", () => {
    expect(gaugeFromSwatch({ stitches: 0, width: 8, rows: 20, height: 0 })).toEqual({
      stitchesPer10: null,
      rowsPer10: null,
    });
    expect(gaugeFromSwatch({ stitches: NaN, width: 10, rows: 10, height: -3 })).toEqual({
      stitchesPer10: null,
      rowsPer10: null,
    });
  });
});
