import { describe, it, expect } from "vitest";
import { isMaterialsSection } from "../../shared/sections";

describe("isMaterialsSection", () => {
  it("matches the canonical name and case/spacing variants", () => {
    expect(isMaterialsSection("Materials")).toBe(true);
    expect(isMaterialsSection("materials")).toBe(true);
    expect(isMaterialsSection("MATERIALS")).toBe(true);
    expect(isMaterialsSection("  Materials  ")).toBe(true);
    expect(isMaterialsSection("Material")).toBe(true); // singular
  });

  it("matches AI/free-text variants that would otherwise inflate the denominator", () => {
    expect(isMaterialsSection("Materials & Tools")).toBe(true);
    expect(isMaterialsSection("Materials list")).toBe(true);
    expect(isMaterialsSection("Materials & Notions")).toBe(true);
  });

  it("does not match crochet sections", () => {
    expect(isMaterialsSection("Body")).toBe(false);
    expect(isMaterialsSection("Round 1")).toBe(false);
    expect(isMaterialsSection("Magic ring")).toBe(false);
    expect(isMaterialsSection("Edging")).toBe(false);
  });

  it("is null/undefined/empty safe", () => {
    expect(isMaterialsSection(undefined)).toBe(false);
    expect(isMaterialsSection(null)).toBe(false);
    expect(isMaterialsSection("")).toBe(false);
    expect(isMaterialsSection("   ")).toBe(false);
  });
});
