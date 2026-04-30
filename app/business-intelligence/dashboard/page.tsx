/**
 * Business Intelligence Dashboard Page
 * World-class unified BI dashboard aggregating analytics from all modules
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiBarChartLine,
  RiDashboardLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from "react-icons/ri";
import type { UnifiedBIData } from "@/types/business-intelligence";

export default function BIDashboardPage() {
  const [biData, setBiData] = useState<UnifiedBIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBIData();
  }, []);

  const fetchBIData = async () => {
    try {
      const response = await fetch(
        "/api/business-intelligence/dashboard?tenantId=default",
      );
      const data = await response.json();
      if (data.success) {
        setBiData(data.data);
      }
    } catch (error) {
      console.error("Error fetching BI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse text-gray-400">
            Loading BI dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiDashboardLine className="text-green-400" />
              Business Intelligence Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Unified analytics from all modules
            </p>
          </div>
        </div>

        {/* Module KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* HR Metrics */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-400/10 rounded-xl">
                <RiBarChartLine className="text-green-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">HR Module</p>
              <p className="text-xl font-bold">Employee Analytics</p>
            </div>
          </div>

          {/* Finance Metrics */}
          {biData?.finance.financialMetrics && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-400/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-400/10 rounded-xl">
                  <RiArrowUpLine className="text-green-400 text-2xl" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Finance Module</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    biData.finance.financialMetrics.totalRevenue || 0,
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
              </div>
            </div>
          )}

          {/* CRM Metrics */}
          {biData?.crm.salesMetrics && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-400/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-400/10 rounded-xl">
                  <RiBarChartLine className="text-green-400 text-2xl" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">CRM Module</p>
                <p className="text-xl font-bold">
                  {biData.crm.salesMetrics.activeOpportunities || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Active Opportunities
                </p>
              </div>
            </div>
          )}

          {/* WMS Metrics */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-400/10 rounded-xl">
                <RiBarChartLine className="text-green-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">WMS Module</p>
              <p className="text-xl font-bold">Inventory Analytics</p>
            </div>
          </div>
        </div>

        {/* Module Analytics Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Finance Summary */}
          {biData?.finance && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Finance Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Net Income</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(
                      biData.finance.financialMetrics.netIncome || 0,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Budget Variance</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(biData.finance.budgetMetrics.variance || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CRM Summary */}
          {biData?.crm && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4">CRM Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Pipeline Value</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(biData.crm.salesMetrics.pipelineValue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Accounts</span>
                  <span className="text-lg font-bold">
                    {biData.crm.customerMetrics.totalAccounts || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
