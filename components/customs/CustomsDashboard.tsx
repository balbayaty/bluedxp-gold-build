/**
 * 🌍 Customs & Regulatory Dashboard
 *
 * The most comprehensive, modern, and intuitive customs management dashboard
 * Features:
 * - Real-time declaration tracking
 * - Interactive border intelligence map
 * - Document management with drag-drop
 * - Compliance scoring visualization
 * - TIR carnet management
 * - Touchpoint intelligence
 * - AI-powered recommendations
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import DeclarationForm from "./DeclarationForm";
import DocumentManager from "./DocumentManager";
import TouchpointMap from "./TouchpointMap";
import TIRManagement from "./TIRManagement";
import BulkOperations from "./BulkOperations";
import AIRecommendations from "./AIRecommendations";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText,
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiGlobe,
  FiTruck,
  FiUpload,
  FiDownload,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPlus,
  FiEdit,
  FiEye,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiZap,
  FiTarget,
  FiAward,
  FiAlertCircle,
  FiInfo,
  FiSettings,
  FiBell,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

interface CustomsDashboardProps {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

interface DeclarationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cleared: number;
  held: number;
}

interface ComplianceMetrics {
  averageScore: number;
  compliant: number;
  nonCompliant: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// ============================================================================
// CUSTOMS DASHBOARD
// ============================================================================

export default function CustomsDashboard({
  tenantId = "default",
  userId = "anonymous",
  userRole = "user",
}: CustomsDashboardProps) {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "declarations"
    | "documents"
    | "touchpoints"
    | "tir"
    | "compliance"
  >("overview");
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [summary, setSummary] = useState<DeclarationSummary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cleared: 0,
    held: 0,
  });
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics>(
    {
      averageScore: 0,
      compliant: 0,
      nonCompliant: 0,
      riskLevel: "LOW",
    },
  );
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time updates
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const dataInterval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Every 30 seconds

    loadDashboardData();

    return () => {
      clearInterval(clockInterval);
      clearInterval(dataInterval);
    };
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      // Fetch declarations
      const declResponse = await fetch("/api/customs/declarations?limit=10");
      if (declResponse.ok) {
        const declData = await declResponse.json();
        setDeclarations(declData.declarations || []);

        // Calculate summary
        const summaryData: DeclarationSummary = {
          total: declData.total || 0,
          pending: declData.pending || 0,
          approved: declData.approved || 0,
          rejected: declData.rejected || 0,
          cleared: declData.cleared || 0,
          held: declData.held || 0,
        };
        setSummary(summaryData);
      }

      // Fetch compliance metrics
      const complianceResponse = await fetch("/api/customs/compliance/metrics");
      if (complianceResponse.ok) {
        const complianceData = await complianceResponse.json();
        setComplianceMetrics(
          complianceData || {
            averageScore: 85,
            compliant: 0,
            nonCompliant: 0,
            riskLevel: "LOW",
          },
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Set default values on error
      setSummary({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cleared: 0,
        held: 0,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Chart data
  const statusChartData = [
    { name: "Pending", value: summary.pending, color: "#F59E0B" },
    { name: "Approved", value: summary.approved, color: "#10B981" },
    { name: "Rejected", value: summary.rejected, color: "#EF4444" },
    { name: "Cleared", value: summary.cleared, color: "#3B82F6" },
    { name: "Held", value: summary.held, color: "#8B5CF6" },
  ];

  const trendData = [
    { date: "Mon", declarations: 12, cleared: 10 },
    { date: "Tue", declarations: 15, cleared: 13 },
    { date: "Wed", declarations: 18, cleared: 16 },
    { date: "Thu", declarations: 14, cleared: 12 },
    { date: "Fri", declarations: 20, cleared: 18 },
    { date: "Sat", declarations: 8, cleared: 7 },
    { date: "Sun", declarations: 5, cleared: 4 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg bg-gray-900/90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="relative w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20"
              >
                <FiGlobe className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-30"></div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Customs & Regulatory Dashboard
                </h1>
                <p className="text-sm text-gray-400">
                  Real-time customs management •{" "}
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={loadDashboardData}
                disabled={refreshing}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                <FiSettings className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors relative">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-2 border-b border-gray-700">
          {[
            { id: "overview", label: "Overview", icon: FiBarChart },
            { id: "declarations", label: "Declarations", icon: FiFileText },
            { id: "documents", label: "Documents", icon: FiUpload },
            { id: "touchpoints", label: "Touchpoints", icon: FiMapPin },
            { id: "tir", label: "TIR Carnets", icon: FiTruck },
            { id: "compliance", label: "Compliance", icon: FiShield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Declarations"
                  value={summary.total}
                  trend="+12%"
                  trendUp={true}
                  icon={FiFileText}
                  color="cyan"
                />
                <KPICard
                  title="Pending Review"
                  value={summary.pending}
                  trend="+5"
                  trendUp={false}
                  icon={FiClock}
                  color="yellow"
                />
                <KPICard
                  title="Compliance Score"
                  value={`${complianceMetrics.averageScore}%`}
                  trend="+3%"
                  trendUp={true}
                  icon={FiShield}
                  color="green"
                />
                <KPICard
                  title="Cleared Today"
                  value={summary.cleared}
                  trend="+8%"
                  trendUp={true}
                  icon={FiCheckCircle}
                  color="blue"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <ChartCard title="Declaration Status Distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Trend Chart */}
                <ChartCard title="Weekly Trends">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient
                          id="colorDeclarations"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#06B6D4"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06B6D4"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorCleared"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10B981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10B981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="declarations"
                        stroke="#06B6D4"
                        fillOpacity={1}
                        fill="url(#colorDeclarations)"
                        name="Declarations"
                      />
                      <Area
                        type="monotone"
                        dataKey="cleared"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorCleared)"
                        name="Cleared"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Recent Declarations */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <FiFileText className="text-cyan-400" />
                    <span>Recent Declarations</span>
                  </h3>
                  <button
                    onClick={() => router.push("/customs/declarations")}
                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {declarations.slice(0, 5).map((declaration, index) => (
                    <DeclarationRow
                      key={declaration.id || index}
                      declaration={declaration}
                    />
                  ))}
                  {declarations.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No declarations yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <AIRecommendations />
              </div>
            </motion.div>
          )}

          {activeTab === "declarations" && (
            <motion.div
              key="declarations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DeclarationsView />
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Document Management</h3>
                  <button
                    onClick={() => router.push("/customs/documents")}
                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>View Full Page</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <DocumentsView />
              </div>
            </motion.div>
          )}

          {activeTab === "touchpoints" && (
            <motion.div
              key="touchpoints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Touchpoint Intelligence
                  </h3>
                  <button
                    onClick={() => router.push("/customs/touchpoints")}
                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>View Full Map</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-[400px]">
                  <TouchpointsView />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "tir" && (
            <motion.div
              key="tir"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    TIR Carnet Management
                  </h3>
                  <button
                    onClick={() => router.push("/customs/tir")}
                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>View Full Page</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <TIRView />
              </div>
            </motion.div>
          )}

          {activeTab === "compliance" && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Compliance Dashboard
                  </h3>
                  <button
                    onClick={() => router.push("/customs/compliance")}
                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>View Full Page</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <ComplianceView complianceMetrics={complianceMetrics} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function KPICard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: any;
  color: "cyan" | "yellow" | "green" | "blue" | "purple" | "red";
}) {
  const colorClasses = {
    cyan: "from-cyan-500 to-blue-600",
    yellow: "from-yellow-500 to-orange-600",
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    red: "from-red-500 to-rose-600",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 bg-gradient-to-r ${colorClasses[color]} rounded-xl`}
        >
          <Icon className="text-white text-xl" />
        </div>
        <div
          className={`flex items-center space-x-1 text-sm ${trendUp ? "text-green-400" : "text-red-400"}`}
        >
          {trendUp ? <FiTrendingUp /> : <FiTrendingDown />}
          <span>{trend}</span>
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function DeclarationRow({ declaration }: { declaration: any }) {
  const statusColors = {
    DRAFT: "bg-gray-500",
    SUBMITTED: "bg-yellow-500",
    UNDER_REVIEW: "bg-blue-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    CLEARED: "bg-cyan-500",
    HELD: "bg-purple-500",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div
          className={`w-2 h-2 rounded-full ${statusColors[declaration.status as keyof typeof statusColors] || "bg-gray-500"}`}
        ></div>
        <div className="flex-1">
          <p className="font-medium">
            {declaration.declarationNumber || declaration.id}
          </p>
          <p className="text-sm text-gray-400">
            {declaration.country} • {declaration.type}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            declaration.status === "APPROVED" ||
            declaration.status === "CLEARED"
              ? "bg-green-500/20 text-green-400"
              : declaration.status === "REJECTED"
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {declaration.status}
        </span>
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <FiEye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DeclarationsView() {
  const [showForm, setShowForm] = useState(false);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDeclarations();
  }, [filter]);

  useEffect(() => {
    if (searchQuery) {
      const timeout = setTimeout(() => {
        loadDeclarations();
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      loadDeclarations();
    }
  }, [searchQuery]);

  const loadDeclarations = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter.toUpperCase());
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/customs/declarations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeclarations(data.declarations || []);
      }
    } catch (error) {
      console.error("Failed to load declarations:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Declarations Management</h3>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                loadDeclarations();
              }}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Declaration</span>
          </button>
        </div>
      </div>

      {showForm ? (
        <DeclarationForm
          onSave={(declaration) => {
            console.log("Declaration saved:", declaration);
            setShowForm(false);
            loadDeclarations();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="space-y-4">
          <BulkOperations
            onBulkAction={(action, ids) => {
              console.log(`Bulk ${action} on:`, ids);
              loadDeclarations();
            }}
          />
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="space-y-3">
              {declarations.length > 0 ? (
                declarations.map((declaration, index) => (
                  <DeclarationRow
                    key={declaration.id || index}
                    declaration={declaration}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No declarations found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create a new declaration to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsView() {
  const [declarationId] = useState("decl-1");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Document Management</h3>
      <DocumentManager declarationId={declarationId} />
    </div>
  );
}

function TouchpointsView() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Touchpoint Intelligence</h3>
      <div className="h-[600px]">
        <TouchpointMap />
      </div>
    </div>
  );
}

function TIRView() {
  return <TIRManagement />;
}

function ComplianceView({
  complianceMetrics,
}: {
  complianceMetrics: ComplianceMetrics;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4">Compliance Dashboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Average Score</p>
          <p className="text-3xl font-bold text-cyan-400">
            {complianceMetrics.averageScore}%
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Compliant</p>
          <p className="text-3xl font-bold text-green-400">
            {complianceMetrics.compliant}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Risk Level</p>
          <p className="text-3xl font-bold text-yellow-400">
            {complianceMetrics.riskLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
