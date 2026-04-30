"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { TrendingUp, Package, ArrowRightLeft, Clock } from "lucide-react";

export default function NetworkAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalWarehouses: 0,
    totalCapacity: 0,
    totalUtilization: 0,
    activeTransfers: 0,
    completedTransfers: 0,
    averageTransitTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In a real app, get network ID from context or params
      const networkId = "network-1"; // Mock
      const response = await fetch(
        `/api/warehouse-network/analytics?networkId=${networkId}`,
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

  return (
    <PageTemplate
      title="Network Analytics"
      description="View performance metrics and insights for your warehouse network"
      icon="ri-bar-chart-box-line"
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {analytics.totalWarehouses}
            </div>
            <div className="text-sm text-slate-500">Total Warehouses</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <ArrowRightLeft className="w-8 h-8 text-green-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {analytics.activeTransfers}
            </div>
            <div className="text-sm text-slate-500">Active Transfers</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {analytics.averageTransitTime}h
            </div>
            <div className="text-sm text-slate-500">Avg Transit Time</div>
          </div>
        </div>

        {/* Capacity & Utilization */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Capacity & Utilization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-2">Total Capacity</p>
              <p className="text-2xl font-bold text-slate-800">
                {analytics.totalCapacity.toLocaleString()} m³
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Total Utilization</p>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${analytics.totalUtilization}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {analytics.totalUtilization}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Transfer Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-2">Completed Transfers</p>
              <p className="text-2xl font-bold text-slate-800">
                {analytics.completedTransfers}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">
                Average Transit Time
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {analytics.averageTransitTime} hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
