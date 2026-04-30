"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { multiWarehouseService } from "@/lib/services/wms/multiWarehouseService";
import { eventBus } from "@/lib/services/event-store";
import type {
  WarehouseNetwork,
  CrossWarehouseTransfer,
  CrossWarehouseInventory,
} from "@/lib/services/wms/multiWarehouseService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WarehouseNetworkViewProps {
  warehouseId: string;
}

export default function WarehouseNetworkView({
  warehouseId,
}: WarehouseNetworkViewProps) {
  const router = useRouter();
  const [networks, setNetworks] = useState<WarehouseNetwork[]>([]);
  const [transfers, setTransfers] = useState<CrossWarehouseTransfer[]>([]);
  const [networkInventory, setNetworkInventory] = useState<
    CrossWarehouseInventory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    "overview" | "transfers" | "inventory" | "analytics"
  >("overview");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    loadNetworkData();

    // Subscribe to network events
    const unsubscribe = eventBus.subscribe("warehouse.network_*", (event) => {
      if (
        event.payload?.warehouseId === warehouseId ||
        event.payload?.fromWarehouse === warehouseId ||
        event.payload?.toWarehouse === warehouseId
      ) {
        loadNetworkData();
      }
    });

    // Set up WebSocket for real-time updates
    let ws: WebSocket | null = null;
    if (typeof window !== "undefined") {
      try {
        const wsUrl =
          process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
          (window.location.protocol === "https:" ? "wss:" : "ws:") +
            "//" +
            window.location.host +
            "/api/realtime";

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsRealtimeConnected(true);
          ws?.send(
            JSON.stringify({
              type: "subscribe",
              channel: `warehouse.network:${warehouseId}`,
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "network_update" &&
              (data.warehouseId === warehouseId ||
                data.fromWarehouse === warehouseId ||
                data.toWarehouse === warehouseId)
            ) {
              loadNetworkData();
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = () => setIsRealtimeConnected(false);
        ws.onclose = () => setIsRealtimeConnected(false);
      } catch (error) {
        console.warn("WebSocket not available:", error);
      }
    }

    return () => {
      unsubscribe();
      if (ws) ws.close();
    };
  }, [warehouseId]);

  const loadNetworkData = async () => {
    setIsLoading(true);
    try {
      // Find networks containing this warehouse
      const allNetworks: WarehouseNetwork[] = [];
      // In production, fetch from API
      // For now, create mock networks
      const mockNetwork: WarehouseNetwork = {
        id: "network-001",
        name: "Saudi Arabia Distribution Network",
        warehouses: [warehouseId, "wh-002", "wh-003"],
        coordinationMode: "CENTRALIZED",
        optimizationEnabled: true,
      };
      allNetworks.push(mockNetwork);

      // Get transfers involving this warehouse
      const allTransfers: CrossWarehouseTransfer[] = [];
      // In production, fetch from API
      // For now, create mock transfers
      const mockTransfers: CrossWarehouseTransfer[] = [
        {
          id: "transfer-001",
          transferNumber: "TRF-001234",
          skuId: "sku-001",
          quantity: 100,
          fromWarehouse: warehouseId,
          toWarehouse: "wh-002",
          reason: "Stock rebalancing",
          priority: "HIGH",
          status: "IN_TRANSIT",
          requestedBy: "user-001",
          requestedAt: new Date(Date.now() - 86400000),
          approvedBy: "user-002",
          approvedAt: new Date(Date.now() - 82800000),
          estimatedArrival: new Date(Date.now() + 3600000),
        },
        {
          id: "transfer-002",
          transferNumber: "TRF-001235",
          skuId: "sku-002",
          quantity: 50,
          fromWarehouse: "wh-003",
          toWarehouse: warehouseId,
          reason: "Demand fulfillment",
          priority: "URGENT",
          status: "APPROVED",
          requestedBy: "user-003",
          requestedAt: new Date(Date.now() - 3600000),
        },
      ];

      setNetworks(allNetworks);
      setTransfers(mockTransfers);

      // Get network inventory for top SKUs
      const topSkus = ["sku-001", "sku-002", "sku-003"];
      const inventoryData = await Promise.all(
        topSkus.map((skuId) =>
          multiWarehouseService.getCrossWarehouseInventory(
            skuId,
            mockNetwork.id,
          ),
        ),
      );
      setNetworkInventory(inventoryData);
    } catch (error) {
      console.error("Error loading network data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "IN_TRANSIT":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "APPROVED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "PENDING":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-400";
      case "HIGH":
        return "text-orange-400";
      case "MEDIUM":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
          <p className="text-white text-lg">Loading network data...</p>
        </div>
      </div>
    );
  }

  const activeTransfers = transfers.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
  );
  const completedTransfers = transfers.filter((t) => t.status === "COMPLETED");
  const incomingTransfers = transfers.filter(
    (t) => t.toWarehouse === warehouseId,
  );
  const outgoingTransfers = transfers.filter(
    (t) => t.fromWarehouse === warehouseId,
  );

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setSelectedView("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "overview"
              ? "bg-cyan-500 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <i className="ri-dashboard-line mr-2"></i>
          Overview
        </button>
        <button
          onClick={() => setSelectedView("transfers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "transfers"
              ? "bg-cyan-500 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <i className="ri-arrow-left-right-line mr-2"></i>
          Transfers ({activeTransfers.length})
        </button>
        <button
          onClick={() => setSelectedView("inventory")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "inventory"
              ? "bg-cyan-500 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <i className="ri-stack-line mr-2"></i>
          Network Inventory
        </button>
        <button
          onClick={() => setSelectedView("analytics")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "analytics"
              ? "bg-cyan-500 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <i className="ri-bar-chart-line mr-2"></i>
          Analytics
        </button>
        {isRealtimeConnected && (
          <div className="ml-auto flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          {/* Network Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af]">Networks</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {networks.length}
                  </p>
                </div>
                <i className="ri-networks-line text-3xl text-blue-400"></i>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Networks this warehouse belongs to
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af]">Active Transfers</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {activeTransfers.length}
                  </p>
                </div>
                <i className="ri-arrow-left-right-line text-3xl text-orange-400"></i>
              </div>
              <p className="text-xs text-[#9ca3af]">In progress transfers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af]">Incoming</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {
                      incomingTransfers.filter((t) => t.status !== "COMPLETED")
                        .length
                    }
                  </p>
                </div>
                <i className="ri-download-line text-3xl text-green-400"></i>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Transfers to this warehouse
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af]">Outgoing</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {
                      outgoingTransfers.filter((t) => t.status !== "COMPLETED")
                        .length
                    }
                  </p>
                </div>
                <i className="ri-upload-line text-3xl text-purple-400"></i>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Transfers from this warehouse
              </p>
            </motion.div>
          </div>

          {/* Networks List */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-networks-line mr-2 text-blue-400"></i>
              Warehouse Networks
            </h3>
            <div className="space-y-3">
              {networks.map((network) => (
                <div
                  key={network.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/warehouse-network/networks/${network.id}`)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{network.name}</h4>
                      <p className="text-sm text-[#9ca3af] mt-1">
                        {network.warehouses.length} warehouses •{" "}
                        {network.coordinationMode} •
                        {network.optimizationEnabled
                          ? " Optimization Enabled"
                          : " Optimization Disabled"}
                      </p>
                    </div>
                    <i className="ri-arrow-right-line text-gray-400"></i>
                  </div>
                </div>
              ))}
              {networks.length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-inbox-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-400">
                    This warehouse is not part of any network
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Transfers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-arrow-left-right-line mr-2 text-orange-400"></i>
              Recent Transfers
            </h3>
            <div className="space-y-3">
              {transfers.slice(0, 5).map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/warehouse-network/transfers/${transfer.id}`)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(transfer.status)}`}
                        >
                          {transfer.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-xs font-medium ${getPriorityColor(transfer.priority)}`}
                        >
                          <i className="ri-flag-line mr-1"></i>
                          {transfer.priority}
                        </span>
                        <span className="text-xs text-[#9ca3af]">
                          {transfer.transferNumber}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-white">
                          {transfer.fromWarehouse === warehouseId ? (
                            <>
                              <span className="text-purple-400">Outgoing</span>{" "}
                              to {transfer.toWarehouse}
                            </>
                          ) : (
                            <>
                              <span className="text-green-400">Incoming</span>{" "}
                              from {transfer.fromWarehouse}
                            </>
                          )}
                        </span>
                        <span className="text-[#9ca3af] ml-4">
                          Qty: {transfer.quantity}
                        </span>
                        <span className="text-[#9ca3af] ml-4">
                          {transfer.reason}
                        </span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-gray-400"></i>
                  </div>
                </div>
              ))}
              {transfers.length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-inbox-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-400">No transfers found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Transfers Tab */}
      {selectedView === "transfers" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-arrow-left-right-line mr-2 text-orange-400"></i>
              All Transfers
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/warehouse-network/transfers/${transfer.id}`)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(transfer.status)}`}
                        >
                          {transfer.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-xs font-medium ${getPriorityColor(transfer.priority)}`}
                        >
                          <i className="ri-flag-line mr-1"></i>
                          {transfer.priority}
                        </span>
                        <span className="text-white font-medium">
                          {transfer.transferNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-[#9ca3af]">From:</span>
                          <p className="text-white">{transfer.fromWarehouse}</p>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">To:</span>
                          <p className="text-white">{transfer.toWarehouse}</p>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Quantity:</span>
                          <p className="text-white">{transfer.quantity}</p>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Reason:</span>
                          <p className="text-white">{transfer.reason}</p>
                        </div>
                      </div>
                      {transfer.estimatedArrival && (
                        <div className="mt-2 text-xs text-[#9ca3af]">
                          <i className="ri-time-line mr-1"></i>
                          ETA:{" "}
                          {new Date(transfer.estimatedArrival).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <i className="ri-arrow-right-line text-gray-400 ml-4"></i>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Inventory Tab */}
      {selectedView === "inventory" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-stack-line mr-2 text-green-400"></i>
              Network Inventory Visibility
            </h3>
            <div className="space-y-4">
              {networkInventory.map((inventory) => (
                <div
                  key={inventory.skuId}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">
                        {inventory.skuCode}
                      </h4>
                      <p className="text-sm text-[#9ca3af]">
                        Total Network: {inventory.totalQuantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#9ca3af]">Available</p>
                      <p className="text-xl font-bold text-green-400">
                        {inventory.networkAvailability}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {inventory.warehouseStock.map((stock) => (
                      <div
                        key={stock.warehouseId}
                        className="flex items-center justify-between p-2 rounded bg-white/5"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              stock.warehouseId === warehouseId
                                ? "bg-cyan-400"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          <span className="text-sm text-white">
                            {stock.warehouseName}
                            {stock.warehouseId === warehouseId && (
                              <span className="ml-2 text-xs text-cyan-400">
                                (This Warehouse)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div>
                            <span className="text-[#9ca3af]">Total:</span>
                            <span className="text-white ml-2">
                              {stock.quantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#9ca3af]">Available:</span>
                            <span className="text-green-400 ml-2">
                              {stock.availableQuantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#9ca3af]">Reserved:</span>
                            <span className="text-yellow-400 ml-2">
                              {stock.reservedQuantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {inventory.recommendedWarehouse && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-[#9ca3af]">
                        <i className="ri-lightbulb-line mr-1 text-yellow-400"></i>
                        Recommended warehouse:{" "}
                        <span className="text-white">
                          {inventory.recommendedWarehouse}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedView === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Transfer Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Completed",
                        value: completedTransfers.length,
                        color: "#10b981",
                      },
                      {
                        name: "In Transit",
                        value: transfers.filter(
                          (t) => t.status === "IN_TRANSIT",
                        ).length,
                        color: "#3b82f6",
                      },
                      {
                        name: "Approved",
                        value: transfers.filter((t) => t.status === "APPROVED")
                          .length,
                        color: "#f59e0b",
                      },
                      {
                        name: "Pending",
                        value: transfers.filter((t) => t.status === "PENDING")
                          .length,
                        color: "#6b7280",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      {
                        name: "Completed",
                        value: completedTransfers.length,
                        color: "#10b981",
                      },
                      {
                        name: "In Transit",
                        value: transfers.filter(
                          (t) => t.status === "IN_TRANSIT",
                        ).length,
                        color: "#3b82f6",
                      },
                      {
                        name: "Approved",
                        value: transfers.filter((t) => t.status === "APPROVED")
                          .length,
                        color: "#f59e0b",
                      },
                      {
                        name: "Pending",
                        value: transfers.filter((t) => t.status === "PENDING")
                          .length,
                        color: "#6b7280",
                      },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Transfer Volume Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={Array.from({ length: 7 }, (_, i) => ({
                    day: `Day ${i + 1}`,
                    incoming: Math.floor(Math.random() * 20) + 5,
                    outgoing: Math.floor(Math.random() * 15) + 3,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="incoming"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Incoming"
                  />
                  <Line
                    type="monotone"
                    dataKey="outgoing"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Outgoing"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
