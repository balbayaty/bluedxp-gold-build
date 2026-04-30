"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Search,
  Truck,
  Ship,
  Building2,
  Users,
  Languages,
  Network,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Filter,
  Store,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import { intelligentSearchService } from "@/lib/services/marketplace/intelligentSearchService";
import { demandForecastingService } from "@/lib/services/marketplace/demandForecastingService";
import type { MarketplaceServiceCategory } from "@/types/marketplace";

// Lazy load heavy components for better performance
const RecommendationsPanel = lazy(
  () => import("@/components/marketplace/RecommendationsPanel"),
);
const ExportButton = lazy(
  () => import("@/components/marketplace/ExportButton"),
);

export default function MarketplaceDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalListings: 0,
    totalProviders: 0,
    totalBookings: 0,
    categories: {} as Record<MarketplaceServiceCategory, number>,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/marketplace/stats");
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      } else {
        // Error handled - stats remain at default values
        setStats({
          totalListings: 0,
          totalProviders: 0,
          totalBookings: 0,
          categories: {} as Record<MarketplaceServiceCategory, number>,
          averageRating: 0,
        });
      }
    } catch (error) {
      // Error handled - stats remain at default values
      setStats({
        totalListings: 0,
        totalProviders: 0,
        totalBookings: 0,
        categories: {} as Record<MarketplaceServiceCategory, number>,
        averageRating: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const serviceCategories = [
    {
      id: "STORAGE",
      name: "Storage Services",
      icon: Building2,
      color: "from-blue-600 to-cyan-600",
      description: "Warehouse storage, cold storage, hazmat",
      count: stats.categories.STORAGE || 0,
      href: "/marketplace/storage",
    },
    {
      id: "CROSSDOCKING",
      name: "Cross-Docking",
      icon: Network,
      color: "from-purple-600 to-pink-600",
      description: "Direct transfer, flow-through operations",
      count: stats.categories.CROSSDOCKING || 0,
      href: "/marketplace/crossdocking",
    },
    {
      id: "TRANSPORTATION",
      name: "Transportation",
      icon: Truck,
      color: "from-green-600 to-emerald-600",
      description: "FTL, LTL, Express, Last Mile",
      count: stats.categories.TRANSPORTATION || 0,
      href: "/marketplace/transportation",
    },
    {
      id: "FREIGHT",
      name: "Freight Services",
      icon: Ship,
      color: "from-orange-600 to-red-600",
      description: "FCL, LCL, Air, Sea, Rail",
      count: stats.categories.FREIGHT || 0,
      href: "/marketplace/freight",
    },
    {
      id: "CONSULTING",
      name: "Consulting Services",
      icon: Users,
      color: "from-indigo-600 to-blue-600",
      description: "Civil Defense, Saudization, Compliance",
      count: stats.categories.CONSULTING || 0,
      href: "/marketplace/consulting",
    },
    {
      id: "MANPOWER",
      name: "Manpower Services",
      icon: Users,
      color: "from-teal-600 to-cyan-600",
      description: "Warehouse staff, drivers, training",
      count: stats.categories.MANPOWER || 0,
      href: "/marketplace/manpower",
    },
    {
      id: "TRANSLATION",
      name: "Translation Services",
      icon: Languages,
      color: "from-violet-600 to-purple-600",
      description: "Multi-language, certified translation",
      count: stats.categories.TRANSLATION || 0,
      href: "/marketplace/translation",
    },
    {
      id: "WAREHOUSE_NETWORK",
      name: "Warehouse Network",
      icon: Network,
      color: "from-amber-600 to-yellow-600",
      description: "Multi-location, distribution centers",
      count: stats.categories.WAREHOUSE_NETWORK || 0,
      href: "/warehouse-network",
    },
  ];

  return (
    <PageTemplate
      title="Marketplace"
      description="Discover and book logistics and professional services"
      icon="ri-store-3-line"
      systemInfo={{
        sap: "Service Marketplace",
        oracle: "Service Marketplace",
        manhattan: "Service Marketplace",
      }}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white"
          >
            <Store className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalListings}</div>
            <div className="text-sm opacity-90 mt-1">Total Listings</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
          >
            <Users className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalProviders}</div>
            <div className="text-sm opacity-90 mt-1">Service Providers</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white"
          >
            <TrendingUp className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
            <div className="text-sm opacity-90 mt-1">Total Bookings</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white"
          >
            <Star className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm opacity-90 mt-1">Average Rating</div>
          </motion.div>
        </div>

        {/* AI-Powered Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/marketplace/search")}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition text-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">AI-Powered Search</div>
                <div className="text-sm opacity-90">Intelligent matching</div>
              </div>
            </div>
            <ArrowRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/marketplace/requirements/new")}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition text-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Find Matches</div>
                <div className="text-sm opacity-90">AI matching service</div>
              </div>
            </div>
            <ArrowRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/marketplace/providers/register")}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Become a Provider
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                List your services
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/marketplace/bookings")}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                My Bookings
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                View your bookings
              </div>
            </div>
          </motion.button>
        </div>

        {/* AI Insights Section */}
        <AIInsightsSection />

        {/* Service Categories */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Service Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => router.push(category.href)}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                >
                  <div
                    className={`bg-gradient-to-br ${category.color} p-4 rounded-lg w-fit mb-4`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {category.count} listings
                    </span>
                    <span className="text-blue-600 text-sm font-semibold">
                      Explore →
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Popular Services */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Popular Services
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              Popular services will appear here based on booking frequency and
              ratings
            </p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

// AI Insights Section Component
function AIInsightsSection() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      // Load demand forecasts for top categories
      const categories: MarketplaceServiceCategory[] = [
        "STORAGE",
        "TRANSPORTATION",
        "FREIGHT",
      ];
      const forecastPromises = categories.map((cat) =>
        demandForecastingService
          .forecastDemand(cat, {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: "MONTHLY",
          })
          .catch(() => null),
      );
      const results = await Promise.all(forecastPromises);
      setForecasts(results.filter(Boolean));
    } catch (error) {
      // Error handled - forecasts remain empty
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
            <p className="text-indigo-100 text-sm">
              Demand forecasts and market trends
            </p>
          </div>
        </div>
        <button
          onClick={() => (window.location.href = "/marketplace/forecasting")}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecasts.slice(0, 3).map((forecast, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{forecast.category}</h3>
              <TrendingUp className="w-5 h-5 text-green-300" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {forecast.forecast.totalBookings}
            </div>
            <div className="text-sm text-indigo-100">
              Expected bookings (30 days)
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`flex items-center gap-1 ${
                    forecast.factors.historicalTrend > 0
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  {forecast.factors.historicalTrend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(forecast.factors.historicalTrend).toFixed(1)}% trend
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {forecasts.length === 0 && (
        <div className="text-center py-8 text-indigo-100">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>AI insights will appear here</p>
        </div>
      )}
    </motion.div>
  );
}
