"use client";

import { motion } from "framer-motion";
import { ViewMode } from "@/types/asn";

interface ASNHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ASNHeader({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
}: ASNHeaderProps) {
  const viewModes: { mode: ViewMode; icon: string; label: string }[] = [
    { mode: "table", icon: "ri-activity", label: "Table" },
    { mode: "grid", icon: "ri-grid", label: "Grid" },
    { mode: "chart", icon: "ri-bar-chart-line", label: "Analytics" },
    { mode: "map", icon: "ri-map", label: "Map" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title Section */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Advanced Shipping Notice (ASN)
            </h1>
            <p className="text-gray-400 mt-2">
              Enhanced tracking and management for all shipments
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search ASN, shipment, supplier..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-12 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-[#0F172A] border border-[#334155] rounded-lg p-1">
            {viewModes.map(({ mode, icon, label }) => (
              <motion.button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`relative px-4 py-2 rounded-lg transition-all ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={label}
              >
                <i className={`${icon} text-xl`}></i>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
