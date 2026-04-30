"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  WarehouseZone,
  Equipment,
  InventoryItem,
} from "@/types/warehouse-management";

interface WarehouseLayoutVisualizerProps {
  warehouse: Warehouse;
  viewMode?: "2d" | "3d" | "heatmap";
  onZoneClick?: (zone: WarehouseZone) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
  onInventoryClick?: (item: InventoryItem) => void;
  interactive?: boolean;
}

export default function WarehouseLayoutVisualizer({
  warehouse,
  viewMode = "2d",
  onZoneClick,
  onEquipmentClick,
  onInventoryClick,
  interactive = true,
}: WarehouseLayoutVisualizerProps) {
  const [currentViewMode, setCurrentViewMode] = useState<
    "2d" | "3d" | "heatmap"
  >(viewMode);
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate mock zones if not provided
  const zones: WarehouseZone[] =
    warehouse.zones.length > 0
      ? warehouse.zones
      : [
          {
            id: "zone-a",
            name: "Zone A - Main Storage",
            type: "storage",
            area: 5000,
            capacity: 10000,
            utilization: 85,
            temperature: warehouse.environmental.temperature,
            humidity: warehouse.environmental.humidity,
            hazardLevel: "low",
            restrictions: [],
            equipment: [],
            inventory: [],
          },
          {
            id: "zone-b",
            name: "Zone B - Loading Dock",
            type: "loading",
            area: 2000,
            capacity: 5000,
            utilization: 60,
            temperature: warehouse.environmental.temperature + 2,
            humidity: warehouse.environmental.humidity - 5,
            hazardLevel: "none",
            restrictions: [],
            equipment: [],
            inventory: [],
          },
          {
            id: "zone-c",
            name: "Zone C - Quality Control",
            type: "quality_control",
            area: 1000,
            capacity: 2000,
            utilization: 40,
            temperature: warehouse.environmental.temperature,
            humidity: warehouse.environmental.humidity,
            hazardLevel: "medium",
            restrictions: ["No food items"],
            equipment: [],
            inventory: [],
          },
        ];

  const getZoneColor = (zone: WarehouseZone) => {
    const utilization = zone.utilization;
    if (utilization > 90) return "bg-red-500/30 border-red-500/50";
    if (utilization > 75) return "bg-yellow-500/30 border-yellow-500/50";
    if (utilization > 50) return "bg-green-500/30 border-green-500/50";
    return "bg-blue-500/30 border-blue-500/50";
  };

  const getHazardColor = (level: string) => {
    switch (level) {
      case "critical":
        return "border-red-600";
      case "high":
        return "border-orange-500";
      case "medium":
        return "border-yellow-500";
      case "low":
        return "border-green-500";
      default:
        return "border-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentViewMode("2d")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentViewMode === "2d"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-layout-grid-line mr-2"></i>
            2D Layout
          </button>
          <button
            onClick={() => setCurrentViewMode("3d")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentViewMode === "3d"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-3d-line mr-2"></i>
            3D View
          </button>
          <button
            onClick={() => setCurrentViewMode("heatmap")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentViewMode === "heatmap"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-fire-line mr-2"></i>
            Heat Map
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <i className={`ri-${showLabels ? "eye" : "eye-off"}-line`}></i>
          </button>
        </div>
      </div>

      {/* 2D Layout View */}
      {currentViewMode === "2d" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10 overflow-hidden"
          style={{ minHeight: "600px" }}
        >
          <div className="grid grid-cols-3 gap-4 h-full">
            {zones.map((zone, index) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setSelectedZone(zone);
                  onZoneClick?.(zone);
                }}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${getZoneColor(zone)} ${getHazardColor(zone.hazardLevel)}`}
              >
                {showLabels && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="px-2 py-1 bg-black/60 rounded text-xs font-medium text-white">
                      {zone.name}
                    </div>
                  </div>
                )}
                <div className="mt-8 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Utilization</span>
                    <span className="text-white font-bold">
                      {zone.utilization}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        zone.utilization > 90
                          ? "bg-red-400"
                          : zone.utilization > 75
                            ? "bg-yellow-400"
                            : zone.utilization > 50
                              ? "bg-green-400"
                              : "bg-blue-400"
                      }`}
                      style={{ width: `${zone.utilization}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                    <div>
                      <span className="text-white/50">Area</span>
                      <p className="text-white font-medium">{zone.area} m²</p>
                    </div>
                    <div>
                      <span className="text-white/50">Capacity</span>
                      <p className="text-white font-medium">{zone.capacity}</p>
                    </div>
                  </div>
                  {zone.temperature && (
                    <div className="flex items-center space-x-2 text-xs mt-2">
                      <i className="ri-temp-cold-line text-blue-400"></i>
                      <span className="text-white/70">
                        {zone.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Zone Details Panel */}
          <AnimatePresence>
            {selectedZone && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-0 right-0 h-full w-96 bg-black/90 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {selectedZone.name}
                  </h3>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Type</p>
                    <p className="text-white font-medium capitalize">
                      {selectedZone.type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Utilization</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div
                          className="bg-cyan-400 h-2 rounded-full"
                          style={{ width: `${selectedZone.utilization}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">
                        {selectedZone.utilization}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Area</p>
                      <p className="text-white font-medium">
                        {selectedZone.area} m²
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Capacity</p>
                      <p className="text-white font-medium">
                        {selectedZone.capacity}
                      </p>
                    </div>
                  </div>
                  {selectedZone.hazardLevel !== "none" && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Hazard Level</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedZone.hazardLevel === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : selectedZone.hazardLevel === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : selectedZone.hazardLevel === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {selectedZone.hazardLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {selectedZone.restrictions.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Restrictions</p>
                      <div className="space-y-1">
                        {selectedZone.restrictions.map((restriction, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-white/70 flex items-center space-x-2"
                          >
                            <i className="ri-alert-line text-yellow-400"></i>
                            <span>{restriction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      (window.location.href = `/warehouses/${warehouse.id}/zones/${selectedZone.id}`)
                    }
                    className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>View Full Details</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 3D View */}
      {currentViewMode === "3d" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10 overflow-hidden"
          style={{ minHeight: "600px" }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <i className="ri-3d-line text-6xl text-cyan-400 mb-4"></i>
              <p className="text-white text-lg mb-2">
                3D Warehouse Visualization
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Interactive 3D view with equipment tracking and real-time
                updates
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                {zones.map((zone) => (
                  <motion.div
                    key={zone.id}
                    whileHover={{ scale: 1.05 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                    onClick={() => onZoneClick?.(zone)}
                  >
                    <div className="text-2xl font-bold text-white mb-2">
                      {zone.utilization}%
                    </div>
                    <div className="text-sm text-gray-400">{zone.name}</div>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-6">
                Full 3D visualization with WebGL rendering coming soon
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Heat Map View */}
      {currentViewMode === "heatmap" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10 overflow-hidden"
          style={{ minHeight: "600px" }}
        >
          <div className="grid grid-cols-3 gap-4 h-full">
            {zones.map((zone) => {
              const intensity = zone.utilization / 100;
              const heatColor =
                intensity > 0.9
                  ? "from-red-500"
                  : intensity > 0.75
                    ? "from-orange-500"
                    : intensity > 0.5
                      ? "from-yellow-500"
                      : "from-green-500";

              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`relative p-6 rounded-lg bg-gradient-to-br ${heatColor} to-transparent border-2 border-white/20`}
                  style={{
                    background: `radial-gradient(circle, rgba(${
                      intensity > 0.9
                        ? "239,68,68"
                        : intensity > 0.75
                          ? "249,115,22"
                          : intensity > 0.5
                            ? "234,179,8"
                            : "34,197,94"
                    },${intensity * 0.5}), transparent)`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
                  <div className="relative z-10">
                    <h4 className="text-white font-bold mb-2">{zone.name}</h4>
                    <div className="text-3xl font-bold text-white mb-1">
                      {zone.utilization}%
                    </div>
                    <div className="text-sm text-white/70">Utilization</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
