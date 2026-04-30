/**
 * Utility Bills Comparison Page
 *
 * Compare bills across:
 * - Warehouses
 * - Facilities
 * - Periods
 * - Utility types
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/hooks/useErrorHandler";

function UtilityBillsComparisonContent() {
  const [comparisonType, setComparisonType] = useState<
    "warehouse" | "facility" | "period"
  >("warehouse");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { handleError } = useErrorHandler({
    module: "facility",
    service: "utility-bills",
  });

  const handleCompare = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/facility/utility-bills/analytics/compare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comparisonType,
            [comparisonType === "warehouse" ? "warehouseIds" : "facilityIds"]:
              selectedItems,
            utilityTypes: ["electricity"],
            metrics: ["amount", "consumption", "efficiency", "cost-per-unit"],
            period: {
              start: new Date(
                Date.now() - 90 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              end: new Date().toISOString(),
            },
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setComparisonData(data.data);
      } else {
        // Handle error - comparison data remains null
        setComparisonData(null);
      }
    } catch (error) {
      // Error handled - comparison data remains null
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bill Comparison</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Comparison Type
              </label>
              <select
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="warehouse">Warehouse</option>
                <option value="facility">Facility</option>
                <option value="period">Period</option>
              </select>
            </div>
            <button
              onClick={handleCompare}
              disabled={loading || selectedItems.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Comparing..." : "Compare"}
            </button>
          </div>
        </div>

        {comparisonData && (
          <div className="space-y-6">
            {comparisonData.metrics.map((metric: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <h3 className="text-xl font-bold mb-4 capitalize">
                  {metric.metric}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metric.values}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function UtilityBillsComparisonPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Comparison
            </h2>
            <p className="text-gray-500">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </div>
      }
    >
      <UtilityBillsComparisonContent />
    </ErrorBoundary>
  );
}
