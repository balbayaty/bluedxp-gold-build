"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type WarehouseQRCode = {
  id: string;
  warehouseId: string;
  type: "inventory" | "location" | "equipment" | "task" | "shipment" | "custom";
  entityId: string;
  qrData: string;
  networkId?: string;
  metadata: {
    createdAt: string;
    lastScanned?: string;
    scanCount: number;
    location?: string;
  };
};

type WarehouseQRAnalytics = {
  totalQRCodes: number;
  totalScans: number;
  byType: Record<string, number>;
  scanTrend: Array<{ date: string; scans: number }>;
  topScanned: WarehouseQRCode[];
  networkConnections: number;
};

interface WarehouseQRIntegrationProps {
  warehouseId: string;
}

export default function WarehouseQRIntegration({
  warehouseId,
}: WarehouseQRIntegrationProps) {
  const [analytics, setAnalytics] = useState<WarehouseQRAnalytics | null>(null);
  const [qrCodes, setQRCodes] = useState<WarehouseQRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/warehouse/${warehouseId}/qr`);
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load warehouse QR data");
      }
      setAnalytics(data.analytics as WarehouseQRAnalytics);
      setQRCodes(((data.codes || []) as WarehouseQRCode[]).slice(0, 20));
    } catch (error) {
      console.error("Error loading QR data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading QR integration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total QR Codes</div>
            <div className="text-2xl font-bold text-white">
              {analytics.totalQRCodes}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Scans</div>
            <div className="text-2xl font-bold text-cyan-400">
              {analytics.totalScans}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              Network Connections
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {analytics.networkConnections}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Avg Scans/Code</div>
            <div className="text-2xl font-bold text-yellow-400">
              {analytics.totalQRCodes > 0
                ? Math.round(analytics.totalScans / analytics.totalQRCodes)
                : 0}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-white/5 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-qr-code-line mr-2 text-blue-400"></i>
          QR Codes by Type
        </h3>
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.byType).map(([type, count]) => (
              <div
                key={type}
                className="p-3 rounded bg-black/20 border border-white/5"
              >
                <div className="text-sm text-gray-400">{type}</div>
                <div className="text-xl font-bold text-white">{count}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-white/5 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-qr-scan-2-line mr-2 text-green-400"></i>
          Top Scanned QR Codes
        </h3>
        <div className="space-y-2">
          {analytics && analytics.topScanned.length > 0 ? (
            analytics.topScanned.slice(0, 10).map((qr) => (
              <div
                key={qr.id}
                className="p-3 rounded bg-black/20 border border-white/5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">{qr.type}</div>
                  <div className="text-sm text-gray-400">{qr.entityId}</div>
                </div>
                <div className="text-cyan-400 font-bold">
                  {qr.metadata.scanCount || 0} scans
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              No QR codes scanned yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
