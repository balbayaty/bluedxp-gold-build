/**
 * Geofence Real-Time Updates Component
 *
 * Displays real-time geofence events and updates
 * Integrates with WebSocket for live updates
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geofenceRealtimeService } from "@/lib/services/geofence/realtime/geofenceRealtimeService";
import type { RealtimeGeofenceUpdate } from "@/lib/services/geofence/realtime/geofenceRealtimeService";

interface GeofenceRealtimeUpdatesProps {
  tenantId: string;
  zoneIds?: string[];
  shipmentIds?: string[];
}

export default function GeofenceRealtimeUpdates({
  tenantId,
  zoneIds,
  shipmentIds,
}: GeofenceRealtimeUpdatesProps) {
  const [updates, setUpdates] = useState<RealtimeGeofenceUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    geofenceRealtimeService.initialize(tenantId).then(() => {
      setConnected(true);
    });

    // Subscribe to updates
    const subId = geofenceRealtimeService.subscribe(
      tenantId,
      [
        {
          type: "ZONE_ENTRY",
          zoneIds,
          shipmentIds,
        },
        {
          type: "ZONE_EXIT",
          zoneIds,
          shipmentIds,
        },
        {
          type: "DWELL_WARNING",
          zoneIds,
          shipmentIds,
        },
        {
          type: "DWELL_EXCEEDED",
          zoneIds,
          shipmentIds,
        },
        {
          type: "ANOMALY",
          zoneIds,
          shipmentIds,
        },
      ],
      (update) => {
        setUpdates((prev) => [update, ...prev].slice(0, 50)); // Keep last 50 updates
      },
    );

    setSubscriptionId(subId);

    return () => {
      if (subId) {
        geofenceRealtimeService.unsubscribe(subId);
      }
      geofenceRealtimeService.disconnect();
    };
  }, [tenantId, zoneIds, shipmentIds]);

  const getUpdateIcon = (type: RealtimeGeofenceUpdate["type"]) => {
    switch (type) {
      case "ZONE_ENTRY":
        return "→";
      case "ZONE_EXIT":
        return "←";
      case "DWELL_WARNING":
        return "⚠";
      case "DWELL_EXCEEDED":
        return "🚨";
      case "ANOMALY":
        return "⚠️";
      default:
        return "•";
    }
  };

  const getUpdateColor = (
    type: RealtimeGeofenceUpdate["type"],
    priority: RealtimeGeofenceUpdate["priority"],
  ) => {
    if (priority === "CRITICAL") return "text-red-600 dark:text-red-400";
    if (priority === "HIGH") return "text-orange-600 dark:text-orange-400";
    if (type === "ZONE_ENTRY") return "text-green-600 dark:text-green-400";
    if (type === "ZONE_EXIT") return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Real-Time Updates
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"} animate-pulse`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setUpdates([])}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No real-time updates yet</p>
              <p className="text-xs mt-1">
                Updates will appear here as events occur
              </p>
            </div>
          ) : (
            updates.map((update, idx) => (
              <motion.div
                key={`${update.timestamp.getTime()}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-lg border ${
                  update.priority === "CRITICAL"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : update.priority === "HIGH"
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-xl ${getUpdateColor(update.type, update.priority)}`}
                  >
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {update.type.replace(/_/g, " ")}
                      </span>
                      {update.priority !== "LOW" && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            update.priority === "CRITICAL"
                              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                              : "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
                          }`}
                        >
                          {update.priority}
                        </span>
                      )}
                    </div>
                    {update.zone && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Zone: {update.zone.name}
                      </div>
                    )}
                    {update.event && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {update.event.shipmentId &&
                          `Shipment: ${update.event.shipmentId}`}
                        {update.event.dwellTime !== undefined &&
                          ` • Dwell: ${update.event.dwellTime.toFixed(1)}m`}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {update.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
