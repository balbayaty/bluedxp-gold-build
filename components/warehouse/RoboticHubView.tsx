/**
 * Robotic Hub View Component
 * Unified robotic fleet management and orchestration
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { roboticHubService } from "@/lib/services/wms/roboticHubService";
import type {
  RoboticFleet,
  RoboticVendor,
  HumanRobotCollaboration,
  RoboticTaskOrchestration,
} from "@/lib/services/wms/roboticHubService";

interface RoboticHubViewProps {
  warehouseId: string;
}

export default function RoboticHubView({ warehouseId }: RoboticHubViewProps) {
  const [fleet, setFleet] = useState<RoboticFleet | null>(null);
  const [vendors, setVendors] = useState<RoboticVendor[]>([]);
  const [collaborations, setCollaborations] = useState<
    HumanRobotCollaboration[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFleetData();
  }, [warehouseId]);

  const loadFleetData = async () => {
    setIsLoading(true);
    try {
      const [fleetData, vendorsData] = await Promise.all([
        roboticHubService.getFleetStatus(warehouseId),
        roboticHubService.getVendors(),
      ]);
      setFleet(fleetData);
      setVendors(vendorsData);
    } catch (error) {
      console.error("Error loading fleet data:", error);
    } finally {
      setIsLoading(false);
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
      {/* Fleet Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <i className="ri-robot-line mr-3 text-cyan-400"></i>
            Robotic Fleet
          </h2>
          <button
            onClick={loadFleetData}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center space-x-2"
          >
            <i className="ri-refresh-line"></i>
            <span>Refresh</span>
          </button>
        </div>

        {fleet && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-1">Total Robots</p>
              <p className="text-3xl font-bold text-white">
                {fleet.totalRobots}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Active</p>
              <p className="text-3xl font-bold text-white">
                {fleet.activeRobots}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
              <p className="text-sm text-gray-400 mb-1">Idle</p>
              <p className="text-3xl font-bold text-white">
                {fleet.idleRobots}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
              <p className="text-sm text-gray-400 mb-1">Maintenance</p>
              <p className="text-3xl font-bold text-white">
                {fleet.maintenanceRobots}
              </p>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {fleet && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Efficiency</p>
              <p className="text-2xl font-bold text-white">
                {fleet.performance.efficiency.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Utilization</p>
              <p className="text-2xl font-bold text-white">
                {fleet.performance.utilization.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Avg Task Time</p>
              <p className="text-2xl font-bold text-white">
                {(
                  fleet.performance.averageTaskCompletionTime /
                  1000 /
                  60
                ).toFixed(1)}
                m
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Tasks Completed</p>
              <p className="text-2xl font-bold text-white">
                {fleet.performance.totalTasksCompleted}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Vendors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-store-line mr-2 text-blue-400"></i>
          Robotic Vendors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{vendor.name}</h4>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    vendor.integrationStatus === "CONNECTED"
                      ? "bg-green-500/20 text-green-400"
                      : vendor.integrationStatus === "ERROR"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {vendor.integrationStatus}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">Type: {vendor.type}</p>
              <div className="flex flex-wrap gap-2">
                {vendor.capabilities.slice(0, 3).map((cap, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
