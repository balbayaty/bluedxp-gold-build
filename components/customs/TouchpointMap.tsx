/**
 * Interactive Touchpoint Intelligence Map
 * Real-time border, facility, and warehouse visualization
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiNavigation,
  FiInfo,
  FiX,
  FiFilter,
  FiTrendingUp,
  FiClock,
  FiShield,
} from "react-icons/fi";

interface TouchpointMapProps {
  country?: string;
  onTouchpointSelect?: (touchpoint: any) => void;
}

export default function TouchpointMap({
  country,
  onTouchpointSelect,
}: TouchpointMapProps) {
  const [touchpoints, setTouchpoints] = useState<any[]>([]);
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    transportMode: "all",
  });

  useEffect(() => {
    loadTouchpoints();
  }, [country, filters]);

  const loadTouchpoints = async () => {
    try {
      const params = new URLSearchParams();
      if (country) params.append("country", country);
      if (filters.type !== "all") params.append("type", filters.type);
      if (filters.status !== "all") params.append("status", filters.status);

      const response = await fetch(`/api/customs/touchpoints?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTouchpoints(data.touchpoints || []);
      } else {
        // Fallback to empty array on error
        setTouchpoints([]);
      }
    } catch (error) {
      console.error("Failed to load touchpoints:", error);
      setTouchpoints([]);
    }
  };

  return (
    <div className="relative h-full min-h-[600px] bg-gray-900 rounded-2xl overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Simplified map visualization */}
        <div className="relative w-full h-full">
          {touchpoints.map((tp, index) => (
            <TouchpointMarker
              key={tp.id || index}
              touchpoint={tp}
              onClick={() => {
                setSelectedTouchpoint(tp);
                if (onTouchpointSelect) onTouchpointSelect(tp);
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 bg-gray-900/90 backdrop-blur-xl rounded-lg border border-white/10 hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <FiFilter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
        <div className="px-4 py-2 bg-gray-900/90 backdrop-blur-xl rounded-lg border border-white/10">
          <p className="text-sm text-gray-400">
            {touchpoints.length} touchpoints
          </p>
        </div>
      </div>

      {/* Touchpoint Details Panel */}
      <AnimatePresence>
        {selectedTouchpoint && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 w-96 h-full bg-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-20 overflow-y-auto"
          >
            <TouchpointDetails
              touchpoint={selectedTouchpoint}
              onClose={() => setSelectedTouchpoint(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TouchpointMarker({
  touchpoint,
  onClick,
}: {
  touchpoint: any;
  onClick: () => void;
}) {
  const statusColors = {
    OPERATIONAL: "bg-green-500",
    LIMITED: "bg-yellow-500",
    CLOSED: "bg-red-500",
    MAINTENANCE: "bg-gray-500",
    OVERLOADED: "bg-orange-500",
  };

  // Simplified positioning (would use actual coordinates)
  const x = Math.random() * 80 + 10; // 10-90%
  const y = Math.random() * 80 + 10;

  return (
    <motion.button
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative">
        <div
          className={`w-4 h-4 rounded-full ${statusColors[touchpoint.status as keyof typeof statusColors] || "bg-gray-500"} shadow-lg`}
        >
          <div className="absolute inset-0 animate-ping opacity-75"></div>
        </div>
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-900/90 backdrop-blur-xl px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          {touchpoint.name}
        </div>
      </div>
    </motion.button>
  );
}

function TouchpointDetails({
  touchpoint,
  onClose,
}: {
  touchpoint: any;
  onClose: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{touchpoint.name}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Type</p>
          <p className="font-medium">{touchpoint.type}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Status</p>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              touchpoint.status === "OPERATIONAL"
                ? "bg-green-500/20 text-green-400"
                : touchpoint.status === "LIMITED"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
            }`}
          >
            {touchpoint.status}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Processing Time</p>
          <p className="font-medium flex items-center space-x-2">
            <FiClock className="w-4 h-4" />
            <span>{touchpoint.averageProcessingTime?.average || 0} hours</span>
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Capacity</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Utilization</span>
              <span>{touchpoint.currentUtilization}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  touchpoint.currentUtilization > 80
                    ? "bg-red-500"
                    : touchpoint.currentUtilization > 50
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${touchpoint.currentUtilization}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Reliability Score</p>
          <p className="font-medium flex items-center space-x-2">
            <FiShield className="w-4 h-4" />
            <span>{touchpoint.reliabilityScore}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
