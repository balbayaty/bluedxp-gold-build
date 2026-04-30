"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import { format } from "date-fns";

interface Report {
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
    | "SLA";
  route: string;
  lastViewed?: Date | string;
  viewCount: number;
  isFavorite: boolean;
  lastUpdated: Date | string;
  color: string;
}

const reports: Report[] = [
  {
    id: "REP-001",
    name: "Operational Reports",
    description:
      "Real-time operational metrics, throughput, and warehouse performance",
    icon: "ri-dashboard-3-line",
    category: "OPERATIONAL",
    route: "/reports/operational",
    viewCount: 1250,
    isFavorite: true,
    lastUpdated: new Date(Date.now() - 2 * 86400000),
    color: "cyan",
  },
  {
    id: "REP-002",
    name: "Inventory Reports",
    description: "Stock levels, valuation, movement trends, and ABC analysis",
    icon: "ri-stack-line",
    category: "INVENTORY",
    route: "/reports/inventory",
    viewCount: 980,
    isFavorite: true,
    lastUpdated: new Date(Date.now() - 1 * 86400000),
    color: "blue",
  },
  {
    id: "REP-003",
    name: "Order Reports",
    description:
      "Order fulfillment, customer performance, and delivery metrics",
    icon: "ri-shopping-cart-line",
    category: "ORDER",
    route: "/reports/orders",
    viewCount: 850,
    isFavorite: false,
    lastUpdated: new Date(Date.now() - 3 * 86400000),
    color: "purple",
  },
  {
    id: "REP-004",
    name: "Performance Reports",
    description: "KPI tracking, efficiency metrics, and benchmarking",
    icon: "ri-bar-chart-box-line",
    category: "PERFORMANCE",
    route: "/reports/performance",
    viewCount: 720,
    isFavorite: false,
    lastUpdated: new Date(Date.now() - 5 * 86400000),
    color: "green",
  },
  {
    id: "REP-005",
    name: "Financial Reports",
    description: "Cost analysis, revenue tracking, and profitability metrics",
    icon: "ri-money-dollar-circle-line",
    category: "FINANCIAL",
    route: "/reports/financial",
    viewCount: 650,
    isFavorite: false,
    lastUpdated: new Date(Date.now() - 4 * 86400000),
    color: "yellow",
  },
  {
    id: "REP-006",
    name: "Custom Reports",
    description: "Build your own custom reports with drag-and-drop builder",
    icon: "ri-file-edit-line",
    category: "CUSTOM",
    route: "/reports/custom",
    viewCount: 420,
    isFavorite: false,
    lastUpdated: new Date(Date.now() - 7 * 86400000),
    color: "pink",
  },
  {
    id: "REP-007",
    name: "SLA Reports",
    description: "Service level agreement compliance and performance tracking",
    icon: "ri-time-line",
    category: "SLA",
    route: "/sla-kpi",
    viewCount: 580,
    isFavorite: true,
    lastUpdated: new Date(Date.now() - 1 * 86400000),
    color: "orange",
  },
];

const categoryColors = {
  OPERATIONAL: "from-cyan-500 to-blue-600",
  INVENTORY: "from-blue-500 to-indigo-600",
  ORDER: "from-purple-500 to-pink-600",
  PERFORMANCE: "from-green-500 to-emerald-600",
  FINANCIAL: "from-yellow-500 to-orange-600",
  CUSTOM: "from-pink-500 to-rose-600",
  SLA: "from-orange-500 to-red-600",
};

const categoryLabels = {
  OPERATIONAL: "Operational",
  INVENTORY: "Inventory",
  ORDER: "Order",
  PERFORMANCE: "Performance",
  FINANCIAL: "Financial",
  CUSTOM: "Custom",
  SLA: "SLA",
};

export default function ReportsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "views" | "updated">("updated");

  const filteredReports = useMemo(() => {
    let filtered = reports.filter((report) => {
      const matchesSearch =
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || report.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "views") {
        return b.viewCount - a.viewCount;
      } else {
        return (
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

  const favoriteReports = useMemo(() => {
    return reports.filter((r) => r.isFavorite);
  }, []);

  const stats = [
    {
      label: "Total Reports",
      value: reports.length,
      icon: "ri-file-chart-line",
      tooltip: "Total available reports",
      trend: "neutral" as const,
    },
    {
      label: "Favorites",
      value: favoriteReports.length,
      icon: "ri-star-line",
      tooltip: "Favorite reports",
      trend: "neutral" as const,
    },
    {
      label: "Total Views",
      value: reports.reduce((sum, r) => sum + r.viewCount, 0).toLocaleString(),
      icon: "ri-eye-line",
      tooltip: "Total report views",
      trend: "up" as const,
    },
  ];

  const categories = [
    "ALL",
    ...Array.from(new Set(reports.map((r) => r.category))),
  ];

  return (
    <PageTemplate
      title="Reports Hub"
      description="Access all operational, inventory, order, performance, financial, and custom reports. Build custom reports with drag-and-drop builder."
      shortDescription="Comprehensive reporting and analytics"
      icon="ri-file-chart-line"
      systemInfo={{
        sap: "Reports & Analytics",
        oracle: "Business Intelligence",
        manhattan: "Reports Hub",
      }}
      examples={[
        "View operational performance",
        "Analyze inventory trends",
        "Track order fulfillment",
        "Monitor KPIs and benchmarks",
        "Generate financial reports",
        "Create custom reports",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL"
                  ? "All Categories"
                  : categoryLabels[cat as keyof typeof categoryLabels]}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          >
            <option value="updated">Recently Updated</option>
            <option value="views">Most Viewed</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      }
    >
      {/* Favorite Reports */}
      {favoriteReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-star-fill text-yellow-400 text-lg"></i>
            <h2 className="text-lg font-semibold text-white">
              Favorite Reports
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(report.route)}
                className="group relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-5 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${categoryColors[report.category]} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <i className={`${report.icon} text-white text-xl`}></i>
                  </div>
                  <i className="ri-star-fill text-yellow-400 text-lg"></i>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                  {report.name}
                </h3>
                <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
                  {report.description}
                </p>
                <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                  <span>{report.viewCount.toLocaleString()} views</span>
                  <span>{format(new Date(report.lastUpdated), "MMM d")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Reports</h2>
          <span className="text-sm text-[#9ca3af]">
            {filteredReports.length} reports
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => router.push(report.route)}
              className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:border-cyan-500/50 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${categoryColors[report.category]} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <i className={`${report.icon} text-white text-xl`}></i>
                </div>
                {report.isFavorite && (
                  <i className="ri-star-fill text-yellow-400 text-sm"></i>
                )}
              </div>
              <div className="mb-2">
                <span
                  className={`inline-block px-2 py-0.5 bg-${report.color}-500/20 text-${report.color}-400 text-xs font-medium rounded border border-${report.color}-500/30`}
                >
                  {categoryLabels[report.category]}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                {report.name}
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
                {report.description}
              </p>
              <div className="flex items-center justify-between text-xs text-[#9ca3af] pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <i className="ri-eye-line"></i>
                    {report.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-time-line"></i>
                    {format(new Date(report.lastUpdated), "MMM d")}
                  </span>
                </div>
                <i className="ri-arrow-right-line text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Create Custom Report
            </h3>
            <p className="text-sm text-[#9ca3af]">
              Build your own report with drag-and-drop builder
            </p>
          </div>
          <button
            onClick={() => router.push("/reports/custom")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line"></i>
            <span>Create Report</span>
          </button>
        </div>
      </motion.div>
    </PageTemplate>
  );
}
