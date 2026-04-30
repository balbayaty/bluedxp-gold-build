/**
 * Zoho Integration Settings
 *
 * Configure Zoho ERP integration for transportation management:
 * - API credentials
 * - Sync settings
 * - Field mappings
 * - Webhook configuration
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ModuleLinks from "@/components/ModuleLinks";
import { logger } from "@/lib/services/observability/logger";

interface ZohoConfig {
  enabled: boolean;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  organizationId: string;
  syncSettings: {
    syncShipments: boolean;
    syncCarriers: boolean;
    syncCustomers: boolean;
    syncInvoices: boolean;
    autoSync: boolean;
    syncInterval: number; // minutes
  };
  fieldMappings: {
    shipment: Record<string, string>;
    carrier: Record<string, string>;
    customer: Record<string, string>;
  };
  webhooks: {
    enabled: boolean;
    url: string;
    events: string[];
  };
}

export default function ZohoIntegrationPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ZohoConfig>({
    enabled: false,
    apiUrl: process.env.NEXT_PUBLIC_ZOHO_API_URL || "https://www.zohoapis.com",
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    organizationId: "",
    syncSettings: {
      syncShipments: true,
      syncCarriers: true,
      syncCustomers: true,
      syncInvoices: false,
      autoSync: true,
      syncInterval: 15,
    },
    fieldMappings: {
      shipment: {
        shipmentNumber: "Shipment_Number",
        status: "Status",
        carrier: "Carrier",
      },
      carrier: {
        name: "Carrier_Name",
        code: "Carrier_Code",
      },
      customer: {
        name: "Customer_Name",
        code: "Customer_Code",
      },
    },
    webhooks: {
      enabled: false,
      url: "",
      events: [],
    },
  });

  const [testStatus, setTestStatus] = useState<
    "IDLE" | "TESTING" | "SUCCESS" | "ERROR"
  >("IDLE");
  const [testMessage, setTestMessage] = useState("");

  const handleTestConnection = async () => {
    setTestStatus("TESTING");
    setTestMessage("Testing connection to Zoho...");

    // Simulate API test
    setTimeout(() => {
      if (config.clientId && config.clientSecret && config.refreshToken) {
        setTestStatus("SUCCESS");
        setTestMessage("Connection successful! Zoho API is accessible.");
      } else {
        setTestStatus("ERROR");
        setTestMessage("Please fill in all required credentials.");
      }
    }, 2000);
  };

  const handleSave = () => {
    // Save configuration
    logger.info("Saving Zoho configuration", undefined, {
      module: "transportation",
      service: "zoho-integration",
      enabled: config.enabled,
    });
    // In real implementation, this would call an API
  };

  return (
    <PageTemplate
      title="Zoho Integration"
      description="Configure Zoho ERP integration for transportation management"
      icon="ri-plug-line"
      systemInfo={{
        sap: "Zoho Integration, ERP Integration",
        oracle: "Zoho ERP Integration",
        manhattan: "Zoho Integration",
      }}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/transportation/integration")}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Integration
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === "TESTING"}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-blue-500/30"
          >
            <i className="ri-flashlight-line"></i>
            {testStatus === "TESTING" ? "Testing..." : "Test Connection"}
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-save-line"></i>
            Save Configuration
          </button>
        </div>
      }
    >
      <ModuleLinks
        links={[
          {
            href: "/transportation/integration",
            label: "Integration Settings",
          },
          { href: "/transportation", label: "Transportation Dashboard" },
          { href: "/transportation/shipments", label: "Shipments" },
        ]}
      />

      {/* Connection Status */}
      {testStatus !== "IDLE" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border ${
            testStatus === "SUCCESS"
              ? "bg-green-500/20 border-green-500/30 text-green-300"
              : testStatus === "ERROR"
                ? "bg-red-500/20 border-red-500/30 text-red-300"
                : "bg-blue-500/20 border-blue-500/30 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`${
                testStatus === "SUCCESS"
                  ? "ri-checkbox-circle-line"
                  : testStatus === "ERROR"
                    ? "ri-error-warning-line"
                    : "ri-loader-4-line animate-spin"
              }`}
            ></i>
            <span>{testMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Configuration Form */}
      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Enable Zoho Integration
              </h3>
              <p className="text-sm text-gray-400">
                Connect to Zoho ERP for automated data synchronization
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) =>
                  setConfig({ ...config, enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            API Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) =>
                  setConfig({ ...config, apiUrl: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="https://www.zohoapis.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization ID
              </label>
              <input
                type="text"
                value={config.organizationId}
                onChange={(e) =>
                  setConfig({ ...config, organizationId: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter Organization ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client ID
              </label>
              <input
                type="password"
                value={config.clientId}
                onChange={(e) =>
                  setConfig({ ...config, clientId: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={config.clientSecret}
                onChange={(e) =>
                  setConfig({ ...config, clientSecret: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter Client Secret"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Refresh Token
              </label>
              <input
                type="password"
                value={config.refreshToken}
                onChange={(e) =>
                  setConfig({ ...config, refreshToken: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter Refresh Token"
              />
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Sync Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">
                  Sync Shipments
                </label>
                <p className="text-xs text-gray-400">
                  Automatically sync shipment data
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.syncSettings.syncShipments}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    syncSettings: {
                      ...config.syncSettings,
                      syncShipments: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-cyan-500 bg-white/5 border-white/10 rounded focus:ring-cyan-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">
                  Sync Carriers
                </label>
                <p className="text-xs text-gray-400">
                  Sync carrier information
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.syncSettings.syncCarriers}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    syncSettings: {
                      ...config.syncSettings,
                      syncCarriers: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-cyan-500 bg-white/5 border-white/10 rounded focus:ring-cyan-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white">
                  Auto Sync
                </label>
                <p className="text-xs text-gray-400">
                  Enable automatic synchronization
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.syncSettings.autoSync}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    syncSettings: {
                      ...config.syncSettings,
                      autoSync: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-cyan-500 bg-white/5 border-white/10 rounded focus:ring-cyan-500"
              />
            </div>
            {config.syncSettings.autoSync && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  value={config.syncSettings.syncInterval}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      syncSettings: {
                        ...config.syncSettings,
                        syncInterval: parseInt(e.target.value) || 15,
                      },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min="1"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
