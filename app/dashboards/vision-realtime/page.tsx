/**
 * Real-Time Vision Dashboard
 * Live monitoring of vision analysis, streams, and alerts
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import VisionMetricsWidget from "@/components/dashboards/widgets/VisionMetricsWidget";
import { motion } from "framer-motion";

export default function RealTimeVisionDashboard() {
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active streams
      const streamsResponse = await fetch("/api/ai/vision/stream?action=list");
      const streamsData = await streamsResponse.json();
      if (streamsData.success) {
        setActiveStreams(streamsData.streams || []);
      }

      // Fetch metrics
      const metricsResponse = await fetch(
        "/api/ai/vision/metrics?timeframe=today",
      );
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }

      // Fetch recent alerts (mock for now)
      setAlerts([
        {
          id: "1",
          type: "critical",
          message: "Critical anomaly detected in Warehouse A",
          timestamp: new Date().toISOString(),
          streamId: "stream-1",
        },
        {
          id: "2",
          type: "high",
          message: "Safety violation detected in Loading Dock",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          streamId: "stream-2",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Real-Time Vision Dashboard"
        description="Live vision monitoring"
      >
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line animate-spin text-4xl text-gray-400"></i>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Real-Time Vision Dashboard"
      description="Live monitoring of AI vision analysis, streams, and alerts"
    >
      <div className="space-y-6">
        {/* Metrics Widget */}
        <VisionMetricsWidget timeframe="today" module="all" />

        {/* Active Streams */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              Active Streams ({activeStreams.length})
            </h3>
            <a
              href="/ai-vision/stream"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage Streams →
            </a>
          </div>
          {activeStreams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-live-line text-4xl mb-2"></i>
              <p>No active streams</p>
              <a
                href="/ai-vision/stream"
                className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
              >
                Start a stream →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreams.map((stream) => (
                <motion.div
                  key={stream.streamId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      {stream.name || stream.source?.name || "Stream"}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        stream.status === "analyzing"
                          ? "bg-green-100 text-green-800"
                          : stream.status === "connected"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {stream.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {stream.source?.location || "Unknown Location"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Frames: {stream.framesAnalyzed || 0}</span>
                    <span>FPS: {stream.currentFPS?.toFixed(1) || 0}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Recent Alerts</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-notification-off-line text-4xl mb-2"></i>
              <p>No recent alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border-l-4 rounded p-4 ${
                    alert.type === "critical"
                      ? "border-red-500 bg-red-50"
                      : alert.type === "high"
                        ? "border-orange-500 bg-orange-50"
                        : "border-yellow-500 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        alert.type === "critical"
                          ? "bg-red-200 text-red-800"
                          : alert.type === "high"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/ai-vision-unified"
            className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <i className="ri-dashboard-3-line text-3xl mb-2"></i>
            <h4 className="font-bold mb-1">Unified Dashboard</h4>
            <p className="text-sm opacity-90">Comprehensive vision analysis</p>
          </a>
          <a
            href="/ai-vision/stream"
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <i className="ri-live-line text-3xl mb-2"></i>
            <h4 className="font-bold mb-1">Live Streaming</h4>
            <p className="text-sm opacity-90">Real-time stream analysis</p>
          </a>
          <a
            href="/ai-vision/batch"
            className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <i className="ri-folder-upload-line text-3xl mb-2"></i>
            <h4 className="font-bold mb-1">Batch Analysis</h4>
            <p className="text-sm opacity-90">Bulk image processing</p>
          </a>
        </div>
      </div>
    </PageTemplate>
  );
}
