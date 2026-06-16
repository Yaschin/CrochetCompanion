import { describe, it, expect } from "vitest";
import {
  YARD_IN_METERS,
  yardsToMeters,
  metersToYards,
  stitchesForLength,
  lengthForStitches,
  ballsNeeded,
  parseYards,
} from "../../client/src/lib/crochetMath";

describe("yard/metre conversion", () => {
  it("round-trips through the exact yard definition", () => {
    expect(yardsToMeters(1)).toBeCloseTo(YARD_IN_METERS, 6);
    expect(metersToYards(YARD_IN_METERS)).toBeCloseTo(1, 6);
    expect(metersToYards(yardsToMeters(123))).toBeCloseTo(123, 6);
  });
});

describe("stitchesForLength", () => {
  it("scales a per-10cm gauge to the requested length", () => {
    expect(stitchesForLength(25, 20)).toBe(50); // 20 sts/10cm over 25cm
    expect(stitchesForLength(10, 22)).toBe(22); // one gauge-width
  });

  it("rounds to a whole number of stitches", () => {
    expect(stitchesForLength(7, 18)).toBe(13); // 12.6 → 13
  });

  it("returns null for non-positive or invalid input", () => {
    expect(stitchesForLength(0, 20)).toBeNull();
    expect(stitchesForLength(25, 0)).toBeNull();
    expect(stitchesForLength(NaN, 20)).toBeNull();
    expect(stitchesForLength(-5, 20)).toBeNull();
  });
});

describe("lengthForStitches", () => {
  it("is the inverse of stitchesForLength", () => {
    expect(lengthForStitches(50, 20)).toBe(25);
    expect(lengthForStitches(22, 22)).toBe(10);
  });

  it("rounds to one decimal place", () => {
    expect(lengthForStitches(13, 18)).toBe(7.2); // 7.222… → 7.2
  });

  it("returns null for non-positive or invalid input", () => {
    expect(lengthForStitches(0, 20)).toBeNull();
    expect(lengthForStitches(50, 0)).toBeNull();
    expect(lengthForStitches(50, NaN)).toBeNull();
  });
});

describe("ballsNeeded", () => {
  it("rounds up to whole balls including the default 10% margin", () => {
    // 900yd needed, 220yd/ball → 990yd with margin → 4.5 → 5 balls
    expect(ballsNeeded(900, 220)).toBe(5);
    // exactly one ball's worth still needs one ball
    expect(ballsNeeded(200, 220)).toBe(1);
  });

  it("respects a custom margin and treats a negative margin as zero", () => {
    expect(ballsNeeded(1000, 250, 0)).toBe(4); // 4.0 exactly
    expect(ballsNeeded(1000, 250, 25)).toBe(5); // 1250 / 250
    expect(ballsNeeded(1000, 250, -5)).toBe(4); // negative → 0% margin
  });

  it("returns null for non-positive or invalid input", () => {
    expect(ballsNeeded(0, 220)).toBeNull();
    expect(ballsNeeded(900, 0)).toBeNull();
    expect(ballsNeeded(NaN, 220)).toBeNull();
  });
});

describe("parseYards", () => {
  it("reads explicit yardage", () => {
    expect(parseYards("~80 yards")).toBe(80);
    expect(parseYards("220yd")).toBe(220);
    expect(parseYards("153 yds")).toBe(153);
  });

  it("converts metres to yards, preferring yards when both appear", () => {
    expect(parseYards("200m")).toBe(219); // 200 / 0.9144
    expect(parseYards("180 metres")).toBe(197);
    expect(parseYards("50g (120 yd)")).toBe(120); // yards wins over the gram figure
  });

  it("returns null when only an unconvertible figure (grams) or nothing is present", () => {
    expect(parseYards("50g")).toBeNull();
    expect(parseYards("worsted weight")).toBeNull();
    expect(parseYards("")).toBeNull();
    expect(parseYards(null)).toBeNull();
    expect(parseYards(undefined)).toBeNull();
  });
});
