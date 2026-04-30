"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { generateCarriers } from "@/utils/mockDataGenerators";
import { format, subHours } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CarrierIntegration {
  id: string;
  carrierCode: string;
  carrierName: string;
  integrationType: "WAJEEH" | "API" | "MANUAL";
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  apiEndpoint?: string;
  apiKey?: string;
  trackingEnabled: boolean;
  labelPrintingEnabled: boolean;
  lastSync?: Date | string;
  syncStatus: {
    success: number;
    failed: number;
    pending: number;
  };
  trackingUpdates: number;
  labelsPrinted: number;
}

export default function CarrierIntegration() {
  const router = useRouter();
  const [carriers] = useState(() => generateCarriers(20));
  const [integrations, setIntegrations] = useState<CarrierIntegration[]>(() => {
    return carriers.slice(0, 10).map((carrier, index) => ({
      id: `integration-${index + 1}`,
      carrierCode: carrier.carrierCode,
      carrierName: carrier.carrierName,
      integrationType:
        index === 0
          ? ("WAJEEH" as const)
          : index < 5
            ? ("API" as const)
            : ("MANUAL" as const),
      status: Math.random() > 0.2 ? ("ACTIVE" as const) : ("ERROR" as const),
      apiEndpoint:
        index < 5
          ? `https://api.${carrier.carrierCode.toLowerCase()}.com/v1`
          : undefined,
      apiKey:
        index < 5 ? `key_****${Math.floor(Math.random() * 10000)}` : undefined,
      trackingEnabled: index < 7,
      labelPrintingEnabled: index < 6,
      lastSync: subHours(new Date(), Math.floor(Math.random() * 24)),
      syncStatus: {
        success: Math.floor(Math.random() * 1000) + 500,
        failed: Math.floor(Math.random() * 20),
        pending: Math.floor(Math.random() * 10),
      },
      trackingUpdates: Math.floor(Math.random() * 5000) + 1000,
      labelsPrinted: Math.floor(Math.random() * 10000) + 5000,
    }));
  });

  const [selectedIntegration, setSelectedIntegration] =
    useState<CarrierIntegration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "wajeeh" | "api" | "tracking"
  >("overview");

  // Integration statistics
  const integrationStats = useMemo(() => {
    const active = integrations.filter((i) => i.status === "ACTIVE").length;
    const wajeeh = integrations.filter(
      (i) => i.integrationType === "WAJEEH",
    ).length;
    const api = integrations.filter((i) => i.integrationType === "API").length;
    const totalTracking = integrations.reduce(
      (sum, i) => sum + i.trackingUpdates,
      0,
    );
    const totalLabels = integrations.reduce(
      (sum, i) => sum + i.labelsPrinted,
      0,
    );
    const totalSyncs = integrations.reduce(
      (sum, i) => sum + i.syncStatus.success + i.syncStatus.failed,
      0,
    );
    const successRate =
      totalSyncs > 0
        ? (integrations.reduce((sum, i) => sum + i.syncStatus.success, 0) /
            totalSyncs) *
          100
        : 0;

    return {
      total: integrations.length,
      active,
      wajeeh,
      api,
      totalTracking,
      totalLabels,
      successRate,
    };
  }, [integrations]);

  // Sync trend (simulated)
  const syncTrend = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = subHours(new Date(), 24 - i);
      return {
        hour: format(hour, "HH:00"),
        success: Math.floor(Math.random() * 50) + 20,
        failed: Math.floor(Math.random() * 5),
      };
    });
  }, []);

  const stats = [
    {
      label: "Total Integrations",
      value: integrationStats.total,
      icon: "ri-truck-line",
      tooltip: "Total carrier integrations",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: integrationStats.active,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active integrations",
      trend: "up" as const,
    },
    {
      label: "Sync Success Rate",
      value: `${integrationStats.successRate.toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Synchronization success rate",
      trend: "up" as const,
    },
    {
      label: "Tracking Updates",
      value: integrationStats.totalTracking.toLocaleString(),
      icon: "ri-map-pin-line",
      tooltip: "Total tracking updates",
      trend: "up" as const,
    },
  ];

  const handleConfigure = (integration: CarrierIntegration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  const handleTest = (integration: CarrierIntegration) => {
    setSelectedIntegration(integration);
    setShowTestModal(true);
  };

  return (
    <PageTemplate
      title="Carrier Integration"
      description="Wajeeh and other carrier integrations with API management, tracking, and label printing"
      icon="ri-truck-line"
      systemInfo={{
        sap: "Carrier Integration, Transportation API",
        oracle: "Carrier Connector, API Integration",
        manhattan: "Carrier Integration, API Management",
      }}
      examples={[
        "Wajeeh integration",
        "Carrier API management",
        "Real-time tracking integration",
        "Label printing integration",
        "Sync monitoring",
        "Connection testing",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
          {(["overview", "wajeeh", "api", "tracking"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === mode
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <i
                className={`ri-${mode === "overview" ? "dashboard-line" : mode === "wajeeh" ? "truck-line" : mode === "api" ? "code-s-slash-line" : "map-pin-line"} mr-1`}
              ></i>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Integration Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  integration.status === "ACTIVE"
                    ? "border-green-500/30"
                    : integration.status === "ERROR"
                      ? "border-red-500/30"
                      : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {integration.carrierName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          integration.integrationType === "WAJEEH"
                            ? "bg-purple-500/20 text-purple-400"
                            : integration.integrationType === "API"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {integration.integrationType}
                      </span>
                    </div>
                    <div
                      className={`text-sm ${
                        integration.status === "ACTIVE"
                          ? "text-green-400"
                          : integration.status === "ERROR"
                            ? "text-red-400"
                            : "text-[#9ca3af]"
                      }`}
                    >
                      <i
                        className={`ri-${integration.status === "ACTIVE" ? "check" : "close"}-line mr-1`}
                      ></i>
                      {integration.status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-code-s-slash-line mr-1"></i>
                    {integration.apiEndpoint || "Manual Integration"}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span
                      className={`${integration.trackingEnabled ? "text-green-400" : "text-[#9ca3af]"}`}
                    >
                      <i
                        className={`ri-${integration.trackingEnabled ? "check" : "close"}-line mr-1`}
                      ></i>
                      Tracking
                    </span>
                    <span
                      className={`${integration.labelPrintingEnabled ? "text-green-400" : "text-[#9ca3af]"}`}
                    >
                      <i
                        className={`ri-${integration.labelPrintingEnabled ? "check" : "close"}-line mr-1`}
                      ></i>
                      Labels
                    </span>
                  </div>
                  {integration.lastSync && (
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-time-line mr-1"></i>
                      Last Sync:{" "}
                      {format(new Date(integration.lastSync), "MMM dd, HH:mm")}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-sm font-bold text-green-400">
                      {integration.syncStatus.success}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Success</div>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-sm font-bold text-red-400">
                      {integration.syncStatus.failed}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Failed</div>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-sm font-bold text-yellow-400">
                      {integration.syncStatus.pending}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Pending</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleConfigure(integration)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    <i className="ri-settings-line mr-1"></i>
                    Configure
                  </button>
                  <Tooltip content="Test Connection" position="top">
                    <button
                      onClick={() => handleTest(integration)}
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      <i className="ri-flashlight-line"></i>
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sync Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Sync Trend (Last 24 Hours)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={syncTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Success"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Failed"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Wajeeh View */}
      {viewMode === "wajeeh" && (
        <div className="space-y-6">
          {integrations
            .filter((i) => i.integrationType === "WAJEEH")
            .map((integration) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {integration.carrierName}
                    </h3>
                    <div className="text-sm text-[#9ca3af]">
                      Wajeeh Integration
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      integration.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {integration.status}
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {integration.trackingUpdates.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#9ca3af]">
                      Tracking Updates
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {integration.labelsPrinted.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#9ca3af]">Labels Printed</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {integration.syncStatus.success}
                    </div>
                    <div className="text-sm text-[#9ca3af]">
                      Successful Syncs
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* API View */}
      {viewMode === "api" && (
        <div className="space-y-4">
          {integrations
            .filter((i) => i.integrationType === "API")
            .map((integration) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {integration.carrierName}
                    </h3>
                    <div className="text-sm text-[#9ca3af] font-mono mb-2">
                      {integration.apiEndpoint}
                    </div>
                    <div className="text-xs text-[#9ca3af] mb-4">
                      API Key: {integration.apiKey}
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm ${integration.trackingEnabled ? "text-green-400" : "text-[#9ca3af]"}`}
                      >
                        <i
                          className={`ri-${integration.trackingEnabled ? "check" : "close"}-line mr-1`}
                        ></i>
                        Tracking Enabled
                      </span>
                      <span
                        className={`text-sm ${integration.labelPrintingEnabled ? "text-green-400" : "text-[#9ca3af]"}`}
                      >
                        <i
                          className={`ri-${integration.labelPrintingEnabled ? "check" : "close"}-line mr-1`}
                        ></i>
                        Label Printing Enabled
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigure(integration)}
                    className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    Configure
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Tracking View */}
      {viewMode === "tracking" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Tracking Integration Status
            </h3>
            <div className="space-y-3">
              {integrations
                .filter((i) => i.trackingEnabled)
                .map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {integration.carrierName}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {integration.trackingUpdates.toLocaleString()} updates
                      </div>
                    </div>
                    <div className="text-sm text-green-400">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Active
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Configure Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setSelectedIntegration(null);
        }}
        title={`Configure Integration - ${selectedIntegration?.carrierName || ""}`}
        size="lg"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                defaultValue={selectedIntegration.apiEndpoint || ""}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="https://api.carrier.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                API Key
              </label>
              <input
                type="text"
                defaultValue={selectedIntegration.apiKey || ""}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Enter API key"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={selectedIntegration.trackingEnabled}
                  className="rounded"
                />
                <span>Enable Tracking</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={selectedIntegration.labelPrintingEnabled}
                  className="rounded"
                />
                <span>Enable Label Printing</span>
              </label>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setSelectedIntegration(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Save Configuration
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setSelectedIntegration(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Test Connection Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setSelectedIntegration(null);
        }}
        title={`Test Connection - ${selectedIntegration?.carrierName || ""}`}
        size="md"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-sm text-[#9ca3af] mb-2">
                Testing connection to:
              </div>
              <div className="text-white font-mono">
                {selectedIntegration.apiEndpoint || "Manual Integration"}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  // Simulate test
                  alert("Connection test successful!");
                  setShowTestModal(false);
                  setSelectedIntegration(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-flashlight-line mr-2"></i>
                Test Connection
              </button>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setSelectedIntegration(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
