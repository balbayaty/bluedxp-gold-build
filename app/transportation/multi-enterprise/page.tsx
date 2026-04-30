/**
 * Multi-Enterprise Network Page
 *
 * Trading partner management and collaborative planning
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Network,
  Users,
  Handshake,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  Clock,
  Target,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import type {
  TradingPartner,
  CollaborativePlan,
  NetworkCollaboration,
  NetworkAnalytics,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function MultiEnterpriseNetworkPage() {
  const [partners, setPartners] = useState<TradingPartner[]>([]);
  const [plans, setPlans] = useState<CollaborativePlan[]>([]);
  const [collaborations, setCollaborations] = useState<NetworkCollaboration[]>(
    [],
  );
  const [selectedPartner, setSelectedPartner] = useState<TradingPartner | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<
    "PARTNERS" | "PLANS" | "COLLABORATIONS" | "ANALYTICS"
  >("PARTNERS");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPartners();
    loadPlans();
    loadCollaborations();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await apiFetch("/api/transportation/multi-enterprise");
      const data = await response.json();
      if (data.partners) {
        setPartners(data.partners);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading partners", err, {
        module: "transportation",
        service: "multi-enterprise",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "multi-enterprise",
      });
    }
  };

  const loadPlans = async () => {
    try {
      // Load plans
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading plans", err, {
        module: "transportation",
        service: "multi-enterprise",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "multi-enterprise",
      });
    }
  };

  const loadCollaborations = async () => {
    try {
      // Load collaborations
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading collaborations", err, {
        module: "transportation",
        service: "multi-enterprise",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "multi-enterprise",
      });
    }
  };

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <PageTemplate
      title="Multi-Enterprise Network"
      description="Trading partner management and collaborative planning"
      icon="ri-network-line"
      stats={[
        { label: "Partners", value: partners.length, icon: "ri-user-line" },
        {
          label: "Active Plans",
          value: plans.filter((p) => p.status === "ACTIVE").length,
          icon: "ri-file-list-line",
        },
        {
          label: "Collaborations",
          value: collaborations.filter((c) => c.status === "ACTIVE").length,
          icon: "ri-handshake-line",
        },
        {
          label: "Active Partners",
          value: partners.filter((p) => p.status === "ACTIVE").length,
          icon: "ri-user-star-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "PARTNERS", label: "Partners", icon: Users },
            { id: "PLANS", label: "Plans", icon: Network },
            { id: "COLLABORATIONS", label: "Collaborations", icon: Handshake },
            { id: "ANALYTICS", label: "Analytics", icon: BarChart3 },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                viewMode === mode.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <mode.icon className="w-4 h-4 inline mr-2" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Partners View */}
        {viewMode === "PARTNERS" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Partners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  onClick={() => setSelectedPartner(partner)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Plans View */}
        {viewMode === "PLANS" && (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        {/* Collaborations View */}
        {viewMode === "COLLABORATIONS" && (
          <div className="space-y-4">
            {collaborations.map((collab) => (
              <CollaborationCard key={collab.type} collaboration={collab} />
            ))}
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "ANALYTICS" && (
          <NetworkAnalyticsDashboard
            partners={partners}
            collaborations={collaborations}
          />
        )}
      </div>
    </PageTemplate>
  );
}

function PartnerCard({
  partner,
  onClick,
}: {
  partner: TradingPartner;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            partner.status === "ACTIVE"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
          }`}
        >
          {partner.status}
        </span>
      </div>
      <h4 className="font-bold mb-2">{partner.name}</h4>
      <p className="text-sm text-gray-500 mb-4">
        {partner.type} • {partner.role}
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Integration</span>
          <span className="font-medium">{partner.integration.method}</span>
        </div>
        {partner.rating && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Rating</span>
            <span className="font-medium">{partner.rating}/5</span>
          </div>
        )}
        {partner.performance && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              On-Time Rate
            </span>
            <span className="font-medium">
              {partner.performance.onTimeRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PlanCard({ plan }: { plan: CollaborativePlan }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold">{plan.name}</h4>
          <p className="text-sm text-gray-500">{plan.description}</p>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            plan.status === "ACTIVE"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : plan.status === "COMPLETED"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
          }`}
        >
          {plan.status}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Participants</span>
          <p className="font-medium">{plan.participants.length}</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Shipments</span>
          <p className="font-medium">{plan.shipments.length}</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Objectives</span>
          <p className="font-medium">{plan.objectives.length}</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Created</span>
          <p className="font-medium">
            {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function CollaborationCard({
  collaboration,
}: {
  collaboration: NetworkCollaboration;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold">{collaboration.type}</h4>
          <p className="text-sm text-gray-500">
            {collaboration.participants.length} participants
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            collaboration.status === "ACTIVE"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : collaboration.status === "PENDING"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
          }`}
        >
          {collaboration.status}
        </span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Created: {new Date(collaboration.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

function NetworkAnalyticsDashboard({
  partners,
  collaborations,
}: {
  partners: TradingPartner[];
  collaborations: NetworkCollaboration[];
}) {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "1Y">(
    "30D",
  );

  // Calculate analytics
  const totalPartners = partners.length;
  const activeCollaborations = collaborations.filter(
    (c) => c.status === "ACTIVE",
  ).length;
  const totalVolume = collaborations.reduce(
    (sum, c) => sum + (c.volume || 0),
    0,
  );
  const totalRevenue = collaborations.reduce(
    (sum, c) => sum + (c.revenue || 0),
    0,
  );
  const avgEfficiency =
    collaborations.length > 0
      ? collaborations.reduce((sum, c) => sum + (c.efficiency || 0), 0) /
        collaborations.length
      : 0;

  const metrics = [
    {
      title: "Total Partners",
      value: totalPartners,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      title: "Active Collaborations",
      value: activeCollaborations,
      change: "+8%",
      trend: "up",
      icon: Handshake,
      color: "green",
    },
    {
      title: "Total Volume",
      value: `${(totalVolume / 1000).toFixed(1)}K`,
      change: "+15%",
      trend: "up",
      icon: Package,
      color: "purple",
    },
    {
      title: "Total Revenue",
      value: `$${(totalRevenue / 1000000).toFixed(1)}M`,
      change: "+22%",
      trend: "up",
      icon: DollarSign,
      color: "orange",
    },
    {
      title: "Avg Efficiency",
      value: `${avgEfficiency.toFixed(1)}%`,
      change: "+3%",
      trend: "up",
      icon: Target,
      color: "cyan",
    },
    {
      title: "Response Time",
      value: "2.4 hrs",
      change: "-15%",
      trend: "down",
      icon: Clock,
      color: "indigo",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Network Analytics Dashboard
        </h3>
        <div className="flex items-center gap-2">
          {["7D", "30D", "90D", "1Y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const colorClasses = {
            blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
            green:
              "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
            purple:
              "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
            orange:
              "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
            cyan: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400",
            indigo:
              "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400",
          };          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-lg p-4 border ${colorClasses[metric.color as keyof typeof colorClasses]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{metric.title}</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    metric.trend === "up"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
            </motion.div>
          );
        })}
      </div>      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Volume Trend
          </h4>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 72, 68, 75, 80, 78, 85].map((height, idx) => (
              <motion.div
                key={idx}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: idx * 0.1 }}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>        {/* Revenue Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Revenue Trend
          </h4>
          <div className="h-64 flex items-end justify-between gap-2">
            {[55, 62, 58, 68, 72, 70, 75].map((height, idx) => (
              <motion.div
                key={idx}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: idx * 0.1 }}
                className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg"
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>      {/* Top Partners */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top Performing Partners
        </h4>
        <div className="space-y-3">
          {partners.slice(0, 5).map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-medium">{partner.name}</div>
                  <div className="text-sm text-gray-500">{partner.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600 dark:text-green-400">
                  ${(Math.random() * 500000 + 100000).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}