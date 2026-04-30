"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  priority: "low" | "medium" | "high" | "critical";
  actionUrl?: string;
}

interface WarehouseAlertsProps {
  warehouseId: string;
}

export default function WarehouseAlerts({ warehouseId }: WarehouseAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load alerts
    loadAlerts();

    // Set up real-time alert updates
    const interval = setInterval(loadAlerts, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [warehouseId]);

  const loadAlerts = async () => {
    try {
      const response = await fetch(`/api/warehouse/${warehouseId}/alerts`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      // Mock alerts for demo
      setAlerts([
        {
          id: "alert-001",
          type: "warning",
          title: "High Utilization",
          message: "Zone A utilization is above 90%",
          timestamp: new Date(),
          priority: "high",
          actionUrl: `/warehouses/${warehouseId}/zones/zone-a`,
        },
        {
          id: "alert-002",
          type: "info",
          title: "Maintenance Scheduled",
          message: "Forklift A1 maintenance due in 2 days",
          timestamp: new Date(Date.now() - 3600000),
          priority: "medium",
          actionUrl: `/warehouses/${warehouseId}?tab=operations`,
        },
        {
          id: "alert-003",
          type: "success",
          title: "Cycle Count Complete",
          message: "Zone B cycle count completed with 99.8% accuracy",
          timestamp: new Date(Date.now() - 7200000),
          priority: "low",
        },
      ]);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "info":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return "ri-alarm-warning-line text-red-400";
      case "high":
        return "ri-error-warning-line text-orange-400";
      case "medium":
        return "ri-information-line text-yellow-400";
      default:
        return "ri-checkbox-circle-line text-blue-400";
    }
  };

  const criticalAlerts = alerts.filter(
    (a) => a.priority === "critical" || a.priority === "high",
  );
  const displayAlerts = isExpanded ? alerts : alerts.slice(0, 3);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30"
        >
          <div className="flex items-center space-x-2 mb-2">
            <i className="ri-alarm-warning-line text-red-400 text-xl"></i>
            <h4 className="text-white font-semibold">
              Critical Alerts ({criticalAlerts.length})
            </h4>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-red-500/20 border border-red-500/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className={getPriorityIcon(alert.priority)}></i>
                      <span className="text-white font-medium">
                        {alert.title}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">{alert.message}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-semibold flex items-center space-x-2">
            <i className="ri-notification-line text-cyan-400"></i>
            <span>Recent Alerts ({alerts.length})</span>
          </h4>
          {alerts.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              {isExpanded ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
        <AnimatePresence>
          <div className="space-y-2">
            {displayAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className={getPriorityIcon(alert.priority)}></i>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-sm opacity-80">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {alert.actionUrl && (
                    <a
                      href={alert.actionUrl}
                      className="ml-2 px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
                    >
                      View
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
