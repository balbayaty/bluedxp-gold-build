/**
 * Interactive Facility Map Component
 * 2D/3D visualization with drag-and-drop container placement
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Facility,
  Floor,
  Zone,
  ContainerPlacement,
} from "@/lib/services/facility/facilityMappingService";

interface FacilityMapProps {
  facility: Facility;
  floor: Floor;
  onContainerClick?: (container: ContainerPlacement) => void;
  onZoneClick?: (zone: Zone) => void;
  onContainerPlace?: (
    containerId: string,
    coordinates: { x: number; y: number },
  ) => void;
  viewMode?: "2d" | "3d";
  interactive?: boolean;
}

export default function FacilityMap({
  facility,
  floor,
  onContainerClick,
  onZoneClick,
  onContainerPlace,
  viewMode = "2d",
  interactive = true,
}: FacilityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedContainer, setSelectedContainer] =
    useState<ContainerPlacement | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      drawMap();
    }
  }, [floor, zoom, pan, selectedContainer, selectedZone]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw floor background
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, floor.width, floor.height);

    // Draw zones
    floor.zones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      ctx.fillStyle = isSelected ? zone.color + "80" : zone.color + "40";
      ctx.strokeStyle = isSelected ? zone.color : zone.color + "60";
      ctx.lineWidth = isSelected ? 3 : 1;

      ctx.fillRect(
        zone.coordinates.x,
        zone.coordinates.y,
        zone.coordinates.width,
        zone.coordinates.height,
      );
      ctx.strokeRect(
        zone.coordinates.x,
        zone.coordinates.y,
        zone.coordinates.width,
        zone.coordinates.height,
      );

      // Zone label
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.fillText(zone.name, zone.coordinates.x + 5, zone.coordinates.y + 15);
    });

    // Draw containers
    floor.containers.forEach((container) => {
      const isSelected =
        selectedContainer?.containerId === container.containerId;
      ctx.fillStyle = isSelected ? "#3b82f6" : "#10b981";
      ctx.strokeStyle = isSelected ? "#60a5fa" : "#34d399";
      ctx.lineWidth = isSelected ? 2 : 1;

      const size = 20;
      ctx.fillRect(
        container.coordinates.x - size / 2,
        container.coordinates.y - size / 2,
        size,
        size,
      );
      ctx.strokeRect(
        container.coordinates.x - size / 2,
        container.coordinates.y - size / 2,
        size,
        size,
      );

      // Container label
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.fillText(
        container.containerNumber.substring(0, 6),
        container.coordinates.x - 15,
        container.coordinates.y - 5,
      );
    });

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicking on container
    const clickedContainer = floor.containers.find((container) => {
      const size = 20;
      return (
        x >= container.coordinates.x - size / 2 &&
        x <= container.coordinates.x + size / 2 &&
        y >= container.coordinates.y - size / 2 &&
        y <= container.coordinates.y + size / 2
      );
    });

    if (clickedContainer) {
      setSelectedContainer(clickedContainer);
      if (onContainerClick) {
        onContainerClick(clickedContainer);
      }
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Check if clicking on zone
    const clickedZone = floor.zones.find(
      (zone) =>
        x >= zone.coordinates.x &&
        x <= zone.coordinates.x + zone.coordinates.width &&
        y >= zone.coordinates.y &&
        y <= zone.coordinates.y + zone.coordinates.height,
    );

    if (clickedZone) {
      setSelectedZone(clickedZone);
      if (onZoneClick) {
        onZoneClick(clickedZone);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDragging || !selectedContainer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Update container position
    if (onContainerPlace) {
      onContainerPlace(selectedContainer.containerId, { x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)));
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
        >
          <i className="ri-zoom-in-line"></i>
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.5, prev * 0.8))}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
        >
          <i className="ri-zoom-out-line"></i>
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
        >
          <i className="ri-home-line"></i>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          {floor.zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-gray-300">{zone.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Container Info */}
      {selectedContainer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-gray-800/90 rounded-lg p-4 border border-gray-700 max-w-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-white">Container</h4>
            <button
              onClick={() => setSelectedContainer(null)}
              className="text-gray-400 hover:text-white"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="space-y-1 text-sm text-gray-300">
            <p>
              <strong>Number:</strong> {selectedContainer.containerNumber}
            </p>
            <p>
              <strong>Chemical:</strong> {selectedContainer.chemicalName}
            </p>
            <p>
              <strong>Status:</strong> {selectedContainer.status}
            </p>
            <p>
              <strong>Placed:</strong>{" "}
              {new Date(selectedContainer.placedAt).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
