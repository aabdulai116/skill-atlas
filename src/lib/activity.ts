import { addDays, daysBetween, fromDateKey, startOfWeek, toDateKey } from "./dates";

export type ActivityLog = Record<string, number>;

/**
 * Consecutive weeks (Monday-based) with at least one checked subtopic, ending at the current
 * week. If the current week has no activity yet, the streak counts back from last week.
 */
export function weeklyStreak(activity: ActivityLog, today: Date): number {
  const activeWeeks = new Set(
    Object.entries(activity)
      .filter(([, n]) => n > 0)
      .map(([day]) => toDateKey(startOfWeek(fromDateKey(day)))),
  );
  let week = startOfWeek(today);
  if (!activeWeeks.has(toDateKey(week))) week = addDays(week, -7);
  let streak = 0;
  while (activeWeeks.has(toDateKey(week))) {
    streak++;
    week = addDays(week, -7);
  }
  return streak;
}

export interface HeatmapCell {
  date: string;
  count: number;
  /** 0 (none) to 4 (most active). */
  level: number;
  future: boolean;
}

/** Columns of 7 days (Mon..Sun) covering the last `weeks` weeks, ending with the current week. */
export function buildHeatmap(activity: ActivityLog, today: Date, weeks = 26): HeatmapCell[][] {
  const first = addDays(startOfWeek(today), -(weeks - 1) * 7);
  const max = Math.max(1, ...Object.values(activity));
  const columns: HeatmapCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, w * 7 + d);
      const key = toDateKey(date);
      const count = activity[key] ?? 0;
      col.push({
        date: key,
        count,
        level: count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)),
        future: daysBetween(today, date) > 0,
      });
    }
    columns.push(col);
  }
  return columns;
}

export interface Countdown {
  daysLeft: number;
  weeksLeft: number;
  skillsLeft: number;
  /** Skills per week needed to finish in time; Infinity when the target date has passed. */
  skillsPerWeek: number;
}

export function recruitingCountdown(
  targetDate: string,
  today: Date,
  skillsLeft: number,
): Countdown {
  const daysLeft = daysBetween(today, fromDateKey(targetDate));
  const weeksLeft = Math.max(0, Math.ceil(daysLeft / 7));
  const skillsPerWeek =
    skillsLeft === 0 ? 0 : daysLeft <= 0 ? Number.POSITIVE_INFINITY : skillsLeft / (daysLeft / 7);
  return { daysLeft, weeksLeft, skillsLeft, skillsPerWeek };
}
