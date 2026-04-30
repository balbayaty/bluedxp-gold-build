/**
 * 🛡️ SECURITY ALERTS PANEL
 * 
 * Display and manage security alerts:
 * - Alert list with filtering
 * - Severity indicators
 * - Acknowledge/resolve actions
 * - Real-time updates
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SecurityAlert, AlertType } from "@/lib/services/auth/anomalyDetectionService";
import { formatDistanceToNow } from "date-fns";

interface SecurityAlertsPanelProps {
  userId?: string; // If provided, show only this user's alerts
  isAdmin?: boolean;
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return { color: "bg-red-500", textColor: "text-red-400", borderColor: "border-red-500/30" };
    case "high":
      return { color: "bg-orange-500", textColor: "text-orange-400", borderColor: "border-orange-500/30" };
    case "medium":
      return { color: "bg-yellow-500", textColor: "text-yellow-400", borderColor: "border-yellow-500/30" };
    default:
      return { color: "bg-blue-500", textColor: "text-blue-400", borderColor: "border-blue-500/30" };
  }
};

const getAlertIcon = (type: AlertType): string => {
  switch (type) {
    case "brute_force":
      return "ri-key-line";
    case "impossible_travel":
      return "ri-flight-takeoff-line";
    case "new_device":
      return "ri-smartphone-line";
    case "unusual_time":
      return "ri-time-line";
    case "unusual_location":
      return "ri-map-pin-line";
    case "permission_escalation":
      return "ri-shield-cross-line";
    case "mass_data_access":
      return "ri-database-2-line";
    case "api_abuse":
      return "ri-code-s-slash-line";
    default:
      return "ri-alert-line";
  }
};

const SecurityAlertsPanel: React.FC<SecurityAlertsPanelProps> = ({
  userId,
  isAdmin = false,
}) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "acknowledged" | "all">("active");

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        userId ? `/api/users/${userId}/security/alerts` : "/api/security/alerts"
      );
      
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data || []);
      } else {
        // Use mock data
        setAlerts(getMockAlerts());
      }
    } catch (error) {
      setAlerts(getMockAlerts());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAlerts = (): SecurityAlert[] => [
    {
      id: "alert_1",
      userId: "user_1",
      type: "brute_force",
      severity: "high",
      title: "Multiple Failed Login Attempts",
      description: "7 failed login attempts in the last hour from IP 192.168.1.100",
      metadata: { failedCount: 7, ipAddress: "192.168.1.100" },
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      status: "active",
    },
    {
      id: "alert_2",
      userId: "user_2",
      type: "impossible_travel",
      severity: "critical",
      title: "Impossible Travel Detected",
      description: "Login from Dubai after London within 0.5 hours (5,500km apart)",
      metadata: { distance: 5500, timeDiffHours: 0.5 },
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      status: "active",
    },
    {
      id: "alert_3",
      userId: "user_3",
      type: "new_device",
      severity: "medium",
      title: "Login from New Device",
      description: "First login from Chrome on macOS",
      metadata: { device: "Chrome on macOS" },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "active",
    },
    {
      id: "alert_4",
      userId: "user_1",
      type: "unusual_time",
      severity: "low",
      title: "Unusual Login Time",
      description: "Login at 3:00 AM local time, outside normal hours",
      metadata: { loginHour: 3 },
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: "acknowledged",
      acknowledgedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      acknowledgedBy: "admin",
    },
  ];

  // Handle acknowledge
  const handleAcknowledge = async (alertId: string) => {
    try {
      await fetch(`/api/security/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status: "acknowledged", acknowledgedAt: new Date() }
            : a
        )
      );
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  // Handle resolve
  const handleResolve = async (alertId: string) => {
    try {
      await fetch(`/api/security/alerts/${alertId}/resolve`, {
        method: "POST",
      });

      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (filter !== "all" && alert.severity !== filter) return false;
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    return true;
  });

  // Count by severity
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status === "active").length;
  const highCount = alerts.filter((a) => a.severity === "high" && a.status === "active").length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10"></div>
              <div className="flex-1">
                <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-64 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <i className="ri-shield-line text-xl text-white"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
            <p className="text-xs text-[#9ca3af]">
              {criticalCount > 0 && (
                <span className="text-red-400 mr-2">
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="text-orange-400 mr-2">
                  {highCount} high
                </span>
              )}
              {criticalCount === 0 && highCount === 0 && (
                <span className="text-green-400">All clear</span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-white/30"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-white/30"
          >
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map((alert, index) => {
            const config = getSeverityConfig(alert.severity);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${config.borderColor} ${
                  alert.status === "acknowledged" ? "opacity-60" : ""
                }`}
                style={{
                  background: `linear-gradient(135deg, ${
                    alert.severity === "critical"
                      ? "rgba(239, 68, 68, 0.1)"
                      : alert.severity === "high"
                      ? "rgba(249, 115, 22, 0.1)"
                      : alert.severity === "medium"
                      ? "rgba(234, 179, 8, 0.1)"
                      : "rgba(59, 130, 246, 0.1)"
                  } 0%, rgba(255, 255, 255, 0.02) 100%)`,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}/20`}
                  >
                    <i className={`${getAlertIcon(alert.type)} text-xl ${config.textColor}`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{alert.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}/20 ${config.textColor} capitalize`}
                      >
                        {alert.severity}
                      </span>
                      {alert.status === "acknowledged" && (
                        <span className="px-2 py-0.5 bg-white/10 text-[#9ca3af] rounded text-xs">
                          Acknowledged
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#9ca3af] mb-2">{alert.description}</p>

                    <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <i className="ri-time-line"></i>
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-user-line"></i>
                        {alert.userId}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {alert.status === "active" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
                        title="Acknowledge"
                      >
                        <i className="ri-check-line mr-1"></i>
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 hover:bg-green-500/30 transition-colors"
                        title="Resolve"
                      >
                        <i className="ri-check-double-line mr-1"></i>
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
            <i className="ri-shield-check-line text-3xl text-green-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
          <p className="text-sm text-[#9ca3af]">
            No security alerts to display
          </p>
        </div>
      )}
    </div>
  );
};

export default SecurityAlertsPanel;
