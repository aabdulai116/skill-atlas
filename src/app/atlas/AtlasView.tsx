"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PATH_BY_ID, PATHS } from "@/data/paths";
import { DOMAINS, SKILLS } from "@/data/skills";
import type { DomainId } from "@/data/types";
import { aggregateProgress, toPercent } from "@/lib/progress";
import { SkillGraph } from "@/components/atlas/SkillGraph";
import { SkillPanel } from "@/components/atlas/SkillPanel";
import { useProgress } from "@/components/ProgressProvider";
import { ProgressBar, STATUS_META } from "@/components/ui";

function matches(query: string, name: string, domain: string) {
  const q = query.trim().toLowerCase();
  return !q || name.toLowerCase().includes(q) || domain.toLowerCase().includes(q);
}

export function AtlasView() {
  const { state, statuses, updateSettings } = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<Set<DomainId>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const graphAreaRef = useRef<HTMLDivElement>(null);
  const path = PATH_BY_ID[state.settings.selectedPath];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pathSet = useMemo(() => new Set(path.skills), [path]);
  const visible = useMemo(
    () =>
      new Set(
        SKILLS.filter(
          (s) =>
            pathSet.has(s.id) &&
            (domains.size === 0 || domains.has(s.domain)) &&
            matches(query, s.name, s.domain),
        ).map((s) => s.id),
      ),
    [pathSet, domains, query],
  );

  const pathSkills = useMemo(() => SKILLS.filter((s) => pathSet.has(s.id)), [pathSet]);
  const overall = aggregateProgress(pathSkills, state.checked);
  const completedCount = pathSkills.filter((s) => statuses[s.id] === "completed").length;

  const focus = useCallback((id: string) => {
    setSelectedId(id);
    setFocusRequest({ id });
  }, []);

  const toggleDomain = (d: DomainId) =>
    setDomains((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="space-y-3 border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const first = SKILLS.find((s) => visible.has(s.id));
                  if (first) focus(first.id);
                } else if (e.key === "Escape") {
                  setQuery("");
                  searchRef.current?.blur();
                }
              }}
              placeholder="Search skills…"
              aria-label="Search skills"
              className="input w-64 pr-8"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/15 px-1.5 text-[10px] text-zinc-500">
              /
            </kbd>
          </div>
          <div className="flex min-w-[260px] flex-1 items-center gap-3">
            <span className="whitespace-nowrap text-xs text-zinc-400">
              {path.name}: {completedCount}/{pathSkills.length} skills
            </span>
            <ProgressBar value={overall} className="h-2 max-w-md" />
            <span className="text-sm font-semibold tabular-nums text-white">{toPercent(overall)}%</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <span key={k} className="flex items-center gap-1">
                <span style={{ color: m.color }}>{m.icon}</span>
                {m.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Career paths">
          {PATHS.map((p) => {
            const active = p.id === path.id;
            return (
              <button
                key={p.id}
                onClick={() => updateSettings({ selectedPath: p.id })}
                aria-pressed={active}
                className={`chip ${active ? "border-sky-400/60 bg-sky-400/10 text-sky-200" : ""}`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Domains">
          {DOMAINS.map((d) => {
            const active = domains.has(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDomain(d.id)}
                aria-pressed={active}
                className="chip"
                style={active ? { borderColor: d.color, color: d.color, backgroundColor: `${d.color}1a` } : undefined}
              >
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </button>
            );
          })}
          {domains.size > 0 && (
            <button onClick={() => setDomains(new Set())} className="text-xs text-zinc-500 hover:text-white">
              Clear
            </button>
          )}
        </div>
      </div>
      <div ref={graphAreaRef} className="relative flex-1 bg-background">
        <ReactFlowProvider>
          <SkillGraph
            checked={state.checked}
            statuses={statuses}
            visible={visible}
            selectedId={selectedId}
            focus={focusRequest}
            onSelect={setSelectedId}
            fullscreenRef={graphAreaRef}
          />
        </ReactFlowProvider>
        {selectedId && <SkillPanel skillId={selectedId} onClose={() => setSelectedId(null)} onSelect={focus} />}
      </div>
    </div>
  );
}
