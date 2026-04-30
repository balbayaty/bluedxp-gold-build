/**
 * Enhanced Proposal Analytics Dashboard
 * Comprehensive analytics with predictive insights, engagement metrics, conversion funnels
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ProposalEngagementHeatmap from "@/components/proposals/ProposalEngagementHeatmap";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function EnhancedProposalAnalytics() {
  const { hasModuleAccess } = useAuth();
  const [timeRange, setTimeRange] = useState("6M");
  const [analytics, setAnalytics] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    loadAnalytics();
  }, [timeRange, hasAccess]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Would fetch from API
      // For now, use mock data
      setAnalytics({
        totals: {
          proposalsCreated: 245,
          proposalsSent: 198,
          proposalsWon: 87,
          proposalsLost: 65,
          totalValue: 12500000,
          averageDealSize: 143678,
        },
        rates: {
          winRate: 43.9,
          conversionRate: 80.8,
          acceptanceRate: 57.2,
        },
        trends: {
          winRateTrend: "UP",
          conversionTrend: "STABLE",
          valueTrend: "UP",
        },
      });

      setPredictions({
        nextMonthWinRate: 46.2,
        nextMonthValue: 1450000,
        topOpportunities: [
          { proposalId: "prop-1", probability: 85, value: 250000 },
          { proposalId: "prop-2", probability: 72, value: 180000 },
          { proposalId: "prop-3", probability: 68, value: 320000 },
        ],
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = [
    { month: "Jul", created: 28, sent: 22, won: 15, value: 1850000 },
    { month: "Aug", created: 35, sent: 28, won: 18, value: 2200000 },
    { month: "Sep", created: 32, sent: 26, won: 17, value: 2100000 },
    { month: "Oct", created: 40, sent: 32, won: 22, value: 2800000 },
    { month: "Nov", created: 45, sent: 38, won: 25, value: 3200000 },
    { month: "Dec", created: 47, sent: 35, won: 23, value: 2950000 },
    { month: "Jan", created: 52, sent: 42, won: 28, value: 3500000 },
  ];

  const conversionFunnel = [
    { stage: "RFQs Received", value: 52, percentage: 100 },
    { stage: "Under Review", value: 48, percentage: 92 },
    { stage: "Proposal Sent", value: 42, percentage: 81 },
    { stage: "Negotiation", value: 35, percentage: 67 },
    { stage: "Won", value: 28, percentage: 54 },
  ];

  const engagementData = [
    { section: "Executive Summary", views: 95, avgTime: 120, engagement: 92 },
    { section: "Services", views: 87, avgTime: 180, engagement: 88 },
    { section: "Pricing", views: 82, avgTime: 240, engagement: 85 },
    { section: "Case Studies", views: 65, avgTime: 150, engagement: 72 },
    { section: "Terms", views: 45, avgTime: 90, engagement: 58 },
  ];

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view enhanced analytics"
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
              You do not have the required permissions to view enhanced
              analytics. Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="Enhanced Analytics"
        description="Comprehensive proposal analytics and insights"
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Enhanced Analytics"
        description="Comprehensive proposal analytics with predictive insights"
      >
        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center justify-end gap-2">
            {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Win Rate
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.rates.winRate.toFixed(1)}%
              </p>
              <p
                className={`text-sm mt-2 ${analytics?.trends.winRateTrend === "UP" ? "text-green-600" : "text-red-600"}`}
              >
                {analytics?.trends.winRateTrend === "UP" ? "↑" : "↓"} 2.3% vs
                last period
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Value
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(analytics?.totals.totalValue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {analytics?.totals.proposalsWon} won proposals
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Conversion Rate
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.rates.conversionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {analytics?.totals.proposalsSent} of{" "}
                {analytics?.totals.proposalsCreated} sent
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Avg Deal Size
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(analytics?.totals.averageDealSize / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Per won proposal
              </p>
            </motion.div>
          </div>

          {/* Predictive Insights */}
          {predictions && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🔮 Predictive Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Predicted Win Rate (Next Month)
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {predictions.nextMonthWinRate}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Predicted Value (Next Month)
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(predictions.nextMonthValue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Top Opportunities
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {predictions.topOpportunities.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Monthly Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="won"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Conversion Funnel
              </h3>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {stage.stage}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stage.value} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full rounded-lg"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement by Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Section Engagement
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="section"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="engagement" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Win Rate by Service */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Win Rate by Service
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Warehousing", value: 52, winRate: 65 },
                      { name: "Transportation", value: 38, winRate: 58 },
                      { name: "Customs", value: 28, winRate: 72 },
                      { name: "Freight Forwarding", value: 22, winRate: 55 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, winRate }) => `${name}: ${winRate}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Warehousing", value: 52 },
                      { name: "Transportation", value: 38 },
                      { name: "Customs", value: 28 },
                      { name: "Freight Forwarding", value: 22 },
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engagement Heatmap - Full Width */}
          <ProposalEngagementHeatmap proposalId="recent" className="w-full" />

          {/* Top Opportunities */}
          {predictions?.topOpportunities && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Opportunities (Predicted)
              </h3>
              <div className="space-y-3">
                {predictions.topOpportunities.map((opp: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Proposal #{opp.proposalId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Win Probability: {opp.probability}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${(opp.value / 1000).toFixed(0)}K
                      </p>
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${opp.probability}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
