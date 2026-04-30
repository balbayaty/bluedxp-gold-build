/**
 * Export House 3-Year Business Plan Editor
 * Comprehensive business plan creation and management for SEDA application
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiFileChartLine,
  RiSaveLine,
  RiDownloadLine,
  RiCheckLine,
} from "react-icons/ri";

interface BusinessPlanData {
  year: number;
  exportTargets: {
    productCategories: string[];
    targetMarkets: string[];
    revenueTarget: number;
    volumeTarget: number;
  };
  serviceOfferings: {
    exportEnablement: boolean;
    complianceCoordination: boolean;
    logisticsOrchestration: boolean;
    marketIntelligence: boolean;
  };
  operationalPlan: {
    staffing: number;
    infrastructure: string[];
    partnerships: string[];
  };
  financialProjections: {
    revenue: number;
    costs: number;
    profitability: number;
  };
  riskMitigation: {
    risks: string[];
    mitigationStrategies: string[];
  };
}

export default function BusinessPlanPage() {
  const [plans, setPlans] = useState<Record<number, BusinessPlanData>>({});
  const [activeYear, setActiveYear] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadBusinessPlans();
  }, []);

  async function loadBusinessPlans() {
    try {
      const response = await fetch("/api/export-house/business-plan");
      if (response.ok) {
        const data = await response.json();
        const plansMap: Record<number, BusinessPlanData> = {};
        data.forEach((plan: any) => {
          plansMap[plan.year] = plan.planData;
        });
        setPlans(plansMap);
      }
    } catch (error) {
      console.error("Error loading business plans:", error);
    }
  }

  async function savePlan(year: number) {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch("/api/export-house/business-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          year,
          planData: plans[year],
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving business plan:", error);
    } finally {
      setSaving(false);
    }
  }

  function updatePlan(
    year: number,
    section: string,
    field: string,
    value: any,
  ) {
    setPlans((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [section]: {
          ...prev[year]?.[section as keyof BusinessPlanData],
          [field]: value,
        },
      },
    }));
  }

  const currentPlan = plans[activeYear] || {
    exportTargets: {
      productCategories: [],
      targetMarkets: [],
      revenueTarget: 0,
      volumeTarget: 0,
    },
    serviceOfferings: {
      exportEnablement: false,
      complianceCoordination: false,
      logisticsOrchestration: false,
      marketIntelligence: false,
    },
    operationalPlan: { staffing: 0, infrastructure: [], partnerships: [] },
    financialProjections: { revenue: 0, costs: 0, profitability: 0 },
    riskMitigation: { risks: [], mitigationStrategies: [] },
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            3-Year Export Business Plan
          </h1>
          <p className="text-gray-400">
            Create comprehensive business plans for SEDA Export House license
            application
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex gap-4 mb-6">
          {[1, 2, 3].map((year) => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                activeYear === year
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/50"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:border-cyan-400/30"
              }`}
            >
              Year {year}
            </button>
          ))}
        </div>

        {/* Business Plan Sections */}
        <div className="space-y-6">
          {/* Export Targets */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Export Targets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Revenue Target (SAR)
                </label>
                <input
                  type="number"
                  value={currentPlan.exportTargets.revenueTarget || 0}
                  onChange={(e) =>
                    updatePlan(
                      activeYear,
                      "exportTargets",
                      "revenueTarget",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Volume Target (Units)
                </label>
                <input
                  type="number"
                  value={currentPlan.exportTargets.volumeTarget || 0}
                  onChange={(e) =>
                    updatePlan(
                      activeYear,
                      "exportTargets",
                      "volumeTarget",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Service Offerings */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Service Offerings</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentPlan.serviceOfferings).map(
                ([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        updatePlan(
                          activeYear,
                          "serviceOfferings",
                          key,
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-cyan-400 bg-white/5 border-white/10 rounded"
                    />
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          {/* Financial Projections */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Financial Projections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Revenue (SAR)
                </label>
                <input
                  type="number"
                  value={currentPlan.financialProjections.revenue || 0}
                  onChange={(e) =>
                    updatePlan(
                      activeYear,
                      "financialProjections",
                      "revenue",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Costs (SAR)
                </label>
                <input
                  type="number"
                  value={currentPlan.financialProjections.costs || 0}
                  onChange={(e) =>
                    updatePlan(
                      activeYear,
                      "financialProjections",
                      "costs",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Profitability (SAR)
                </label>
                <input
                  type="number"
                  value={currentPlan.financialProjections.profitability || 0}
                  onChange={(e) =>
                    updatePlan(
                      activeYear,
                      "financialProjections",
                      "profitability",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => savePlan(activeYear)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 rounded-xl hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              {saved ? (
                <>
                  <RiCheckLine /> Saved!
                </>
              ) : (
                <>
                  <RiSaveLine /> {saving ? "Saving..." : "Save Plan"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
