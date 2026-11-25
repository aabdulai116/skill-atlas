import type { PathId } from "@/data/types";

export const PROGRESS_VERSION = 1;

export interface Settings {
  selectedPath: PathId;
  hoursPerWeek: number;
  /** ISO date (YYYY-MM-DD) for the recruiting countdown, or null when unset. */
  targetDate: string | null;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  /** Checked subtopics per skill id. A skill is completed when all of its subtopics are checked. */
  checked: Record<string, string[]>;
  notes: Record<string, string>;
  /** Number of subtopics checked off per local day (YYYY-MM-DD). Drives streaks and the heatmap. */
  activity: Record<string, number>;
  settings: Settings;
}

/**
 * Persistence boundary. Swap the localStorage implementation for a Supabase (or any other)
 * implementation without touching UI code.
 */
export interface ProgressStore {
  load(): Promise<ProgressState>;
  save(state: ProgressState): Promise<void>;
  clear(): Promise<void>;
}

export function createEmptyProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    checked: {},
    notes: {},
    activity: {},
    settings: { selectedPath: "all", hoursPerWeek: 10, targetDate: null },
  };
}
