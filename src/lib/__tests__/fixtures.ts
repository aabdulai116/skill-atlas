import type { Skill } from "@/data/types";

export function makeSkill(id: string, prerequisites: string[] = [], overrides: Partial<Skill> = {}): Skill {
  return {
    id,
    name: id.toUpperCase(),
    domain: "programming",
    description: "",
    subtopics: ["a", "b", "c", "d"],
    prerequisites,
    estimatedHours: 10,
    project: "",
    resources: [],
    ...overrides,
  };
}

export function byId(skills: Skill[]): Record<string, Skill> {
  return Object.fromEntries(skills.map((s) => [s.id, s]));
}
