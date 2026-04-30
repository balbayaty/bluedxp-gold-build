"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { warehouseOperationsService } from "@/lib/services/wms/warehouseOperationsService";
import type {
  WarehouseOperation,
  WarehouseOperationsSummary,
} from "@/lib/services/wms/warehouseOperationsService";
import { eventBus } from "@/lib/services/event-store";

interface LiveOperationsDashboardProps {
  warehouseId: string;
}

export default function LiveOperationsDashboard({
  warehouseId,
}: LiveOperationsDashboardProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<WarehouseOperationsSummary | null>(
    null,
  );
  const [operations, setOperations] = useState<WarehouseOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<
    "ALL" | WarehouseOperation["type"]
  >("ALL");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let unsubscribe: (() => void) | null = null;
    let lifecycleUnsubscribe: (() => void) | null = null;
    let operationsUnsubscribe: (() => void) | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connectWebSocket = () => {
      if (typeof window === "undefined") return;

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
          reconnectAttempts = 0;
          ws?.send(
            JSON.stringify({
              type: "subscribe",
              channel: `warehouse.operations:${warehouseId}`,
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "operation_update" &&
              data.warehouseId === warehouseId
            ) {
              loadOperationsData(); // Reload on update
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsRealtimeConnected(false);
        };

        ws.onclose = () => {
          setIsRealtimeConnected(false);
          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, reconnectDelay * reconnectAttempts);
          }
        };
      } catch (error) {
        console.warn("WebSocket not available:", error);
      }
    };

    // Load initial data
    loadOperationsData();

    // Subscribe to real-time updates
    unsubscribe = warehouseOperationsService.subscribeToOperations(
      warehouseId,
      (updatedOperations) => {
        setOperations(updatedOperations);
        updateSummary(updatedOperations);
      },
    );

    // Subscribe to lifecycle events for real-time updates
    lifecycleUnsubscribe = eventBus.subscribe(
      "wms.lifecycle.*",
      (event: { payload?: { warehouseId?: string }; aggregateId?: string }) => {
        // Reload operations when lifecycle changes
        if (
          event.payload?.warehouseId === warehouseId ||
          operations.some((op) => op.id === event.aggregateId)
        ) {
          loadOperationsData();
        }
      },
    );

    // Subscribe to warehouse operations events
    operationsUnsubscribe = eventBus.subscribe(
      `warehouse.operations.${warehouseId}`,
      (event: { payload?: { operations?: WarehouseOperation[] } }) => {
        if (event.payload?.operations) {
          setOperations(event.payload.operations);
          updateSummary(event.payload.operations);
        }
      },
    );

    // Connect WebSocket
    connectWebSocket();

    return () => {
      if (unsubscribe) unsubscribe();
      if (lifecycleUnsubscribe) lifecycleUnsubscribe();
      if (operationsUnsubscribe) operationsUnsubscribe();
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [warehouseId]);

  const loadOperationsData = async () => {
    setIsLoading(true);
    try {
      const [operationsData, summaryData] = await Promise.all([
        warehouseOperationsService.getActiveOperations(warehouseId),
        warehouseOperationsService.getOperationsSummary(warehouseId),
      ]);
      setOperations(operationsData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading operations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSummary = async (ops: WarehouseOperation[]) => {
    try {
      const summaryData =
        await warehouseOperationsService.getOperationsSummary(warehouseId);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error updating summary:", error);
    }
  };

  const filteredOperations =
    selectedType === "ALL"
      ? operations
      : operations.filter((op) => op.type === selectedType);

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case "PUTAWAY":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "PICKING":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "CYCLE_COUNT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "REPLENISHMENT":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "TRANSFER":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
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
          <p className="text-white text-lg">Loading operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Active Operations</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {summary.activeOperations}
                </p>
              </div>
              <i className="ri-play-circle-line text-3xl text-blue-400"></i>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div>
                <span className="text-[#9ca3af]">Pending</span>
                <p className="text-white font-medium">
                  {summary.pendingOperations}
                </p>
              </div>
              <div>
                <span className="text-[#9ca3af]">In Progress</span>
                <p className="text-white font-medium">
                  {summary.inProgressOperations}
                </p>
              </div>
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
                <p className="text-sm text-[#9ca3af]">Completed Today</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {summary.completedToday}
                </p>
              </div>
              <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Operations completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Efficiency</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {summary.performance.efficiency.toFixed(1)}%
                </p>
              </div>
              <i className="ri-speed-up-line text-3xl text-cyan-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">On-time completion rate</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9ca3af]">Avg. Duration</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {Math.round(summary.performance.averageCompletionTime)}m
                </p>
              </div>
              <i className="ri-time-line text-3xl text-purple-400"></i>
            </div>
            <p className="text-xs text-[#9ca3af]">Average completion time</p>
          </motion.div>
        </div>
      )}

      {/* Operations by Type */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-stack-line mr-2 text-purple-400"></i>
              Putaway Tasks
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Pending</span>
                <span className="text-white font-bold">
                  {summary.putawayTasks.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">In Progress</span>
                <span className="text-blue-400 font-bold">
                  {summary.putawayTasks.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Completed</span>
                <span className="text-green-400 font-bold">
                  {summary.putawayTasks.completed}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-handbag-line mr-2 text-orange-400"></i>
              Picking Tasks
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Pending</span>
                <span className="text-white font-bold">
                  {summary.pickingTasks.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">In Progress</span>
                <span className="text-blue-400 font-bold">
                  {summary.pickingTasks.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Completed</span>
                <span className="text-green-400 font-bold">
                  {summary.pickingTasks.completed}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-file-list-3-line mr-2 text-yellow-400"></i>
              Cycle Counts
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Pending</span>
                <span className="text-white font-bold">
                  {summary.cycleCountTasks.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">In Progress</span>
                <span className="text-blue-400 font-bold">
                  {summary.cycleCountTasks.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3af]">Completed</span>
                <span className="text-green-400 font-bold">
                  {summary.cycleCountTasks.completed}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Live Operations Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <i className="ri-pulse-line mr-2 text-cyan-400"></i>
            Live Operations Feed
          </h3>
          <div className="flex items-center space-x-2">
            {isRealtimeConnected && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Live</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedType("ALL")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedType === "ALL"
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType("PUTAWAY")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedType === "PUTAWAY"
                    ? "bg-purple-500 text-white"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Putaway
              </button>
              <button
                onClick={() => setSelectedType("PICKING")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedType === "PICKING"
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Picking
              </button>
              <button
                onClick={() => setSelectedType("CYCLE_COUNT")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedType === "CYCLE_COUNT"
                    ? "bg-yellow-500 text-white"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Cycle Count
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {filteredOperations.map((operation) => (
              <motion.div
                key={operation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() =>
                  router.push(
                    `/warehouses/${warehouseId}/tasks/${operation.id}`,
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getOperationTypeColor(operation.type)}`}
                      >
                        {operation.type.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(operation.status)}`}
                      >
                        {operation.status.replace("_", " ")}
                      </span>
                      <span
                        className={`text-xs font-medium ${getPriorityColor(operation.priority)}`}
                      >
                        <i className="ri-flag-line mr-1"></i>
                        {operation.priority}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {operation.materialNumber && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[#9ca3af]">Material:</span>
                          <span className="text-white font-medium">
                            {operation.materialNumber}
                          </span>
                        </div>
                      )}
                      {operation.quantity && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[#9ca3af]">Quantity:</span>
                          <span className="text-white font-medium">
                            {operation.quantity}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-[#9ca3af]">Location:</span>
                        <span className="text-white">{operation.location}</span>
                        {operation.targetLocation && (
                          <>
                            <i className="ri-arrow-right-line text-gray-400"></i>
                            <span className="text-white">
                              {operation.targetLocation}
                            </span>
                          </>
                        )}
                      </div>
                      {operation.assignedToName && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[#9ca3af]">Assigned to:</span>
                          <span className="text-white font-medium">
                            {operation.assignedToName}
                          </span>
                        </div>
                      )}
                      {operation.startedAt && (
                        <div className="flex items-center space-x-2 text-xs text-[#9ca3af]">
                          <i className="ri-time-line"></i>
                          <span>
                            Started:{" "}
                            {new Date(operation.startedAt).toLocaleTimeString()}
                          </span>
                          {operation.estimatedDuration && (
                            <>
                              <span>•</span>
                              <span>Est: {operation.estimatedDuration}m</span>
                            </>
                          )}
                          {operation.actualDuration && (
                            <>
                              <span>•</span>
                              <span
                                className={
                                  operation.actualDuration <=
                                  (operation.estimatedDuration || 0)
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                Actual: {operation.actualDuration}m
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {operation.lifecycleStage && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-[#9ca3af]">
                            Lifecycle:
                          </span>
                          <span className="text-xs text-cyan-400 font-medium">
                            {operation.lifecycleStage}
                          </span>
                          {operation.lifecycleProgress !== undefined && (
                            <>
                              <div className="flex-1 bg-white/10 rounded-full h-1.5 max-w-[100px]">
                                <div
                                  className="bg-cyan-400 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${operation.lifecycleProgress}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-[#9ca3af]">
                                {Math.round(operation.lifecycleProgress)}%
                              </span>
                            </>
                          )}
                          {operation.slaStatus && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                operation.slaStatus === "WITHIN_SLA"
                                  ? "bg-green-500/20 text-green-400"
                                  : operation.slaStatus === "AT_RISK"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {operation.slaStatus.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/warehouses/${warehouseId}/tasks/${operation.id}`,
                      );
                    }}
                    className="ml-4 px-3 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors flex items-center space-x-1"
                  >
                    <span>View</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredOperations.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-inbox-line text-6xl text-gray-400 mb-4"></i>
              <p className="text-white text-lg mb-2">No operations found</p>
              <p className="text-[#9ca3af]">
                Operations will appear here as they are created
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
