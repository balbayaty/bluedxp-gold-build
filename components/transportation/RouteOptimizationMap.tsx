/**
 * Route Optimization Map Component
 *
 * Interactive map with route overlays and optimization visualization
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Route,
  Navigation,
  Zap,
  Clock,
  DollarSign,
  Activity,
  Settings,
  Maximize2,
  Minimize2,
  Layers,
  X,
} from "lucide-react";
import type { RouteComparisonResult } from "@/lib/services/transportation";

interface RouteOptimizationMapProps {
  routes: RouteComparisonResult["routes"];
  recommendedRoute?: RouteComparisonResult["recommended"];
  onRouteSelect?: (route: RouteComparisonResult["routes"][0]) => void;
  interactive?: boolean;
}

export default function RouteOptimizationMap({
  routes,
  recommendedRoute,
  onRouteSelect,
  interactive = true,
}: RouteOptimizationMapProps) {
  const [selectedRoute, setSelectedRoute] = useState<
    RouteComparisonResult["routes"][0] | null
  >(recommendedRoute || null);
  const [mapType, setMapType] = useState<"ROADMAP" | "SATELLITE" | "TERRAIN">(
    "ROADMAP",
  );
  const [showMarkers, setShowMarkers] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleRouteClick = (route: RouteComparisonResult["routes"][0]) => {
    setSelectedRoute(route);
    if (onRouteSelect) onRouteSelect(route);
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
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Route Optimization Map</h3>
            <p className="text-sm text-gray-500">
              {routes.length} routes •{" "}
              {selectedRoute ? "Route selected" : "No route selected"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Type */}
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="ROADMAP">Roadmap</option>
            <option value="SATELLITE">Satellite</option>
            <option value="TERRAIN">Terrain</option>
          </select>

          {/* Toggles */}
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              showMarkers
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Markers
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              showLabels
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Layers className="w-4 h-4 inline mr-1" />
            Labels
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
        <div
          ref={mapRef}
          className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        >
          {/* Placeholder for actual map integration (Google Maps, Mapbox, etc.) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                Interactive Map Visualization
              </p>
              <p className="text-sm mt-2">
                Map integration with route overlays, markers, and optimization
                visualization
              </p>
              <p className="text-xs mt-4 text-gray-400">
                In production: Integrate with Google Maps, Mapbox, or Leaflet
              </p>
            </div>
          </div>

          {/* Route Overlays (simplified visualization) */}
          {routes.map((route, idx) => {
            const isRecommended = recommendedRoute?.id === route.id;
            const isSelected = selectedRoute?.id === route.id;

            return (
              <div
                key={route.id}
                className={`absolute top-${20 + idx * 10} left-4 p-3 rounded-lg border-2 cursor-pointer transition ${
                  isRecommended
                    ? "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg"
                    : isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
                style={{ top: `${20 + idx * 80}px` }}
                onClick={() => handleRouteClick(route)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Route
                    className={`w-4 h-4 ${isRecommended ? "text-green-600" : "text-blue-600"}`}
                  />
                  <span className="font-medium text-sm">
                    Route {idx + 1} {isRecommended && "(Recommended)"}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {route.transitTime.toFixed(1)} hours
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />$
                    {route.totalCost.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    {route.distance.toFixed(1)} km
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    {route.reliability}% reliable
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Panel - Route Details */}
        <AnimatePresence>
          {selectedRoute && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold">Route Details</h4>
                  <button
                    onClick={() => setSelectedRoute(null)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Origin</label>
                    <p className="font-medium">
                      {selectedRoute.origin.address.city}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Destination</label>
                    <p className="font-medium">
                      {selectedRoute.destination.address.city}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Distance</label>
                      <p className="font-medium">
                        {selectedRoute.distance.toFixed(1)} km
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Transit Time
                      </label>
                      <p className="font-medium">
                        {selectedRoute.transitTime.toFixed(1)} hrs
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Total Cost
                      </label>
                      <p className="font-medium">
                        ${selectedRoute.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Reliability
                      </label>
                      <p className="font-medium">
                        {selectedRoute.reliability}%
                      </p>
                    </div>
                  </div>

                  {selectedRoute.co2Emissions && (
                    <div>
                      <label className="text-xs text-gray-500">
                        CO2 Emissions
                      </label>
                      <p className="font-medium">
                        {selectedRoute.co2Emissions.toFixed(1)} kg
                      </p>
                    </div>
                  )}

                  {selectedRoute.waypoints &&
                    selectedRoute.waypoints.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">
                          Waypoints
                        </label>
                        <div className="space-y-1">
                          {selectedRoute.waypoints.map((waypoint, idx) => (
                            <div
                              key={idx}
                              className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                              {waypoint.address.city}
                            </div>
                          ))}
                        </div>
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
