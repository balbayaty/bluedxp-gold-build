/**
 * Resource Rebalancing View Component
 * Dynamic resource allocation and rebalancing
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { dynamicResourceRebalancingService } from "@/lib/services/wms/dynamicResourceRebalancingService";
import type {
  ResourcePool,
  RebalancingPlan,
} from "@/lib/services/wms/dynamicResourceRebalancingService";

interface ResourceRebalancingViewProps {
  warehouseId: string;
}

export default function ResourceRebalancingView({
  warehouseId,
}: ResourceRebalancingViewProps) {
  const [resourcePool, setResourcePool] = useState<ResourcePool | null>(null);
  const [rebalancingPlan, setRebalancingPlan] =
    useState<RebalancingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dynamicResourceRebalancingService.initializeMonitoring(warehouseId);
    loadResourceData();

    const interval = setInterval(() => {
      loadResourceData();
    }, 30000);

    return () => clearInterval(interval);
  }, [warehouseId]);

  const loadResourceData = async () => {
    try {
      const [pool, plan] = await Promise.all([
        dynamicResourceRebalancingService.getResourcePool(warehouseId),
        dynamicResourceRebalancingService.getRebalancingPlan(warehouseId),
      ]);
      setResourcePool(pool);
      setRebalancingPlan(plan);
    } catch (error) {
      console.error("Error loading resource data:", error);
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
      {/* Resource Pool */}
      {resourcePool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <i className="ri-refresh-line mr-3 text-cyan-400"></i>
            Resource Pool
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Labor */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h3 className="text-white font-medium mb-3">Labor</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white font-bold">
                    {resourcePool.labor.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available</span>
                  <span className="text-green-400 font-bold">
                    {resourcePool.labor.available}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Working</span>
                  <span className="text-blue-400 font-bold">
                    {resourcePool.labor.working}
                  </span>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <h3 className="text-white font-medium mb-3">Equipment</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white font-bold">
                    {resourcePool.equipment.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available</span>
                  <span className="text-green-400 font-bold">
                    {resourcePool.equipment.available}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">In Use</span>
                  <span className="text-purple-400 font-bold">
                    {resourcePool.equipment.inUse}
                  </span>
                </div>
              </div>
            </div>

            {/* Robots */}
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <h3 className="text-white font-medium mb-3">Robots</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white font-bold">
                    {resourcePool.robots.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available</span>
                  <span className="text-green-400 font-bold">
                    {resourcePool.robots.available}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Working</span>
                  <span className="text-cyan-400 font-bold">
                    {resourcePool.robots.working}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rebalancing Plan */}
      {rebalancingPlan && rebalancingPlan.actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-lightbulb-line mr-2 text-yellow-400"></i>
            Rebalancing Actions
          </h3>
          <div className="space-y-3">
            {rebalancingPlan.actions.map((action) => (
              <div
                key={action.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {action.type.replace("_", " ")}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      action.priority === "URGENT"
                        ? "bg-red-500/20 text-red-400"
                        : action.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {action.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{action.reason}</p>
                <p className="text-xs text-green-400">
                  Expected improvement: +{action.expectedImprovement}%
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
