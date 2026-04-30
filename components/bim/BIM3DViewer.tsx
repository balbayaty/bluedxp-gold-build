/**
 * BIM 3D Viewer Component
 *
 * Interactive 3D visualization of BIM models
 * Supports IFC, RVT, NWD, and other BIM formats
 * Features: element selection, layer management, measurements, annotations
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { BIMModel } from "@/types/facility";

interface BIM3DViewerProps {
  model: BIMModel;
  showControls?: boolean;
  showLayers?: boolean;
  showMeasurements?: boolean;
  onElementSelect?: (elementId: string) => void;
  onViewChange?: (viewState: any) => void;
  height?: string;
}

export default function BIM3DViewer({
  model,
  showControls = true,
  showLayers = true,
  showMeasurements = true,
  onElementSelect,
  onViewChange,
  height = "600px",
}: BIM3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"perspective" | "orthographic">(
    "perspective",
  );
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(["architectural", "structural", "mep"]),
  );
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurements, setMeasurements] = useState<
    Array<{ id: string; start: any; end: any; distance: number }>
  >([]);

  useEffect(() => {
    // Initialize 3D viewer
    // In production, integrate with Xeokit, Three.js, or similar library
    initializeViewer();
  }, [model]);

  const initializeViewer = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate model loading
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production, load actual 3D model using library like:
      // - Xeokit (for IFC files)
      // - Three.js (for GLTF/OBJ)
      // - Autodesk Forge Viewer (for RVT/NWD)

      // For now, show placeholder with model info
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load model");
      setLoading(false);
    }
  };

  const handleLayerToggle = (layer: string) => {
    const newVisible = new Set(visibleLayers);
    if (newVisible.has(layer)) {
      newVisible.delete(layer);
    } else {
      newVisible.add(layer);
    }
    setVisibleLayers(newVisible);
  };

  const handleMeasurement = () => {
    setMeasurementMode(!measurementMode);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden border border-white/10">
      {/* Viewer Container */}
      <div ref={containerRef} className="relative" style={{ height }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="text-gray-400 text-sm">Loading 3D model...</p>
            <p className="text-gray-500 text-xs">{model.name}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
            <i className="ri-error-warning-line text-4xl text-red-400"></i>
            <p className="text-red-400 font-medium">Error loading model</p>
            <p className="text-gray-400 text-sm text-center">{error}</p>
            <button
              onClick={initializeViewer}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* 3D Canvas Placeholder */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              }}
            />

            {/* Model Info Overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-cube-3d-line text-cyan-400"></i>
                <h3 className="text-white font-medium text-sm">{model.name}</h3>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Format:</span>
                  <span className="text-white uppercase">
                    {model.fileFormat}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Size:</span>
                  <span className="text-white">
                    {formatFileSize(model.fileSize)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Version:</span>
                  <span className="text-white">v{model.version}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            {showControls && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() =>
                    setViewMode(
                      viewMode === "perspective"
                        ? "orthographic"
                        : "perspective",
                    )
                  }
                  className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 text-white transition-colors"
                  title={
                    viewMode === "perspective"
                      ? "Switch to Orthographic"
                      : "Switch to Perspective"
                  }
                >
                  <i
                    className={`ri-${viewMode === "perspective" ? "3d-line" : "grid-line"}`}
                  ></i>
                </button>
                {showMeasurements && (
                  <button
                    onClick={handleMeasurement}
                    className={`p-2 rounded-lg border transition-colors ${
                      measurementMode
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-black/60 backdrop-blur-sm border-white/10 text-white hover:bg-black/80"
                    }`}
                    title="Toggle Measurement Tool"
                  >
                    <i className="ri-ruler-line"></i>
                  </button>
                )}
                <button
                  className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 text-white transition-colors"
                  title="Reset View"
                >
                  <i className="ri-refresh-line"></i>
                </button>
                <button
                  className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 text-white transition-colors"
                  title="Fullscreen"
                >
                  <i className="ri-fullscreen-line"></i>
                </button>
              </div>
            )}

            {/* Layer Panel */}
            {showLayers && (
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-white/10 min-w-[200px]"
              >
                <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                  <i className="ri-layers-line text-cyan-400"></i>
                  Layers
                </h4>
                <div className="space-y-2">
                  {[
                    "architectural",
                    "structural",
                    "mep",
                    "fire-safety",
                    "site",
                  ].map((layer) => (
                    <label
                      key={layer}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={visibleLayers.has(layer)}
                        onChange={() => handleLayerToggle(layer)}
                        className="rounded text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white capitalize transition-colors">
                        {layer.replace("-", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Measurement Info */}
            {measurementMode && measurements.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-300 space-y-1">
                  {measurements.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <i className="ri-ruler-line text-cyan-400"></i>
                      <span>{m.distance.toFixed(2)} m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-xs text-gray-400">
                <i className="ri-mouse-line mr-1"></i>
                Click to select • Drag to rotate • Scroll to zoom
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
