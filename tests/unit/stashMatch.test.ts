import { describe, it, expect } from "vitest";
import { analyzeStashCoverage, rankByStash } from "../../client/src/lib/stashMatch";
import type { Pattern } from "../../client/src/lib/types";
import type { StashItem } from "../../shared/schema";

const basePattern = (over: Partial<Pattern>): Pattern => ({
  id: "p1",
  title: "Test",
  projectType: "Toy",
  skillLevel: "Beginner",
  sections: [],
  createdAt: new Date().toISOString(),
  ...over,
});

const yarn = (name: string, color?: string): StashItem => ({
  id: name, type: "yarn", name, color, quantity: 1,
});
const hook = (size: string): StashItem => ({
  id: size, type: "hook", name: `${size} hook`, size, quantity: 1,
});

describe("analyzeStashCoverage", () => {
  it("marks a pattern makeable when yarn + hook essentials are in the stash", () => {
    const pattern = basePattern({
      yarnRequirements: [{ color: "Cream", volume: "~50g" }],
      hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    });
    const stash = [yarn("Soft cotton", "cream"), hook("3.5mm")];
    const cov = analyzeStashCoverage(pattern, stash);
    expect(cov.canMake).toBe(true);
    expect(cov.coveragePct).toBe(100);
    expect(cov.missing).toEqual([]);
  });

  it("flags missing essentials and lists them", () => {
    const pattern = basePattern({
      yarnRequirements: [{ color: "Teal", volume: "~50g" }],
      hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    });
    const cov = analyzeStashCoverage(pattern, [yarn("Cotton", "cream")]);
    expect(cov.canMake).toBe(false);
    expect(cov.missing.length).toBe(2);
  });

  it("notions/tools affect coverage % but not makeability", () => {
    const pattern = basePattern({
      yarnRequirements: [{ color: "Cream", volume: "~50g" }],
      hookRequirements: [{ size: "3.5mm", quantity: 1 }],
      notionsRequirements: [{ name: "Safety eyes", description: "8mm", quantity: 2 }],
    });
    const cov = analyzeStashCoverage(pattern, [yarn("Cotton", "cream"), hook("3.5mm")]);
    expect(cov.canMake).toBe(true);
    expect(cov.coveragePct).toBeLessThan(100);
    expect(cov.missing).toContain("Safety eyes");
  });

  it("treats a pattern with no declared essentials as makeable", () => {
    const cov = analyzeStashCoverage(basePattern({}), []);
    expect(cov.canMake).toBe(true);
    expect(cov.coveragePct).toBe(100);
  });
});

describe("rankByStash", () => {
  it("puts fully-makeable patterns first, then sorts by coverage", () => {
    const makeable = basePattern({
      id: "a", title: "Makeable",
      yarnRequirements: [{ color: "Cream", volume: "~50g" }],
    });
    const partial = basePattern({
      id: "b", title: "Partial",
      yarnRequirements: [{ color: "Teal", volume: "~50g" }],
      hookRequirements: [{ size: "9mm", quantity: 1 }],
    });
    const ranked = rankByStash([partial, makeable], [yarn("Cotton", "cream")]);
    expect(ranked[0].pattern.id).toBe("a");
    expect(ranked[0].coverage.canMake).toBe(true);
    expect(ranked[1].coverage.canMake).toBe(false);
  });
});
