/**
 * Transportation Corridors
 *
 * Corridor Intelligence - Trade lanes, corridor analysis, and optimization
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { apiFetch } from "@/utils/apiFetch";
import {
  RiRouteLine,
  RiMapPinLine,
  RiTimeLine,
  RiBarChartBoxLine,
} from "react-icons/ri";

interface Corridor {
  id: string;
  name: string;
  origin: { country: string; city: string };
  destination: { country: string; city: string };
  touchpoints: any[];
}

interface CorridorAnalysis {
  corridorId: string;
  period: { from: string; to: string };
  totalShipments: number;
  averageTransitTime: number;
  onTimeRate: number;
  delayPatterns: any[];
  optimizationOpportunities: any[];
}

function TransportationCorridorsPageContent() {
  const [loading, setLoading] = useState(false);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("");
  const [analysis, setAnalysis] = useState<CorridorAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadCorridors();
  }, []);

  const loadCorridors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/corridors");

      if (!response.ok) {
        throw new Error(`Failed to load corridors: ${response.statusText}`);
      }

      const data = await response.json();
      setCorridors(Array.isArray(data.corridors) ? data.corridors : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load corridors");
      console.error("Error loading corridors:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCorridorDetails = async (corridorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/transportation/corridors?corridorId=${corridorId}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get corridor details: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setSelectedCorridor(corridorId);
      // Store corridor details if needed
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get corridor details",
      );
      console.error("Error getting corridor details:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCorridor = async () => {
    if (!selectedCorridor) {
      setError("Please select a corridor");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/corridors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          corridorId: selectedCorridor,
          from: fromDate,
          to: toDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze corridor: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze corridor",
      );
      console.error("Error analyzing corridor:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && corridors.length === 0 && !analysis) {
    return (
      <PageTemplate
        title="Transportation Corridors"
        description="Corridor Intelligence - Trade lanes, corridor analysis, and optimization"
        icon="ri-route-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading corridors..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Transportation Corridors"
      description="Corridor Intelligence - Trade lanes, corridor analysis, and optimization"
      icon="ri-route-line"
    >
      <div className="space-y-6">
        {/* Corridor Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiRouteLine className="w-5 h-5" />
            Corridor Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Corridor
              </label>
              <select
                value={selectedCorridor}
                onChange={(e) => {
                  setSelectedCorridor(e.target.value);
                  if (e.target.value) {
                    getCorridorDetails(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="">Select a corridor...</option>
                {corridors.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>
                    {corridor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <button
            onClick={analyzeCorridor}
            disabled={loading || !selectedCorridor}
            className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Corridor"}
          </button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RiBarChartBoxLine className="w-5 h-5" />
              Corridor Analysis Results
            </h3>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Shipments
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {analysis.totalShipments}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Average Transit Time
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {analysis.averageTransitTime.toFixed(1)} hours
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  On-Time Rate
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {(analysis.onTimeRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Optimization Opportunities */}
            {analysis.optimizationOpportunities.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">
                  Optimization Opportunities
                </h4>
                <div className="space-y-2">
                  {analysis.optimizationOpportunities.map((opp, index) => (
                    <div
                      key={index}
                      className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800"
                    >
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {opp.action}
                      </p>
                      {opp.savings && (
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Expected Savings: {opp.savings}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delay Patterns */}
            {analysis.delayPatterns.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Delay Patterns</h4>
                <div className="space-y-2">
                  {analysis.delayPatterns.slice(0, 5).map((pattern, index) => (
                    <div
                      key={index}
                      className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"
                    >
                      <p className="font-medium text-red-800 dark:text-red-200">
                        {pattern.touchpoint || "Unknown Touchpoint"}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Average Delay: {pattern.averageDelay} minutes |
                        Frequency: {pattern.frequency}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!analysis && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiRouteLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Select a corridor and date range to analyze corridor performance
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationCorridorsPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Transportation Corridors"
          description="Corridor Intelligence - Trade lanes, corridor analysis, and optimization"
          icon="ri-route-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationCorridorsPageContent />
    </ErrorBoundary>
  );
}
