/**
 * Timeline Visualization Component
 * Interactive Gantt chart for timeline visualization
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface TimelineVisualizationProps {
  timeline: {
    startDate?: string;
    endDate?: string;
    duration?: number;
    urgency?: string;
    milestones?: Array<{
      id: string;
      name: string;
      date: string;
      status: "pending" | "in-progress" | "completed";
    }>;
  };
  onTimelineChange?: (timeline: any) => void;
}

export default function TimelineVisualization({
  timeline,
  onTimelineChange,
}: TimelineVisualizationProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(
    null,
  );

  const startDate = timeline.startDate
    ? new Date(timeline.startDate)
    : new Date();
  const endDate = timeline.endDate
    ? new Date(timeline.endDate)
    : timeline.duration
      ? new Date(startDate.getTime() + timeline.duration * 24 * 60 * 60 * 1000)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const today = new Date();
  const daysElapsed = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const progress = Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100));

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "URGENT":
        return "text-red-600 dark:text-red-400";
      case "HIGH":
        return "text-orange-600 dark:text-orange-400";
      case "MEDIUM":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timeline Visualization
        </h4>
        <span
          className={`text-sm font-medium ${getUrgencyColor(timeline.urgency)}`}
        >
          {timeline.urgency || "LOW"} Priority
        </span>
      </div>

      {/* Timeline Bar */}
      <div className="relative">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-600 dark:text-slate-400">
          <span>{startDate.toLocaleDateString()}</span>
          <span>{endDate.toLocaleDateString()}</span>
        </div>
        <div className="mt-1 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
          {totalDays} days total • {Math.max(0, daysElapsed)} days elapsed •{" "}
          {Math.max(0, totalDays - daysElapsed)} days remaining
        </div>
      </div>

      {/* Milestones */}
      {timeline.milestones && timeline.milestones.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Milestones
          </h5>
          {timeline.milestones.map((milestone) => {
            const milestoneDate = new Date(milestone.date);
            const position =
              ((milestoneDate.getTime() - startDate.getTime()) /
                (endDate.getTime() - startDate.getTime())) *
              100;

            return (
              <div
                key={milestone.id}
                className="relative flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer"
                onClick={() => setSelectedMilestone(milestone.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(milestone.status)}
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {milestone.name}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {milestoneDate.toLocaleDateString()}
                </span>
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                  style={{ left: `${position}%` }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Conflict Detection */}
      {timeline.startDate &&
        timeline.endDate &&
        new Date(timeline.endDate) < new Date() && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Timeline conflict: End date is in the past
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
