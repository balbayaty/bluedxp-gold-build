/**
 * Pillar Detail Page
 *
 * Deep drill-down view for individual pillar
 * - Comprehensive pillar analytics
 * - Revenue breakdown
 * - Utilization trends
 * - Tenant list
 * - Performance metrics
 * - AI insights
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { MAAS_PILLARS } from "@/lib/services/maas/pillars";
import { maasIntelligenceService } from "@/lib/services/maas/intelligenceService";
import {
  ArrowLeft,
  Building,
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  BarChart3,
  Download,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function PillarDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const pillarId = params.pillarId as string;
  const [loading, setLoading] = useState(true);
  const [pillar, setPillar] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Find pillar
        const foundPillar = MAAS_PILLARS.find(
          (p) => p.type === pillarId || p.id.toString() === pillarId,
        );

        if (!foundPillar) {
          setLoading(false);
          return;
        }

        // Get intelligence for this pillar
        const intel = await maasIntelligenceService.getIntelligence();
        const pillarIntel = {
          insights: intel.insights.filter(
            (i: any) => i.pillar === foundPillar.type,
          ),
          predictions: intel.predictions.filter(
            (p: any) => p.pillar === foundPillar.type,
          ),
          recommendations: intel.recommendations.filter(
            (r: any) => r.pillar === foundPillar.type,
          ),
        };

        // Generate analytics data
        const analyticsData = {
          revenue: {
            current: Math.random() * 200000 + 50000,
            trend: Array.from({ length: 12 }, (_, i) => ({
              month: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ][i],
              revenue: Math.random() * 30000 + 10000,
            })),
          },
          utilization: {
            current: Math.random() * 40 + 50,
            trend: Array.from({ length: 30 }, (_, i) => ({
              day: i + 1,
              utilization: Math.random() * 20 + 60,
            })),
          },
          tenants: [
            { name: "Manufacturing Co.", utilization: 75, revenue: 45000 },
            { name: "Tech Industries", utilization: 82, revenue: 52000 },
            { name: "Global Mfg", utilization: 65, revenue: 38000 },
          ],
        };

        setPillar({
          ...foundPillar,
          utilization: analyticsData.utilization.current,
          revenue: analyticsData.revenue.current,
          tenants: analyticsData.tenants.length,
        });
        setIntelligence(pillarIntel);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Error loading pillar data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pillarId]);

  if (loading) {
    return (
      <PageTemplate
        title="Pillar Details"
        description="Pillar Analytics & Insights"
        icon="ri-stack-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading pillar details..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  if (!pillar) {
    return (
      <PageTemplate
        title="Pillar Not Found"
        description="The requested pillar could not be found"
        icon="ri-stack-line"
      >
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Pillar not found</p>
          <button
            onClick={() => router.push("/maas/pillars")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            Back to Pillars
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={pillar.name}
      description={`${pillar.description} - Detailed Analytics`}
      icon="ri-stack-line"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/maas/pillars")}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pillars
          </button>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-white flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm text-gray-400">Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {pillar.revenue.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm text-gray-400">Utilization</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {pillar.utilization.toFixed(1)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm text-gray-400">Tenants</h3>
            </div>
            <p className="text-3xl font-bold text-white">{pillar.tenants}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm text-gray-400">Growth</h3>
            </div>
            <p className="text-3xl font-bold text-white">+12.5%</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.revenue.trend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Utilization Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Utilization Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.utilization.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* AI Insights */}
        {intelligence &&
          (intelligence.insights.length > 0 ||
            intelligence.recommendations.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                AI Insights & Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intelligence.insights
                  .slice(0, 3)
                  .map((insight: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <h4 className="text-sm font-semibold text-white mb-2">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {insight.confidence}% confidence
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            insight.impact === "HIGH"
                              ? "bg-red-500/20 text-red-400"
                              : insight.impact === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {insight.impact} impact
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

        {/* Tenants */}
        {analytics?.tenants && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Active Tenants
            </h3>
            <div className="space-y-3">
              {analytics.tenants.map((tenant: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {tenant.name}
                    </span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {tenant.revenue.toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${tenant.utilization}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Utilization: {tenant.utilization}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function PillarDetailPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Error"
          description="Something went wrong"
          icon="ri-stack-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <PillarDetailPageContent />
    </ErrorBoundary>
  );
}
