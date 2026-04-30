/**
 * Predictive Pricing Dashboard
 * Comprehensive pricing analysis with AI recommendations
 * World-class UX with full drill-downs
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
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
} from "lucide-react";
import { predictivePricingService } from "@/lib/services/marketplace/predictivePricingService";
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
} from "recharts";

export default function PredictivePricingPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.listingId as string;
  const [recommendation, setRecommendation] = useState<any>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(
    null,
  );

  useEffect(() => {
    loadData();
  }, [listingId]);

  const loadData = async () => {
    try {
      const [rec, analysis] = await Promise.all([
        predictivePricingService.getPricingRecommendation(listingId),
        predictivePricingService.analyzeMarket("STORAGE" as any), // Would get from listing
      ]);
      setRecommendation(rec);
      setMarketAnalysis(analysis);
    } catch (error) {
      console.error("Failed to load pricing data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!recommendation) {
    return <EmptyState />;
  }

  const priceChange =
    ((recommendation.recommendedPrice - recommendation.currentPrice) /
      recommendation.currentPrice) *
    100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <HeaderSection onBack={() => router.back()} />

        {/* Main Recommendation Card */}
        <MainRecommendationCard
          recommendation={recommendation}
          priceChange={priceChange}
        />

        {/* Market Analysis */}
        <MarketAnalysisSection analysis={marketAnalysis} />

        {/* Expected Impact */}
        <ExpectedImpactSection impact={recommendation.expectedImpact} />

        {/* Price Alternatives */}
        <PriceAlternativesSection
          alternatives={recommendation.alternatives}
          selected={selectedAlternative}
          onSelect={setSelectedAlternative}
        />

        {/* Factors Analysis */}
        <FactorsAnalysisSection factors={recommendation.factors} />

        {/* Reasoning */}
        <ReasoningSection reasoning={recommendation.reasoning} />
      </div>
    </div>
  );
}

function HeaderSection({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Pricing Recommendations
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Intelligent pricing optimization based on market analysis
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
        <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </motion.div>
  );
}

function MainRecommendationCard({ recommendation, priceChange }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Recommendation</h2>
              <p className="text-blue-100">
                Confidence: {recommendation.confidence}%
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-blue-100 mb-1">Current Price</div>
          <div className="text-2xl font-bold line-through opacity-75">
            SAR {recommendation.currentPrice.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="text-sm text-blue-100 mb-2">Recommended Price</div>
          <div className="text-4xl font-bold mb-2">
            SAR {recommendation.recommendedPrice.toLocaleString()}
          </div>
          <div
            className={`flex items-center gap-2 text-sm ${
              priceChange >= 0 ? "text-green-300" : "text-red-300"
            }`}
          >
            {priceChange >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(priceChange).toFixed(1)}%{" "}
            {priceChange >= 0 ? "increase" : "decrease"}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="text-sm text-blue-100 mb-2">
            Expected Bookings Change
          </div>
          <div
            className={`text-4xl font-bold mb-2 ${
              (recommendation.expectedImpact.bookingsChange || 0) >= 0
                ? "text-green-300"
                : "text-red-300"
            }`}
          >
            {recommendation.expectedImpact.bookingsChange >= 0 ? "+" : ""}
            {recommendation.expectedImpact.bookingsChange?.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-100">Based on price elasticity</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="text-sm text-blue-100 mb-2">
            Expected Revenue Change
          </div>
          <div
            className={`text-4xl font-bold mb-2 ${
              (recommendation.expectedImpact.revenueChange || 0) >= 0
                ? "text-green-300"
                : "text-red-300"
            }`}
          >
            {recommendation.expectedImpact.revenueChange >= 0 ? "+" : ""}
            {recommendation.expectedImpact.revenueChange?.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-100">Projected impact</div>
        </div>
      </div>

      <button className="w-full py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg">
        Apply Recommended Price
      </button>
    </motion.div>
  );
}

function MarketAnalysisSection({ analysis }: any) {
  if (!analysis) return null;

  const chartData = [
    { name: "Min", value: analysis.priceRange.min },
    { name: "Q1", value: analysis.priceRange.q1 },
    { name: "Median", value: analysis.priceRange.median },
    { name: "Q3", value: analysis.priceRange.q3 },
    { name: "Max", value: analysis.priceRange.max },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        Market Analysis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Market Average
            </div>
            <div className="text-3xl font-bold">
              SAR {analysis.marketAverage.toLocaleString()}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Price Range
            </div>
            <div className="text-lg font-semibold">
              SAR {analysis.priceRange.min.toLocaleString()} -{" "}
              {analysis.priceRange.max.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis.trends.direction === "UP" ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : analysis.trends.direction === "DOWN" ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <Target className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm font-medium">
              {analysis.trends.direction}{" "}
              {Math.abs(analysis.trends.changePercent).toFixed(1)}%
            </span>
          </div>
        </div>
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function ExpectedImpactSection({ impact }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-2xl font-bold mb-6">Expected Impact</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImpactCard
          title="Bookings"
          value={impact.bookingsChange}
          unit="%"
          positive={impact.bookingsChange >= 0}
        />
        <ImpactCard
          title="Revenue"
          value={impact.revenueChange}
          unit="%"
          positive={impact.revenueChange >= 0}
        />
        <ImpactCard
          title="Conversion"
          value={impact.conversionChange}
          unit="%"
          positive={impact.conversionChange >= 0}
        />
      </div>
    </motion.div>
  );
}

function ImpactCard({ title, value, unit, positive }: any) {
  return (
    <div
      className={`p-6 rounded-xl border-2 ${
        positive
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      }`}
    >
      <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
        {title}
      </div>
      <div
        className={`text-3xl font-bold ${
          positive
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {value >= 0 ? "+" : ""}
        {value?.toFixed(1)}
        {unit}
      </div>
    </div>
  );
}

function PriceAlternativesSection({ alternatives, selected, onSelect }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-2xl font-bold mb-6">Price Alternatives</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alternatives.map((alt: any, idx: number) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              selected === idx
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Option {idx + 1}
            </div>
            <div className="text-2xl font-bold mb-2">
              SAR {alt.price.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {alt.expectedOutcome}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                {alt.confidence}% confidence
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function FactorsAnalysisSection({ factors }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-2xl font-bold mb-6">Pricing Factors</h3>
      <div className="space-y-4">
        <FactorRow
          label="Market Average"
          value={factors.marketAverage}
          unit="SAR"
        />
        <FactorRow
          label="Competitor Prices"
          value={factors.competitorPrices?.length || 0}
          unit="competitors"
        />
        <FactorRow label="Demand Level" value={factors.demandLevel} />
        <FactorRow label="Seasonality" value={factors.seasonality} unit="%" />
        <FactorRow
          label="Historical Performance"
          value={factors.historicalPerformance}
          unit="/5"
        />
      </div>
    </motion.div>
  );
}

function FactorRow({ label, value, unit }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <span className="font-medium">{label}</span>
      <span className="text-slate-600 dark:text-slate-400">
        {typeof value === "number" ? value.toLocaleString() : value}{" "}
        {unit || ""}
      </span>
    </div>
  );
}

function ReasoningSection({ reasoning }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Info className="w-6 h-6 text-blue-600" />
        AI Reasoning
      </h3>
      <ul className="space-y-3">
        {reasoning.map((reason: string, idx: number) => (
          <li
            key={idx}
            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">{reason}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Analyzing pricing...
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Pricing Data</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Unable to load pricing recommendations
        </p>
      </div>
    </div>
  );
}
