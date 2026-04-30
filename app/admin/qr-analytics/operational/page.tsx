"use client";

/**
 * Operational QR Analytics Dashboard
 * Real-time operational intelligence and monitoring
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

export default function OperationalQRAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [realTime, setRealTime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperationalMetrics();
    const interval = setInterval(loadOperationalMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOperationalMetrics = async () => {
    try {
      const response = await fetch(
        "/api/qr/analytics/enterprise?level=operational",
      );
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
        setRealTime(data.realTime);
      }
    } catch (error) {
      console.error("Error loading operational metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl mb-4"></i>
          <div>Loading operational analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <i className="ri-dashboard-line text-blue-400"></i>
          Operational QR Analytics
        </h1>

        {/* Real-Time Metrics */}
        {realTime && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Active Scans</div>
              <div className="text-2xl font-bold text-green-400">
                {realTime.activeScans}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">
                Scans (Last Minute)
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {realTime.scansLastMinute}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">
                Avg Response Time
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {realTime.avgResponseTime}ms
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">System Health</div>
              <div
                className={`text-2xl font-bold ${
                  realTime.systemHealth === "healthy"
                    ? "text-green-400"
                    : realTime.systemHealth === "degraded"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {realTime.systemHealth.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Module Performance */}
        {metrics?.scansByModule && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Scans by Module</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(metrics.scansByModule).map(
                  ([module, data]: [string, any]) => ({
                    module,
                    scans: data.total,
                    unique: data.unique,
                  }),
                )}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="module" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="scans" fill="#8b5cf6" name="Total Scans" />
                <Bar dataKey="unique" fill="#10b981" name="Unique Scans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Device Analytics */}
        {metrics?.deviceAnalytics && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Device Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(metrics.deviceAnalytics).map(
                    ([device, count]: [string, any]) => ({
                      name: device,
                      value: count,
                    }),
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(metrics.deviceAnalytics).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
