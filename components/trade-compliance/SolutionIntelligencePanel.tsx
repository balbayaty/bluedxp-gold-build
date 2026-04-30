"use client";

/**
 * Solution Intelligence Panel
 * Enterprise-grade solution management and insights for trade lane optimization
 *
 * Features:
 * - Interactive solution cards with detailed analysis
 * - Root cause visualization (Fishbone diagrams)
 * - ROI calculator with real-time updates
 * - Benchmark comparisons
 * - Insight toggles (Time, Cost, Reliability, CO2, Compliance)
 * - Certification body directory
 * - Implementation tracking
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LaneSolution,
  LaneBenchmark,
  CertificationBody,
  InsightToggle,
  SolutionCategory,
  ImplementationStatus,
  ROICalculatorInput,
  ROICalculatorOutput,
  SA_KW_SOLUTIONS,
  SA_KW_BENCHMARKS,
  CERTIFICATION_BODIES,
  SA_KW_ROOT_CAUSES,
  getSolutionsByLane,
  getBenchmarksByLane,
  calculateROI as calculateROIFromData,
} from "@/types/lane-solutions";
import RootCauseVisualization from "./RootCauseVisualization";

interface SolutionIntelligencePanelProps {
  laneCode: string;
  onClose?: () => void;
}

export default function SolutionIntelligencePanel({
  laneCode,
  onClose,
}: SolutionIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<
    "solutions" | "benchmarks" | "roi" | "certification"
  >("solutions");
  const [selectedSolution, setSelectedSolution] = useState<LaneSolution | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<
    SolutionCategory | "ALL"
  >("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    ImplementationStatus | "ALL"
  >("ALL");
  const [insightToggles, setInsightToggles] = useState<InsightToggle[]>([
    {
      id: "time",
      name: "Time Savings",
      icon: "ri-time-line",
      colorClass: "cyan",
      description: "Hours saved at each touchpoint",
      isActive: false,
      dataType: "TIME",
    },
    {
      id: "cost",
      name: "Cost Impact",
      icon: "ri-money-dollar-circle-line",
      colorClass: "emerald",
      description: "USD saved per shipment",
      isActive: false,
      dataType: "COST",
    },
    {
      id: "reliability",
      name: "Reliability",
      icon: "ri-shield-check-line",
      colorClass: "purple",
      description: "Predictability improvements",
      isActive: false,
      dataType: "RELIABILITY",
    },
    {
      id: "co2",
      name: "CO₂ Impact",
      icon: "ri-leaf-line",
      colorClass: "green",
      description: "Emission reductions",
      isActive: false,
      dataType: "CO2",
    },
    {
      id: "compliance",
      name: "Compliance",
      icon: "ri-verified-badge-line",
      colorClass: "amber",
      description: "Inspection rate improvements",
      isActive: false,
      dataType: "COMPLIANCE",
    },
  ]);

  // Get actual data
  const solutions: LaneSolution[] = getSolutionsByLane(laneCode);
  const benchmarks: LaneBenchmark[] = getBenchmarksByLane(laneCode);
  const certificationBodies: CertificationBody[] = CERTIFICATION_BODIES;

  const filteredSolutions = useMemo(() => {
    return solutions.filter((sol) => {
      const categoryMatch =
        selectedCategory === "ALL" || sol.category === selectedCategory;
      const statusMatch =
        selectedStatus === "ALL" || sol.status === selectedStatus;
      const laneMatch = sol.applicableLanes.includes(laneCode);
      return categoryMatch && statusMatch && laneMatch;
    });
  }, [solutions, selectedCategory, selectedStatus, laneCode]);

  const toggleInsight = (toggleId: string) => {
    setInsightToggles((prev) =>
      prev.map((t) =>
        t.id === toggleId ? { ...t, isActive: !t.isActive } : t,
      ),
    );
  };

  const getStatusColor = (status: ImplementationStatus) => {
    switch (status) {
      case "FULLY_IMPLEMENTED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PARTIALLY_IMPLEMENTED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PILOT":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "APPROVED":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "PROPOSED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-7xl h-[90vh] bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Solution Intelligence
              </h2>
              <p className="text-[#9ca3af] text-sm">
                Trade Lane: {laneCode} • Comprehensive optimization insights
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#9ca3af] hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Insight Toggles */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {insightToggles.map((toggle) => (
              <button
                key={toggle.id}
                onClick={() => toggleInsight(toggle.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  toggle.isActive
                    ? `bg-${toggle.colorClass}-500/20 border-${toggle.colorClass}-500/50 text-${toggle.colorClass}-400`
                    : "bg-white/5 border-white/10 text-[#9ca3af] hover:text-white"
                }`}
              >
                <i className={toggle.icon}></i>
                <span>{toggle.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 bg-[#1a1f2e] px-6">
          {[
            {
              id: "solutions",
              label: "Solutions",
              icon: "ri-lightbulb-line",
              count: filteredSolutions.length,
            },
            {
              id: "benchmarks",
              label: "Benchmarks",
              icon: "ri-bar-chart-line",
              count: benchmarks.length,
            },
            { id: "roi", label: "ROI Calculator", icon: "ri-calculator-line" },
            {
              id: "certification",
              label: "Certification Bodies",
              icon: "ri-award-line",
              count: certificationBodies.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className={tab.icon}></i>
              <span className="font-medium">{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/5 text-[#6b7280]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === "solutions" && (
              <motion.div
                key="solutions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Filters */}
                <div className="flex items-center gap-3 mb-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="TRADE_PROGRAM">Trade Programs</option>
                    <option value="CERTIFICATE_OPTIMIZATION">
                      Certificate Optimization
                    </option>
                    <option value="DOCUMENT_CONSOLIDATION">
                      Document Consolidation
                    </option>
                    <option value="TIMING_OPTIMIZATION">
                      Timing Optimization
                    </option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="FULLY_IMPLEMENTED">Fully Implemented</option>
                    <option value="PARTIALLY_IMPLEMENTED">
                      Partially Implemented
                    </option>
                    <option value="PILOT">Pilot</option>
                    <option value="PROPOSED">Proposed</option>
                  </select>
                </div>

                {/* Solutions Grid */}
                {filteredSolutions.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ri-inbox-line text-6xl text-[#6b7280] mb-4"></i>
                    <p className="text-[#9ca3af]">
                      No solutions found. Check filters or add new solutions.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredSolutions.map((solution) => (
                      <motion.div
                        key={solution.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedSolution(solution)}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:border-cyan-500/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono font-bold">
                                {solution.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(solution.status)}`}
                              >
                                {solution.status.replace("_", " ")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(solution.priority)}`}
                              >
                                {solution.priority}
                              </span>
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-1">
                              {solution.name}
                            </h3>
                            <p className="text-[#9ca3af] text-sm">
                              {solution.summary}
                            </p>
                          </div>
                        </div>

                        {/* Metrics Preview */}
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                          <div>
                            <div className="text-xs text-[#6b7280] mb-1">
                              Time Saved
                            </div>
                            <div className="text-lg font-bold text-cyan-400">
                              {solution.metrics.avgTimeReduction.toFixed(1)}h
                            </div>
                            <div className="text-xs text-[#6b7280]">
                              {solution.metrics.timeReductionPercentage}%
                              reduction
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#6b7280] mb-1">
                              Cost Saved
                            </div>
                            <div className="text-lg font-bold text-emerald-400">
                              ${solution.metrics.avgCostSavingsPerShipment}
                            </div>
                            <div className="text-xs text-[#6b7280]">
                              per shipment
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#6b7280] mb-1">
                              Reliability
                            </div>
                            <div className="text-lg font-bold text-purple-400">
                              +{solution.metrics.reliabilityImprovement}%
                            </div>
                            <div className="text-xs text-[#6b7280]">
                              improvement
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {solution.implementationProgress !== undefined && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-[#6b7280] mb-1">
                              <span>Implementation Progress</span>
                              <span>{solution.implementationProgress}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${solution.implementationProgress}%`,
                                }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "benchmarks" && (
              <motion.div
                key="benchmarks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {benchmarks.map((benchmark) => (
                    <div
                      key={benchmark.id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">
                          {benchmark.metric}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            benchmark.trend === "IMPROVING"
                              ? "bg-green-500/20 text-green-400"
                              : benchmark.trend === "STABLE"
                                ? "bg-gray-500/20 text-gray-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {benchmark.trend}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#9ca3af]">
                            Current
                          </span>
                          <span className="text-xl font-bold text-white">
                            {benchmark.currentValue.toFixed(1)} {benchmark.unit}
                          </span>
                        </div>

                        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{
                              width: `${(benchmark.currentValue / benchmark.bestInClass) * 100}%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-[#6b7280]">Target</div>
                            <div className="text-white font-medium">
                              {benchmark.targetValue} {benchmark.unit}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#6b7280]">Industry Avg</div>
                            <div className="text-white font-medium">
                              {benchmark.industryAverage} {benchmark.unit}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#6b7280]">Best in Class</div>
                            <div className="text-white font-medium">
                              {benchmark.bestInClass} {benchmark.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "roi" && (
              <motion.div
                key="roi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto"
              >
                <ROICalculator laneCode={laneCode} />
              </motion.div>
            )}

            {activeTab === "certification" && (
              <motion.div
                key="certification"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {certificationBodies.map((body) => (
                    <div
                      key={body.id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {body.name}
                          </h3>
                          <p className="text-[#9ca3af] text-sm">
                            {body.shortName}
                          </p>
                        </div>
                        {body.reliabilityScore && (
                          <div className="text-right">
                            <div className="text-xs text-[#6b7280]">
                              Reliability
                            </div>
                            <div className="text-lg font-bold text-green-400">
                              {body.reliabilityScore}%
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-[#6b7280]">Type: </span>
                          <span className="text-white">
                            {body.type.replace("_", " ")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6b7280]">Countries: </span>
                          <span className="text-white">
                            {body.countries.join(", ")}
                          </span>
                        </div>
                        {body.website && (
                          <a
                            href={body.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <i className="ri-external-link-line"></i>
                            Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Solution Detail Modal */}
      <AnimatePresence>
        {selectedSolution && (
          <SolutionDetailModal
            solution={selectedSolution}
            onClose={() => setSelectedSolution(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ROI Calculator Component
function ROICalculator({ laneCode }: { laneCode: string }) {
  const [inputs, setInputs] = useState<ROICalculatorInput>({
    shipmentsPerMonth: 13,
    avgShipmentValue: 50000,
    currentClearanceTime: 55.43,
    currentCertCostPerTruck: 175,
    currentRejectionRate: 18,
    demurrageRatePerHour: 25,
    truckCostPerHour: 45,
  });

  const [results, setResults] = useState<ROICalculatorOutput | null>(null);

  // Auto-calculate on mount and input changes
  useEffect(() => {
    const calculated = calculateROIFromData(inputs);
    setResults(calculated);
  }, [inputs]);

  const handleInputChange = (key: keyof ROICalculatorInput, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">ROI Calculator</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries(inputs).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm text-[#9ca3af] mb-2 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) =>
                  handleInputChange(
                    key as keyof ROICalculatorInput,
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
        </div>

        <div className="text-xs text-[#6b7280] text-center mt-2">
          <i className="ri-information-line mr-1"></i>
          ROI automatically calculated based on implemented solutions
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="text-sm text-[#9ca3af] mb-1">Payback Period</div>
            <div className="text-3xl font-bold text-cyan-400">
              {results.paybackPeriodMonths.toFixed(1)} months
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="text-sm text-[#9ca3af] mb-1">First Year ROI</div>
            <div className="text-3xl font-bold text-emerald-400">
              {results.firstYearROI.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="text-sm text-[#9ca3af] mb-1">Annual Savings</div>
            <div className="text-3xl font-bold text-purple-400">
              ${(results.totalAnnualSavings / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Solution Detail Modal
function SolutionDetailModal({
  solution,
  onClose,
}: {
  solution: LaneSolution;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-4xl max-h-[90vh] bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono font-bold">
                  {solution.code}
                </span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  {solution.status.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{solution.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#9ca3af] hover:text-white transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-2">Summary</h3>
            <p className="text-[#9ca3af]">{solution.summary}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">
              Detailed Description
            </h3>
            <p className="text-[#9ca3af] whitespace-pre-line">
              {solution.detailedDescription}
            </p>
          </div>

          {/* Root Cause Visualization */}
          {(() => {
            const rootCause = SA_KW_ROOT_CAUSES.find(
              (rc) => rc.id === solution.rootCauseId,
            );
            if (!rootCause) return null;
            return (
              <div>
                <h3 className="text-white font-semibold mb-4">
                  Root Cause Analysis
                </h3>
                <RootCauseVisualization rootCause={rootCause} />
              </div>
            );
          })()}

          <div>
            <h3 className="text-white font-semibold mb-3">Benefits</h3>
            <div className="space-y-2">
              {solution.benefits.map((benefit) => (
                <div key={benefit.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white">{benefit.description}</span>
                    <span className="text-cyan-400 font-semibold">
                      {benefit.quantifiedValue} {benefit.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {solution.metrics.avgTimeReduction.toFixed(1)}h
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  Time Reduction
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  ${solution.metrics.avgCostSavingsPerShipment}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">Cost Savings</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  +{solution.metrics.reliabilityImprovement}%
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">Reliability</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
