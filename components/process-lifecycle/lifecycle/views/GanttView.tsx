/**
 * Advanced Gantt Chart View for Lifecycle Stages
 * Interactive timeline visualization with drag-and-drop, zoom, and filtering
 */

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { EntityLifecycle, LifecycleStage } from "@/types/lifecycle";
import { format, addDays, startOfDay, differenceInDays } from "date-fns";

interface GanttViewProps {
  lifecycle: EntityLifecycle;
  onStageClick?: (stage: LifecycleStage) => void;
  onStageUpdate?: (stageId: string, newDate: Date) => void;
  enableEditing?: boolean;
}

export default function GanttView({
  lifecycle,
  onStageClick,
  onStageUpdate,
  enableEditing = false,
}: GanttViewProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<"day" | "week" | "month">("week");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const start = lifecycle.stages[0]?.startedAt
      ? new Date(lifecycle.stages[0].startedAt)
      : new Date();
    const end = lifecycle.stages[lifecycle.stages.length - 1]?.completedAt
      ? new Date(lifecycle.stages[lifecycle.stages.length - 1].completedAt)
      : addDays(start, 30);
    return { start: startOfDay(start), end: startOfDay(end) };
  });

  const timelineDays = useMemo(() => {
    const days = differenceInDays(dateRange.end, dateRange.start);
    return Array.from({ length: days + 1 }, (_, i) =>
      addDays(dateRange.start, i),
    );
  }, [dateRange]);

  const getStagePosition = (stage: LifecycleStage) => {
    if (!stage.startedAt) return { left: 0, width: 0 };
    const startDate = startOfDay(new Date(stage.startedAt));
    const endDate = stage.completedAt
      ? startOfDay(new Date(stage.completedAt))
      : dateRange.end;
    const left = differenceInDays(startDate, dateRange.start);
    const width = differenceInDays(endDate, startDate) || 1;
    return { left, width };
  };

  const getStageColor = (stage: LifecycleStage) => {
    if (stage.status === "completed") return "bg-green-500";
    if (stage.status === "in_progress") return "bg-blue-500";
    if (stage.status === "blocked") return "bg-red-500";
    if (stage.status === "pending") return "bg-gray-500";
    return "bg-yellow-500";
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-x-auto">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-calendar-todo-line text-cyan-400"></i>
          Gantt Chart Timeline
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel("day")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              zoomLevel === "day"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-[#9ca3af]"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setZoomLevel("week")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              zoomLevel === "week"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-[#9ca3af]"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setZoomLevel("month")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              zoomLevel === "month"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-[#9ca3af]"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-max">
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex">
            {timelineDays.map((day, idx) => (
              <div
                key={day.toISOString()}
                className={`text-xs text-[#9ca3af] px-2 border-r border-white/10 ${
                  idx === 0 || day.getDate() === 1 ? "font-semibold" : ""
                }`}
                style={{
                  minWidth:
                    zoomLevel === "day"
                      ? "60px"
                      : zoomLevel === "week"
                        ? "120px"
                        : "200px",
                }}
              >
                {format(day, "MMM d")}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Bars */}
      <div className="space-y-3">
        {lifecycle.stages.map((stage, idx) => {
          const { left, width } = getStagePosition(stage);
          const isSelected = selectedStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 hover:bg-white/5 rounded-lg p-2 transition-colors"
            >
              {/* Stage Label */}
              <div className="w-48 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStageColor(stage)}`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {stage.name}
                    </div>
                    <div className="text-xs text-[#9ca3af]">{stage.status}</div>
                  </div>
                </div>
              </div>

              {/* Timeline Bar */}
              <div className="flex-1 relative h-8 bg-white/5 rounded overflow-hidden">
                {stage.startedAt && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(width / timelineDays.length) * 100}%`,
                      left: `${(left / timelineDays.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    onClick={() => {
                      setSelectedStage(isSelected ? null : stage.id);
                      onStageClick?.(stage);
                    }}
                    className={`absolute h-full ${getStageColor(stage)} rounded cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#1f2937]"
                        : ""
                    }`}
                    style={{
                      left: `${(left / timelineDays.length) * 100}%`,
                      width: `${Math.max(2, (width / timelineDays.length) * 100)}%`,
                    }}
                  >
                    <div className="h-full flex items-center justify-center text-xs text-white font-medium px-2">
                      {stage.completedAt
                        ? `${Math.floor(width)}d`
                        : stage.startedAt
                          ? "In Progress"
                          : "Pending"}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Stage Info */}
              <div className="w-32 flex-shrink-0 text-right">
                <div className="text-xs text-white">
                  {stage.startedAt
                    ? format(new Date(stage.startedAt), "MMM d")
                    : "Not started"}
                </div>
                {stage.completedAt && (
                  <div className="text-xs text-[#9ca3af]">
                    {format(new Date(stage.completedAt), "MMM d")}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-xs">
          <div className="text-[#9ca3af] font-medium">Legend:</div>
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
