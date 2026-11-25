import { PATH_BY_ID } from "@/data/paths";
import type { PathId } from "@/data/types";
import { createEmptyProgress, PROGRESS_VERSION, type ProgressState } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArrayRecord(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(value)) {
    if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string");
  }
  return out;
}

function typedRecord<T>(value: unknown, guard: (v: unknown) => v is T): Record<string, T> {
  if (!isRecord(value)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(value)) if (guard(v)) out[k] = v;
  return out;
}

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Validates untrusted JSON (localStorage, imported files) into a well-formed ProgressState. */
export function parseProgress(raw: unknown): ProgressState {
  const empty = createEmptyProgress();
  if (!isRecord(raw)) throw new Error("Progress data must be a JSON object.");
  if (raw.version !== PROGRESS_VERSION) {
    throw new Error(`Unsupported progress version: ${String(raw.version)}.`);
  }
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const selectedPath =
    typeof settings.selectedPath === "string" && Object.hasOwn(PATH_BY_ID, settings.selectedPath)
      ? (settings.selectedPath as PathId)
      : empty.settings.selectedPath;
  const hoursPerWeek =
    isNumber(settings.hoursPerWeek) && settings.hoursPerWeek > 0
      ? Math.min(80, Math.max(1, settings.hoursPerWeek))
      : empty.settings.hoursPerWeek;
  const targetDate =
    typeof settings.targetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(settings.targetDate)
      ? settings.targetDate
      : null;
  return {
    version: PROGRESS_VERSION,
    checked: stringArrayRecord(raw.checked),
    notes: typedRecord(raw.notes, isString),
    activity: typedRecord(raw.activity, isNumber),
    settings: { selectedPath, hoursPerWeek, targetDate },
  };
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): ProgressState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  return parseProgress(raw);
}
