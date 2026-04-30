"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface WarehouseTask {
  id: string;
  taskNumber: string;
  taskType:
    | "PICKING"
    | "PUTAWAY"
    | "REPLENISHMENT"
    | "CYCLE_COUNT"
    | "MOVEMENT"
    | "QUALITY_CHECK";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  location: string;
  targetLocation?: string;
  materialNumber?: string;
  quantity?: number;
  routeDistance?: number; // meters
  routeOptimized: boolean;
  performanceScore?: number;
}

export default function TaskManagement() {
  const router = useRouter();
  const [tasks, setTasks] = useState<WarehouseTask[]>(() => {
    const taskTypes: WarehouseTask["taskType"][] = [
      "PICKING",
      "PUTAWAY",
      "REPLENISHMENT",
      "CYCLE_COUNT",
      "MOVEMENT",
      "QUALITY_CHECK",
    ];
    const statuses: WarehouseTask["status"][] = [
      "PENDING",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED",
    ];
    const priorities: WarehouseTask["priority"][] = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    return Array.from({ length: 80 }, (_, i) => {
      const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
      const status =
        i < 15
          ? "PENDING"
          : i < 30
            ? "ASSIGNED"
            : i < 50
              ? "IN_PROGRESS"
              : "COMPLETED";
      const priority =
        i < 10 ? "URGENT" : i < 25 ? "HIGH" : i < 45 ? "MEDIUM" : "LOW";
      const estimatedDuration = Math.floor(Math.random() * 60) + 10;
      const actualDuration =
        status === "COMPLETED"
          ? Math.floor(estimatedDuration * (0.8 + Math.random() * 0.4))
          : undefined;
      const routeDistance = Math.floor(Math.random() * 500) + 50;
      const performanceScore =
        status === "COMPLETED" && actualDuration
          ? Math.max(
              60,
              Math.min(
                100,
                100 -
                  ((actualDuration - estimatedDuration) / estimatedDuration) *
                    50,
              ),
            )
          : undefined;

      return {
        id: `TASK-${i + 1}`,
        taskNumber: `TASK-${String(i + 1).padStart(6, "0")}`,
        taskType,
        priority,
        status,
        assignedTo: status !== "PENDING" ? `USER-${(i % 10) + 1}` : undefined,
        assignedToName:
          status !== "PENDING" ? `User ${(i % 10) + 1}` : undefined,
        assignedAt:
          status !== "PENDING"
            ? new Date(Date.now() - Math.random() * 86400000)
            : undefined,
        startedAt:
          status === "IN_PROGRESS" || status === "COMPLETED"
            ? new Date(Date.now() - Math.random() * 3600000)
            : undefined,
        completedAt:
          status === "COMPLETED"
            ? new Date(Date.now() - Math.random() * 1800000)
            : undefined,
        estimatedDuration,
        actualDuration,
        location: `A-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`,
        targetLocation:
          taskType === "PUTAWAY" || taskType === "REPLENISHMENT"
            ? `B-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`
            : undefined,
        materialNumber: `MAT-${String(Math.floor(Math.random() * 1000) + 1).padStart(6, "0")}`,
        quantity: Math.floor(Math.random() * 100) + 10,
        routeDistance,
        routeOptimized: Math.random() > 0.3,
        performanceScore: performanceScore
          ? parseFloat(performanceScore.toFixed(1))
          : undefined,
      };
    });
  });

  // Fetch Real Replenishment Tasks
  useEffect(() => {
    if (selectedType === "REPLENISHMENT") {
      const fetchTasks = async () => {
        const { getReplenishmentTasksAction } =
          await import("@/app/actions/wms/replenishmentActions");
        const res = await getReplenishmentTasksAction();
        if (res.success && res.data) {
          // Map DB tasks to UI Tasks
          const realTasks = res.data.map((t: any) => ({
            id: t.id,
            taskNumber: t.taskNumber || "UNKNOWN",
            taskType: "REPLENISHMENT",
            priority: t.priority as any,
            status: t.status as any,
            assignedTo: t.assignedUserId,
            assignedToName: t.assignedUserId ? "User" : undefined, // Placeholder
            estimatedDuration: 15, // default
            actualDuration: undefined,
            location: t.fromBinId,
            targetLocation: t.toBinId,
            materialNumber: t.sku,
            quantity: t.quantity,
            routeOptimized: false,
          }));
          // Merge or replace. For this demo, we replace when filtered.
          setTasks(realTasks as WarehouseTask[]);
        }
      };
      fetchTasks();
    }
  }, [selectedType]);

  const [selectedTask, setSelectedTask] = useState<WarehouseTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "overview" | "tasks" | "performance" | "optimization"
  >("overview");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    avgPerformance: 0,
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        selectedStatus === "ALL" || task.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || task.taskType === selectedType;
      const matchesPriority =
        selectedPriority === "ALL" || task.priority === selectedPriority;
      return matchesStatus && matchesType && matchesPriority;
    });
  }, [tasks, selectedStatus, selectedType, selectedPriority]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [tasks]);

  // Type distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      counts[task.taskType] = (counts[task.taskType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [tasks]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const completed = tasks.filter(
      (t) => t.status === "COMPLETED" && t.actualDuration && t.performanceScore,
    );
    if (completed.length === 0) return null;

    const avgDuration =
      completed.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
      completed.length;
    const avgPerformance =
      completed.reduce((sum, t) => sum + (t.performanceScore || 0), 0) /
      completed.length;
    const onTimeRate =
      (completed.filter(
        (t) =>
          t.actualDuration &&
          t.estimatedDuration &&
          t.actualDuration <= t.estimatedDuration,
      ).length /
        completed.length) *
      100;
    const avgRouteDistance =
      tasks
        .filter((t) => t.routeDistance)
        .reduce((sum, t) => sum + (t.routeDistance || 0), 0) /
      tasks.filter((t) => t.routeDistance).length;
    const optimizationRate =
      (tasks.filter((t) => t.routeOptimized).length / tasks.length) * 100;

    return {
      avgDuration: Math.floor(avgDuration),
      avgPerformance: parseFloat(avgPerformance.toFixed(1)),
      onTimeRate: parseFloat(onTimeRate.toFixed(1)),
      avgRouteDistance: Math.floor(avgRouteDistance),
      optimizationRate: parseFloat(optimizationRate.toFixed(1)),
      totalCompleted: completed.length,
    };
  }, [tasks]);

  // User performance
  const userPerformance = useMemo(() => {
    const userData: Record<
      string,
      {
        name: string;
        tasks: number;
        avgPerformance: number;
        totalDuration: number;
        count: number;
      }
    > = {};

    tasks.forEach((task) => {
      if (
        task.assignedTo &&
        task.status === "COMPLETED" &&
        task.performanceScore
      ) {
        if (!userData[task.assignedTo]) {
          userData[task.assignedTo] = {
            name: task.assignedToName || task.assignedTo,
            tasks: 0,
            avgPerformance: 0,
            totalDuration: 0,
            count: 0,
          };
        }
        userData[task.assignedTo].tasks += 1;
        userData[task.assignedTo].avgPerformance += task.performanceScore;
        userData[task.assignedTo].count += 1;
        if (task.actualDuration) {
          userData[task.assignedTo].totalDuration += task.actualDuration;
        }
      }
    });

    return Object.values(userData)
      .map((user) => ({
        ...user,
        avgPerformance: user.count > 0 ? user.avgPerformance / user.count : 0,
        avgDuration: user.tasks > 0 ? user.totalDuration / user.tasks : 0,
      }))
      .sort((a, b) => b.avgPerformance - a.avgPerformance)
      .slice(0, 10);
  }, [tasks]);

  const aggregateStats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const avgPerformance = performanceMetrics?.avgPerformance || 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      avgPerformance: parseFloat(avgPerformance.toFixed(1)),
    };
  }, [tasks, performanceMetrics]);

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
        total: aggregateStats.total,
        pending: simulateKPIUpdates(aggregateStats.pending, 0.1),
        inProgress: simulateKPIUpdates(aggregateStats.inProgress, 0.05),
        avgPerformance: simulateKPIUpdates(aggregateStats.avgPerformance, 0.02),
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
    aggregateStats.total,
    aggregateStats.pending,
    aggregateStats.inProgress,
    aggregateStats.avgPerformance,
  ]);

  const stats = [
    {
      label: "Total Tasks",
      value: realTimeEnabled ? realTimeStats.total : aggregateStats.total,
      icon: "ri-task-line",
      tooltip: "Total warehouse tasks",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: realTimeEnabled ? realTimeStats.pending : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Pending tasks",
      trend: "neutral" as const,
    },
    {
      label: "In Progress",
      value: realTimeEnabled
        ? realTimeStats.inProgress
        : aggregateStats.inProgress,
      icon: "ri-loader-line",
      tooltip: "Tasks in progress",
      trend: "up" as const,
    },
    {
      label: "Avg Performance",
      value: `${(realTimeEnabled ? realTimeStats.avgPerformance : aggregateStats.avgPerformance).toFixed(1)}`,
      icon: "ri-line-chart-line",
      tooltip: "Average performance score",
      trend: "up" as const,
    },
  ];

  const handleViewTask = (task: WarehouseTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleAssign = (task: WarehouseTask) => {
    setSelectedTask(task);
    setShowAssignModal(true);
  };

  const handleOptimize = () => {
    setShowOptimizeModal(true);
  };

  return (
    <PageTemplate
      title="Task Management"
      description="Task assignment, routing, performance tracking, and optimization for warehouse operations"
      icon="ri-task-line"
      systemInfo={{
        sap: "Task Management, Warehouse Tasks",
        oracle: "Task Management, Work Orders",
        manhattan: "Task Management, Task Optimization",
      }}
      examples={[
        "Task assignment and routing",
        "Performance tracking",
        "Route optimization",
        "Task prioritization",
        "User performance analytics",
        "Task completion tracking",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              ["overview", "tasks", "performance", "optimization"] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "tasks" ? "file-list-line" : mode === "performance" ? "bar-chart-box-line" : "line-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
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
          <button
            onClick={handleOptimize}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <i className="ri-magic-line"></i>
            Optimize
          </button>
          <button
            onClick={async () => {
              // Trigger server action
              const { calculateReplenishmentAction } =
                await import("@/app/actions/wms/replenishmentActions");
              const res = await calculateReplenishmentAction("tenant-1");
              if (res.success) {
                alert(
                  `Replenishment run complete. Generated ${res.count} tasks.`,
                );
                // Refresh tasks logic would go here
              } else {
                alert("Failed: " + res.error);
              }
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <i className="ri-refresh-line"></i>
            Run Replenishment
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Types</option>
          <option value="PICKING">Picking</option>
          <option value="PUTAWAY">Putaway</option>
          <option value="REPLENISHMENT">Replenishment</option>
          <option value="CYCLE_COUNT">Cycle Count</option>
          <option value="MOVEMENT">Movement</option>
          <option value="QUALITY_CHECK">Quality Check</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Status Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) =>
                      `${status.replace(/_/g, " ")}: ${count}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#06b6d4",
                            "#3b82f6",
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                          ][index % 5]
                        }
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
                <BarChart data={typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="type"
                    stroke="#9ca3af"
                    fontSize={10}
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
                  <Bar dataKey="count" fill="#06b6d4" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Performance Summary */}
          {performanceMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Performance Summary
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.avgPerformance}
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Avg Performance Score
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.onTimeRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-[#9ca3af]">On-Time Rate</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.avgRouteDistance}m
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Avg Route Distance
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.optimizationRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Optimization Rate
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tasks View */}
      {viewMode === "tasks" && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {task.taskNumber}
                        </div>
                        {task.materialNumber && (
                          <div className="text-xs text-[#9ca3af]">
                            {task.materialNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium">
                          {task.taskType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === "URGENT"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : task.priority === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            task.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : task.status === "IN_PROGRESS"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : task.status === "ASSIGNED"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {task.assignedToName || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-mono">
                          {task.location}
                        </div>
                        {task.targetLocation && (
                          <div className="text-xs text-[#9ca3af]">
                            → {task.targetLocation}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QRCodeBadge
                            entityId={task.id}
                            entityType="task"
                            entityName={task.taskNumber}
                            documentType="other"
                            documentUrl={`/tasks?id=${task.id}`}
                            module="wms"
                            size="sm"
                          />
                          <div className="text-sm text-white">
                            {task.actualDuration
                              ? `${task.actualDuration}`
                              : `${task.estimatedDuration}`}{" "}
                            min
                          </div>
                        </div>

                        {task.routeDistance && (
                          <div className="text-xs text-[#9ca3af]">
                            {task.routeDistance}m
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.performanceScore ? (
                          <div
                            className={`text-sm font-medium ${
                              task.performanceScore >= 90
                                ? "text-green-400"
                                : task.performanceScore >= 75
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {task.performanceScore}
                          </div>
                        ) : (
                          <div className="text-sm text-[#9ca3af]">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewTask(task)}
                            className="px-3 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                          {task.status === "PENDING" && (
                            <button
                              onClick={() => handleAssign(task)}
                              className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-user-add-line"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === "performance" && performanceMetrics && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              User Performance
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={userPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={10}
                  width={100}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="avgPerformance"
                  fill="#06b6d4"
                  name="Performance Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Optimization View */}
      {viewMode === "optimization" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Optimization Metrics
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {performanceMetrics?.optimizationRate.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-[#9ca3af]">Routes Optimized</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {performanceMetrics?.avgRouteDistance || 0}m
                </div>
                <div className="text-sm text-[#9ca3af]">Avg Route Distance</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {tasks.filter((t) => t.routeOptimized).length}
                </div>
                <div className="text-sm text-[#9ca3af]">Optimized Tasks</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Details Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        title={`Task - ${selectedTask?.taskNumber || ""}`}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedTask.id}
                entityType="task"
                entityName={selectedTask.taskNumber}
                documentType="other"
                documentUrl={`/tasks?id=${selectedTask.id}`}
                module="wms"
                showAdvanced={false}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Task Number</div>
                <div className="text-white font-medium">
                  {selectedTask.taskNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Task Type</div>
                <div className="text-white font-medium">
                  {selectedTask.taskType.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Priority</div>
                <div className="text-white font-medium">
                  {selectedTask.priority}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div className="text-white font-medium">
                  {selectedTask.status.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Assigned To</div>
                <div className="text-white font-medium">
                  {selectedTask.assignedToName || "Unassigned"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Location</div>
                <div className="text-white font-medium font-mono">
                  {selectedTask.location}
                </div>
              </div>
              {selectedTask.targetLocation && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Target Location
                  </div>
                  <div className="text-white font-medium font-mono">
                    {selectedTask.targetLocation}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Duration</div>
                <div className="text-white font-medium">
                  {selectedTask.actualDuration
                    ? `${selectedTask.actualDuration}`
                    : `${selectedTask.estimatedDuration}`}{" "}
                  min
                </div>
              </div>
              {selectedTask.performanceScore && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Performance Score
                  </div>
                  <div
                    className={`font-medium ${
                      selectedTask.performanceScore >= 90
                        ? "text-green-400"
                        : selectedTask.performanceScore >= 75
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {selectedTask.performanceScore}
                  </div>
                </div>
              )}
              {selectedTask.routeDistance && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Route Distance
                  </div>
                  <div className="text-white font-medium">
                    {selectedTask.routeDistance}m
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Route Optimized
                </div>
                <div
                  className={`font-medium ${selectedTask.routeOptimized ? "text-green-400" : "text-gray-400"}`}
                >
                  {selectedTask.routeOptimized ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTask(null);
        }}
        title={`Assign Task - ${selectedTask?.taskNumber || ""}`}
        size="md"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Assign To
              </label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <option value="">Select user...</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`USER-${i + 1}`}>
                    User {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setTasks(
                    tasks.map((t) =>
                      t.id === selectedTask.id
                        ? {
                            ...t,
                            status: "ASSIGNED" as const,
                            assignedTo: "USER-1",
                            assignedToName: "User 1",
                            assignedAt: new Date(),
                          }
                        : t,
                    ),
                  );
                  setShowAssignModal(false);
                  setSelectedTask(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Assign Task
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTask(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Optimize Modal */}
      <Modal
        isOpen={showOptimizeModal}
        onClose={() => setShowOptimizeModal(false)}
        title="Optimize Tasks"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-[#9ca3af] mb-4">
            Optimize task routing and assignment for better performance
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-white mb-2">
              Pending Tasks:{" "}
              {tasks.filter((t) => t.status === "PENDING").length}
            </div>
            <div className="text-sm text-white mb-2">
              Current Optimization Rate:{" "}
              {performanceMetrics?.optimizationRate.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-[#9ca3af]">
              Optimization will improve routing and reduce travel time
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => {
                // Simulate optimization
                alert("Tasks optimized!");
                setShowOptimizeModal(false);
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-magic-line mr-2"></i>
              Run Optimization
            </button>
            <button
              onClick={() => setShowOptimizeModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
