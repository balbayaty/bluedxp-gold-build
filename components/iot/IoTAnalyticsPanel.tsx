/**
 * IoT Analytics Panel Component
 * Display analytics and insights for IoT devices
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { IoTDevice, IoTComprehensiveAnalytics } from "@/types/iot";
import { iotAnalyticsService } from "@/lib/services/iot/iotAnalyticsService";
import { AdvancedIoTManager } from "@/lib/services/iot/iotManager";

export default function IoTAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<IoTComprehensiveAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [manager] = useState(() => new AdvancedIoTManager());

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const devices = await manager.getAllDevices();
      const comprehensiveAnalytics =
        await iotAnalyticsService.calculateComprehensiveAnalytics(devices);
      setAnalytics(comprehensiveAnalytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-[#9ca3af]">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-[#9ca3af]">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Total Devices</div>
          <div className="text-2xl font-bold text-white">
            {analytics.totalDevices}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Online</div>
          <div className="text-2xl font-bold text-green-400">
            {analytics.onlineDevices}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Network Health</div>
          <div className="text-2xl font-bold text-cyan-400">
            {analytics.networkHealth.toFixed(1)}%
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Avg Health</div>
          <div className="text-2xl font-bold text-white">
            {analytics.averageHealth.toFixed(1)}%
          </div>
        </motion.div>
      </div>

      {/* Trends */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trends</h3>
        <div className="space-y-3">
          {analytics.trends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white capitalize">
                  {trend.metric.replace("_", " ")}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    trend.trend === "improving"
                      ? "bg-green-500/20 text-green-400"
                      : trend.trend === "declining"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {trend.trend}
                </span>
              </div>
              <span className="text-[#9ca3af]">
                {trend.changeRate > 0 ? "+" : ""}
                {trend.changeRate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-[#9ca3af] mb-2">Data Transmission</div>
          <div className="text-xl font-bold text-white">
            {(analytics.totalDataTransmission / 1000).toFixed(2)} Gbps
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-[#9ca3af] mb-2">Avg Latency</div>
          <div className="text-xl font-bold text-white">
            {analytics.averageLatency.toFixed(1)} ms
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-[#9ca3af] mb-2">Power Efficiency</div>
          <div className="text-xl font-bold text-green-400">
            {analytics.powerEfficiency}%
          </div>
        </div>
      </div>
    </div>
  );
}
