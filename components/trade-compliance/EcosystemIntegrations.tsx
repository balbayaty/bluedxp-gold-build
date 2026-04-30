/**
 * Ecosystem Integrations Component
 * Shows connected systems and integration status
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Integration {
  id: string;
  name: string;
  type: "erp" | "carrier" | "customs" | "payment" | "document" | "iot";
  status: "connected" | "disconnected" | "error" | "pending";
  lastSync?: string;
  syncFrequency: string;
  dataFlow: "bidirectional" | "inbound" | "outbound";
  description: string;
  icon: string;
}

export default function EcosystemIntegrations() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      // Small delay to prevent blocking UI
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mock integrations - in production, fetch from API
      const mockIntegrations: Integration[] = [
        {
          id: "erp-sap",
          name: "SAP ERP",
          type: "erp",
          status: "connected",
          lastSync: new Date().toISOString(),
          syncFrequency: "Real-time",
          dataFlow: "bidirectional",
          description:
            "Synchronized with SAP ERP for orders, inventory, and financial data",
          icon: "ri-database-2-line",
        },
        {
          id: "carrier-dhl",
          name: "DHL Express",
          type: "carrier",
          status: "connected",
          lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          syncFrequency: "Every 5 minutes",
          dataFlow: "bidirectional",
          description: "Real-time shipment tracking and label generation",
          icon: "ri-truck-line",
        },
        {
          id: "customs-zatca",
          name: "ZATCA Customs",
          type: "customs",
          status: "connected",
          lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          syncFrequency: "Every 10 minutes",
          dataFlow: "bidirectional",
          description:
            "Direct integration with Saudi Customs for clearance status",
          icon: "ri-government-line",
        },
        {
          id: "sfda-api",
          name: "SFDA API",
          type: "customs",
          status: "connected",
          lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          syncFrequency: "Every 15 minutes",
          dataFlow: "inbound",
          description: "Food and medicine license status updates",
          icon: "ri-file-certificate-line",
        },
        {
          id: "payment-stripe",
          name: "Stripe Payments",
          type: "payment",
          status: "connected",
          lastSync: new Date().toISOString(),
          syncFrequency: "Real-time",
          dataFlow: "outbound",
          description:
            "Payment processing for license fees and compliance costs",
          icon: "ri-bank-card-line",
        },
        {
          id: "doc-storage",
          name: "Document Storage",
          type: "document",
          status: "connected",
          lastSync: new Date().toISOString(),
          syncFrequency: "Real-time",
          dataFlow: "bidirectional",
          description:
            "Cloud storage for compliance documents and certificates",
          icon: "ri-folder-cloud-line",
        },
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "disconnected":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "erp":
        return "bg-blue-500";
      case "carrier":
        return "bg-green-500";
      case "customs":
        return "bg-purple-500";
      case "payment":
        return "bg-orange-500";
      case "document":
        return "bg-indigo-500";
      case "iot":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9ca3af] text-sm">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-plug-line text-cyan-400"></i>
          Ecosystem Integrations
        </h3>
        <button
          onClick={() => router.push("/integration")}
          className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Manage Integrations →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`border-2 rounded-lg p-4 hover:border-cyan-500/50 transition-all bg-white/5 ${getStatusColor(integration.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`${getTypeColor(integration.type)} w-10 h-10 rounded-lg flex items-center justify-center`}
                >
                  <i className={`${integration.icon} text-white text-lg`}></i>
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {integration.name}
                  </h4>
                  <span className="text-xs text-[#9ca3af] capitalize">
                    {integration.type}
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(integration.status)}`}
              >
                {integration.status}
              </span>
            </div>

            <p className="text-sm text-[#9ca3af] mb-3">
              {integration.description}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Sync Frequency:</span>
                <span className="font-medium text-white">
                  {integration.syncFrequency}
                </span>
              </div>
              {integration.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-[#9ca3af]">Last Sync:</span>
                  <span className="font-medium text-white">
                    {new Date(integration.lastSync).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Data Flow:</span>
                <span className="font-medium text-white capitalize">
                  {integration.dataFlow}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {integrations.filter((i) => i.status === "connected").length}
          </div>
          <div className="text-sm text-[#9ca3af]">Connected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#9ca3af]">
            {integrations.filter((i) => i.status === "disconnected").length}
          </div>
          <div className="text-sm text-[#9ca3af]">Disconnected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {integrations.length}
          </div>
          <div className="text-sm text-[#9ca3af]">Total</div>
        </div>
      </div>
    </motion.div>
  );
}
