/**
 * ERP Connectors View Component
 * Pre-built ERP integrations management
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { erpConnectorService } from "@/lib/services/integration/erp/erpConnectorService";
import type {
  ERPConnection,
  ERPSyncResult,
} from "@/lib/services/integration/erp/erpConnectorService";

interface ERPConnectorsViewProps {
  warehouseId: string;
}

export default function ERPConnectorsView({
  warehouseId,
}: ERPConnectorsViewProps) {
  const [connections, setConnections] = useState<ERPConnection[]>([]);
  const [selectedConnection, setSelectedConnection] =
    useState<ERPConnection | null>(null);
  const [syncResults, setSyncResults] = useState<ERPSyncResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const conns = await erpConnectorService.getAllConnections();
      setConnections(conns);
    } catch (error) {
      console.error("Error loading connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (
    connectionId: string,
    entityType: ERPSyncResult["entityType"],
  ) => {
    try {
      const result = await erpConnectorService.syncFromERP(
        connectionId,
        entityType,
      );
      setSyncResults([result, ...syncResults]);
    } catch (error) {
      console.error("Error syncing:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <i className="ri-plug-line mr-3 text-cyan-400"></i>
            ERP Connectors
          </h2>
          <button
            onClick={loadConnections}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              onClick={() => setSelectedConnection(conn)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedConnection?.id === conn.id
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:border-cyan-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{conn.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    conn.status === "CONNECTED"
                      ? "bg-green-500/20 text-green-400"
                      : conn.status === "ERROR"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {conn.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {conn.erpType.replace("_", " ")}
              </p>
              {conn.syncSettings.lastSync && (
                <p className="text-xs text-gray-500">
                  Last sync:{" "}
                  {new Date(conn.syncSettings.lastSync).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {selectedConnection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedConnection.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["MATERIAL", "CUSTOMER", "ORDER", "INVENTORY"] as const).map(
              (entityType) => (
                <button
                  key={entityType}
                  onClick={() => handleSync(selectedConnection.id, entityType)}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors"
                >
                  <p className="text-white font-medium">{entityType}</p>
                  <p className="text-xs text-gray-400 mt-1">Sync Now</p>
                </button>
              ),
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
