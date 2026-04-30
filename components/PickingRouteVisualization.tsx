"use client";

import { motion } from "framer-motion";
import { PickLocation, RouteOptimization } from "@/types/picking";
import Tooltip from "./Tooltip";

interface PickingRouteVisualizationProps {
  route: PickLocation[];
  optimization?: RouteOptimization;
  startLocation?: PickLocation;
  currentLocation?: PickLocation;
  showMetrics?: boolean;
}

export default function PickingRouteVisualization({
  route,
  optimization,
  startLocation,
  currentLocation,
  showMetrics = true,
}: PickingRouteVisualizationProps) {
  if (route.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="text-center py-8">
          <i className="ri-route-line text-4xl text-[#9ca3af] mb-3"></i>
          <p className="text-[#9ca3af]">No route data available</p>
        </div>
      </div>
    );
  }

  const totalDistance =
    optimization?.totalDistance ||
    route.reduce((sum, loc, idx) => {
      if (idx === 0) return sum + loc.distanceFromStart;
      const prev = route[idx - 1];
      const dx = loc.coordinates.x - prev.coordinates.x;
      const dy = loc.coordinates.y - prev.coordinates.y;
      const dz = loc.coordinates.z - prev.coordinates.z;
      return sum + Math.sqrt(dx * dx + dy * dy + dz * dz);
    }, 0);

  const totalTime =
    optimization?.totalTime ||
    route.reduce((sum, loc) => sum + loc.estimatedTravelTime, 0);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Optimized Route
          </h3>
          <p className="text-sm text-[#9ca3af]">
            {optimization?.algorithm || "HYBRID"} algorithm • {route.length}{" "}
            stops
          </p>
        </div>
        {optimization && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 font-medium">
              {optimization.efficiency.toFixed(1)}% efficient
            </span>
            {optimization.confidence && (
              <span className="text-xs text-cyan-400">
                {Math.round(optimization.confidence * 100)}% confidence
              </span>
            )}
          </div>
        )}
      </div>

      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-[#9ca3af] mb-1">Total Distance</div>
            <div className="text-lg font-semibold text-white">
              {(totalDistance / 1000).toFixed(2)} km
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-[#9ca3af] mb-1">Estimated Time</div>
            <div className="text-lg font-semibold text-white">
              {Math.round(totalTime / 60)} min
            </div>
          </div>
          {optimization && (
            <>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Energy Savings
                </div>
                <div className="text-lg font-semibold text-green-400">
                  {optimization.energySavings.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-[#9ca3af] mb-1">CO₂ Reduction</div>
                <div className="text-lg font-semibold text-cyan-400">
                  {optimization.carbonReduction.toFixed(2)} kg
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Route Path Visualization */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {startLocation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <i className="ri-play-fill text-white text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">
                Start Location
              </div>
              <div className="text-xs text-[#9ca3af] font-mono">
                {startLocation.locationCode}
              </div>
            </div>
            <div className="text-xs text-green-400 font-medium">START</div>
          </motion.div>
        )}

        {route.map((location, index) => {
          const isCurrent = currentLocation?.id === location.id;
          const isCompleted =
            currentLocation &&
            route.findIndex((l) => l.id === currentLocation.id) > index;

          return (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                ${
                  isCurrent
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                    : isCompleted
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-white/5 border-white/10 hover:border-cyan-500/30"
                }
              `}
            >
              {/* Route Number */}
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm
                ${
                  isCurrent
                    ? "bg-cyan-500 text-white"
                    : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-cyan-400"
                }
              `}
              >
                {isCompleted ? (
                  <i className="ri-check-line text-sm"></i>
                ) : (
                  index + 1
                )}
              </div>

              {/* Location Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white font-mono">
                    {location.locationCode}
                  </span>
                  {location.requiresEquipment && (
                    <Tooltip
                      content={`Requires: ${location.equipmentType || "Equipment"}`}
                      position="top"
                    >
                      <i className="ri-tools-line text-orange-400 text-xs"></i>
                    </Tooltip>
                  )}
                  {location.accessibility === "DIFFICULT" && (
                    <Tooltip content="Difficult access location" position="top">
                      <i className="ri-alert-line text-yellow-400 text-xs"></i>
                    </Tooltip>
                  )}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  Zone {location.zone} • Aisle {location.aisle} • Rack{" "}
                  {location.rack}
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  {location.estimatedTravelTime.toFixed(0)}s travel time
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex flex-col items-end gap-1">
                {isCurrent && (
                  <span className="text-xs text-cyan-400 font-medium animate-pulse">
                    CURRENT
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs text-green-400 font-medium">
                    COMPLETED
                  </span>
                )}
                {!isCurrent && !isCompleted && (
                  <span className="text-xs text-[#9ca3af]">PENDING</span>
                )}
              </div>

              {/* Route Connector */}
              {index < route.length - 1 && (
                <div className="absolute left-6 top-full w-0.5 h-4 bg-cyan-500/30"></div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Route Summary */}
      {optimization && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-lightbulb-line text-cyan-400"></i>
            <span className="text-sm font-medium text-white">
              Optimization Benefits
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-[#9ca3af]">
              Energy Savings:{" "}
              <span className="text-green-400 font-medium">
                {optimization.energySavings.toFixed(1)}%
              </span>
            </div>
            <div className="text-[#9ca3af]">
              CO₂ Reduction:{" "}
              <span className="text-cyan-400 font-medium">
                {optimization.carbonReduction.toFixed(2)} kg
              </span>
            </div>
            <div className="text-[#9ca3af]">
              Efficiency:{" "}
              <span className="text-yellow-400 font-medium">
                {optimization.efficiency.toFixed(1)}%
              </span>
            </div>
            <div className="text-[#9ca3af]">
              Algorithm:{" "}
              <span className="text-white font-medium">
                {optimization.algorithm}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
