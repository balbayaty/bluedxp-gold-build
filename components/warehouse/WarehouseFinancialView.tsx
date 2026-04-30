/**
 * Warehouse Financial View Component
 * Financial tracking and cost accounting
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseFinanceIntegration } from "@/lib/services/wms/financeIntegration";
import type { WarehouseFinancialSummary } from "@/lib/services/wms/financeIntegration";

interface WarehouseFinancialViewProps {
  warehouseId: string;
}

export default function WarehouseFinancialView({
  warehouseId,
}: WarehouseFinancialViewProps) {
  const [summary, setSummary] = useState<WarehouseFinancialSummary | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [warehouseId]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const period = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const data = await warehouseFinanceIntegration.getFinancialSummary(
        warehouseId,
        period,
      );
      setSummary(data);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="ri-money-dollar-circle-line mr-3 text-cyan-400"></i>
          Financial Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white">
              ${(summary.revenue.total / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
            <p className="text-sm text-gray-400 mb-1">Total Costs</p>
            <p className="text-3xl font-bold text-white">
              ${(summary.costs.total / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
            <p className="text-sm text-gray-400 mb-1">Profit</p>
            <p className="text-3xl font-bold text-white">
              ${(summary.profit / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-green-400 mt-1">
              Margin: {summary.margin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Cost Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(summary.costs)
              .filter(([key]) => key !== "total")
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-white font-bold">
                    ${(value / 1000).toFixed(1)}K
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Revenue Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(summary.revenue)
              .filter(([key]) => key !== "total")
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-white font-bold">
                    ${(value / 1000).toFixed(1)}K
                  </span>
                </div>
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
