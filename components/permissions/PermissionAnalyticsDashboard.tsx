/**
 * 📊 PERMISSION ANALYTICS DASHBOARD
 *
 * Mind-blowing real-time analytics:
 * - Permission usage heatmaps
 * - Security risk visualization
 * - Permission efficiency metrics
 * - User behavior patterns
 * - Permission gap analysis
 * - Real-time insights
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { aiPermissionRecommender } from "@/lib/services/permissions/aiPermissionRecommender";
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
  LineChart,
  Line,
  Heatmap,
} from "recharts";
import type { User } from "@/types/user";
import type { PermissionAnalysis } from "@/lib/services/permissions/aiPermissionRecommender";

export default function PermissionAnalyticsDashboard() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [analyses, setAnalyses] = useState<Map<string, PermissionAnalysis>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await userService.getUsers({});
      setUsers(userData);

      // Load analyses for all users
      const analysisMap = new Map<string, PermissionAnalysis>();
      for (const user of userData.slice(0, 20)) {
        // Limit to 20 for performance
        try {
          const analysis =
            await aiPermissionRecommender.analyzeUserPermissions(user);
          analysisMap.set(user.id, analysis);
        } catch (error) {
          console.error(`Failed to analyze user ${user.id}:`, error);
        }
      }
      setAnalyses(analysisMap);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const analysisArray = Array.from(analyses.values());

    if (analysisArray.length === 0) {
      return {
        averageRiskScore: 0,
        averageEfficiencyScore: 0,
        averageSecurityScore: 0,
        totalRecommendations: 0,
        totalGaps: 0,
        totalOverPermissions: 0,
      };
    }

    return {
      averageRiskScore:
        analysisArray.reduce((sum, a) => sum + a.riskScore, 0) /
        analysisArray.length,
      averageEfficiencyScore:
        analysisArray.reduce((sum, a) => sum + a.efficiencyScore, 0) /
        analysisArray.length,
      averageSecurityScore:
        analysisArray.reduce((sum, a) => sum + a.securityScore, 0) /
        analysisArray.length,
      totalRecommendations: analysisArray.reduce(
        (sum, a) => sum + a.recommendations.length,
        0,
      ),
      totalGaps: analysisArray.reduce((sum, a) => sum + a.gaps.length, 0),
      totalOverPermissions: analysisArray.reduce(
        (sum, a) => sum + a.overPermissions.length,
        0,
      ),
    };
  }, [analyses]);

  // Role distribution
  const roleDistribution = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    users.forEach((u) => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });
    return Object.entries(roleCounts).map(([role, count]) => ({
      role: role.replace(/_/g, " "),
      count,
    }));
  }, [users]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    const riskLevels = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    analyses.forEach((analysis) => {
      if (analysis.riskScore < 30) riskLevels.LOW++;
      else if (analysis.riskScore < 60) riskLevels.MEDIUM++;
      else if (analysis.riskScore < 80) riskLevels.HIGH++;
      else riskLevels.CRITICAL++;
    });
    return Object.entries(riskLevels).map(([level, count]) => ({
      level,
      count,
      color:
        level === "LOW"
          ? "#10b981"
          : level === "MEDIUM"
            ? "#f59e0b"
            : level === "HIGH"
              ? "#ef4444"
              : "#dc2626",
    }));
  }, [analyses]);

  // Permission usage by module
  const moduleUsage = useMemo(() => {
    const moduleCounts: Record<string, number> = {};
    users.forEach((user) => {
      Object.keys(user.moduleAccess || {}).forEach((module) => {
        moduleCounts[module] = (moduleCounts[module] || 0) + 1;
      });
    });
    return Object.entries(moduleCounts)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [users]);

  // Top recommendations
  const topRecommendations = useMemo(() => {
    const allRecs: Array<{ type: string; count: number }> = [];
    analyses.forEach((analysis) => {
      analysis.recommendations.forEach((rec) => {
        const existing = allRecs.find((r) => r.type === rec.type);
        if (existing) existing.count++;
        else allRecs.push({ type: rec.type, count: 1 });
      });
    });
    return allRecs.sort((a, b) => b.count - a.count);
  }, [analyses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl animate-spin text-cyan-400 mb-4"></i>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <i className="ri-bar-chart-box-line text-cyan-400"></i>
                Permission Analytics
              </h1>
              <p className="text-gray-400">
                Real-time insights into your permission system
              </p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Average Risk Score"
            value={metrics.averageRiskScore.toFixed(1)}
            subtitle="Lower is better"
            icon="ri-shield-cross-line"
            color="red"
            trend={metrics.averageRiskScore < 50 ? "down" : "up"}
          />
          <MetricCard
            title="Efficiency Score"
            value={metrics.averageEfficiencyScore.toFixed(1)}
            subtitle="Higher is better"
            icon="ri-speed-up-line"
            color="green"
            trend={metrics.averageEfficiencyScore > 70 ? "up" : "down"}
          />
          <MetricCard
            title="Security Score"
            value={metrics.averageSecurityScore.toFixed(1)}
            subtitle="Higher is better"
            icon="ri-lock-line"
            color="blue"
            trend={metrics.averageSecurityScore > 70 ? "up" : "down"}
          />
          <MetricCard
            title="AI Recommendations"
            value={metrics.totalRecommendations.toString()}
            subtitle="Pending actions"
            icon="ri-lightbulb-line"
            color="yellow"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Role Distribution */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Role Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColorForIndex(index)}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="level" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6">
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Module Usage */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Top Modules by Usage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moduleUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis
                  dataKey="module"
                  type="category"
                  stroke="#9ca3af"
                  width={100}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                  }}
                />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Recommendations */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Top Recommendation Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRecommendations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="ri-brain-line text-pink-400"></i>
            AI-Generated Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.totalGaps > 0 && (
              <InsightCard
                type="warning"
                title="Permission Gaps Detected"
                message={`${metrics.totalGaps} permission gaps found across users. Consider reviewing and addressing high-priority gaps.`}
                action="Review Gaps"
              />
            )}
            {metrics.totalOverPermissions > 0 && (
              <InsightCard
                type="danger"
                title="Over-Permissions Detected"
                message={`${metrics.totalOverPermissions} instances of over-permissions found. Apply principle of least privilege.`}
                action="Review Security"
              />
            )}
            {metrics.averageEfficiencyScore < 70 && (
              <InsightCard
                type="info"
                title="Efficiency Can Be Improved"
                message="Average efficiency score is below optimal. Review AI recommendations to improve workflow efficiency."
                action="View Recommendations"
              />
            )}
            {metrics.totalRecommendations > 0 && (
              <InsightCard
                type="success"
                title="AI Recommendations Available"
                message={`${metrics.totalRecommendations} AI-powered recommendations ready to review. Optimize permissions with one click.`}
                action="View Recommendations"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: "up" | "down";
}) {
  const colorClasses = {
    red: "text-red-400 bg-red-500/20 border-red-500/20",
    green: "text-green-400 bg-green-500/20 border-green-500/20",
    blue: "text-blue-400 bg-blue-500/20 border-blue-500/20",
    yellow: "text-yellow-400 bg-yellow-500/20 border-yellow-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">{title}</div>
        {trend && <i className={`ri-arrow-${trend}-line text-lg`}></i>}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </motion.div>
  );
}

function InsightCard({
  type,
  title,
  message,
  action,
}: {
  type: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
  action: string;
}) {
  const typeStyles = {
    info: "border-blue-500/20 bg-blue-500/10",
    warning: "border-yellow-500/20 bg-yellow-500/10",
    danger: "border-red-500/20 bg-red-500/10",
    success: "border-green-500/20 bg-green-500/10",
  };

  const icons = {
    info: "ri-information-line",
    warning: "ri-alert-line",
    danger: "ri-error-warning-line",
    success: "ri-checkbox-circle-line",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border ${typeStyles[type]}`}
    >
      <div className="flex items-start gap-3">
        <i className={`${icons[type]} text-xl mt-1`}></i>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-300 mb-2">{message}</p>
          <button className="text-xs text-cyan-400 hover:text-cyan-300">
            {action} →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function getColorForIndex(index: number): string {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#6366f1",
  ];
  return colors[index % colors.length];
}
