/**
 * Route Comparison
 *
 * Compare multiple route options with pricing, CO2e, transit times, and recommendations
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import RouteComparisonPanel from "@/components/transportation/RouteComparisonPanel";
import { apiFetch } from "@/utils/apiFetch";
import type { RouteComparison, Location, RouteOption } from "@/types/tms";
import { RiMapPinLine, RiShipLine, RiCalendarLine } from "react-icons/ri";

function TransportationRouteComparisonPageContent() {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<RouteComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [origin, setOrigin] = useState<Location>({
    city: "Riyadh",
    country: "Saudi Arabia",
    code: "RUH",
  });
  const [destination, setDestination] = useState<Location>({
    city: "Jeddah",
    country: "Saudi Arabia",
    code: "JED",
  });
  const [weight, setWeight] = useState(1000);
  const [volume, setVolume] = useState(10);
  const [value, setValue] = useState(50000);

  const compareRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/route-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          cargo: {
            weight,
            volume,
            value,
            currency: "SAR",
          },
          preferences: {
            prioritizeCost: false,
            prioritizeTime: false,
            prioritizeEmissions: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to compare routes: ${response.statusText}`);
      }

      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare routes");
      console.error("Error comparing routes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = (option: RouteOption) => {
    console.log("Selected route:", option);
    // You can add navigation or state update here
  };

  if (loading && !comparison) {
    return (
      <PageTemplate
        title="Route Comparison"
        description="Compare routes with pricing, CO2e, and transit times"
        icon="ri-map-pin-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Comparing routes..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Route Comparison"
      description="Compare routes with pricing, CO2e, and transit times"
      icon="ri-map-pin-line"
    >
      <div className="space-y-6">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiMapPinLine className="w-5 h-5" />
            Route Comparison Request
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium mb-2">Origin</label>
              <input
                type="text"
                value={origin.city}
                onChange={(e) => setOrigin({ ...origin, city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination.city}
                onChange={(e) =>
                  setDestination({ ...destination, city: e.target.value })
                }
                placeholder="City"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Volume (m³)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Value (SAR)
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Compare Button */}
            <div className="flex items-end">
              <button
                onClick={compareRoutes}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Comparing..." : "Compare Routes"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Route Comparison Panel */}
        {comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RouteComparisonPanel
              comparison={comparison}
              onSelectRoute={handleSelectRoute}
            />
          </motion.div>
        )}

        {/* Empty State */}
        {!comparison && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiMapPinLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter route details and click "Compare Routes" to see route
              options
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationRouteComparisonPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Route Comparison"
          description="Compare routes with pricing, CO2e, and transit times"
          icon="ri-map-pin-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationRouteComparisonPageContent />
    </ErrorBoundary>
  );
}
