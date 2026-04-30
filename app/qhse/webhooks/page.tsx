/**
 * QHSE Webhooks Management Page
 * Manage webhooks for QHSE events
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiLink,
  FiToggleLeft,
  FiToggleRight,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
}

export default function QHSEWebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/qhse/webhooks");
      const data = await response.json();

      if (data.success) {
        setWebhooks(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (webhookId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/qhse/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      });
      const data = await response.json();

      if (data.success) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Error toggling webhook:", err);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const response = await fetch(`/api/qhse/webhooks/${webhookId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Error deleting webhook:", err);
    }
  };

  const availableEvents = [
    "INCIDENT_CREATED",
    "INCIDENT_UPDATED",
    "INSPECTION_SCHEDULED",
    "INSPECTION_COMPLETED",
    "TRAINING_ASSIGNED",
    "TRAINING_COMPLETED",
    "ENVIRONMENTAL_METRIC_RECORDED",
    "AUDIT_SCHEDULED",
    "AUDIT_COMPLETED",
    "ESG_REPORT_GENERATED",
  ];

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-600 mt-1">Manage webhooks for QHSE events</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Webhooks
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {webhooks.length}
              </p>
            </div>
            <FiLink className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {webhooks.filter((w) => w.active).length}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Success</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {webhooks.reduce((sum, w) => sum + w.successCount, 0)}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-gray-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Failures
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {webhooks.reduce((sum, w) => sum + w.failureCount, 0)}
              </p>
            </div>
            <FiXCircle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>
      </div>

      {/* Webhooks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Webhook Configurations
          </h2>
        </div>
        <div className="p-6">
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <FiLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No webhooks configured</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Add your first webhook
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <motion.div
                  key={webhook.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {webhook.name}
                        </h3>
                        <button
                          onClick={() =>
                            handleToggle(webhook.id, webhook.active)
                          }
                          className="flex items-center gap-2"
                        >
                          {webhook.active ? (
                            <FiToggleRight className="w-6 h-6 text-green-600" />
                          ) : (
                            <FiToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                          <span
                            className={`text-sm ${webhook.active ? "text-green-600" : "text-gray-500"}`}
                          >
                            {webhook.active ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">URL:</span> {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {event.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>
                          <FiCheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                          {webhook.successCount} success
                        </span>
                        <span>
                          <FiXCircle className="w-4 h-4 inline mr-1 text-red-600" />
                          {webhook.failureCount} failures
                        </span>
                        {webhook.lastTriggered && (
                          <span>
                            Last:{" "}
                            {new Date(webhook.lastTriggered).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingWebhook(webhook)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingWebhook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingWebhook ? "Edit Webhook" : "Add Webhook"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingWebhook(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const selectedEvents = Array.from(
                    formData.getAll("events"),
                  ) as string[];

                  const webhookData = {
                    name: formData.get("name") as string,
                    url: formData.get("url") as string,
                    events: selectedEvents,
                    secret: formData.get("secret")?.toString() || undefined,
                    active: formData.get("active") === "true",
                  };

                  try {
                    const url = editingWebhook
                      ? `/api/qhse/webhooks/${editingWebhook.id}`
                      : "/api/qhse/webhooks";
                    const method = editingWebhook ? "PUT" : "POST";

                    const response = await fetch(url, {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(webhookData),
                    });

                    const data = await response.json();
                    if (data.success) {
                      setShowAddForm(false);
                      setEditingWebhook(null);
                      fetchWebhooks();
                    } else {
                      alert(data.error || "Failed to save webhook");
                    }
                  } catch (err) {
                    console.error("Error saving webhook:", err);
                    alert("Failed to save webhook");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingWebhook?.name}
                    placeholder="e.g., Incident Notifications"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    required
                    defaultValue={editingWebhook?.url}
                    placeholder="https://example.com/webhook"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The endpoint URL where webhook events will be sent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret (Optional)
                  </label>
                  <input
                    type="text"
                    name="secret"
                    defaultValue={editingWebhook?.secret}
                    placeholder="Webhook secret for verification"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Secret key for webhook signature verification
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Events to Subscribe *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {availableEvents.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2"
                      >
                        <input
                          type="checkbox"
                          name="events"
                          value={event}
                          defaultChecked={editingWebhook?.events.includes(
                            event,
                          )}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {event.replace(/_/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select one or more events to subscribe to
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="active"
                    defaultValue={editingWebhook?.active ? "true" : "false"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingWebhook(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {editingWebhook ? "Update" : "Create"} Webhook
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cross-Module Links */}
      <CrossModuleLinks
        title="Quick Navigation"
        links={[
          {
            label: "QHSE Dashboard",
            href: "/qhse/dashboard",
            icon: "ri-dashboard-3-line",
            description: "Overview",
          },
          {
            label: "Incidents",
            href: "/qhse/incidents",
            icon: "ri-error-warning-line",
            description: "View incidents",
          },
          {
            label: "Inspections",
            href: "/qhse/inspections",
            icon: "ri-clipboard-line",
            description: "View inspections",
          },
          {
            label: "Search",
            href: "/qhse/search",
            icon: "ri-search-line",
            description: "Advanced search",
          },
        ]}
      />
    </div>
  );
}
