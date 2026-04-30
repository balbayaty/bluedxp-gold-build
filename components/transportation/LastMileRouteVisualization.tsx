/**
 * Last-Mile Route Visualization Component
 *
 * Map visualization for last-mile delivery routes
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Package,
  Clock,
  Navigation,
  CheckCircle,
  AlertCircle,
  Send,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import type {
  DeliveryRoute,
  DeliveryStop,
} from "@/lib/services/transportation";

interface LastMileRouteVisualizationProps {
  route: DeliveryRoute;
  onStopClick?: (stop: DeliveryStop) => void;
  onStatusUpdate?: (stopId: string, status: DeliveryStop["status"]) => void;
  interactive?: boolean;
}

export default function LastMileRouteVisualization({
  route,
  onStopClick,
  onStatusUpdate,
  interactive = true,
}: LastMileRouteVisualizationProps) {
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTimeWindows, setShowTimeWindows] = useState(true);

  const handleStopClick = (stop: DeliveryStop) => {
    setSelectedStop(stop);
    if (onStopClick) onStopClick(stop);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
        isFullscreen ? "fixed inset-4 z-50" : "relative"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Last-Mile Route</h3>
            <p className="text-sm text-gray-500">
              {route.stops.length} stops • {route.totalDistance.toFixed(1)} km •{" "}
              {(route.totalTime / 60).toFixed(1)} hrs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimeWindows(!showTimeWindows)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              showTimeWindows
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Time Windows
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* Map Canvas */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {/* Placeholder for actual map integration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Last-Mile Route Map</p>
              <p className="text-sm mt-2">
                Interactive map with stops, route path, and time windows
              </p>
            </div>
          </div>

          {/* Stop Markers (simplified visualization) */}
          <div className="absolute inset-0 p-4">
            {route.stops.map((stop, idx) => {
              const isSelected = selectedStop?.id === stop.id;
              const isCompleted = stop.status === "DELIVERED";
              const isInTransit = stop.status === "IN_TRANSIT";

              return (
                <div
                  key={stop.id}
                  className={`absolute cursor-pointer transition transform hover:scale-110 ${
                    isSelected ? "z-10" : "z-0"
                  }`}
                  style={{
                    left: `${20 + idx * 12}%`,
                    top: `${30 + (idx % 3) * 20}%`,
                  }}
                  onClick={() => handleStopClick(stop)}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-white shadow-lg ${
                      isCompleted
                        ? "bg-green-500 border-green-600"
                        : isInTransit
                          ? "bg-blue-500 border-blue-600"
                          : isSelected
                            ? "bg-purple-500 border-purple-600"
                            : "bg-gray-500 border-gray-600"
                    }`}
                  >
                    {stop.sequence}
                  </div>
                  {showTimeWindows && (
                    <div className="mt-2 text-xs text-center bg-white dark:bg-gray-800 rounded px-2 py-1 shadow border border-gray-200 dark:border-gray-700">
                      {stop.timeWindow.earliest.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {stop.timeWindow.latest.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel - Stop Details */}
        <AnimatePresence>
          {selectedStop && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold">
                    Stop {selectedStop.sequence}
                  </h4>
                  <button
                    onClick={() => setSelectedStop(null)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="font-medium">
                      {selectedStop.location.address.street},{" "}
                      {selectedStop.location.address.city}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Time Window</label>
                    <p className="font-medium">
                      {selectedStop.timeWindow.earliest.toLocaleTimeString()} -{" "}
                      {selectedStop.timeWindow.latest.toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">
                      Service Time
                    </label>
                    <p className="font-medium">
                      {selectedStop.serviceTime} minutes
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        selectedStop.status === "DELIVERED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : selectedStop.status === "IN_TRANSIT"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {selectedStop.status}
                    </span>
                  </div>

                  {selectedStop.requirements && (
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">
                        Requirements
                      </label>
                      <div className="space-y-1">
                        {selectedStop.requirements.signatureRequired && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Signature Required
                          </div>
                        )}
                        {selectedStop.requirements.proofOfDelivery && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Proof of Delivery
                          </div>
                        )}
                        {selectedStop.requirements.specialInstructions && (
                          <div className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            {selectedStop.requirements.specialInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedStop.estimatedArrival && (
                    <div>
                      <label className="text-xs text-gray-500">
                        Estimated Arrival
                      </label>
                      <p className="font-medium">
                        {selectedStop.estimatedArrival.toLocaleTimeString()}
                      </p>
                    </div>
                  )}

                  {onStatusUpdate && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          if (selectedStop.status === "PENDING") {
                            onStatusUpdate(selectedStop.id, "IN_TRANSIT");
                          } else if (selectedStop.status === "IN_TRANSIT") {
                            onStatusUpdate(selectedStop.id, "DELIVERED");
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                      >
                        {selectedStop.status === "PENDING"
                          ? "Start Delivery"
                          : selectedStop.status === "IN_TRANSIT"
                            ? "Mark Delivered"
                            : "Update Status"}
                      </button>
                      <button
                        onClick={() => {
                          // Send customer notification
                        }}
                        className="w-full mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Notify Customer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
