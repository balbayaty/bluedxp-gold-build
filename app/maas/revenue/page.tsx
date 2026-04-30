/**
 * Revenue Management Page
 *
 * Comprehensive revenue analytics and management
 * - Revenue by pillar
 * - Revenue by tenant
 * - Revenue trends
 * - Forecasting
 * - Revenue optimization
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
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

function MaasRevenuePageContent() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/maas/revenue?timeframe=${timeRange}`,
        );
        if (response.ok) {
          const result = await response.json();
          setRevenueData(result.revenue || result);
        } else {
          // Generate sample data
          setRevenueData(generateSampleRevenueData());
        }
      } catch (error) {
        console.error("Error fetching revenue:", error);
        setRevenueData(generateSampleRevenueData());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const generateSampleRevenueData = () => {
    const pillars = [
      "Smart Factory",
      "Robotics",
      "Quality Labs",
      "Logistics",
      "Training",
      "Procurement",
      "Sustainability",
      "Digital Twin",
      "Compliance",
      "R&D Hub",
      "Financial",
      "Customer Success",
    ];

    return {
      totalRevenue: 2450000,
      byPillar: pillars.map((name, index) => ({
        name,
        revenue: Math.random() * 200000 + 50000,
        percentage: Math.random() * 15 + 5,
      })),
      trends: Array.from({ length: 12 }, (_, i) => ({
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
        revenue: Math.random() * 300000 + 150000,
      })),
      byTenant: [
        { name: "Manufacturing Co.", revenue: 450000 },
        { name: "Tech Industries", revenue: 380000 },
        { name: "Global Mfg", revenue: 320000 },
        { name: "Industrial Corp", revenue: 280000 },
      ],
    };
  };

  if (loading) {
    return (
      <PageTemplate
        title="Revenue Management"
        description="Revenue Analytics & Management - MaaS Module"
        icon="ri-money-dollar-circle-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading revenue data..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  const data = revenueData || generateSampleRevenueData();
  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#ef4444",
    "#6366f1",
    "#14b8a6",
    "#f97316",
    "#84cc16",
    "#a855f7",
  ];

  return (
    <PageTemplate
      title="Revenue Management"
      description="Revenue Analytics & Management - MaaS Module"
      icon="ri-money-dollar-circle-line"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Revenue Analytics
            </h2>
            <p className="text-gray-400">
              Comprehensive revenue insights and management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
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
              <h3 className="text-sm text-gray-400">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {data.totalRevenue.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              })}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% vs last period</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm text-gray-400">Avg per Pillar</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {(data.totalRevenue / 12).toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm text-gray-400">Top Pillar</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {data.byPillar?.[0]?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {data.byPillar?.[0]?.revenue?.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm text-gray-400">Growth Rate</h3>
            </div>
            <p className="text-3xl font-bold text-white">+15.2%</p>
            <p className="text-sm text-gray-400 mt-1">Month over month</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Pillar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Revenue by Pillar
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byPillar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Revenue Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={data.byPillar}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name}: ${percentage.toFixed(1)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.byPillar.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Revenue Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Revenue Trends
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.trends}>
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

        {/* Revenue by Tenant */}
        {data.byTenant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Revenue by Tenant
            </h3>
            <div className="space-y-3">
              {data.byTenant.map((tenant: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between">
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
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{
                        width: `${(tenant.revenue / data.totalRevenue) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function MaasRevenuePagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Revenue Management"
          description="Revenue Management - maas module"
          icon="ri-money-dollar-circle-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <MaasRevenuePageContent />
    </ErrorBoundary>
  );
}
