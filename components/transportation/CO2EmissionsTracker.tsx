/**
 * CO2 Emissions Tracker
 *
 * Comprehensive CO2 emissions tracking with breakdown and comparison
 */

"use client";

import { motion } from "framer-motion";
import type { CO2EmissionsCalculation } from "@/types/tms";
import { Leaf, TrendingDown, TrendingUp } from "lucide-react";

interface CO2EmissionsTrackerProps {
  emissions?: CO2EmissionsCalculation | null;
  compact?: boolean;
}

export default function CO2EmissionsTracker({
  emissions,
  compact = false,
}: CO2EmissionsTrackerProps) {
  // Early return if no emissions data
  if (!emissions) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-500" />
          CO2 Emissions Tracking
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No emissions data available
          </p>
        </div>
      </div>
    );
  }

  // Safe access with defaults
  const totalCO2e = emissions.totalCO2e ?? 0;
  const cargo = emissions.cargo ?? { weight: 0, volume: 0 };
  const calculationMethod = emissions.calculationMethod ?? {
    method: "STANDARD" as const,
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <p className="text-green-100 text-xs mb-1">Total CO2e Emissions</p>
          <p className="text-2xl font-bold">{totalCO2e.toFixed(2)} kg CO₂e</p>
          {cargo.weight > 0 && (
            <p className="text-green-100 text-xs mt-1">
              {(totalCO2e / cargo.weight).toFixed(3)} kg CO₂e per kg
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Leaf className="w-5 h-5 text-green-500" />
        CO2 Emissions Tracking
      </h3>

      {/* Total Emissions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Total CO2e Emissions</p>
            <p className="text-3xl font-bold mt-1">
              {totalCO2e.toFixed(2)} kg CO₂e
            </p>
            <p className="text-green-100 text-sm mt-1">
              {cargo.weight > 0 && (
                <>{(totalCO2e / cargo.weight).toFixed(3)} kg CO₂e per kg</>
              )}
            </p>
          </div>
          <Leaf className="w-12 h-12 opacity-50" />
        </div>
      </motion.div>

      {/* Breakdown by Segment */}
      {emissions.breakdown && emissions.breakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h4 className="font-semibold mb-3">Emissions Breakdown</h4>
          <div className="space-y-3">
            {emissions.breakdown.map((segment, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{segment.segment}</span>
                  <span className="text-gray-600">
                    {segment.co2e.toFixed(2)} kg (
                    {segment.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${segment.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{segment.distance.toFixed(0)} km</span>
                  <span>
                    {segment.emissionFactor.toFixed(4)} kg CO₂e per km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison */}
      {emissions.comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* vs Average */}
          {emissions.comparison.vsAverage && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">vs Average</p>
              <div className="flex items-center gap-2">
                {emissions.comparison.vsAverage.percentage < 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                )}
                <p
                  className={`text-2xl font-bold ${
                    emissions.comparison.vsAverage.percentage < 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {emissions.comparison.vsAverage.percentage > 0 ? "+" : ""}
                  {emissions.comparison.vsAverage.percentage.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average: {emissions.comparison.vsAverage.average.toFixed(2)} kg
              </p>
            </div>
          )}

          {/* vs Best */}
          {emissions.comparison.vsBest && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">vs Best</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <p className="text-2xl font-bold text-orange-500">
                  +{emissions.comparison.vsBest.percentage.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Best: {emissions.comparison.vsBest.best.toFixed(2)} kg
              </p>
            </div>
          )}

          {/* vs Worst */}
          {emissions.comparison.vsWorst && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">vs Worst</p>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-500" />
                <p className="text-2xl font-bold text-green-500">
                  {emissions.comparison.vsWorst.percentage.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Worst: {emissions.comparison.vsWorst.worst.toFixed(2)} kg
              </p>
            </div>
          )}
        </div>
      )}

      {/* Offset Options */}
      {emissions.offsetOptions && emissions.offsetOptions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Carbon Offset Options</h4>
          <div className="space-y-2">
            {emissions.offsetOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
              >
                <div>
                  <p className="font-medium">{option.provider}</p>
                  {option.certificate && (
                    <p className="text-xs text-gray-500">Certified offset</p>
                  )}
                </div>
                <p className="font-semibold">
                  {option.cost.toFixed(2)} {option.currency}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculation Method */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600">Calculation Method</p>
        <p className="font-semibold">{calculationMethod.method}</p>
        {calculationMethod.standard && (
          <p className="text-xs text-gray-500 mt-1">
            Standard: {calculationMethod.standard}
          </p>
        )}
      </div>
    </div>
  );
}
