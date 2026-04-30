/**
 * 🔔 QHSE SMART ALERTS
 * Intelligent, contextual alerts based on AI predictions and anomalies
 * Modern, sexy, actionable alerts
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiX,
} from "react-icons/fi";

interface SmartAlert {
  id: string;
  type: "RISK" | "ANOMALY" | "DEADLINE" | "RECOMMENDATION" | "ACHIEVEMENT";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date | string;
  read: boolean;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

interface QHSESmartAlertsProps {
  alerts: SmartAlert[];
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string) => void;
  maxVisible?: number;
}

const QHSESmartAlerts: React.FC<QHSESmartAlertsProps> = ({
  alerts,
  onDismiss,
  onAction,
  maxVisible = 5,
}) => {
  const getAlertColor = (severity: SmartAlert["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700";
      case "HIGH":
        return "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700";
      case "MEDIUM":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700";
      case "LOW":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700";
    }
  };

  const getAlertIcon = (type: SmartAlert["type"]) => {
    switch (type) {
      case "RISK":
        return <FiAlertTriangle className="w-5 h-5" />;
      case "ANOMALY":
        return <FiZap className="w-5 h-5" />;
      case "DEADLINE":
        return <FiClock className="w-5 h-5" />;
      case "RECOMMENDATION":
        return <FiCheckCircle className="w-5 h-5" />;
      case "ACHIEVEMENT":
        return <FiBell className="w-5 h-5" />;
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.read);
  const criticalAlerts = alerts.filter(
    (a) => a.severity === "CRITICAL" && !a.read,
  );

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiBell className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Smart Alerts
          </h3>
          {unreadAlerts.length > 0 && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
              {unreadAlerts.length} New
            </span>
          )}
          {criticalAlerts.length > 0 && (
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold animate-pulse">
              {criticalAlerts.length} Critical
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence>
          {alerts.slice(0, maxVisible).map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`border-2 rounded-lg p-4 ${getAlertColor(alert.severity)} ${
                !alert.read ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`mt-1 ${
                      alert.severity === "CRITICAL"
                        ? "text-red-600"
                        : alert.severity === "HIGH"
                          ? "text-orange-600"
                          : alert.severity === "MEDIUM"
                            ? "text-yellow-600"
                            : "text-blue-600"
                    }`}
                  >
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </h4>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.description}
                    </p>
                    {alert.relatedEntity && (
                      <p className="text-xs text-gray-500 mb-2">
                        Related: {alert.relatedEntity.name} (
                        {alert.relatedEntity.type})
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      {alert.action && (
                        <button
                          onClick={() => alert.action?.onClick()}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {alert.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss?.(alert.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QHSESmartAlerts;
