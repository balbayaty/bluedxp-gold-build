"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LiveMetric } from "@/types/showcase";

export default function LiveMetricsWall({
  realTimeEnabled,
}: {
  realTimeEnabled: boolean;
}) {
  const [metrics, setMetrics] = useState<LiveMetric[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  // Generate initial metrics
  useEffect(() => {
    const initialMetrics: LiveMetric[] = [
      {
        id: "1",
        label: "Total Orders",
        value: 12450,
        trend: "up",
        change: 12.5,
        system: "wms",
        icon: "ri-shopping-cart-line",
      },
      {
        id: "2",
        label: "Inventory Value",
        value: "SAR 45.2M",
        trend: "up",
        change: 8.3,
        system: "wms",
        icon: "ri-money-dollar-circle-line",
      },
      {
        id: "3",
        label: "Safety Compliance",
        value: "98.5%",
        trend: "up",
        change: 2.1,
        system: "hazalyze",
        icon: "ri-shield-check-line",
      },
      {
        id: "4",
        label: "AI Detections",
        value: 3420,
        trend: "up",
        change: 15.2,
        system: "aivision",
        icon: "ri-eye-line",
      },
      {
        id: "5",
        label: "Active Alerts",
        value: 12,
        trend: "down",
        change: -25,
        system: "all",
        icon: "ri-alert-line",
      },
      {
        id: "6",
        label: "System Uptime",
        value: "99.9%",
        trend: "neutral",
        system: "all",
        icon: "ri-server-line",
      },
    ];
    setMetrics(initialMetrics);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          if (typeof metric.value === "number") {
            const change = (Math.random() - 0.5) * 0.1;
            return {
              ...metric,
              value: Math.max(0, Math.floor(metric.value * (1 + change))),
              change: parseFloat((change * 100).toFixed(1)),
            };
          }
          return metric;
        }),
      );
      setUpdateCount((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // Chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      wms: Math.floor(Math.random() * 1000) + 500,
      hazalyze: Math.floor(Math.random() * 100) + 50,
      aivision: Math.floor(Math.random() * 500) + 200,
    }));
  }, [updateCount]);

  return (
    <div className="relative min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Live Metrics Wall
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Real-time performance metrics across all systems
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <AnimatePresence mode="popLayout">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <i
                    className={`${(metric as any).icon || "ri-activity-line"} text-2xl text-cyan-400`}
                  ></i>
                  {metric.change && (
                    <span
                      className={`text-xs font-medium ${
                        metric.trend === "up"
                          ? "text-green-400"
                          : metric.trend === "down"
                            ? "text-red-400"
                            : "text-[#9ca3af]"
                      }`}
                    >
                      {metric.trend === "up"
                        ? "↑"
                        : metric.trend === "down"
                          ? "↓"
                          : "→"}{" "}
                      {Math.abs(metric.change)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {typeof metric.value === "number"
                    ? metric.value.toLocaleString()
                    : metric.value}
                </div>
                <div className="text-sm text-[#9ca3af]">{metric.label}</div>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      metric.system === "wms"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : metric.system === "hazalyze"
                          ? "bg-purple-500/20 text-purple-400"
                          : metric.system === "aivision"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {metric.system.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Real-time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white">
              System Activity (Last 24 Hours)
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-[#9ca3af]">Live</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="wms"
                stroke="#06b6d4"
                strokeWidth={2}
                name="WMS"
              />
              <Line
                type="monotone"
                dataKey="hazalyze"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Hazalyze"
              />
              <Line
                type="monotone"
                dataKey="aivision"
                stroke="#10b981"
                strokeWidth={2}
                name="AI Vision"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
