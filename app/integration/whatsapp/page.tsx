"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import type {
  WhatsAppProvider,
  WhatsAppMessage,
  WhatsAppMessageResult,
  WhatsAppTemplate,
} from "@/lib/services/whatsapp/whatsappService";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

interface WhatsAppConfig {
  provider: WhatsAppProvider;
  apiKey: string;
  apiSecret: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  baseUrl: string;
  enabled: boolean;
}

export default function WhatsAppIntegrationPage() {
  const notifications = useNotifications();
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: "WHATSAPP_BUSINESS",
    apiKey: "",
    apiSecret: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    baseUrl: "",
    enabled: false,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testMessage, setTestMessage] = useState<WhatsAppMessage>({
    to: "",
    message: "",
    priority: "normal",
  });
  const [testResult, setTestResult] = useState<WhatsAppMessageResult | null>(
    null,
  );
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [messageHistory, setMessageHistory] = useState<
    Array<WhatsAppMessageResult & { timestamp: string; to: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<
    "config" | "send" | "templates" | "history"
  >("config");

  useEffect(() => {
    loadConfig();
    loadTemplates();
    loadMessageHistory();
  }, []);

  const loadConfig = async () => {
    try {
      // In a real app, this would load from database/API
      const savedConfig = localStorage.getItem("whatsapp-config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setIsConfigured(checkConfig(parsed));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading config", err, {
        module: "integration",
        service: "whatsapp",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "whatsapp",
      });
    }
  };

  const checkConfig = (cfg: WhatsAppConfig): boolean => {
    if (!cfg.enabled) return false;

    switch (cfg.provider) {
      case "WHATSAPP_BUSINESS":
      case "META_CLOUD_API":
        return !!(cfg.apiKey && cfg.phoneNumberId);
      case "TWILIO":
        return !!(cfg.apiKey && cfg.apiSecret);
      case "CUSTOM":
        return !!cfg.baseUrl;
      default:
        return false;
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to database/API
      localStorage.setItem("whatsapp-config", JSON.stringify(config));
      setIsConfigured(checkConfig(config));

      // Reload templates if configured
      if (checkConfig(config)) {
        await loadTemplates();
      }

      notifications.success(
        NotificationPatterns.saveSuccess("Configuration").title,
        NotificationPatterns.saveSuccess("Configuration").message,
        NotificationPatterns.saveSuccess("Configuration"),
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error saving config", err, {
        module: "integration",
        service: "whatsapp",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "whatsapp",
      });
      const errorMsg = err.message || "Unknown error";
      notifications.error(
        NotificationPatterns.saveError(errorMsg).title,
        NotificationPatterns.saveError(errorMsg).message,
        NotificationPatterns.saveError(errorMsg),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!isConfigured) return;

    try {
      // In a real app, this would call the WhatsApp service
      // For now, we'll use mock data
      setTemplates([
        {
          id: "approval_notification",
          name: "Approval Notification",
          language: "en",
          category: "UTILITY",
          components: [],
        },
        {
          id: "order_confirmation",
          name: "Order Confirmation",
          language: "en",
          category: "UTILITY",
          components: [],
        },
      ]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading templates", err, {
        module: "integration",
        service: "whatsapp",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "whatsapp",
      });
    }
  };

  const loadMessageHistory = async () => {
    try {
      // In a real app, this would load from database/API
      const history = localStorage.getItem("whatsapp-history");
      if (history) {
        setMessageHistory(JSON.parse(history));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading history", err, {
        module: "integration",
        service: "whatsapp",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "whatsapp",
      });
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.to || !testMessage.message) {
      notifications.warning(
        NotificationPatterns.validationError(
          "Please enter recipient phone number and message",
        ).title,
        NotificationPatterns.validationError(
          "Please enter recipient phone number and message",
        ).message,
        NotificationPatterns.validationError(
          "Please enter recipient phone number and message",
        ),
      );
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testMessage),
      });

      const result: WhatsAppMessageResult = await response.json();
      setTestResult(result);

      if (result.success) {
        // Add to history
        const newHistory = [
          {
            ...result,
            timestamp: result.timestamp || new Date().toISOString(),
            to: testMessage.to,
          },
          ...messageHistory,
        ].slice(0, 50); // Keep last 50 messages
        setMessageHistory(newHistory);
        localStorage.setItem("whatsapp-history", JSON.stringify(newHistory));

        // Reset form
        setTestMessage({
          to: "",
          message: "",
          priority: "normal",
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error sending message", err, {
        module: "integration",
        service: "whatsapp",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "whatsapp",
      });
      setTestResult({
        success: false,
        error: err.message || "Failed to send message",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendApprovalLink = async (
    to: string,
    approvalUrl: string,
    customerName?: string,
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          message: customerName
            ? `Hello ${customerName},\n\nYou have pending MSDS-SKU link approvals. Please review and approve:\n\n${approvalUrl}\n\nThis link will expire in 72 hours.`
            : `You have pending MSDS-SKU link approvals. Please review and approve:\n\n${approvalUrl}\n\nThis link will expire in 72 hours.`,
          priority: "high",
        }),
      });

      const result: WhatsAppMessageResult = await response.json();
      if (result.success) {
        notifications.success(
          "Message Sent Successfully!",
          "Approval link has been sent via WhatsApp.",
          { duration: 4000 },
        );
      } else {
        notifications.error(
          "Failed to Send Message",
          result.error || "Please try again.",
          { duration: 6000 },
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error sending approval link", err, {
        module: "integration",
        service: "whatsapp",
      });
      errorTrackingService.captureException(err, {
        module: "integration",
        service: "whatsapp",
      });
      const errorMsg = err.message || "Unknown error";
      notifications.error("Failed to Send Message", errorMsg, {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="WhatsApp Integration"
      description="Configure and manage WhatsApp Business API integration for customer notifications and approvals"
      icon="ri-whatsapp-line"
      stats={[
        {
          label: "Status",
          value: isConfigured ? "Configured" : "Not Configured",
          icon: isConfigured
            ? "ri-checkbox-circle-line"
            : "ri-close-circle-line",
          tooltip: isConfigured
            ? "WhatsApp is configured and ready"
            : "WhatsApp needs configuration",
        },
        {
          label: "Provider",
          value: config.provider.replace("_", " "),
          icon: "ri-cloud-line",
          tooltip: "Current WhatsApp provider",
        },
        {
          label: "Templates",
          value: templates.length,
          icon: "ri-file-text-line",
          tooltip: "Available message templates",
        },
        {
          label: "Messages Sent",
          value: messageHistory.filter((m) => m.success).length,
          icon: "ri-message-2-line",
          tooltip: "Total messages sent successfully",
        },
      ]}
      actions={
        <button
          onClick={() => setShowTestModal(true)}
          disabled={!isConfigured || loading}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="ri-message-2-line mr-2"></i>
          Send Test Message
        </button>
      }
    >
      {/* Tabs */}
      <div className="mb-6 border-b border-white/10">
        <div className="flex gap-4">
          {(["config", "send", "templates", "history"] as const).map((tab) => (
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

      {/* Configuration Tab */}
      {activeTab === "config" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Provider Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider
                </label>
                <select
                  value={config.provider}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      provider: e.target.value as WhatsAppProvider,
                    })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="WHATSAPP_BUSINESS">
                    WhatsApp Business API
                  </option>
                  <option value="META_CLOUD_API">Meta Cloud API</option>
                  <option value="TWILIO">Twilio</option>
                  <option value="CUSTOM">Custom Provider</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key / Access Token
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, apiKey: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Enter API key"
                />
              </div>

              {(config.provider === "TWILIO" ||
                config.provider === "CUSTOM") && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={config.apiSecret}
                    onChange={(e) =>
                      setConfig({ ...config, apiSecret: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    placeholder="Enter API secret"
                  />
                </div>
              )}

              {(config.provider === "WHATSAPP_BUSINESS" ||
                config.provider === "META_CLOUD_API") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={config.phoneNumberId}
                      onChange={(e) =>
                        setConfig({ ...config, phoneNumberId: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      placeholder="Enter phone number ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business Account ID
                    </label>
                    <input
                      type="text"
                      value={config.businessAccountId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          businessAccountId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      placeholder="Enter business account ID"
                    />
                  </div>
                </>
              )}

              {config.provider === "CUSTOM" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) =>
                      setConfig({ ...config, baseUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    placeholder="https://api.example.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={config.webhookVerifyToken}
                  onChange={(e) =>
                    setConfig({ ...config, webhookVerifyToken: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Enter webhook verify token"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={config.enabled}
                  onChange={(e) =>
                    setConfig({ ...config, enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="enabled" className="text-sm text-gray-300">
                  Enable WhatsApp Integration
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveConfig}
                disabled={loading}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>
              <button
                onClick={() => setIsConfigured(checkConfig(config))}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Test Connection
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Webhook Configuration
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Configure your webhook URL in your WhatsApp provider dashboard:
            </p>
            <div className="bg-black/20 p-4 rounded-lg font-mono text-sm text-gray-300">
              {typeof window !== "undefined" &&
                `${window.location.origin}/api/whatsapp/webhook`}
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Verify Token: {config.webhookVerifyToken || "Not set"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Send Message Tab */}
      {activeTab === "send" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Send Message
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Phone Number (E.164 format)
                </label>
                <input
                  type="text"
                  value={testMessage.to}
                  onChange={(e) =>
                    setTestMessage({ ...testMessage, to: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="+966501234567"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Format: +[country code][number] (e.g., +966501234567)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={testMessage.message}
                  onChange={(e) =>
                    setTestMessage({ ...testMessage, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Enter your message..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={testMessage.priority}
                  onChange={(e) =>
                    setTestMessage({
                      ...testMessage,
                      priority: e.target.value as "high" | "normal" | "low",
                    })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <button
                onClick={sendTestMessage}
                disabled={
                  !isConfigured ||
                  loading ||
                  !testMessage.to ||
                  !testMessage.message
                }
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

              {testResult && (
                <div
                  className={`p-4 rounded-lg ${testResult.success ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}
                >
                  <p
                    className={`font-medium ${testResult.success ? "text-green-400" : "text-red-400"}`}
                  >
                    {testResult.success
                      ? "✓ Message sent successfully!"
                      : "✗ Failed to send message"}
                  </p>
                  {testResult.messageId && (
                    <p className="text-sm text-gray-300 mt-1">
                      Message ID: {testResult.messageId}
                    </p>
                  )}
                  {testResult.error && (
                    <p className="text-sm text-red-300 mt-1">
                      Error: {testResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {templates.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
              <i className="ri-file-text-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-400">
                No templates available. Configure WhatsApp to load templates.
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {template.category} • {template.language}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm">
                    Use Template
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {messageHistory.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
              <i className="ri-message-2-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-400">No message history yet.</p>
            </div>
          ) : (
            messageHistory.map((msg, index) => (
              <div
                key={index}
                className={`bg-white/5 border rounded-lg p-4 ${
                  msg.success ? "border-green-500/30" : "border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <i
                      className={`ri-${msg.success ? "check" : "close"}-circle-line ${
                        msg.success ? "text-green-400" : "text-red-400"
                      }`}
                    ></i>
                    <span className="text-white font-medium">{msg.to}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                {msg.messageId && (
                  <p className="text-xs text-gray-400">ID: {msg.messageId}</p>
                )}
                {msg.error && (
                  <p className="text-xs text-red-400 mt-1">
                    Error: {msg.error}
                  </p>
                )}
              </div>
            ))
          )}
        </motion.div>
      )}
    </PageTemplate>
  );
}
