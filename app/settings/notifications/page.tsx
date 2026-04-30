"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
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
  LineChart,
  Line,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface NotificationRule {
  id: string;
  ruleName: string;
  ruleCode: string;
  triggerEvent:
    | "ORDER_CREATED"
    | "ORDER_COMPLETED"
    | "STOCK_LOW"
    | "STOCKOUT"
    | "SHIPMENT_DELAYED"
    | "QUALITY_ISSUE"
    | "SYSTEM_ALERT"
    | "CUSTOM";
  condition: string;
  channels: ("EMAIL" | "SMS" | "PUSH" | "WEBHOOK" | "IN_APP")[];
  recipients: string[];
  template?: string;
  isActive: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  frequency: "IMMEDIATE" | "DAILY" | "WEEKLY" | "CUSTOM";
  lastTriggered?: Date | string;
  triggerCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date | string;
  createdBy: string;
}

interface NotificationLog {
  id: string;
  ruleCode: string;
  ruleName: string;
  triggerEvent: string;
  channel: string;
  recipient: string;
  status: "SENT" | "FAILED" | "PENDING";
  sentAt?: Date | string;
  errorMessage?: string;
  createdAt: Date | string;
}

const generateNotificationRules = (count: number = 50): NotificationRule[] => {
  const triggerEvents: NotificationRule["triggerEvent"][] = [
    "ORDER_CREATED",
    "ORDER_COMPLETED",
    "STOCK_LOW",
    "STOCKOUT",
    "SHIPMENT_DELAYED",
    "QUALITY_ISSUE",
    "SYSTEM_ALERT",
    "CUSTOM",
  ];
  const priorities: NotificationRule["priority"][] = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ];
  const frequencies: NotificationRule["frequency"][] = [
    "IMMEDIATE",
    "DAILY",
    "WEEKLY",
    "CUSTOM",
  ];
  const channels: NotificationRule["channels"][0][] = [
    "EMAIL",
    "SMS",
    "PUSH",
    "WEBHOOK",
    "IN_APP",
  ];

  const templates = [
    {
      name: "Order Created Alert",
      event: "ORDER_CREATED" as const,
      condition: 'order.status == "CREATED"',
    },
    {
      name: "Low Stock Warning",
      event: "STOCK_LOW" as const,
      condition: "inventory.quantity < reorderPoint",
    },
    {
      name: "Stockout Alert",
      event: "STOCKOUT" as const,
      condition: "inventory.quantity == 0",
    },
    {
      name: "Shipment Delayed",
      event: "SHIPMENT_DELAYED" as const,
      condition: "shipment.delayHours > 24",
    },
    {
      name: "Quality Issue",
      event: "QUALITY_ISSUE" as const,
      condition: 'quality.status == "FAILED"',
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const frequency =
      frequencies[Math.floor(Math.random() * frequencies.length)];
    const selectedChannels = channels.slice(
      0,
      Math.floor(Math.random() * 3) + 1,
    );
    const isActive = Math.random() > 0.3;

    return {
      id: `RULE-${String(i + 1).padStart(6, "0")}`,
      ruleName: template.name || `Rule ${i + 1}`,
      ruleCode: `RULE-${i + 1}`,
      triggerEvent: template.event,
      condition: template.condition,
      channels: selectedChannels,
      recipients: [`user${i + 1}@example.com`, `manager${i + 1}@example.com`],
      template: `Template for ${template.name}`,
      isActive,
      priority,
      frequency,
      lastTriggered:
        Math.random() > 0.5
          ? new Date(Date.now() - Math.random() * 7 * 86400000)
          : undefined,
      triggerCount: Math.floor(Math.random() * 100),
      successCount: Math.floor(Math.random() * 95),
      failureCount: Math.floor(Math.random() * 5),
      createdAt: new Date(Date.now() - Math.random() * 180 * 86400000),
      createdBy: `User ${Math.floor(Math.random() * 10) + 1}`,
    };
  });
};

const generateNotificationLogs = (count: number = 200): NotificationLog[] => {
  const statuses: NotificationLog["status"][] = ["SENT", "FAILED", "PENDING"];
  const channels = ["EMAIL", "SMS", "PUSH", "WEBHOOK", "IN_APP"];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = new Date(Date.now() - Math.random() * 7 * 86400000);

    return {
      id: `LOG-${String(i + 1).padStart(6, "0")}`,
      ruleCode: `RULE-${Math.floor(Math.random() * 50) + 1}`,
      ruleName: `Rule ${Math.floor(Math.random() * 50) + 1}`,
      triggerEvent: ["ORDER_CREATED", "STOCK_LOW", "SHIPMENT_DELAYED"][
        Math.floor(Math.random() * 3)
      ],
      channel: channels[Math.floor(Math.random() * channels.length)],
      recipient: `user${Math.floor(Math.random() * 20) + 1}@example.com`,
      status,
      sentAt:
        status === "SENT"
          ? new Date(createdAt.getTime() + Math.random() * 60000)
          : undefined,
      errorMessage: status === "FAILED" ? "Delivery failed" : undefined,
      createdAt,
    };
  });
};

export default function NotificationRules() {
  const [rules, setRules] = useState<NotificationRule[]>(() =>
    generateNotificationRules(50),
  );
  const [logs] = useState<NotificationLog[]>(() =>
    generateNotificationLogs(200),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"rules" | "logs" | "analytics">(
    "rules",
  );
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<Partial<NotificationRule>>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalRules: 0,
    activeRules: 0,
    totalLogs: 0,
    successRate: 0,
  });

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.ruleCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEvent =
        selectedEvent === "ALL" || rule.triggerEvent === selectedEvent;
      const matchesPriority =
        selectedPriority === "ALL" || rule.priority === selectedPriority;
      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && rule.isActive) ||
        (selectedStatus === "INACTIVE" && !rule.isActive);
      return matchesSearch && matchesEvent && matchesPriority && matchesStatus;
    });
  }, [rules, searchQuery, selectedEvent, selectedPriority, selectedStatus]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.recipient.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [logs, searchQuery]);

  const eventDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    rules.forEach((r) => {
      counts[r.triggerEvent] = (counts[r.triggerEvent] || 0) + 1;
    });
    return Object.entries(counts).map(([event, count]) => ({
      event: event.replace(/_/g, " "),
      count,
    }));
  }, [rules]);

  const channelDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.channel] = (counts[l.channel] || 0) + 1;
    });
    return Object.entries(counts).map(([channel, count]) => ({
      channel,
      count,
    }));
  }, [logs]);

  const dailyLogTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; sent: number; failed: number }
    > = {};

    logs.forEach((l) => {
      const date = format(new Date(l.createdAt), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, sent: 0, failed: 0 };
      }
      if (l.status === "SENT") {
        dailyData[date].sent++;
      } else if (l.status === "FAILED") {
        dailyData[date].failed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        sent: d.sent,
        failed: d.failed,
      }));
  }, [logs]);

  const aggregateStats = useMemo(() => {
    const totalRules = rules.length;
    const activeRules = rules.filter((r) => r.isActive).length;
    const totalLogs = logs.length;
    const successRate =
      logs.length > 0
        ? (logs.filter((l) => l.status === "SENT").length / logs.length) * 100
        : 0;

    return {
      totalRules,
      activeRules,
      totalLogs,
      successRate: parseFloat(successRate.toFixed(1)),
    };
  }, [rules, logs]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "notification-rules-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "notification-rules-stats",
      () => ({
        totalRules: aggregateStats.totalRules,
        activeRules: simulateKPIUpdates(aggregateStats.activeRules, 0.05),
        totalLogs: aggregateStats.totalLogs,
        successRate: simulateKPIUpdates(aggregateStats.successRate, 0.02),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalRules,
    aggregateStats.activeRules,
    aggregateStats.totalLogs,
    aggregateStats.successRate,
  ]);

  const stats = [
    {
      label: "Total Rules",
      value: realTimeEnabled
        ? realTimeStats.totalRules
        : aggregateStats.totalRules,
      icon: "ri-notification-line",
      tooltip: "Total notification rules",
      trend: "up" as const,
    },
    {
      label: "Active Rules",
      value: realTimeEnabled
        ? realTimeStats.activeRules
        : aggregateStats.activeRules,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active notification rules",
      trend: "up" as const,
    },
    {
      label: "Total Notifications",
      value: realTimeEnabled
        ? realTimeStats.totalLogs
        : aggregateStats.totalLogs,
      icon: "ri-mail-send-line",
      tooltip: "Total notifications sent",
      trend: "up" as const,
    },
    {
      label: "Success Rate",
      value: `${(realTimeEnabled ? realTimeStats.successRate : aggregateStats.successRate).toFixed(1)}%`,
      icon: "ri-bar-chart-box-line",
      tooltip: "Notification success rate",
      trend: "up" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (rule: NotificationRule) => {
    setSelectedRule(rule);
    setShowViewModal(true);
  };

  const handleToggleActive = (rule: NotificationRule) => {
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)),
    );
  };

  const handleCreate = () => {
    setFormData({
      triggerEvent: "ORDER_CREATED",
      channels: ["EMAIL"],
      recipients: [],
      isActive: true,
      priority: "MEDIUM",
      frequency: "IMMEDIATE",
      condition: "",
    });
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (formData.ruleName && formData.ruleCode) {
      const newRule: NotificationRule = {
        id: `RULE-${String(rules.length + 1).padStart(6, "0")}`,
        ruleName: formData.ruleName,
        ruleCode: formData.ruleCode,
        triggerEvent: formData.triggerEvent || "ORDER_CREATED",
        condition: formData.condition || "",
        channels: formData.channels || ["EMAIL"],
        recipients: formData.recipients || [],
        template: formData.template,
        isActive: formData.isActive ?? true,
        priority: formData.priority || "MEDIUM",
        frequency: formData.frequency || "IMMEDIATE",
        triggerCount: 0,
        successCount: 0,
        failureCount: 0,
        createdAt: new Date(),
        createdBy: "Current User",
      };
      setRules((prev) => [...prev, newRule]);
      setShowCreateModal(false);
      setFormData({});
    }
  };

  return (
    <PageTemplate
      title="Notification Rules"
      description="Notification rule management with event triggers, multi-channel delivery (Email, SMS, Push, Webhook), condition-based rules, and delivery tracking"
      icon="ri-notification-line"
      systemInfo={{
        sap: "Notification Rules, Alert Management",
        oracle: "Notification Rules, Alert Management",
        manhattan: "Notification Rules, Alert Management",
      }}
      examples={[
        "Event-based triggers",
        "Multi-channel notifications",
        "Condition-based rules",
        "Delivery tracking",
        "Success rate monitoring",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("rules")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "rules"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Rules"
            >
              <i className="ri-notification-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("logs")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "logs"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Notification Logs"
            >
              <i className="ri-mail-send-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={handleCreate}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Rule
          </button>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search rules or logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        {viewMode === "rules" && (
          <>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
            >
              <option value="ALL">All Events</option>
              <option value="ORDER_CREATED">Order Created</option>
              <option value="ORDER_COMPLETED">Order Completed</option>
              <option value="STOCK_LOW">Stock Low</option>
              <option value="STOCKOUT">Stockout</option>
              <option value="SHIPMENT_DELAYED">Shipment Delayed</option>
              <option value="QUALITY_ISSUE">Quality Issue</option>
              <option value="SYSTEM_ALERT">System Alert</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </>
        )}
      </div>

      {/* Rules View */}
      {viewMode === "rules" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.priority === "CRITICAL"
                          ? "bg-red-500/20 text-red-400"
                          : rule.priority === "HIGH"
                            ? "bg-orange-500/20 text-orange-400"
                            : rule.priority === "MEDIUM"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {rule.priority}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {rule.ruleName}
                  </h3>
                  <p className="text-sm text-[#9ca3af] font-mono">
                    {rule.ruleCode}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Trigger:</span>
                  <span className="text-white text-xs">
                    {rule.triggerEvent.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Channels:</span>
                  <div className="flex gap-1">
                    {rule.channels.map((ch, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Frequency:</span>
                  <span className="text-white text-xs">{rule.frequency}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Triggered:</span>
                  <span className="text-white font-medium">
                    {rule.triggerCount} times
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Success Rate:</span>
                  <span className="text-white font-medium">
                    {rule.triggerCount > 0
                      ? `${((rule.successCount / rule.triggerCount) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                {rule.lastTriggered && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Last Triggered:</span>
                    <span className="text-white text-xs">
                      {format(new Date(rule.lastTriggered), "MMM dd")}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(rule)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                <button
                  onClick={() => handleToggleActive(rule)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    rule.isActive
                      ? "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
                      : "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
                  }`}
                  title={rule.isActive ? "Deactivate" : "Activate"}
                >
                  <i
                    className={`ri-toggle-${rule.isActive ? "on" : "off"}-line`}
                  ></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Logs View */}
      {viewMode === "logs" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Rule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{log.ruleName}</div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {log.ruleCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {log.triggerEvent.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{log.recipient}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === "SENT"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : log.status === "FAILED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.sentAt ? (
                        <div className="text-sm text-white">
                          {format(new Date(log.sentAt), "MMM dd, HH:mm")}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Trigger Event Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ event, count }) => `${event}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {eventDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Channel Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="channel" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Notification Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyLogTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Sent"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRule(null);
        }}
        title={`Notification Rule - ${selectedRule?.ruleName || ""}`}
        size="lg"
      >
        {selectedRule && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Rule Name</div>
                <div className="text-white font-medium">
                  {selectedRule.ruleName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Rule Code</div>
                <div className="text-white font-mono">
                  {selectedRule.ruleCode}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Trigger Event</div>
                <div className="text-white">
                  {selectedRule.triggerEvent.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Priority</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRule.priority === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedRule.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : selectedRule.priority === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedRule.priority}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Frequency</div>
                <div className="text-white">{selectedRule.frequency}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRule.isActive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedRule.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Condition</div>
              <div className="bg-white/5 rounded-lg p-3">
                <code className="text-sm text-white font-mono">
                  {selectedRule.condition}
                </code>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Channels</div>
              <div className="flex flex-wrap gap-2">
                {selectedRule.channels.map((channel, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-400"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Recipients</div>
              <div className="flex flex-wrap gap-2">
                {selectedRule.recipients.map((recipient, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400"
                  >
                    {recipient}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Triggered</div>
                <div className="text-lg font-semibold text-white">
                  {selectedRule.triggerCount}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Success</div>
                <div className="text-lg font-semibold text-green-400">
                  {selectedRule.successCount}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Failed</div>
                <div className="text-lg font-semibold text-red-400">
                  {selectedRule.failureCount}
                </div>
              </div>
            </div>
            {selectedRule.lastTriggered && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Last Triggered
                </div>
                <div className="text-white">
                  {format(new Date(selectedRule.lastTriggered), "PPp")}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({});
        }}
        title="Create Notification Rule"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.ruleName || ""}
              onChange={(e) =>
                setFormData({ ...formData, ruleName: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Rule Name"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Rule Code *
            </label>
            <input
              type="text"
              value={formData.ruleCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, ruleCode: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="RULE-CODE"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Trigger Event
              </label>
              <select
                value={formData.triggerEvent || "ORDER_CREATED"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    triggerEvent: e.target.value as any,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ORDER_CREATED">Order Created</option>
                <option value="ORDER_COMPLETED">Order Completed</option>
                <option value="STOCK_LOW">Stock Low</option>
                <option value="STOCKOUT">Stockout</option>
                <option value="SHIPMENT_DELAYED">Shipment Delayed</option>
                <option value="QUALITY_ISSUE">Quality Issue</option>
                <option value="SYSTEM_ALERT">System Alert</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Priority
              </label>
              <select
                value={formData.priority || "MEDIUM"}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency || "IMMEDIATE"}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="IMMEDIATE">Immediate</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Condition
            </label>
            <textarea
              value={formData.condition || ""}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="e.g., order.status == 'CREATED'"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {["EMAIL", "SMS", "PUSH", "WEBHOOK", "IN_APP"].map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(formData.channels || []).includes(channel as any)}
                    onChange={(e) => {
                      const currentChannels = formData.channels || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          channels: [...currentChannels, channel as any],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          channels: currentChannels.filter(
                            (c) => c !== channel,
                          ),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-white">{channel}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Recipients (comma-separated)
            </label>
            <input
              type="text"
              value={(formData.recipients || []).join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipients: e.target.value
                    .split(",")
                    .map((r) => r.trim())
                    .filter((r) => r),
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="user1@example.com, user2@example.com"
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Rule
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({});
              }}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
