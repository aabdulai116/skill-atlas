import type { Skill } from "@/data/types";

export type SkillStatus = "locked" | "available" | "in-progress" | "completed";

/** Checked subtopics per skill id. */
export type CheckedMap = Record<string, string[]>;

export function checkedCount(skill: Skill, checked: CheckedMap): number {
  const done = new Set(checked[skill.id] ?? []);
  return skill.subtopics.filter((t) => done.has(t)).length;
}

/** Fraction 0..1 of a skill's subtopics that are checked. */
export function skillProgress(skill: Skill, checked: CheckedMap): number {
  if (skill.subtopics.length === 0) return 0;
  return checkedCount(skill, checked) / skill.subtopics.length;
}

export function isCompleted(skill: Skill, checked: CheckedMap): boolean {
  return skill.subtopics.length > 0 && checkedCount(skill, checked) === skill.subtopics.length;
}

/** A skill is unlocked when every prerequisite is completed. */
export function isUnlocked(
  skill: Skill,
  checked: CheckedMap,
  skillsById: Record<string, Skill>,
): boolean {
  return skill.prerequisites.every((id) => {
    const prereq = skillsById[id];
    return prereq !== undefined && isCompleted(prereq, checked);
  });
}

export function skillStatus(
  skill: Skill,
  checked: CheckedMap,
  skillsById: Record<string, Skill>,
): SkillStatus {
  if (isCompleted(skill, checked)) return "completed";
  if (!isUnlocked(skill, checked, skillsById)) return "locked";
  return checkedCount(skill, checked) > 0 ? "in-progress" : "available";
}

export function computeStatuses(
  skills: Skill[],
  checked: CheckedMap,
  skillsById: Record<string, Skill>,
): Record<string, SkillStatus> {
  return Object.fromEntries(skills.map((s) => [s.id, skillStatus(s, checked, skillsById)]));
}

/**
 * Progress across a set of skills, weighted by subtopic count so partially done skills count.
 * Returns a fraction 0..1.
 */
export function aggregateProgress(skills: Skill[], checked: CheckedMap): number {
  let total = 0;
  let done = 0;
  for (const s of skills) {
    total += s.subtopics.length;
    done += checkedCount(s, checked);
  }
  return total === 0 ? 0 : done / total;
}

export function toPercent(fraction: number): number {
  return Math.round(fraction * 100);
}
