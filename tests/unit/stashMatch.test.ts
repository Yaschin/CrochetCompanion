import { describe, it, expect } from "vitest";
import { analyzeStashCoverage, rankByStash, matchedYarnsForPattern, buildShoppingList } from "../../client/src/lib/stashMatch";
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

describe("matchedYarnsForPattern", () => {
  it("returns the stash yarns a pattern's yarn requirements match (excludes hooks)", () => {
    const pattern = basePattern({
      yarnRequirements: [{ color: "Cream", volume: "~50g" }, { color: "Sage", volume: "~30g" }],
    });
    const matched = matchedYarnsForPattern(pattern, [
      yarn("Soft cotton", "cream"),
      yarn("Wool", "sage green"),
      hook("3.5mm"),
    ]);
    expect(matched.map((m) => m.id).sort()).toEqual(["Soft cotton", "Wool"]);
  });

  it("returns each matched item once even if two requirements hit it", () => {
    const pattern = basePattern({
      yarnRequirements: [{ color: "cream", volume: "~50g" }, { color: "Cream", volume: "~20g" }],
    });
    expect(matchedYarnsForPattern(pattern, [yarn("Cream Aran", "cream")])).toHaveLength(1);
  });

  it("returns empty when nothing matches or there are no yarn requirements", () => {
    expect(
      matchedYarnsForPattern(basePattern({ yarnRequirements: [{ color: "Teal", volume: "~50g" }] }), [yarn("Cotton", "cream")]),
    ).toEqual([]);
    expect(matchedYarnsForPattern(basePattern({}), [yarn("Cotton", "cream")])).toEqual([]);
  });
});

describe("buildShoppingList", () => {
  it("aggregates missing materials across patterns, deduped, grouped and ordered by category", () => {
    const hat = basePattern({
      id: "hat", title: "Hat",
      yarnRequirements: [{ color: "Cream", volume: "~50g" }],
      hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    });
    const scarf = basePattern({
      id: "scarf", title: "Scarf",
      yarnRequirements: [{ color: "Cream", volume: "~50g" }, { color: "Teal", volume: "~80g" }],
    });
    // Stash is empty → everything is missing.
    const list = buildShoppingList([hat, scarf], []);

    expect(list.patternCount).toBe(2);
    expect(list.itemCount).toBe(3); // Cream (shared), Teal, 3.5mm hook
    // Category order: yarn before hooks.
    expect(list.byCategory.map((g) => g.category)).toEqual(["yarn", "hook"]);

    const cream = list.items.find((i) => i.label.startsWith("Cream"));
    expect(cream?.forPatterns).toEqual(["Hat", "Scarf"]); // deduped across both
    const teal = list.items.find((i) => i.label.startsWith("Teal"));
    expect(teal?.forPatterns).toEqual(["Scarf"]);
  });

  it("skips materials already in the stash and patterns that need nothing", () => {
    const hat = basePattern({
      id: "hat", title: "Hat",
      yarnRequirements: [{ color: "Cream", volume: "~50g" }],
      hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    });
    const fullyStocked = basePattern({
      id: "ready", title: "Ready",
      yarnRequirements: [{ color: "Cream", volume: "~20g" }],
    });
    // Cream yarn is owned; only the hook is missing for "Hat", "Ready" needs nothing.
    const list = buildShoppingList([hat, fullyStocked], [yarn("Soft cotton", "cream")]);

    expect(list.itemCount).toBe(1);
    expect(list.items[0].label).toBe("3.5mm hook");
    expect(list.items[0].forPatterns).toEqual(["Hat"]);
    expect(list.patternCount).toBe(1); // only "Hat" contributed
  });

  it("returns an empty list for no patterns or when everything is covered", () => {
    expect(buildShoppingList([], [])).toMatchObject({ itemCount: 0, patternCount: 0, byCategory: [] });
    const ready = basePattern({ yarnRequirements: [{ color: "Cream", volume: "~50g" }] });
    expect(buildShoppingList([ready], [yarn("Cotton", "cream")]).itemCount).toBe(0);
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
