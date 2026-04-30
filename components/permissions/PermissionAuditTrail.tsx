/**
 * 📜 PERMISSION AUDIT TRAIL COMPONENT
 *
 * Complete audit trail viewer:
 * - View all permission changes
 * - Filter by user, action, date range
 * - Rollback capability
 * - Export to CSV
 * - Real-time updates
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { permissionAuditTrail } from "@/lib/services/permissions/permissionAuditTrail";
import type {
  PermissionAuditLog,
  AuditQuery,
} from "@/lib/services/permissions/permissionAuditTrail";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PermissionAuditTrailComponent() {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<PermissionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalChanges: number;
    changesByAction: Record<string, number>;
    changesByUser: Record<string, number>;
    recentChanges: PermissionAuditLog[];
    topChangers: Array<{ userId: string; userName: string; count: number }>;
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState<AuditQuery>({
    limit: 100,
    offset: 0,
  });
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );

  useEffect(() => {
    loadData();
  }, [filters, dateRange, selectedAction]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Apply date range
      const query: AuditQuery = { ...filters };
      if (dateRange !== "all") {
        const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
        query.startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      }
      if (selectedAction !== "all") {
        query.action = selectedAction as PermissionAuditLog["action"];
      }

      const [logsData, summaryData] = await Promise.all([
        permissionAuditTrail.getAuditLogs(query),
        permissionAuditTrail.getAuditSummary(query),
      ]);

      setLogs(logsData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (logId: string) => {
    if (
      !currentUser ||
      !confirm("Are you sure you want to rollback this permission change?")
    ) {
      return;
    }

    try {
      await permissionAuditTrail.rollbackPermissionChange(logId, currentUser);
      await loadData();
      alert("Permission change rolled back successfully!");
    } catch (error) {
      console.error("Failed to rollback:", error);
      alert("Failed to rollback permission change");
    }
  };

  const handleExport = async () => {
    try {
      const csv = await permissionAuditTrail.exportAuditLogs(filters);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `permission-audit-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Failed to export audit logs");
    }
  };

  // Chart data
  const actionChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.changesByAction).map(([action, count]) => ({
      action,
      count,
    }));
  }, [summary]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const actionColors: Record<string, string> = {
    CREATE: "#10b981",
    UPDATE: "#3b82f6",
    DELETE: "#ef4444",
    GRANT: "#10b981",
    REVOKE: "#f59e0b",
    MODIFY: "#8b5cf6",
    ROLLBACK: "#ec4899",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatPermission = (log: PermissionAuditLog) => {
    const parts = [log.permission.moduleId];
    if (log.permission.featureId) parts.push(log.permission.featureId);
    if (log.permission.tabId) parts.push(log.permission.tabId);
    return parts.join(" → ");
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Permission Audit Trail
          </h1>
          <p className="text-gray-400">
            Complete history of all permission changes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <i className="ri-download-2-line"></i>
          Export CSV
        </motion.button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Changes</span>
              <i className="ri-file-list-line text-blue-400"></i>
            </div>
            <div className="text-3xl font-bold text-white">
              {summary.totalChanges.toLocaleString()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Unique Users</span>
              <i className="ri-user-line text-green-400"></i>
            </div>
            <div className="text-3xl font-bold text-white">
              {Object.keys(summary.changesByUser).length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Action Types</span>
              <i className="ri-settings-3-line text-purple-400"></i>
            </div>
            <div className="text-3xl font-bold text-white">
              {Object.keys(summary.changesByAction).length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Top Changers</span>
              <i className="ri-star-line text-orange-400"></i>
            </div>
            <div className="text-3xl font-bold text-white">
              {summary.topChangers.length}
            </div>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      {summary && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Changes by Action
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="action" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Action Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ action, percent }) =>
                    `${action}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {actionChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        actionColors[entry.action] ||
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="GRANT">Grant</option>
              <option value="REVOKE">Revoke</option>
              <option value="MODIFY">Modify</option>
              <option value="ROLLBACK">Rollback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Results per page
            </label>
            <select
              value={filters.limit || 100}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  limit: parseInt(e.target.value),
                  offset: 0,
                })
              }
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Audit Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-gray-800/50 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Audit Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Target User
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Permission
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Changed By
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Reason
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: `${actionColors[log.action] || "#6b7280"}20`,
                          color: actionColors[log.action] || "#9ca3af",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {log.userEmail}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {formatPermission(log)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {log.changedByEmail}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {log.reason || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {log.previousPermission && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRollback(log.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs"
                        >
                          <i className="ri-arrow-go-back-line mr-1"></i>
                          Rollback
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">
              Showing {filters.offset || 0 + 1} to{" "}
              {Math.min(
                (filters.offset || 0) + (filters.limit || 100),
                logs.length,
              )}{" "}
              of {logs.length} logs
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters({
                    ...filters,
                    offset: Math.max(
                      0,
                      (filters.offset || 0) - (filters.limit || 100),
                    ),
                  })
                }
                disabled={(filters.offset || 0) === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters({
                    ...filters,
                    offset: (filters.offset || 0) + (filters.limit || 100),
                  })
                }
                disabled={logs.length < (filters.limit || 100)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
