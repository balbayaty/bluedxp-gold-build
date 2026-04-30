/**
 * Real-Time Updates Component
 * Displays live updates and notifications
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { realTimeService } from "@/lib/services/trade-compliance/realTimeService";
import type { RealTimeUpdate } from "@/lib/services/trade-compliance/realTimeService";

export default function RealTimeUpdates() {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to real-time service
    realTimeService.connect("default");
    setIsConnected(true);

    // Subscribe to all updates
    const unsubscribe = realTimeService.subscribe("all", (update) => {
      setUpdates((prev) => [update, ...prev].slice(0, 10)); // Keep last 10 updates
    });

    return () => {
      unsubscribe();
      realTimeService.disconnect();
    };
  }, []);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "record_created":
        return "ri-file-add-line text-blue-400";
      case "record_updated":
        return "ri-file-edit-line text-green-400";
      case "license_status_changed":
        return "ri-shield-check-line text-purple-400";
      case "risk_alert":
        return "ri-alert-line text-red-400";
      case "compliance_score_updated":
        return "ri-bar-chart-line text-orange-400";
      default:
        return "ri-notification-line text-[#9ca3af]";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500/50 bg-red-500/10";
      case "high":
        return "border-orange-500/50 bg-orange-500/10";
      case "medium":
        return "border-yellow-500/50 bg-yellow-500/10";
      default:
        return "border-blue-500/50 bg-blue-500/10";
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <AnimatePresence>
        {updates.map((update, idx) => (
          <motion.div
            key={`${update.entityId}-${update.timestamp}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ delay: idx * 0.1 }}
            className={`mb-2 border-l-4 rounded-lg p-3 shadow-lg bg-white/5 backdrop-blur-xl ${getPriorityColor(update.priority)}`}
          >
            <div className="flex items-start gap-3">
              <i
                className={`${getUpdateIcon(update.type)} text-xl flex-shrink-0 mt-0.5`}
              ></i>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white mb-1">
                  {update.type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
                <div className="text-xs text-[#9ca3af] mb-1">
                  {update.entityType}: {update.entityId.slice(0, 8)}...
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
