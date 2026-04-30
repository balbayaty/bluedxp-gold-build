"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import { format } from "date-fns";

interface Dashboard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category:
    | "OPERATIONAL"
    | "INVENTORY"
    | "ORDER"
    | "PERFORMANCE"
    | "FINANCIAL"
    | "CUSTOM"
    | "KPI";
  route: string;
  lastViewed?: Date | string;
  viewCount: number;
  isFavorite: boolean;
  widgets: number;
  lastUpdated: Date | string;
}

const dashboards: Dashboard[] = [
  {
    id: "DASH-001",
    name: "Operational Dashboard",
    description:
      "Real-time operational metrics, throughput, and warehouse performance",
    icon: "ri-dashboard-3-line",
    category: "OPERATIONAL",
    route: "/reports/operational",
    viewCount: 1250,
    isFavorite: true,
    widgets: 12,
    lastUpdated: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: "DASH-002",
    name: "Inventory Dashboard",
    description: "Stock levels, valuation, movement trends, and ABC analysis",
    icon: "ri-stack-line",
    category: "INVENTORY",
    route: "/reports/inventory",
    viewCount: 980,
    isFavorite: true,
    widgets: 10,
    lastUpdated: new Date(Date.now() - 1 * 86400000),
  },
  {
    id: "DASH-003",
    name: "Order Dashboard",
    description:
      "Order fulfillment, customer performance, and delivery metrics",
    icon: "ri-shopping-cart-line",
    category: "ORDER",
    route: "/reports/orders",
    viewCount: 850,
    isFavorite: false,
    widgets: 8,
    lastUpdated: new Date(Date.now() - 3 * 86400000),
  },
  {
    id: "DASH-004",
    name: "Performance Dashboard",
    description: "KPI tracking, efficiency metrics, and benchmarking",
    icon: "ri-bar-chart-box-line",
    category: "PERFORMANCE",
    route: "/reports/performance",
    viewCount: 720,
    isFavorite: false,
    widgets: 9,
    lastUpdated: new Date(Date.now() - 5 * 86400000),
  },
  {
    id: "DASH-005",
    name: "Financial Dashboard",
    description: "Cost analysis, revenue tracking, and profitability metrics",
    icon: "ri-money-dollar-circle-line",
    category: "FINANCIAL",
    route: "/reports/financial",
    viewCount: 650,
    isFavorite: false,
    widgets: 7,
    lastUpdated: new Date(Date.now() - 4 * 86400000),
  },
  {
    id: "DASH-006",
    name: "KPI Dashboard",
    description: "Key performance indicators and real-time metrics",
    icon: "ri-line-chart-line",
    category: "KPI",
    route: "/kpi-dashboard",
    viewCount: 1100,
    isFavorite: true,
    widgets: 15,
    lastUpdated: new Date(Date.now() - 1 * 86400000),
  },
  {
    id: "DASH-007",
    name: "Custom Dashboard",
    description: "Build your own custom dashboard with drag-and-drop widgets",
    icon: "ri-layout-grid-line",
    category: "CUSTOM",
    route: "/reports/custom",
    viewCount: 450,
    isFavorite: false,
    widgets: 0,
    lastUpdated: new Date(Date.now() - 7 * 86400000),
  },
  {
    id: "DASH-008",
    name: "Customer Dashboard",
    description: "Customer-specific analytics and insights",
    icon: "ri-user-line",
    category: "CUSTOM",
    route: "/customer-dashboard",
    viewCount: 320,
    isFavorite: false,
    widgets: 6,
    lastUpdated: new Date(Date.now() - 6 * 86400000),
  },
];

const categoryColors: Record<string, string> = {
  OPERATIONAL: "from-blue-500 to-cyan-600",
  INVENTORY: "from-green-500 to-emerald-600",
  ORDER: "from-purple-500 to-pink-600",
  PERFORMANCE: "from-yellow-500 to-orange-600",
  FINANCIAL: "from-cyan-500 to-blue-600",
  KPI: "from-red-500 to-pink-600",
  CUSTOM: "from-gray-500 to-slate-600",
};

const categoryLabels: Record<string, string> = {
  OPERATIONAL: "Operational",
  INVENTORY: "Inventory",
  ORDER: "Order",
  PERFORMANCE: "Performance",
  FINANCIAL: "Financial",
  KPI: "KPI",
  CUSTOM: "Custom",
};

export default function DashboardsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(dashboards.filter((d) => d.isFavorite).map((d) => d.id)),
  );

  const filteredDashboards = useMemo(() => {
    return dashboards.filter((dashboard) => {
      const matchesSearch =
        dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dashboard.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || dashboard.category === selectedCategory;
      const matchesFavorites =
        !showFavoritesOnly || favorites.has(dashboard.id);
      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [searchQuery, selectedCategory, showFavoritesOnly, favorites]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    dashboards.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleToggleFavorite = (dashboardId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(dashboardId)) {
        newFavorites.delete(dashboardId);
      } else {
        newFavorites.add(dashboardId);
      }
      return newFavorites;
    });
  };

  const handleOpenDashboard = (dashboard: Dashboard) => {
    router.push(dashboard.route);
  };

  const stats = [
    {
      label: "Total Dashboards",
      value: dashboards.length,
      icon: "ri-dashboard-line",
      tooltip: "Total dashboards available",
      trend: "up" as const,
    },
    {
      label: "Favorites",
      value: favorites.size,
      icon: "ri-star-line",
      tooltip: "Favorite dashboards",
      trend: "up" as const,
    },
    {
      label: "Total Views",
      value: dashboards.reduce((sum, d) => sum + d.viewCount, 0),
      icon: "ri-eye-line",
      tooltip: "Total dashboard views",
      trend: "up" as const,
    },
    {
      label: "Categories",
      value: Object.keys(categoryStats).length,
      icon: "ri-folder-line",
      tooltip: "Dashboard categories",
      trend: "neutral" as const,
    },
  ];

  return (
    <PageTemplate
      title="Dashboards"
      description="Access all analytics dashboards including operational, inventory, order, performance, financial, and custom dashboards"
      icon="ri-dashboard-line"
      systemInfo={{
        sap: "Dashboards, Analytics, Reporting",
        oracle: "Dashboards, Analytics, Reporting",
        manhattan: "Dashboards, Analytics, Reporting",
      }}
      examples={[
        "Operational metrics",
        "Inventory analytics",
        "Order fulfillment",
        "Performance KPIs",
        "Financial reports",
        "Custom dashboards",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
              showFavoritesOnly
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i className={`ri-star-${showFavoritesOnly ? "fill" : "line"}`}></i>
            {showFavoritesOnly ? "Favorites Only" : "Show All"}
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Dashboard Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDashboards.map((dashboard, index) => (
          <motion.div
            key={dashboard.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer group"
            onClick={() => handleOpenDashboard(dashboard)}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[dashboard.category] || "from-gray-500 to-slate-600"} flex items-center justify-center text-white text-2xl shadow-lg`}
              >
                <i className={dashboard.icon}></i>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(dashboard.id);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  favorites.has(dashboard.id)
                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                    : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                }`}
              >
                <i
                  className={`ri-star-${favorites.has(dashboard.id) ? "fill" : "line"}`}
                ></i>
              </button>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              {dashboard.name}
            </h3>
            <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
              {dashboard.description}
            </p>
            <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded bg-white/5 text-white`}>
                  {categoryLabels[dashboard.category]}
                </span>
                <span className="px-2 py-1 rounded bg-white/5">
                  {dashboard.widgets} widgets
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                <div className="flex items-center gap-1">
                  <i className="ri-eye-line"></i>
                  <span>{dashboard.viewCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className="ri-time-line"></i>
                  <span>
                    {format(new Date(dashboard.lastUpdated), "MMM dd")}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDashboard(dashboard);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                Open
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDashboards.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-dashboard-line text-6xl text-[#64748B] mb-4"></i>
          <p className="text-lg font-semibold text-white mb-2">
            No dashboards found
          </p>
          <p className="text-sm text-[#9ca3af]">
            {showFavoritesOnly
              ? "No favorite dashboards. Try adjusting your filters."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}

      {/* Quick Access Section */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboards
            .filter((d) => favorites.has(d.id))
            .slice(0, 4)
            .map((dashboard) => (
              <motion.button
                key={dashboard.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenDashboard(dashboard)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 hover:bg-white/10 transition-all text-left"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[dashboard.category] || "from-gray-500 to-slate-600"} flex items-center justify-center text-white text-lg mb-3`}
                >
                  <i className={dashboard.icon}></i>
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  {dashboard.name}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {dashboard.viewCount} views
                </div>
              </motion.button>
            ))}
        </div>
      </div>
    </PageTemplate>
  );
}
