import type { Skill } from "@/data/types";

/** Every prerequisite (direct or indirect) of the given skill ids, excluding the ids themselves. */
export function transitivePrerequisites(
  ids: Iterable<string>,
  skillsById: Record<string, Skill>,
): Set<string> {
  const start = new Set(ids);
  const seen = new Set<string>();
  const stack = [...start];
  while (stack.length) {
    const skill = skillsById[stack.pop()!];
    if (!skill) continue;
    for (const p of skill.prerequisites) {
      if (!seen.has(p)) {
        seen.add(p);
        stack.push(p);
      }
    }
  }
  for (const id of start) seen.delete(id);
  return seen;
}

/**
 * Topologically sorts `ids` using prerequisite edges among them (Kahn's algorithm).
 * Ties are broken by the order given in `ids`, so output is deterministic.
 * Throws if the prerequisites contain a cycle.
 */
export function topologicalSort(ids: string[], skillsById: Record<string, Skill>): string[] {
  const included = new Set(ids);
  const order = new Map(ids.map((id, i) => [id, i]));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const id of ids) {
    indegree.set(id, 0);
    dependents.set(id, []);
  }
  for (const id of ids) {
    for (const p of skillsById[id]?.prerequisites ?? []) {
      if (!included.has(p)) continue;
      indegree.set(id, indegree.get(id)! + 1);
      dependents.get(p)!.push(id);
    }
  }
  const ready = ids.filter((id) => indegree.get(id) === 0);
  const result: string[] = [];
  while (ready.length) {
    ready.sort((a, b) => order.get(a)! - order.get(b)!);
    const id = ready.shift()!;
    result.push(id);
    for (const d of dependents.get(id)!) {
      const n = indegree.get(d)! - 1;
      indegree.set(d, n);
      if (n === 0) ready.push(d);
    }
  }
  if (result.length !== ids.length) {
    const stuck = ids.filter((id) => !result.includes(id));
    throw new Error(`Prerequisite cycle detected among: ${stuck.join(", ")}`);
  }
  return result;
}

/** Longest prerequisite chain length below each skill (0 for skills with no prerequisites). */
export function computeDepths(skills: Skill[]): Record<string, number> {
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const depth: Record<string, number> = {};
  for (const id of topologicalSort(
    skills.map((s) => s.id),
    byId,
  )) {
    const prereqs = byId[id].prerequisites.filter((p) => p in byId);
    depth[id] = prereqs.length ? Math.max(...prereqs.map((p) => depth[p])) + 1 : 0;
  }
  return depth;
}
