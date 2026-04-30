/**
 * Outbound Timeline Visualization
 * Interactive timeline for outbound shipments with milestones
 *
 * FEATURES:
 * - Visual timeline of outbound process
 * - Milestone tracking (pick, pack, stage, ship)
 * - Real-time status updates
 * - Delay detection and alerts
 * - Interactive shipment details
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TimelineEvent {
  id: string;
  shipmentId: string;
  milestone:
    | "ORDER_RECEIVED"
    | "PICKING"
    | "PACKING"
    | "QC"
    | "STAGING"
    | "LOADED"
    | "SHIPPED";
  timestamp: Date;
  expectedTime?: Date;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "DELAYED";
  duration?: number;
  assignedTo?: string;
  notes?: string;
}

interface OutboundShipment {
  id: string;
  shipmentNumber: string;
  customer: string;
  orderDate: Date;
  expectedShipDate: Date;
  actualShipDate?: Date;
  status: string;
  events: TimelineEvent[];
  isDelayed: boolean;
  delayMinutes?: number;
}

interface OutboundTimelineVisualizationProps {
  warehouseId: string;
  shipmentId?: string;
  timeRange?: "1h" | "4h" | "24h" | "all";
}

export default function OutboundTimelineVisualization({
  warehouseId,
  shipmentId,
  timeRange = "24h",
}: OutboundTimelineVisualizationProps) {
  const [shipments, setShipments] = useState<OutboundShipment[]>([]);
  const [selectedShipment, setSelectedShipment] =
    useState<OutboundShipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipmentData();
  }, [warehouseId, shipmentId, timeRange]);

  const loadShipmentData = async () => {
    setLoading(true);
    try {
      // In production, fetch from outbound service
      // For now, generate sample timeline data
      const mockShipments: OutboundShipment[] = Array.from(
        { length: 5 },
        (_, i) => {
          const now = new Date();
          const orderDate = new Date(now.getTime() - (i + 1) * 3600000); // Hours ago
          const expectedShipDate = new Date(orderDate.getTime() + 4 * 3600000); // 4 hours later

          const events: TimelineEvent[] = [
            {
              id: `evt-1-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "ORDER_RECEIVED",
              timestamp: orderDate,
              status: "COMPLETED",
              duration: 300, // 5 minutes
            },
            {
              id: `evt-2-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "PICKING",
              timestamp: new Date(orderDate.getTime() + 600000), // +10 min
              expectedTime: new Date(orderDate.getTime() + 900000), // Expected 15 min
              status: i < 3 ? "COMPLETED" : i === 3 ? "IN_PROGRESS" : "PENDING",
              duration: 1200, // 20 minutes
              assignedTo: `Worker-${i + 1}`,
            },
            {
              id: `evt-3-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "PACKING",
              timestamp: new Date(orderDate.getTime() + 1800000), // +30 min
              expectedTime: new Date(orderDate.getTime() + 2100000), // Expected 35 min
              status: i < 2 ? "COMPLETED" : i === 2 ? "IN_PROGRESS" : "PENDING",
              duration: 900, // 15 minutes
              assignedTo: `Packer-${i + 1}`,
            },
            {
              id: `evt-4-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "QC",
              timestamp: new Date(orderDate.getTime() + 2700000), // +45 min
              status: i < 2 ? "COMPLETED" : "PENDING",
              duration: 600, // 10 minutes
            },
            {
              id: `evt-5-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "STAGING",
              timestamp: new Date(orderDate.getTime() + 3300000), // +55 min
              status: i === 0 ? "COMPLETED" : "PENDING",
              duration: 300,
            },
            {
              id: `evt-6-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "LOADED",
              timestamp: new Date(orderDate.getTime() + 3600000), // +1 hour
              status: i === 0 ? "COMPLETED" : "PENDING",
              duration: 600,
            },
            {
              id: `evt-7-${i}`,
              shipmentId: `SHP-${1000 + i}`,
              milestone: "SHIPPED",
              timestamp: expectedShipDate,
              status: i === 0 ? "COMPLETED" : "PENDING",
            },
          ];

          const completedEvents = events.filter(
            (e) => e.status === "COMPLETED",
          );
          const lastEvent = completedEvents[completedEvents.length - 1];
          const isDelayed =
            lastEvent && lastEvent.expectedTime
              ? lastEvent.timestamp > lastEvent.expectedTime
              : false;
          const delayMinutes =
            isDelayed && lastEvent && lastEvent.expectedTime
              ? Math.floor(
                  (lastEvent.timestamp.getTime() -
                    lastEvent.expectedTime.getTime()) /
                    60000,
                )
              : undefined;

          return {
            id: `SHP-${1000 + i}`,
            shipmentNumber: `SHP-${1000 + i}`,
            customer: `Customer ${String.fromCharCode(65 + i)}`,
            orderDate,
            expectedShipDate,
            actualShipDate: i === 0 ? expectedShipDate : undefined,
            status: i === 0 ? "SHIPPED" : i < 3 ? "IN_PROGRESS" : "PENDING",
            events,
            isDelayed,
            delayMinutes,
          };
        },
      );

      setShipments(mockShipments);
      if (mockShipments.length > 0 && !selectedShipment) {
        setSelectedShipment(mockShipments[0]);
      }
    } catch (error) {
      console.error("Error loading shipment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (milestone: TimelineEvent["milestone"]) => {
    const icons = {
      ORDER_RECEIVED: "ri-inbox-line",
      PICKING: "ri-hand-heart-line",
      PACKING: "ri-box-3-line",
      QC: "ri-shield-check-line",
      STAGING: "ri-stack-line",
      LOADED: "ri-truck-line",
      SHIPPED: "ri-send-plane-line",
    };
    return icons[milestone] || "ri-checkbox-circle-line";
  };

  const getStatusColor = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500 border-green-600";
      case "IN_PROGRESS":
        return "bg-blue-500 border-blue-600 animate-pulse";
      case "DELAYED":
        return "bg-red-500 border-red-600";
      case "PENDING":
        return "bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Outbound Timeline
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedShipment?.id || ""}
            onChange={(e) => {
              const shipment = shipments.find((s) => s.id === e.target.value);
              setSelectedShipment(shipment || null);
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shipmentNumber} - {s.customer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedShipment && (
        <>
          {/* Shipment Header */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {selectedShipment.shipmentNumber}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedShipment.customer}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedShipment.isDelayed
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : selectedShipment.status === "SHIPPED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {selectedShipment.status}
                  {selectedShipment.isDelayed &&
                    ` (+${selectedShipment.delayMinutes}min)`}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Timeline Events */}
            <div className="space-y-6">
              {selectedShipment.events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Milestone Dot */}
                  <div
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 ${getStatusColor(event.status)}`}
                  >
                    <i
                      className={`${getMilestoneIcon(event.milestone)} text-xl text-white`}
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {event.milestone.replace(/_/g, " ")}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {event.duration && (
                        <p>
                          Duration: {Math.floor(event.duration / 60)} minutes
                        </p>
                      )}
                      {event.assignedTo && (
                        <p>Assigned to: {event.assignedTo}</p>
                      )}
                      {event.expectedTime && event.status === "COMPLETED" && (
                        <p
                          className={
                            event.timestamp > event.expectedTime
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }
                        >
                          {event.timestamp > event.expectedTime
                            ? "⚠️ Delayed"
                            : "✅ On Time"}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-xs italic">{event.notes}</p>
                      )}
                    </div>

                    {event.status === "IN_PROGRESS" && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          <span>In Progress...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {
                  selectedShipment.events.filter(
                    (e) => e.status === "COMPLETED",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Completed
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {
                  selectedShipment.events.filter(
                    (e) => e.status === "IN_PROGRESS",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                In Progress
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {
                  selectedShipment.events.filter((e) => e.status === "PENDING")
                    .length
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Pending
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {Math.round(
                  (selectedShipment.events.filter(
                    (e) => e.status === "COMPLETED",
                  ).length /
                    selectedShipment.events.length) *
                    100,
                )}
                %
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Progress
              </p>
            </div>
          </div>
        </>
      )}

      {shipments.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <i className="ri-inbox-line text-4xl mb-2 opacity-50" />
          <p>No outbound shipments in selected time range</p>
        </div>
      )}
    </div>
  );
}
