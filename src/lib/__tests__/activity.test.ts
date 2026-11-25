import { describe, expect, it } from "vitest";
import { buildHeatmap, recruitingCountdown, weeklyStreak } from "../activity";

// Wednesday, 2026-01-14. Weeks start on Monday.
const today = new Date(2026, 0, 14);

describe("weeklyStreak", () => {
  it("counts consecutive active weeks ending this week", () => {
    expect(weeklyStreak({ "2026-01-13": 1, "2026-01-06": 2, "2025-12-29": 1 }, today)).toBe(3);
  });

  it("counts from last week when this week has no activity yet", () => {
    expect(weeklyStreak({ "2026-01-05": 1, "2025-12-31": 1 }, today)).toBe(2);
  });

  it("breaks on a gap week", () => {
    expect(weeklyStreak({ "2026-01-12": 1, "2025-12-30": 1 }, today)).toBe(1);
  });

  it("is 0 with no recent activity", () => {
    expect(weeklyStreak({ "2025-11-01": 3 }, today)).toBe(0);
  });
});

describe("buildHeatmap", () => {
  it("returns Monday-first columns ending with the current week", () => {
    const map = buildHeatmap({ "2026-01-14": 4, "2026-01-12": 1 }, today, 2);
    expect(map).toHaveLength(2);
    expect(map[1][0].date).toBe("2026-01-12");
    expect(map[1][2]).toMatchObject({ date: "2026-01-14", count: 4, level: 4, future: false });
    expect(map[1][0].level).toBe(1);
    expect(map[1][3].future).toBe(true);
  });
});

describe("recruitingCountdown", () => {
  it("computes weeks left and skills per week", () => {
    const c = recruitingCountdown("2026-03-11", today, 16);
    expect(c.daysLeft).toBe(56);
    expect(c.weeksLeft).toBe(8);
    expect(c.skillsPerWeek).toBe(2);
  });

  it("returns Infinity pace when the date has passed", () => {
    const c = recruitingCountdown("2026-01-01", today, 3);
    expect(c.weeksLeft).toBe(0);
    expect(c.skillsPerWeek).toBe(Number.POSITIVE_INFINITY);
  });

  it("needs 0 skills per week when nothing is left", () => {
    expect(recruitingCountdown("2026-03-11", today, 0).skillsPerWeek).toBe(0);
  });
});
