"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface DataMiningResult {
  id: string;
  analysisType:
    | "PATTERN"
    | "ANOMALY"
    | "PREDICTION"
    | "CLUSTERING"
    | "ASSOCIATION"
    | "TREND";
  title: string;
  description: string;
  confidence: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  category:
    | "INVENTORY"
    | "ORDERS"
    | "SUPPLY_CHAIN"
    | "CUSTOMER"
    | "FINANCIAL"
    | "OPERATIONAL";
  findings: Array<{
    metric: string;
    value: number;
    trend: "UP" | "DOWN" | "STABLE";
    significance: number;
  }>;
  recommendations: string[];
  dataSource: string[];
  generatedAt: Date | string;
  status: "NEW" | "REVIEWED" | "ACTED_UPON" | "ARCHIVED";
}

const generateDataMiningResults = (count: number = 50): DataMiningResult[] => {
  const templates = [
    {
      type: "PATTERN" as const,
      title: "Seasonal Demand Pattern Detected",
      description: "Strong seasonal pattern identified in material consumption",
      findings: [
        "Peak demand in Q4",
        "Low demand in Q2",
        "15% variance from baseline",
      ],
    },
    {
      type: "ANOMALY" as const,
      title: "Unusual Inventory Movement",
      description: "Abnormal stock movement detected in specific location",
      findings: [
        "30% increase in movement",
        "Unusual time pattern",
        "Potential data quality issue",
      ],
    },
    {
      type: "PREDICTION" as const,
      title: "Stockout Risk Prediction",
      description: "High probability of stockout for critical materials",
      findings: ["5 materials at risk", "7-day forecast", "85% confidence"],
    },
    {
      type: "CLUSTERING" as const,
      title: "Customer Segmentation",
      description:
        "Natural customer clusters identified based on ordering behavior",
      findings: [
        "3 distinct segments",
        "High-value customers",
        "Seasonal buyers",
      ],
    },
    {
      type: "ASSOCIATION" as const,
      title: "Material Association Rules",
      description:
        "Strong associations found between frequently ordered materials",
      findings: [
        "Material A + Material B (85% co-occurrence)",
        "Bundle opportunity",
        "Cross-sell potential",
      ],
    },
    {
      type: "TREND" as const,
      title: "Order Volume Trend Analysis",
      description: "Significant upward trend in order volumes",
      findings: [
        "20% YoY growth",
        "Accelerating trend",
        "Peak season approaching",
      ],
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const category: DataMiningResult["category"] = [
      "INVENTORY",
      "ORDERS",
      "SUPPLY_CHAIN",
      "CUSTOMER",
      "FINANCIAL",
      "OPERATIONAL",
    ][Math.floor(Math.random() * 6)] as any;
    const impact: DataMiningResult["impact"] = ["HIGH", "MEDIUM", "LOW"][
      Math.floor(Math.random() * 3)
    ] as any;
    const status: DataMiningResult["status"] = [
      "NEW",
      "REVIEWED",
      "ACTED_UPON",
      "ARCHIVED",
    ][Math.floor(Math.random() * 4)] as any;
    const confidence = Math.random() * 30 + 70;

    return {
      id: `DM-${String(i + 1).padStart(6, "0")}`,
      analysisType: template.type,
      title: template.title,
      description: template.description,
      confidence: parseFloat(confidence.toFixed(1)),
      impact,
      category,
      findings: template.findings.map((finding, idx) => ({
        metric: typeof finding === "string" ? finding : `Metric ${idx + 1}`,
        value: Math.random() * 100,
        trend: ["UP", "DOWN", "STABLE"][Math.floor(Math.random() * 3)] as
          | "UP"
          | "DOWN"
          | "STABLE",
        significance: Math.random() * 50 + 50,
      })),
      recommendations: [
        "Review inventory levels",
        "Adjust reorder points",
        "Monitor closely",
        "Consider automation",
      ].slice(0, Math.floor(Math.random() * 3) + 2),
      dataSource: ["Sales Orders", "Inventory", "Purchase Orders"],
      generatedAt: new Date(Date.now() - Math.random() * 30 * 86400000),
      status,
    };
  });
};

export default function DataMining() {
  const [results, setResults] = useState<DataMiningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedImpact, setSelectedImpact] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "insights"
  >("grid");
  const [selectedResult, setSelectedResult] = useState<DataMiningResult | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalResults: 0,
    newInsights: 0,
    highImpact: 0,
    avgConfidence: 0,
  });

  // Fetch data mining results from API
  useEffect(() => {
    const fetchDataMiningResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get tenantId from localStorage or use default
        const tenantId = localStorage.getItem("tenantId") || "default-tenant";

        const response = await fetch("/api/intelligence-analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "data-mining",
            tenantId,
            algorithms: [
              "pattern",
              "anomaly",
              "clustering",
              "association",
              "trend",
            ],
            timeRange: {
              start: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000,
              ).toISOString(), // Last 30 days
              end: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data mining results");
        }

        const data = await response.json();

        // Transform API results to match DataMiningResult interface
        const transformedResults: DataMiningResult[] = (data.results || []).map(
          (result: any) => ({
            id:
              result.id ||
              `dm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            analysisType: result.analysisType || "PATTERN",
            title: result.title || "Data Mining Insight",
            description: result.description || "",
            confidence: result.confidence || 0,
            impact: result.impact || "MEDIUM",
            category: result.category || "OPERATIONAL",
            findings: result.findings || [],
            recommendations: result.recommendations || [],
            dataSource: result.sourceModules || [],
            generatedAt: result.generatedAt || new Date(),
            status: "NEW" as const, // Default status
          }),
        );

        // If no results, use mock data as fallback (for demo purposes)
        if (transformedResults.length === 0) {
          console.warn(
            "No data mining results found, using mock data for demonstration",
          );
          setResults(generateDataMiningResults(20));
        } else {
          setResults(transformedResults);
        }
      } catch (err) {
        console.error("Error fetching data mining results:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load data mining results",
        );
        // Fallback to mock data on error (for demo purposes)
        setResults(generateDataMiningResults(20));
      } finally {
        setLoading(false);
      }
    };

    fetchDataMiningResults();
  }, []);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesSearch =
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "ALL" || result.analysisType === selectedType;
      const matchesCategory =
        selectedCategory === "ALL" || result.category === selectedCategory;
      const matchesImpact =
        selectedImpact === "ALL" || result.impact === selectedImpact;
      const matchesStatus =
        selectedStatus === "ALL" || result.status === selectedStatus;
      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesImpact &&
        matchesStatus
      );
    });
  }, [
    results,
    searchQuery,
    selectedType,
    selectedCategory,
    selectedImpact,
    selectedStatus,
  ]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.analysisType] = (counts[r.analysisType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [results]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      category: category.replace(/_/g, " "),
      count,
    }));
  }, [results]);

  const confidenceScatter = useMemo(() => {
    return results.map((r) => ({
      confidence: r.confidence,
      impact: r.impact === "HIGH" ? 3 : r.impact === "MEDIUM" ? 2 : 1,
      category: r.category,
    }));
  }, [results]);

  const aggregateStats = useMemo(() => {
    const totalResults = results.length;
    const newInsights = results.filter((r) => r.status === "NEW").length;
    const highImpact = results.filter((r) => r.impact === "HIGH").length;
    const avgConfidence =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0;

    return {
      totalResults,
      newInsights,
      highImpact,
      avgConfidence: parseFloat(avgConfidence.toFixed(1)),
    };
  }, [results]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "data-mining-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "data-mining-stats",
      () => ({
        totalResults: aggregateStats.totalResults,
        newInsights: simulateKPIUpdates(aggregateStats.newInsights, 0.1),
        highImpact: simulateKPIUpdates(aggregateStats.highImpact, 0.05),
        avgConfidence: simulateKPIUpdates(aggregateStats.avgConfidence, 0.02),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalResults,
    aggregateStats.newInsights,
    aggregateStats.highImpact,
    aggregateStats.avgConfidence,
  ]);

  const stats = [
    {
      label: "Total Insights",
      value: realTimeEnabled
        ? realTimeStats.totalResults
        : aggregateStats.totalResults,
      icon: "ri-brain-line",
      tooltip: "Total data mining insights",
      trend: "up" as const,
    },
    {
      label: "New Insights",
      value: realTimeEnabled
        ? realTimeStats.newInsights
        : aggregateStats.newInsights,
      icon: "ri-lightbulb-line",
      tooltip: "New insights to review",
      trend: "neutral" as const,
    },
    {
      label: "High Impact",
      value: realTimeEnabled
        ? realTimeStats.highImpact
        : aggregateStats.highImpact,
      icon: "ri-fire-line",
      tooltip: "High impact insights",
      trend: "up" as const,
    },
    {
      label: "Avg Confidence",
      value: `${(realTimeEnabled ? realTimeStats.avgConfidence : aggregateStats.avgConfidence).toFixed(1)}%`,
      icon: "ri-bar-chart-box-line",
      tooltip: "Average confidence level",
      trend: "up" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (result: DataMiningResult) => {
    setSelectedResult(result);
    setShowViewModal(true);
  };

  const handleStatusChange = (
    result: DataMiningResult,
    newStatus: DataMiningResult["status"],
  ) => {
    setResults((prev) =>
      prev.map((r) => (r.id === result.id ? { ...r, status: newStatus } : r)),
    );
  };

  return (
    <PageTemplate
      title="Data Mining & Analytics"
      description="Advanced data mining with pattern detection, anomaly identification, predictive analytics, clustering, association rules, and trend analysis"
      icon="ri-brain-line"
      systemInfo={{
        sap: "Data Mining, Predictive Analytics",
        oracle: "Data Mining, Predictive Analytics",
        manhattan: "Data Mining, Predictive Analytics",
      }}
      examples={[
        "Pattern detection",
        "Anomaly identification",
        "Predictive analytics",
        "Customer clustering",
        "Association rules",
        "Trend analysis",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("insights")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "insights"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Insights View"
            >
              <i className="ri-lightbulb-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              setError(null);
              const tenantId =
                localStorage.getItem("tenantId") || "default-tenant";
              try {
                const response = await fetch("/api/intelligence-analytics", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "data-mining",
                    tenantId,
                    algorithms: [
                      "pattern",
                      "anomaly",
                      "clustering",
                      "association",
                      "trend",
                    ],
                    timeRange: {
                      start: new Date(
                        Date.now() - 30 * 24 * 60 * 60 * 1000,
                      ).toISOString(),
                      end: new Date().toISOString(),
                    },
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  const transformedResults: DataMiningResult[] = (
                    data.results || []
                  ).map((result: any) => ({
                    id:
                      result.id ||
                      `dm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    analysisType: result.analysisType || "PATTERN",
                    title: result.title || "Data Mining Insight",
                    description: result.description || "",
                    confidence: result.confidence || 0,
                    impact: result.impact || "MEDIUM",
                    category: result.category || "OPERATIONAL",
                    findings: result.findings || [],
                    recommendations: result.recommendations || [],
                    dataSource: result.sourceModules || [],
                    generatedAt: result.generatedAt || new Date(),
                    status: "NEW" as const,
                  }));
                  setResults(
                    transformedResults.length > 0
                      ? transformedResults
                      : generateDataMiningResults(20),
                  );
                }
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to refresh",
                );
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 disabled:opacity-50"
            title="Refresh Data Mining Results"
          >
            <i
              className={`ri-refresh-line mr-1 ${loading ? "animate-spin" : ""}`}
            ></i>
            Refresh
          </button>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin mb-4"></i>
            <p className="text-[#9ca3af]">Loading data mining results...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-error-warning-line text-red-400"></i>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Filters */}
      {!loading && (
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
          >
            <option value="ALL">All Types</option>
            <option value="PATTERN">Pattern</option>
            <option value="ANOMALY">Anomaly</option>
            <option value="PREDICTION">Prediction</option>
            <option value="CLUSTERING">Clustering</option>
            <option value="ASSOCIATION">Association</option>
            <option value="TREND">Trend</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
          >
            <option value="ALL">All Categories</option>
            <option value="INVENTORY">Inventory</option>
            <option value="ORDERS">Orders</option>
            <option value="SUPPLY_CHAIN">Supply Chain</option>
            <option value="CUSTOMER">Customer</option>
            <option value="FINANCIAL">Financial</option>
            <option value="OPERATIONAL">Operational</option>
          </select>
          <select
            value={selectedImpact}
            onChange={(e) => setSelectedImpact(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
          >
            <option value="ALL">All Impact</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTED_UPON">Acted Upon</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        result.analysisType === "PATTERN"
                          ? "bg-blue-500/20 text-blue-400"
                          : result.analysisType === "ANOMALY"
                            ? "bg-red-500/20 text-red-400"
                            : result.analysisType === "PREDICTION"
                              ? "bg-purple-500/20 text-purple-400"
                              : result.analysisType === "CLUSTERING"
                                ? "bg-green-500/20 text-green-400"
                                : result.analysisType === "ASSOCIATION"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-cyan-500/20 text-cyan-400"
                      }`}
                    >
                      {result.analysisType.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        result.impact === "HIGH"
                          ? "bg-red-500/20 text-red-400"
                          : result.impact === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {result.impact}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {result.title}
                  </h3>
                  <p className="text-sm text-[#9ca3af] line-clamp-2">
                    {result.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Confidence:</span>
                  <span className="text-white font-medium">
                    {result.confidence}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Category:</span>
                  <span className="text-white text-xs">
                    {result.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Findings:</span>
                  <span className="text-white">
                    {result.findings.length} findings
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Status:</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      result.status === "NEW"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : result.status === "REVIEWED"
                          ? "bg-blue-500/20 text-blue-400"
                          : result.status === "ACTED_UPON"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {result.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(result)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                {result.status === "NEW" && (
                  <button
                    onClick={() => handleStatusChange(result, "REVIEWED")}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    title="Mark as Reviewed"
                  >
                    <i className="ri-check-line"></i>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table View - Similar structure, showing key fields */}
      {!loading && viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredResults.map((result, index) => (
                  <motion.tr
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.analysisType === "PATTERN"
                            ? "bg-blue-500/20 text-blue-400"
                            : result.analysisType === "ANOMALY"
                              ? "bg-red-500/20 text-red-400"
                              : result.analysisType === "PREDICTION"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {result.analysisType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {result.title}
                      </div>
                      <div className="text-xs text-[#9ca3af] line-clamp-1">
                        {result.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {result.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.impact === "HIGH"
                            ? "bg-red-500/20 text-red-400"
                            : result.impact === "MEDIUM"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {result.impact}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {result.confidence}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === "NEW"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : result.status === "REVIEWED"
                              ? "bg-blue-500/20 text-blue-400"
                              : result.status === "ACTED_UPON"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {result.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(result)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {result.status === "NEW" && (
                          <Tooltip content="Mark as Reviewed" position="top">
                            <button
                              onClick={() =>
                                handleStatusChange(result, "REVIEWED")
                              }
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {!loading && viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Analysis Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="category"
                    stroke="#9ca3af"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Confidence vs Impact Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={confidenceScatter}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence"
                  unit="%"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis
                  type="number"
                  dataKey="impact"
                  name="Impact"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <ZAxis type="number" dataKey="category" name="Category" />
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Scatter
                  name="Insights"
                  data={confidenceScatter}
                  fill="#06b6d4"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Insights View - Show only NEW and HIGH impact */}
      {!loading && viewMode === "insights" && (
        <div className="space-y-4">
          {filteredResults
            .filter((r) => r.status === "NEW" || r.impact === "HIGH")
            .map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => handleView(result)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.analysisType === "PATTERN"
                            ? "bg-blue-500/20 text-blue-400"
                            : result.analysisType === "ANOMALY"
                              ? "bg-red-500/20 text-red-400"
                              : result.analysisType === "PREDICTION"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {result.analysisType.replace(/_/g, " ")}
                      </span>
                      {result.impact === "HIGH" && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                          <i className="ri-fire-line mr-1"></i>
                          High Impact
                        </span>
                      )}
                      {result.status === "NEW" && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {result.title}
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      {result.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {result.confidence}%
                    </div>
                    <div className="text-xs text-[#9ca3af]">Confidence</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-2">
                      Key Findings
                    </div>
                    <ul className="space-y-1">
                      {result.findings.slice(0, 3).map((finding, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-white flex items-center gap-2"
                        >
                          <i className="ri-checkbox-circle-line text-cyan-400"></i>
                          {finding.metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-2">
                      Recommendations
                    </div>
                    <ul className="space-y-1">
                      {result.recommendations.slice(0, 3).map((rec, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-white flex items-center gap-2"
                        >
                          <i className="ri-arrow-right-line text-green-400"></i>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-[#9ca3af]">
                    Generated: {format(new Date(result.generatedAt), "PPp")}
                  </div>
                  <button className="text-sm text-cyan-400 hover:text-cyan-300">
                    View Details <i className="ri-arrow-right-line ml-1"></i>
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedResult(null);
        }}
        title={`Data Mining Insight - ${selectedResult?.title || ""}`}
        size="lg"
      >
        {selectedResult && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Analysis Type</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedResult.analysisType === "PATTERN"
                      ? "bg-blue-500/20 text-blue-400"
                      : selectedResult.analysisType === "ANOMALY"
                        ? "bg-red-500/20 text-red-400"
                        : selectedResult.analysisType === "PREDICTION"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  {selectedResult.analysisType.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Category</div>
                <div className="text-white">
                  {selectedResult.category.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Impact</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedResult.impact === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : selectedResult.impact === "MEDIUM"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedResult.impact}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Confidence</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {selectedResult.confidence}%
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Description</div>
              <div className="text-white">{selectedResult.description}</div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Key Findings</div>
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                {selectedResult.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white/5 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <i className="ri-checkbox-circle-line text-cyan-400"></i>
                      <span className="text-sm text-white">
                        {finding.metric}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white font-medium">
                        {finding.value.toFixed(1)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          finding.trend === "UP"
                            ? "bg-green-500/20 text-green-400"
                            : finding.trend === "DOWN"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {finding.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Recommendations</div>
              <ul className="space-y-2">
                {selectedResult.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-white"
                  >
                    <i className="ri-arrow-right-line text-green-400 mt-0.5"></i>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              {selectedResult.status === "NEW" && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedResult, "REVIEWED");
                    setShowViewModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Mark as Reviewed
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
