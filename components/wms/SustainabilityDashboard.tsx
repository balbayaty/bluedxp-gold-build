/**
 * Sustainability Dashboard
 * Mind-blowing ESG and sustainability tracking
 * Real-time • Interactive • Beautiful
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  sustainabilityService,
  type SustainabilityMetrics,
  type CarbonFootprint,
  type EnergyConsumption,
  type WasteTracking,
} from "@/lib/services/wms/sustainabilityService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface SustainabilityDashboardProps {
  warehouseId: string;
  warehouseName?: string;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function SustainabilityDashboard({
  warehouseId,
  warehouseName,
}: SustainabilityDashboardProps) {
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY",
  );

  useEffect(() => {
    loadMetrics();
  }, [warehouseId, selectedPeriod]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const sustainabilityMetrics =
        await sustainabilityService.getSustainabilityMetrics(warehouseId);
      setMetrics(sustainabilityMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const carbonData = [
    {
      name: "Energy",
      value: metrics.carbonFootprint.emissionsBySource.energy || 0,
    },
    {
      name: "Transportation",
      value: metrics.carbonFootprint.emissionsBySource.transportation || 0,
    },
    {
      name: "Waste",
      value: metrics.carbonFootprint.emissionsBySource.waste || 0,
    },
    {
      name: "Packaging",
      value: metrics.carbonFootprint.emissionsBySource.packaging || 0,
    },
  ];

  const energyData = [
    {
      name: "Electricity",
      value: metrics.energyConsumption.energyBySource.electricity || 0,
    },
    { name: "Gas", value: metrics.energyConsumption.energyBySource.gas || 0 },
    {
      name: "Solar",
      value: metrics.energyConsumption.energyBySource.solar || 0,
    },
  ];

  const wasteData = [
    {
      name: "Packaging",
      value: metrics.wasteTracking.wasteByType.packaging || 0,
    },
    { name: "Organic", value: metrics.wasteTracking.wasteByType.organic || 0 },
    {
      name: "Recyclable",
      value: metrics.wasteTracking.wasteByType.recyclable || 0,
    },
    { name: "Other", value: metrics.wasteTracking.wasteByType.other || 0 },
  ];

  const esgData = [
    { name: "Environmental", value: metrics.esgCompliance.environmental },
    { name: "Social", value: metrics.esgCompliance.social },
    { name: "Governance", value: metrics.esgCompliance.governance },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i className="ri-leaf-line text-green-500"></i>
            Sustainability Dashboard
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {warehouseName || warehouseId} • ESG Compliance & Carbon Tracking
          </p>
        </div>
        <div className="flex gap-2">
          {(["MONTHLY", "YEARLY"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90 mb-2">
              Overall Sustainability Score
            </div>
            <div className="text-6xl font-bold">
              {metrics.overallScore.toFixed(0)}
            </div>
            <div className="text-sm opacity-90 mt-2">out of 100</div>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🌱</div>
            <div className="text-sm opacity-90">ESG Compliant</div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {metrics.esgCompliance.environmental}
              </div>
              <div className="text-xs opacity-90 mt-1">Environmental</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.esgCompliance.social}
              </div>
              <div className="text-xs opacity-90 mt-1">Social</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {metrics.esgCompliance.governance}
              </div>
              <div className="text-xs opacity-90 mt-1">Governance</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-red-200 dark:border-red-900"
        >
          <div className="flex items-center justify-between mb-4">
            <i className="ri-fire-line text-3xl text-red-500"></i>
            <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
              Carbon
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.carbonFootprint.totalEmissions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            kg CO₂ equivalent
          </div>
          {metrics.carbonFootprint.progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress to target</span>
                <span>{metrics.carbonFootprint.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(metrics.carbonFootprint.progress, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-900"
        >
          <div className="flex items-center justify-between mb-4">
            <i className="ri-flashlight-line text-3xl text-blue-500"></i>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
              Energy
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.energyConsumption.totalEnergy.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            kWh
          </div>
          {metrics.energyConsumption.progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress to target</span>
                <span>{metrics.energyConsumption.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(metrics.energyConsumption.progress, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-green-200 dark:border-green-900"
        >
          <div className="flex items-center justify-between mb-4">
            <i className="ri-recycle-line text-3xl text-green-500"></i>
            <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
              Waste
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.wasteTracking.totalWaste.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            kg
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Recycled</span>
              <span>
                {metrics.wasteTracking.recycledPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${metrics.wasteTracking.recycledPercentage}%`,
                }}
              ></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Emissions Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Carbon Emissions Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={carbonData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {carbonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Energy Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Energy Sources
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Certifications & Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="ri-award-line text-yellow-500"></i>
            Certifications
          </h4>
          <div className="space-y-3">
            {metrics.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <i className="ri-verified-badge-line text-yellow-500"></i>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {cert}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Improvement Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="ri-lightbulb-line text-blue-500"></i>
            Improvement Recommendations
          </h4>
          <div className="space-y-3">
            {metrics.improvements.map((improvement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  improvement.priority === "HIGH"
                    ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20"
                    : improvement.priority === "MEDIUM"
                      ? "border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {improvement.area}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      improvement.priority === "HIGH"
                        ? "bg-red-500 text-white"
                        : improvement.priority === "MEDIUM"
                          ? "bg-yellow-500 text-white"
                          : "bg-blue-500 text-white"
                    }`}
                  >
                    {improvement.priority}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {improvement.action}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Expected Impact: {improvement.expectedImpact}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
