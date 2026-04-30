/**
 * AR Damage Visualizer Component
 * Augmented Reality overlay for damage visualization
 * Mind-blowing AR integration for damage assessment
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ARDamageVisualizerProps {
  imageUrl: string;
  damageAnalysis?: {
    qualityIssues?: Array<{
      type: string;
      severity: string;
      location?: { x: number; y: number; width: number; height: number };
      confidence: number;
    }>;
    detectedObjects?: Array<{
      object: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>;
  };
  onARInteraction?: (action: string, data: any) => void;
}

export default function ARDamageVisualizer({
  imageUrl,
  damageAnalysis,
  onARInteraction,
}: ARDamageVisualizerProps) {
  const [arMode, setArMode] = useState<"overlay" | "3d" | "annotations">(
    "overlay",
  );
  const [selectedDamage, setSelectedDamage] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (canvasRef.current && imageRef.current && damageAnalysis) {
      drawAROverlay();
    }
  }, [damageAnalysis, arMode, selectedDamage]);

  const drawAROverlay = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw damage overlays
    if (damageAnalysis?.qualityIssues) {
      damageAnalysis.qualityIssues.forEach((issue, idx) => {
        if (issue.location) {
          const { x, y, width, height } = issue.location;

          // Color based on severity
          let color = "#3b82f6"; // blue
          if (issue.severity === "critical")
            color = "#ef4444"; // red
          else if (issue.severity === "high")
            color = "#f59e0b"; // orange
          else if (issue.severity === "medium") color = "#eab308"; // yellow

          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, width, height);

          // Draw semi-transparent fill
          ctx.fillStyle = color + "20";
          ctx.fillRect(x, y, width, height);

          // Draw label
          ctx.fillStyle = color;
          ctx.font = "bold 14px Arial";
          ctx.fillText(`${issue.type} (${issue.confidence}%)`, x, y - 5);

          // Highlight selected
          if (selectedDamage === idx) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
          }
        }
      });
    }

    // Draw object detection overlays
    if (damageAnalysis?.detectedObjects && arMode === "annotations") {
      damageAnalysis.detectedObjects.forEach((obj) => {
        if (obj.boundingBox) {
          const { x, y, width, height } = obj.boundingBox;

          ctx.strokeStyle = "#10b981"; // green
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = "#10b981";
          ctx.font = "12px Arial";
          ctx.fillText(`${obj.object} (${obj.confidence}%)`, x, y - 5);
        }
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* AR Mode Selector */}
      <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow">
        <button
          onClick={() => setArMode("overlay")}
          className={`px-4 py-2 rounded-lg transition-all ${
            arMode === "overlay"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <i className="ri-eye-line mr-2"></i>
          Overlay
        </button>
        <button
          onClick={() => setArMode("annotations")}
          className={`px-4 py-2 rounded-lg transition-all ${
            arMode === "annotations"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <i className="ri-file-list-3-line mr-2"></i>
          Annotations
        </button>
        <button
          onClick={() => setArMode("3d")}
          className={`px-4 py-2 rounded-lg transition-all ${
            arMode === "3d"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <i className="ri-3d-line mr-2"></i>
          3D View
        </button>
      </div>

      {/* AR Visualization */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Damage photo"
          className="w-full h-auto"
          onLoad={drawAROverlay}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Damage List */}
      {damageAnalysis?.qualityIssues &&
        damageAnalysis.qualityIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h4 className="font-semibold mb-3">Detected Damage</h4>
            <div className="space-y-2">
              {damageAnalysis.qualityIssues.map((issue, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    setSelectedDamage(idx);
                    onARInteraction?.("select", { issue, index: idx });
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedDamage === idx
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(issue.severity)}`}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {issue.type}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {issue.severity} severity
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {issue.confidence}%
                      </p>
                      <p className="text-xs text-gray-500">Confidence</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      {/* AR Info */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-augmented-reality-line text-purple-600 text-xl"></i>
          <h4 className="font-semibold text-gray-900">AR Mode Active</h4>
        </div>
        <p className="text-sm text-gray-600">
          Click on damage items in the list to highlight them in the AR overlay.
          Use the mode selector to switch between overlay, annotations, and 3D
          views.
        </p>
      </div>
    </div>
  );
}
