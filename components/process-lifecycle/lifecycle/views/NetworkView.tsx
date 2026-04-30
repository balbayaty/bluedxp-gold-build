/**
 * Advanced Network Graph View for Lifecycle Stages
 * Interactive network visualization showing stage relationships and dependencies
 */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { EntityLifecycle, LifecycleStage } from "@/types/lifecycle";

interface NetworkViewProps {
  lifecycle: EntityLifecycle;
  onStageClick?: (stage: LifecycleStage) => void;
  onStageHover?: (stage: LifecycleStage | null) => void;
}

interface Node {
  id: string;
  stage: LifecycleStage;
  x: number;
  y: number;
  connections: string[];
}

export default function NetworkView({
  lifecycle,
  onStageClick,
  onStageHover,
}: NetworkViewProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [layout, setLayout] = useState<"force" | "hierarchical" | "circular">(
    "force",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => {
    return lifecycle.stages.map((stage, idx) => {
      const connections: string[] = [];
      if (idx > 0) {
        connections.push(lifecycle.stages[idx - 1].id);
      }
      if (idx < lifecycle.stages.length - 1) {
        connections.push(lifecycle.stages[idx + 1].id);
      }

      return {
        id: stage.id,
        stage,
        connections,
      };
    });
  }, [lifecycle.stages]);

  const getNodePosition = (node: Node, index: number, total: number) => {
    if (layout === "circular") {
      const angle = (2 * Math.PI * index) / total;
      const radius = 200;
      return {
        x: 300 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      };
    } else if (layout === "hierarchical") {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        x: 150 + col * 200,
        y: 100 + row * 150,
      };
    } else {
      // Force-directed (simplified)
      const angle = (2 * Math.PI * index) / total;
      const radius = 150 + (index % 3) * 50;
      return {
        x: 300 + radius * Math.cos(angle + Math.random() * 0.5),
        y: 300 + radius * Math.sin(angle + Math.random() * 0.5),
      };
    }
  };

  const getStageColor = (stage: LifecycleStage) => {
    if (stage.status === "completed") return "#10b981";
    if (stage.status === "in_progress") return "#3b82f6";
    if (stage.status === "blocked") return "#ef4444";
    return "#6b7280";
  };

  const getStageSize = (stage: LifecycleStage) => {
    if (selectedNode === stage.id || hoveredNode === stage.id) return 60;
    return 40;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-node-tree text-green-400"></i>
          Network Graph
        </h3>
        <div className="flex items-center gap-2">
          {(["force", "hierarchical", "circular"] as const).map(
            (layoutType) => (
              <button
                key={layoutType}
                onClick={() => setLayout(layoutType)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  layout === layoutType
                    ? "bg-green-500 text-white"
                    : "bg-white/5 text-[#9ca3af]"
                }`}
              >
                {layoutType.charAt(0).toUpperCase() + layoutType.slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Network Visualization */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] bg-white/5 rounded-xl overflow-hidden"
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Connections */}
          {nodes.map((node) => {
            const nodePos = getNodePosition(
              node,
              nodes.indexOf(node),
              nodes.length,
            );
            return node.connections.map((targetId) => {
              const targetNode = nodes.find((n) => n.id === targetId);
              if (!targetNode) return null;
              const targetPos = getNodePosition(
                targetNode,
                nodes.indexOf(targetNode),
                nodes.length,
              );

              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={nodePos.x}
                  y1={nodePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="#374151"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity={
                    hoveredNode === node.id || hoveredNode === targetId
                      ? 1
                      : 0.3
                  }
                />
              );
            });
          })}
        </svg>

        {/* Nodes */}
        <div className="relative w-full h-full">
          {nodes.map((node, idx) => {
            const pos = getNodePosition(node, idx, nodes.length);
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const size = getStageSize(node.stage);
            const color = getStageColor(node.stage);

            return (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: pos.x - size / 2,
                  y: pos.y - size / 2,
                }}
                transition={{
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 200,
                }}
                onClick={() => {
                  setSelectedNode(isSelected ? null : node.id);
                  onStageClick?.(node.stage);
                }}
                onMouseEnter={() => {
                  setHoveredNode(node.id);
                  onStageHover?.(node.stage);
                }}
                onMouseLeave={() => {
                  setHoveredNode(null);
                  onStageHover?.(null);
                }}
                className="absolute cursor-pointer"
                style={{
                  width: size,
                  height: size,
                }}
              >
                <div
                  className={`w-full h-full rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? "ring-4 ring-cyan-400" : ""
                  }`}
                  style={{
                    backgroundColor: color,
                    borderColor: isHovered ? "#60a5fa" : color,
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <i
                    className={`${node.stage.icon || "ri-circle-line"} text-white text-lg`}
                  ></i>
                </div>

                {/* Node Label */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap transition-all ${
                    isHovered || isSelected
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="bg-[#1f2937] border border-white/20 rounded-lg px-2 py-1 text-xs text-white shadow-lg">
                    {node.stage.name}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-xs">
          <div className="text-[#9ca3af] font-medium">Status:</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-white">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-white">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
