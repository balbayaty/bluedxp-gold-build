"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiZap,
  FiShield,
  FiActivity,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface LiveMetric {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
  trend: "up" | "down" | "stable";
  sparkline: number[];
  benchmark?: number;
  insight?: string;
  subMetrics?: { label: string; value: string }[];
  status?: "excellent" | "good" | "warning" | "critical";
}

export default function LiveMetricsBar() {
  const [metrics, setMetrics] = useState<LiveMetric[]>([
    {
      label: "Active Users",
      value: "12,458",
      change: 12.5,
      icon: FiUsers,
      color: "blue",
      trend: "up",
      sparkline: [11200, 11500, 11800, 12000, 12100, 12200, 12300, 12458],
      benchmark: 12000,
      insight: "15% above industry average",
      subMetrics: [
        { label: "New Users", value: "1,234" },
        { label: "Active Today", value: "8,912" },
      ],
      status: "excellent",
    },
    {
      label: "Operations/Hour",
      value: "8,234",
      change: 8.3,
      icon: FiZap,
      color: "cyan",
      trend: "up",
      sparkline: [7800, 7900, 8000, 8100, 8150, 8200, 8250, 8234],
      benchmark: 8000,
      insight: "Peak performance window",
      subMetrics: [
        { label: "Avg Response", value: "0.12s" },
        { label: "Success Rate", value: "99.8%" },
      ],
      status: "excellent",
    },
    {
      label: "System Uptime",
      value: "99.99%",
      change: 0.01,
      icon: FiShield,
      color: "green",
      trend: "stable",
      sparkline: [99.95, 99.96, 99.97, 99.98, 99.99, 99.99, 99.99, 99.99],
      benchmark: 99.9,
      insight: "Exceeds SLA by 0.09%",
      subMetrics: [
        { label: "MTTR", value: "2.3 min" },
        { label: "Incidents", value: "0" },
      ],
      status: "excellent",
    },
    {
      label: "Efficiency Score",
      value: "94.2%",
      change: 5.7,
      icon: FiActivity,
      color: "purple",
      trend: "up",
      sparkline: [88, 89, 90, 91, 92, 93, 94, 94.2],
      benchmark: 90,
      insight: "Top quartile performance",
      subMetrics: [
        { label: "Process Opt", value: "96.1%" },
        { label: "Resource Util", value: "92.3%" },
      ],
      status: "excellent",
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          const newValue =
            metric.label === "Active Users"
              ? Math.floor(Math.random() * 2000 + 12000)
              : metric.label === "Operations/Hour"
                ? Math.floor(Math.random() * 500 + 8000)
                : parseFloat(metric.value.replace(/[^0-9.]/g, ""));

          const newSparkline = [...metric.sparkline.slice(1), newValue];

          return {
            ...metric,
            value:
              metric.label === "Active Users"
                ? `${newValue.toLocaleString()}`
                : metric.label === "Operations/Hour"
                  ? `${newValue.toLocaleString()}`
                  : metric.value,
            sparkline: newSparkline,
            change:
              metric.label === "Active Users"
                ? parseFloat((Math.random() * 5 + 10).toFixed(1))
                : metric.change,
          };
        }),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "excellent":
        return "border-green-500/50 bg-green-500/5";
      case "good":
        return "border-blue-500/50 bg-blue-500/5";
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/5";
      case "critical":
        return "border-red-500/50 bg-red-500/5";
      default:
        return "border-slate-700/50";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up"
      ? FiTrendingUp
      : trend === "down"
        ? FiTrendingDown
        : FiActivity;
  };

  const colorMap: Record<
    string,
    { icon: string; gradient: string; glow: string; border: string }
  > = {
    blue: {
      icon: "text-blue-400",
      gradient: "from-blue-500/20 to-blue-600/10",
      glow: "from-blue-500/10",
      border: "border-blue-500/30",
    },
    cyan: {
      icon: "text-cyan-400",
      gradient: "from-cyan-500/20 to-cyan-600/10",
      glow: "from-cyan-500/10",
      border: "border-cyan-500/30",
    },
    green: {
      icon: "text-green-400",
      gradient: "from-green-500/20 to-green-600/10",
      glow: "from-green-500/10",
      border: "border-green-500/30",
    },
    purple: {
      icon: "text-purple-400",
      gradient: "from-purple-500/20 to-purple-600/10",
      glow: "from-purple-500/10",
      border: "border-purple-500/30",
    },
  };

  return (
    <section
      id="metrics"
      className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/80 to-slate-900/50 border-y border-slate-800/50 relative z-10 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const TrendIcon = getTrendIcon(metric.trend);
            const sparklineData = metric.sparkline.map((val, i) => ({
              value: val,
              index: i,
            }));
            const minVal = Math.min(...metric.sparkline);
            const maxVal = Math.max(...metric.sparkline);
            const normalizedData = sparklineData.map((d) => ({
              ...d,
              normalized: ((d.value - minVal) / (maxVal - minVal || 1)) * 100,
            }));

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`group relative p-5 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-md border-2 ${getStatusColor(metric.status)} rounded-2xl transition-all cursor-pointer shadow-xl hover:shadow-2xl overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: "24px 24px",
                    }}
                  />
                </div>

                {/* Gradient Overlay */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[metric.color]?.glow || "from-blue-500/20"} to-transparent rounded-full blur-2xl`}
                />

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[metric.color]?.gradient || "from-blue-500/20 to-blue-600/10"} border ${colorMap[metric.color]?.border || "border-blue-500/30"} backdrop-blur-sm`}
                    >
                      <metric.icon
                        className={`w-5 h-5 ${colorMap[metric.color]?.icon || "text-blue-400"}`}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                        {metric.label}
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          key={metric.value}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="text-2xl font-bold text-white"
                        >
                          {metric.value}
                        </motion.div>
                        <motion.span
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            metric.trend === "up"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : metric.trend === "down"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                          }`}
                        >
                          <TrendIcon className="w-3 h-3" />
                          {metric.change > 0 ? "+" : ""}
                          {metric.change}%
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sparkline Chart */}
                <div className="relative z-10 mb-4 h-16 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={normalizedData}>
                      <defs>
                        <linearGradient
                          id={`gradient-${index}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={
                              metric.color === "blue"
                                ? "#3b82f6"
                                : metric.color === "cyan"
                                  ? "#06b6d4"
                                  : metric.color === "green"
                                    ? "#22c55e"
                                    : "#a78bfa"
                            }
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={
                              metric.color === "blue"
                                ? "#3b82f6"
                                : metric.color === "cyan"
                                  ? "#06b6d4"
                                  : metric.color === "green"
                                    ? "#22c55e"
                                    : "#a78bfa"
                            }
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="normalized"
                        stroke={
                          metric.color === "blue"
                            ? "#60a5fa"
                            : metric.color === "cyan"
                              ? "#22d3ee"
                              : metric.color === "green"
                                ? "#4ade80"
                                : "#a78bfa"
                        }
                        strokeWidth={2}
                        fill={`url(#gradient-${index})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Sub Metrics */}
                {metric.subMetrics && (
                  <div className="relative z-10 grid grid-cols-2 gap-2 mb-3 pt-3 border-t border-slate-700/50">
                    {metric.subMetrics.map((sub, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xs text-slate-500 mb-0.5">
                          {sub.label}
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {sub.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Insight Badge */}
                {metric.insight && (
                  <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-slate-700/50">
                    <FiInfo className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400 leading-tight">
                      {metric.insight}
                    </span>
                  </div>
                )}

                {/* Benchmark Indicator */}
                {metric.benchmark && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium text-slate-300">
                        {typeof metric.benchmark === "number"
                          ? metric.benchmark >
                            parseFloat(metric.value.replace(/[^0-9.]/g, ""))
                            ? "Above Target"
                            : "On Target"
                          : "Target Met"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hover Effect Glow */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${colorMap[metric.color]?.glow || "from-blue-500/10"} to-transparent rounded-2xl pointer-events-none`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
