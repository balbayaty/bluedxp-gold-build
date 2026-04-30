"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { generateTasks } from "@/utils/mockDataGenerators";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

export default function TaskManagement() {
  const [tasks, setTasks] = useState(() => generateTasks(100));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalTasks: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.materialNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        task.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || task.status === selectedStatus;
      const matchesTaskType =
        selectedTaskType === "ALL" || task.taskType === selectedTaskType;
      const matchesPriority =
        selectedPriority === "ALL" || task.priority === selectedPriority;
      return (
        matchesSearch && matchesStatus && matchesTaskType && matchesPriority
      );
    });
  }, [tasks, searchQuery, selectedStatus, selectedTaskType, selectedPriority]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status === "PENDING" || t.status === "ASSIGNED",
    );
  }, [tasks]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    tasks.forEach((task) => {
      stats[task.status] = (stats[task.status] || 0) + 1;
    });
    return stats;
  }, [tasks]);

  const taskTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    tasks.forEach((task) => {
      stats[task.taskType] = (stats[task.taskType] || 0) + 1;
    });
    return stats;
  }, [tasks]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [statusStats]);

  const taskTypeData = useMemo(() => {
    return Object.entries(taskTypeStats).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [taskTypeStats]);

  const aggregateStats = useMemo(() => {
    return {
      totalTasks: tasks.length,
      pending: pendingTasks.length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
    };
  }, [tasks.length, pendingTasks.length, tasks]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "task-management-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "task-management-stats",
      () => ({
        totalTasks: aggregateStats.totalTasks,
        pending: simulateKPIUpdates(aggregateStats.pending, 0.1),
        inProgress: simulateKPIUpdates(aggregateStats.inProgress, 0.1),
        completed: simulateKPIUpdates(aggregateStats.completed, 0.05),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalTasks,
    aggregateStats.pending,
    aggregateStats.inProgress,
    aggregateStats.completed,
  ]);

  const stats = [
    {
      label: "Total Tasks",
      value: realTimeEnabled
        ? realTimeStats.totalTasks
        : aggregateStats.totalTasks,
      icon: "ri-task-line",
      tooltip: "Total warehouse tasks",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: realTimeEnabled ? realTimeStats.pending : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Tasks pending or assigned",
      trend: "neutral" as const,
    },
    {
      label: "In Progress",
      value: realTimeEnabled
        ? realTimeStats.inProgress
        : aggregateStats.inProgress,
      icon: "ri-loader-4-line",
      tooltip: "Tasks in progress",
      trend: "up" as const,
    },
    {
      label: "Completed",
      value: realTimeEnabled
        ? realTimeStats.completed
        : aggregateStats.completed,
      icon: "ri-checkbox-circle-line",
      tooltip: "Completed tasks",
      trend: "up" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <PageTemplate
      title="Task Management"
      description="Warehouse task management - Manage all warehouse tasks including putaway, picking, replenishment, cycle counting, and quality checks"
      icon="ri-task-line"
      systemInfo={{
        sap: "Task Management - Warehouse Task Management, Task Assignment",
        oracle: "Task Management - Warehouse Task Management",
        manhattan: "Task Management - Task Management, Work Assignment",
      }}
      examples={[
        "Manage all warehouse tasks in one place",
        "Assign tasks to warehouse workers",
        "Track task status and completion",
        "Monitor task performance and efficiency",
        "Handle task priorities and due dates",
        "Manage equipment requirements",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            {(["table", "grid", "analytics"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 sm:p-2 rounded transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-[#9ca3af] hover:text-white"
                }`}
                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
              >
                <i
                  className={`ri-${mode === "table" ? "table-line" : mode === "grid" ? "grid-line" : "bar-chart-line"} text-sm sm:text-base`}
                ></i>
              </button>
            ))}
          </div>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
          <Tooltip content="Create New Task" position="bottom">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <i className="ri-add-line"></i>
              <span className="hidden sm:inline">Create Task</span>
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Task Number, Material, Location, Assigned To..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
        <select
          value={selectedTaskType}
          onChange={(e) => setSelectedTaskType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Task Types</option>
          <option value="PUTAWAY">Putaway</option>
          <option value="PICKING">Picking</option>
          <option value="REPLENISHMENT">Replenishment</option>
          <option value="CYCLE_COUNT">Cycle Count</option>
          <option value="TRANSFER">Transfer</option>
          <option value="CROSS_DOCK">Cross Dock</option>
          <option value="QUALITY_CHECK">Quality Check</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Task Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Task Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    className={`hover:bg-white/5 transition-colors ${
                      task.priority === "CRITICAL"
                        ? "bg-red-500/5"
                        : task.priority === "URGENT"
                          ? "bg-orange-500/5"
                          : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {task.taskNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {task.taskType.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white font-medium">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-[#9ca3af] mt-1">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {task.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.materialNumber ? (
                        <div>
                          <div className="text-sm text-white font-mono">
                            {task.materialNumber}
                          </div>
                          {task.quantity && (
                            <div className="text-xs text-[#9ca3af]">
                              {task.quantity.toFixed(2)} {task.unit}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedToName ? (
                        <div>
                          <div className="text-sm text-white">
                            {task.assignedToName}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {task.assignedTo}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : task.priority === "URGENT"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : task.priority === "HIGH"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : task.priority === "MEDIUM"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(task.dueDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{
                              width: `${Math.min(task.completionPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-white w-12 text-right">
                          {task.completionPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : task.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : task.status === "ASSIGNED"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : task.status === "ON_HOLD"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowViewModal(true);
                        }}
                        className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`bg-white/5 backdrop-blur-xl border rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer ${
                task.priority === "CRITICAL"
                  ? "border-red-500/30 bg-red-500/5"
                  : task.priority === "URGENT"
                    ? "border-orange-500/30 bg-orange-500/5"
                    : "border-white/10"
              }`}
              onClick={() => {
                setSelectedTask(task);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {task.taskNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{task.title}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    task.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : task.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {task.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white">
                    {task.taskType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Location:</span>
                  <span className="text-white font-mono">{task.location}</span>
                </div>
                {task.assignedToName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Assigned To:</span>
                    <span className="text-white">{task.assignedToName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Priority:</span>
                  <span
                    className={`text-xs font-medium ${
                      task.priority === "CRITICAL"
                        ? "text-red-400"
                        : task.priority === "URGENT"
                          ? "text-orange-400"
                          : task.priority === "HIGH"
                            ? "text-yellow-400"
                            : "text-white"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Progress:</span>
                  <span className="text-white font-medium">
                    {task.completionPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Due Date:</span>
                  <span className="text-white">
                    {format(new Date(task.dueDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Task Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Task Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="type"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTask(null);
        }}
        title={`Task Details - ${selectedTask?.taskNumber || ""}`}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Task Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedTask.taskNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedTask.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedTask.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedTask.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Task Type
                </label>
                <div className="text-sm text-white">
                  {selectedTask.taskType.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedTask.priority === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedTask.priority === "URGENT"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedTask.priority}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Title
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedTask.title}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Location
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedTask.location}
                </div>
              </div>
              {selectedTask.materialNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Material Number
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedTask.materialNumber}
                  </div>
                </div>
              )}
              {selectedTask.quantity && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Quantity
                  </label>
                  <div className="text-sm text-white">
                    {selectedTask.quantity.toFixed(2)} {selectedTask.unit}
                  </div>
                </div>
              )}
              {selectedTask.assignedToName && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Assigned To
                  </label>
                  <div className="text-sm text-white">
                    {selectedTask.assignedToName}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {selectedTask.assignedTo}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Due Date
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedTask.dueDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Estimated Duration
                </label>
                <div className="text-sm text-white">
                  {selectedTask.estimatedDuration} minutes
                </div>
              </div>
              {selectedTask.actualDuration && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Actual Duration
                  </label>
                  <div className="text-sm text-white">
                    {selectedTask.actualDuration} minutes
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Completion
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedTask.completionPercentage.toFixed(0)}%
                </div>
              </div>
              {selectedTask.equipmentRequired && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Equipment Required
                  </label>
                  <div className="text-sm text-white">
                    {selectedTask.equipmentRequired.replace(/_/g, " ")}
                  </div>
                </div>
              )}
            </div>
            {selectedTask.description && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Description
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedTask.description}
                </div>
              </div>
            )}
            {selectedTask.notes && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Notes
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedTask.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
