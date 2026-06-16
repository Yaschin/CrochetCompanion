import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatClock,
  totalMs,
  makeSession,
  type WorkSession,
} from "../../client/src/lib/timeTracking";

describe("formatDuration", () => {
  it("formats hours, minutes and seconds for totals", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(60_000)).toBe("1m");
    expect(formatDuration(23 * 60_000)).toBe("23m");
    expect(formatDuration(83 * 60_000)).toBe("1h 23m");
    expect(formatDuration(2 * 3_600_000)).toBe("2h 0m");
  });

  it("treats invalid or non-positive input as 0m", () => {
    expect(formatDuration(-5)).toBe("0m");
    expect(formatDuration(NaN)).toBe("0m");
  });
});

describe("formatClock", () => {
  it("renders a stopwatch face, growing to H:MM:SS past an hour", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9_000)).toBe("0:09");
    expect(formatClock(90_000)).toBe("1:30");
    expect(formatClock(65 * 60_000 + 9_000)).toBe("1:05:09");
  });

  it("clamps invalid input to 0:00", () => {
    expect(formatClock(NaN)).toBe("0:00");
    expect(formatClock(-1000)).toBe("0:00");
  });
});

describe("totalMs", () => {
  it("sums valid session durations and ignores malformed ones", () => {
    const sessions = [
      { start: "", end: "", ms: 1000 },
      { start: "", end: "", ms: 2000 },
      { start: "", end: "", ms: -5 },          // negative → ignored
      { ms: NaN } as unknown as WorkSession,    // NaN → ignored
    ];
    expect(totalMs(sessions)).toBe(3000);
    expect(totalMs([])).toBe(0);
  });
});

describe("makeSession", () => {
  it("builds an ISO-stamped session from a positive span", () => {
    const start = Date.UTC(2026, 0, 1, 10, 0, 0);
    const end = Date.UTC(2026, 0, 1, 10, 30, 0);
    const s = makeSession(start, end);
    expect(s).not.toBeNull();
    expect(s!.ms).toBe(30 * 60_000);
    expect(s!.start).toBe(new Date(start).toISOString());
    expect(s!.end).toBe(new Date(end).toISOString());
  });

  it("returns null for a zero/negative span or invalid input", () => {
    const t = Date.now();
    expect(makeSession(t, t)).toBeNull();
    expect(makeSession(t, t - 1000)).toBeNull();
    expect(makeSession(NaN, t)).toBeNull();
  });
});
