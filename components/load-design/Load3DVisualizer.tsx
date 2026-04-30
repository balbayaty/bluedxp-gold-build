/**
 * Load 3D Visualizer Component
 *
 * Interactive 3D visualization of load plans
 * Shows item placements, utilization, and optimization
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { LoadPlan, ItemPlacement } from "@/types/load-design";

interface Load3DVisualizerProps {
  loadPlan: LoadPlan;
  showLabels?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
  onItemClick?: (itemId: string) => void;
}

export default function Load3DVisualizer({
  loadPlan,
  showLabels = true,
  showGrid = true,
  interactive = true,
  onItemClick,
}: Load3DVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewAngle, setViewAngle] = useState({ x: 45, y: 45, z: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw 3D visualization
    drawLoadPlan(ctx, canvas.width, canvas.height);
  }, [loadPlan, viewAngle, zoom, selectedItem]);

  const drawLoadPlan = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const { vehicleSpec, itemPlacements } = loadPlan;
    const dims = vehicleSpec.dimensions;

    // Calculate scale
    const scale =
      Math.min(
        (width * 0.8) / dims.length,
        (height * 0.8) / Math.max(dims.width, dims.height),
      ) * zoom;

    // Center point
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw vehicle outline (isometric projection)
    drawVehicleOutline(ctx, centerX, centerY, dims, scale);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, centerX, centerY, dims, scale);
    }

    // Draw items
    itemPlacements.forEach((placement) => {
      const isSelected = selectedItem === placement.itemId;
      drawItem(ctx, centerX, centerY, placement, dims, scale, isSelected);
    });

    // Draw labels if enabled
    if (showLabels) {
      drawLabels(ctx, centerX, centerY, itemPlacements, dims, scale);
    }

    // Draw utilization info
    drawUtilizationInfo(ctx, width, height, loadPlan.utilization);
  };

  const drawVehicleOutline = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    dims: { length: number; width: number; height: number },
    scale: number,
  ) => {
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Draw isometric box
    const l = dims.length * scale;
    const w = dims.width * scale;
    const h = dims.height * scale;

    // Front face
    ctx.beginPath();
    ctx.moveTo(centerX - l / 2, centerY - h / 2);
    ctx.lineTo(centerX - l / 2 + w * 0.5, centerY - h / 2 - w * 0.3);
    ctx.lineTo(centerX + l / 2 + w * 0.5, centerY - h / 2 - w * 0.3);
    ctx.lineTo(centerX + l / 2, centerY - h / 2);
    ctx.closePath();
    ctx.stroke();

    // Back face
    ctx.beginPath();
    ctx.moveTo(centerX - l / 2, centerY + h / 2);
    ctx.lineTo(centerX - l / 2 + w * 0.5, centerY + h / 2 - w * 0.3);
    ctx.lineTo(centerX + l / 2 + w * 0.5, centerY + h / 2 - w * 0.3);
    ctx.lineTo(centerX + l / 2, centerY + h / 2);
    ctx.closePath();
    ctx.stroke();

    // Connect corners
    ctx.beginPath();
    ctx.moveTo(centerX - l / 2, centerY - h / 2);
    ctx.lineTo(centerX - l / 2, centerY + h / 2);
    ctx.moveTo(centerX + l / 2, centerY - h / 2);
    ctx.lineTo(centerX + l / 2, centerY + h / 2);
    ctx.stroke();
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    dims: { length: number; width: number; height: number },
    scale: number,
  ) => {
    ctx.strokeStyle = "#718096";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    const gridSize = 50; // cm
    const l = dims.length * scale;
    const w = dims.width * scale;

    // Draw grid lines
    for (let i = 0; i <= dims.length; i += gridSize) {
      const x = centerX - l / 2 + i * scale;
      ctx.beginPath();
      ctx.moveTo(x, centerY - (dims.height * scale) / 2);
      ctx.lineTo(x, centerY + (dims.height * scale) / 2);
      ctx.stroke();
    }

    for (let i = 0; i <= dims.width; i += gridSize) {
      const y = centerY - (dims.height * scale) / 2 + i * scale;
      ctx.beginPath();
      ctx.moveTo(centerX - l / 2, y);
      ctx.lineTo(centerX + l / 2, y);
      ctx.stroke();
    }
  };

  const drawItem = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    placement: ItemPlacement,
    vehicleDims: { length: number; width: number; height: number },
    scale: number,
    isSelected: boolean,
  ) => {
    const { position, dimensions } = placement;

    // Calculate position in canvas coordinates
    const x = centerX - (vehicleDims.length * scale) / 2 + position.x * scale;
    const y = centerY - (vehicleDims.height * scale) / 2 + position.y * scale;
    const z = position.z * scale;

    const l = dimensions.length * scale;
    const w = dimensions.width * scale;
    const h = dimensions.height * scale;

    // Draw item box (isometric)
    ctx.fillStyle = isSelected ? "#4299e1" : "#48bb78";
    ctx.strokeStyle = isSelected ? "#2b6cb0" : "#2f855a";
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.globalAlpha = isSelected ? 0.9 : 0.7;

    // Draw isometric box
    ctx.beginPath();
    // Front face
    ctx.moveTo(x, y - z);
    ctx.lineTo(x + w * 0.5, y - z - w * 0.3);
    ctx.lineTo(x + l + w * 0.5, y - z - w * 0.3);
    ctx.lineTo(x + l, y - z);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top face
    ctx.beginPath();
    ctx.moveTo(x, y - z);
    ctx.lineTo(x + w * 0.5, y - z - w * 0.3);
    ctx.lineTo(x + w * 0.5, y - z - h - w * 0.3);
    ctx.lineTo(x, y - z - h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    placements: ItemPlacement[],
    vehicleDims: { length: number; width: number; height: number },
    scale: number,
  ) => {
    ctx.fillStyle = "#1a202c";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    placements.forEach((placement) => {
      const x =
        centerX -
        (vehicleDims.length * scale) / 2 +
        placement.position.x * scale;
      const y =
        centerY -
        (vehicleDims.height * scale) / 2 +
        placement.position.y * scale -
        placement.position.z * scale;

      ctx.fillText(
        placement.itemId.substring(0, 8),
        x + (placement.dimensions.length * scale) / 2,
        y - 5,
      );
    });
  };

  const drawUtilizationInfo = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    utilization: LoadPlan["utilization"],
  ) => {
    const infoX = width - 200;
    const infoY = 20;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(infoX - 10, infoY - 10, 190, 100);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Utilization", infoX, infoY);

    ctx.font = "11px sans-serif";
    ctx.fillText(
      `Weight: ${utilization.weightPercent.toFixed(1)}%`,
      infoX,
      infoY + 20,
    );
    ctx.fillText(
      `Volume: ${utilization.volumePercent.toFixed(1)}%`,
      infoX,
      infoY + 40,
    );
    ctx.fillText(
      `Space: ${utilization.spaceEfficiency.toFixed(1)}%`,
      infoX,
      infoY + 60,
    );
  };

  const handleItemClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onItemClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked item (simplified - would need proper hit testing)
    // For now, just toggle selection
    setSelectedItem(
      selectedItem ? null : loadPlan.itemPlacements[0]?.itemId || null,
    );
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-gray-300 rounded-lg"
        onClick={handleItemClick}
        style={{ cursor: interactive ? "pointer" : "default" }}
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-2 shadow-lg">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-700">
            Zoom: {zoom.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* View Angle Controls */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-2 shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={() => setViewAngle({ x: 0, y: 0, z: 0 })}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Front
          </button>
          <button
            onClick={() => setViewAngle({ x: 45, y: 45, z: 0 })}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Isometric
          </button>
          <button
            onClick={() => setViewAngle({ x: 90, y: 0, z: 0 })}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Top
          </button>
        </div>
      </div>
    </div>
  );
}
