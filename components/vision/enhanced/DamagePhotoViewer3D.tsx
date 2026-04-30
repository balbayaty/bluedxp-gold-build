/**
 * 3D Damage Photo Viewer
 * Mind-blowing interactive 3D visualization of damage photos
 * Non-breaking: New component, doesn't affect existing code
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DamagePhoto } from "@/types/asn";

interface DamagePhotoViewer3DProps {
  photos: DamagePhoto[];
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
  onPhotoChange?: (index: number) => void;
  showAnnotations?: boolean;
  showHeatmap?: boolean;
}

export default function DamagePhotoViewer3D({
  photos,
  damageAnalysis,
  onPhotoChange,
  showAnnotations = true,
  showHeatmap = true,
}: DamagePhotoViewer3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentPhoto = photos[currentIndex];

  // Handle photo navigation
  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    setCurrentIndex(newIndex);
    onPhotoChange?.(newIndex);
    resetView();
  };

  const handleNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onPhotoChange?.(newIndex);
    resetView();
  };

  const resetView = () => {
    setZoom(1);
    setRotation({ x: 0, y: 0 });
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "rgba(220, 38, 38, 0.6)"; // red
      case "major":
        return "rgba(239, 68, 68, 0.5)"; // orange-red
      case "moderate":
        return "rgba(245, 158, 11, 0.4)"; // yellow
      case "minor":
        return "rgba(34, 197, 94, 0.3)"; // green
      default:
        return "rgba(156, 163, 175, 0.3)"; // gray
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden">
      {/* Main Viewer */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
            style={{
              perspective: "1000px",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Photo Container with 3D Effect */}
            <motion.div
              className="relative w-full h-full"
              style={{
                transform: `
                  scale(${zoom})
                  rotateX(${rotation.x}deg)
                  rotateY(${rotation.y}deg)
                `,
                transformStyle: "preserve-3d",
              }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            >
              {/* Photo */}
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={currentPhoto.photoUrl}
                  alt={currentPhoto.caption || "Damage photo"}
                  className="w-full h-full object-contain"
                  draggable={false}
                />

                {/* Heatmap Overlay */}
                {showHeatmap && damageAnalysis?.qualityIssues && (
                  <div className="absolute inset-0 pointer-events-none">
                    {damageAnalysis.qualityIssues.map((issue, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="absolute rounded-lg border-2 border-white/50"
                        style={{
                          left: `${issue.location?.x || 0}%`,
                          top: `${issue.location?.y || 0}%`,
                          width: `${issue.location?.width || 20}%`,
                          height: `${issue.location?.height || 20}%`,
                          backgroundColor: getSeverityColor(issue.severity),
                          boxShadow: `0 0 20px ${getSeverityColor(issue.severity)}`,
                        }}
                      >
                        <div className="absolute -top-8 left-0 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          {issue.type} ({issue.severity})
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Annotations */}
                {showAnnotations && damageAnalysis?.detectedObjects && (
                  <div className="absolute inset-0 pointer-events-none">
                    {damageAnalysis.detectedObjects.map((obj, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="absolute"
                        style={{
                          left: `${obj.boundingBox?.x || 0}%`,
                          top: `${obj.boundingBox?.y || 0}%`,
                          width: `${obj.boundingBox?.width || 10}%`,
                          height: `${obj.boundingBox?.height || 10}%`,
                        }}
                      >
                        <div className="absolute inset-0 border-2 border-cyan-400 rounded">
                          <div className="absolute -top-6 left-0 bg-cyan-500/90 text-white px-2 py-1 rounded text-xs">
                            {obj.object} ({Math.round(obj.confidence)}%)
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevious}
            className="ml-4 p-3 bg-black/60 backdrop-blur-sm text-white rounded-full pointer-events-auto hover:bg-black/80 transition-colors"
          >
            <i className="ri-arrow-left-line text-2xl"></i>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="mr-4 p-3 bg-black/60 backdrop-blur-sm text-white rounded-full pointer-events-auto hover:bg-black/80 transition-colors"
          >
            <i className="ri-arrow-right-line text-2xl"></i>
          </motion.button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full pointer-events-auto">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 text-white hover:text-cyan-400 transition-colors"
          >
            <i className="ri-zoom-out-line"></i>
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="p-2 text-white hover:text-cyan-400 transition-colors"
          >
            <i className="ri-zoom-in-line"></i>
          </button>
          <button
            onClick={resetView}
            className="p-2 text-white hover:text-cyan-400 transition-colors"
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>

        {/* Photo Counter */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {photos.map((photo, idx) => (
            <motion.button
              key={photo.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setCurrentIndex(idx);
                onPhotoChange?.(idx);
                resetView();
              }}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-cyan-400 shadow-lg shadow-cyan-400/50"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={photo.thumbnailUrl || photo.photoUrl}
                alt={photo.caption || `Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Analysis Summary */}
      {damageAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 max-w-sm"
        >
          <h3 className="text-white font-semibold mb-2">AI Analysis</h3>
          <div className="space-y-2">
            {damageAnalysis.qualityIssues?.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getSeverityColor(issue.severity) }}
                ></div>
                <span className="text-white/80">
                  {issue.type} - {issue.severity} (
                  {Math.round(issue.confidence)}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
