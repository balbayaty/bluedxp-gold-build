/**
 * Location Card Component
 * Reusable card component for displaying location information
 * BlueDXP Platform
 */

"use client";

import { motion } from "framer-motion";
import type { StorageLocation } from "@/types/warehouseLocation";
import {
  getComplianceColor,
  formatCapacity,
  getUtilizationStatus,
} from "@/lib/utils/warehouseHelpers";
import { formatInspectionDate } from "@/lib/utils/warehouseHelpers";

interface LocationCardProps {
  location: StorageLocation;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function LocationCard({
  location,
  onClick,
  showActions = true,
  onEdit,
  onDelete,
}: LocationCardProps) {
  const utilization = location.utilizationRate || 0;
  const utilizationStatus = getUtilizationStatus(utilization);
  const complianceColor = getComplianceColor(location.complianceStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer ${
        onClick ? "hover:shadow-lg hover:shadow-cyan-500/10" : ""
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{location.name}</h3>
          <p className="text-sm text-cyan-400 font-mono">{location.code}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            location.complianceStatus === "Compliant"
              ? "bg-green-500/20 text-green-400"
              : location.complianceStatus === "Non-Compliant"
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {location.complianceStatus}
        </span>
      </div>

      {/* Location Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Location:</span>
          <span className="text-white">
            {location.location.city}, {location.location.country}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Fire System:</span>
          <span className="text-white text-xs">
            {location.fireSuppressionType}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Hazard Classes:</span>
          <span className="text-white">
            {location.storageRestrictions.hazardClassesAllowed.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Last Inspection:</span>
          <span className="text-white">
            {formatInspectionDate(location.lastInspection)}
          </span>
        </div>
      </div>

      {/* Utilization */}
      {location.utilizationRate !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Utilization</span>
            <div className="flex items-center gap-2">
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
                {utilization.toFixed(1)}%
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  utilizationStatus.color === "red"
                    ? "bg-red-500/20 text-red-400"
                    : utilizationStatus.color === "yellow"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : utilizationStatus.color === "green"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {utilizationStatus.label}
              </span>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
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
          {location.totalPalletCapacity &&
            location.currentPalletsUsed !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                {formatCapacity(
                  location.currentPalletsUsed,
                  location.totalPalletCapacity,
                  "pallets",
                )}
              </p>
            )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-white/10">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition text-sm font-medium"
            >
              <i className="ri-edit-line mr-1"></i>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete location "${location.name}"?`)) {
                  onDelete();
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition text-sm font-medium"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
