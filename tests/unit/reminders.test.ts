import { describe, it, expect } from "vitest";
import {
  localNow, dailyDue, lastActivity, pickInactiveProject, inactiveDue, daysSince,
  type ReminderPrefs, type ActivityPattern,
} from "../../server/reminderLogic";

const prefs = (over: Partial<ReminderPrefs>): ReminderPrefs => ({
  dailyEnabled: false, dailyTime: "18:00", timezone: "UTC", inactiveEnabled: false, ...over,
});

const pat = (over: Partial<ActivityPattern>): ActivityPattern => ({
  id: "p", title: "Scarf", status: "active", createdAt: "2026-01-01T00:00:00Z", ...over,
});

describe("localNow", () => {
  it("converts a UTC instant into local date + minutes for a timezone", () => {
    // 2026-06-21T02:30:00Z is 2026-06-20 at 22:30 in New York (UTC-4 in June).
    const { date, minutes } = localNow(new Date("2026-06-21T02:30:00Z"), "America/New_York");
    expect(date).toBe("2026-06-20");
    expect(minutes).toBe(22 * 60 + 30);
  });

  it("falls back to UTC for an unknown timezone instead of throwing", () => {
    const { date } = localNow(new Date("2026-06-21T10:00:00Z"), "Not/AZone");
    expect(date).toBe("2026-06-21");
  });
});

describe("dailyDue", () => {
  const at = (utc: string) => new Date(utc);
  it("fires once the local time reaches the chosen time", () => {
    const p = prefs({ dailyEnabled: true, dailyTime: "18:00", timezone: "UTC" });
    expect(dailyDue(p, at("2026-06-21T17:59:00Z"))).toBe(false);
    expect(dailyDue(p, at("2026-06-21T18:00:00Z"))).toBe(true);
    expect(dailyDue(p, at("2026-06-21T21:00:00Z"))).toBe(true);
  });

  it("does not fire twice on the same local day", () => {
    const p = prefs({ dailyEnabled: true, dailyTime: "18:00", timezone: "UTC", lastDailySentOn: "2026-06-21" });
    expect(dailyDue(p, at("2026-06-21T19:00:00Z"))).toBe(false);
    // next day it's due again
    expect(dailyDue(p, at("2026-06-22T18:00:00Z"))).toBe(true);
  });

  it("is never due when disabled", () => {
    expect(dailyDue(prefs({ dailyEnabled: false, dailyTime: "00:00" }), at("2026-06-21T12:00:00Z"))).toBe(false);
  });
});

describe("lastActivity", () => {
  it("uses the latest work session end, else createdAt", () => {
    const worked = pat({
      createdAt: "2026-01-01T00:00:00Z",
      workSessions: [{ end: "2026-06-01T10:00:00Z" }, { end: "2026-06-10T10:00:00Z" }],
    });
    expect(lastActivity(worked)).toBe(Date.parse("2026-06-10T10:00:00Z"));
    expect(lastActivity(pat({ workSessions: [] }))).toBe(Date.parse("2026-01-01T00:00:00Z"));
  });
});

describe("pickInactiveProject", () => {
  const now = new Date("2026-06-21T12:00:00Z");
  it("returns the most-recent active project once it has gone quiet past the threshold", () => {
    const stale = pat({ id: "a", title: "Old", workSessions: [{ end: "2026-06-01T12:00:00Z" }] }); // ~20d
    const staler = pat({ id: "b", title: "Older", workSessions: [{ end: "2026-05-01T12:00:00Z" }] });
    const got = pickInactiveProject([staler, stale], now, 4);
    expect(got?.id).toBe("a"); // most recently worked of the quiet ones
  });

  it("returns null when the latest project is still warm", () => {
    const warm = pat({ id: "a", workSessions: [{ end: "2026-06-20T12:00:00Z" }] }); // 1 day ago
    expect(pickInactiveProject([warm], now, 4)).toBeNull();
  });

  it("ignores finished/non-active patterns", () => {
    const done = pat({ id: "d", status: "finished", workSessions: [{ end: "2026-01-01T12:00:00Z" }] });
    expect(pickInactiveProject([done], now, 4)).toBeNull();
  });
});

describe("inactiveDue", () => {
  const now = new Date("2026-06-21T12:00:00Z");
  it("is due when enabled and never sent before", () => {
    expect(inactiveDue(prefs({ inactiveEnabled: true }), now)).toBe(true);
  });
  it("respects the minimum gap between nudges", () => {
    expect(inactiveDue(prefs({ inactiveEnabled: true, lastInactiveSentOn: "2026-06-20" }), now, 3)).toBe(false);
    expect(inactiveDue(prefs({ inactiveEnabled: true, lastInactiveSentOn: "2026-06-10" }), now, 3)).toBe(true);
  });
  it("is never due when disabled", () => {
    expect(inactiveDue(prefs({ inactiveEnabled: false }), now)).toBe(false);
  });
});

describe("daysSince", () => {
  it("reports whole days, at least 1", () => {
    const now = new Date("2026-06-21T12:00:00Z");
    expect(daysSince(Date.parse("2026-06-15T12:00:00Z"), now)).toBe(6);
    expect(daysSince(now.getTime(), now)).toBe(1);
  });
});
