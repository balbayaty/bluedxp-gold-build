/**
 * Financial Dashboard Page
 * World-class financial dashboard with KPIs, charts, and real-time data
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiDashboardLine,
  RiMoneyDollarCircleLine,
  RiFileList3Line,
  RiBarChartLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from "react-icons/ri";
import { LiveStockWidget } from "@/components/market-data/LiveStockWidget";
import { EnhancedCurrencyWidget } from "@/components/market-data/EnhancedCurrencyWidget";

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  budgets: {
    total: number;
    actual: number;
    variance: number;
  };
  currency: string;
}

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const fetchFinancialSummary = async () => {
    try {
      const response = await fetch("/api/finance/dashboard?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error("Error fetching financial summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: summary?.currency || "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-400">No financial data available</p>
          </div>
        </div>
      </div>
    );
  }

  const netIncomeColor =
    summary.netIncome >= 0 ? "text-green-400" : "text-red-400";
  const budgetVarianceColor =
    summary.budgets.variance >= 0 ? "text-red-400" : "text-green-400";

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiDashboardLine className="text-cyan-400" />
              Financial Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Comprehensive financial overview
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-400/10 rounded-xl">
                <RiMoneyDollarCircleLine className="text-cyan-400 text-2xl" />
              </div>
              <RiArrowUpLine className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-red-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-400/10 rounded-xl">
                <RiFileList3Line className="text-red-400 text-2xl" />
              </div>
              <RiArrowDownLine className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
          </div>

          {/* Net Income */}
          <div
            className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-${summary.netIncome >= 0 ? "green" : "red"}-400/50 transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 bg-${summary.netIncome >= 0 ? "green" : "red"}-400/10 rounded-xl`}
              >
                <RiBarChartLine
                  className={`text-${summary.netIncome >= 0 ? "green" : "red"}-400 text-2xl`}
                />
              </div>
              {summary.netIncome >= 0 ? (
                <RiArrowUpLine className="text-green-400" />
              ) : (
                <RiArrowDownLine className="text-red-400" />
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Net Income</p>
              <p className={`text-2xl font-bold ${netIncomeColor}`}>
                {formatCurrency(summary.netIncome)}
              </p>
            </div>
          </div>

          {/* Cash Balance */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-400/10 rounded-xl">
                <RiMoneyDollarCircleLine className="text-cyan-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Cash Balance</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.cashBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Accounts Receivable */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-gray-400 text-sm mb-2">Accounts Receivable</p>
            <p className="text-xl font-bold">
              {formatCurrency(summary.accountsReceivable)}
            </p>
          </div>

          {/* Accounts Payable */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-gray-400 text-sm mb-2">Accounts Payable</p>
            <p className="text-xl font-bold">
              {formatCurrency(summary.accountsPayable)}
            </p>
          </div>

          {/* Budget Variance */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-gray-400 text-sm mb-2">Budget Variance</p>
            <p className={`text-xl font-bold ${budgetVarianceColor}`}>
              {formatCurrency(summary.budgets.variance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(summary.budgets.actual)} /{" "}
              {formatCurrency(summary.budgets.total)}
            </p>
          </div>
        </div>

        {/* Market Data - Currency Exchange */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RiMoneyDollarCircleLine className="text-cyan-400" />
            Live Currency Exchange Rates
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Real-time exchange rates for international transactions and financial planning
          </p>
          <EnhancedCurrencyWidget />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/finance/general-ledger"
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-center"
            >
              <RiFileList3Line className="text-cyan-400 text-2xl mx-auto mb-2" />
              <p className="text-sm">General Ledger</p>
            </a>
            <a
              href="/finance/accounts-payable"
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-center"
            >
              <RiFileList3Line className="text-cyan-400 text-2xl mx-auto mb-2" />
              <p className="text-sm">Accounts Payable</p>
            </a>
            <a
              href="/finance/accounts-receivable"
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-center"
            >
              <RiFileList3Line className="text-cyan-400 text-2xl mx-auto mb-2" />
              <p className="text-sm">Accounts Receivable</p>
            </a>
            <a
              href="/finance/reports"
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-center"
            >
              <RiBarChartLine className="text-cyan-400 text-2xl mx-auto mb-2" />
              <p className="text-sm">Financial Reports</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
