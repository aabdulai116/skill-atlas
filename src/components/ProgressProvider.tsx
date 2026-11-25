"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SKILL_BY_ID, SKILLS } from "@/data/skills";
import { toDateKey } from "@/lib/dates";
import { computeStatuses, type SkillStatus } from "@/lib/progress";
import {
  createEmptyProgress,
  createProgressStore,
  type ProgressState,
  type Settings,
} from "@/lib/storage";

interface ProgressContextValue {
  state: ProgressState;
  ready: boolean;
  /** True when progress could not be loaded from or saved to the store. */
  storageError: boolean;
  statuses: Record<string, SkillStatus>;
  toggleSubtopic: (skillId: string, subtopic: string) => void;
  setSkillComplete: (skillId: string, complete: boolean) => void;
  setNote: (skillId: string, note: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceState: (state: ProgressState) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function recordActivity(activity: Record<string, number>, count: number) {
  if (count <= 0) return activity;
  const key = toDateKey(new Date());
  return { ...activity, [key]: (activity[key] ?? 0) + count };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createProgressStore(), []);
  const [state, setState] = useState<ProgressState>(createEmptyProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    store
      .load()
      .then(setState, () => setStorageError(true))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
    return store.subscribe?.(setState);
  }, [store]);

  useEffect(() => {
    if (!loaded.current) return;
    store.save(state).then(
      () => setStorageError(false),
      () => setStorageError(true),
    );
  }, [state, store]);

  const toggleSubtopic = useCallback((skillId: string, subtopic: string) => {
    setState((s) => {
      const current = s.checked[skillId] ?? [];
      const isChecked = current.includes(subtopic);
      const next = isChecked ? current.filter((t) => t !== subtopic) : [...current, subtopic];
      return {
        ...s,
        checked: { ...s.checked, [skillId]: next },
        activity: isChecked ? s.activity : recordActivity(s.activity, 1),
      };
    });
  }, []);

  const setSkillComplete = useCallback((skillId: string, complete: boolean) => {
    const skill = SKILL_BY_ID[skillId];
    if (!skill) return;
    setState((s) => {
      const current = new Set(s.checked[skillId] ?? []);
      const added = complete ? skill.subtopics.filter((t) => !current.has(t)).length : 0;
      return {
        ...s,
        checked: { ...s.checked, [skillId]: complete ? [...skill.subtopics] : [] },
        activity: recordActivity(s.activity, added),
      };
    });
  }, []);

  const setNote = useCallback((skillId: string, note: string) => {
    setState((s) => ({ ...s, notes: { ...s.notes, [skillId]: note } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const replaceState = useCallback((next: ProgressState) => setState(next), []);
  const reset = useCallback(() => setState(createEmptyProgress()), []);

  const statuses = useMemo(() => computeStatuses(SKILLS, state.checked, SKILL_BY_ID), [state.checked]);

  const value = useMemo(
    () => ({
      state,
      ready,
      storageError,
      statuses,
      toggleSubtopic,
      setSkillComplete,
      setNote,
      updateSettings,
      replaceState,
      reset,
    }),
    [state, ready, storageError, statuses, toggleSubtopic, setSkillComplete, setNote, updateSettings, replaceState, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>.");
  return ctx;
}
