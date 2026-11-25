import { DOMAIN_BY_ID } from "@/data/skills";
import type { DomainId } from "@/data/types";
import type { SkillStatus } from "@/lib/progress";

export function ProgressBar({
  value,
  color = "#38bdf8",
  className = "",
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function DomainBadge({ domain }: { domain: DomainId }) {
  const d = DOMAIN_BY_ID[domain];
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={{ color: d.color, backgroundColor: `${d.color}1f` }}
    >
      {d.name}
    </span>
  );
}

export const STATUS_META: Record<SkillStatus, { label: string; color: string; icon: string }> = {
  locked: { label: "Locked", color: "#71717a", icon: "🔒" },
  available: { label: "Available", color: "#38bdf8", icon: "○" },
  "in-progress": { label: "In progress", color: "#fbbf24", icon: "◐" },
  completed: { label: "Completed", color: "#34d399", icon: "✓" },
};

export function StatusPill({ status }: { status: SkillStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ color: m.color, backgroundColor: `${m.color}1f` }}
    >
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}

export function Card({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
