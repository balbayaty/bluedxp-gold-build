/**
 * QHSE Environmental Metrics Page - ENHANCED
 * Comprehensive environmental monitoring and tracking
 * With tabs, charts, trends, and cross-module links
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiDroplet,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart,
  FiFeather,
  FiZap,
  FiActivity,
} from "react-icons/fi";
import type { EnvironmentalMetric } from "@/types/qhse";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";
import { PremiumLoader } from "@/components/loading";

export default function QHSEEnvironmentalPage() {
  const [metrics, setMetrics] = useState<EnvironmentalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "carbon" | "waste" | "energy" | "water" | "trends"
  >("overview");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, [selectedType, activeTab]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      let url = "/api/qhse/environmental";
      const params = new URLSearchParams();

      if (activeTab === "carbon") {
        params.append("metricType", "CARBON_FOOTPRINT");
      } else if (activeTab === "waste") {
        params.append(
          "metricType",
          "WASTE_GENERATION,WASTE_DIVERSION,RECYCLING_RATE",
        );
      } else if (activeTab === "energy") {
        params.append("metricType", "ENERGY_CONSUMPTION");
      } else if (activeTab === "water") {
        params.append("metricType", "WATER_USAGE");
      }

      if (selectedType !== "all" && activeTab === "overview") {
        params.append("metricType", selectedType);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching environmental metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const metricTypes = [
    "all",
    "CARBON_FOOTPRINT",
    "WASTE_GENERATION",
    "WASTE_DIVERSION",
    "ENERGY_CONSUMPTION",
    "WATER_USAGE",
    "RECYCLING_RATE",
  ];

  const stats = {
    total: metrics.length,
    carbonFootprint: metrics
      .filter((m) => m.metricType === "CARBON_FOOTPRINT")
      .reduce((sum, m) => sum + (m.value || 0), 0),
    wasteGenerated: metrics
      .filter((m) => m.metricType === "WASTE_GENERATION")
      .reduce((sum, m) => sum + (m.value || 0), 0),
    recyclingRate:
      metrics.filter((m) => m.metricType === "RECYCLING_RATE").length > 0
        ? metrics
            .filter((m) => m.metricType === "RECYCLING_RATE")
            .reduce((sum, m) => sum + (m.value || 0), 0) /
          metrics.filter((m) => m.metricType === "RECYCLING_RATE").length
        : 0,
    energyConsumption: metrics
      .filter((m) => m.metricType === "ENERGY_CONSUMPTION")
      .reduce((sum, m) => sum + (m.value || 0), 0),
    waterUsage: metrics
      .filter((m) => m.metricType === "WATER_USAGE")
      .reduce((sum, m) => sum + (m.value || 0), 0),
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a]">
        <PremiumLoader
          message="Loading environmental metrics..."
          size="xl"
          variant="default"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Environmental Metrics
          </h1>
          <p className="text-gray-600 mt-1">
            Track and monitor environmental performance
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Metrics</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <FiBarChart className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Carbon Footprint
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.carbonFootprint.toFixed(1)}
              </p>
            </div>
            <FiActivity className="w-8 h-8 text-gray-500" />
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
              <p className="text-sm font-medium text-gray-500">
                Waste Generated
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.wasteGenerated.toFixed(1)}
              </p>
            </div>
            <FiFeather className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Recycling Rate
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.recyclingRate.toFixed(1)}%
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Energy</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.energyConsumption.toFixed(1)}
              </p>
            </div>
            <FiZap className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Water Usage</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.waterUsage.toFixed(1)}
              </p>
            </div>
            <FiDroplet className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: "overview", label: "Overview", icon: FiBarChart },
              { id: "carbon", label: "Carbon Footprint", icon: FiActivity },
              { id: "waste", label: "Waste Management", icon: FiFeather },
              { id: "energy", label: "Energy", icon: FiZap },
              { id: "water", label: "Water", icon: FiDroplet },
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
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search metrics..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {activeTab === "overview" && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                {metricTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Environmental Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Carbon Trend</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingDown className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      -5.2%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Waste Reduction</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingDown className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      -3.1%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-500">Energy Efficiency</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FiTrendingUp className="w-5 h-5 text-red-600" />
                    <span className="text-lg font-bold text-red-600">
                      +2.4%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FiDroplet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No environmental metrics found
                </p>
                <button className="text-blue-600 hover:text-blue-800">
                  Record your first metric
                </button>
              </div>
            ) : (
              metrics
                .filter(
                  (m) =>
                    !searchQuery ||
                    m.metricType
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                )
                .map((metric) => (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {metric.metricType.replace(/_/g, " ")}
                      </h3>
                      {metric.trend && (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                            metric.trend === "DECREASING"
                              ? "bg-green-100 text-green-800"
                              : metric.trend === "INCREASING"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {metric.trend === "DECREASING" ? (
                            <FiTrendingDown className="w-3 h-3" />
                          ) : (
                            <FiTrendingUp className="w-3 h-3" />
                          )}
                          {metric.trend}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {metric.value}
                        </p>
                        <p className="text-sm text-gray-500">{metric.unit}</p>
                      </div>
                      {metric.target && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Target</span>
                            <span className="text-gray-900">
                              {metric.target} {metric.unit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                metric.value <= metric.target
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }`}
                              style={{
                                width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {metric.changePercentage !== undefined && (
                        <p
                          className={`text-sm mt-2 flex items-center gap-1 ${
                            metric.changePercentage < 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {metric.changePercentage < 0 ? (
                            <FiTrendingDown className="w-4 h-4" />
                          ) : (
                            <FiTrendingUp className="w-4 h-4" />
                          )}
                          {metric.changePercentage > 0 ? "+" : ""}
                          {metric.changePercentage.toFixed(1)}% change
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Period:{" "}
                        {new Date(metric.periodStart).toLocaleDateString()} -{" "}
                        {new Date(metric.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
            )}
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
            label: "ESG Reporting",
            href: "/qhse/esg",
            icon: "ri-global-line",
            description: "ESG metrics",
          },
          {
            label: "Safety Metrics",
            href: "/qhse/safety-metrics",
            icon: "ri-shield-check-line",
            description: "Safety performance",
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
