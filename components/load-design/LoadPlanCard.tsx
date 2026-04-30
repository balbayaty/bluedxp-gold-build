/**
 * Load Plan Card Component
 *
 * Displays load plan summary with key metrics
 */

"use client";

import { motion } from "framer-motion";
import type { LoadPlan } from "@/types/load-design";
import { format } from "date-fns";

interface LoadPlanCardProps {
  loadPlan: LoadPlan;
  onClick?: () => void;
  showDetails?: boolean;
}

export default function LoadPlanCard({
  loadPlan,
  onClick,
  showDetails = false,
}: LoadPlanCardProps) {
  const { utilization, compliance, cost, route, vehicleSpec } = loadPlan;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "NON_COMPLIANT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "REQUIRES_REVIEW":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white font-mono mb-1">
            {loadPlan.loadNumber}
          </h3>
          <p className="text-sm text-gray-400">{vehicleSpec.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
              compliance.status,
            )}`}
          >
            {compliance.status}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              loadPlan.status === "DELIVERED"
                ? "bg-green-500/20 text-green-400"
                : loadPlan.status === "IN_TRANSIT"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {loadPlan.status}
          </span>
        </div>
      </div>

      {/* Utilization Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Weight</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  utilization.weightPercent > 80
                    ? "bg-green-500"
                    : utilization.weightPercent > 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(utilization.weightPercent, 100)}%`,
                }}
              />
            </div>
            <span className="text-sm text-white font-medium w-12 text-right">
              {utilization.weightPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Volume</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  utilization.volumePercent > 80
                    ? "bg-green-500"
                    : utilization.volumePercent > 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(utilization.volumePercent, 100)}%`,
                }}
              />
            </div>
            <span className="text-sm text-white font-medium w-12 text-right">
              {utilization.volumePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Space</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  utilization.spaceEfficiency > 80
                    ? "bg-green-500"
                    : utilization.spaceEfficiency > 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(utilization.spaceEfficiency, 100)}%`,
                }}
              />
            </div>
            <span className="text-sm text-white font-medium w-12 text-right">
              {utilization.spaceEfficiency.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Items:</span>
            <span className="text-white">{loadPlan.items.length}</span>
          </div>
          {route && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Route:</span>
              <span className="text-white">
                {route.origin.city} → {route.destination.city}
              </span>
            </div>
          )}
          {cost && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Cost:</span>
              <span className="text-white font-medium">
                {cost.total.toFixed(2)} {cost.currency}
              </span>
            </div>
          )}
          {loadPlan.plannedDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Planned:</span>
              <span className="text-white">
                {format(new Date(loadPlan.plannedDate), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Compliance Warnings */}
      {compliance.warnings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-yellow-400">
            ⚠️ {compliance.warnings.length} warning(s)
          </div>
        </div>
      )}

      {/* Compliance Errors */}
      {compliance.errors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-red-400">
            ❌ {compliance.errors.length} error(s) - Blocking
          </div>
        </div>
      )}
    </motion.div>
  );
}
