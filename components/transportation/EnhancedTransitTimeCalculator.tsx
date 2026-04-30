/**
 * Enhanced Transit Time Calculator Component
 *
 * Beautiful UI for calculating actual transit time with:
 * - Real-time constraint impact visualization
 * - Predictions chart (optimistic/realistic/pessimistic)
 * - Compliance program impact display
 * - Recommendations and warnings
 *
 * 4IR & 5IR Aligned - Best-in-Class UX
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Shield,
  MapPin,
  Calendar,
  Truck,
  BarChart3,
} from "lucide-react";
import type { Location, TransportMode } from "@/types/tms";
import type { EnhancedTransitTimeCalculation } from "@/lib/services/transportation/enhancedTransitTimeCalculator";

interface EnhancedTransitTimeCalculatorProps {
  onCalculationComplete?: (calculation: EnhancedTransitTimeCalculation) => void;
  initialOrigin?: Location;
  initialDestination?: Location;
  initialMode?: TransportMode;
  tenantId?: string;
}

export default function EnhancedTransitTimeCalculator({
  onCalculationComplete,
  initialOrigin,
  initialDestination,
  initialMode = "LAND",
  tenantId = "default",
}: EnhancedTransitTimeCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] =
    useState<EnhancedTransitTimeCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [origin, setOrigin] = useState<Location | null>(initialOrigin || null);
  const [destination, setDestination] = useState<Location | null>(
    initialDestination || null,
  );
  const [mode, setMode] = useState<TransportMode>(initialMode);
  const [cargo, setCargo] = useState({
    weight: 10000,
    volume: 50,
  });
  const [departureTime, setDepartureTime] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [compliancePrograms, setCompliancePrograms] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    considerRealTimeConditions: true,
    includePredictions: true,
  });

  /**
   * Calculate transit time
   */
  const handleCalculate = async () => {
    if (!origin || !destination) {
      setError("Please provide origin and destination");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/transportation/enhanced-transit-time",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "calculate",
            origin,
            destination,
            mode,
            cargo,
            departureTime: new Date(departureTime).toISOString(),
            compliancePrograms,
            preferences,
            tenantId,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to calculate transit time");
      }

      setCalculation(data.data);
      onCalculationComplete?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Enhanced Transit Time Calculator
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Calculate actual transit time considering all constraints,
            compliance programs, and real-time conditions
          </p>
        </div>
      </div>

      {/* Input Form */}
      {!calculation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="space-y-6">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Origin
                </label>
                <input
                  type="text"
                  placeholder="Enter origin"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setOrigin({
                      id: "origin-1",
                      name: e.target.value,
                      address: {
                        street: "",
                        city: e.target.value,
                        country: "Saudi Arabia",
                        countryCode: "SA",
                        postalCode: "",
                      },
                      type: "ORIGIN",
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="Enter destination"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setDestination({
                      id: "dest-1",
                      name: e.target.value,
                      address: {
                        street: "",
                        city: e.target.value,
                        country: "Saudi Arabia",
                        countryCode: "SA",
                        postalCode: "",
                      },
                      type: "DESTINATION",
                    });
                  }}
                />
              </div>
            </div>

            {/* Mode & Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as TransportMode)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LAND">Road</option>
                  <option value="AIR">Air</option>
                  <option value="SEA">Sea</option>
                  <option value="RAIL">Rail</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={cargo.weight}
                  onChange={(e) =>
                    setCargo({ ...cargo, weight: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume (m³)
                </label>
                <input
                  type="number"
                  value={cargo.volume}
                  onChange={(e) =>
                    setCargo({ ...cargo, volume: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Departure Time
              </label>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Compliance Programs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                Compliance Programs
              </label>
              <div className="flex flex-wrap gap-2">
                {["AEO", "GOLDEN_LIST", "TIR"].map((program) => (
                  <label
                    key={program}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={compliancePrograms.includes(program)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCompliancePrograms([
                            ...compliancePrograms,
                            program,
                          ]);
                        } else {
                          setCompliancePrograms(
                            compliancePrograms.filter((p) => p !== program),
                          );
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">{program}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </span>
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={loading || !origin || !destination}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Calculate Transit Time
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {calculation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Transit Time Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-8">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">
                Actual Transit Time
              </div>
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {calculation.actualTransitTime.total.toFixed(1)}
                <span className="text-3xl text-gray-500 ml-2">hours</span>
              </div>
              <div className="text-sm text-gray-500">
                Base time: {calculation.baseTransitTime.toFixed(1)}h •
                Additional: +
                {(
                  calculation.actualTransitTime.total -
                  calculation.baseTransitTime
                ).toFixed(1)}
                h
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Driving</div>
                <div className="text-2xl font-bold text-blue-600">
                  {calculation.actualTransitTime.breakdown.driving.toFixed(1)}h
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Waiting</div>
                <div className="text-2xl font-bold text-orange-600">
                  {calculation.actualTransitTime.breakdown.waiting.toFixed(1)}h
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Processing</div>
                <div className="text-2xl font-bold text-purple-600">
                  {calculation.actualTransitTime.breakdown.processing.toFixed(
                    1,
                  )}
                  h
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Customs</div>
                <div className="text-2xl font-bold text-red-600">
                  {calculation.actualTransitTime.breakdown.customs.toFixed(1)}h
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Other</div>
                <div className="text-2xl font-bold text-gray-600">
                  {calculation.actualTransitTime.breakdown.other.toFixed(1)}h
                </div>
              </div>
            </div>
          </div>

          {/* Predictions */}
          {calculation.predictions && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Transit Time Predictions
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
                  <div className="text-xs text-gray-500 mb-1">Optimistic</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {calculation.predictions.optimistic.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Best case scenario
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border-2 border-blue-500">
                  <div className="text-xs text-gray-500 mb-1">Realistic</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {calculation.predictions.realistic.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Most likely</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center border border-red-200 dark:border-red-800">
                  <div className="text-xs text-gray-500 mb-1">Pessimistic</div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {calculation.predictions.pessimistic.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Worst case scenario
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-500">
                  Confidence:{" "}
                  <span className="font-medium">
                    {(calculation.predictions.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Program Impact */}
          {calculation.complianceProgramImpact && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                Compliance Program Impact
              </h3>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">Time Saved</div>
                      <div className="text-sm text-gray-500">
                        Programs:{" "}
                        {calculation.complianceProgramImpact.programs.join(
                          ", ",
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      -
                      {calculation.complianceProgramImpact.timeReduction.toFixed(
                        1,
                      )}
                      h
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div>
                      <div className="text-gray-500">Waiting</div>
                      <div className="font-medium">
                        -
                        {calculation.complianceProgramImpact.breakdown.waitingReduction.toFixed(
                          1,
                        )}
                        h
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Processing</div>
                      <div className="font-medium">
                        -
                        {calculation.complianceProgramImpact.breakdown.processingReduction.toFixed(
                          1,
                        )}
                        h
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Customs</div>
                      <div className="font-medium">
                        -
                        {calculation.complianceProgramImpact.breakdown.customsReduction.toFixed(
                          1,
                        )}
                        h
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Constraints Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Constraints Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {calculation.constraints.truckBans.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Truck Bans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {calculation.constraints.openingHours.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Opening Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {calculation.constraints.governmentAgencyHours.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Gov. Agencies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {calculation.constraints.processingTimes.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {calculation.constraints.capacity.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Capacity</div>
              </div>
            </div>
          </div>

          {/* Recommendations & Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {calculation.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {calculation.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {calculation.warnings.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Warnings
                </h3>
                <ul className="space-y-2">
                  {calculation.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {warning}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* New Calculation Button */}
          <button
            onClick={() => setCalculation(null)}
            className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Calculate New Transit Time
          </button>
        </motion.div>
      )}
    </div>
  );
}
