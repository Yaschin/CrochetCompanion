import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatClock,
  totalMs,
  makeSession,
  mergeSessions,
  lifetimeMs,
  estimateForType,
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

describe("mergeSessions", () => {
  const s = (start: string, ms = 1000): WorkSession => ({ start, end: start, ms });

  it("unions two lists newest-first, de-duping the same session by start", () => {
    const local = [s("2026-01-01T10:00:00.000Z"), s("2026-01-03T10:00:00.000Z")];
    const remote = [s("2026-01-02T10:00:00.000Z"), s("2026-01-03T10:00:00.000Z")]; // dup of local
    expect(mergeSessions(remote, local).map((x) => x.start)).toEqual([
      "2026-01-03T10:00:00.000Z",
      "2026-01-02T10:00:00.000Z",
      "2026-01-01T10:00:00.000Z",
    ]);
  });

  it("drops malformed/empty-start sessions and tolerates empty inputs", () => {
    const merged = mergeSessions(
      [s("2026-01-01T10:00:00.000Z")],
      [{ start: "", end: "", ms: 5 } as WorkSession, { start: "x", end: "", ms: 0 } as WorkSession],
    );
    expect(merged).toHaveLength(1);
    expect(mergeSessions([], [])).toEqual([]);
  });
});

describe("lifetimeMs", () => {
  it("sums tracked time across projects, tolerating missing sessions", () => {
    expect(
      lifetimeMs([
        { workSessions: [{ start: "", end: "", ms: 1000 }, { start: "", end: "", ms: 2000 }] },
        { workSessions: [{ start: "", end: "", ms: 500 }] },
        {}, // no workSessions
      ])
    ).toBe(3500);
    expect(lifetimeMs([])).toBe(0);
  });
});

describe("estimateForType", () => {
  // A finished project of `type` with a single session of `ms` tracked time.
  const finished = (projectType: string, ms: number) => ({
    projectType,
    status: "finished",
    workSessions: ms > 0 ? [{ start: "s", end: "e", ms }] : [],
  });

  it("averages tracked time over finished projects of that type", () => {
    const est = estimateForType(
      [finished("Hat", 4 * 3_600_000), finished("Hat", 6 * 3_600_000)],
      "Hat",
    );
    expect(est).toEqual({ projectType: "Hat", sampleCount: 2, averageMs: 5 * 3_600_000 });
  });

  it("withholds an estimate until there are at least minSamples points", () => {
    expect(estimateForType([finished("Hat", 3_600_000)], "Hat")).toBeNull();   // only 1
    expect(estimateForType([], "Hat")).toBeNull();                              // none
    // A custom threshold is honoured.
    expect(estimateForType([finished("Hat", 1000), finished("Hat", 3000)], "Hat", 3)).toBeNull();
  });

  it("ignores non-finished projects and finished ones with no tracked time", () => {
    const est = estimateForType(
      [
        finished("Hat", 2_000),
        finished("Hat", 4_000),
        { projectType: "Hat", status: "active", workSessions: [{ start: "s", end: "e", ms: 999_999 }] }, // not finished
        finished("Hat", 0), // finished but never timed → excluded, doesn't drag toward 0
      ],
      "Hat",
    );
    expect(est).toEqual({ projectType: "Hat", sampleCount: 2, averageMs: 3_000 });
  });

  it("only counts the requested type, matching case-insensitively and trimmed", () => {
    const patterns = [
      finished("hat", 2_000),
      finished("  HAT ", 4_000),
      finished("Scarf", 10_000),
    ];
    const est = estimateForType(patterns, "Hat");
    expect(est).toEqual({ projectType: "Hat", sampleCount: 2, averageMs: 3_000 });
  });

  it("returns null for an empty type and tolerates missing fields", () => {
    expect(estimateForType([finished("Hat", 1), finished("Hat", 2)], "")).toBeNull();
    expect(estimateForType([{}, { status: "finished" }], "Hat")).toBeNull();
  });
});
