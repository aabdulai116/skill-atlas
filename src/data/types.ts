export type DomainId =
  | "programming"
  | "dsa"
  | "cs-core"
  | "frontend"
  | "backend"
  | "cloud"
  | "ai"
  | "quant"
  | "career";

export interface Domain {
  id: DomainId;
  name: string;
  /** Hex color used for badges, minimap and accents. */
  color: string;
}

export type ResourceLevel = "beginner" | "intermediate" | "advanced";
export type ResourceType = "video" | "course" | "article" | "book" | "docs" | "practice";

export interface Resource {
  title: string;
  url: string;
  level: ResourceLevel;
  type: ResourceType;
}

export interface Skill {
  /** Stable kebab-case id. Referenced by prerequisites, paths and saved progress. */
  id: string;
  name: string;
  domain: DomainId;
  description: string;
  /** Checklist items. Checking all of them completes the skill. */
  subtopics: string[];
  /** Skill ids that must be completed before this one unlocks. */
  prerequisites: string[];
  estimatedHours: number;
  /** "Build this" mini-project idea. */
  project: string;
  resources: Resource[];
}

export type PathId =
  | "all"
  | "software-engineer"
  | "frontend"
  | "backend"
  | "full-stack"
  | "ai"
  | "cloud"
  | "quant-trader"
  | "quant-researcher"
  | "quant-developer";

export interface CareerPath {
  id: PathId;
  name: string;
  description: string;
  /** Skill ids on this path. The "all" path lists every skill. */
  skills: string[];
}
