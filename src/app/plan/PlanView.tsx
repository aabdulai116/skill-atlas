"use client";

import { useMemo } from "react";
import { PATH_BY_ID } from "@/data/paths";
import { SKILL_BY_ID, SKILLS } from "@/data/skills";
import { daysBetween, fromDateKey } from "@/lib/dates";
import { generatePlan } from "@/lib/plan";
import { PathSelect } from "@/components/PathSelect";
import { useProgress } from "@/components/ProgressProvider";
import { Card, DomainBadge } from "@/components/ui";

const DATE_FMT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function PlanView() {
  const { state, updateSettings } = useProgress();
  const { selectedPath, hoursPerWeek, targetDate } = state.settings;
  const path = PATH_BY_ID[selectedPath];

  const plan = useMemo(
    () =>
      generatePlan({
        pathSkillIds: path.skills,
        skills: SKILLS,
        checked: state.checked,
        hoursPerWeek,
        startDate: new Date(),
      }),
    [path, state.checked, hoursPerWeek],
  );

  const finish = plan.weeks.length ? plan.weeks[plan.weeks.length - 1].start : null;
  const lateBy =
    finish && targetDate ? Math.ceil(daysBetween(fromDateKey(targetDate), finish) / 7) : null;

  return (
    <main className="mx-auto max-w-[1100px] space-y-4 p-4">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Career path
            <PathSelect />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Hours per week
            <input
              type="number"
              min={1}
              max={80}
              aria-label="Hours per week"
              value={hoursPerWeek}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) updateSettings({ hoursPerWeek: Math.min(80, v) });
              }}
              className="input w-24"
            />
          </label>
          <div className="ml-auto flex gap-6 text-right">
            <div>
              <div className="text-2xl font-semibold tabular-nums text-white">{plan.weeks.length}</div>
              <div className="text-xs text-zinc-500">weeks</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums text-white">{plan.order.length}</div>
              <div className="text-xs text-zinc-500">skills left</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums text-white">{Math.round(plan.totalHours)}</div>
              <div className="text-xs text-zinc-500">hours</div>
            </div>
          </div>
        </div>
        {finish && (
          <p className="mt-3 text-xs text-zinc-400">
            Estimated finish: week of {DATE_FMT.format(finish)}.
            {lateBy !== null &&
              (lateBy > 0
                ? ` That's ${lateBy} week${lateBy === 1 ? "" : "s"} after your target date. Increase hours per week to catch up.`
                : " You're on track for your target date.")}
          </p>
        )}
      </Card>

      {plan.weeks.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-400">Every skill on the {path.name} path is complete.</p>
        </Card>
      ) : (
        <ol className="space-y-3">
          {plan.weeks.map((w) => (
            <li key={w.index}>
              <Card
                title={`Week ${w.index}`}
                action={
                  <span className="text-xs text-zinc-500">
                    {DATE_FMT.format(w.start)} · {w.hours}h
                  </span>
                }
              >
                <ul className="divide-y divide-white/5">
                  {w.items.map((item) => {
                    const skill = SKILL_BY_ID[item.skillId];
                    return (
                      <li key={item.skillId} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <DomainBadge domain={skill.domain} />
                          <span className="truncate text-zinc-100">{skill.name}</span>
                          {item.continued && <span className="text-xs text-zinc-500">(cont.)</span>}
                          {item.offPath && (
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400">prerequisite</span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
                          {item.finishes && <span className="text-emerald-300">finish</span>}
                          <span className="tabular-nums">{item.hours}h</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
