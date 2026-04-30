"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import ExportButton from "@/components/marketplace/ExportButton";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import type { MarketplaceAnalytics } from "@/lib/services/marketplace/marketplaceAnalyticsService";

export default function MarketplaceAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/marketplace/analytics?periodStart=${period.start}&periodEnd=${period.end}`,
      );
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Analytics"
        description="Marketplace analytics and insights"
        icon="ri-bar-chart-box-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading analytics...</p>
        </div>
      </PageTemplate>
    );
  }

  if (!analytics) {
    return (
      <PageTemplate
        title="Analytics"
        description="Marketplace analytics and insights"
        icon="ri-bar-chart-box-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">No analytics data available</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Marketplace Analytics"
      description="Comprehensive analytics and insights"
      icon="ri-bar-chart-box-line"
    >
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-semibold text-slate-700">
                Period:
              </label>
              <input
                type="date"
                value={period.start}
                onChange={(e) =>
                  setPeriod({ ...period, start: e.target.value })
                }
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={period.end}
                onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <ExportButton
              type="stats"
              periodStart={period.start}
              periodEnd={period.end}
            />
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <Package className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {analytics.overview.totalListings}
            </div>
            <div className="text-sm opacity-90 mt-1">Total Listings</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {analytics.overview.totalBookings}
            </div>
            <div className="text-sm opacity-90 mt-1">Total Bookings</div>
            <div className="text-xs opacity-75 mt-1">
              {analytics.overview.growthRate > 0 ? "+" : ""}
              {analytics.overview.growthRate.toFixed(1)}% growth
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <DollarSign className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {analytics.overview.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm opacity-90 mt-1">Total Revenue (SAR)</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <Users className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {analytics.overview.totalProviders}
            </div>
            <div className="text-sm opacity-90 mt-1">Total Providers</div>
          </div>
        </div>

        {/* Bookings Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Bookings Analytics</span>
            </h3>
            <ExportButton
              type="bookings"
              periodStart={period.start}
              periodEnd={period.end}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-slate-800">
                {analytics.bookings.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">
                Average Booking Value
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {analytics.bookings.averageBookingValue.toLocaleString()} SAR
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">By Status</p>
              <div className="space-y-1">
                {Object.entries(analytics.bookings.byStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{status}:</span>
                      <span className="font-semibold text-slate-800">
                        {count as number}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        {analytics.insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <span>Key Insights</span>
            </h3>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === "OPPORTUNITY"
                      ? "border-green-200 bg-green-50"
                      : insight.type === "RISK"
                        ? "border-red-200 bg-red-50"
                        : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {insight.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        insight.impact === "HIGH"
                          ? "bg-red-100 text-red-700"
                          : insight.impact === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {insight.impact} Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Category Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    Listings
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    Bookings
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.categories.performance.map((cat) => (
                  <tr
                    key={cat.category}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {cat.category}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {cat.listings}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {cat.bookings}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {cat.revenue.toLocaleString()} SAR
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {cat.averageRating.toFixed(1)} ⭐
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
