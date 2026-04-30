/**
 * Audit Trail Page
 * Comprehensive audit log viewer with filtering and export
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import {
  AuditLog,
  AuditLogFilter,
  AuditStatistics,
} from "@/lib/services/audit/auditService";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type FilterTab =
  | "all"
  | "chemicals"
  | "msds"
  | "containers"
  | "compliance"
  | "security";

export default function AuditTrailPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    loadLogs();
    loadStatistics();
  }, [activeTab, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filter: AuditLogFilter = { ...filters };

      if (activeTab === "chemicals") filter.entityType = "chemical";
      else if (activeTab === "msds") filter.entityType = "msds";
      else if (activeTab === "containers") filter.entityType = "container";
      else if (activeTab === "compliance") filter.complianceType = "compliance";
      else if (activeTab === "security") filter.complianceType = "security";

      const params = new URLSearchParams();
      if (filter.entityType) params.append("entityType", filter.entityType);
      if (filter.entityId) params.append("entityId", filter.entityId);
      if (filter.action) params.append("action", filter.action);
      if (filter.userId) params.append("userId", filter.userId);
      if (filter.tenantId) params.append("tenantId", filter.tenantId);
      if (filter.startDate)
        params.append("startDate", filter.startDate.toISOString());
      if (filter.endDate)
        params.append("endDate", filter.endDate.toISOString());
      if (filter.complianceType)
        params.append("complianceType", filter.complianceType);
      if (filter.limit) params.append("limit", filter.limit.toString());
      if (filter.offset) params.append("offset", filter.offset.toString());

      const response = await fetch(`/api/audit?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.logs);
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch("/api/audit?action=statistics");
      const result = await response.json();

      if (result.success) {
        setStatistics(result.statistics);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const params = new URLSearchParams();
      params.append("action", "export");
      params.append("format", format);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.startDate)
        params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate)
        params.append("endDate", filters.endDate.toISOString());

      const response = await fetch(`/api/audit?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      a.click();
    } catch (error) {
      console.error("Error exporting audit logs:", error);
    }
  };

  const tabs = [
    { id: "all" as FilterTab, label: "All Logs", icon: "ri-file-list-line" },
    { id: "chemicals" as FilterTab, label: "Chemicals", icon: "ri-flask-line" },
    { id: "msds" as FilterTab, label: "MSDS", icon: "ri-file-paper-line" },
    { id: "containers" as FilterTab, label: "Containers", icon: "ri-box-line" },
    {
      id: "compliance" as FilterTab,
      label: "Compliance",
      icon: "ri-shield-check-line",
    },
    { id: "security" as FilterTab, label: "Security", icon: "ri-lock-line" },
  ];

  const actionColors: Record<string, string> = {
    create: "#10b981",
    update: "#3b82f6",
    delete: "#ef4444",
    view: "#6b7280",
    approve: "#10b981",
    reject: "#f59e0b",
    export: "#8b5cf6",
    login: "#3b82f6",
    logout: "#6b7280",
    access_denied: "#ef4444",
  };

  return (
    <PageTemplate
      title="Audit Trail"
      description="Comprehensive audit logging for compliance and security"
      icon="ri-file-shield-line"
    >
      <div className="space-y-6">
        {/* Statistics Overview */}
        {statistics && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Logs</span>
                <i className="ri-file-list-line text-blue-400"></i>
              </div>
              <div className="text-3xl font-bold text-white">
                {statistics.totalLogs.toLocaleString()}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Compliance Logs</span>
                <i className="ri-shield-check-line text-green-400"></i>
              </div>
              <div className="text-3xl font-bold text-white">
                {statistics.complianceLogs.toLocaleString()}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Entity Types</span>
                <i className="ri-database-line text-purple-400"></i>
              </div>
              <div className="text-3xl font-bold text-white">
                {Object.keys(statistics.byEntityType).length}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Active Users</span>
                <i className="ri-user-line text-orange-400"></i>
              </div>
              <div className="text-3xl font-bold text-white">
                {Object.keys(statistics.byUser).length}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {statistics && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="font-bold mb-4 text-white">
                Actions Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(statistics.byAction).map(
                    ([action, count]) => ({ action, count }),
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="action" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="font-bold mb-4 text-white">Entity Types</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(statistics.byEntityType).map(
                      ([type, count]) => ({ type, count }),
                    )}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) =>
                      `${type}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {Object.entries(statistics.byEntityType).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#3b82f6",
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                            "#8b5cf6",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleExport("json")}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition flex items-center gap-2"
          >
            <i className="ri-download-line"></i>
            Export JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition flex items-center gap-2"
          >
            <i className="ri-download-line"></i>
            Export CSV
          </button>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="ri-file-list-line text-4xl mb-4"></i>
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Compliance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-700/50 transition"
                    >
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div>
                          <div className="font-medium">{log.entityType}</div>
                          <div className="text-xs text-gray-500">
                            {log.entityId}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div>
                          <div className="font-medium">
                            {log.userName || log.userId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.userId}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.metadata.ipAddress || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {log.compliance.requiresAudit ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400">
                            {log.compliance.complianceType || "Audit Required"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Timestamp</label>
                  <p className="text-white">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Action</label>
                  <p className="text-white">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Entity Type</label>
                  <p className="text-white">{selectedLog.entityType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Entity ID</label>
                  <p className="text-white font-mono text-sm">
                    {selectedLog.entityId}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">User</label>
                  <p className="text-white">
                    {selectedLog.userName || selectedLog.userId}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">IP Address</label>
                  <p className="text-white">
                    {selectedLog.metadata.ipAddress || "N/A"}
                  </p>
                </div>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Changes
                  </label>
                  <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                    {selectedLog.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 border-cyan-500 pl-3"
                      >
                        <div className="font-medium text-white">
                          {change.field}
                        </div>
                        <div className="text-sm text-gray-400">
                          <span className="text-red-400">
                            - {JSON.stringify(change.oldValue)}
                          </span>
                          <br />
                          <span className="text-green-400">
                            + {JSON.stringify(change.newValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.compliance.requiresAudit && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Compliance
                  </label>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-white font-medium">
                      {selectedLog.compliance.complianceType}
                    </p>
                    <p className="text-sm text-gray-400">
                      {selectedLog.compliance.regulatoryRequirement}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </PageTemplate>
  );
}
