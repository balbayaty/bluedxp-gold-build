/**
 * Area Card Component
 * Reusable card component for displaying area information
 * BlueDXP Platform
 */

"use client";

import { motion } from "framer-motion";
import type { WarehouseArea } from "@/types/warehouseArea";
import {
  formatCapacity,
  getUtilizationStatus,
} from "@/lib/utils/warehouseHelpers";

interface AreaCardProps {
  area: WarehouseArea;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AreaCard({
  area,
  onClick,
  showActions = true,
  onEdit,
  onDelete,
}: AreaCardProps) {
  const utilization = area.utilizationPercentage || 0;
  const utilizationStatus = getUtilizationStatus(utilization);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all ${
        onClick ? "cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10" : ""
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-white mb-1">{area.areaName}</h4>
          <p className="text-xs text-cyan-400 font-mono">{area.areaCode}</p>
        </div>
        <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs">
          {area.zone}
        </span>
      </div>

      {/* Utilization */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Usage</span>
          <span
            className={`text-sm font-bold ${
              utilizationStatus.color === "red"
                ? "text-red-400"
                : utilizationStatus.color === "yellow"
                  ? "text-yellow-400"
                  : utilizationStatus.color === "green"
                    ? "text-green-400"
                    : "text-blue-400"
            }`}
          >
            {utilization.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all ${
              utilizationStatus.color === "red"
                ? "bg-red-500"
                : utilizationStatus.color === "yellow"
                  ? "bg-yellow-500"
                  : utilizationStatus.color === "green"
                    ? "bg-green-500"
                    : "bg-blue-500"
            }`}
            style={{ width: `${utilization}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            {formatCapacity(area.currentStock, area.capacity, "units")}
          </span>
        </div>
      </div>

      {/* Hazard Classes */}
      {area.allowedHazards.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-gray-400 block mb-1">
            Allowed Hazards
          </span>
          <div className="flex flex-wrap gap-1">
            {area.allowedHazards.slice(0, 3).map((hc, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              >
                {hc}
              </span>
            ))}
            {area.allowedHazards.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-500/10 text-gray-400">
                +{area.allowedHazards.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Restrictions */}
      {area.restrictions && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
          {area.restrictions}
        </p>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-white/10">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-sm flex items-center justify-center gap-1 transition text-white"
            >
              <i className="ri-edit-line"></i>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete area "${area.areaName}"?`)) {
                  onDelete();
                }
              }}
              className="py-2 px-3 rounded-lg bg-white/5 hover:bg-red-500/20 text-sm flex items-center justify-center gap-1 transition text-red-400"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
