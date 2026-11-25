"use client";

import { PATHS } from "@/data/paths";
import type { PathId } from "@/data/types";
import { useProgress } from "./ProgressProvider";

export function PathSelect({ className = "" }: { className?: string }) {
  const { state, updateSettings } = useProgress();
  return (
    <select
      aria-label="Career path"
      value={state.settings.selectedPath}
      onChange={(e) => updateSettings({ selectedPath: e.target.value as PathId })}
      className={`rounded-md border border-white/10 bg-[#11141b] px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-sky-400 ${className}`}
    >
      {PATHS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
