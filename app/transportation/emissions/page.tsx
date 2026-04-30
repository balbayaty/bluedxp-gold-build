/**
 * CO2 Emissions
 *
 * Comprehensive CO2 emissions tracking and calculation dashboard
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import CO2EmissionsTracker from "@/components/transportation/CO2EmissionsTracker";
import { apiFetch } from "@/utils/apiFetch";
import type {
  CO2EmissionsCalculation,
  Location,
  TransportMode,
} from "@/types/tms";
import { RiLeafLine, RiShipLine, RiMapPinLine } from "react-icons/ri";

function TransportationEmissionsPageContent() {
  const [loading, setLoading] = useState(false);
  const [emissions, setEmissions] = useState<CO2EmissionsCalculation | null>(
    null,
  );
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
  const [mode, setMode] = useState<TransportMode>("ROAD");
  const [weight, setWeight] = useState(1000);
  const [volume, setVolume] = useState(10);
  const [distance, setDistance] = useState(950);

  const calculateEmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/emissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          mode,
          cargo: {
            weight,
            volume,
            value: 50000,
            currency: "SAR",
          },
          distance: distance || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to calculate emissions: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setEmissions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to calculate emissions",
      );
      console.error("Error calculating emissions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !emissions) {
    return (
      <PageTemplate
        title="CO2 Emissions"
        description="Track and calculate CO2 emissions for shipments"
        icon="ri-leaf-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Calculating emissions..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="CO2 Emissions"
      description="Track and calculate CO2 emissions for shipments"
      icon="ri-leaf-line"
    >
      <div className="space-y-6">
        {/* Calculation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiLeafLine className="w-5 h-5 text-green-500" />
            Emissions Calculator
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

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Transport Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as TransportMode)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="ROAD">Road</option>
                <option value="AIR">Air</option>
                <option value="SEA">Sea</option>
                <option value="RAIL">Rail</option>
              </select>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Distance (km)
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
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

            {/* Calculate Button */}
            <div className="flex items-end md:col-span-2">
              <button
                onClick={calculateEmissions}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Calculating..." : "Calculate Emissions"}
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

        {/* Emissions Tracker */}
        {emissions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CO2EmissionsTracker emissions={emissions} />
          </motion.div>
        )}

        {/* Empty State */}
        {!emissions && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiLeafLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter shipment details and click "Calculate Emissions" to see CO2
              emissions
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationEmissionsPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="CO2 Emissions"
          description="Track and calculate CO2 emissions for shipments"
          icon="ri-leaf-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationEmissionsPageContent />
    </ErrorBoundary>
  );
}
