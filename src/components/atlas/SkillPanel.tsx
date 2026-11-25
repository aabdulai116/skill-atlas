"use client";

import { SKILL_BY_ID } from "@/data/skills";
import type { ResourceLevel } from "@/data/types";
import { skillProgress } from "@/lib/progress";
import { useProgress } from "../ProgressProvider";
import { DomainBadge, ProgressBar, STATUS_META, StatusPill } from "../ui";

const LEVEL_COLOR: Record<ResourceLevel, string> = {
  beginner: "#34d399",
  intermediate: "#fbbf24",
  advanced: "#f87171",
};

export function SkillPanel({ skillId, onClose, onSelect }: { skillId: string; onClose: () => void; onSelect: (id: string) => void }) {
  const { state, statuses, toggleSubtopic, setSkillComplete, setNote } = useProgress();
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return null;
  const status = statuses[skill.id];
  const checked = new Set(state.checked[skill.id] ?? []);
  const progress = skillProgress(skill, state.checked);
  const locked = status === "locked";
  const completed = status === "completed";

  return (
    <aside
      aria-label={`${skill.name} details`}
      className="absolute right-0 top-0 z-20 flex h-full w-full max-w-[420px] flex-col border-l border-white/10 bg-[#0f1218]/95 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DomainBadge domain={skill.domain} />
            <StatusPill status={status} />
            <span className="text-xs text-zinc-500">~{skill.estimatedHours}h</span>
          </div>
          <h2 className="text-lg font-semibold text-white">{skill.name}</h2>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="btn-ghost">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
        <p className="text-zinc-300">{skill.description}</p>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Progress</span>
            <span className="tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
          <ProgressBar value={progress} color={STATUS_META[status].color} />
        </div>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Subtopics</h3>
          {locked && <p className="mb-2 text-xs text-amber-300/80">Complete the prerequisites to unlock this skill.</p>}
          <ul className="space-y-1">
            {skill.subtopics.map((t) => (
              <li key={t}>
                <label className={`flex items-center gap-2 rounded px-1 py-1 ${locked ? "opacity-50" : "cursor-pointer hover:bg-white/5"}`}>
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={checked.has(t)}
                    onChange={() => toggleSubtopic(skill.id, t)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <span className={checked.has(t) ? "text-zinc-400 line-through" : "text-zinc-200"}>{t}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Prerequisites</h3>
          {skill.prerequisites.length === 0 ? (
            <p className="text-zinc-500">None. Start here.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {skill.prerequisites.map((id) => (
                <li key={id}>
                  <button onClick={() => onSelect(id)} className="chip flex items-center gap-1">
                    <span style={{ color: STATUS_META[statuses[id]].color }}>{STATUS_META[statuses[id]].icon}</span>
                    {SKILL_BY_ID[id]?.name ?? id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Resources</h3>
          {skill.resources.length === 0 ? (
            <p className="text-zinc-500">No resources added yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {skill.resources.map((r) => (
                <li key={r.url} className="flex items-center justify-between gap-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-sky-300 hover:underline">
                    {r.title}
                  </a>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase"
                    style={{ color: LEVEL_COLOR[r.level], backgroundColor: `${LEVEL_COLOR[r.level]}1f` }}
                  >
                    {r.level}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-300">Build this</h3>
          <p className="text-zinc-300">{skill.project}</p>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Notes</h3>
          <textarea
            aria-label="Notes"
            value={state.notes[skill.id] ?? ""}
            onChange={(e) => setNote(skill.id, e.target.value)}
            placeholder="Links, takeaways, questions…"
            rows={4}
            className="input w-full resize-y"
          />
        </section>
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          disabled={locked}
          onClick={() => setSkillComplete(skill.id, !completed)}
          className={completed ? "btn-ghost w-full py-2 text-sm" : "btn-primary w-full"}
        >
          {completed ? "Mark incomplete" : "Mark complete"}
        </button>
      </div>
    </aside>
  );
}
