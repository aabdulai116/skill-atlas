import { describe, expect, it } from "vitest";
import { topologicalSort, transitivePrerequisites } from "../graph";
import { generatePlan, remainingHours } from "../plan";
import { byId, makeSkill } from "./fixtures";

const ALL = ["a", "b", "c", "d"];
const start = new Date(2026, 0, 5);

describe("topologicalSort", () => {
  it("puts prerequisites before dependents and keeps input order for ties", () => {
    const skills = [makeSkill("c", ["a", "b"]), makeSkill("b", ["a"]), makeSkill("a"), makeSkill("z")];
    expect(topologicalSort(["c", "b", "a", "z"], byId(skills))).toEqual(["a", "b", "c", "z"]);
  });

  it("ignores prerequisites outside the given set", () => {
    const skills = [makeSkill("a"), makeSkill("b", ["a"])];
    expect(topologicalSort(["b"], byId(skills))).toEqual(["b"]);
  });

  it("throws on cycles", () => {
    const skills = [makeSkill("a", ["b"]), makeSkill("b", ["a"])];
    expect(() => topologicalSort(["a", "b"], byId(skills))).toThrow(/cycle/);
  });
});

describe("transitivePrerequisites", () => {
  it("collects indirect prerequisites", () => {
    const skills = [makeSkill("a"), makeSkill("b", ["a"]), makeSkill("c", ["b"])];
    expect([...transitivePrerequisites(["c"], byId(skills))].sort()).toEqual(["a", "b"]);
  });
});

describe("remainingHours", () => {
  it("scales estimated hours by unchecked subtopics", () => {
    const s = makeSkill("a", [], { estimatedHours: 20 });
    expect(remainingHours(s, {})).toBe(20);
    expect(remainingHours(s, { a: ["a"] })).toBe(15);
    expect(remainingHours(s, { a: ALL })).toBe(0);
  });
});

describe("generatePlan", () => {
  const skills = [
    makeSkill("a", [], { estimatedHours: 6 }),
    makeSkill("b", ["a"], { estimatedHours: 8 }),
    makeSkill("c", ["b"], { estimatedHours: 4 }),
    makeSkill("x", [], { estimatedHours: 100 }),
  ];

  it("schedules remaining skills in topological order and packs weeks by hours", () => {
    const plan = generatePlan({ pathSkillIds: ["c", "b", "a"], skills, checked: {}, hoursPerWeek: 10, startDate: start });
    expect(plan.order).toEqual(["a", "b", "c"]);
    expect(plan.totalHours).toBe(18);
    expect(plan.weeks.map((w) => w.hours)).toEqual([10, 8]);
    expect(plan.weeks[0].items).toEqual([
      { skillId: "a", hours: 6, offPath: false, continued: false, finishes: true },
      { skillId: "b", hours: 4, offPath: false, continued: false, finishes: false },
    ]);
    expect(plan.weeks[1].items).toEqual([
      { skillId: "b", hours: 4, offPath: false, continued: true, finishes: true },
      { skillId: "c", hours: 4, offPath: false, continued: false, finishes: true },
    ]);
  });

  it("starts each week 7 days after the previous one", () => {
    const plan = generatePlan({ pathSkillIds: ["a", "b", "c"], skills, checked: {}, hoursPerWeek: 5, startDate: start });
    expect(plan.weeks).toHaveLength(4);
    expect(plan.weeks[1].start).toEqual(new Date(2026, 0, 12));
    expect(plan.weeks[3].start).toEqual(new Date(2026, 0, 26));
  });

  it("skips completed skills and shortens partly done ones", () => {
    const plan = generatePlan({
      pathSkillIds: ["a", "b", "c"],
      skills,
      checked: { a: ALL, b: ["a", "b"] },
      hoursPerWeek: 10,
      startDate: start,
    });
    expect(plan.order).toEqual(["b", "c"]);
    expect(plan.totalHours).toBe(8);
    expect(plan.weeks).toHaveLength(1);
  });

  it("includes uncompleted off-path prerequisites and flags them", () => {
    const plan = generatePlan({ pathSkillIds: ["c"], skills, checked: {}, hoursPerWeek: 40, startDate: start });
    expect(plan.order).toEqual(["a", "b", "c"]);
    expect(plan.weeks[0].items.map((i) => [i.skillId, i.offPath])).toEqual([
      ["a", true],
      ["b", true],
      ["c", false],
    ]);
  });

  it("returns an empty plan when the path is complete", () => {
    const plan = generatePlan({ pathSkillIds: ["a"], skills, checked: { a: ALL }, hoursPerWeek: 10, startDate: start });
    expect(plan.weeks).toEqual([]);
    expect(plan.totalHours).toBe(0);
  });

  it("rejects non-positive hours per week", () => {
    expect(() =>
      generatePlan({ pathSkillIds: ["a"], skills, checked: {}, hoursPerWeek: 0, startDate: start }),
    ).toThrow();
  });
});
