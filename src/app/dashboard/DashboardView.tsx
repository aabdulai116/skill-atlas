"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PATH_BY_ID, PATHS } from "@/data/paths";
import { DOMAINS, SKILL_BY_ID, SKILLS } from "@/data/skills";
import { buildHeatmap, recruitingCountdown, weeklyStreak } from "@/lib/activity";
import { computeDepths } from "@/lib/graph";
import { aggregateProgress, skillProgress, toPercent } from "@/lib/progress";
import { PathSelect } from "@/components/PathSelect";
import { useProgress } from "@/components/ProgressProvider";
import { Card, DomainBadge, ProgressBar, StatusPill } from "@/components/ui";

const DEPTHS = computeDepths(SKILLS);
const HEAT_COLORS = ["#161a23", "#0e4429", "#006d32", "#26a641", "#39d353"];

function Stat({ label, value, sub, children }: { label: string; value?: string; sub?: string; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
      {value && <span className="text-3xl font-semibold tabular-nums text-white">{value}</span>}
      {sub && <span className="text-xs text-zinc-400">{sub}</span>}
      {children}
    </Card>
  );
}

export function DashboardView() {
  const { state, statuses, updateSettings } = useProgress();
  const today = useMemo(() => new Date(), []);
  const path = PATH_BY_ID[state.settings.selectedPath];
  const pathSkills = useMemo(() => path.skills.map((id) => SKILL_BY_ID[id]), [path]);

  const overall = aggregateProgress(SKILLS, state.checked);
  const completed = SKILLS.filter((s) => statuses[s.id] === "completed");
  const unlocked = SKILLS.filter((s) => statuses[s.id] === "available" || statuses[s.id] === "in-progress");
  const pathRemaining = pathSkills.filter((s) => statuses[s.id] !== "completed");

  const recommended = pathSkills
    .filter((s) => statuses[s.id] === "available" || statuses[s.id] === "in-progress")
    .sort(
      (a, b) =>
        Number(statuses[b.id] === "in-progress") - Number(statuses[a.id] === "in-progress") ||
        DEPTHS[a.id] - DEPTHS[b.id],
    )
    .slice(0, 6);

  const streak = weeklyStreak(state.activity, today);
  const heatmap = useMemo(() => buildHeatmap(state.activity, today), [state.activity, today]);
  const totalChecks = Object.values(state.activity).reduce((a, b) => a + b, 0);
  const countdown = state.settings.targetDate
    ? recruitingCountdown(state.settings.targetDate, today, pathRemaining.length)
    : null;

  return (
    <main className="mx-auto max-w-[1400px] space-y-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall progress" value={`${toPercent(overall)}%`}>
          <ProgressBar value={overall} className="mt-2" />
        </Stat>
        <Stat label="Skills completed" value={`${completed.length}`} sub={`of ${SKILLS.length} skills`} />
        <Stat label="Unlocked now" value={`${unlocked.length}`} sub="ready to study" />
        <Stat label="Career path">
          <PathSelect className="mt-1 w-full" />
          <span className="mt-1 text-xs text-zinc-400">
            {pathSkills.length - pathRemaining.length}/{pathSkills.length} done ·{" "}
            {toPercent(aggregateProgress(pathSkills, state.checked))}%
          </span>
        </Stat>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Recommended next · ${path.name}`} className="lg:col-span-2">
          {recommended.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {pathRemaining.length === 0 ? "You've completed this path." : "Nothing unlocked on this path yet. Finish prerequisites first."}
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {recommended.map((s) => (
                <li key={s.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100">{s.name}</span>
                    <StatusPill status={statuses[s.id]} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <DomainBadge domain={s.domain} />
                    <span className="text-xs text-zinc-500">~{s.estimatedHours}h</span>
                  </div>
                  <ProgressBar value={skillProgress(s, state.checked)} className="mt-2" />
                </li>
              ))}
            </ul>
          )}
          <Link href="/atlas" className="mt-3 inline-block text-xs text-sky-300 hover:underline">
            Open the atlas →
          </Link>
        </Card>

        <Card title="Recruiting countdown">
          <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
            Target date
            <input
              type="date"
              aria-label="Target date"
              value={state.settings.targetDate ?? ""}
              onChange={(e) => updateSettings({ targetDate: e.target.value || null })}
              className="input"
            />
          </label>
          {countdown ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-3xl font-semibold tabular-nums text-white">{countdown.weeksLeft}</div>
                <div className="text-xs text-zinc-500">weeks left</div>
              </div>
              <div>
                <div className="text-3xl font-semibold tabular-nums text-white">
                  {Number.isFinite(countdown.skillsPerWeek) ? countdown.skillsPerWeek.toFixed(1) : "—"}
                </div>
                <div className="text-xs text-zinc-500">skills / week needed</div>
              </div>
              <p className="col-span-2 text-xs text-zinc-400">
                {countdown.skillsLeft === 0
                  ? `${path.name} path complete.`
                  : countdown.daysLeft < 0
                    ? "Target date has passed. Pick a new one."
                    : `${countdown.skillsLeft} skills left on ${path.name}.`}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Set the date applications open to see your weekly pace.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Activity" className="lg:col-span-2" action={<span className="text-xs text-zinc-500">{totalChecks} subtopics checked</span>}>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-white">{streak}</span>
            <span className="text-sm text-zinc-400">week streak</span>
          </div>
          <div className="flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label="Activity heatmap">
            {heatmap.map((col, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} subtopic${cell.count === 1 ? "" : "s"}`}
                    className="h-3 w-3 rounded-[3px]"
                    style={{ backgroundColor: cell.future ? "transparent" : HEAT_COLORS[cell.level] }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Progress by domain">
          <ul className="space-y-2">
            {DOMAINS.map((d) => {
              const inDomain = SKILLS.filter((s) => s.domain === d.id);
              const p = aggregateProgress(inDomain, state.checked);
              return (
                <li key={d.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span style={{ color: d.color }}>{d.name}</span>
                    <span className="tabular-nums text-zinc-400">{toPercent(p)}%</span>
                  </div>
                  <ProgressBar value={p} color={d.color} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card title="Career paths">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PATHS.filter((p) => p.id !== "all").map((p) => {
            const skills = p.skills.map((id) => SKILL_BY_ID[id]);
            const prog = aggregateProgress(skills, state.checked);
            const done = skills.filter((s) => statuses[s.id] === "completed").length;
            const active = p.id === path.id;
            return (
              <li key={p.id}>
                <button
                  onClick={() => updateSettings({ selectedPath: p.id })}
                  className={`w-full rounded-lg border p-3 text-left transition ${active ? "border-sky-400/60 bg-sky-400/5" : "border-white/10 hover:border-white/20"}`}
                >
                  <div className="font-medium text-zinc-100">{p.name}</div>
                  <div className="mb-2 text-xs text-zinc-500">
                    {done}/{skills.length} skills · {toPercent(prog)}%
                  </div>
                  <ProgressBar value={prog} />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={`Completed skills (${completed.length})`}>
        {completed.length === 0 ? (
          <p className="text-sm text-zinc-500">No skills completed yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {completed.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-1 text-sm">
                <span className="text-emerald-300">✓</span>
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
