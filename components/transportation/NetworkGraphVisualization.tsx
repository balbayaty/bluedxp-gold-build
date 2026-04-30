/**
 * Network Graph Visualization Component
 *
 * Interactive network graph for logistics network modeling
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  MapPin,
  Warehouse,
  Truck,
  Ship,
  Plane,
  Train,
  Zap,
  Settings,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Filter,
  Search,
  X,
} from "lucide-react";
import type {
  NetworkNode,
  NetworkLink,
  NetworkModel,
} from "@/lib/services/transportation";

interface NetworkGraphVisualizationProps {
  model: NetworkModel;
  onNodeClick?: (node: NetworkNode) => void;
  onLinkClick?: (link: NetworkLink) => void;
  interactive?: boolean;
}

export default function NetworkGraphVisualization({
  model,
  onNodeClick,
  onLinkClick,
  interactive = true,
}: NetworkGraphVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter nodes and links with safety check
  const filteredNodes = (model?.nodes || []).filter((node) => {
    if (filterType !== "ALL" && node.type !== filterType) return false;
    if (
      searchQuery &&
      !node.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const filteredLinks = (model?.links || []).filter((link) => {
    return (
      filteredNodes.some((n) => n.id === link.fromNodeId) &&
      filteredNodes.some((n) => n.id === link.toNodeId)
    );
  });

  // Calculate node positions (simplified force-directed layout)
  const nodePositions = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  useEffect(() => {
    if (!model) return;
    // Initialize positions
    filteredNodes.forEach((node, idx) => {
      if (!nodePositions.current.has(node.id)) {
        const angle = (idx / filteredNodes.length) * 2 * Math.PI;
        const radius = 200;
        nodePositions.current.set(node.id, {
          x: Math.cos(angle) * radius + 400,
          y: Math.sin(angle) * radius + 300,
        });
      }
    });
  }, [filteredNodes]);

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
    if (onNodeClick) onNodeClick(node);
  };

  const handleLinkClick = (link: NetworkLink) => {
    setSelectedLink(link);
    setSelectedNode(null);
    if (onLinkClick) onLinkClick(link);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handlePanEnd = () => {
    setIsDragging(false);
  };

  const getNodeIcon = (type: NetworkNode["type"]) => {
    switch (type) {
      case "WAREHOUSE":
      case "DISTRIBUTION_CENTER":
        return Warehouse;
      case "HUB":
        return Network;
      case "PORT":
        return Ship;
      case "AIRPORT":
        return Plane;
      default:
        return MapPin;
    }
  };

  const getNodeColor = (type: NetworkNode["type"]) => {
    switch (type) {
      case "WAREHOUSE":
        return "bg-blue-500";
      case "DISTRIBUTION_CENTER":
        return "bg-green-500";
      case "HUB":
        return "bg-purple-500";
      case "CROSS_DOCK":
        return "bg-orange-500";
      case "PORT":
        return "bg-cyan-500";
      case "AIRPORT":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
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
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {model?.name || "Network Model"}
            </h3>
            <p className="text-sm text-gray-500">
              {filteredNodes.length} nodes • {filteredLinks.length} links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="WAREHOUSE">Warehouses</option>
            <option value="DISTRIBUTION_CENTER">DCs</option>
            <option value="HUB">Hubs</option>
            <option value="PORT">Ports</option>
            <option value="AIRPORT">Airports</option>
          </select>

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

      {/* Graph Canvas */}
      <div className="relative h-[600px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move"
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Links */}
            {filteredLinks.map((link) => {
              const fromNode = filteredNodes.find(
                (n) => n.id === link.fromNodeId,
              );
              const toNode = filteredNodes.find((n) => n.id === link.toNodeId);
              if (!fromNode || !toNode) return null;

              const fromPos = nodePositions.current.get(fromNode.id) || {
                x: 0,
                y: 0,
              };
              const toPos = nodePositions.current.get(toNode.id) || {
                x: 0,
                y: 0,
              };

              return (
                <g key={link.id}>
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={
                      selectedLink?.id === link.id ? "#3b82f6" : "#94a3b8"
                    }
                    strokeWidth={selectedLink?.id === link.id ? 3 : 2}
                    strokeDasharray={link.mode === "RAIL" ? "5,5" : "0"}
                    onClick={() => handleLinkClick(link)}
                    className="cursor-pointer"
                  />
                  {/* Link label */}
                  <text
                    x={(fromPos.x + toPos.x) / 2}
                    y={(fromPos.y + toPos.y) / 2 - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400 pointer-events-none"
                  >
                    {link.distance}km
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions.current.get(node.id) || { x: 0, y: 0 };
              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode?.id === node.id;

              return (
                <g key={node.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 25 : 20}
                    fill={
                      isSelected
                        ? "#3b82f6"
                        : getNodeColor(node.type)
                            .replace("bg-", "#")
                            .replace("-500", "")
                    }
                    stroke={isSelected ? "#1e40af" : "#fff"}
                    strokeWidth={isSelected ? 3 : 2}
                    onClick={() => handleNodeClick(node)}
                    className="cursor-pointer transition-all"
                  />
                  <foreignObject
                    x={pos.x - 60}
                    y={pos.y + 30}
                    width="120"
                    height="40"
                    className="pointer-events-none"
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {node.name}
                      </div>
                      <div className="text-xs text-gray-500">{node.type}</div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Side Panel - Node/Link Details */}
      <AnimatePresence>
        {(selectedNode || selectedLink) && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold">
                  {selectedNode ? "Node Details" : "Link Details"}
                </h4>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setSelectedLink(null);
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedNode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Name</label>
                    <p className="font-medium">{selectedNode.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Type</label>
                    <p className="font-medium">{selectedNode.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Location</label>
                    <p className="font-medium">
                      {selectedNode.location?.address?.city},{" "}
                      {selectedNode.location?.address?.country}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Capacity</label>
                    <p className="font-medium">
                      Storage: {selectedNode.capacity?.storage}m³ • Throughput:{" "}
                      {selectedNode.capacity?.throughput}/day
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Costs</label>
                    <p className="font-medium">
                      Fixed: ${selectedNode.costs?.fixed} • Variable: $
                      {selectedNode.costs?.variable}/unit
                    </p>
                  </div>
                </div>
              )}

              {selectedLink && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Mode</label>
                    <p className="font-medium">{selectedLink.mode}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Distance</label>
                    <p className="font-medium">{selectedLink.distance} km</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Transit Time
                    </label>
                    <p className="font-medium">
                      {selectedLink.transitTime} hours
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Cost</label>
                    <p className="font-medium">${selectedLink.cost}/unit</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Reliability</label>
                    <p className="font-medium">{selectedLink.reliability}%</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
