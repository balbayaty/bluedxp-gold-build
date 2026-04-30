/**
 * Landed Cost Calculator Page
 * Calculate comprehensive landed costs for trade compliance records
 */

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface LandedCostBreakdown {
  productCosts: number;
  freightCosts: number;
  insurance: number;
  customsDuty: number;
  vat: number;
  exciseTax: number;
  licenseFees: number;
  handlingFees: number;
  storageFees: number;
  documentationFees: number;
  bankCharges: number;
  currencyConversion: number;
  total: number;
}

export default function LandedCostCalculatorPage() {
  const [recordId, setRecordId] = useState("");
  const [breakdown, setBreakdown] = useState<LandedCostBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateLandedCost = async () => {
    if (!recordId) {
      alert("Please enter a record ID");
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch(
        `/api/trade-compliance/landed-costs?recordId=${recordId}`,
      );
      const data = await response.json();

      if (data.success && data.breakdown) {
        const breakdownData = data.breakdown;
        setBreakdown({
          productCosts: breakdownData.productCost?.amountInBaseCurrency || 0,
          freightCosts: breakdownData.freightCost?.amountInBaseCurrency || 0,
          insurance: breakdownData.insuranceCost?.amountInBaseCurrency || 0,
          customsDuty: breakdownData.customsDuty?.amountInBaseCurrency || 0,
          vat: breakdownData.vat?.amountInBaseCurrency || 0,
          exciseTax: breakdownData.exciseTax?.amountInBaseCurrency || 0,
          licenseFees:
            breakdownData.licenseFees?.reduce(
              (sum: number, fee: any) => sum + (fee.amountInBaseCurrency || 0),
              0,
            ) || 0,
          handlingFees: breakdownData.handlingFees?.amountInBaseCurrency || 0,
          storageFees: breakdownData.storageFees?.amountInBaseCurrency || 0,
          documentationFees:
            breakdownData.documentationFees?.amountInBaseCurrency || 0,
          bankCharges: breakdownData.bankCharges?.amountInBaseCurrency || 0,
          currencyConversion:
            breakdownData.currencyConversion?.amountInBaseCurrency || 0,
          total: breakdownData.totalCost || 0,
        });
      } else {
        alert(data.error || "Failed to calculate landed cost");
      }
    } catch (error) {
      console.error("Error calculating landed cost:", error);
      alert("Failed to calculate landed cost. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const costItems = useMemo(() => {
    if (!breakdown) return [];
    return [
      {
        label: "Product Costs",
        value: breakdown.productCosts,
        category: "Product",
      },
      {
        label: "Freight Costs",
        value: breakdown.freightCosts,
        category: "Logistics",
      },
      { label: "Insurance", value: breakdown.insurance, category: "Logistics" },
      {
        label: "Customs Duty",
        value: breakdown.customsDuty,
        category: "Customs",
      },
      { label: "VAT (15%)", value: breakdown.vat, category: "Customs" },
      { label: "Excise Tax", value: breakdown.exciseTax, category: "Customs" },
      {
        label: "License Fees",
        value: breakdown.licenseFees,
        category: "Compliance",
      },
      {
        label: "Handling Fees",
        value: breakdown.handlingFees,
        category: "Logistics",
      },
      {
        label: "Storage Fees",
        value: breakdown.storageFees,
        category: "Logistics",
      },
      {
        label: "Documentation Fees",
        value: breakdown.documentationFees,
        category: "Compliance",
      },
      {
        label: "Bank Charges",
        value: breakdown.bankCharges,
        category: "Financial",
      },
      {
        label: "Currency Conversion",
        value: breakdown.currencyConversion,
        category: "Financial",
      },
    ];
  }, [breakdown]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    costItems.forEach((item) => {
      if (!totals[item.category]) {
        totals[item.category] = 0;
      }
      totals[item.category] += item.value;
    });
    return totals;
  }, [costItems]);

  return (
    <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Landed Cost Calculator
          </h1>
          <p className="text-[#9ca3af]">
            Calculate comprehensive landed costs for trade compliance records
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="Enter Trade Compliance Record ID"
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={calculateLandedCost}
              disabled={calculating}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {calculating ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </motion.div>

        {breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Cost Breakdown
            </h2>
            <div className="space-y-2">
              {costItems.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b border-white/10"
                >
                  <span className="text-[#9ca3af]">{item.label}</span>
                  <span className="text-white font-medium">
                    ${item.value.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 mt-4 pt-4 border-t border-white/20">
                <span className="text-white font-semibold text-lg">Total</span>
                <span className="text-cyan-400 font-bold text-lg">
                  ${breakdown.total.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {!breakdown && !calculating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center"
          >
            <i className="ri-calculator-line mx-auto text-6xl text-[#6b7280] mb-4"></i>
            <h3 className="text-xl font-semibold text-white mb-2">
              Calculate Landed Cost
            </h3>
            <p className="text-[#9ca3af]">
              Enter a trade compliance record ID above to calculate the
              comprehensive landed cost
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
