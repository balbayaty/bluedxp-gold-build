/**
 * Route Comparison Panel
 *
 * Comprehensive route comparison UI with pricing, CO2e, transit times, and recommendations
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { RouteComparison, RouteOption } from "@/types/tms";

interface RouteComparisonPanelProps {
  comparison: RouteComparison;
  onSelectRoute?: (option: RouteOption) => void;
}

export default function RouteComparisonPanel({
  comparison,
  onSelectRoute,
}: RouteComparisonPanelProps) {
  const [selectedOption, setSelectedOption] = useState<RouteOption | null>(
    comparison.recommended || null,
  );
  const [sortBy, setSortBy] = useState<"SCORE" | "COST" | "TIME" | "EMISSIONS">(
    "SCORE",
  );

  useEffect(() => {
    if (comparison.recommended) {
      setSelectedOption(comparison.recommended);
    }
  }, [comparison]);

  const sortedOptions = [...comparison.options].sort((a, b) => {
    switch (sortBy) {
      case "COST":
        return a.pricing.totalCost - b.pricing.totalCost;
      case "TIME":
        return a.transitTime.estimated - b.transitTime.estimated;
      case "EMISSIONS":
        return a.emissions.co2e - b.emissions.co2e;
      default:
        return (b.score || 0) - (a.score || 0);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Route Comparison</h3>
          <p className="text-sm text-gray-500">
            {comparison.options.length} route options available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="SCORE">Best Overall</option>
            <option value="COST">Lowest Cost</option>
            <option value="TIME">Fastest</option>
            <option value="EMISSIONS">Lowest Emissions</option>
          </select>
        </div>
      </div>

      {/* Recommended Route */}
      {comparison.recommended && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-500 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                  RECOMMENDED
                </span>
                <span className="font-semibold">
                  {comparison.recommended.carrierName ||
                    comparison.recommended.mode}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Best overall score: {comparison.recommended.score?.toFixed(1)}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedOption(comparison.recommended!);
                onSelectRoute?.(comparison.recommended!);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Select Route
            </button>
          </div>
        </motion.div>
      )}

      {/* Route Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedOption?.id === option.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
            }`}
            onClick={() => {
              setSelectedOption(option);
              onSelectRoute?.(option);
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">
                  {option.carrierName || option.mode}
                </h4>
                <p className="text-xs text-gray-500">{option.type}</p>
              </div>
              {option.rank && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                  #{option.rank}
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-2 text-sm">
              {/* Cost */}
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-semibold">
                  {option.pricing.totalCost.toFixed(2)}{" "}
                  {option.pricing.currency}
                </span>
              </div>

              {/* Transit Time */}
              <div className="flex justify-between">
                <span className="text-gray-600">Transit Time:</span>
                <span className="font-semibold">
                  {option.transitTime.estimated.toFixed(1)} hours
                </span>
              </div>

              {/* CO2 Emissions */}
              <div className="flex justify-between">
                <span className="text-gray-600">CO2e:</span>
                <span className="font-semibold">
                  {option.emissions.co2e.toFixed(2)} kg
                </span>
              </div>

              {/* Reliability */}
              <div className="flex justify-between">
                <span className="text-gray-600">On-Time Rate:</span>
                <span className="font-semibold">
                  {option.reliability.onTimeRate?.toFixed(1)}%
                </span>
              </div>

              {/* Score */}
              {option.score && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${option.score}%` }}
                        />
                      </div>
                      <span className="font-semibold text-sm">
                        {option.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Savings Badge */}
            {option.pricing.savings && option.pricing.savings > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                  Save {option.pricing.savings.toFixed(2)}{" "}
                  {option.pricing.currency}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Comparison Criteria */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Comparison Criteria</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Cost Weight:</span>
            <span className="ml-2 font-semibold">
              {(
                (comparison.comparisonCriteria?.weights?.cost || 0.3) * 100
              ).toFixed(0)}
              %
            </span>
          </div>
          <div>
            <span className="text-gray-600">Time Weight:</span>
            <span className="ml-2 font-semibold">
              {(
                (comparison.comparisonCriteria?.weights?.time || 0.3) * 100
              ).toFixed(0)}
              %
            </span>
          </div>
          <div>
            <span className="text-gray-600">Emissions Weight:</span>
            <span className="ml-2 font-semibold">
              {(
                (comparison.comparisonCriteria?.weights?.emissions || 0.2) * 100
              ).toFixed(0)}
              %
            </span>
          </div>
          <div>
            <span className="text-gray-600">Reliability Weight:</span>
            <span className="ml-2 font-semibold">
              {(
                (comparison.comparisonCriteria?.weights?.reliability || 0.2) *
                100
              ).toFixed(0)}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
