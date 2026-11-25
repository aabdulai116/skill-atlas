import { describe, expect, it } from "vitest";
import { PATHS } from "@/data/paths";
import { DOMAINS, SKILL_BY_ID, SKILLS } from "@/data/skills";
import { topologicalSort } from "../graph";

describe("skill data", () => {
  it("has unique ids", () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
  });

  it("references only existing prerequisites and domains", () => {
    const domains = new Set(DOMAINS.map((d) => d.id));
    for (const s of SKILLS) {
      expect(domains.has(s.domain), s.id).toBe(true);
      for (const p of s.prerequisites) expect(SKILL_BY_ID[p], `${s.id} -> ${p}`).toBeDefined();
    }
  });

  it("has no prerequisite cycles", () => {
    expect(() => topologicalSort(SKILLS.map((s) => s.id), SKILL_BY_ID)).not.toThrow();
  });

  it("gives every skill subtopics, hours and a project", () => {
    for (const s of SKILLS) {
      expect(s.subtopics.length, s.id).toBeGreaterThan(0);
      expect(new Set(s.subtopics).size, s.id).toBe(s.subtopics.length);
      expect(s.estimatedHours, s.id).toBeGreaterThan(0);
      expect(s.project.length, s.id).toBeGreaterThan(0);
    }
  });

  it("has only valid, unique skill ids in career paths", () => {
    for (const p of PATHS) {
      expect(new Set(p.skills).size, p.id).toBe(p.skills.length);
      for (const id of p.skills) expect(SKILL_BY_ID[id], `${p.id}: ${id}`).toBeDefined();
    }
  });

  it("uses https URLs for resources", () => {
    for (const s of SKILLS) for (const r of s.resources) expect(r.url, s.id).toMatch(/^https:\/\//);
  });
});
