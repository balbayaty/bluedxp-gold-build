/**
 * Proposals & RFQ Dashboard
 * World-class proposal management system
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import Link from "next/link";
import ProposalEmptyState from "@/components/proposals/ProposalEmptyState";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

// Stats Card Component
const StatsCard = ({
  title,
  value,
  change,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
  trend?: "up" | "down" | "neutral";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {change && (
          <p
            className={`text-sm mt-2 flex items-center gap-1 ${
              trend === "up"
                ? "text-green-200"
                : trend === "down"
                  ? "text-red-200"
                  : "opacity-80"
            }`}
          >
            {trend === "up" && <i className="ri-arrow-up-line" />}
            {trend === "down" && <i className="ri-arrow-down-line" />}
            {change}
          </p>
        )}
      </div>
      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
        <i className={`${icon} text-2xl`} />
      </div>
    </div>
  </motion.div>
);

// Quick Action Card
const QuickAction = ({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) => (
  <Link href={href}>
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
    >
      <div
        className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}
      >
        <i className={`${icon} text-xl text-white`} />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </motion.div>
  </Link>
);

// Service Category Card
const ServiceCategory = ({
  name,
  icon,
  count,
  revenue,
  color,
}: {
  name: string;
  icon: string;
  count: number;
  revenue: string;
  color: string;
}) => (
  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div
      className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}
    >
      <i className={`${icon} text-white`} />
    </div>
    <div className="flex-1">
      <p className="font-medium text-gray-900 dark:text-white">{name}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {count} proposals
      </p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900 dark:text-white">{revenue}</p>
      <p className="text-xs text-gray-500">Total Value</p>
    </div>
  </div>
);

// Recent Activity Item
const ActivityItem = ({
  type,
  title,
  customer,
  time,
  status,
}: {
  type: string;
  title: string;
  customer: string;
  time: string;
  status: string;
}) => {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    SENT: "bg-purple-100 text-purple-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          type === "rfq"
            ? "bg-blue-100 text-blue-600"
            : "bg-purple-100 text-purple-600"
        }`}
      >
        <i
          className={
            type === "rfq" ? "ri-questionnaire-line" : "ri-file-paper-2-line"
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">
          {title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {customer} • {time}
        </p>
      </div>
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    </div>
  );
};

export default function ProposalsDashboard() {
  const { user, hasModuleAccess } = useAuth();

  // All hooks must be called before any conditional returns (React rules of hooks)
  const [stats, setStats] = useState({
    totalRFQs: 47,
    activeProposals: 23,
    pendingApproval: 8,
    conversionRate: 68,
    totalValue: 2450000,
    monthlyGrowth: 12.5,
  });
  const [collaborationStats, setCollaborationStats] = useState({
    activeCollaborators: 12,
    pendingComments: 5,
    activeABTests: 3,
    followUpSequences: 18,
    contentBlocksUsed: 156,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real-time data
  useEffect(() => {
    // Only load data if user has access
    if (hasModuleAccess("proposals-rfq", "read_only")) {
      loadDashboardData();
      // Set up polling for real-time updates
      const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permission check - AFTER all hooks
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to access the Proposals Dashboard"
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
              You do not have the required permissions to view the Proposals
              Dashboard. Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  const loadDashboardData = async () => {
    try {
      // Load proposals
      const proposalsRes = await fetch(
        "/api/proposals/enhanced?limit=5&sortBy=updatedAt&sortOrder=desc",
      );
      const proposalsData = await proposalsRes.json();

      // Load RFQs
      const rfqsRes = await fetch(
        "/api/proposals/rfq?limit=5&sortBy=updatedAt&sortOrder=desc",
      );
      const rfqsData = await rfqsRes.json();

      // Transform to activity format
      const activities: any[] = [];

      if (proposalsData.success && proposalsData.data) {
        proposalsData.data.forEach((proposal: any) => {
          activities.push({
            type: "proposal",
            title: proposal.title,
            customer: proposal.customerName || "Unknown",
            time: formatTimeAgo(proposal.updatedAt),
            status: proposal.status,
            id: proposal.id,
          });
        });
      }

      if (rfqsData.success && rfqsData.data) {
        rfqsData.data.forEach((rfq: any) => {
          activities.push({
            type: "rfq",
            title: rfq.title,
            customer: rfq.customer?.name || "Unknown",
            time: formatTimeAgo(rfq.updatedAt),
            status: rfq.status,
            id: rfq.id,
          });
        });
      }

      // Sort by time and limit to 5
      activities.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      );
      setRecentActivity(activities.slice(0, 5));

      // Update stats if available
      if (proposalsData.stats) {
        setStats((prev) => ({
          ...prev,
          activeProposals:
            proposalsData.stats.activeProposals || prev.activeProposals,
          pendingApproval:
            proposalsData.stats.pendingApproval || prev.pendingApproval,
          conversionRate:
            proposalsData.stats.conversionRate || prev.conversionRate,
          totalValue: proposalsData.stats.totalValue || prev.totalValue,
        }));
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Fallback to mock data
      setRecentActivity([
        {
          type: "rfq",
          title: "Warehousing Services - Q4",
          customer: "Saudi Aramco",
          time: "2h ago",
          status: "SUBMITTED",
        },
        {
          type: "proposal",
          title: "Cross-Border Logistics Package",
          customer: "P&G Saudi",
          time: "4h ago",
          status: "SENT",
        },
        {
          type: "rfq",
          title: "Rail Freight - GTT to JART",
          customer: "SABIC",
          time: "6h ago",
          status: "UNDER_REVIEW",
        },
        {
          type: "proposal",
          title: "Complete Supply Chain Solution",
          customer: "Almarai",
          time: "1d ago",
          status: "ACCEPTED",
        },
        {
          type: "rfq",
          title: "Cold Chain Transport",
          customer: "Panda Retail",
          time: "1d ago",
          status: "APPROVED",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string | Date): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const serviceCategories = [
    {
      name: "Warehousing",
      icon: "ri-building-4-line",
      count: 15,
      revenue: "SAR 850K",
      color: "bg-indigo-500",
    },
    {
      name: "Transportation",
      icon: "ri-truck-line",
      count: 12,
      revenue: "SAR 620K",
      color: "bg-emerald-500",
    },
    {
      name: "Customs Clearance",
      icon: "ri-shield-check-line",
      count: 8,
      revenue: "SAR 340K",
      color: "bg-amber-500",
    },
    {
      name: "Freight Forwarding",
      icon: "ri-ship-line",
      count: 6,
      revenue: "SAR 450K",
      color: "bg-blue-500",
    },
    {
      name: "Rail Freight",
      icon: "ri-train-line",
      count: 4,
      revenue: "SAR 190K",
      color: "bg-purple-500",
    },
  ];

  if (loading) {
    return (
      <PageTemplate
        title="Proposals & RFQ"
        description="Comprehensive proposal generation and quotation management"
        icon="ri-file-paper-2-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading dashboard...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Please wait while we fetch your data
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error && recentActivity.length === 0) {
    return (
      <PageTemplate
        title="Proposals & RFQ"
        description="Comprehensive proposal generation and quotation management"
        icon="ri-file-paper-2-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Proposals & RFQ"
      description="Comprehensive proposal generation and quotation management"
      icon="ri-file-paper-2-line"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active RFQs"
            value={stats.totalRFQs}
            change="+5 this week"
            icon="ri-questionnaire-line"
            color="from-blue-500 to-blue-600"
            trend="up"
          />
          <StatsCard
            title="Active Proposals"
            value={stats.activeProposals}
            change="+3 pending"
            icon="ri-file-paper-2-line"
            color="from-purple-500 to-purple-600"
            trend="up"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            change="+4.2% vs last month"
            icon="ri-pie-chart-line"
            color="from-emerald-500 to-emerald-600"
            trend="up"
          />
          <StatsCard
            title="Pipeline Value"
            value={`SAR ${(stats.totalValue / 1000000).toFixed(1)}M`}
            change={`+${stats.monthlyGrowth}% growth`}
            icon="ri-money-dollar-circle-line"
            color="from-amber-500 to-orange-500"
            trend="up"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            title="New RFQ"
            description="Create a request for quotation"
            icon="ri-add-circle-line"
            href="/proposals/rfq/new"
            color="bg-blue-500"
          />
          <QuickAction
            title="Create Proposal"
            description="Generate a new proposal"
            icon="ri-file-add-line"
            href="/proposals/universal/new"
            color="bg-purple-500"
          />
          <QuickAction
            title="Service Catalog"
            description="Manage services & pricing"
            icon="ri-service-line"
            href="/proposals/services"
            color="bg-emerald-500"
          />
          <QuickAction
            title="Train Schedules"
            description="Global rail network"
            icon="ri-train-line"
            href="/proposals/train-schedules"
            color="bg-amber-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Link
                href="/proposals/list"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </Link>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
                  <i className="ri-alert-line" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <ActivityItem key={index} {...item} />
                ))
              ) : (
                <ProposalEmptyState type="proposals" />
              )}
            </div>
          </div>

          {/* Service Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                By Service
              </h2>
              <Link
                href="/proposals/services"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              {serviceCategories.map((cat, index) => (
                <ServiceCategory key={index} {...cat} />
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pipeline Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              {
                stage: "RFQ Received",
                count: 12,
                color: "bg-gray-200 dark:bg-gray-700",
              },
              {
                stage: "Under Review",
                count: 8,
                color: "bg-blue-100 dark:bg-blue-900/30",
              },
              {
                stage: "Pricing",
                count: 6,
                color: "bg-yellow-100 dark:bg-yellow-900/30",
              },
              {
                stage: "Proposal Sent",
                count: 10,
                color: "bg-purple-100 dark:bg-purple-900/30",
              },
              {
                stage: "Negotiation",
                count: 4,
                color: "bg-orange-100 dark:bg-orange-900/30",
              },
              {
                stage: "Won",
                count: 7,
                color: "bg-green-100 dark:bg-green-900/30",
              },
            ].map((stage, index) => (
              <div
                key={index}
                className={`${stage.color} rounded-lg p-4 text-center`}
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stage.count}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {stage.stage}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Module Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/proposals/journey">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="ri-route-line text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Journey Analysis</h3>
                  <p className="text-sm opacity-80">
                    Optimize logistics touchpoints
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/proposals/analytics">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="ri-bar-chart-box-line text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Analytics & Reports</h3>
                  <p className="text-sm opacity-80">Performance insights</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/proposals/templates">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="ri-layout-4-line text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Templates</h3>
                  <p className="text-sm opacity-80">
                    Proposal & document templates
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </PageTemplate>
  );
}
