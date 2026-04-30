/**
 * Budget Management Page
 * Professional budget planning, tracking, and variance analysis
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiLineChartLine,
  RiAddLine,
  RiFileDownloadLine,
  RiFilterLine,
} from "react-icons/ri";
import type { Budget } from "@/types/finance";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/finance/budget?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setBudgets(data.data);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiLineChartLine className="text-cyan-400" />
              Budget Management
            </h1>
            <p className="text-gray-400 mt-1">
              Budget planning and variance analysis
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Budget
          </button>
        </div>

        {/* Budgets Grid */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading budgets...
            </div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No budgets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => {
              const totalActual = budget.budgetItems.reduce(
                (sum, item) => sum + item.actualAmount,
                0,
              );
              const variance = totalActual - budget.totalBudget;
              const variancePercentage =
                budget.totalBudget > 0
                  ? (variance / budget.totalBudget) * 100
                  : 0;

              return (
                <div
                  key={budget.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{budget.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        budget.status === "ACTIVE"
                          ? "bg-green-400/20 text-green-400"
                          : budget.status === "APPROVED"
                            ? "bg-blue-400/20 text-blue-400"
                            : "bg-gray-400/20 text-gray-400"
                      }`}
                    >
                      {budget.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Budget</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(budget.totalBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Actual</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(totalActual)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Variance</p>
                      <p
                        className={`text-lg font-semibold ${
                          variance >= 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {formatCurrency(variance)} (
                        {variancePercentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
