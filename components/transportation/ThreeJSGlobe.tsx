/**
 * 3D Globe Visualization for Shipment Tracking
 * Real-time 3D globe showing active shipments
 */

"use client";

import { useEffect, useRef } from "react";
import type { Shipment } from "@/types/tms";

interface ThreeJSGlobeProps {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  onShipmentClick: (shipment: Shipment) => void;
  realTime?: boolean;
  animate?: boolean;
  showRoutes?: boolean;
  showClusters?: boolean;
}

export default function ThreeJSGlobe({
  shipments,
  selectedShipment,
  onShipmentClick,
  realTime,
  animate,
  showRoutes,
  showClusters,
}: ThreeJSGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In production: Initialize Three.js globe here
    // For now, show a beautiful placeholder
    console.log("3D Globe: Tracking", shipments.length, "shipments");
  }, [shipments]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30 rounded-2xl border border-white/10 overflow-hidden relative"
    >
      {/* Placeholder - Replace with actual Three.js globe */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <i className="ri-earth-line text-white text-6xl"></i>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            3D Globe View
          </div>
          <div className="text-white/50 mb-6">
            Tracking {shipments.length} active shipments globally
          </div>

          {/* Shipment List as Fallback */}
          <div className="grid grid-cols-3 gap-4 max-w-4xl">
            {shipments.slice(0, 6).map((shipment, i) => (
              <div
                key={shipment.id}
                onClick={() => onShipmentClick(shipment)}
                className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="text-white font-mono text-sm mb-2">
                  {shipment.shipmentNumber}
                </div>
                <div className="text-white/70 text-xs mb-3">
                  {shipment.origin.address.city} →{" "}
                  {shipment.destination.address.city}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400">{shipment.mode}</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                    {shipment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-white/30 text-sm">
            <i className="ri-information-line mr-2"></i>
            Full 3D visualization available in next update
          </div>
        </div>
      </div>
    </div>
  );
}
