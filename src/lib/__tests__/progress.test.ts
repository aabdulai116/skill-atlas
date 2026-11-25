import { describe, expect, it } from "vitest";
import {
  aggregateProgress,
  computeStatuses,
  isCompleted,
  isUnlocked,
  skillProgress,
  skillStatus,
  toPercent,
} from "../progress";
import { byId, makeSkill } from "./fixtures";

const a = makeSkill("a");
const b = makeSkill("b", ["a"]);
const c = makeSkill("c", ["a", "b"]);
const skills = [a, b, c];
const index = byId(skills);
const ALL = ["a", "b", "c", "d"];

describe("skillProgress", () => {
  it("is the fraction of subtopics checked", () => {
    expect(skillProgress(a, {})).toBe(0);
    expect(skillProgress(a, { a: ["a"] })).toBe(0.25);
    expect(skillProgress(a, { a: ALL })).toBe(1);
  });

  it("ignores checked items that are not current subtopics", () => {
    expect(skillProgress(a, { a: ["a", "renamed-topic"] })).toBe(0.25);
  });

  it("is 0 for a skill without subtopics", () => {
    expect(skillProgress(makeSkill("x", [], { subtopics: [] }), { x: ["a"] })).toBe(0);
  });
});

describe("isCompleted", () => {
  it("requires every subtopic to be checked", () => {
    expect(isCompleted(a, { a: ["a", "b", "c"] })).toBe(false);
    expect(isCompleted(a, { a: ALL })).toBe(true);
  });
});

describe("unlock logic", () => {
  it("unlocks skills with no prerequisites", () => {
    expect(isUnlocked(a, {}, index)).toBe(true);
  });

  it("keeps a skill locked until all prerequisites are completed", () => {
    expect(isUnlocked(c, {}, index)).toBe(false);
    expect(isUnlocked(c, { a: ALL }, index)).toBe(false);
    expect(isUnlocked(c, { a: ALL, b: ["a", "b"] }, index)).toBe(false);
    expect(isUnlocked(c, { a: ALL, b: ALL }, index)).toBe(true);
  });

  it("treats an unknown prerequisite as not completed", () => {
    const orphan = makeSkill("orphan", ["missing"]);
    expect(isUnlocked(orphan, {}, byId([orphan]))).toBe(false);
  });

  it("re-locks a skill when a prerequisite is unchecked", () => {
    expect(skillStatus(b, { a: ALL }, index)).toBe("available");
    expect(skillStatus(b, { a: ["a", "b", "c"] }, index)).toBe("locked");
  });
});

describe("skillStatus", () => {
  it("derives locked / available / in-progress / completed", () => {
    expect(computeStatuses(skills, {}, index)).toEqual({ a: "available", b: "locked", c: "locked" });
    expect(computeStatuses(skills, { a: ["a"] }, index)).toEqual({ a: "in-progress", b: "locked", c: "locked" });
    expect(computeStatuses(skills, { a: ALL, b: ["a"] }, index)).toEqual({
      a: "completed",
      b: "in-progress",
      c: "locked",
    });
    expect(computeStatuses(skills, { a: ALL, b: ALL, c: ALL }, index)).toEqual({
      a: "completed",
      b: "completed",
      c: "completed",
    });
  });
});

describe("aggregateProgress", () => {
  it("weights by subtopic count", () => {
    const small = makeSkill("small", [], { subtopics: ["x", "y"] });
    expect(aggregateProgress([a, small], { small: ["x", "y"] })).toBeCloseTo(2 / 6);
  });

  it("is 0 for an empty list", () => {
    expect(aggregateProgress([], {})).toBe(0);
  });

  it("rounds to whole percents", () => {
    expect(toPercent(1 / 3)).toBe(33);
    expect(toPercent(1)).toBe(100);
  });
});
