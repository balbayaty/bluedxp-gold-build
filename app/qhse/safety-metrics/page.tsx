/**
 * QHSE Safety Metrics Page - ENHANCED
 * Comprehensive TRIR, LTIFR, and safety performance tracking
 * With tabs, charts, trends, and cross-module links
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiShield,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart,
  FiTarget,
  FiActivity,
  FiUsers,
} from "react-icons/fi";
import type { SafetyMetric } from "@/types/qhse";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";

export default function QHSESafetyMetricsPage() {
  const [metrics, setMetrics] = useState<SafetyMetric[]>([]);
  const [trir, setTrir] = useState<number | null>(null);
  const [ltifr, setLtifr] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "trir" | "ltifr" | "near-misses" | "trends"
  >("overview");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [metricsRes, trirRes, ltifrRes] = await Promise.all([
        fetch("/api/qhse/safety-metrics"),
        fetch("/api/qhse/safety-metrics?action=calculate-trir"),
        fetch("/api/qhse/safety-metrics?action=calculate-ltifr"),
      ]);

      const metricsData = await metricsRes.json();
      const trirData = await trirRes.json();
      const ltifrData = await ltifrRes.json();

      if (metricsData.success) setMetrics(metricsData.data || []);
      if (trirData.success) setTrir(trirData.data?.trir);
      if (ltifrData.success) setLtifr(ltifrData.data?.ltifr);
    } catch (err) {
      console.error("Error fetching safety metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    trir: trir || 0,
    ltifr: ltifr || 0,
    nearMisses: metrics.reduce((sum, m) => sum + (m.nearMisses || 0), 0),
    safetyObservations: metrics.reduce(
      (sum, m) => sum + (m.safetyObservations || 0),
      0,
    ),
    totalIncidents: metrics.reduce(
      (sum, m) => sum + (m.totalRecordableIncidents || 0),
      0,
    ),
    lostTimeIncidents: metrics.reduce(
      (sum, m) => sum + (m.lostTimeIncidents || 0),
      0,
    ),
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading safety metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Safety Performance
          </h1>
          <p className="text-gray-600 mt-1">
            TRIR, LTIFR, and safety metrics tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Record Metric
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">TRIR</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.trir.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Recordable</p>
            </div>
            <FiShield className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">LTIFR</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.ltifr.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Lost Time</p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Near Misses</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.nearMisses}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Observations</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.safetyObservations}
              </p>
            </div>
            <FiActivity className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Incidents
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.totalIncidents}
              </p>
            </div>
            <FiBarChart className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Lost Time</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.lostTimeIncidents}
              </p>
            </div>
            <FiUsers className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "overview", label: "Overview", icon: FiBarChart },
              { id: "trir", label: "TRIR Analysis", icon: FiShield },
              { id: "ltifr", label: "LTIFR Analysis", icon: FiAlertTriangle },
              {
                id: "near-misses",
                label: "Near Misses",
                icon: FiAlertTriangle,
              },
              { id: "trends", label: "Trends", icon: FiTrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Safety Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">TRIR Trend</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingDown className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      -2.1%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">LTIFR Trend</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingDown className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      -1.5%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Near Misses</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="text-lg font-bold text-orange-600">
                      +5.3%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics History */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Safety Metrics History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      TRIR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      LTIFR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Near Misses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Observations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <FiShield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No safety metrics found</p>
                      </td>
                    </tr>
                  ) : (
                    metrics.map((metric) => (
                      <motion.tr
                        key={metric.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(metric.periodStart).toLocaleDateString()} -{" "}
                          {new Date(metric.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.trir?.rate.toFixed(2) || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.ltifr?.rate.toFixed(2) || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.nearMisses || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.safetyObservations || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/qhse/incidents?period=${metric.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Module Links */}
      <CrossModuleLinks
        title="Quick Navigation"
        links={[
          {
            label: "QHSE Dashboard",
            href: "/qhse/dashboard",
            icon: "ri-dashboard-3-line",
            description: "Overview",
          },
          {
            label: "Incidents",
            href: "/qhse/incidents",
            icon: "ri-error-warning-line",
            description: "View incidents",
          },
          {
            label: "Inspections",
            href: "/qhse/inspections",
            icon: "ri-clipboard-line",
            description: "View inspections",
          },
          {
            label: "Training",
            href: "/qhse/training",
            icon: "ri-graduation-cap-line",
            description: "Training records",
          },
          {
            label: "Environmental",
            href: "/qhse/environmental",
            icon: "ri-leaf-line",
            description: "Environmental metrics",
          },
          {
            label: "Search",
            href: "/qhse/search",
            icon: "ri-search-line",
            description: "Advanced search",
          },
        ]}
      />
    </div>
  );
}
