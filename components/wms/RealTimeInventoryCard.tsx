"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { wmsInventoryIntegration } from "@/lib/services/wms/inventoryIntegration";
import type {
  RealTimeInventoryData,
  InventoryAccuracy,
} from "@/lib/services/wms/inventoryIntegration";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

interface RealTimeInventoryCardProps {
  skuId: string;
  skuCode: string;
  reorderPoint?: number;
  maxStock?: number;
  safetyStock?: number;
}

export default function RealTimeInventoryCard({
  skuId,
  skuCode,
  reorderPoint = 50,
  maxStock = 500,
  safetyStock = 20,
}: RealTimeInventoryCardProps) {
  const notifications = useNotifications();
  const [inventory, setInventory] = useState<RealTimeInventoryData | null>(
    null,
  );
  const [accuracy, setAccuracy] = useState<InventoryAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadInventory();
    loadAccuracy();

    // Subscribe to real-time updates
    const unsubscribe = wmsInventoryIntegration.subscribeToInventoryUpdates(
      skuId,
      (data) => {
        setInventory(data);
        setLastUpdate(new Date());
      },
    );

    // Refresh every 30 seconds (optimized from 5s for better performance)
    const interval = setInterval(() => {
      loadInventory();
      loadAccuracy();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [skuId]);

  const loadInventory = async () => {
    try {
      const data = await wmsInventoryIntegration.getSKUInventoryRealTime(skuId);
      if (data) {
        setInventory(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccuracy = async () => {
    try {
      const data =
        await wmsInventoryIntegration.getInventoryAccuracyData(skuId);
      if (data) {
        setAccuracy(data);
      }
    } catch (error) {
      console.error("Error loading accuracy:", error);
    }
  };

  const handleCycleCount = async () => {
    if (!confirm("Trigger cycle count for this SKU?")) return;

    try {
      await wmsInventoryIntegration.triggerCycleCount(skuId);
      notifications.success(
        "Cycle Count Triggered",
        "Cycle count has been initiated for this SKU.",
        { duration: 4000 },
      );
      await loadAccuracy();
    } catch (error) {
      console.error("Error triggering cycle count:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      notifications.error("Cycle Count Failed", errorMsg, { duration: 6000 });
    }
  };

  if (loading && !inventory) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <p className="text-gray-400">No inventory data available</p>
      </div>
    );
  }

  const stockStatus = wmsInventoryIntegration.getStockStatus(
    inventory.currentStock,
    reorderPoint,
    maxStock,
    safetyStock,
  );

  const stockPercentage =
    maxStock > 0 ? (inventory.currentStock / maxStock) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Real-Time Inventory
          </h3>
          <p className="text-sm text-gray-400">SKU: {skuCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Stock Level Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Current Stock</span>
          <span
            className={`text-2xl font-bold ${
              stockStatus.level === "OUT_OF_STOCK"
                ? "text-red-400"
                : stockStatus.level === "LOW_STOCK"
                  ? "text-yellow-400"
                  : stockStatus.level === "OVER_STOCK"
                    ? "text-purple-400"
                    : "text-green-400"
            }`}
          >
            {inventory.currentStock}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stockPercentage, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${
              stockStatus.level === "OUT_OF_STOCK"
                ? "bg-red-500"
                : stockStatus.level === "LOW_STOCK"
                  ? "bg-yellow-500"
                  : stockStatus.level === "OVER_STOCK"
                    ? "bg-purple-500"
                    : "bg-green-500"
            }`}
          ></motion.div>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span>0</span>
          <span
            className={`px-2 py-0.5 rounded ${
              stockStatus.level === "OUT_OF_STOCK"
                ? "bg-red-500/20 text-red-400"
                : stockStatus.level === "LOW_STOCK"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : stockStatus.level === "OVER_STOCK"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-green-500/20 text-green-400"
            }`}
          >
            {stockStatus.label}
          </span>
          <span>{maxStock}</span>
        </div>
      </div>

      {/* Inventory Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Available</div>
          <div className="text-lg font-semibold text-white">
            {inventory.availableStock}
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Reserved</div>
          <div className="text-lg font-semibold text-yellow-400">
            {inventory.reservedStock}
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">In Transit</div>
          <div className="text-lg font-semibold text-blue-400">
            {inventory.inTransit}
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">On Order</div>
          <div className="text-lg font-semibold text-purple-400">
            {inventory.onOrder}
          </div>
        </div>
      </div>

      {/* Inventory Accuracy */}
      {accuracy && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Inventory Accuracy</span>
            <span
              className={`text-sm font-semibold ${
                accuracy.accuracy >= 99
                  ? "text-green-400"
                  : accuracy.accuracy >= 95
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {accuracy.accuracy.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className={`h-full rounded-full ${
                accuracy.accuracy >= 99
                  ? "bg-green-500"
                  : accuracy.accuracy >= 95
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${accuracy.accuracy}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>System: {accuracy.systemCount}</span>
            <span>Physical: {accuracy.physicalCount}</span>
            <span>Variance: {accuracy.variance}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <button
          onClick={handleCycleCount}
          className="flex-1 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          <i className="ri-refresh-line mr-1"></i>
          Cycle Count
        </button>
        <button
          onClick={loadInventory}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
        >
          <i className="ri-refresh-line"></i>
        </button>
      </div>

      {/* Last Update */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </motion.div>
  );
}
