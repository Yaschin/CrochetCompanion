import { describe, it, expect } from "vitest";
import { computeStreak } from "../../client/src/lib/activityLog";

const TODAY = "2026-06-17";

describe("computeStreak", () => {
  it("returns zeros for no activity", () => {
    expect(computeStreak([], TODAY)).toEqual({
      current: 0,
      longest: 0,
      totalDays: 0,
      activeToday: false,
    });
  });

  it("counts today as a streak of 1 and marks activeToday", () => {
    expect(computeStreak([TODAY], TODAY)).toEqual({
      current: 1,
      longest: 1,
      totalDays: 1,
      activeToday: true,
    });
  });

  it("keeps the streak on the grace day (last activity was yesterday)", () => {
    const s = computeStreak(["2026-06-16"], TODAY);
    expect(s.current).toBe(1);
    expect(s.activeToday).toBe(false);
  });

  it("breaks the current streak after a gap of more than one day", () => {
    const s = computeStreak(["2026-06-15"], TODAY); // two days ago
    expect(s.current).toBe(0);
    expect(s.activeToday).toBe(false);
    expect(s.totalDays).toBe(1);
  });

  it("counts a consecutive run ending today", () => {
    const s = computeStreak(["2026-06-15", "2026-06-16", "2026-06-17"], TODAY);
    expect(s).toEqual({ current: 3, longest: 3, totalDays: 3, activeToday: true });
  });

  it("counts a consecutive run ending yesterday (grace)", () => {
    const s = computeStreak(["2026-06-14", "2026-06-15", "2026-06-16"], TODAY);
    expect(s.current).toBe(3);
    expect(s.activeToday).toBe(false);
  });

  it("reports the longest past run even when the current streak is broken", () => {
    const s = computeStreak(
      ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-10"],
      TODAY,
    );
    expect(s.longest).toBe(3);
    expect(s.current).toBe(0); // last activity (06-10) is a week ago
    expect(s.totalDays).toBe(4);
  });

  it("dedupes and tolerates unsorted input", () => {
    const s = computeStreak(["2026-06-17", "2026-06-16", "2026-06-16"], TODAY);
    expect(s.totalDays).toBe(2);
    expect(s.current).toBe(2);
    expect(s.activeToday).toBe(true);
  });
});
