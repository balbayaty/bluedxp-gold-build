/**
 * Utility Bills Analytics Page
 *
 * Comprehensive analytics dashboard with:
 * - Hierarchical breakdown
 * - Savings insights
 * - Multi-dimensional analysis
 * - Tariff optimization
 */

"use client";

import { useState } from "react";
import HierarchicalAnalyticsDashboard from "@/components/facility/utility-bills/HierarchicalAnalyticsDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function UtilityBillsAnalyticsPage() {
  const [period, setPeriod] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
    end: new Date(),
  });

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Utility Bills Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-layered breakdown and intelligent savings insights
          </p>
        </div>

        <div className="mb-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={period.start.toISOString().split("T")[0]}
              onChange={(e) =>
                setPeriod((prev) => ({
                  ...prev,
                  start: new Date(e.target.value),
                }))
              }
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={period.end.toISOString().split("T")[0]}
              onChange={(e) =>
                setPeriod((prev) => ({
                  ...prev,
                  end: new Date(e.target.value),
                }))
              }
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        <HierarchicalAnalyticsDashboard period={period} />
      </div>
    </ErrorBoundary>
  );
}
