/**
 * Digital Twin 3D Visualization Component
 *
 * 3D visualization of digital twins (vehicles, fleet, etc.)
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Settings,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type {
  DigitalTwin,
  DigitalTwinHealth,
} from "@/lib/services/transportation";

interface DigitalTwin3DVisualizationProps {
  twin: DigitalTwin;
  onComponentClick?: (componentName: string) => void;
  interactive?: boolean;
}

export default function DigitalTwin3DVisualization({
  twin,
  onComponentClick,
  interactive = true,
}: DigitalTwin3DVisualizationProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"3D" | "HEALTH" | "PREDICTIONS">(
    "3D",
  );
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleRotate = (deltaX: number, deltaY: number) => {
    if (interactive) {
      setRotation((prev) => ({
        x: prev.x + deltaY * 0.5,
        y: prev.y + deltaX * 0.5,
      }));
    }
  };

  const handleZoom = (delta: number) => {
    if (interactive) {
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    }
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
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{twin.name}</h3>
            <p className="text-sm text-gray-500">
              {twin.entityType} • {twin.entityId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: "3D", label: "3D", icon: Box },
              { id: "HEALTH", label: "Health", icon: Activity },
              { id: "PREDICTIONS", label: "Predictions", icon: AlertTriangle },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  viewMode === mode.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <mode.icon className="w-4 h-4 inline mr-1" />
                {mode.label}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

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

      {/* 3D Canvas */}
      <div className="flex h-[600px]">
        <div
          ref={canvasRef}
          className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden"
          onMouseMove={(e) => {
            if (e.buttons === 1) {
              handleRotate(e.movementX, e.movementY);
            }
          }}
          onWheel={(e) => {
            e.preventDefault();
            handleZoom(-e.deltaY * 0.001);
          }}
        >
          {/* Placeholder for 3D visualization (Three.js, React Three Fiber, etc.) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Box className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                3D Digital Twin Visualization
              </p>
              <p className="text-sm mt-2">
                Interactive 3D model with rotation, zoom, and component
                highlighting
              </p>
              <p className="text-xs mt-4 text-gray-400">
                In production: Integrate with Three.js or React Three Fiber
              </p>
            </div>
          </div>

          {/* Component Health Overlay */}
          {viewMode === "HEALTH" && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
              <h4 className="font-bold mb-3">Component Health</h4>
              <div className="space-y-2">
                {twin.health.components.map((component, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded cursor-pointer transition ${
                      selectedComponent === component.name
                        ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-500"
                        : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => {
                      setSelectedComponent(component.name);
                      if (onComponentClick) onComponentClick(component.name);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {component.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          component.status === "HEALTHY"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : component.status === "WARNING"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : component.status === "CRITICAL"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {component.status}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${component.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions Overlay */}
          {viewMode === "PREDICTIONS" && twin.predictions.length > 0 && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
              <h4 className="font-bold mb-3">Predictions</h4>
              <div className="space-y-2">
                {twin.predictions.map((prediction, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      prediction.impact === "CRITICAL"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : prediction.impact === "HIGH"
                          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {prediction.event}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Probability: {prediction.probability}% • Confidence:{" "}
                      {prediction.confidence}%
                    </div>
                    {prediction.estimatedDate && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Est. Date:{" "}
                        {prediction.estimatedDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel - Details */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-6">
            <h4 className="text-lg font-bold mb-4">Twin Details</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Entity Type</label>
                <p className="font-medium">{twin.entityType}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Health Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      twin.health.overall === "HEALTHY"
                        ? "bg-green-500"
                        : twin.health.overall === "DEGRADED"
                          ? "bg-yellow-500"
                          : twin.health.overall === "CRITICAL"
                            ? "bg-orange-500"
                            : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium">{twin.health.overall}</span>
                  <span className="text-sm text-gray-500">
                    ({twin.health.score}/100)
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Components</label>
                <p className="font-medium">{twin.health.components.length}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Predictions</label>
                <p className="font-medium">{twin.predictions.length}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Last Sync</label>
                <p className="font-medium">
                  {new Date(twin.lastSync).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
