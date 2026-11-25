import type { Skill } from "@/data/types";
import { addDays } from "./dates";
import { transitivePrerequisites, topologicalSort } from "./graph";
import { isCompleted, skillProgress, type CheckedMap } from "./progress";

export interface PlanItem {
  skillId: string;
  /** Hours of this skill scheduled in this week. */
  hours: number;
  /** True when this skill is not on the path but is a prerequisite of a path skill. */
  offPath: boolean;
  /** True when the skill continues from a previous week. */
  continued: boolean;
  /** True when the skill finishes in this week. */
  finishes: boolean;
}

export interface PlanWeek {
  index: number;
  start: Date;
  items: PlanItem[];
  hours: number;
}

export interface StudyPlan {
  weeks: PlanWeek[];
  totalHours: number;
  /** Ordered skill ids that are scheduled (path skills plus missing prerequisites). */
  order: string[];
}

export interface PlanInput {
  pathSkillIds: string[];
  skills: Skill[];
  checked: CheckedMap;
  hoursPerWeek: number;
  startDate: Date;
}

const EPSILON = 1e-9;

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Hours still needed for a skill, scaled by how many subtopics remain. */
export function remainingHours(skill: Skill, checked: CheckedMap): number {
  return skill.estimatedHours * (1 - skillProgress(skill, checked));
}

/**
 * Builds a week-by-week plan for the uncompleted skills on a path. Uncompleted prerequisites
 * that are off the path are included so every scheduled skill is unlocked by the time it starts.
 * Skills are ordered topologically and packed sequentially into weeks of `hoursPerWeek`.
 */
export function generatePlan({
  pathSkillIds,
  skills,
  checked,
  hoursPerWeek,
  startDate,
}: PlanInput): StudyPlan {
  if (!(hoursPerWeek > 0)) throw new Error("hoursPerWeek must be greater than 0.");
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const onPath = new Set(pathSkillIds);
  const needed = new Set([...pathSkillIds, ...transitivePrerequisites(pathSkillIds, byId)]);
  const remaining = skills
    .filter((s) => needed.has(s.id) && !isCompleted(s, checked))
    .map((s) => s.id);
  const order = topologicalSort(remaining, byId);

  const weeks: PlanWeek[] = [];
  let current: PlanWeek | null = null;
  const newWeek = (): PlanWeek => {
    const w = { index: weeks.length + 1, start: addDays(startDate, weeks.length * 7), items: [], hours: 0 };
    weeks.push(w);
    return w;
  };

  let totalHours = 0;
  for (const id of order) {
    let left = remainingHours(byId[id], checked);
    totalHours += left;
    let continued = false;
    while (left > EPSILON) {
      if (!current || hoursPerWeek - current.hours <= EPSILON) current = newWeek();
      const chunk = Math.min(left, hoursPerWeek - current.hours);
      left -= chunk;
      current.hours += chunk;
      current.items.push({
        skillId: id,
        hours: round(chunk),
        offPath: !onPath.has(id),
        continued,
        finishes: left <= EPSILON,
      });
      continued = true;
    }
  }
  for (const w of weeks) w.hours = round(w.hours);
  return { weeks, totalHours: round(totalHours), order };
}
