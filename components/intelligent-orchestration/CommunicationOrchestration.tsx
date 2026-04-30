"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommunicationOrchestration,
  CommunicationLog,
  CommunicationTemplate,
  CommunicationChannel,
} from "@/types/intelligentOrchestration";
import { format } from "date-fns";
// Using RemixIcon instead of lucide-react for consistency
import {
  LineChart,
  Line,
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

interface CommunicationOrchestrationProps {
  orchestrations: CommunicationOrchestration[];
  logs: CommunicationLog[];
  templates: CommunicationTemplate[];
}

const CHANNEL_ICONS: Record<string, string> = {
  EMAIL: "ri-mail-line",
  WHATSAPP: "ri-whatsapp-line",
  SMS: "ri-message-3-line",
  VOICE_CALL: "ri-phone-line",
  PUSH_NOTIFICATION: "ri-notification-3-line",
  IN_APP_NOTIFICATION: "ri-notification-badge-line",
  SLACK: "ri-slack-line",
  TEAMS: "ri-microsoft-teams-line",
  WEBHOOK: "ri-flashlight-line",
  API: "ri-code-s-slash-line",
  DASHBOARD: "ri-dashboard-3-line",
  REPORT: "ri-file-chart-line",
};

const CHANNEL_COLORS = {
  EMAIL: "#3b82f6",
  WHATSAPP: "#10b981",
  SMS: "#06b6d4",
  VOICE_CALL: "#8b5cf6",
  PUSH_NOTIFICATION: "#f59e0b",
  IN_APP_NOTIFICATION: "#ec4899",
  SLACK: "#ef4444",
  TEAMS: "#6366f1",
  WEBHOOK: "#84cc16",
  API: "#06b6d4",
  DASHBOARD: "#8b5cf6",
  REPORT: "#f59e0b",
};

export default function CommunicationOrchestrationComponent({
  orchestrations,
  logs,
  templates,
}: CommunicationOrchestrationProps) {
  const [selectedChannel, setSelectedChannel] = useState<
    CommunicationChannel | "ALL"
  >("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedOrchestration, setSelectedOrchestration] = useState<
    string | null
  >(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesChannel =
        selectedChannel === "ALL" || log.channel === selectedChannel;
      const matchesStatus =
        selectedStatus === "ALL" || log.status === selectedStatus;
      return matchesChannel && matchesStatus;
    });
  }, [logs, selectedChannel, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter(
      (l) =>
        l.status === "SENT" || l.status === "DELIVERED" || l.status === "READ",
    ).length;
    const delivered = logs.filter(
      (l) => l.status === "DELIVERED" || l.status === "READ",
    ).length;
    const read = logs.filter((l) => l.status === "READ").length;
    const failed = logs.filter(
      (l) => l.status === "FAILED" || l.status === "BOUNCED",
    ).length;

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      readRate: total > 0 ? (read / total) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }, [logs]);

  // Channel distribution
  const channelDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    logs.forEach((log) => {
      distribution[log.channel] = (distribution[log.channel] || 0) + 1;
    });
    return Object.entries(distribution).map(([channel, count]) => ({
      channel,
      count,
      fill: CHANNEL_COLORS[channel as keyof typeof CHANNEL_COLORS] || "#6b7280",
    }));
  }, [logs]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    logs.forEach((log) => {
      distribution[log.status] = (distribution[log.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
    }));
  }, [logs]);

  // Performance over time
  const performanceData = useMemo(() => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
    const grouped = new Map<
      string,
      { sent: number; delivered: number; read: number }
    >();

    sortedLogs.slice(0, 30).forEach((log) => {
      const date = format(new Date(log.sentAt), "MMM dd HH:mm");
      if (!grouped.has(date)) {
        grouped.set(date, { sent: 0, delivered: 0, read: 0 });
      }
      const group = grouped.get(date)!;
      group.sent++;
      if (log.status === "DELIVERED" || log.status === "READ")
        group.delivered++;
      if (log.status === "READ") group.read++;
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }, [logs]);

  const selectedOrch = useMemo(() => {
    return orchestrations.find((o) => o.id === selectedOrchestration);
  }, [orchestrations, selectedOrchestration]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          {(
            ["ALL", "EMAIL", "WHATSAPP", "SMS", "PUSH_NOTIFICATION"] as const
          ).map((channel) => {
            const iconClass =
              channel === "ALL" ? "ri-message-3-line" : CHANNEL_ICONS[channel];
            return (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedChannel === channel
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                    : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`${iconClass} text-base`}></i>
                <span>
                  {channel === "ALL"
                    ? "All Channels"
                    : channel.replace(/_/g, " ")}
                </span>
              </button>
            );
          })}
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="READ">Read</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-send-plane-line text-blue-400 text-2xl"></i>
            </div>
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
              {stats.sent} sent
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.total}
          </div>
          <div className="text-sm text-blue-300">Total Communications</div>
          <div className="mt-4 text-xs text-blue-200">
            {stats.deliveryRate.toFixed(1)}% delivery rate
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-green-400 text-2xl"></i>
            </div>
            <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
              {stats.delivered} delivered
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.delivered}
          </div>
          <div className="text-sm text-green-300">Delivered</div>
          <div className="mt-4 text-xs text-green-200">
            {stats.deliveryRate.toFixed(1)}% delivery rate
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-message-3-line text-purple-400 text-2xl"></i>
            </div>
            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
              {stats.readRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.read}</div>
          <div className="text-sm text-purple-300">Read</div>
          <div className="mt-4 text-xs text-purple-200">
            {stats.readRate.toFixed(1)}% read rate
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <i className="ri-close-circle-line text-red-400 text-2xl"></i>
            </div>
            <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded-full">
              {stats.failureRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.failed}
          </div>
          <div className="text-sm text-red-300">Failed</div>
          <div className="mt-4 text-xs text-red-200">
            {stats.failureRate.toFixed(1)}% failure rate
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-bar-chart-line text-cyan-400 text-xl"></i>
            Channel Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ channel, percent }) =>
                  `${channel}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {channelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Over Time */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-arrow-up-line text-green-400 text-xl"></i>
            Performance Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Sent"
                dot={{ fill: "#3b82f6", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#10b981"
                strokeWidth={2}
                name="Delivered"
                dot={{ fill: "#10b981", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="read"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Read"
                dot={{ fill: "#8b5cf6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orchestrations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-settings-3-line text-cyan-400 text-xl"></i>
          Communication Orchestrations
        </h3>
        {orchestrations.map((orch, index) => (
          <motion.div
            key={orch.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() =>
              setSelectedOrchestration(
                selectedOrchestration === orch.id ? null : orch.id,
              )
            }
            className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all ${
              selectedOrchestration === orch.id
                ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                : "border-white/10 hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-white">
                    Orchestration: {orch.id}
                  </h4>
                  {orch.isActive && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <i className="ri-flashlight-line text-sm"></i>
                      Active
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      orch.priority === "URGENT"
                        ? "bg-red-500/20 text-red-400"
                        : orch.priority === "HIGH"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {orch.priority}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#9ca3af] mb-3">
                  <span>Effectiveness: {orch.effectiveness}%</span>
                  <span>Channels: {orch.channels.length}</span>
                  <span>Recipients: {orch.recipients.length}</span>
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="mb-3">
              <div className="text-xs text-[#9ca3af] mb-2">Channels</div>
              <div className="flex flex-wrap gap-2">
                {orch.channels.map((channel, i) => {
                  const iconClass = CHANNEL_ICONS[channel];
                  return (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2"
                      style={{
                        backgroundColor: `${CHANNEL_COLORS[channel] || "#6b7280"}20`,
                        color: CHANNEL_COLORS[channel] || "#9ca3af",
                        border: `1px solid ${CHANNEL_COLORS[channel] || "#6b7280"}40`,
                      }}
                    >
                      <i className={`${iconClass} text-sm`}></i>
                      {channel.replace(/_/g, " ")}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {selectedOrchestration === orch.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white mb-2">
                        Trigger
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-[#9ca3af]">
                        Type: {orch.trigger.type}
                        {orch.trigger.eventType && (
                          <div>Event: {orch.trigger.eventType}</div>
                        )}
                        {orch.trigger.schedule && (
                          <div>Schedule: {orch.trigger.schedule}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-2">
                        Recipients
                      </div>
                      <div className="space-y-2">
                        {orch.recipients.map((recipient, i) => (
                          <div
                            key={i}
                            className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af]"
                          >
                            {recipient.type}: {recipient.identifier} (
                            {recipient.channel})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Communication Logs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-message-3-line text-cyan-400 text-xl"></i>
          Recent Communications ({filteredLogs.length})
        </h3>
        <div className="space-y-2">
          {filteredLogs.slice(0, 20).map((log, index) => {
            const iconClass = CHANNEL_ICONS[log.channel];
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${CHANNEL_COLORS[log.channel] || "#6b7280"}20`,
                      }}
                    >
                      <i
                        className={`${iconClass} text-xl`}
                        style={{
                          color: CHANNEL_COLORS[log.channel] || "#9ca3af",
                        }}
                      ></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {log.recipient.type}: {log.recipient.identifier}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.status === "READ"
                              ? "bg-green-500/20 text-green-400"
                              : log.status === "DELIVERED"
                                ? "bg-blue-500/20 text-blue-400"
                                : log.status === "SENT"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#9ca3af] mb-2 line-clamp-2">
                        {log.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                        <span>
                          Sent: {format(new Date(log.sentAt), "MMM dd, HH:mm")}
                        </span>
                        {log.deliveredAt && (
                          <span>
                            Delivered:{" "}
                            {format(new Date(log.deliveredAt), "MMM dd, HH:mm")}
                          </span>
                        )}
                        {log.readAt && (
                          <span>
                            Read:{" "}
                            {format(new Date(log.readAt), "MMM dd, HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${CHANNEL_COLORS[log.channel] || "#6b7280"}20`,
                        color: CHANNEL_COLORS[log.channel] || "#9ca3af",
                      }}
                    >
                      {log.channel.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
