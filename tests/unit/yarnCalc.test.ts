import { describe, it, expect } from "vitest";
import {
  calculatePatternComplexity,
  extractColorMentions,
  generateDefaultYarnRequirements,
} from "../../server/api/generatePattern";

const sections = (stepCounts: number[]) =>
  stepCounts.map((n, i) => ({
    name: `Section ${i + 1}`,
    steps: Array.from({ length: n }, (_, j) => ({ id: j + 1, text: `step ${j + 1}` })),
  }));

describe("calculatePatternComplexity", () => {
  it("uses the project-type base score", () => {
    const p = { sections: sections([5]) };
    expect(calculatePatternComplexity(p, "Scarf")).toBe(3);
    expect(calculatePatternComplexity(p, "Hat")).toBe(4);
    expect(calculatePatternComplexity(p, "Amigurumi toy")).toBe(6);
    expect(calculatePatternComplexity(p, "Blanket")).toBe(7);
  });

  it("adds up to +3 for many steps and +2 for many sections", () => {
    // 4 sections × 20 steps = 80 steps → +3 step bonus, 4 sections → +1 bonus
    const big = { sections: sections([20, 20, 20, 20]) };
    expect(calculatePatternComplexity(big, "Scarf")).toBe(3 + 3 + 1);
  });

  it("clamps to the 1–10 range", () => {
    const huge = { sections: sections(Array(12).fill(30)) };
    expect(calculatePatternComplexity(huge, "Blanket")).toBe(10);
    const tiny = { sections: sections([1]) };
    expect(calculatePatternComplexity(tiny, "Scarf")).toBeGreaterThanOrEqual(1);
  });
});

describe("extractColorMentions", () => {
  it("finds colours in title, description and section names", () => {
    const p = {
      title: "Pink Strawberry",
      description: "with a cream base",
      sections: [{ name: "Teal leaves" }],
    };
    expect(extractColorMentions(p).sort()).toEqual(["cream", "pink", "teal"]);
  });

  it("matches whole words only", () => {
    // "tan" inside "stand", "red" inside "bordered" must not match.
    const p = { title: "A standing bordered piece", description: "", sections: [] };
    expect(extractColorMentions(p)).toEqual([]);
  });

  it("returns empty for no mentions", () => {
    expect(extractColorMentions({ title: "Bunny", description: "", sections: [] })).toEqual([]);
  });
});

describe("generateDefaultYarnRequirements", () => {
  it("returns at least one requirement with a volume estimate", () => {
    const reqs = generateDefaultYarnRequirements({ title: "Bunny", sections: [] }, "Toy", 5);
    expect(reqs.length).toBeGreaterThanOrEqual(1);
    expect(reqs[0].volume).toBeTruthy();
    expect(reqs[0].color).toBeTruthy();
  });

  it("uses detected colours when the pattern mentions them", () => {
    const p = { title: "Pink and cream bunny", description: "", sections: [] };
    const reqs = generateDefaultYarnRequirements(p, "Toy", 5);
    const colors = reqs.map((r) => r.color.toLowerCase()).join(" ");
    expect(colors).toMatch(/pink|cream/);
  });

  it("estimates more yarn for blankets than for scarves", () => {
    const grams = (volume: string) => {
      const m = volume.match(/(\d+)\s*g/i);
      return m ? parseInt(m[1], 10) : 0;
    };
    const blanket = generateDefaultYarnRequirements({ title: "x", sections: [] }, "Blanket", 5);
    const scarf = generateDefaultYarnRequirements({ title: "x", sections: [] }, "Scarf", 5);
    const total = (reqs: { volume: string }[]) => reqs.reduce((a, r) => a + grams(r.volume), 0);
    expect(total(blanket)).toBeGreaterThan(total(scarf));
  });
});
