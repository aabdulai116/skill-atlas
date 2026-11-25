"use client";

import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DOMAIN_BY_ID, SKILLS } from "@/data/skills";
import type { CheckedMap, SkillStatus } from "@/lib/progress";
import { skillProgress } from "@/lib/progress";
import { layoutSkills, NODE_HEIGHT, NODE_WIDTH } from "./layout";
import { DomainLabel, SkillNode, type DomainLabelNode, type SkillFlowNode } from "./SkillNode";

const nodeTypes = { skill: SkillNode, domainLabel: DomainLabel };
const LAYOUT = layoutSkills(SKILLS);

interface SkillGraphProps {
  checked: CheckedMap;
  statuses: Record<string, SkillStatus>;
  visible: Set<string>;
  selectedId: string | null;
  focus: { id: string } | null;
  onSelect: (id: string | null) => void;
  /** Element to put in fullscreen (defaults to the graph itself). */
  fullscreenRef?: React.RefObject<HTMLElement | null>;
}

export function SkillGraph({ checked, statuses, visible, selectedId, focus, onSelect, fullscreenRef }: SkillGraphProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { setCenter } = useReactFlow();

  useEffect(() => {
    const onChange = () =>
      setFullscreen(document.fullscreenElement === (fullscreenRef?.current ?? wrapperRef.current));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [fullscreenRef]);

  useEffect(() => {
    if (!focus) return;
    const pos = LAYOUT.positions[focus.id];
    if (pos) void setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, { zoom: 1.1, duration: 500 });
  }, [focus, setCenter]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void (fullscreenRef?.current ?? wrapperRef.current)?.requestFullscreen();
  }, [fullscreenRef]);

  const related = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>([selectedId]);
    for (const skill of SKILLS) {
      if (skill.id === selectedId) skill.prerequisites.forEach((p) => s.add(p));
      if (skill.prerequisites.includes(selectedId)) s.add(skill.id);
    }
    return s;
  }, [selectedId]);

  const nodes = useMemo<(SkillFlowNode | DomainLabelNode)[]>(() => {
    const labels: DomainLabelNode[] = LAYOUT.columns.map((c) => {
      const inDomain = SKILLS.filter((s) => s.domain === c.domain);
      return {
        id: `label-${c.domain}`,
        type: "domainLabel",
        position: { x: c.x, y: 0 },
        data: {
          label: DOMAIN_BY_ID[c.domain].name,
          color: DOMAIN_BY_ID[c.domain].color,
          done: inDomain.filter((s) => statuses[s.id] === "completed").length,
          total: inDomain.length,
        },
        selectable: false,
        draggable: false,
      };
    });
    const skills: SkillFlowNode[] = SKILLS.map((skill) => ({
      id: skill.id,
      type: "skill",
      position: LAYOUT.positions[skill.id],
      selected: skill.id === selectedId,
      draggable: false,
      data: {
        skill,
        status: statuses[skill.id],
        progress: skillProgress(skill, checked),
        dimmed: !visible.has(skill.id),
        active: related.has(skill.id) && skill.id !== selectedId,
      },
    }));
    return [...labels, ...skills];
  }, [checked, statuses, visible, selectedId, related]);

  const edges = useMemo<Edge[]>(
    () =>
      SKILLS.flatMap((skill) =>
        skill.prerequisites.map((p) => {
          const highlighted = selectedId !== null && (skill.id === selectedId || p === selectedId);
          const dimmed = !visible.has(skill.id) || !visible.has(p);
          const done = statuses[p] === "completed";
          return {
            id: `${p}->${skill.id}`,
            source: p,
            target: skill.id,
            animated: highlighted,
            style: {
              stroke: highlighted ? DOMAIN_BY_ID[skill.domain].color : done ? "#34d39988" : "#3f3f46",
              strokeWidth: highlighted ? 2 : 1.25,
              opacity: dimmed && !highlighted ? 0.12 : 1,
            },
            zIndex: highlighted ? 10 : 0,
          };
        }),
      ),
    [selectedId, visible, statuses],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === "skill") onSelect(node.id);
    },
    [onSelect],
  );

  return (
    <div ref={wrapperRef} className="h-full w-full bg-[#0b0d12]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelect(null)}
        nodesConnectable={false}
        nodesDraggable={false}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.35 }}
        minZoom={0.15}
        maxZoom={2}
        forceColorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f2430" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            if (n.type !== "skill") return "transparent";
            const data = (n as SkillFlowNode).data;
            return data.dimmed ? "#27272a" : DOMAIN_BY_ID[data.skill.domain].color;
          }}
          maskColor="rgba(11,13,18,0.7)"
        />
        <Controls showInteractive={false}>
          <ControlButton onClick={toggleFullscreen} title={fullscreen ? "Exit fullscreen" : "Fullscreen"} aria-label="Toggle fullscreen">
            {fullscreen ? "⤡" : "⤢"}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  );
}
