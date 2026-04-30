/**
 * Customs Brokers Management
 *
 * Manage customs brokers and their performance
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/utils/apiFetch";
import { isProd } from "@/lib/services/transportation/strictMode";

interface CustomsBroker {
  id: string;
  name: string;
  licenseNumber: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  performance?: {
    onTimeClearanceRate: number;
    averageClearanceTime: number;
    accuracyRate: number;
    totalClearances: number;
    customerSatisfaction: number;
  };
  coverage: {
    countries: string[];
    customsOffices: string[];
  };
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

function stablePercent(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r = (h % 10000) / 10000;
  return Number((min + r * (max - min)).toFixed(1));
}

export default function CustomsBrokersPage() {
  const router = useRouter();
  const [brokers, setBrokers] = useState<CustomsBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/transportation/customs/brokers");
        const data = (await res.json()) as CustomsBroker[];

        // IMPORTANT: Never synthesize “performance” in production.
        // In dev, we enrich empty API results to validate UI layouts.
        const enriched = (data || []).map((b) => {
          if (b.performance) return b;
          if (isProd()) return b;
          return {
            ...b,
            performance: {
              onTimeClearanceRate: stablePercent(`${b.id}-ot`, 88, 98),
              averageClearanceTime: stablePercent(`${b.id}-ct`, 1.5, 5.5),
              accuracyRate: stablePercent(`${b.id}-acc`, 90, 99),
              totalClearances: Math.round(
                stablePercent(`${b.id}-tc`, 50, 5000),
              ),
              customerSatisfaction: stablePercent(`${b.id}-csat`, 80, 98),
            },
          };
        });

        if (!mounted) return;
        setBrokers(enriched);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const performanceData = useMemo(
    () =>
      brokers.map((b) => ({
        name: b.name.split(" ")[0],
        onTimeRate: b.performance?.onTimeClearanceRate || 0,
        accuracyRate: b.performance?.accuracyRate || 0,
      })),
    [brokers],
  );

  return (
    <PageTemplate
      title="Customs Brokers"
      description="Manage customs brokers and track their performance"
      icon="ri-user-star-line"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load brokers: {error}
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Brokers
            </div>
            <div className="text-2xl font-bold mt-1">{brokers.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Brokers
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {brokers.filter((b) => b.status === "ACTIVE").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg On-Time Rate
            </div>
            <div className="text-2xl font-bold mt-1">
              {brokers.length === 0
                ? "0.0%"
                : `${(brokers.reduce((sum, b) => sum + (b.performance?.onTimeClearanceRate || 0), 0) / brokers.length).toFixed(1)}%`}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Clearances
            </div>
            <div className="text-2xl font-bold mt-1">
              {brokers
                .reduce(
                  (sum, b) => sum + (b.performance?.totalClearances || 0),
                  0,
                )
                .toLocaleString()}
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Broker Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="onTimeRate" fill="#3b82f6" name="On-Time Rate %" />
              <Bar
                dataKey="accuracyRate"
                fill="#10b981"
                name="Accuracy Rate %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Brokers List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customs Brokers</h3>
              <button
                onClick={() =>
                  router.push("/transportation/customs/brokers/new")
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Broker
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {brokers.map((broker) => (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{broker.name}</h4>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          broker.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : broker.status === "SUSPENDED"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {broker.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          License:
                        </span>{" "}
                        <span className="font-medium">
                          {broker.licenseNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Contact:
                        </span>{" "}
                        <span className="font-medium">
                          {broker.contactPerson}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Email:
                        </span>{" "}
                        <span className="font-medium">{broker.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Phone:
                        </span>{" "}
                        <span className="font-medium">{broker.phone}</span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          On-Time Rate
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {broker.performance.onTimeClearanceRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Avg Clearance Time
                        </div>
                        <div className="text-lg font-bold">
                          {broker.performance.averageClearanceTime} days
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Accuracy Rate
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {broker.performance.accuracyRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Total Clearances
                        </div>
                        <div className="text-lg font-bold">
                          {broker.performance.totalClearances.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Satisfaction
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          {broker.performance.customerSatisfaction}%
                        </div>
                      </div>
                    </div>

                    {/* Coverage */}
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Coverage</div>
                      <div className="flex flex-wrap gap-2">
                        {broker.coverage.countries.map((country, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded"
                          >
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/transportation/customs/brokers/${broker.id}`,
                      )
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/transportation/customs/brokers/${broker.id}/edit`,
                      )
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
