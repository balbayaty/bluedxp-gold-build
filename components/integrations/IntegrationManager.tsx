/**
 * Integration Manager Component
 * UI for managing external integrations (LinkedIn, Telegram, WhatsApp, News Sites, Generic Sites)
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLink,
  FiX,
  FiRefreshCw,
  FiSettings,
  FiCheck,
  FiAlertCircle,
  FiLinkedin,
  FiMessageCircle,
  FiRss,
  FiGlobe,
  FiPlus,
  FiTrash2,
  FiExternalLink,
  FiClock,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import type {
  BaseIntegration,
  IntegrationType,
} from "@/types/external-integrations";
import IntegrationSetupWizard from "./IntegrationSetupWizard";

interface IntegrationManagerProps {
  tenantId: string;
  userId?: string;
  onIntegrationChange?: () => void;
}

const INTEGRATION_TYPES: {
  type: IntegrationType;
  name: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    type: "LINKEDIN",
    name: "LinkedIn",
    icon: <FiLinkedin />,
    color: "bg-blue-600",
  },
  {
    type: "TELEGRAM",
    name: "Telegram",
    icon: <FiMessageCircle />,
    color: "bg-blue-500",
  },
  {
    type: "WHATSAPP",
    name: "WhatsApp",
    icon: <FiMessageCircle />,
    color: "bg-green-500",
  },
  {
    type: "NEWS_SITE",
    name: "News Site",
    icon: <FiRss />,
    color: "bg-orange-500",
  },
  {
    type: "RSS_FEED",
    name: "RSS Feed",
    icon: <FiRss />,
    color: "bg-orange-600",
  },
  {
    type: "GENERIC_SITE",
    name: "Website",
    icon: <FiGlobe />,
    color: "bg-purple-500",
  },
  {
    type: "IFRAME_EMBED",
    name: "Embed Site",
    icon: <FiGlobe />,
    color: "bg-indigo-500",
  },
  {
    type: "API_INTEGRATION",
    name: "API",
    icon: <FiLink />,
    color: "bg-pink-500",
  },
];

export default function IntegrationManager({
  tenantId,
  userId,
  onIntegrationChange,
}: IntegrationManagerProps) {
  const [integrations, setIntegrations] = useState<BaseIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadIntegrations();
  }, [tenantId]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations?tenantId=${tenantId}`);
      const data = await response.json();

      if (data.success) {
        setIntegrations(data.data || []);
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    setSyncing((prev) => new Set(prev).add(integrationId));
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await loadIntegrations();
        onIntegrationChange?.();
      }
    } catch (error) {
      console.error("Error syncing integration:", error);
    } finally {
      setSyncing((prev) => {
        const next = new Set(prev);
        next.delete(integrationId);
        return next;
      });
    }
  };

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await response.json();

      if (data.success) {
        await loadIntegrations();
        onIntegrationChange?.();
      }
    } catch (error) {
      console.error("Error toggling integration:", error);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        await loadIntegrations();
        onIntegrationChange?.();
      }
    } catch (error) {
      console.error("Error deleting integration:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "text-green-500 bg-green-500/10";
      case "ERROR":
        return "text-red-500 bg-red-500/10";
      case "PENDING":
        return "text-yellow-500 bg-yellow-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const getTypeInfo = (type: IntegrationType) => {
    return (
      INTEGRATION_TYPES.find((t) => t.type === type) || INTEGRATION_TYPES[0]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FiRefreshCw className="animate-spin text-2xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            External Integrations
          </h2>
          <p className="text-gray-400 mt-1">
            Connect LinkedIn, Telegram, WhatsApp, News Sites, and more
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiPlus /> Add Integration
        </button>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <FiLink className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-400 mb-4">No integrations connected</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Connect Your First Integration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => {
            const typeInfo = getTypeInfo(integration.type);
            const isSyncing = syncing.has(integration.id);

            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`${typeInfo.color} p-2 rounded-lg text-white`}
                    >
                      {typeInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-400">{typeInfo.name}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(integration.status)}`}
                  >
                    {integration.status}
                  </span>
                </div>

                {/* Description */}
                {integration.description && (
                  <p className="text-sm text-gray-400">
                    {integration.description}
                  </p>
                )}

                {/* Last Sync */}
                {integration.lastSyncAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiClock />
                    <span>
                      Last sync:{" "}
                      {new Date(integration.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSync(integration.id)}
                      disabled={isSyncing}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Sync"
                    >
                      <FiRefreshCw
                        className={`text-gray-400 ${isSyncing ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() =>
                        handleToggle(integration.id, !integration.enabled)
                      }
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title={integration.enabled ? "Disable" : "Enable"}
                    >
                      {integration.enabled ? (
                        <FiToggleRight className="text-green-500 text-xl" />
                      ) : (
                        <FiToggleLeft className="text-gray-500 text-xl" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="text-red-400" />
                    </button>
                  </div>
                  <button
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <FiSettings className="text-gray-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Setup Wizard Modal */}
      <AnimatePresence>
        {showWizard && selectedType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWizard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/10 rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Integration Setup Wizard
                </h3>
                <button
                  onClick={() => {
                    setShowWizard(false);
                    setSelectedType(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="text-gray-400" />
                </button>
              </div>

              <IntegrationSetupWizard
                type={selectedType}
                onComplete={async (wizardConfig) => {
                  // Use the config from wizard to create integration directly
                  setShowWizard(false);

                  try {
                    setLoading(true);
                    const response = await fetch("/api/integrations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: selectedType,
                        tenantId,
                        userId,
                        config: wizardConfig,
                        name:
                          wizardConfig.name ||
                          `${INTEGRATION_TYPES.find((t) => t.type === selectedType)?.name} Integration`,
                      }),
                    });

                    const data = await response.json();
                    if (data.success) {
                      loadIntegrations();
                      onIntegrationChange?.();
                      setSelectedType(null);
                    } else {
                      alert(data.error || "Failed to create integration");
                    }
                  } catch (err: any) {
                    alert(err.message || "Failed to create integration");
                  } finally {
                    setLoading(false);
                  }
                }}
                onCancel={() => {
                  setShowWizard(false);
                  setSelectedType(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Integration Modal */}
      <AnimatePresence>
        {showAddModal && (
          <IntegrationAddModal
            tenantId={tenantId}
            userId={userId}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadIntegrations();
              onIntegrationChange?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Add Integration Modal
 */
function IntegrationAddModal({
  tenantId,
  userId,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  userId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(
    null,
  );
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setLoading(true);
    setError(null);

    try {
      // For LinkedIn, initiate OAuth flow if credentials are provided
      if (
        selectedType === "LINKEDIN" &&
        config.clientId &&
        config.clientSecret
      ) {
        try {
          const redirectUri = `${window.location.origin}/integrations/callback`;
          const response = await fetch(
            `/api/integrations/linkedin/auth?redirectUri=${encodeURIComponent(redirectUri)}&tenantId=${tenantId}&clientId=${encodeURIComponent(config.clientId)}`,
          );
          const data = await response.json();

          if (data.success && data.data.authUrl) {
            // Store credentials temporarily in sessionStorage for callback
            sessionStorage.setItem(
              "linkedin_credentials",
              JSON.stringify({
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                tenantId,
                userId,
              }),
            );
            window.location.href = data.data.authUrl;
            return;
          } else {
            setError(data.error || "Failed to initiate LinkedIn authorization");
            setLoading(false);
            return;
          }
        } catch (err: any) {
          setError(err.message || "Failed to initiate LinkedIn authorization");
          setLoading(false);
          return;
        }
      }

      // For other integrations, create directly
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          tenantId,
          userId,
          config,
          name:
            config.name ||
            `${INTEGRATION_TYPES.find((t) => t.type === selectedType)?.name} Integration`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to create integration");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create integration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Add Integration</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Integration Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Integration Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INTEGRATION_TYPES.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.type);
                    setConfig({});
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === type.type
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className={`${type.color} p-2 rounded-lg text-white w-fit mx-auto mb-2`}
                  >
                    {type.icon}
                  </div>
                  <p className="text-sm text-white font-medium">{type.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Setup Option */}
          {selectedType && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300 font-medium mb-1">
                    💡 Need Help? Use the Setup Wizard
                  </p>
                  <p className="text-xs text-green-400">
                    Step-by-step guide with helpful tips and validation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowWizard(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  Open Wizard
                </button>
              </div>
            </div>
          )}

          {/* Configuration based on type */}
          {selectedType && (
            <IntegrationConfigForm
              type={selectedType}
              config={config}
              onChange={setConfig}
            />
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedType || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/**
 * Integration Configuration Form
 */
function IntegrationConfigForm({
  type,
  config,
  onChange,
}: {
  type: IntegrationType;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  switch (type) {
    case "LINKEDIN":
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Click the button below to authorize with LinkedIn. You'll be
            redirected to LinkedIn to grant permissions.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch(
                  `/api/integrations/linkedin/auth?redirectUri=${encodeURIComponent(window.location.origin + "/integrations/callback")}&tenantId=${config.tenantId || ""}`,
                );
                const data = await response.json();
                if (data.success && data.data.authUrl) {
                  window.location.href = data.data.authUrl;
                }
              } catch (error) {
                console.error("Error initiating LinkedIn auth:", error);
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Authorize with LinkedIn
          </button>
        </div>
      );

    case "TELEGRAM":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bot Token
            </label>
            <input
              type="text"
              value={config.botToken || ""}
              onChange={(e) => updateConfig("botToken", e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your bot token from @BotFather on Telegram
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={config.webhookUrl || ""}
              onChange={(e) => updateConfig("webhookUrl", e.target.value)}
              placeholder="https://your-domain.com/api/integrations/telegram/webhook"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      );

    case "WHATSAPP":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider
            </label>
            <select
              value={config.provider || "WHATSAPP_BUSINESS"}
              onChange={(e) => updateConfig("provider", e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="WHATSAPP_BUSINESS">WhatsApp Business API</option>
              <option value="TWILIO">Twilio</option>
              <option value="META_CLOUD_API">Meta Cloud API</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key / Access Token
            </label>
            <input
              type="password"
              value={config.apiKey || ""}
              onChange={(e) => updateConfig("apiKey", e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number ID
            </label>
            <input
              type="text"
              value={config.phoneNumberId || ""}
              onChange={(e) => updateConfig("phoneNumberId", e.target.value)}
              placeholder="Enter phone number ID"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      );

    case "NEWS_SITE":
    case "RSS_FEED":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Feed URL
            </label>
            <input
              type="url"
              value={config.feedUrl || config.url || ""}
              onChange={(e) => {
                const url = e.target.value;
                updateConfig("feedUrl", url);
                updateConfig("url", url);
              }}
              placeholder="https://example.com/rss"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={config.refreshInterval || 3600}
              onChange={(e) =>
                updateConfig("refreshInterval", parseInt(e.target.value))
              }
              min={60}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      );

    case "GENERIC_SITE":
    case "IFRAME_EMBED":
    case "API_INTEGRATION":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL
            </label>
            <input
              type="url"
              value={config.url || ""}
              onChange={(e) => updateConfig("url", e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          {type === "API_INTEGRATION" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Base URL
                </label>
                <input
                  type="url"
                  value={config.apiConfig?.baseUrl || ""}
                  onChange={(e) =>
                    updateConfig("apiConfig", {
                      ...config.apiConfig,
                      baseUrl: e.target.value,
                    })
                  }
                  placeholder="https://api.example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiConfig?.apiKey || ""}
                  onChange={(e) =>
                    updateConfig("apiConfig", {
                      ...config.apiConfig,
                      apiKey: e.target.value,
                    })
                  }
                  placeholder="Enter API key"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      );

    default:
      return null;
  }
}
