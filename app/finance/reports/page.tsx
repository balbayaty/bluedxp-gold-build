/**
 * Financial Reports Page
 * Professional financial reporting with P&L, Balance Sheet, Cash Flow
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiFileChartLine,
  RiFileDownloadLine,
  RiPrinterLine,
} from "react-icons/ri";

export default function FinancialReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>("profit_loss");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchReport = async (reportType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: "default",
        type: reportType,
        startDate: period.startDate,
        endDate: period.endDate,
      });
      const response = await fetch(`/api/finance/reports?${params}`);
      const data = await response.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReport) {
      fetchReport(selectedReport);
    }
  }, [selectedReport, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const reportTypes = [
    { id: "profit_loss", name: "Profit & Loss Statement", icon: "📊" },
    { id: "balance_sheet", name: "Balance Sheet", icon: "📋" },
    { id: "cash_flow", name: "Cash Flow Statement", icon: "💸" },
    { id: "trial_balance", name: "Trial Balance", icon: "⚖️" },
    { id: "aging", name: "Aging Reports", icon: "⏰" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiFileChartLine className="text-cyan-400" />
              Financial Reports
            </h1>
            <p className="text-gray-400 mt-1">
              Comprehensive financial reporting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all">
              <RiPrinterLine className="text-xl" />
            </button>
            <button className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all">
              <RiFileDownloadLine className="text-xl" />
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedReport === type.id
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/10 hover:border-cyan-400/50"
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <p className="text-sm font-semibold">{type.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Start Date
              </label>
              <input
                type="date"
                value={period.startDate}
                onChange={(e) =>
                  setPeriod({ ...period, startDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                End Date
              </label>
              <input
                type="date"
                value={period.endDate}
                onChange={(e) =>
                  setPeriod({ ...period, endDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Report Display */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Generating report...
            </div>
          </div>
        ) : reportData ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-6">
              {reportTypes.find((t) => t.id === selectedReport)?.name}
            </h2>
            <div className="space-y-4">
              {selectedReport === "profit_loss" && reportData.revenue && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Revenue</h3>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(reportData.revenue.total)}
                  </p>
                  <h3 className="text-lg font-semibold mb-2 mt-4">Expenses</h3>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(
                      reportData.operatingExpenses.total +
                        reportData.costOfGoodsSold.total,
                    )}
                  </p>
                  <h3 className="text-lg font-semibold mb-2 mt-4">
                    Net Income
                  </h3>
                  <p
                    className={`text-3xl font-bold ${
                      reportData.netIncome >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(reportData.netIncome)}
                  </p>
                </div>
              )}
              {selectedReport === "balance_sheet" && reportData.assets && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Total Assets</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.assets.total)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Total Liabilities
                    </h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.liabilities.total)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Total Equity</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.equity.total)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-400">Select a report type to generate</p>
          </div>
        )}
      </div>
    </div>
  );
}
