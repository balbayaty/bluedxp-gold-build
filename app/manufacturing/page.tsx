"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";

interface ProductionOrder {
  id: string;
  orderNumber: string;
  material: string;
  quantity: number;
  status:
    | "PLANNED"
    | "RELEASED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "ON_HOLD"
    | "CANCELLED";
  startDate: Date;
  endDate: Date;
  workCenter: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  completion: number;
}

interface WorkOrder {
  id: string;
  orderNumber: string;
  productionOrderId: string;
  operation: string;
  workCenter: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  operator?: string;
}

interface CapacityMetric {
  workCenter: string;
  availableHours: number;
  plannedHours: number;
  actualHours: number;
  utilization: number;
  efficiency: number;
}

export default function ManufacturingDashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<
    "overview" | "production" | "capacity" | "quality" | "performance"
  >("overview");

  // Mock production orders
  const [productionOrders] = useState<ProductionOrder[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: `PO-${i + 1}`,
      orderNumber: `PO-${String(i + 1).padStart(6, "0")}`,
      material: `Material-${i + 1}`,
      quantity: Math.floor(Math.random() * 1000) + 100,
      status: ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"][
        Math.floor(Math.random() * 5)
      ] as ProductionOrder["status"],
      startDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      workCenter: `WC-${(i % 5) + 1}`,
      priority: ["LOW", "MEDIUM", "HIGH", "URGENT"][
        Math.floor(Math.random() * 4)
      ] as ProductionOrder["priority"],
      completion: Math.floor(Math.random() * 100),
    }));
  });

  // Mock work orders
  const [workOrders] = useState<WorkOrder[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `WO-${i + 1}`,
      orderNumber: `WO-${String(i + 1).padStart(6, "0")}`,
      productionOrderId: `PO-${Math.floor(i / 2) + 1}`,
      operation: `Operation ${(i % 5) + 1}`,
      workCenter: `WC-${(i % 5) + 1}`,
      status: ["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"][
        Math.floor(Math.random() * 4)
      ] as WorkOrder["status"],
      plannedStart: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ),
      plannedEnd: new Date(
        Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000,
      ),
      actualStart:
        Math.random() > 0.5
          ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
          : undefined,
      actualEnd:
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000)
          : undefined,
      operator: `Operator-${(i % 10) + 1}`,
    }));
  });

  // Mock capacity metrics
  const [capacityMetrics] = useState<CapacityMetric[]>(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      workCenter: `WC-${i + 1}`,
      availableHours: 160,
      plannedHours: 120 + Math.random() * 40,
      actualHours: 100 + Math.random() * 30,
      utilization: 75 + Math.random() * 20,
      efficiency: 85 + Math.random() * 15,
    }));
  });

  // Key Metrics
  const metrics = useMemo(() => {
    const activeProductionOrders = productionOrders.filter((po) =>
      ["RELEASED", "IN_PROGRESS"].includes(po.status),
    ).length;
    const completedToday = productionOrders.filter((po) => {
      if (po.status === "COMPLETED") {
        const completedDate = new Date(po.endDate);
        return completedDate.toDateString() === new Date().toDateString();
      }
      return false;
    }).length;
    const activeWorkOrders = workOrders.filter(
      (wo) => wo.status === "IN_PROGRESS",
    ).length;
    const onTimeDelivery =
      (productionOrders.filter((po) => {
        if (po.status === "COMPLETED") {
          return new Date(po.endDate) <= new Date(po.endDate);
        }
        return false;
      }).length /
        Math.max(
          productionOrders.filter((po) => po.status === "COMPLETED").length,
          1,
        )) *
      100;
    const averageUtilization =
      capacityMetrics.reduce((sum, c) => sum + c.utilization, 0) /
        capacityMetrics.length || 0;
    const averageEfficiency =
      capacityMetrics.reduce((sum, c) => sum + c.efficiency, 0) /
        capacityMetrics.length || 0;

    return {
      activeProductionOrders,
      completedToday,
      activeWorkOrders,
      onTimeDelivery,
      averageUtilization,
      averageEfficiency,
    };
  }, [productionOrders, workOrders, capacityMetrics]);

  // Production Status Distribution
  const productionStatusData = useMemo(() => {
    const statusCounts = productionOrders.reduce(
      (acc, po) => {
        acc[po.status] = (acc[po.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace("_", " "),
      count,
    }));
  }, [productionOrders]);

  // Work Order Status Distribution
  const workOrderStatusData = useMemo(() => {
    const statusCounts = workOrders.reduce(
      (acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace("_", " "),
      count,
    }));
  }, [workOrders]);

  // Capacity Utilization by Work Center
  const capacityData = useMemo(() => {
    return capacityMetrics.map((c) => ({
      name: c.workCenter,
      utilization: c.utilization,
      efficiency: c.efficiency,
      planned: c.plannedHours,
      actual: c.actualHours,
    }));
  }, [capacityMetrics]);

  // Daily Production Trend
  const dailyProductionTrend = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: format(date, "MMM dd"),
        planned: Math.floor(Math.random() * 50) + 20,
        actual: Math.floor(Math.random() * 50) + 15,
        efficiency: 80 + Math.random() * 20,
      };
    });
  }, []);

  const stats = [
    {
      label: "Active Production Orders",
      value: metrics.activeProductionOrders,
      icon: "ri-file-list-3-line",
      tooltip: "Production orders currently in progress",
      trend: "up" as const,
    },
    {
      label: "Completed Today",
      value: metrics.completedToday,
      icon: "ri-checkbox-circle-line",
      tooltip: "Production orders completed today",
      trend: "up" as const,
    },
    {
      label: "Active Work Orders",
      value: metrics.activeWorkOrders,
      icon: "ri-task-line",
      tooltip: "Work orders currently in progress",
      trend: "neutral" as const,
    },
    {
      label: "On-Time Delivery",
      value: `${metrics.onTimeDelivery.toFixed(1)}%`,
      icon: "ri-time-line",
      tooltip: "On-time delivery rate",
      trend: (metrics.onTimeDelivery >= 95 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Avg Utilization",
      value: `${metrics.averageUtilization.toFixed(1)}%`,
      icon: "ri-dashboard-line",
      tooltip: "Average work center utilization",
      trend: (metrics.averageUtilization >= 80 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Avg Efficiency",
      value: `${metrics.averageEfficiency.toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Average production efficiency",
      trend: (metrics.averageEfficiency >= 90 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
  ];

  return (
    <PageTemplate
      title="Manufacturing as a Service Dashboard"
      description="Complete manufacturing management with production orders, work orders, capacity planning, shop floor control, and quality management"
      shortDescription="Manufacturing operations overview and analytics"
      icon="ri-building-2-line"
      systemInfo={{
        sap: "Production Planning (PP)",
        oracle: "Manufacturing Cloud",
        manhattan: "Manufacturing Module",
      }}
      examples={[
        "Monitor production orders",
        "Track work orders",
        "Plan capacity",
        "Control shop floor",
        "Manage quality",
        "Analyze performance",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              [
                "overview",
                "production",
                "capacity",
                "quality",
                "performance",
              ] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                }`}
                aria-label={`View ${mode} mode`}
              >
                <i
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "production" ? "file-list-3-line" : mode === "capacity" ? "calendar-todo-line" : mode === "quality" ? "shield-check-line" : "line-chart-line"} text-sm sm:text-base`}
                ></i>
                <span className="hidden sm:inline">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Production Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-file-list-3-line text-cyan-400 text-lg"></i>
              <span>Production Order Status</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Capacity Utilization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-calendar-todo-line text-cyan-400 text-lg"></i>
              <span>Capacity Utilization by Work Center</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={capacityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
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
                  yAxisId="left"
                  dataKey="utilization"
                  fill="#06b6d4"
                  name="Utilization %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Efficiency %"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Daily Production Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
              <span>Daily Production Trend (30 Days)</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyProductionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="planned"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.6}
                  name="Planned"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="actual"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Actual"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Efficiency %"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Production Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-file-list-3-line text-cyan-400 text-lg"></i>
              <span>Recent Production Orders</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Work Center
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                      Completion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {productionOrders.slice(0, 10).map((po, index) => (
                    <motion.tr
                      key={po.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white leading-tight">
                          {po.orderNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white leading-tight">
                          {po.material}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white leading-tight">
                          {po.quantity}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            po.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : po.status === "IN_PROGRESS"
                                ? "bg-blue-500/20 text-blue-400"
                                : po.status === "ON_HOLD"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : po.status === "CANCELLED"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {po.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white leading-tight">
                          {po.workCenter}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                po.completion >= 80
                                  ? "bg-green-500"
                                  : po.completion >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${po.completion}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-white w-12 text-right">
                            {po.completion}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Production View */}
      {viewMode === "production" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-file-list-3-line text-cyan-400 text-lg"></i>
              <span>Production Orders</span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productionOrders.slice(0, 12).map((po, index) => (
                <motion.div
                  key={po.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {po.orderNumber}
                      </h4>
                      <p className="text-xs text-[#9ca3af]">{po.material}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        po.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : po.status === "IN_PROGRESS"
                            ? "bg-blue-500/20 text-blue-400"
                            : po.status === "ON_HOLD"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {po.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Quantity</span>
                      <span className="text-white">{po.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Work Center</span>
                      <span className="text-white">{po.workCenter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Completion</span>
                      <span className="text-white">{po.completion}%</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            po.completion >= 80
                              ? "bg-green-500"
                              : po.completion >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${po.completion}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Capacity View */}
      {viewMode === "capacity" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-calendar-todo-line text-cyan-400 text-lg"></i>
              <span>Work Center Capacity</span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capacityMetrics.map((cm, index) => (
                <motion.div
                  key={cm.workCenter}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <h4 className="text-sm font-semibold text-white mb-3">
                    {cm.workCenter}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9ca3af]">Utilization</span>
                        <span className="text-white">
                          {cm.utilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            cm.utilization >= 80
                              ? "bg-green-500"
                              : cm.utilization >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${cm.utilization}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9ca3af]">Efficiency</span>
                        <span className="text-white">
                          {cm.efficiency.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            cm.efficiency >= 90
                              ? "bg-green-500"
                              : cm.efficiency >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${cm.efficiency}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                      <div>
                        <div className="text-[#9ca3af]">Planned</div>
                        <div className="text-white font-medium">
                          {cm.plannedHours.toFixed(1)}h
                        </div>
                      </div>
                      <div>
                        <div className="text-[#9ca3af]">Actual</div>
                        <div className="text-white font-medium">
                          {cm.actualHours.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Quality View */}
      {viewMode === "quality" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-shield-check-line text-cyan-400 text-lg"></i>
              <span>Quality Metrics</span>
            </h3>
            <div className="text-center text-[#9ca3af] py-8">
              Quality control metrics will be displayed here. Navigate to
              Quality Control page for detailed view.
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === "performance" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
              <span>Performance Analytics</span>
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={dailyProductionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="planned"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.6}
                  name="Planned"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="actual"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Actual"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Efficiency %"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}
    </PageTemplate>
  );
}
