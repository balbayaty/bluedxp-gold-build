/**
 * 🗺️ QHSE RISK HEATMAP
 * Interactive heatmap visualization for QHSE risks
 * Modern, sexy, intelligent visualization
 */

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiShield, FiMapPin } from "react-icons/fi";

interface RiskDataPoint {
  id: string;
  rowLabel: string; // e.g., "Warehouse A", "Chemical Storage"
  colLabel: string; // e.g., "Incident Frequency", "Compliance Score"
  value: number; // Risk score or compliance deviation
  category: "SAFETY" | "COMPLIANCE" | "ENVIRONMENTAL";
  details: string;
  recommendations: string[];
}

interface QHSERiskHeatmapProps {
  data: RiskDataPoint[];
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  colorScale?: "red-green" | "blue-red";
}

const QHSERiskHeatmap: React.FC<QHSERiskHeatmapProps> = ({
  data,
  title = "QHSE Risk Heatmap",
  description = "Visualizing risk hotspots across operations.",
}) => {
  const getRiskColor = (value: number) => {
    if (value >= 75) return "bg-red-500";
    if (value >= 50) return "bg-orange-500";
    if (value >= 25) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskLabel = (value: number) => {
    if (value >= 75) return "CRITICAL";
    if (value >= 50) return "HIGH";
    if (value >= 25) return "MEDIUM";
    return "LOW";
  };

  const getCategoryColor = (category: RiskDataPoint["category"]) => {
    switch (category) {
      case "SAFETY":
        return "border-red-300 bg-red-50 dark:bg-red-900/20";
      case "COMPLIANCE":
        return "border-blue-300 bg-blue-50 dark:bg-blue-900/20";
      case "ENVIRONMENTAL":
        return "border-green-300 bg-green-50 dark:bg-green-900/20";
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <FiShield className="w-16 h-16 mx-auto mb-2 text-gray-400" />
            <p>No risk data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Critical</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${getCategoryColor(item.category)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiShield
                  className={`w-5 h-5 ${
                    item.value >= 75
                      ? "text-red-600"
                      : item.value >= 50
                        ? "text-orange-600"
                        : item.value >= 25
                          ? "text-yellow-600"
                          : "text-green-600"
                  }`}
                />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.rowLabel}
                </h4>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.colLabel}
                </span>
                <span
                  className={`font-bold ${
                    item.value >= 75
                      ? "text-red-600"
                      : item.value >= 50
                        ? "text-orange-600"
                        : item.value >= 25
                          ? "text-yellow-600"
                          : "text-green-600"
                  }`}
                >
                  {item.value.toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getRiskColor(item.value)}`}
                  style={{ width: `${Math.min(item.value, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {getRiskLabel(item.value)}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    item.category === "SAFETY"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                      : item.category === "COMPLIANCE"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  }`}
                >
                  {item.category}
                </span>
              </div>
              {item.details && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {item.details}
                </p>
              )}
              {item.recommendations && item.recommendations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recommendations:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {item.recommendations.slice(0, 2).map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QHSERiskHeatmap;
