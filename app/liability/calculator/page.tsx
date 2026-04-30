/**
 * Liability Calculator
 * Interactive tool to calculate liability and claimable amounts
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function LiabilityCalculator() {
  const [formData, setFormData] = useState({
    totalValue: 5000,
    damageType: "CRUSHED",
    severity: "MAJOR",
    area: "loading_dock",
    equipment: "forklift",
    carrier: "",
    supplier: "",
  });

  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    setCalculating(true);
    // Simulate calculation
    setTimeout(() => {
      const warehouseFault = 75;
      const claimablePercentage = (100 - warehouseFault) / 100;
      const claimableAmount = formData.totalValue * claimablePercentage;
      const deductible = claimableAmount * 0.05;
      const netClaim = claimableAmount - deductible;

      setResult({
        faultPercentage: {
          warehouse: warehouseFault,
          carrier: 15,
          supplier: 5,
          other: 5,
        },
        financialImpact: {
          totalValue: formData.totalValue,
          claimableAmount,
          deductible,
          netClaim,
          currency: "AED",
        },
        insurance: {
          claimable: claimableAmount >= 1000,
        },
      });
      setCalculating(false);
    }, 1000);
  };

  return (
    <PageTemplate
      title="⚖️ Liability Calculator"
      description="Calculate liability, fault distribution, and insurance claimable amounts"
      icon="ri-calculator-line"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Damage Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Total Value (AED)
                </label>
                <input
                  type="number"
                  value={formData.totalValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalValue: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Damage Type
                </label>
                <select
                  value={formData.damageType}
                  onChange={(e) =>
                    setFormData({ ...formData, damageType: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="CRUSHED">Crushed</option>
                  <option value="BROKEN">Broken</option>
                  <option value="WET">Wet/Water Damage</option>
                  <option value="MISSING">Missing</option>
                  <option value="DAMAGED_PACKAGING">Damaged Packaging</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Area</label>
                <select
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="loading_dock">Loading Dock</option>
                  <option value="storage">Storage</option>
                  <option value="shipping">Shipping</option>
                  <option value="receiving">Receiving</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Equipment
                </label>
                <select
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="forklift">Forklift</option>
                  <option value="conveyor">Conveyor</option>
                  <option value="handling">Manual Handling</option>
                  <option value="none">None</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCalculate}
                disabled={calculating}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {calculating ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Calculating...
                  </>
                ) : (
                  <>
                    <i className="ri-calculator-line"></i>
                    Calculate Liability
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Liability Assessment
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm mb-2">
                      Fault Distribution
                    </p>
                    <div className="space-y-2">
                      {Object.entries(result.faultPercentage).map(
                        ([party, percentage]) => (
                          <div key={party}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white capitalize text-sm">
                                {party.replace("_", " ")}
                              </span>
                              <span className="text-white font-semibold">
                                {percentage}%
                              </span>
                            </div>
                            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                              ></motion.div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-white/60 text-sm mb-1">
                          Total Value
                        </p>
                        <p className="text-white font-bold text-xl">
                          {result.financialImpact.currency}{" "}
                          {result.financialImpact.totalValue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">
                          Claimable Amount
                        </p>
                        <p className="text-green-400 font-bold text-xl">
                          {result.financialImpact.currency}{" "}
                          {result.financialImpact.claimableAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">Deductible</p>
                        <p className="text-white/70 font-semibold">
                          {result.financialImpact.currency}{" "}
                          {result.financialImpact.deductible.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">Net Claim</p>
                        <p className="text-white font-bold text-xl">
                          {result.financialImpact.currency}{" "}
                          {result.financialImpact.netClaim.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {result.insurance.claimable && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400">
                        <i className="ri-checkbox-circle-line"></i>
                        <span className="font-semibold">
                          Insurance Claim Eligible
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <i className="ri-calculator-line text-6xl text-white/20 mb-4"></i>
                <p className="text-white/60">
                  Enter damage information and click Calculate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
