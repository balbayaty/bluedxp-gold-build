/**
 * Load Design with Map Integration
 *
 * Combines load design with interactive map visualization
 */

"use client";

import { useState } from "react";
import Load3DVisualizer from "./Load3DVisualizer";
import MapView from "../maps/MapView";
import type { LoadPlan } from "@/types/load-design";

interface LoadDesignWithMapProps {
  loadPlan: LoadPlan;
  showMap?: boolean;
  show3D?: boolean;
}

export default function LoadDesignWithMap({
  loadPlan,
  showMap = true,
  show3D = true,
}: LoadDesignWithMapProps) {
  const [viewMode, setViewMode] = useState<"both" | "map" | "3d">("both");

  const mapCenter = loadPlan.route?.origin.coordinates ||
    loadPlan.items[0]?.destination.coordinates || {
      lat: 24.7136,
      lng: 46.6753,
    }; // Default to Riyadh

  const mapMarkers = [
    ...(loadPlan.route?.origin.coordinates
      ? [
          {
            id: "origin",
            location: {
              address: loadPlan.route.origin.address,
              city: loadPlan.route.origin.city,
              country: loadPlan.route.origin.country,
              coordinates: loadPlan.route.origin.coordinates,
            },
            label: "O",
            color: "#10b981",
          },
        ]
      : []),
    ...(loadPlan.route?.destination.coordinates
      ? [
          {
            id: "destination",
            location: {
              address: loadPlan.route.destination.address,
              city: loadPlan.route.destination.city,
              country: loadPlan.route.destination.country,
              coordinates: loadPlan.route.destination.coordinates,
            },
            label: "D",
            color: "#ef4444",
          },
        ]
      : []),
    ...(loadPlan.route?.waypoints?.map((wp, index) => ({
      id: `waypoint-${index}`,
      location: {
        address: wp.address,
        city: wp.city,
        country: "",
        coordinates: wp.coordinates,
      },
      label: `${index + 1}`,
      color: "#3b82f6",
    })) || []),
  ];

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
        {(["both", "map", "3d"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {mode === "both" ? "Both" : mode === "map" ? "Map" : "3D"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map View */}
        {(viewMode === "both" || viewMode === "map") && showMap && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Route Map</h3>
            <MapView
              center={mapCenter}
              zoom={10}
              markers={mapMarkers}
              route={
                loadPlan.route
                  ? {
                      distance: loadPlan.route.totalDistance || 0,
                      duration: loadPlan.route.estimatedTime || 0,
                      optimized: loadPlan.route.optimized,
                      polyline: undefined, // Would come from route optimization
                    }
                  : undefined
              }
              height="500px"
              interactive={true}
              showControls={true}
            />
          </div>
        )}

        {/* 3D Visualization */}
        {(viewMode === "both" || viewMode === "3d") && show3D && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">
              3D Load Visualization
            </h3>
            <div className="h-[500px]">
              <Load3DVisualizer
                loadPlan={loadPlan}
                showLabels={true}
                showGrid={true}
                interactive={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
