"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { WarehouseArea } from "@/types/warehouseArea";

interface ZoneDetailPageProps {}

const ZoneDetailPage: React.FC<ZoneDetailPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;
  const zoneId = params?.zoneId as string;

  const [zone, setZone] = useState<WarehouseArea | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadZoneData();
  }, [zoneId, warehouseId]);

  const loadZoneData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/warehouse/${warehouseId}/zones/${zoneId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setZone(data.zone);
        // Note: New schema doesn't yet return inventory/equipment in this call
      }
    } catch (error) {
      console.error("Error loading zone:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Loading Zone..."
        description="Please wait while we load zone details"
        icon="ri-layout-grid-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
            <p className="text-white text-lg">Loading zone information...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!zone) {
    return (
      <PageTemplate
        title="Zone Not Found"
        description="The requested zone could not be found"
        icon="ri-layout-grid-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <p className="text-white text-lg mb-4">Zone not found</p>
            <button
              onClick={() => router.push(`/warehouses/${warehouseId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Warehouse
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  const utilization = zone.utilizationPercentage || 0;

  return (
    <PageTemplate
      title={zone.areaName}
      description={`Zone Details • ${zone.areaCode} • ${warehouseId}`}
      icon="ri-layout-grid-line"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/warehouses/${warehouseId}`)}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30"
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Utilization</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {utilization}%
                </p>
              </div>
              <i className="ri-bar-chart-line text-3xl text-cyan-400"></i>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  utilization > 90
                    ? "bg-red-400"
                    : utilization > 75
                      ? "bg-yellow-400"
                      : utilization > 50
                        ? "bg-green-400"
                        : "bg-blue-400"
                }`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Capacity</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {zone.capacity.toLocaleString()}
                </p>
              </div>
              <i className="ri-archive-line text-3xl text-blue-400"></i>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Units: {zone.currentStock?.toLocaleString() || 0}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Zone Type</p>
                <p className="text-2xl font-bold text-white mt-1 capitalize">
                  {zone.zone}
                </p>
              </div>
              <i className="ri-map-pin-range-line text-3xl text-green-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Physical Location</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Stock Level</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {zone.currentStock || 0}
                </p>
              </div>
              <i className="ri-box-3-line text-3xl text-purple-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Items in this zone</p>
          </motion.div>
        </div>

        {/* Zone Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-information-line mr-2 text-blue-400"></i>
              Zone Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Type</span>
                <span className="text-white font-medium capitalize">
                  {zone.zone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Code</span>
                <span className="text-white font-medium mono">
                  {zone.areaCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Active Status</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${zone.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                >
                  {zone.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Restrictions and Hazards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-alert-line mr-2 text-yellow-400"></i>
              Hazards & Restrictions
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#9ca3af] mb-2">Allowed Hazards</p>
                {zone.allowedHazards && zone.allowedHazards.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {zone.allowedHazards.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-white text-sm">
                    No specific hazard permissions
                  </p>
                )}
              </div>

              {zone.restrictions && (
                <div>
                  <p className="text-sm text-[#9ca3af] mb-2">Restrictions</p>
                  <div className="flex items-start space-x-2 p-2 rounded bg-white/5">
                    <i className="ri-information-line text-yellow-400 mt-0.5"></i>
                    <span className="text-sm text-white/70">
                      {zone.restrictions}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ZoneDetailPage;
