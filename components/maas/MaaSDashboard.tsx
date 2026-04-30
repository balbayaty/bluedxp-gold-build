/**
 * MaaS (Manufacturing as a Service) Dashboard Component
 *
 * Comprehensive dashboard showing:
 * - Overview metrics (tenants, revenue, utilization, pillars)
 * - 12 Shared Services Pillars status
 * - Revenue breakdown by pillar
 * - Utilization charts
 * - Recent activity
 *
 * @module maas
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Factory,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Building2,
  Cog,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Building,
  Bot,
  FlaskConical,
  Truck,
  GraduationCap,
  ShoppingCart,
  Leaf,
  Network,
  FileCheck,
  Lightbulb,
  Wallet,
  Headphones,
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
import type { MAASPillarDefinition } from "@/lib/services/maas/types";

interface MaaSDashboardData {
  totalTenants: number;
  activePillars: number;
  totalRevenue: number;
  utilizationRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
  pillars: Array<{
    id: string;
    name: string;
    utilization: number;
    revenue: number;
    status: "active" | "inactive" | "pending";
  }>;
  revenueByPillar: Array<{
    pillar: string;
    revenue: number;
    percentage: number;
  }>;
  utilizationTrend: Array<{
    date: string;
    utilization: number;
  }>;
}

interface MaaSDashboardProps {
  data?: MaaSDashboardData;
  loading?: boolean;
}

// Pillar icons mapping
const pillarIcons: Record<string, React.ReactNode> = {
  SMART_FACTORY_INFRASTRUCTURE: <Building className="w-5 h-5" />,
  ROBOTICS_AUTOMATION: <Bot className="w-5 h-5" />,
  QUALITY_ASSURANCE_LABS: <FlaskConical className="w-5 h-5" />,
  LOGISTICS_HUB: <Truck className="w-5 h-5" />,
  TALENT_TRAINING_ACADEMY: <GraduationCap className="w-5 h-5" />,
  PROCUREMENT_CONSORTIUM: <ShoppingCart className="w-5 h-5" />,
  SUSTAINABILITY_SERVICES: <Leaf className="w-5 h-5" />,
  DIGITAL_TWIN_PLATFORM: <Network className="w-5 h-5" />,
  COMPLIANCE_CERTIFICATION: <FileCheck className="w-5 h-5" />,
  RD_COLLABORATION_HUB: <Lightbulb className="w-5 h-5" />,
  FINANCIAL_SERVICES: <Wallet className="w-5 h-5" />,
  CUSTOMER_SUCCESS_PLATFORM: <Headphones className="w-5 h-5" />,
};

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#ef4444", // red
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#a855f7", // violet
];

export default function MaaSDashboard({ data, loading }: MaaSDashboardProps) {
  const router = useRouter();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  // Default data if not provided
  const dashboardData: MaaSDashboardData = data || {
    totalTenants: 0,
    activePillars: 12,
    totalRevenue: 0,
    utilizationRate: 0,
    recentActivity: [],
    pillars: [],
    revenueByPillar: [],
    utilizationTrend: [],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading MaaS Dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = dashboardData.revenueByPillar.map((item) => ({
    name: item.pillar
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ")
      .substring(0, 15),
    revenue: item.revenue,
    percentage: item.percentage,
  }));

  const utilizationChartData =
    dashboardData.utilizationTrend.length > 0
      ? dashboardData.utilizationTrend
      : [
          { date: "Week 1", utilization: 45 },
          { date: "Week 2", utilization: 52 },
          { date: "Week 3", utilization: 48 },
          { date: "Week 4", utilization: 58 },
        ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Total Tenants</h3>
          <p className="text-3xl font-bold text-white mb-2">
            {dashboardData.totalTenants}
          </p>
          <p className="text-xs text-gray-500">Multi-tenant manufacturing</p>
        </motion.div>

        {/* Active Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Active Pillars</h3>
          <p className="text-3xl font-bold text-white mb-2">
            {dashboardData.activePillars}/12
          </p>
          <p className="text-xs text-gray-500">Shared services operational</p>
        </motion.div>

        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-white mb-2">
            {dashboardData.totalRevenue.toLocaleString("en-US", {
              style: "currency",
              currency: "SAR",
              minimumFractionDigits: 0,
            })}
          </p>
          <p className="text-xs text-gray-500">All revenue streams</p>
        </motion.div>

        {/* Utilization Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-amber-400" />
            </div>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Utilization Rate</h3>
          <p className="text-3xl font-bold text-white mb-2">
            {dashboardData.utilizationRate.toFixed(1)}%
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(dashboardData.utilizationRate, 100)}%`,
              }}
            ></div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Pillar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                Revenue by Pillar
              </h3>
              <p className="text-sm text-gray-400">
                Revenue distribution across 12 pillars
              </p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
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

        {/* Utilization Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                Utilization Trend
              </h3>
              <p className="text-sm text-gray-400">
                Resource utilization over time
              </p>
            </div>
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={utilizationChartData}>
              <defs>
                <linearGradient
                  id="colorUtilization"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorUtilization)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 12 Pillars Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-1">
              12 Shared Services Pillars
            </h3>
            <p className="text-sm text-gray-400">
              Comprehensive manufacturing services platform
            </p>
          </div>
          <button
            onClick={() => router.push("/maas/pillars")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboardData.pillars.map((pillar, index) => {
            const icon = pillarIcons[pillar.id] || (
              <Building className="w-5 h-5" />
            );
            const statusColor =
              pillar.status === "active"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : pillar.status === "pending"
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-gray-500/20 text-gray-400 border-gray-500/30";

            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer ${
                  selectedPillar === pillar.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() =>
                  setSelectedPillar(
                    selectedPillar === pillar.id ? null : pillar.id,
                  )
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${statusColor} border`}>
                    {icon}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${statusColor} border`}
                  >
                    {pillar.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                  {pillar.name}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Utilization</span>
                    <span className="text-white font-medium">
                      {pillar.utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(pillar.utilization, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-emerald-400 font-medium">
                      {pillar.revenue.toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      {dashboardData.recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                Recent Activity
              </h3>
              <p className="text-sm text-gray-400">
                Latest MaaS platform events
              </p>
            </div>
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
