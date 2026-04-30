/**
 * Proposal Benchmarking Page
 * Shows benchmark analysis, recommendations, and performance metrics
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function ProposalBenchmarkPage() {
  const params = useParams();
  const router = useRouter();
  const { hasModuleAccess } = useAuth();
  const proposalId = params.id as string;

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const [benchmark, setBenchmark] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    loadBenchmark();
  }, [proposalId, hasAccess]);

  const loadBenchmark = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${proposalId}/benchmark`);
      if (res.ok) {
        const data = await res.json();
        setBenchmark(data.data.benchmark);
        setMetrics(data.data.metrics);
      }
    } catch (error) {
      console.error("Error loading benchmark:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view benchmark analysis"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to view benchmark
              analysis. Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="Benchmark Analysis"
        description="Loading benchmark data..."
        icon="ri-bar-chart-box-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </PageTemplate>
    );
  }

  if (!benchmark) {
    return (
      <PageTemplate
        title="Benchmark Analysis"
        description="No benchmark data available"
        icon="ri-bar-chart-box-line"
      >
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No benchmark data found
          </p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Benchmark Analysis"
        description="Performance metrics, comparisons, and AI-powered recommendations"
        icon="ri-bar-chart-box-line"
      >
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Pricing Competitiveness"
              value={benchmark.metrics.pricingCompetitiveness}
              max={100}
              color="blue"
              comparison={benchmark.comparisons.vsIndustry.pricing}
            />
            <MetricCard
              title="Win Rate"
              value={benchmark.metrics.winRate}
              max={100}
              color="green"
              comparison={benchmark.comparisons.vsIndustry.winRate}
            />
            <MetricCard
              title="Response Time"
              value={benchmark.metrics.responseTime}
              max={72}
              unit="hours"
              color="purple"
              comparison={benchmark.comparisons.vsIndustry.responseTime}
              lowerIsBetter
            />
            <MetricCard
              title="Conversion Rate"
              value={benchmark.metrics.conversionRate}
              max={100}
              color="amber"
              comparison="AT"
            />
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="ri-lightbulb-line text-amber-500" />
              AI-Powered Recommendations
            </h3>
            <div className="space-y-3">
              {benchmark.recommendations.map((rec: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === "HIGH"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                      : rec.priority === "MEDIUM"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.priority === "HIGH"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : rec.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {rec.priority} PRIORITY
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {rec.category}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {rec.recommendation}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {rec.impact}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ComparisonCard
              title="vs Industry Average"
              comparisons={benchmark.comparisons.vsIndustry}
            />
            <ComparisonCard
              title="vs Historical Performance"
              comparisons={benchmark.comparisons.vsHistorical}
            />
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}

function MetricCard({
  title,
  value,
  max,
  unit = "%",
  color,
  comparison,
  lowerIsBetter = false,
}: {
  title: string;
  value: number;
  max: number;
  unit?: string;
  color: string;
  comparison: string;
  lowerIsBetter?: boolean;
}) {
  const percentage = lowerIsBetter
    ? ((max - value) / max) * 100
    : (value / max) * 100;
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
  };

  const comparisonIcons: Record<string, string> = {
    ABOVE: "ri-arrow-up-line text-green-500",
    AT: "ri-check-line text-blue-500",
    BELOW: "ri-arrow-down-line text-red-500",
    FASTER: "ri-arrow-up-line text-green-500",
    AVERAGE: "ri-check-line text-blue-500",
    SLOWER: "ri-arrow-down-line text-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <i
          className={
            comparisonIcons[comparison] || "ri-check-line text-blue-500"
          }
        />
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]}`}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {comparison === "ABOVE" || comparison === "FASTER"
          ? "Above average"
          : comparison === "BELOW" || comparison === "SLOWER"
            ? "Below average"
            : "At average"}
      </p>
    </motion.div>
  );
}

function ComparisonCard({
  title,
  comparisons,
}: {
  title: string;
  comparisons: any;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h4>
      <div className="space-y-3">
        {Object.entries(comparisons).map(([key, value]: [string, any]) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                value === "ABOVE" || value === "FASTER"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : value === "BELOW" || value === "SLOWER"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
