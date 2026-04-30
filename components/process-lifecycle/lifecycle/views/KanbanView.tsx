/**
 * Advanced Kanban Board View for Lifecycle Stages
 * Interactive drag-and-drop kanban board with real-time updates
 */

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EntityLifecycle, LifecycleStage } from "@/types/lifecycle";
import { format } from "date-fns";

interface KanbanViewProps {
  lifecycle: EntityLifecycle;
  onStageClick?: (stage: LifecycleStage) => void;
  onStageMove?: (stageId: string, newStatus: string) => void;
  enableDragDrop?: boolean;
}

type StageStatus = "pending" | "in_progress" | "completed" | "blocked";

const statusColumns: {
  status: StageStatus;
  label: string;
  color: string;
  icon: string;
}[] = [
  { status: "pending", label: "Pending", color: "gray", icon: "ri-time-line" },
  {
    status: "in_progress",
    label: "In Progress",
    color: "blue",
    icon: "ri-loader-4-line",
  },
  {
    status: "blocked",
    label: "Blocked",
    color: "red",
    icon: "ri-error-warning-line",
  },
  {
    status: "completed",
    label: "Completed",
    color: "green",
    icon: "ri-checkbox-circle-line",
  },
];

export default function KanbanView({
  lifecycle,
  onStageClick,
  onStageMove,
  enableDragDrop = false,
}: KanbanViewProps) {
  const [draggedStage, setDraggedStage] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<StageStatus | null>(null);

  const stagesByStatus = useMemo(() => {
    const grouped: Record<StageStatus, LifecycleStage[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      blocked: [],
    };

    lifecycle.stages.forEach((stage) => {
      const status = (stage.status || "pending") as StageStatus;
      if (grouped[status]) {
        grouped[status].push(stage);
      } else {
        grouped.pending.push(stage);
      }
    });

    return grouped;
  }, [lifecycle.stages]);

  const handleDragStart = (stageId: string) => {
    if (enableDragDrop) {
      setDraggedStage(stageId);
    }
  };

  const handleDragEnd = () => {
    if (draggedStage && hoveredColumn) {
      onStageMove?.(draggedStage, hoveredColumn);
    }
    setDraggedStage(null);
    setHoveredColumn(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <i className="ri-layout-column-line text-purple-400"></i>
          Kanban Board
        </h3>
        <p className="text-sm text-[#9ca3af]">
          Drag and drop stages to update their status
        </p>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const stages = stagesByStatus[column.status];
          const isHovered = hoveredColumn === column.status;

          return (
            <div
              key={column.status}
              onDragOver={(e) => {
                e.preventDefault();
                if (enableDragDrop) {
                  setHoveredColumn(column.status);
                }
              }}
              onDragLeave={() => setHoveredColumn(null)}
              onDrop={handleDragEnd}
              className={`bg-white/5 rounded-xl p-4 border-2 transition-all ${
                isHovered
                  ? `border-${column.color}-500/50 bg-${column.color}-500/10`
                  : "border-white/10"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i
                    className={`ri-${column.icon} text-${column.color}-400`}
                  ></i>
                  <h4 className="text-sm font-semibold text-white">
                    {column.label}
                  </h4>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium bg-${column.color}-500/20 text-${column.color}-400`}
                >
                  {stages.length}
                </span>
              </div>

              {/* Stage Cards */}
              <div className="space-y-3 min-h-[200px]">
                <AnimatePresence>
                  {stages.map((stage, idx) => {
                    const isDragging = draggedStage === stage.id;

                    return (
                      <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        draggable={enableDragDrop}
                        onDragStart={() => handleDragStart(stage.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onStageClick?.(stage)}
                        className={`bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 cursor-pointer transition-all ${
                          isDragging ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-white mb-1">
                              {stage.name}
                            </h5>
                            {stage.description && (
                              <p className="text-xs text-[#9ca3af] line-clamp-2">
                                {stage.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stage Metadata */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-[#9ca3af]">
                            {stage.startedAt && (
                              <div className="flex items-center gap-1">
                                <i className="ri-time-line"></i>
                                {format(new Date(stage.startedAt), "MMM d")}
                              </div>
                            )}
                          </div>
                          {stage.duration && (
                            <div className="text-xs text-[#9ca3af]">
                              {Math.floor(stage.duration / 3600)}h
                            </div>
                          )}
                        </div>

                        {/* Progress Indicator */}
                        {stage.progress !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-white/10 rounded-full h-1.5">
                              <motion.div
                                className={`bg-${column.color}-500 h-1.5 rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${stage.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <div className="text-xs text-[#9ca3af] mt-1">
                              {stage.progress}%
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {stages.length === 0 && (
                  <div className="text-center text-[#9ca3af] py-8 text-xs">
                    <i className="ri-inbox-line text-2xl mb-2"></i>
                    <div>No stages</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="text-[#9ca3af]">
            Total Stages:{" "}
            <span className="text-white font-semibold">
              {lifecycle.stages.length}
            </span>
          </div>
          <div className="text-[#9ca3af]">
            Completed:{" "}
            <span className="text-green-400 font-semibold">
              {stagesByStatus.completed.length} / {lifecycle.stages.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
