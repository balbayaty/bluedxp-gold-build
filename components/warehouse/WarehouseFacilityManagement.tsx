"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseFacilityManagementIntegration } from "@/lib/services/wms/facilityManagementIntegration";
import type { WarehouseFacilityStats } from "@/lib/services/wms/facilityManagementIntegration";

interface WarehouseFacilityManagementProps {
  warehouseId: string;
}

export default function WarehouseFacilityManagement({
  warehouseId,
}: WarehouseFacilityManagementProps) {
  const [stats, setStats] = useState<WarehouseFacilityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsData =
        await warehouseFacilityManagementIntegration.getStats(warehouseId);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading facility data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading facility management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Total Assets</div>
              <div className="text-2xl font-bold text-white">
                {stats.totalAssets}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">
                Maintenance Scheduled
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {stats.maintenanceScheduled}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">
                Space Utilization
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {Math.round(stats.spaceUtilization)}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Cost This Month</div>
              <div className="text-2xl font-bold text-green-400">
                ${stats.costThisMonth.toLocaleString()}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg bg-white/5 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-building-line mr-2 text-blue-400"></i>
              Assets by Status
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.assetsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="p-3 rounded bg-black/20 border border-white/5"
                >
                  <div className="text-sm text-gray-400">{status}</div>
                  <div className="text-xl font-bold text-white">{count}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg bg-white/5 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-tools-line mr-2 text-orange-400"></i>
              Maintenance Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-black/20 border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Scheduled</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.maintenanceScheduled}
                </div>
              </div>
              <div className="p-4 rounded bg-black/20 border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-400">
                  {stats.maintenanceOverdue}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
