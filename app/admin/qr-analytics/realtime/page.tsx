"use client";

/**
 * Real-Time QR Monitoring Dashboard
 * Live monitoring with WebSocket support
 * Future-Ready (2024-2040)
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RealTimeScan {
  id: string;
  qrId: string;
  timestamp: Date;
  location: string;
  device: string;
  module: string;
  responseTime: number;
}

export default function RealTimeQRMonitoringDashboard() {
  const [scans, setScans] = useState<RealTimeScan[]>([]);
  const [metrics, setMetrics] = useState({
    activeScans: 0,
    scansLastMinute: 0,
    scansLastHour: 0,
    avgResponseTime: 0,
    errorRate: 0,
    systemHealth: "healthy" as "healthy" | "degraded" | "critical",
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectWebSocket();

    // Also poll API as fallback
    const interval = setInterval(loadMetrics, 2000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(interval);
    };
  }, []);

  const connectWebSocket = () => {
    try {
      // Use wss:// for HTTPS, ws:// for HTTP
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/qr/realtime`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("QR WebSocket connected");
        // Subscribe to QR scans
        ws.send(
          JSON.stringify({
            type: "subscribe-qr-scans",
            qrId: null, // Subscribe to all
            tenantId: undefined, // Could get from session
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "scan" || data.scan) {
            handleNewScan(data.scan || data);
          } else if (data.type === "metrics" || data.metrics) {
            setMetrics(data.metrics || data);
          } else if (data.type === "qr-scan") {
            handleNewScan(data.scan);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setIsConnected(false);
    }
  };

  const handleNewScan = (scan: RealTimeScan) => {
    setScans((prev) => [scan, ...prev].slice(0, 100)); // Keep last 100 scans
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch(
        "/api/qr/analytics/enterprise?level=operational",
      );
      const data = await response.json();
      if (data.success && data.realTime) {
        setMetrics(data.realTime);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-green-400 rounded-full"
              />
              <i className="ri-pulse-line text-green-400"></i>
              Real-Time QR Monitoring
            </h1>
            <p className="text-gray-400">
              Live scan tracking and system monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isConnected
                  ? "bg-green-900/30 border border-green-500/30"
                  : "bg-red-900/30 border border-red-500/30"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
              />
              <span className="text-sm">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="text-sm text-gray-400 mb-1">Active Scans</div>
            <div className="text-3xl font-bold text-green-400">
              {metrics.activeScans}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="text-sm text-gray-400 mb-1">
              Scans (Last Minute)
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {metrics.scansLastMinute}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="text-sm text-gray-400 mb-1">Avg Response Time</div>
            <div className="text-3xl font-bold text-purple-400">
              {metrics.avgResponseTime}ms
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="text-sm text-gray-400 mb-1">System Health</div>
            <div
              className={`text-3xl font-bold ${
                metrics.systemHealth === "healthy"
                  ? "text-green-400"
                  : metrics.systemHealth === "degraded"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {metrics.systemHealth.toUpperCase()}
            </div>
          </motion.div>
        </div>

        {/* Live Scan Feed */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="ri-radar-line text-green-400"></i>
            Live Scan Feed
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {scans.map((scan) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <div>
                      <div className="font-mono text-sm">
                        {scan.qrId.slice(0, 20)}...
                      </div>
                      <div className="text-xs text-gray-400">
                        {scan.location} • {scan.device}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {scan.responseTime}ms
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {scans.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <i className="ri-inbox-line text-4xl mb-2"></i>
                <div>Waiting for scans...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
