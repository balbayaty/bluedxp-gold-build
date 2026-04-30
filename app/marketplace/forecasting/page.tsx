/**
 * Demand Forecasting Dashboard
 * Comprehensive AI-powered demand prediction with full visualizations
 * World-class UX with drill-downs on every metric
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Activity,
  Zap,
  Clock,
} from "lucide-react";
import { demandForecastingService } from "@/lib/services/marketplace/demandForecastingService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DemandForecastingPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("STORAGE");
  const [period, setPeriod] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
  >("MONTHLY");
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Memoize forecast calculation
  const memoizedForecast = useMemo(() => {
    return forecast;
  }, [forecast]);

  useEffect(() => {
    loadForecast();
  }, [category, period]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const result = await demandForecastingService.forecastDemand({
        category: category as any,
        period,
        lookAhead:
          period === "DAILY"
            ? 30
            : period === "WEEKLY"
              ? 12
              : period === "MONTHLY"
                ? 12
                : 4,
      });
      setForecast(result);
    } catch (error) {
      console.error("Failed to load forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  const forecastData = useMemo(() => {
    if (!forecast?.forecast) return [];
    return forecast.forecast.map((f: any) => ({
      period: f.period,
      predicted: f.predictedDemand,
      lower: f.confidenceRange?.lower || f.predictedDemand * 0.9,
      upper: f.confidenceRange?.upper || f.predictedDemand * 1.1,
      trend: f.trend || "STABLE",
    }));
  }, [forecast]);

  const riskFactorsData = useMemo(() => {
    if (!forecast?.riskFactors) return [];
    return forecast.riskFactors.map((r: any) => ({
      name: r.factor,
      impact: r.impact === "HIGH" ? 3 : r.impact === "MEDIUM" ? 2 : 1,
      probability: r.probability || 0.5,
    }));
  }, [forecast]);

  if (loading) {
    return <LoadingState />;
  }

  if (!forecast) {
    return <EmptyState onRetry={loadForecast} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <HeaderSection
          onBack={() => router.back()}
          category={category}
          onCategoryChange={setCategory}
          period={period}
          onPeriodChange={setPeriod}
          onRefresh={loadForecast}
        />

        {/* Key Metrics */}
        <KeyMetricsSection forecast={forecast} />

        {/* Main Forecast Chart */}
        <MainForecastChart data={forecastData} />

        {/* Trend Analysis */}
        <TrendAnalysisSection analysis={forecast.trendAnalysis} />

        {/* Seasonality Display */}
        <SeasonalitySection seasonality={forecast.seasonality} />

        {/* Risk Factors */}
        <RiskFactorsSection
          risks={forecast.riskFactors}
          data={riskFactorsData}
          selected={selectedMetric}
          onSelect={setSelectedMetric}
        />

        {/* Capacity Recommendations */}
        <CapacityRecommendationsSection
          recommendations={forecast.capacityRecommendations}
        />

        {/* Peak Periods */}
        <PeakPeriodsSection peaks={forecast.peakPeriods} />

        {/* Scaling Strategy */}
        <ScalingStrategySection strategy={forecast.scalingStrategy} />

        {/* Market Growth */}
        <MarketGrowthSection growth={forecast.marketGrowth} />
      </div>
    </div>
  );
}

function HeaderSection({
  onBack,
  category,
  onCategoryChange,
  period,
  onPeriodChange,
  onRefresh,
}: {
  onBack: () => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  period: string;
  onPeriodChange: (p: any) => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              Demand Forecasting
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              AI-powered demand prediction and capacity planning
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Service Category
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="STORAGE">Storage</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="FREIGHT">Freight</option>
            <option value="CROSSDOCKING">Cross-Docking</option>
            <option value="CONSULTING">Consulting</option>
            <option value="MANPOWER">Manpower</option>
            <option value="TRANSLATION">Translation</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Forecast Period
          </label>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

function KeyMetricsSection({ forecast }: { forecast: any }) {
  const metrics = [
    {
      label: "Average Demand",
      value: forecast.averageDemand?.toLocaleString() || "0",
      unit: "requests",
      trend: forecast.trendAnalysis?.overallTrend || "STABLE",
      icon: Activity,
      color: "blue",
    },
    {
      label: "Peak Demand",
      value: forecast.peakDemand?.toLocaleString() || "0",
      unit: "requests",
      trend: "UP",
      icon: Zap,
      color: "orange",
    },
    {
      label: "Confidence",
      value: `${forecast.confidence || 0}%`,
      unit: "",
      trend: "STABLE",
      icon: Target,
      color: "green",
    },
    {
      label: "Growth Rate",
      value: `${forecast.marketGrowth?.estimatedGrowth || 0}%`,
      unit: "YoY",
      trend: forecast.marketGrowth?.trend || "STABLE",
      icon: TrendingUp,
      color: "purple",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {metrics.map((metric, idx) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl bg-${metric.color}-100 dark:bg-${metric.color}-900/30 flex items-center justify-center`}
            >
              <metric.icon
                className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`}
              />
            </div>
            {metric.trend === "UP" && (
              <TrendingUp className="w-5 h-5 text-green-500" />
            )}
            {metric.trend === "DOWN" && (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            {metric.trend === "STABLE" && <div className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {metric.value}{" "}
              <span className="text-sm font-normal text-slate-500">
                {metric.unit}
              </span>
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function MainForecastChart({ data }: { data: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Demand Forecast
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">
              Predicted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-200" />
            <span className="text-slate-600 dark:text-slate-400">
              Confidence Range
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="lower"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="upper"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function TrendAnalysisSection({ analysis }: { analysis: any }) {
  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Trend Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Overall Trend
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
            {analysis.overallTrend?.toLowerCase() || "Stable"}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Growth Rate
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {analysis.growthRate || 0}%
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Volatility
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
            {analysis.volatility?.toLowerCase() || "Low"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SeasonalitySection({ seasonality }: { seasonality: any }) {
  if (!seasonality) return null;

  const seasonalityData =
    seasonality.patterns?.map((p: any, idx: number) => ({
      period: p.period || `Period ${idx + 1}`,
      factor: p.factor || 1.0,
      impact: p.impact || "NORMAL",
    })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Seasonality Patterns
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={seasonalityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="factor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function RiskFactorsSection({
  risks,
  data,
  selected,
  onSelect,
}: {
  risks: any[];
  data: any[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!risks || risks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Risk Factors
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((risk, idx) => (
          <motion.div
            key={idx}
            onClick={() => onSelect(risk.factor)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selected === risk.factor
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {risk.factor}
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  risk.impact === "HIGH"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : risk.impact === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {risk.impact} Impact
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {risk.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function CapacityRecommendationsSection({
  recommendations,
}: {
  recommendations: any[];
}) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Capacity Recommendations
      </h2>
      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {rec.period}
              </h3>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                {rec.recommendedCapacity} units
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {rec.reasoning}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PeakPeriodsSection({ peaks }: { peaks: any[] }) {
  if (!peaks || peaks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Peak Periods
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {peaks.map((peak, idx) => (
          <div
            key={idx}
            className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {peak.period}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Expected demand:{" "}
              <span className="font-semibold">{peak.expectedDemand}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {peak.reasoning}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ScalingStrategySection({ strategy }: { strategy: any }) {
  if (!strategy) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Scaling Strategy
      </h2>
      <div className="space-y-4">
        {strategy.recommendations?.map((rec: any, idx: number) => (
          <div
            key={idx}
            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {rec.action}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {rec.reasoning}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Priority: <span className="font-medium">{rec.priority}</span>
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MarketGrowthSection({ growth }: { growth: any }) {
  if (!growth) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 mb-8"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Market Growth Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Estimated Growth
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {growth.estimatedGrowth || 0}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Year over Year
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Market Size
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {growth.marketSize?.toLocaleString() || "0"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total Market
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Competition Level
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
            {growth.competitionLevel?.toLowerCase() || "Medium"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Market Saturation
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Loading forecast data...
        </p>
      </motion.div>
    </div>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          No Forecast Data
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Unable to load forecast data. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </motion.div>
    </div>
  );
}
