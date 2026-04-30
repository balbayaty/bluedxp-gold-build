/**
 * 📡 REAL-TIME PERMISSION MONITOR
 *
 * Beautiful real-time monitoring:
 * - Live event stream
 * - Anomaly detection
 * - Activity feed
 * - Performance metrics
 * - Alert system
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { permissionRealTimeMonitor } from "@/lib/services/permissions/permissionRealTimeMonitor";
import type { PermissionEvent } from "@/lib/services/permissions/permissionRealTimeMonitor";

export default function PermissionRealTimeMonitorComponent() {
  const [events, setEvents] = useState<PermissionEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [anomalies, setAnomalies] = useState<PermissionEvent[]>([]);
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load initial events
    const recent = permissionRealTimeMonitor.getRecentEvents(50);
    setEvents(recent);

    // Subscribe to new events
    const subId = permissionRealTimeMonitor.subscribe({
      callback: (event) => {
        setEvents((prev) => [event, ...prev].slice(0, 100));
      },
    });
    subscriptionIdRef.current = subId;

    return () => {
      if (subscriptionIdRef.current) {
        permissionRealTimeMonitor.unsubscribe(subscriptionIdRef.current);
      }
      permissionRealTimeMonitor.stopMonitoring();
    };
  }, []);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      permissionRealTimeMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      permissionRealTimeMonitor.startMonitoring();
      setIsMonitoring(true);
    }
  };

  useEffect(() => {
    // Check for anomalies periodically
    const interval = setInterval(async () => {
      const detected = await permissionRealTimeMonitor.detectAnomalies();
      setAnomalies(detected);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getEventColor = (type: string) => {
    const colors = {
      GRANT: "bg-green-500/20 text-green-400 border-green-500/30",
      REVOKE: "bg-red-500/20 text-red-400 border-red-500/30",
      MODIFY: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      ACCESS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      DENIED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      ANOMALY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return colors[type as keyof typeof colors] || colors.ACCESS;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      CRITICAL: "ri-error-warning-line",
      HIGH: "ri-alert-line",
      MEDIUM: "ri-information-line",
      LOW: "ri-checkbox-circle-line",
    };
    return icons[severity as keyof typeof icons] || icons.LOW;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <i className="ri-radar-line text-cyan-400"></i>
                Real-Time Permission Monitor
              </h1>
              <p className="text-gray-400">
                Live monitoring of permission changes and access patterns
              </p>
            </div>
            <button
              onClick={toggleMonitoring}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                isMonitoring
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              <i className={`ri-${isMonitoring ? "stop" : "play"}-line`}></i>
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Status</div>
              <div
                className={`w-3 h-3 rounded-full ${isMonitoring ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
              ></div>
            </div>
            <div className="text-2xl font-bold">
              {isMonitoring ? "Live" : "Stopped"}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-sm text-gray-400 mb-2">Total Events</div>
            <div className="text-2xl font-bold text-cyan-400">
              {events.length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-sm text-gray-400 mb-2">Anomalies</div>
            <div className="text-2xl font-bold text-red-400">
              {anomalies.length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-sm text-gray-400 mb-2">Events/Min</div>
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(events.length / 60)}
            </div>
          </div>
        </div>

        {/* Anomalies Alert */}
        {anomalies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-alert-line text-2xl text-red-400"></i>
              <h2 className="text-xl font-bold">Anomalies Detected</h2>
            </div>
            <div className="space-y-2">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="text-sm">
                  {anomaly.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Event Stream */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4">Live Event Stream</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            <AnimatePresence>
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <i className="ri-inbox-line text-4xl mb-2"></i>
                  <p>No events yet. Start monitoring to see live events.</p>
                </div>
              ) : (
                events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 rounded-lg border ${getEventColor(event.type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <i
                          className={`${getSeverityIcon(event.severity)} text-lg`}
                        ></i>
                        <span className="font-semibold">{event.type}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                          {event.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm mb-1">{event.message}</div>
                    <div className="text-xs text-gray-400">
                      User: {event.userName} ({event.userId})
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
