/**
 * 🎯 SMART QHSE STATISTICS BOARD
 * Comprehensive QHSE Statistics Board based on FLEX Logistics Smart QHSE Statistics Board
 * Aligned with ISO 9001:2015, ISO 45001:2018, ISO 14001:2015
 *
 * Features:
 * - All 26+ KPIs from the original document
 * - Multi-level support (Tenant > Customer > Facility > Warehouse)
 * - Modern, sexy, compliant visualizations
 * - Real-time updates
 * - Interconnected with entire BlueDXP app
 * - No duplication - enhances existing QHSE module
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiCheckCircle,
  FiAlertTriangle,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiUsers,
  FiZap,
  FiDroplet,
  FiRecycle,
  FiAward,
  FiFileText,
  FiClipboard,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiEye,
  FiLayers,
  FiDatabase,
  FiLink,
  FiCpu,
  FiGlobe,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface SmartQHSEStatisticsBoardProps {
  tenantId?: string;
  customerId?: string;
  facilityId?: string;
  warehouseId?: string;
  level?: "TENANT" | "CUSTOMER" | "FACILITY" | "WAREHOUSE";
  period?: "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";
  startDate?: Date;
  endDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface KPI {
  id: string;
  category: "SAFETY" | "QUALITY" | "ENVIRONMENTAL" | "TRAINING" | "COMPLIANCE";
  name: string;
  current: number;
  cumulative: number;
  improvement: number;
  target: number;
  benchmark: number;
  formula: string;
  unit: string;
  trend: "UP" | "DOWN" | "STABLE";
  status: "EXCELLENT" | "GOOD" | "AVERAGE" | "BELOW_AVERAGE" | "POOR";
}

interface StatisticsData {
  period: {
    start: string;
    end: string;
    type: string;
  };
  level: string;
  context: {
    tenantId?: string;
    customerId?: string;
    facilityId?: string;
    warehouseId?: string;
  };
  safety: {
    trir: KPI;
    ltifr: KPI;
    nearMissReports: KPI;
    workplaceAccidents: KPI;
    safetyObservations: KPI;
    correctiveActionsClosed: KPI;
  };
  quality: {
    defectRate: KPI;
    customerComplaintsResolved: KPI;
    onTimeDelivery: KPI;
    internalAuditsCompleted: KPI;
    processNonConformitiesClosed: KPI;
  };
  environmental: {
    carbonFootprint: KPI;
    wasteReduction: KPI;
    energyConsumption: KPI;
    waterUsage: KPI;
    recyclingEfficiency: KPI;
  };
  training: {
    qhseTrainingCompletion: KPI;
    toolboxTalksConducted: KPI;
    hseInductionCompletion: KPI;
    safetyWalksCompleted: KPI;
    employeeParticipation: KPI;
  };
  compliance: {
    regulatoryAuditsCompleted: KPI;
    nonConformitiesIdentified: KPI;
    capaClosed: KPI;
    supplierComplianceScore: KPI;
    customerSatisfactionRating: KPI;
  };
  trends: {
    daily: Array<{ date: string; [key: string]: any }>;
    weekly: Array<{ week: string; [key: string]: any }>;
    monthly: Array<{ month: string; [key: string]: any }>;
  };
}

const SmartQHSEStatisticsBoard: React.FC<SmartQHSEStatisticsBoardProps> = ({
  tenantId,
  customerId,
  facilityId,
  warehouseId,
  level = "TENANT",
  period = "MONTH",
  startDate,
  endDate,
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "SAFETY" | "QUALITY" | "ENVIRONMENTAL" | "TRAINING" | "COMPLIANCE"
  >("ALL");
  const [viewMode, setViewMode] = useState<
    "OVERVIEW" | "DETAILED" | "TRENDS" | "COMPARISON" | "INTELLIGENT"
  >("OVERVIEW");
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [intelligentInsights, setIntelligentInsights] = useState<{
    risks?: any;
    anomalies?: any[];
    recommendations?: any[];
    benchmarks?: any[];
  } | null>(null);
  const [showIntelligentPanel, setShowIntelligentPanel] = useState(true);

  // Load statistics data
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append("tenantId", tenantId);
      if (customerId) params.append("customerId", customerId);
      if (facilityId) params.append("facilityId", facilityId);
      if (warehouseId) params.append("warehouseId", warehouseId);
      params.append("level", level);
      params.append("period", period);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const [statisticsRes, intelligentRes] = await Promise.all([
        fetch(`/api/qhse/statistics?${params.toString()}`),
        fetch(`/api/qhse/intelligent?type=all&${params.toString()}`),
      ]);

      const [statisticsResult, intelligentResult] = await Promise.all([
        statisticsRes.json(),
        intelligentRes.json(),
      ]);

      if (statisticsResult.success) {
        setData(statisticsResult.data);
      }

      if (intelligentResult.success) {
        setIntelligentInsights(intelligentResult.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load QHSE statistics:", error);
    } finally {
      setLoading(false);
    }
  }, [
    tenantId,
    customerId,
    facilityId,
    warehouseId,
    level,
    period,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    loadStatistics();

    if (autoRefresh) {
      const interval = setInterval(loadStatistics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadStatistics, autoRefresh, refreshInterval]);

  // Get all KPIs
  const allKPIs = useMemo(() => {
    if (!data) return [];
    return [
      ...Object.values(data.safety),
      ...Object.values(data.quality),
      ...Object.values(data.environmental),
      ...Object.values(data.training),
      ...Object.values(data.compliance),
    ];
  }, [data]);

  // Filter KPIs by category
  const filteredKPIs = useMemo(() => {
    if (selectedCategory === "ALL") return allKPIs;
    return allKPIs.filter((kpi) => kpi.category === selectedCategory);
  }, [allKPIs, selectedCategory]);

  // Get status color
  const getStatusColor = (status: KPI["status"]) => {
    switch (status) {
      case "EXCELLENT":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "GOOD":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
      case "AVERAGE":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "BELOW_AVERAGE":
        return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20";
      case "POOR":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: KPI["trend"]) => {
    switch (trend) {
      case "UP":
        return <FiTrendingUp className="w-4 h-4 text-green-600" />;
      case "DOWN":
        return <FiTrendingDown className="w-4 h-4 text-red-600" />;
      case "STABLE":
        return <FiActivity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: KPI["category"]) => {
    switch (category) {
      case "SAFETY":
        return <FiShield className="w-5 h-5" />;
      case "QUALITY":
        return <FiTarget className="w-5 h-5" />;
      case "ENVIRONMENTAL":
        return <FiDroplet className="w-5 h-5" />;
      case "TRAINING":
        return <FiUsers className="w-5 h-5" />;
      case "COMPLIANCE":
        return <FiAward className="w-5 h-5" />;
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    return filteredKPIs.map((kpi) => ({
      name: kpi.name.substring(0, 20),
      current: kpi.current,
      target: kpi.target,
      benchmark: kpi.benchmark,
      improvement: kpi.improvement,
    }));
  }, [data, filteredKPIs]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading QHSE Statistics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        No statistics data available
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FiShield className="w-8 h-8 text-blue-600" />
            Smart QHSE Statistics Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ISO 9001:2015 • ISO 45001:2018 • ISO 14001:2015 Compliant
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <FiLayers className="w-4 h-4" />
              Level: {level}
            </span>
            <span className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              Period: {period}
            </span>
            <span className="flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="text-sm border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="ALL">All Categories</option>
            <option value="SAFETY">Safety</option>
            <option value="QUALITY">Quality</option>
            <option value="ENVIRONMENTAL">Environmental</option>
            <option value="TRAINING">Training</option>
            <option value="COMPLIANCE">Compliance</option>
          </select>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="text-sm border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="OVERVIEW">Overview</option>
            <option value="DETAILED">Detailed</option>
            <option value="TRENDS">Trends</option>
            <option value="COMPARISON">Comparison</option>
            <option value="INTELLIGENT">🤖 AI Insights</option>
          </select>

          <button
            onClick={loadStatistics}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Cards - Key Metrics */}
      {viewMode === "OVERVIEW" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Safety KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6 border border-red-200 dark:border-red-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiShield className="w-6 h-6 text-red-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Safety
                </h3>
              </div>
              {getTrendIcon(data.safety.trir.trend)}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">TRIR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.safety.trir.current.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Target: {data.safety.trir.target}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className={getStatusColor(data.safety.trir.status)}>
                  {data.safety.trir.status}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {data.safety.trir.improvement > 0 ? "+" : ""}
                  {data.safety.trir.improvement.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quality KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiTarget className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Quality
                </h3>
              </div>
              {getTrendIcon(data.quality.defectRate.trend)}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Defect Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.quality.defectRate.current.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">
                  Target: ≤{data.quality.defectRate.target}%
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span
                  className={getStatusColor(data.quality.defectRate.status)}
                >
                  {data.quality.defectRate.status}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {data.quality.defectRate.improvement > 0 ? "+" : ""}
                  {data.quality.defectRate.improvement.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Environmental KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiDroplet className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Environmental
                </h3>
              </div>
              {getTrendIcon(data.environmental.carbonFootprint.trend)}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Carbon Footprint
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.environmental.carbonFootprint.current.toFixed(2)}{" "}
                  {data.environmental.carbonFootprint.unit}
                </p>
                <p className="text-xs text-gray-500">
                  Target: ≤{data.environmental.carbonFootprint.target}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span
                  className={getStatusColor(
                    data.environmental.carbonFootprint.status,
                  )}
                >
                  {data.environmental.carbonFootprint.status}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {data.environmental.carbonFootprint.improvement > 0
                    ? "+"
                    : ""}
                  {data.environmental.carbonFootprint.improvement.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Compliance KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiAward className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Compliance
                </h3>
              </div>
              {getTrendIcon(data.compliance.regulatoryAuditsCompleted.trend)}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Audits Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.compliance.regulatoryAuditsCompleted.current}%
                </p>
                <p className="text-xs text-gray-500">
                  Target: {data.compliance.regulatoryAuditsCompleted.target}%
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span
                  className={getStatusColor(
                    data.compliance.regulatoryAuditsCompleted.status,
                  )}
                >
                  {data.compliance.regulatoryAuditsCompleted.status}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {data.compliance.regulatoryAuditsCompleted.improvement > 0
                    ? "+"
                    : ""}
                  {data.compliance.regulatoryAuditsCompleted.improvement.toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed KPI Table */}
      {viewMode === "DETAILED" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cumulative
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Improvement
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Benchmark
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredKPIs.map((kpi, index) => (
                  <tr
                    key={kpi.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(kpi.category)}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {kpi.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {kpi.current.toFixed(2)} {kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                      {kpi.cumulative.toFixed(2)} {kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(kpi.trend)}
                        <span
                          className={`text-sm font-medium ${
                            kpi.improvement > 0
                              ? "text-green-600"
                              : kpi.improvement < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {kpi.improvement > 0 ? "+" : ""}
                          {kpi.improvement.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                      {kpi.target} {kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-500">
                      {kpi.benchmark} {kpi.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kpi.status)}`}
                      >
                        {kpi.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === "TRENDS" && data.trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Monthly Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="trir"
                  stroke="#ef4444"
                  name="TRIR"
                />
                <Line
                  type="monotone"
                  dataKey="ltifr"
                  stroke="#f59e0b"
                  name="LTIFR"
                />
                <Line
                  type="monotone"
                  dataKey="defectRate"
                  stroke="#3b82f6"
                  name="Defect Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              KPI Performance vs Target
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
                <Bar dataKey="target" fill="#10b981" name="Target" />
                <Bar dataKey="benchmark" fill="#f59e0b" name="Benchmark" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === "COMPARISON" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current vs Target vs Benchmark
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Target"
                dataKey="target"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Radar
                name="Benchmark"
                dataKey="benchmark"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Intelligent AI Insights View */}
      {viewMode === "INTELLIGENT" && intelligentInsights && (
        <div className="space-y-6">
          {/* Risk Prediction */}
          {intelligentInsights.risks && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl shadow-lg border-2 border-red-200 dark:border-red-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FiCpu className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    AI Risk Prediction
                  </h3>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-bold text-white ${
                    intelligentInsights.risks.overallRisk === "CRITICAL"
                      ? "bg-red-600"
                      : intelligentInsights.risks.overallRisk === "HIGH"
                        ? "bg-orange-600"
                        : intelligentInsights.risks.overallRisk === "MEDIUM"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                  }`}
                >
                  {intelligentInsights.risks.overallRisk} RISK
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Risk Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {intelligentInsights.risks.riskScore.toFixed(0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Confidence
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {intelligentInsights.risks.confidence}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Risk Factors
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {intelligentInsights.risks.riskFactors.length}
                  </p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Risk Factors
                </h4>
                {intelligentInsights.risks.riskFactors.map((factor: any) => (
                  <div
                    key={factor.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {factor.factor}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          factor.severity === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : factor.severity === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : factor.severity === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                        }`}
                      >
                        {factor.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {factor.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Likelihood: {factor.likelihood}%</span>
                      <span>Impact: {factor.impact}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Predicted Incidents */}
              {intelligentInsights.risks.predictedIncidents &&
                intelligentInsights.risks.predictedIncidents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Predicted Incidents
                    </h4>
                    <div className="space-y-2">
                      {intelligentInsights.risks.predictedIncidents.map(
                        (incident: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-orange-500"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {incident.type}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {incident.likelihood}% likelihood in{" "}
                                {incident.timeframe}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {incident.contributingFactors?.join(", ")}
                            </p>
                            <div className="text-xs text-gray-500">
                              Prevention: {incident.preventionActions?.[0]}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </motion.div>
          )}

          {/* Anomalies */}
          {intelligentInsights.anomalies &&
            intelligentInsights.anomalies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FiAlertTriangle className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Anomaly Detection
                  </h3>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                    {intelligentInsights.anomalies.length} Detected
                  </span>
                </div>
                <div className="space-y-3">
                  {intelligentInsights.anomalies.map((anomaly: any) => (
                    <div
                      key={anomaly.id}
                      className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {anomaly.metric}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            anomaly.severity === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : anomaly.severity === "HIGH"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Expected: {anomaly.expectedValue?.toFixed(2)}, Actual:{" "}
                        {anomaly.actualValue?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Deviation: {anomaly.deviationPercentage > 0 ? "+" : ""}
                        {anomaly.deviationPercentage?.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          {/* Recommendations */}
          {intelligentInsights.recommendations &&
            intelligentInsights.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FiTarget className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    AI Recommendations
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    {intelligentInsights.recommendations.length} Recommendations
                  </span>
                </div>
                <div className="space-y-4">
                  {intelligentInsights.recommendations
                    .sort((a: any, b: any) => {
                      const priorityOrder: Record<string, number> = {
                        CRITICAL: 4,
                        HIGH: 3,
                        MEDIUM: 2,
                        LOW: 1,
                      };
                      return (
                        (priorityOrder[b.priority] || 0) -
                        (priorityOrder[a.priority] || 0)
                      );
                    })
                    .map((rec: any) => (
                      <div
                        key={rec.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {rec.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {rec.description}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              rec.priority === "CRITICAL"
                                ? "bg-red-100 text-red-800"
                                : rec.priority === "HIGH"
                                  ? "bg-orange-100 text-orange-800"
                                  : rec.priority === "MEDIUM"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                          <span>
                            Impact:{" "}
                            {rec.impact?.riskReduction ||
                              rec.impact?.complianceImprovement ||
                              0}
                            %
                          </span>
                          <span>Effort: {rec.effort}</span>
                          <span>Time: {rec.estimatedTime}</span>
                          <span>Confidence: {rec.confidence}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

          {/* Benchmarks */}
          {intelligentInsights.benchmarks &&
            intelligentInsights.benchmarks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FiAward className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Industry Benchmarks
                  </h3>
                </div>
                <div className="space-y-4">
                  {intelligentInsights.benchmarks.map((benchmark: any) => (
                    <div
                      key={benchmark.metric}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {benchmark.metric}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            benchmark.benchmark === "EXCELLENT"
                              ? "bg-green-100 text-green-800"
                              : benchmark.benchmark === "GOOD"
                                ? "bg-blue-100 text-blue-800"
                                : benchmark.benchmark === "AVERAGE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {benchmark.benchmark} ({benchmark.ourPercentile}th
                          percentile)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Our Value
                          </p>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {benchmark.ourValue?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Industry Avg
                          </p>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {benchmark.industryAverage?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Top 10%
                          </p>
                          <p className="font-bold text-green-600">
                            {benchmark.industryTop10?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Gap
                          </p>
                          <p
                            className={`font-bold ${benchmark.gap > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {benchmark.gap > 0 ? "+" : ""}
                            {benchmark.gap?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {benchmark.bestPractices &&
                        benchmark.bestPractices.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Best Practices:
                            </p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {benchmark.bestPractices
                                .slice(0, 2)
                                .map((practice: string, idx: number) => (
                                  <li key={idx}>• {practice}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
        </div>
      )}
    </div>
  );
};

export default SmartQHSEStatisticsBoard;
