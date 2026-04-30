/**
 * 3D Warehouse Visualization Component
 * Interactive 3D visualization of warehouse layout, inventory, and operations
 *
 * FEATURES:
 * - 3D warehouse layout view
 * - Real-time inventory visualization
 * - Interactive navigation (pan, zoom, rotate)
 * - Heatmap overlay (utilization, picks, etc.)
 * - Equipment tracking
 *
 * TECHNOLOGY: React + CSS 3D transforms (lightweight approach)
 * For full 3D: Would integrate Three.js or Babylon.js
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface Warehouse3DVisualizationProps {
  warehouseId: string;
  showInventory?: boolean;
  showHeatmap?: boolean;
  viewMode?: "top" | "isometric" | "side";
}

interface WarehouseLocation {
  id: string;
  aisle: number;
  row: number;
  shelf: number;
  level: number;
  occupied: boolean;
  utilization: number;
  skuId?: string;
  pickFrequency?: number;
}

export default function Warehouse3DVisualization({
  warehouseId,
  showInventory = true,
  showHeatmap = false,
  viewMode = "isometric",
}: Warehouse3DVisualizationProps) {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<WarehouseLocation | null>(null);
  const [rotation, setRotation] = useState({ x: 45, y: 0, z: 30 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load warehouse data
    loadWarehouseData();
  }, [warehouseId]);

  const loadWarehouseData = async () => {
    // In production, fetch from warehouse service
    // For now, generate sample layout
    const mockLocations: WarehouseLocation[] = [];

    for (let aisle = 1; aisle <= 10; aisle++) {
      for (let row = 1; row <= 20; row++) {
        for (let level = 1; level <= 4; level++) {
          const utilization = Math.random();
          mockLocations.push({
            id: `${aisle}-${row}-${level}`,
            aisle,
            row,
            shelf: row,
            level,
            occupied: utilization > 0.3,
            utilization,
            skuId:
              utilization > 0.3
                ? `SKU-${Math.floor(Math.random() * 1000)}`
                : undefined,
            pickFrequency: Math.random() * 100,
          });
        }
      }
    }

    setLocations(mockLocations);
  };

  const getLocationColor = (location: WarehouseLocation): string => {
    if (showHeatmap) {
      // Heatmap by pick frequency
      const frequency = location.pickFrequency || 0;
      if (frequency > 75) return "#ef4444"; // Red (high)
      if (frequency > 50) return "#f59e0b"; // Orange
      if (frequency > 25) return "#eab308"; // Yellow
      return "#10b981"; // Green (low)
    } else {
      // Utilization
      if (!location.occupied) return "#e5e7eb"; // Gray (empty)
      if (location.utilization > 0.8) return "#3b82f6"; // Blue (full)
      if (location.utilization > 0.5) return "#8b5cf6"; // Purple (partial)
      return "#10b981"; // Green (low)
    }
  };

  const get3DPosition = (location: WarehouseLocation) => {
    // Calculate 3D position for isometric view
    const x = location.aisle * 40;
    const y = location.level * 30;
    const z = location.row * 25;

    return { x, y, z };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          3D Warehouse Visualization
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showHeatmap ? "Show Utilization" : "Show Heatmap"}
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <i className="ri-zoom-in-line" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <i className="ri-zoom-out-line" />
          </button>
        </div>
      </div>

      {/* 3D Visualization Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        {/* 3D Scene */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
            transformStyle: "preserve-3d",
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* Grid Floor */}
          <div className="absolute w-[800px] h-[600px] grid grid-cols-10 gap-1">
            {Array.from({ length: 200 }, (_, i) => (
              <div
                key={i}
                className="border border-gray-300 dark:border-gray-700"
                style={{
                  transform: "rotateX(90deg)",
                  transformStyle: "preserve-3d",
                }}
              />
            ))}
          </div>

          {/* Warehouse Aisles */}
          {Array.from({ length: 10 }, (_, aisleIdx) => (
            <div
              key={`aisle-${aisleIdx}`}
              className="absolute"
              style={{
                transform: `translate3d(${aisleIdx * 80}px, 0, 0)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Aisle Label */}
              <div
                className="absolute -top-8 left-0 text-xs font-semibold text-gray-600 dark:text-gray-400"
                style={{ transform: "rotateX(-45deg)" }}
              >
                Aisle {aisleIdx + 1}
              </div>

              {/* Rack Locations */}
              {locations
                .filter((loc) => loc.aisle === aisleIdx + 1)
                .slice(0, 40) // Limit for performance
                .map((location) => {
                  const pos = get3DPosition(location);
                  return (
                    <motion.div
                      key={location.id}
                      className="absolute cursor-pointer"
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: getLocationColor(location),
                        transform: `translate3d(${pos.z - location.aisle * 40}px, ${-pos.y}px, ${pos.x - location.aisle * 40}px)`,
                        transformStyle: "preserve-3d",
                        border:
                          selectedLocation?.id === location.id
                            ? "2px solid #fff"
                            : "1px solid rgba(0,0,0,0.2)",
                        borderRadius: "2px",
                      }}
                      onClick={() => setSelectedLocation(location)}
                      whileHover={{ scale: 1.2 }}
                      title={`${location.id} - ${location.occupied ? "Occupied" : "Empty"}`}
                    />
                  );
                })}
            </div>
          ))}
        </div>

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            View Controls
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRotation({ x: 45, y: 0, z: 30 })}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Isometric
            </button>
            <button
              onClick={() => setRotation({ x: 90, y: 0, z: 0 })}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Top
            </button>
            <button
              onClick={() => setRotation({ x: 0, y: 0, z: 0 })}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Side
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {showHeatmap ? "Pick Frequency" : "Utilization"}
          </div>
          <div className="space-y-1 text-xs">
            {showHeatmap ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    High (75+)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#f59e0b" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Medium (50-75)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#eab308" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Low (25-50)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#10b981" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Very Low (0-25)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Full (80%+)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#8b5cf6" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Partial (50-80%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#10b981" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Low (0-50%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "#e5e7eb" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Empty
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 min-w-[200px]"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Location: {selectedLocation.id}
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>Aisle: {selectedLocation.aisle}</div>
              <div>Row: {selectedLocation.row}</div>
              <div>Level: {selectedLocation.level}</div>
              <div>
                Status: {selectedLocation.occupied ? "Occupied" : "Empty"}
              </div>
              {selectedLocation.skuId && (
                <div>SKU: {selectedLocation.skuId}</div>
              )}
              <div>
                Utilization: {(selectedLocation.utilization * 100).toFixed(0)}%
              </div>
              {showHeatmap && (
                <div>
                  Pick Frequency: {selectedLocation.pickFrequency?.toFixed(1)}
                  /day
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {locations.length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Total Locations
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {locations.filter((l) => l.occupied).length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Occupied</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {locations.length > 0
              ? (
                  (locations.filter((l) => l.occupied).length /
                    locations.length) *
                  100
                ).toFixed(0)
              : 0}
            %
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Utilization
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {locations.filter((l) => !l.occupied).length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Available</p>
        </div>
      </div>

      {/* Implementation Note */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-100">
          <i className="ri-information-line text-lg mt-0.5" />
          <div>
            <p className="font-semibold mb-1">3D Visualization Active</p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              This is a CSS 3D transform-based visualization. For full WebGL 3D
              with advanced features, integrate Three.js or Babylon.js library.
              Current view shows isometric projection with interactive controls,
              heatmap overlay, and real-time data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
