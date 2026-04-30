/**
 * Real-Time Monitoring Card
 *
 * Live monitoring of MaaS platform metrics
 * - Resource utilization
 * - Active operations
 * - System health
 * - Performance metrics
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RealTimeMonitoringCardProps {
  data?: any;
  expanded: boolean;
  onToggle: () => void;
}

export default function RealTimeMonitoringCard({
  data,
  expanded,
  onToggle,
}: RealTimeMonitoringCardProps) {
  const [metrics, setMetrics] = useState({
    activeOperations: 0,
    resourceUtilization: 0,
    systemHealth: 100,
    responseTime: 0,
    throughput: 0,
  });

  const [timeSeries, setTimeSeries] = useState<
    Array<{ time: string; value: number }>
  >([]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics({
        activeOperations: Math.floor(Math.random() * 50) + 10,
        resourceUtilization: Math.random() * 100,
        systemHealth: 95 + Math.random() * 5,
        responseTime: Math.random() * 500 + 100,
        throughput: Math.random() * 1000 + 500,
      });

      const now = new Date();
      setTimeSeries((prev) => [
        ...prev.slice(-19), // Keep last 20 points
        {
          time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`,
          value: Math.random() * 100,
        },
      ]);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Real-Time Monitoring
              </h3>
              <p className="text-sm text-gray-400">Live system metrics</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            {expanded ? (
              <Minimize2 className="w-5 h-5 text-gray-400" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <MetricItem
            label="Active Operations"
            value={metrics.activeOperations}
            format="number"
            icon={<Zap className="w-4 h-4" />}
            color="blue"
          />
          <MetricItem
            label="Utilization"
            value={metrics.resourceUtilization}
            format="percentage"
            icon={<TrendingUp className="w-4 h-4" />}
            color="green"
          />
          <MetricItem
            label="System Health"
            value={metrics.systemHealth}
            format="percentage"
            icon={
              metrics.systemHealth > 95 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )
            }
            color={metrics.systemHealth > 95 ? "green" : "amber"}
          />
        </div>

        {/* Real-Time Chart */}
        {expanded && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      timeSeries.length > 0
                        ? timeSeries
                        : [{ time: "0:0:0", value: 0 }]
                    }
                  >
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9ca3af"
                      fontSize={12}
                      tick={{ fill: "#9ca3af" }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tick={{ fill: "#9ca3af" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="url(#colorValue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 mt-4 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-400">Live updates every 2 seconds</span>
        </div>
      </div>
    </motion.div>
  );
}

function MetricItem({
  label,
  value,
  format,
  icon,
  color,
}: {
  label: string;
  value: number;
  format: "number" | "percentage";
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <div className={colorClasses[color as keyof typeof colorClasses]}>
          {icon}
        </div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">
        {format === "percentage"
          ? `${value.toFixed(1)}%`
          : value.toLocaleString()}
      </p>
    </div>
  );
}
