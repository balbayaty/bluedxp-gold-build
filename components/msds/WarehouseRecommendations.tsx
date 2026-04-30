/**
 * Warehouse Recommendations Component
 * Displays warehouse assignment recommendations based on MSDS storage requirements
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WarehouseAssignmentRecommendation } from "@/lib/services/warehouse-assignment";

interface WarehouseRecommendationsProps {
  msdsData: {
    storageConditions?: string[];
    incompatibleMaterials?: string[];
    hazardClass?: string;
    hazardLevel?: "High" | "Medium" | "Low";
    unNumber?: string;
    packingGroup?: string;
    transportClass?: string;
    physicalState?: string;
    flashPoint?: string;
    boilingPoint?: string;
    ghsCompliant?: boolean;
  };
  customerId?: string;
  customerName?: string;
  quantity?: number;
  volume?: number;
  weight?: number;
  onSelectWarehouse?: (
    warehouseId: string,
    recommendation?: WarehouseAssignmentRecommendation,
  ) => void;
}

interface DiagnosticInfo {
  summary: {
    totalWarehouses: number;
    recommendedCount: number;
    filteredCount: number;
    commonReasons: string[];
    requiresHazmat: boolean;
    requiresTemperature: boolean;
  };
  filteredWarehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    matchScore: number;
    complianceScore: number;
    spaceScore: number;
    commercialScore: number;
    reason: string;
  }>;
}

export default function WarehouseRecommendations({
  msdsData,
  customerId,
  customerName,
  quantity,
  volume,
  weight,
  onSelectWarehouse,
}: WarehouseRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    WarehouseAssignmentRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(
    null,
  );
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    if (msdsData) {
      fetchRecommendations();
    }
  }, [msdsData, customerId, quantity, volume, weight]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Initialize mock data if needed (first time) - REMOVED: Now using strict Database logic.
      // Database should be seeded via scripts/seed-wms-data.ts or similar.

      const response = await fetch("/api/warehouse/assign-msds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          msdsData,
          config: {
            customerId,
            customerName,
            quantity,
            volume,
            weight,
            requireCommercialAgreement: !!customerId,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
        setDiagnostics(data.diagnostics || null);

        // Log diagnostics for debugging
        if (data.diagnostics?.summary) {
          console.log("📊 Warehouse Diagnostics:", {
            total: data.diagnostics.summary.totalWarehouses,
            recommended: data.diagnostics.summary.recommendedCount,
            filtered: data.diagnostics.summary.filteredCount,
            requiresHazmat: data.diagnostics.summary.requiresHazmat,
          });
        }
      } else {
        setError(data.error || "Failed to get warehouse recommendations");
        console.error("❌ Warehouse assignment failed:", data.error);
      }
    } catch (err) {
      console.error("Error fetching warehouse recommendations:", err);
      setError("Failed to load warehouse recommendations");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-900/30";
    if (score >= 60) return "text-yellow-400 bg-yellow-900/30";
    return "text-red-400 bg-red-900/30";
  };

  const getMatchIcon = (match: boolean | undefined) => {
    if (match === undefined) return null;
    return match ? (
      <i className="ri-checkbox-circle-line text-green-400"></i>
    ) : (
      <i className="ri-close-circle-line text-red-400"></i>
    );
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-400">
            Analyzing warehouse compatibility...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-900/20 border border-red-500/30">
        <div className="flex items-center gap-2 text-red-400">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
        <div className="text-center py-8">
          <i className="ri-building-line text-4xl text-gray-500 mb-4"></i>
          <p className="text-gray-400">No suitable warehouses found</p>
          <p className="text-sm text-gray-500 mt-2">
            Please check storage requirements or contact warehouse management
          </p>

          {/* Diagnostic Information */}
          {diagnostics && diagnostics.summary && (
            <div className="mt-6 text-left max-w-2xl mx-auto">
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <i className="ri-information-line"></i>
                  Why no warehouses found? (Click to see details)
                </span>
                <i
                  className={`ri-arrow-${showDiagnostics ? "up" : "down"}-s-line`}
                ></i>
              </button>

              {showDiagnostics && (
                <div className="mt-4 p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      <i className="ri-bar-chart-line text-cyan-400"></i>
                      Analysis Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Total Warehouses:</span>
                        <span className="ml-2 font-semibold text-white">
                          {diagnostics.summary.totalWarehouses}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Filtered Out:</span>
                        <span className="ml-2 font-semibold text-yellow-400">
                          {diagnostics.summary.filteredCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Requires HAZMAT:</span>
                        <span
                          className={`ml-2 font-semibold ${diagnostics.summary.requiresHazmat ? "text-red-400" : "text-green-400"}`}
                        >
                          {diagnostics.summary.requiresHazmat ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">
                          Requires Temperature:
                        </span>
                        <span
                          className={`ml-2 font-semibold ${diagnostics.summary.requiresTemperature ? "text-blue-400" : "text-gray-400"}`}
                        >
                          {diagnostics.summary.requiresTemperature
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Common Reasons */}
                  {diagnostics.summary.commonReasons.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <i className="ri-alert-line text-yellow-400"></i>
                        Common Reasons
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {diagnostics.summary.commonReasons.map(
                          (reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <i className="ri-arrow-right-line text-yellow-400 mt-0.5"></i>
                              <span>{reason}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Specific Warehouse Details */}
                  {diagnostics.filteredWarehouses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <i className="ri-building-2-line text-blue-400"></i>
                        Warehouse Details (showing first{" "}
                        {diagnostics.filteredWarehouses.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {diagnostics.filteredWarehouses.map((wh) => (
                          <div
                            key={wh.warehouseId}
                            className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-sm"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium text-gray-200">
                                {wh.warehouseName}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                {wh.matchScore}% Match
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2">
                              <div>
                                Compliance:{" "}
                                <span className="text-white">
                                  {wh.complianceScore}%
                                </span>
                              </div>
                              <div>
                                Space:{" "}
                                <span className="text-white">
                                  {wh.spaceScore}%
                                </span>
                              </div>
                              <div>
                                Commercial:{" "}
                                <span className="text-white">
                                  {wh.commercialScore}%
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-yellow-400 flex items-start gap-1">
                              <i className="ri-information-line mt-0.5"></i>
                              <span>{wh.reason}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="pt-3 border-t border-gray-700">
                    <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      <i className="ri-lightbulb-line text-cyan-400"></i>
                      Recommendations
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {diagnostics.summary.requiresHazmat && (
                        <li className="flex items-start gap-2">
                          <i className="ri-alert-line text-red-400 mt-0.5"></i>
                          <span>
                            This product requires a{" "}
                            <strong className="text-red-400">
                              HAZMAT warehouse
                            </strong>
                            . Ensure warehouses have HAZMAT capability enabled.
                          </span>
                        </li>
                      )}
                      {diagnostics.summary.requiresTemperature && (
                        <li className="flex items-start gap-2">
                          <i className="ri-snowflake-line text-blue-400 mt-0.5"></i>
                          <span>
                            This product requires{" "}
                            <strong className="text-blue-400">
                              temperature-controlled storage
                            </strong>
                            . Check warehouse temperature zones.
                          </span>
                        </li>
                      )}
                      {diagnostics.summary.filteredCount > 0 && (
                        <li className="flex items-start gap-2">
                          <i className="ri-building-line text-yellow-400 mt-0.5"></i>
                          <span>
                            {diagnostics.summary.filteredCount} warehouse(s)
                            were filtered out. Consider adjusting storage
                            requirements or contacting warehouse management.
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <i className="ri-building-2-line text-cyan-400"></i>
          Recommended Warehouses ({recommendations.length})
        </h3>
        <button
          onClick={fetchRecommendations}
          className="px-3 py-1 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
        >
          <i className="ri-refresh-line mr-1"></i>
          Refresh
        </button>
      </div>

      {recommendations.map((rec, index) => (
        <motion.div
          key={rec.warehouseId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-xl bg-gray-800 border border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div
            className="p-4 cursor-pointer hover:bg-gray-700/50 transition"
            onClick={() =>
              setExpandedWarehouse(
                expandedWarehouse === rec.warehouseId ? null : rec.warehouseId,
              )
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">{rec.warehouseName}</h4>
                  <span className="px-2 py-1 text-xs rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-500/30">
                    {rec.warehouseCode}
                  </span>
                </div>

                {/* Score Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getScoreColor(rec.matchScore)}`}
                  >
                    Match: {rec.matchScore}%
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getScoreColor(rec.complianceScore)}`}
                  >
                    Compliance: {rec.complianceScore}%
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getScoreColor(rec.spaceScore)}`}
                  >
                    Space: {rec.spaceScore}%
                  </span>
                  {rec.commercialAgreement && (
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        rec.commercialAgreement.agreementStatus === "ACTIVE"
                          ? "text-green-400 bg-green-900/30"
                          : "text-yellow-400 bg-yellow-900/30"
                      }`}
                    >
                      {rec.commercialAgreement.agreementStatus === "ACTIVE"
                        ? "✓ Agreement"
                        : "⚠ Pending"}
                    </span>
                  )}
                </div>
              </div>

              <button className="ml-4 text-gray-400 hover:text-white">
                <i
                  className={`ri-arrow-${expandedWarehouse === rec.warehouseId ? "up" : "down"}-s-line text-xl`}
                ></i>
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expandedWarehouse === rec.warehouseId && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700"
              >
                <div className="p-4 space-y-4">
                  {/* Match Details */}
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <i className="ri-checkbox-multiple-line text-cyan-400"></i>
                      Compliance Checks
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {getMatchIcon(rec.matches.temperature)}
                        <span>Temperature Control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchIcon(rec.matches.hazardClass)}
                        <span>Hazard Class</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchIcon(rec.matches.segregation)}
                        <span>Segregation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchIcon(rec.matches.spaceAvailable)}
                        <span>Space Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchIcon(rec.matches.complianceStandards)}
                        <span>Compliance Standards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchIcon(rec.matches.commercialAgreement)}
                        <span>Commercial Agreement</span>
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  {rec.reasons.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-check-line text-green-400"></i>
                        Why This Warehouse
                      </h5>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {rec.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {rec.warnings.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-alert-line text-yellow-400"></i>
                        Warnings
                      </h5>
                      <ul className="space-y-1 text-sm text-yellow-300">
                        {rec.warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <i className="ri-alert-line text-yellow-400 mt-0.5"></i>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Available Space */}
                  {rec.availableSpace && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-layout-grid-line text-blue-400"></i>
                        Available Space
                      </h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Area:</span>
                          <span className="ml-2 font-semibold">
                            {rec.availableSpace.area.toFixed(1)} m²
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Volume:</span>
                          <span className="ml-2 font-semibold">
                            {rec.availableSpace.volume.toFixed(1)} m³
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">
                            Pallet Positions:
                          </span>
                          <span className="ml-2 font-semibold">
                            {rec.availableSpace.palletPositions}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">
                            Weight Capacity:
                          </span>
                          <span className="ml-2 font-semibold">
                            {rec.availableSpace.weightCapacity.toFixed(0)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commercial Agreement */}
                  {rec.commercialAgreement && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-file-contract-line text-purple-400"></i>
                        Commercial Agreement
                      </h5>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-gray-400">Customer:</span>{" "}
                          <span className="font-semibold">
                            {rec.commercialAgreement.customerName}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-400">Status:</span>{" "}
                          <span
                            className={`font-semibold ${
                              rec.commercialAgreement.agreementStatus ===
                              "ACTIVE"
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {rec.commercialAgreement.agreementStatus}
                          </span>
                        </p>
                        {rec.commercialAgreement.requiresApproval && (
                          <p className="text-yellow-400 text-xs mt-2">
                            <i className="ri-alert-line mr-1"></i>
                            Commercial agreement approval required before
                            assignment
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estimated Cost */}
                  {rec.estimatedCost && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-money-dollar-circle-line text-green-400"></i>
                        Estimated Cost
                      </h5>
                      <p className="text-lg font-bold text-green-400">
                        {rec.estimatedCost.monthly.toLocaleString()}{" "}
                        {rec.estimatedCost.currency} / month
                      </p>
                    </div>
                  )}

                  {/* ✅ Warehouse Areas */}
                  {rec.warehouseAreas && rec.warehouseAreas.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-grid-line text-blue-400"></i>
                        Available Areas ({rec.warehouseAreas.length})
                        {rec.recommendedAreaId && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            Best Match Selected
                          </span>
                        )}
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {rec.warehouseAreas.map((area) => {
                          const isRecommended =
                            area.id === rec.recommendedAreaId;
                          return (
                            <div
                              key={area.id}
                              className={`p-3 rounded-lg border text-sm ${
                                isRecommended
                                  ? "bg-green-500/10 border-green-500/30"
                                  : "bg-gray-700/50 border-gray-600"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {area.areaName}
                                    </span>
                                    {isRecommended && (
                                      <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">
                                        ⭐ Recommended
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {area.areaCode} • {area.zone}
                                  </div>
                                </div>
                                {rec.areaMatchScore && isRecommended && (
                                  <span className="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400">
                                    {rec.areaMatchScore}% Match
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-400">
                                    Capacity:
                                  </span>
                                  <span className="ml-1">
                                    {area.capacity} units
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Utilization:
                                  </span>
                                  <span className="ml-1">
                                    {area.utilizationPercentage || 0}%
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-400">
                                    Hazards:
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {area.allowedHazards
                                      .slice(0, 3)
                                      .map((hc, i) => (
                                        <span
                                          key={i}
                                          className="px-1.5 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400"
                                        >
                                          {hc}
                                        </span>
                                      ))}
                                    {area.allowedHazards.length > 3 && (
                                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-600 text-gray-400">
                                        +{area.allowedHazards.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {rec.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <i className="ri-lightbulb-line text-cyan-400"></i>
                        Recommendations
                      </h5>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {rec.recommendations.map((rec_item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <i className="ri-arrow-right-line text-cyan-400 mt-0.5"></i>
                            <span>{rec_item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={() => onSelectWarehouse?.(rec.warehouseId, rec)}
                      className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition"
                    >
                      <i className="ri-check-line mr-2"></i>
                      Assign to This Warehouse
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
