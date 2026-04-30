/**
 * Pulse Benchmark Page
 * View benchmark percentiles and opt-in settings
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import type { BenchmarkPercentile } from "@/types/pulse";

export default function PulseBenchmarkPage() {
  const [percentiles, setPercentiles] = useState<BenchmarkPercentile[]>([]);
  const [loading, setLoading] = useState(true);
  const [optInPublicLeague, setOptInPublicLeague] = useState(false);

  useEffect(() => {
    fetchBenchmarkData();
  }, []);

  const fetchBenchmarkData = async () => {
    try {
      // Fetch percentiles for different metrics
      const metrics = [
        "SAFE_PARTICIPATION",
        "EXECUTE_ONTIME",
        "TRAINING_FRESHNESS",
        "ENGAGEMENT_PARTICIPATION",
      ];
      const results = await Promise.all(
        metrics.map(async (metric) => {
          try {
            const res = await fetch(
              `/api/pulse/benchmark/percentiles?metricKey=${metric}&group=industry=logistics,region=GCC,size=ENT`,
              {
                credentials: "include",
              },
            );
            const data = await res.json();
            return data.success ? data.data : null;
          } catch (error) {
            return null;
          }
        }),
      );
      setPercentiles(results.filter(Boolean));
    } catch (error) {
      console.error("Failed to fetch benchmark data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOptIn = async () => {
    try {
      const res = await fetch("/api/pulse/benchmark/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicLeague: optInPublicLeague }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Opt-in settings updated");
      }
    } catch (error) {
      console.error("Failed to update opt-in:", error);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Benchmark"
        description="Compare your performance with industry benchmarks"
        icon="ri-bar-chart-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Benchmark"
      description="Compare your performance with industry benchmarks"
      icon="ri-bar-chart-line"
    >
      <div className="space-y-6">
        {/* Opt-in Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Public League Participation
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Opt-in to Public League</div>
              <div className="text-sm text-gray-500">
                Allow your anonymized metrics to be included in public
                benchmarks
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={optInPublicLeague}
                onChange={(e) => setOptInPublicLeague(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <button
            onClick={updateOptIn}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>

        {/* Percentiles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Your Percentiles</h3>
          {percentiles.length === 0 ? (
            <p className="text-gray-500">No benchmark data available</p>
          ) : (
            <div className="space-y-4">
              {percentiles.map((percentile) => (
                <div
                  key={percentile.metricKey}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">
                      {percentile.metricKey.replace(/_/g, " ")}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {percentile.percentile}th
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Your Value: {percentile.tenantValue}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Median</div>
                      <div className="font-semibold">{percentile.median}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">75th Percentile</div>
                      <div className="font-semibold">{percentile.p75}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">90th Percentile</div>
                      <div className="font-semibold">{percentile.p90}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
