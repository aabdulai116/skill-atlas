import { DOMAINS } from "@/data/skills";
import type { DomainId, Skill } from "@/data/types";
import { computeDepths } from "@/lib/graph";

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 92;
export const COLUMN_GAP = 300;
export const ROW_GAP = 112;
export const HEADER_OFFSET = 70;

export interface Position {
  x: number;
  y: number;
}

/** Places skills in one column per domain, ordered by prerequisite depth within each column. */
export function layoutSkills(skills: Skill[]): {
  positions: Record<string, Position>;
  columns: { domain: DomainId; x: number }[];
} {
  const depth = computeDepths(skills);
  const order = new Map(skills.map((s, i) => [s.id, i]));
  const positions: Record<string, Position> = {};
  const columns = DOMAINS.map((d, col) => {
    const x = col * COLUMN_GAP;
    skills
      .filter((s) => s.domain === d.id)
      .sort((a, b) => depth[a.id] - depth[b.id] || order.get(a.id)! - order.get(b.id)!)
      .forEach((s, row) => {
        positions[s.id] = { x, y: HEADER_OFFSET + row * ROW_GAP };
      });
    return { domain: d.id, x };
  });
  return { positions, columns };
}
