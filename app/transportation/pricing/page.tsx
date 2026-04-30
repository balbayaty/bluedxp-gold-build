/**
 * Pricing Intelligence
 *
 * Comprehensive pricing intelligence dashboard with market rates, trends, forecasts, and recommendations
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import PricingIntelligencePanel from "@/components/transportation/PricingIntelligencePanel";
import { apiFetch } from "@/utils/apiFetch";
import type {
  PricingIntelligence,
  Location,
  TransportMode,
  ShipmentType,
} from "@/types/tms";
import {
  RiMoneyDollarCircleLine,
  RiMapPinLine,
  RiShipLine,
  RiCalendarLine,
} from "react-icons/ri";

function TransportationPricingPageContent() {
  const [loading, setLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<PricingIntelligence | null>(
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
  const [type, setType] = useState<ShipmentType>("FULL_TRUCKLOAD");
  const [weight, setWeight] = useState(1000);
  const [volume, setVolume] = useState(10);
  const [value, setValue] = useState(50000);

  const fetchPricingIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        "/api/transportation/pricing-intelligence",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            mode,
            type,
            cargo: {
              weight,
              volume,
              value,
              currency: "SAR",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pricing intelligence: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load pricing intelligence",
      );
      console.error("Error fetching pricing intelligence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch on mount
    fetchPricingIntelligence();
  }, []);

  if (loading && !intelligence) {
    return (
      <PageTemplate
        title="Pricing Intelligence"
        description="Market rates, trends, forecasts, and recommendations"
        icon="ri-money-dollar-circle-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Analyzing market rates..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Pricing Intelligence"
      description="Market rates, trends, forecasts, and recommendations"
      icon="ri-money-dollar-circle-line"
    >
      <div className="space-y-6">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiMoneyDollarCircleLine className="w-5 h-5" />
            Pricing Analysis Request
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

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Shipment Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ShipmentType)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="FULL_TRUCKLOAD">Full Truckload</option>
                <option value="LESS_THAN_TRUCKLOAD">LTL</option>
                <option value="PARCEL">Parcel</option>
              </select>
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

            {/* Analyze Button */}
            <div className="flex items-end">
              <button
                onClick={fetchPricingIntelligence}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Analyzing..." : "Analyze Pricing"}
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

        {/* Pricing Intelligence Panel */}
        {intelligence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PricingIntelligencePanel intelligence={intelligence} />
          </motion.div>
        )}

        {/* Empty State */}
        {!intelligence && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiMoneyDollarCircleLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter shipment details and click "Analyze Pricing" to get pricing
              intelligence
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationPricingPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Pricing Intelligence"
          description="Market rates, trends, forecasts, and recommendations"
          icon="ri-money-dollar-circle-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationPricingPageContent />
    </ErrorBoundary>
  );
}
