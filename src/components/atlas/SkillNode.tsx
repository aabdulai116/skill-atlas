"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { DOMAIN_BY_ID } from "@/data/skills";
import type { Skill } from "@/data/types";
import type { SkillStatus } from "@/lib/progress";
import { DomainBadge, ProgressBar, STATUS_META, StatusPill } from "../ui";
import { NODE_HEIGHT, NODE_WIDTH } from "./layout";

export type SkillNodeData = {
  skill: Skill;
  status: SkillStatus;
  progress: number;
  dimmed: boolean;
  active: boolean;
};

export type SkillFlowNode = Node<SkillNodeData, "skill">;

function SkillNodeComponent({ data, selected }: NodeProps<SkillFlowNode>) {
  const { skill, status, progress, dimmed, active } = data;
  const domain = DOMAIN_BY_ID[skill.domain];
  const statusColor = STATUS_META[status].color;
  const highlighted = selected || active;
  return (
    <div
      data-testid={`skill-node-${skill.id}`}
      className="flex cursor-pointer flex-col justify-between rounded-lg border bg-[#141821] px-3 py-2 shadow-lg transition-all"
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        opacity: dimmed ? 0.18 : status === "locked" ? 0.7 : 1,
        borderColor: highlighted ? domain.color : `${statusColor}55`,
        boxShadow: highlighted ? `0 0 0 2px ${domain.color}66` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-zinc-600" />
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[13px] font-medium leading-tight text-zinc-100">{skill.name}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <DomainBadge domain={skill.domain} />
        <StatusPill status={status} />
      </div>
      <div className="flex items-center gap-2">
        <ProgressBar value={progress} color={status === "completed" ? "#34d399" : domain.color} />
        <span className="w-8 text-right text-[10px] tabular-nums text-zinc-400">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-zinc-600" />
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);

export type DomainLabelData = { label: string; color: string; done: number; total: number };
export type DomainLabelNode = Node<DomainLabelData, "domainLabel">;

function DomainLabelComponent({ data }: NodeProps<DomainLabelNode>) {
  return (
    <div className="flex items-center justify-between rounded-md px-1" style={{ width: NODE_WIDTH }}>
      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: data.color }}>
        {data.label}
      </span>
      <span className="text-xs tabular-nums text-zinc-500">
        {data.done}/{data.total}
      </span>
    </div>
  );
}

export const DomainLabel = memo(DomainLabelComponent);
