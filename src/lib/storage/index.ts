import { LocalStorageStore } from "./localStorageStore";
import type { ProgressStore } from "./types";

export * from "./types";
export * from "./serialize";

/** The store used by the app. Replace with e.g. `new SupabaseStore(client)` to sync to a backend. */
export function createProgressStore(): ProgressStore {
  return new LocalStorageStore();
}
