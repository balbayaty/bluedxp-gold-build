"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import { format } from "date-fns";
import type {
  Webhook,
  WebhookEvent,
  WebhookDelivery,
} from "@/types/userManagement";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export default function WebhooksPage() {
  const notifications = useNotifications();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "ACTIVE" | "INACTIVE" | "PAUSED"
  >("all");
  const [activeTab, setActiveTab] = useState<
    "webhooks" | "deliveries" | "analytics"
  >("webhooks");

  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as WebhookEvent[],
    verifySSL: true,
  });

  useEffect(() => {
    loadWebhooks();
    loadDeliveries();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/webhooks");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      } else {
        // Fallback to mock data
        const mockWebhooks: Webhook[] = [
          {
            id: "1",
            userId: "user-1",
            tenantId: "tenant-1",
            name: "Order Created Webhook",
            url: "https://example.com/webhooks/orders",
            events: ["order.created", "order.updated"],
            secret: "secret-123",
            verifySSL: true,
            status: "ACTIVE",
            retryPolicy: {
              maxRetries: 3,
              retryDelay: 5,
              backoffMultiplier: 2,
            },
            totalDeliveries: 1250,
            successfulDeliveries: 1180,
            failedDeliveries: 70,
            createdAt: new Date("2024-01-15"),
            updatedAt: new Date("2024-12-20"),
          },
          {
            id: "2",
            userId: "user-1",
            tenantId: "tenant-1",
            name: "Shipment Status Updates",
            url: "https://example.com/webhooks/shipments",
            events: [
              "shipment.created",
              "shipment.updated",
              "shipment.delivered",
            ],
            secret: "secret-456",
            verifySSL: true,
            status: "ACTIVE",
            retryPolicy: {
              maxRetries: 5,
              retryDelay: 10,
              backoffMultiplier: 1.5,
            },
            totalDeliveries: 3420,
            successfulDeliveries: 3400,
            failedDeliveries: 20,
            createdAt: new Date("2024-02-01"),
            updatedAt: new Date("2024-12-20"),
          },
          {
            id: "3",
            userId: "user-1",
            tenantId: "tenant-1",
            name: "Compliance Alerts",
            url: "https://example.com/webhooks/compliance",
            events: ["compliance.violation", "compliance.alert"],
            secret: "secret-789",
            verifySSL: true,
            status: "PAUSED",
            retryPolicy: {
              maxRetries: 3,
              retryDelay: 5,
              backoffMultiplier: 2,
            },
            totalDeliveries: 45,
            successfulDeliveries: 40,
            failedDeliveries: 5,
            createdAt: new Date("2024-03-10"),
            updatedAt: new Date("2024-12-15"),
          },
        ];
        setWebhooks(mockWebhooks);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading webhooks", err, {
        module: "integration",
        service: "webhooks",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "webhooks",
      });
      notifications.error(
        "Failed to Load Webhooks",
        "Could not load webhook configurations",
        { duration: 5000 },
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      // In real app, fetch from API
      const mockDeliveries: WebhookDelivery[] = [
        {
          id: "1",
          webhookId: "1",
          event: "order.created",
          payload: {
            event: "order.created",
            data: { orderId: "ORD-001", customerId: "CUST-001" },
            timestamp: new Date().toISOString(),
            id: "evt-1",
          },
          status: "SUCCESS",
          attempts: 1,
          responseCode: 200,
          deliveredAt: new Date(),
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          id: "2",
          webhookId: "1",
          event: "order.updated",
          payload: {
            event: "order.updated",
            data: { orderId: "ORD-001", status: "shipped" },
            timestamp: new Date().toISOString(),
            id: "evt-2",
          },
          status: "FAILED",
          attempts: 3,
          error: "Connection timeout",
          createdAt: new Date(Date.now() - 7200000),
        },
      ];
      setDeliveries(mockDeliveries);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading deliveries", err, {
        module: "integration",
        service: "webhooks",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "webhooks",
      });
    }
  };

  const filteredWebhooks =
    filter === "all" ? webhooks : webhooks.filter((w) => w.status === filter);

  const stats = {
    total: webhooks.length,
    active: webhooks.filter((w) => w.status === "ACTIVE").length,
    paused: webhooks.filter((w) => w.status === "PAUSED").length,
    inactive: webhooks.filter((w) => w.status === "INACTIVE").length,
    totalDeliveries: webhooks.reduce((sum, w) => sum + w.totalDeliveries, 0),
    successRate:
      webhooks.length > 0
        ? Math.round(
            (webhooks.reduce((sum, w) => sum + w.successfulDeliveries, 0) /
              webhooks.reduce((sum, w) => sum + w.totalDeliveries, 0)) *
              100,
          )
        : 0,
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      notifications.warning(
        "Validation Error",
        "Please fill in all required fields",
        { duration: 4000 },
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWebhook.name,
          url: newWebhook.url,
          events: newWebhook.events,
          verifySSL: newWebhook.verifySSL,
        }),
      });

      if (response.ok) {
        notifications.success(
          NotificationPatterns.saveSuccess("Webhook").title,
          "Webhook created successfully",
          { duration: 4000 },
        );
        setShowCreateModal(false);
        setNewWebhook({ name: "", url: "", events: [], verifySSL: true });
        loadWebhooks();
      } else {
        const error = await response.json();
        notifications.error(
          "Failed to Create Webhook",
          error.error || "Please try again",
          { duration: 6000 },
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating webhook", err, {
        module: "integration",
        service: "webhooks",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "webhooks",
      });
      notifications.error(
        "Failed to Create Webhook",
        err.message || "Unknown error",
        { duration: 6000 },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebhook = async (
    webhookId: string,
    newStatus: "ACTIVE" | "PAUSED" | "INACTIVE",
  ) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        notifications.success(
          "Webhook Updated",
          `Webhook ${newStatus === "ACTIVE" ? "activated" : newStatus === "PAUSED" ? "paused" : "deactivated"}`,
          { duration: 4000 },
        );
        loadWebhooks();
      } else {
        const error = await response.json();
        notifications.error(
          "Failed to Update Webhook",
          error.error || "Please try again",
          { duration: 6000 },
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating webhook", err, {
        module: "integration",
        service: "webhooks",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "webhooks",
      });
      notifications.error(
        "Failed to Update Webhook",
        err.message || "Please try again",
        { duration: 6000 },
      );
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.success("Webhook Deleted", "Webhook has been removed", {
          duration: 4000,
        });
        loadWebhooks();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error deleting webhook", err, {
        module: "integration",
        service: "webhooks",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "webhooks",
      });
      notifications.error("Failed to Delete Webhook", "Please try again", {
        duration: 6000,
      });
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setLoading(true);
    try {
      // In real app, this would call a test endpoint
      // For now, simulate test webhook
      await new Promise((resolve) => setTimeout(resolve, 1000));

      notifications.success(
        "Test Webhook Sent",
        "Test webhook has been sent successfully. Check delivery history for status.",
        { duration: 4000 },
      );
      setShowTestModal(false);
      loadDeliveries();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error testing webhook", err, {
        module: "integration",
        service: "webhooks",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "webhooks",
      });
      notifications.error("Test Failed", err.message || "Unknown error", {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const availableEvents: WebhookEvent[] = [
    "order.created",
    "order.updated",
    "order.cancelled",
    "shipment.created",
    "shipment.updated",
    "shipment.delivered",
    "inventory.updated",
    "compliance.violation",
    "compliance.alert",
    "user.created",
    "user.updated",
    "msds.approved",
    "msds.rejected",
  ];

  const deliveryStats = [
    { hour: "00:00", success: 45, failed: 2 },
    { hour: "06:00", success: 120, failed: 5 },
    { hour: "12:00", success: 180, failed: 8 },
    { hour: "18:00", success: 95, failed: 3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PAUSED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "INACTIVE":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "FAILED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading && webhooks.length === 0) {
    return (
      <PageTemplate title="Webhooks" icon="ri-webhook-line">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Webhooks"
      description="Manage webhook subscriptions for real-time event notifications"
      icon="ri-webhook-line"
      stats={[
        {
          label: "Total Webhooks",
          value: stats.total,
          icon: "ri-webhook-line",
          tooltip: "Total webhook configurations",
        },
        {
          label: "Active",
          value: stats.active,
          icon: "ri-checkbox-circle-line",
          tooltip: "Active webhooks",
        },
        {
          label: "Success Rate",
          value: `${stats.successRate}%`,
          icon: "ri-line-chart-line",
          tooltip: "Overall delivery success rate",
        },
        {
          label: "Total Deliveries",
          value: stats.totalDeliveries.toLocaleString(),
          icon: "ri-send-plane-line",
          tooltip: "Total webhook deliveries",
        },
      ]}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Create Webhook
        </button>
      }
    >
      {/* Tabs */}
      <div className="mb-6 border-b border-white/10">
        <div className="flex gap-4">
          {(["webhooks", "deliveries", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Webhooks Tab */}
      {activeTab === "webhooks" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "ACTIVE", "PAUSED", "INACTIVE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Webhooks List */}
          <div className="space-y-4">
            {filteredWebhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {webhook.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(webhook.status)}`}
                      >
                        {webhook.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 font-mono mb-2">
                      {webhook.url}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        <i className="ri-calendar-line mr-1"></i>
                        Created{" "}
                        {format(new Date(webhook.createdAt), "MMM dd, yyyy")}
                      </span>
                      <span>
                        <i className="ri-send-plane-line mr-1"></i>
                        {webhook.totalDeliveries.toLocaleString()} deliveries
                      </span>
                      <span>
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        {webhook.successfulDeliveries.toLocaleString()}{" "}
                        successful
                      </span>
                      {webhook.failedDeliveries > 0 && (
                        <span className="text-red-400">
                          <i className="ri-close-circle-line mr-1"></i>
                          {webhook.failedDeliveries} failed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip content="Test Webhook">
                      <button
                        onClick={() => {
                          setSelectedWebhook(webhook);
                          setShowTestModal(true);
                        }}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        <i className="ri-play-line"></i>
                      </button>
                    </Tooltip>
                    <Tooltip content="View Details">
                      <button
                        onClick={() => {
                          setSelectedWebhook(webhook);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                    </Tooltip>
                    <Tooltip
                      content={
                        webhook.status === "ACTIVE" ? "Pause" : "Activate"
                      }
                    >
                      <button
                        onClick={() =>
                          handleToggleWebhook(
                            webhook.id,
                            webhook.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                          )
                        }
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm hover:bg-yellow-500/30 transition-colors"
                      >
                        <i
                          className={`ri-${webhook.status === "ACTIVE" ? "pause" : "play"}-line`}
                        ></i>
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete">
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-300 mb-2">
                    Subscribed Events:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {filteredWebhooks.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
                <i className="ri-webhook-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-400 mb-2">No webhooks found</p>
                <p className="text-sm text-gray-500">
                  Create your first webhook to receive real-time event
                  notifications
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Deliveries Tab */}
      {activeTab === "deliveries" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Recent Deliveries
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Webhook
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Attempts
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Response Code
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-white">
                        {webhooks.find((w) => w.id === delivery.webhookId)
                          ?.name || delivery.webhookId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {delivery.event}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getDeliveryStatusColor(delivery.status)}`}
                        >
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {delivery.attempts}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {delivery.responseCode ? (
                          <span
                            className={
                              delivery.responseCode >= 200 &&
                              delivery.responseCode < 300
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {delivery.responseCode}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {format(
                          new Date(delivery.createdAt),
                          "MMM dd, HH:mm:ss",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Delivery Success Rate
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deliveryStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                    }}
                  />
                  <Bar dataKey="success" fill="#10b981" />
                  <Bar dataKey="failed" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Webhooks by Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Active</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 w-32">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(stats.active / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-12">
                      {stats.active}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Paused</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 w-32">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${(stats.paused / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-12">
                      {stats.paused}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Inactive</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 w-32">
                      <div
                        className="bg-gray-500 h-2 rounded-full"
                        style={{
                          width: `${(stats.inactive / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-12">
                      {stats.inactive}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Webhook"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Webhook Name *
              </label>
              <input
                type="text"
                value={newWebhook.name}
                onChange={(e) =>
                  setNewWebhook({ ...newWebhook, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="e.g., Order Created Webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Webhook URL *
              </label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) =>
                  setNewWebhook({ ...newWebhook, url: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="https://example.com/webhooks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Events *
              </label>
              <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg p-3 space-y-2">
                {availableEvents.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({
                            ...newWebhook,
                            events: [...newWebhook.events, event],
                          });
                        } else {
                          setNewWebhook({
                            ...newWebhook,
                            events: newWebhook.events.filter(
                              (e) => e !== event,
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verifySSL"
                checked={newWebhook.verifySSL}
                onChange={(e) =>
                  setNewWebhook({ ...newWebhook, verifySSL: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="verifySSL" className="text-sm text-gray-300">
                Verify SSL Certificate
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateWebhook}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Webhook"}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedWebhook && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedWebhook.name}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <p className="text-white">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedWebhook.status)}`}
                >
                  {selectedWebhook.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">URL</label>
              <p className="text-white font-mono text-sm break-all">
                {selectedWebhook.url}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Events
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedWebhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Secret
              </label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-white font-mono text-sm flex-1">
                  {selectedWebhook.secret}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedWebhook.secret);
                    notifications.success(
                      "Copied",
                      "Secret copied to clipboard",
                      { duration: 2000 },
                    );
                  }}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 hover:bg-white/10"
                >
                  <i className="ri-file-copy-line"></i>
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Retry Policy
              </label>
              <p className="text-white text-sm">
                Max Retries: {selectedWebhook.retryPolicy.maxRetries} | Retry
                Delay: {selectedWebhook.retryPolicy.retryDelay}s | Backoff:{" "}
                {selectedWebhook.retryPolicy.backoffMultiplier}x
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Statistics
              </label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-white font-semibold">
                    {selectedWebhook.totalDeliveries.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Successful</p>
                  <p className="text-green-400 font-semibold">
                    {selectedWebhook.successfulDeliveries.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Failed</p>
                  <p className="text-red-400 font-semibold">
                    {selectedWebhook.failedDeliveries.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Created
              </label>
              <p className="text-white text-sm">
                {format(
                  new Date(selectedWebhook.createdAt),
                  "MMMM dd, yyyy HH:mm",
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Last Updated
              </label>
              <p className="text-white text-sm">
                {format(
                  new Date(selectedWebhook.updatedAt),
                  "MMMM dd, yyyy HH:mm",
                )}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Test Webhook Modal */}
      {showTestModal && selectedWebhook && (
        <Modal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          title="Test Webhook"
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Send a test webhook to{" "}
              <span className="font-mono text-white">
                {selectedWebhook.url}
              </span>
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Test Payload:</p>
              <pre className="text-xs text-gray-300 overflow-auto">
                {JSON.stringify(
                  {
                    event: selectedWebhook.events[0] || "test.event",
                    data: { test: true, timestamp: new Date().toISOString() },
                    timestamp: new Date().toISOString(),
                    id: "test-" + Date.now(),
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleTestWebhook(selectedWebhook.id)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Test Webhook"}
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
