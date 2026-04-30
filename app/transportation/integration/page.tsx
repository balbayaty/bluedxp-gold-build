/**
 * Transportation Integration Settings
 *
 * Configure integrations with:
 * - ERP systems (Zoho, SAP, Oracle, ERPNext)
 * - TMS providers (UberFreight, Flexport, Project44, FourKites)
 * - Carriers (DHL, FedEx, UPS, Aramex)
 * - Customs authorities (Rabet.sa, etc.)
 * - Document management systems (SharePoint, Documentum, etc.)
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

interface Integration {
  id: string;
  name: string;
  type: "ERP" | "TMS" | "CARRIER" | "CUSTOMS" | "DOCUMENT";
  enabled: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSync?: Date | string;
  description: string;
}

export default function TransportationIntegrationPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "standalone",
      name: "Standalone System",
      type: "TMS",
      enabled: true,
      status: "CONNECTED",
      description: "Internal transportation management system",
    },
    {
      id: "zoho",
      name: "Zoho ERP",
      type: "ERP",
      enabled: false,
      status: "DISCONNECTED",
      description: "Integrate with Zoho ERP for shipment management",
    },
    {
      id: "maersk",
      name: "Maersk",
      type: "CARRIER",
      enabled: false,
      status: "DISCONNECTED",
      description: "Maersk sea freight carrier integration",
    },
    {
      id: "fedex",
      name: "FedEx",
      type: "CARRIER",
      enabled: false,
      status: "DISCONNECTED",
      description: "FedEx air freight and express delivery integration",
    },
    {
      id: "uberfreight",
      name: "UberFreight",
      type: "TMS",
      enabled: false,
      status: "DISCONNECTED",
      description: "Digital freight marketplace integration",
    },
    {
      id: "flexport",
      name: "Flexport",
      type: "TMS",
      enabled: false,
      status: "DISCONNECTED",
      description: "Global freight forwarding platform",
    },
    {
      id: "sharepoint",
      name: "Microsoft SharePoint",
      type: "DOCUMENT",
      enabled: false,
      status: "DISCONNECTED",
      description: "Enterprise document management integration",
    },
    {
      id: "rabet",
      name: "Rabet.sa (Saudi Customs)",
      type: "CUSTOMS",
      enabled: false,
      status: "DISCONNECTED",
      description: "Saudi Arabia customs authority integration",
    },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id ? { ...int, enabled: !int.enabled } : int,
      ),
    );
  };

  const testConnection = async (id: string) => {
    // Simulate connection test
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id ? { ...int, status: "CONNECTED" as const } : int,
      ),
    );
  };

  const typeColors: Record<string, string> = {
    ERP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    TMS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    CARRIER:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    CUSTOMS:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    DOCUMENT: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  };

  const statusColors: Record<string, string> = {
    CONNECTED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    DISCONNECTED:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    ERROR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <PageTemplate
      title="Transportation Integration Settings"
      description="Configure integrations with ERP systems, TMS providers, carriers, and customs authorities"
      icon="ri-plug-line"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">ℹ️</div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Integration Modes
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                You can use the system in <strong>Standalone mode</strong> (no
                external dependencies) or integrate with any external system.
                Multiple integrations can be active simultaneously for hybrid
                operations.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {integration.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColors[integration.type]}`}
                    >
                      {integration.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {integration.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[integration.status]}`}
                    >
                      {integration.status}
                    </span>
                    {integration.lastSync && (
                      <span className="text-xs text-gray-500">
                        Last sync:{" "}
                        {new Date(integration.lastSync).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integration.enabled}
                      onChange={() => toggleIntegration(integration.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                  {integration.enabled &&
                    integration.status === "DISCONNECTED" && (
                      <button
                        onClick={() => testConnection(integration.id)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Test Connection
                      </button>
                    )}
                </div>
              </div>

              {integration.enabled && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      // Navigate to specific integration config page
                      window.location.href = `/transportation/integration/${integration.id}`;
                    }}
                    className="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Configure Settings →
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Integration Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {integrations.filter((i) => i.enabled).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Enabled
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {integrations.filter((i) => i.status === "CONNECTED").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connected
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {integrations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
