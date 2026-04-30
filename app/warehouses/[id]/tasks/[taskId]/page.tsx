"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { warehouseOperationsService } from "@/lib/services/wms/warehouseOperationsService";
import type { WarehouseOperation } from "@/lib/services/wms/warehouseOperationsService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TaskDetailPageProps {}

const TaskDetailPage: React.FC<TaskDetailPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;
  const taskId = params?.taskId as string;

  const [task, setTask] = useState<WarehouseOperation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeline, setTimeline] = useState<
    Array<{ time: Date; status: string; description: string }>
  >([]);

  useEffect(() => {
    loadTaskData();
  }, [taskId, warehouseId]);

  const loadTaskData = async () => {
    setIsLoading(true);
    try {
      const operations =
        await warehouseOperationsService.getActiveOperations(warehouseId);
      const foundTask = operations.find((op) => op.id === taskId);

      if (foundTask) {
        setTask(foundTask);

        // Generate timeline
        const taskTimeline = [
          {
            time: new Date(foundTask.createdAt),
            status: "CREATED",
            description: "Task created",
          },
        ];

        if (foundTask.assignedAt) {
          taskTimeline.push({
            time: new Date(foundTask.assignedAt),
            status: "ASSIGNED",
            description: `Assigned to ${foundTask.assignedToName || foundTask.assignedTo || "Unknown"}`,
          });
        } else if (foundTask.assignedTo && foundTask.startedAt) {
          // Use startedAt as proxy for assignedAt if available
          taskTimeline.push({
            time: new Date(foundTask.startedAt),
            status: "ASSIGNED",
            description: `Assigned to ${foundTask.assignedToName || foundTask.assignedTo}`,
          });
        } else if (foundTask.assignedTo) {
          // If assigned but no start time, use created time
          taskTimeline.push({
            time: new Date(foundTask.createdAt),
            status: "ASSIGNED",
            description: `Assigned to ${foundTask.assignedToName || foundTask.assignedTo}`,
          });
        }

        if (foundTask.startedAt) {
          taskTimeline.push({
            time: new Date(foundTask.startedAt),
            status: "STARTED",
            description: "Task execution started",
          });
        }

        if (foundTask.completedAt) {
          taskTimeline.push({
            time: new Date(foundTask.completedAt),
            status: "COMPLETED",
            description: "Task completed successfully",
          });
        }

        setTimeline(
          taskTimeline.sort((a, b) => a.time.getTime() - b.time.getTime()),
        );
      }
    } catch (error) {
      console.error("Error loading task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PUTAWAY":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "PICKING":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "CYCLE_COUNT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Loading Task..."
        description="Please wait while we load task details"
        icon="ri-task-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
            <p className="text-white text-lg">Loading task information...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!task) {
    return (
      <PageTemplate
        title="Task Not Found"
        description="The requested task could not be found"
        icon="ri-task-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <p className="text-white text-lg mb-4">Task not found</p>
            <button
              onClick={() => router.push(`/warehouses/${warehouseId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Warehouse
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  const progress =
    task.startedAt && task.estimatedDuration
      ? Math.min(
          100,
          ((Date.now() - new Date(task.startedAt).getTime()) /
            (task.estimatedDuration * 60000)) *
            100,
        )
      : task.status === "COMPLETED"
        ? 100
        : 0;

  return (
    <PageTemplate
      title={`Task ${task.id}`}
      description={`${task.type.replace("_", " ")} • ${warehouseId}`}
      icon="ri-task-line"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              router.push(`/warehouses/${warehouseId}?tab=operations`)
            }
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30"
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Status</p>
                <p className="text-2xl font-bold text-white mt-1 capitalize">
                  {task.status.replace("_", " ")}
                </p>
              </div>
              <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}
            >
              {task.status.replace("_", " ")}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Type</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {task.type.replace("_", " ")}
                </p>
              </div>
              <i className="ri-stack-line text-3xl text-purple-400"></i>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-medium border ${getTypeColor(task.type)}`}
            >
              {task.type.replace("_", " ")}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Priority</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {task.priority}
                </p>
              </div>
              <i className="ri-flag-line text-3xl text-orange-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Task priority level</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Progress</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {Math.round(progress)}%
                </p>
              </div>
              <i className="ri-progress-3-line text-3xl text-cyan-400"></i>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Task Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-information-line mr-2 text-blue-400"></i>
              Task Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Task ID</span>
                <span className="text-white font-medium">{task.id}</span>
              </div>
              {task.materialNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Material</span>
                  <span className="text-white font-medium">
                    {task.materialNumber}
                  </span>
                </div>
              )}
              {task.quantity && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Quantity</span>
                  <span className="text-white font-medium">
                    {task.quantity}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Location</span>
                <span className="text-white font-medium">{task.location}</span>
              </div>
              {task.targetLocation && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">
                    Target Location
                  </span>
                  <span className="text-white font-medium">
                    {task.targetLocation}
                  </span>
                </div>
              )}
              {task.assignedToName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Assigned To</span>
                  <span className="text-white font-medium">
                    {task.assignedToName}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-time-line mr-2 text-purple-400"></i>
              Timing Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Created</span>
                <span className="text-white font-medium">
                  {new Date(task.createdAt).toLocaleString()}
                </span>
              </div>
              {task.startedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Started</span>
                  <span className="text-white font-medium">
                    {new Date(task.startedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Completed</span>
                  <span className="text-white font-medium">
                    {new Date(task.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {task.estimatedDuration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">
                    Estimated Duration
                  </span>
                  <span className="text-white font-medium">
                    {task.estimatedDuration} minutes
                  </span>
                </div>
              )}
              {task.actualDuration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">
                    Actual Duration
                  </span>
                  <span
                    className={`font-medium ${
                      task.estimatedDuration &&
                      task.actualDuration <= task.estimatedDuration
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {task.actualDuration} minutes
                    {task.estimatedDuration && (
                      <span className="text-xs text-[#9ca3af] ml-2">
                        (
                        {task.actualDuration <= task.estimatedDuration
                          ? "On time"
                          : "Over time"}
                        )
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Execution Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-history-line mr-2 text-cyan-400"></i>
            Execution Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div
                  key={index}
                  className="relative flex items-start space-x-4"
                >
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      event.status === "COMPLETED"
                        ? "bg-green-500"
                        : event.status === "STARTED"
                          ? "bg-blue-500"
                          : event.status === "ASSIGNED"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                    }`}
                  >
                    <i className="ri-checkbox-circle-line text-white text-sm"></i>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">
                        {event.status}
                      </span>
                      <span className="text-xs text-[#9ca3af]">
                        {event.time.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af]">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
};

export default TaskDetailPage;
