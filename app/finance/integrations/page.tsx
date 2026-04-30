/**
 * Financial Integrations Page
 * Shows integration status with all modules
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiPlugLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
} from "react-icons/ri";

interface FinancialIntegration {
  module: string;
  enabled: boolean;
  autoPostToGL: boolean;
  lastSyncAt?: string;
}

export default function FinancialIntegrationsPage() {
  const [integrations, setIntegrations] = useState<FinancialIntegration[]>([]);
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(
        "/api/finance/integrations?tenantId=default",
      );
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.data.integrations || []);
        setUnifiedData(data.data.unifiedData);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const moduleIcons: Record<string, string> = {
    MARKETPLACE: "🛒",
    TRANSPORTATION: "🚚",
    FACILITY: "🏢",
    HR: "👥",
    WMS: "📦",
    TMS: "🚛",
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiPlugLine className="text-cyan-400" />
              Financial Integrations
            </h1>
            <p className="text-gray-400 mt-1">
              Integration status with all modules
            </p>
          </div>
          <button
            onClick={fetchIntegrations}
            className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all"
          >
            <RiRefreshLine className="text-xl" />
          </button>
        </div>

        {/* Integrations Grid */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading integrations...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.module}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {moduleIcons[integration.module] || "🔗"}
                    </div>
                    <div>
                      <h3 className="font-bold">{integration.module}</h3>
                      <p className="text-sm text-gray-400">
                        Financial Integration
                      </p>
                    </div>
                  </div>
                  {integration.enabled ? (
                    <RiCheckboxCircleLine className="text-green-400 text-2xl" />
                  ) : (
                    <RiCloseCircleLine className="text-red-400 text-2xl" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        integration.enabled
                          ? "bg-green-400/20 text-green-400"
                          : "bg-red-400/20 text-red-400"
                      }`}
                    >
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Auto Post to GL</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        integration.autoPostToGL
                          ? "bg-cyan-400/20 text-cyan-400"
                          : "bg-gray-400/20 text-gray-400"
                      }`}
                    >
                      {integration.autoPostToGL ? "Yes" : "No"}
                    </span>
                  </div>
                  {integration.lastSyncAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Last Sync</span>
                      <span className="text-gray-300">
                        {new Date(integration.lastSyncAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unified Data Summary */}
        {unifiedData && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4">
              Unified Financial Data Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Payments</p>
                <p className="text-2xl font-bold">
                  {unifiedData.payments?.total || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Invoices</p>
                <p className="text-2xl font-bold">
                  {unifiedData.invoices?.total || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">GL Entries</p>
                <p className="text-2xl font-bold">
                  {unifiedData.glEntries?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
