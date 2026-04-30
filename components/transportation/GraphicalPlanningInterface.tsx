/**
 * Graphical Planning Interface
 *
 * Drag-and-drop load planning and visual route optimization
 * Modern, professional, sexy UI
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Truck,
  Package,
  Route,
  Zap,
  CheckCircle,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type {
  LoadItem,
  Vehicle,
  LoadPlan,
} from "@/lib/services/transportation";

interface GraphicalPlanningInterfaceProps {
  items: LoadItem[];
  vehicle: Vehicle;
  onPlanCreated?: (plan: LoadPlan) => void;
  onItemMoved?: (itemId: string, position: any) => void;
}

export default function GraphicalPlanningInterface({
  items,
  vehicle,
  onPlanCreated,
  onItemMoved,
}: GraphicalPlanningInterfaceProps) {
  const [selectedItem, setSelectedItem] = useState<LoadItem | null>(null);
  const [placedItems, setPlacedItems] = useState<Map<string, any>>(new Map());
  const [is3DView, setIs3DView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<
    "MANUAL" | "AUTO" | "HYBRID"
  >("HYBRID");

  const handleItemDrag = useCallback(
    (item: LoadItem, position: { x: number; y: number; z: number }) => {
      setPlacedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(item.id, { ...item, position });
        return newMap;
      });

      if (onItemMoved) {
        onItemMoved(item.id, position);
      }
    },
    [onItemMoved],
  );

  const handleAutoOptimize = async () => {
    try {
      const response = await fetch("/api/transportation/load-building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build-load",
          request: {
            items,
            vehicle,
            objectives: ["MAXIMIZE_UTILIZATION", "MAXIMIZE_STABILITY"],
            createdBy: "user",
          },
        }),
      });

      const result = await response.json();
      if (result.loadPlan) {
        // Apply optimized positions
        const newPlacedItems = new Map();
        for (const position of result.loadPlan.positions) {
          const item = items.find((i) => i.id === position.itemId);
          if (item) {
            newPlacedItems.set(item.id, {
              ...item,
              position: position.position,
            });
          }
        }
        setPlacedItems(newPlacedItems);

        if (onPlanCreated) {
          onPlanCreated(result.loadPlan);
        }
      }
    } catch (error) {
      console.error("Error optimizing load:", error);
    }
  };

  const unplacedItems = items.filter((item) => !placedItems.has(item.id));

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
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Graphical Load Planning</h3>
            <p className="text-sm text-gray-500">
              {placedItems.size} / {items.length} items placed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOptimizationMode("AUTO")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              optimizationMode === "AUTO"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Auto
          </button>
          <button
            onClick={() => setOptimizationMode("MANUAL")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              optimizationMode === "MANUAL"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setIs3DView(!is3DView)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {is3DView ? "2D" : "3D"}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
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
        {/* Left Panel - Items */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Items ({unplacedItems.length})
          </h4>

          <div className="space-y-2">
            {unplacedItems.map((item) => (
              <motion.div
                key={item.id}
                drag
                dragConstraints={false}
                onDragEnd={(e, info) => {
                  // Calculate position in vehicle space
                  const position = {
                    x: info.point.x,
                    y: info.point.y,
                    z: 0,
                  };
                  handleItemDrag(item, position);
                }}
                className={`p-3 rounded-lg border-2 border-dashed cursor-move ${
                  selectedItem?.id === item.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {item.description}
                  </span>
                  {item.temperatureZone && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {item.temperatureZone}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Weight: {item.weight}kg</div>
                  <div>Volume: {item.volume}m³</div>
                  <div>
                    Size: {item.dimensions.length}×{item.dimensions.width}×
                    {item.dimensions.height}cm
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {optimizationMode === "AUTO" && (
            <button
              onClick={handleAutoOptimize}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium"
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Auto Optimize
            </button>
          )}
        </div>

        {/* Center - Vehicle Visualization */}
        <div className="flex-1 p-6 relative overflow-hidden">
          <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            {/* Vehicle Container */}
            <div
              className="absolute inset-4 border-2 border-blue-500 rounded-lg bg-white/50 dark:bg-gray-800/50"
              style={{
                width: `${(vehicle.capacity.length / vehicle.capacity.length) * 100}%`,
                height: `${(vehicle.capacity.width / vehicle.capacity.width) * 100}%`,
              }}
            >
              {/* Temperature Zones */}
              {vehicle.temperatureZones?.map((zone) => (
                <div
                  key={zone.id}
                  className="absolute border border-blue-300 bg-blue-100/30 dark:bg-blue-900/30"
                  style={{
                    left: `${(zone.location.x / vehicle.capacity.length) * 100}%`,
                    top: `${(zone.location.y / vehicle.capacity.width) * 100}%`,
                    width: `${(zone.location.length / vehicle.capacity.length) * 100}%`,
                    height: `${(zone.location.width / vehicle.capacity.width) * 100}%`,
                  }}
                >
                  <div className="text-xs p-1 text-blue-700 dark:text-blue-300 font-medium">
                    {zone.name}
                  </div>
                </div>
              ))}

              {/* Placed Items */}
              <AnimatePresence>
                {Array.from(placedItems.values()).map((item: any) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute border-2 border-green-500 bg-green-100/50 dark:bg-green-900/50 rounded cursor-move"
                    style={{
                      left: `${(item.position.x / vehicle.capacity.length) * 100}%`,
                      top: `${(item.position.y / vehicle.capacity.width) * 100}%`,
                      width: `${(item.position.length / vehicle.capacity.length) * 100}%`,
                      height: `${(item.position.width / vehicle.capacity.width) * 100}%`,
                    }}
                    drag
                    dragConstraints={false}
                    onDragEnd={(e, info) => {
                      const newPosition = {
                        x: item.position.x + info.delta.x,
                        y: item.position.y + info.delta.y,
                        z: item.position.z,
                      };
                      handleItemDrag(item, newPosition);
                    }}
                  >
                    <div className="p-1 text-xs font-medium text-green-700 dark:text-green-300">
                      {item.description}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Vehicle Info Overlay */}
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xs space-y-1">
                <div className="font-semibold">Vehicle Capacity</div>
                <div>Length: {vehicle.capacity.length}cm</div>
                <div>Width: {vehicle.capacity.width}cm</div>
                <div>Height: {vehicle.capacity.height}cm</div>
                <div>Weight: {vehicle.capacity.weight}kg</div>
                <div>Volume: {vehicle.capacity.volume}m³</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Details & Metrics */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          {selectedItem ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Item Details</h4>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Description</label>
                  <p className="font-medium">{selectedItem.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Weight</label>
                    <p className="font-medium">{selectedItem.weight}kg</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Volume</label>
                    <p className="font-medium">{selectedItem.volume}m³</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Dimensions</label>
                  <p className="font-medium">
                    {selectedItem.dimensions.length} ×{" "}
                    {selectedItem.dimensions.width} ×{" "}
                    {selectedItem.dimensions.height} cm
                  </p>
                </div>
                {selectedItem.temperatureZone && (
                  <div>
                    <label className="text-xs text-gray-500">
                      Temperature Zone
                    </label>
                    <p className="font-medium">
                      {selectedItem.temperatureZone}
                    </p>
                  </div>
                )}
                {selectedItem.hazmat && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-500 inline mr-2" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      Hazmat
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-4">Load Metrics</h4>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">
                    Weight Utilization
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(
                      (Array.from(placedItems.values()).reduce(
                        (sum: number, item: any) =>
                          sum + item.weight * item.quantity,
                        0,
                      ) /
                        vehicle.capacity.weight) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">
                    Volume Utilization
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(
                      (Array.from(placedItems.values()).reduce(
                        (sum: number, item: any) =>
                          sum + item.volume * item.quantity,
                        0,
                      ) /
                        vehicle.capacity.volume) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Items Placed</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {placedItems.size} / {items.length}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">Tips</div>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Drag items from left panel to vehicle</li>
                  <li>• Click items to view details</li>
                  <li>• Use Auto Optimize for best results</li>
                  <li>• Temperature zones are highlighted</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
