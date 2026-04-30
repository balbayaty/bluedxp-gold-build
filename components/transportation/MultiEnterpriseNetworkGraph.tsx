/**
 * Multi-Enterprise Network Graph Component
 *
 * Collaborative network visualization for multi-enterprise networks
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Users,
  Handshake,
  MessageSquare,
  TrendingUp,
  Settings,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import type {
  TradingPartner,
  CollaborativePlan,
  NetworkCollaboration,
} from "@/lib/services/transportation";

interface MultiEnterpriseNetworkGraphProps {
  partners: TradingPartner[];
  plans?: CollaborativePlan[];
  collaborations?: NetworkCollaboration[];
  onPartnerClick?: (partner: TradingPartner) => void;
  onPlanClick?: (plan: CollaborativePlan) => void;
  interactive?: boolean;
}

export default function MultiEnterpriseNetworkGraph({
  partners,
  plans = [],
  collaborations = [],
  onPartnerClick,
  onPlanClick,
  interactive = true,
}: MultiEnterpriseNetworkGraphProps) {
  const [selectedPartner, setSelectedPartner] = useState<TradingPartner | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<CollaborativePlan | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter partners
  const filteredPartners = partners.filter((partner) => {
    if (filterType !== "ALL" && partner.type !== filterType) return false;
    if (
      searchQuery &&
      !partner.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Calculate positions (circular layout)
  const partnerPositions = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  useEffect(() => {
    filteredPartners.forEach((partner, idx) => {
      if (!partnerPositions.current.has(partner.id)) {
        const angle = (idx / filteredPartners.length) * 2 * Math.PI;
        const radius = 200;
        partnerPositions.current.set(partner.id, {
          x: Math.cos(angle) * radius + 400,
          y: Math.sin(angle) * radius + 300,
        });
      }
    });
  }, [filteredPartners]);

  const handlePartnerClick = (partner: TradingPartner) => {
    setSelectedPartner(partner);
    setSelectedPlan(null);
    if (onPartnerClick) onPartnerClick(partner);
  };

  const handlePlanClick = (plan: CollaborativePlan) => {
    setSelectedPlan(plan);
    setSelectedPartner(null);
    if (onPlanClick) onPlanClick(plan);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
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
            <h3 className="text-lg font-bold">Multi-Enterprise Network</h3>
            <p className="text-sm text-gray-500">
              {filteredPartners.length} partners • {plans.length} plans •{" "}
              {collaborations.length} collaborations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
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
            <option value="SHIPPER">Shippers</option>
            <option value="CARRIER">Carriers</option>
            <option value="BROKER">Brokers</option>
            <option value="WAREHOUSE">Warehouses</option>
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
        <svg ref={svgRef} className="w-full h-full cursor-move">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Collaboration Links */}
            {collaborations.map((collab) => {
              const participantPositions = collab.participants
                .map((pid) => partnerPositions.current.get(pid))
                .filter((p): p is { x: number; y: number } => p !== undefined);

              if (participantPositions.length < 2) return null;

              // Draw lines between participants
              return participantPositions.map((pos, idx) => {
                if (idx === participantPositions.length - 1) return null;
                const nextPos = participantPositions[idx + 1];
                return (
                  <line
                    key={`${collab.type}-${idx}`}
                    x1={pos.x}
                    y1={pos.y}
                    x2={nextPos.x}
                    y2={nextPos.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                );
              });
            })}

            {/* Partners */}
            {filteredPartners.map((partner) => {
              const pos = partnerPositions.current.get(partner.id) || {
                x: 0,
                y: 0,
              };
              const isSelected = selectedPartner?.id === partner.id;

              return (
                <g key={partner.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 25 : 20}
                    fill={
                      partner.status === "ACTIVE"
                        ? "#10b981"
                        : partner.status === "PENDING"
                          ? "#f59e0b"
                          : "#6b7280"
                    }
                    stroke={isSelected ? "#1e40af" : "#fff"}
                    strokeWidth={isSelected ? 3 : 2}
                    onClick={() => handlePartnerClick(partner)}
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
                        {partner.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {partner.type}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {(selectedPartner || selectedPlan) && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold">
                  {selectedPartner ? "Partner Details" : "Plan Details"}
                </h4>
                <button
                  onClick={() => {
                    setSelectedPartner(null);
                    setSelectedPlan(null);
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedPartner && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Name</label>
                    <p className="font-medium">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Type</label>
                    <p className="font-medium">{selectedPartner.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Role</label>
                    <p className="font-medium">{selectedPartner.role}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        selectedPartner.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {selectedPartner.status}
                    </span>
                  </div>
                  {selectedPartner.rating && (
                    <div>
                      <label className="text-xs text-gray-500">Rating</label>
                      <p className="font-medium">{selectedPartner.rating}/5</p>
                    </div>
                  )}
                  {selectedPartner.performance && (
                    <div>
                      <label className="text-xs text-gray-500">
                        On-Time Rate
                      </label>
                      <p className="font-medium">
                        {selectedPartner.performance.onTimeRate.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedPlan && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500">Name</label>
                    <p className="font-medium">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        selectedPlan.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {selectedPlan.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Participants
                    </label>
                    <p className="font-medium">
                      {selectedPlan.participants.length}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Shipments</label>
                    <p className="font-medium">
                      {selectedPlan.shipments.length}
                    </p>
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
