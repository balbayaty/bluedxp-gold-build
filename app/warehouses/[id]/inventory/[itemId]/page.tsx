"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { InventoryItem } from "@/types/warehouse-management";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface InventoryItemDetailPageProps {}

interface MovementHistory {
  id: string;
  date: Date;
  type: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason?: string;
  performedBy?: string;
}

const InventoryItemDetailPage: React.FC<InventoryItemDetailPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;
  const itemId = params?.itemId as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movementHistory, setMovementHistory] = useState<MovementHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItemData();
  }, [itemId, warehouseId]);

  const loadItemData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/warehouse/${warehouseId}/inventory/${itemId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setMovementHistory(data.movementHistory || []);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error loading inventory item:", error);
    }

    // Fallback to mock data
    const mockItem: InventoryItem = {
      id: itemId,
      sku: "SKU-001",
      name: "Product A",
      category: "Electronics",
      quantity: 150,
      unit: "units",
      location: "A-01-02-03",
      value: 15000,
      supplier: "Supplier A",
      lastMoved: new Date("2024-01-20"),
      hazardClass: "Class 3",
      temperature: 23.5,
      expiryDate: new Date("2025-12-31"),
    };
    setItem(mockItem);

    // Generate mock movement history
    const mockHistory: MovementHistory[] = [
      {
        id: "mov-001",
        date: new Date("2024-01-20"),
        type: "IN",
        quantity: 50,
        fromLocation: "Receiving Dock",
        toLocation: "A-01-02-03",
        reason: "Goods receipt",
        performedBy: "User A",
      },
      {
        id: "mov-002",
        date: new Date("2024-01-15"),
        type: "OUT",
        quantity: 25,
        fromLocation: "A-01-02-03",
        toLocation: "Shipping Dock",
        reason: "Order fulfillment",
        performedBy: "User B",
      },
      {
        id: "mov-003",
        date: new Date("2024-01-10"),
        type: "IN",
        quantity: 100,
        fromLocation: "Receiving Dock",
        toLocation: "A-01-02-03",
        reason: "Goods receipt",
        performedBy: "User A",
      },
    ];
    setMovementHistory(mockHistory);
    setIsLoading(false);
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "IN":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "OUT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "TRANSFER":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ADJUSTMENT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return "ri-arrow-down-line";
      case "OUT":
        return "ri-arrow-up-line";
      case "TRANSFER":
        return "ri-arrow-left-right-line";
      case "ADJUSTMENT":
        return "ri-edit-line";
      default:
        return "ri-file-list-line";
    }
  };

  // Prepare chart data
  const chartData = movementHistory
    .slice()
    .reverse()
    .map((mov, index) => ({
      date: new Date(mov.date).toLocaleDateString(),
      quantity: mov.type === "IN" ? mov.quantity : -mov.quantity,
      cumulative: movementHistory
        .slice(0, movementHistory.length - index)
        .reduce(
          (sum, m) => sum + (m.type === "IN" ? m.quantity : -m.quantity),
          item?.quantity || 0,
        ),
    }));

  if (isLoading) {
    return (
      <PageTemplate
        title="Loading Item..."
        description="Please wait while we load inventory item details"
        icon="ri-box-3-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
            <p className="text-white text-lg">Loading item information...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!item) {
    return (
      <PageTemplate
        title="Item Not Found"
        description="The requested inventory item could not be found"
        icon="ri-box-3-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <p className="text-white text-lg mb-4">Item not found</p>
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

  return (
    <PageTemplate
      title={item.name}
      description={`${item.sku} • ${item.category} • ${warehouseId}`}
      icon="ri-box-3-line"
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
                <p className="text-sm text-[#9ca3af]">Quantity</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {item.quantity}{" "}
                  <span className="text-lg text-[#9ca3af]">{item.unit}</span>
                </p>
              </div>
              <i className="ri-stack-line text-3xl text-cyan-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Current stock level</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Value</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ${item.value.toLocaleString()}
                </p>
              </div>
              <i className="ri-money-dollar-circle-line text-3xl text-green-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Total inventory value</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Location</p>
                <p className="text-xl font-bold text-white mt-1">
                  {item.location}
                </p>
              </div>
              <i className="ri-map-pin-line text-3xl text-blue-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Storage location</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Last Moved</p>
                <p className="text-sm font-medium text-white mt-1">
                  {new Date(item.lastMoved).toLocaleDateString()}
                </p>
              </div>
              <i className="ri-time-line text-3xl text-purple-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">
              {Math.round(
                (Date.now() - new Date(item.lastMoved).getTime()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              days ago
            </p>
          </motion.div>
        </div>

        {/* Item Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-information-line mr-2 text-blue-400"></i>
              Item Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">SKU</span>
                <span className="text-white font-medium">{item.sku}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Category</span>
                <span className="text-white font-medium">{item.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Supplier</span>
                <span className="text-white font-medium">{item.supplier}</span>
              </div>
              {item.hazardClass && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Hazard Class</span>
                  <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                    {item.hazardClass}
                  </span>
                </div>
              )}
              {item.temperature && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Temperature</span>
                  <span className="text-white font-medium">
                    {item.temperature.toFixed(1)}°C
                  </span>
                </div>
              )}
              {item.expiryDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3af]">Expiry Date</span>
                  <span className="text-white font-medium">
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-line-chart-line mr-2 text-cyan-400"></i>
              Quantity Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Movement History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-history-line mr-2 text-purple-400"></i>
            Movement History ({movementHistory.length})
          </h3>
          <div className="space-y-3">
            {movementHistory.map((movement) => (
              <motion.div
                key={movement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded ${getMovementTypeColor(movement.type)}`}
                    >
                      <i className={`${getMovementIcon(movement.type)}`}></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {movement.type}
                        </span>
                        <span className="text-[#9ca3af] text-sm">
                          {movement.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-1">
                        {movement.fromLocation && (
                          <span>{movement.fromLocation} → </span>
                        )}
                        {movement.toLocation}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {new Date(movement.date).toLocaleDateString()}
                    </div>
                    {movement.performedBy && (
                      <div className="text-xs text-[#9ca3af]">
                        by {movement.performedBy}
                      </div>
                    )}
                  </div>
                </div>
                {movement.reason && (
                  <div className="mt-2 text-xs text-[#9ca3af]">
                    <i className="ri-information-line mr-1"></i>
                    {movement.reason}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
};

export default InventoryItemDetailPage;
