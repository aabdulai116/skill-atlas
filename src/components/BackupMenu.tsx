"use client";

import { useRef, useState } from "react";
import { exportProgress, importProgress } from "@/lib/storage";
import { toDateKey } from "@/lib/dates";
import { useProgress } from "./ProgressProvider";

export function BackupMenu() {
  const { state, storageError, replaceState, reset } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const onExport = () => {
    const blob = new Blob([exportProgress(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skill-atlas-backup-${toDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      replaceState(importProgress(await file.text()));
      flash("Progress imported");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {storageError && (
        <span role="alert" className="text-xs text-amber-400" title="Browser storage is unavailable. Export a backup to keep your progress.">
          Progress isn&apos;t being saved
        </span>
      )}
      {message && <span className="text-xs text-zinc-400">{message}</span>}
      <button onClick={onExport} className="btn-ghost">
        Export
      </button>
      <button onClick={() => fileRef.current?.click()} className="btn-ghost">
        Import
      </button>
      <button
        onClick={() => {
          if (confirm("Reset all progress? Export a backup first if you want to keep it.")) reset();
        }}
        className="btn-ghost text-zinc-500"
      >
        Reset
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onImport(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
