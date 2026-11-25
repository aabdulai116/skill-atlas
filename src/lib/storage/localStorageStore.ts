import { parseProgress } from "./serialize";
import { createEmptyProgress, type ProgressState, type ProgressStore } from "./types";

export const STORAGE_KEY = "skill-atlas:progress";

export class LocalStorageStore implements ProgressStore {
  constructor(private readonly key: string = STORAGE_KEY) {}

  async load(): Promise<ProgressState> {
    if (typeof window === "undefined") return createEmptyProgress();
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return createEmptyProgress();
    try {
      return parseProgress(JSON.parse(raw));
    } catch {
      return createEmptyProgress();
    }
  }

  async save(state: ProgressState): Promise<void> {
    window.localStorage.setItem(this.key, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(this.key);
  }

  subscribe(onChange: (state: ProgressState) => void): () => void {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== this.key) return;
      try {
        onChange(e.newValue ? parseProgress(JSON.parse(e.newValue)) : createEmptyProgress());
      } catch {
        // Ignore malformed writes from other tabs.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }
}
