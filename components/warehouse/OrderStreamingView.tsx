/**
 * Order Streaming View Component
 * Real-time order processing with continuous optimization
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { orderStreamingService } from "@/lib/services/wms/orderStreamingService";
import type {
  OrderStream,
  StreamingOrder,
  ContinuousOptimization,
} from "@/lib/services/wms/orderStreamingService";

interface OrderStreamingViewProps {
  warehouseId: string;
}

export default function OrderStreamingView({
  warehouseId,
}: OrderStreamingViewProps) {
  const [stream, setStream] = useState<OrderStream | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StreamingOrder | null>(
    null,
  );
  const [optimization, setOptimization] =
    useState<ContinuousOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    orderStreamingService.initializeStreaming(warehouseId);
    loadStreamData();

    const interval = setInterval(() => {
      loadStreamData();
    }, 5000);

    return () => clearInterval(interval);
  }, [warehouseId]);

  const loadStreamData = async () => {
    try {
      const streamData = await orderStreamingService.getStream(warehouseId);
      setStream(streamData);

      if (selectedOrder) {
        const opt = await orderStreamingService.getOptimization(
          selectedOrder.id,
        );
        setOptimization(opt);
      }
    } catch (error) {
      console.error("Error loading stream data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderClick = async (order: StreamingOrder) => {
    setSelectedOrder(order);
    const opt = await orderStreamingService.getOptimization(order.id);
    setOptimization(opt);
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
      {/* Stream Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <i className="ri-send-plane-line mr-3 text-cyan-400"></i>
            Order Streaming
          </h2>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live</span>
          </div>
        </div>

        {stream && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
              <p className="text-sm text-gray-400 mb-1">Orders/Hour</p>
              <p className="text-3xl font-bold text-white">
                {stream.metrics.ordersPerHour}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Avg Processing</p>
              <p className="text-3xl font-bold text-white">
                {(stream.metrics.averageProcessingTime / 1000 / 60).toFixed(1)}m
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <p className="text-sm text-gray-400 mb-1">Optimization Rate</p>
              <p className="text-3xl font-bold text-white">
                {stream.metrics.optimizationRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
              <p className="text-sm text-gray-400 mb-1">On-Time Fulfillment</p>
              <p className="text-3xl font-bold text-white">
                {stream.metrics.onTimeFulfillment.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Active Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-file-list-3-line mr-2 text-blue-400"></i>
          Active Orders
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {stream?.activeOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedOrder?.id === order.id
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:border-cyan-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-gray-400">
                    {order.items.length} items
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      order.priority === "URGENT"
                        ? "bg-red-500/20 text-red-400"
                        : order.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : order.priority === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {order.priority}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      order.status === "SHIPPED"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "PICKING"
                          ? "bg-blue-500/20 text-blue-400"
                          : order.status === "OPTIMIZING"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Optimization Details */}
      {selectedOrder && optimization && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-magic-line mr-2 text-purple-400"></i>
            Optimization History
          </h3>
          <div className="space-y-3">
            {optimization.optimizations.map((opt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {opt.type.replace("_", " ")}
                  </span>
                  <span className="text-green-400 font-bold">
                    +{opt.improvement.toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(opt.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
