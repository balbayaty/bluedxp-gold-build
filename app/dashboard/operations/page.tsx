"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";
import { useAuth } from "@/contexts/AuthContext";
import { useViewContext } from "@/contexts/ViewContextProvider";

type DailyProgressItem = {
  name: string;
  value: number;
  total: number;
  completed: number;
  color: string;
};

type HourlyThroughputItem = {
  hour: string;
  picks: number;
  packs: number;
  target: number;
};

type WaveStatusItem = {
  id: string;
  type: string;
  status: "COMPLETED" | "IN_PROGRESS" | "RELEASED" | "PENDING";
  progress: number;
  deadline: string;
};

export default function OperationsManagerDashboard() {
  const { user } = useAuth();
  const { context } = useViewContext();
  const [viewMode, setViewMode] = useState<
    "overview" | "floor" | "staff" | "waves"
  >("overview");
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressItem[]>([]);
  const [hourlyThroughput, setHourlyThroughput] = useState<
    HourlyThroughputItem[]
  >([]);
  const [waveStatus, setWaveStatus] = useState<WaveStatusItem[]>([]);
  const [metrics, setMetrics] = useState({
    throughput: 0,
    orderBacklog: 0,
    efficiency: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch operations dashboard data
  useEffect(() => {
    async function loadOperationsData() {
      const targetTenant = user?.tenantId || "tenant-1";
      setLoading(true);
      try {
        const warehouseIdParam =
          context.warehouseFilter.type === "SINGLE" &&
          context.warehouseFilter.warehouseIds?.[0]
            ? `&warehouseId=${context.warehouseFilter.warehouseIds[0]}`
            : "";

        const response = await fetch(
          `/api/dashboards/operations?tenantId=${targetTenant}${warehouseIdParam}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          setDailyProgress(result.data.dailyProgress || []);
          setHourlyThroughput(result.data.hourlyThroughput || []);
          setWaveStatus(result.data.waveStatus || []);
          setMetrics(result.data.metrics || { throughput: 0, orderBacklog: 0, efficiency: 0 });
        } else {
          console.error("API returned error:", result.error);
        }
      } catch (error) {
        console.error("Failed to load operations data:", error);
        // Set empty arrays on error
        setDailyProgress([]);
        setHourlyThroughput([]);
        setWaveStatus([]);
        setMetrics({ throughput: 0, orderBacklog: 0, efficiency: 0 });
      } finally {
        setLoading(false);
      }
    }
    loadOperationsData();
  }, [user?.tenantId, context.warehouseFilter]);

  // Inject AI Intelligence (The "Brain" Connection)
  useEffect(() => {
    // Simulate fetching real-time cargo context
    const cargoContext = {
      cargoType: "Chemical Drums (Hazardous)",
      temp: 25,
      destination: "Zone B",
      weight: 500,
    };

    fetch("/api/ai/logistics-debug", {
      method: "POST",
      body: JSON.stringify(cargoContext),
    })
      .then((res) => res.json())
      .then((data) => {
        // Add artificial delay for "Thinking" effect
        setTimeout(() => setAiInsights(data), 1500);
      })
      .catch((err) =>
        console.error("Failed to connect to Logistics Brain:", err),
      );
  }, []);

  const staffingStatus = useMemo(() => {
    return [
      { role: "Pickers", active: 12, total: 15, onBreak: 2, efficiency: 94 },
      { role: "Packers", active: 8, total: 8, onBreak: 0, efficiency: 98 },
      { role: "Forklift", active: 5, total: 6, onBreak: 1, efficiency: 88 },
      { role: "Receiving", active: 4, total: 4, onBreak: 0, efficiency: 92 },
    ];
  }, []);

  const stats = [
    {
      label: "Throughput",
      value: metrics.throughput.toFixed(0),
      unit: "units/hr",
      icon: "ri-speed-up-line",
      tooltip: "Current operational throughput across all zones",
      trend: "up" as const,
    },
    {
      label: "Active Staff",
      value: "29",
      unit: "/ 33",
      icon: "ri-team-line",
      tooltip: "Staff currently clocked in and active",
      trend: "neutral" as const,
    },
    {
      label: "Order Backlog",
      value: metrics.orderBacklog.toString(),
      icon: "ri-stack-line",
      tooltip: "Orders pending release to floor",
      trend: "down" as const,
      color: "text-green-400",
    },
    {
      label: "Efficiency",
      value: `${metrics.efficiency.toFixed(1)}%`,
      icon: "ri-bar-chart-groupped-line",
      tooltip: "Overall operational efficiency vs standard times",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Operations Manager Dashboard"
      description="Real-time oversight of daily floor operations, resource allocation, and fulfillment progress."
      shortDescription="Floor Operations Center"
      icon="ri-dashboard-3-line"
      systemInfo={{
        sap: "Operations Cockpit",
        oracle: "Warehouse Control Board",
        manhattan: "Operational Insights",
      }}
      stats={stats}
      actions={
        <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 flex-shrink-0">
          {(["overview", "floor", "staff", "waves"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 min-h-[36px] whitespace-nowrap flex-shrink-0 ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              <i
                className={`ri-${
                  mode === "overview"
                    ? "dashboard-line"
                    : mode === "floor"
                      ? "layout-grid-fill"
                      : mode === "staff"
                        ? "user-settings-line"
                        : "waves-left-up-line"
                } text-sm sm:text-base`}
              ></i>
              <span className="hidden sm:inline">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </span>
            </button>
          ))}
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Daily Progress Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dailyProgress.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      {item.name}
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {item.completed}{" "}
                      <span className="text-sm text-gray-500 font-normal">
                        / {item.total}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <span
                      className="text-xs font-bold"
                      style={{ color: item.color }}
                    >
                      {item.value}%
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Logistics Insights Card (NEW) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="ri-brain-line text-6xl text-indigo-400"></i>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-flashlight-line text-yellow-400"></i>
              AI Logistics Optimization
            </h3>

            {aiInsights ? (
              <div className="space-y-4 relative z-10">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                    Optimized Mode
                  </div>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {aiInsights.transport_optimization?.recommended_mode ||
                      "Analyzing..."}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-gray-400">Risk Score</div>
                    <div
                      className={`text-lg font-bold ${aiInsights.risk_assessment?.risk_score > 0.7 ? "text-red-400" : "text-green-400"}`}
                    >
                      {(aiInsights.risk_assessment?.risk_score * 100).toFixed(
                        1,
                      )}
                      %
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-gray-400">CO2 Savings</div>
                    <div className="text-lg font-bold text-green-400">
                      {aiInsights.transport_optimization?.co2_emissions
                        ? "12%"
                        : "0%"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-indigo-300 italic mt-2">
                  Powered by Logistics-ML v2.1
                </div>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                <span className="text-sm">Calculating optimal routes...</span>
              </div>
            )}
          </motion.div>

          {/* Throughput Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2 lg:col-span-3"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-bar-chart-grouped-line text-cyan-400"></i>
              Hourly Throughput vs Target
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyThroughput}>
                  <defs>
                    <linearGradient id="colorPicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPacks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="picks"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorPicks)"
                    name="Picked Lines"
                  />
                  <Area
                    type="monotone"
                    dataKey="packs"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorPacks)"
                    name="Packed Units"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    name="Target"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Staff View */}
      {viewMode === "staff" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Staffing Allocation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Staffing Allocation
              </h3>
              <div className="space-y-6">
                {staffingStatus.map((stat) => (
                  <div key={stat.role}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">
                        {stat.role}
                      </span>
                      <span className="text-gray-400">
                        {stat.active} / {stat.total} Active
                      </span>
                    </div>
                    <div className="flex bg-gray-700/50 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full"
                        style={{
                          width: `${(stat.active / stat.total) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-yellow-500 h-full"
                        style={{
                          width: `${(stat.onBreak / stat.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                      <span>Efficiency: {stat.efficiency}%</span>
                      <span>{stat.onBreak} on break</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Top Performers (Today)
              </h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        i === 0
                          ? "bg-yellow-500/80"
                          : i === 1
                            ? "bg-gray-400/80"
                            : i === 2
                              ? "bg-amber-700/80"
                              : "bg-gray-700"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        Operator #{244 + i}
                      </div>
                      <div className="text-xs text-gray-400">
                        Picking Zone A
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">
                        {165 - i * 8} UPH
                      </div>
                      <div className="text-xs text-gray-500">100% Accuracy</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Waves View */}
      {viewMode === "waves" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Wave ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Deadline
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {waveStatus.map((wave) => (
                <tr
                  key={wave.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-mono text-sm">
                    {wave.id}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {wave.type}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {wave.deadline}
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          wave.progress === 100
                            ? "bg-green-500"
                            : wave.progress > 50
                              ? "bg-cyan-500"
                              : "bg-yellow-500"
                        }`}
                        style={{ width: `${wave.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right mt-1 text-gray-400">
                      {wave.progress}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        wave.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : wave.status === "IN_PROGRESS"
                            ? "bg-blue-500/20 text-blue-400"
                            : wave.status === "RELEASED"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {wave.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm hover:underline">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floor View (Placeholder) */}
      {viewMode === "floor" && (
        <div className="w-full h-[600px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          ></div>
          <div className="text-center z-10">
            <i className="ri-map-2-line text-6xl text-gray-600 mb-4 block"></i>
            <h3 className="text-xl font-semibold text-white mb-2">
              Digital Twin Loading...
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              The visual layout of the warehouse floor with real-time heatmaps
              for congestion and activity.
            </p>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
