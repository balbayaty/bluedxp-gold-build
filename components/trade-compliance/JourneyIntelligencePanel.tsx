"use client";

/**
 * Journey Intelligence Panel
 * Comprehensive customs optimization and trade facilitation recommendations
 * 4IR & 5IR Aligned - AI-Powered Root Cause Analysis & Solution Engine
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  RootCauseAnalysis,
  TradeProgram,
  TradeProgramRecommendation,
  Certificate,
  CertificateRecommendation,
  Solution,
  RegulatoryChange,
  TariffUpdate,
  ROIAnalysis,
} from "@/types/customs-intelligence";
import { tradeProgramAdvisorService } from "@/lib/services/trade-compliance/tradeProgramAdvisorService";
import { tradeComplianceRootCauseAnalysisEngine } from "@/lib/services/trade-compliance/rootCauseAnalysisEngine";
import { regulatoryKnowledgeBase } from "@/lib/services/trade-compliance/regulatoryKnowledgeBase";

interface Bottleneck {
  id: string;
  touchpoint: string;
  avgHours: number;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface JourneyIntelligencePanelProps {
  originCountry: string;
  destinationCountry: string;
  bottlenecks: Bottleneck[];
  productCategory?: string;
  annualShipments?: number;
  averageShipmentValue?: number;
  onClose?: () => void;
}

type TabType =
  | "overview"
  | "root-cause"
  | "programs"
  | "certificates"
  | "regulations"
  | "roi";

export default function JourneyIntelligencePanel({
  originCountry,
  destinationCountry,
  bottlenecks,
  productCategory = "CHEMICALS",
  annualShipments = 100,
  averageShipmentValue = 50000,
  onClose,
}: JourneyIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [selectedBottleneck, setSelectedBottleneck] =
    useState<Bottleneck | null>(null);
  const [rootCauseAnalysis, setRootCauseAnalysis] =
    useState<RootCauseAnalysis | null>(null);
  const [programRecommendations, setProgramRecommendations] = useState<
    TradeProgramRecommendation[]
  >([]);
  const [certificateAnalysis, setCertificateAnalysis] = useState<ReturnType<
    typeof tradeComplianceRootCauseAnalysisEngine.analyzeCertificateImpact
  > | null>(null);
  const [regulatoryAlerts, setRegulatoryAlerts] = useState<RegulatoryChange[]>(
    [],
  );
  const [tariffUpdates, setTariffUpdates] = useState<TariffUpdate[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<TradeProgram | null>(
    null,
  );
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysis | null>(null);
  const [expandedSolution, setExpandedSolution] = useState<string | null>(null);

  // Find the most critical bottleneck
  const criticalBottleneck = useMemo(() => {
    return bottlenecks.reduce(
      (max, b) => (b.avgHours > (max?.avgHours || 0) ? b : max),
      bottlenecks[0],
    );
  }, [bottlenecks]);

  // Calculate total optimization potential
  const totalOptimizationPotential = useMemo(() => {
    return bottlenecks.reduce((sum, b) => sum + b.avgHours * 0.5, 0); // Assume 50% reducible
  }, [bottlenecks]);

  // Load intelligence data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Analyze the critical bottleneck
        if (criticalBottleneck) {
          const rca =
            await tradeComplianceRootCauseAnalysisEngine.analyzeRootCause(
              criticalBottleneck.id,
              criticalBottleneck.touchpoint,
              criticalBottleneck.avgHours,
              destinationCountry,
              productCategory,
            );
          setRootCauseAnalysis(rca);
          setSelectedBottleneck(criticalBottleneck);
        }

        // Get program recommendations
        const programs = await tradeProgramAdvisorService.recommendPrograms(
          originCountry,
          destinationCountry,
          bottlenecks.map((b) => ({
            touchpoint: b.touchpoint,
            avgDelayHours: b.avgHours,
            category: b.category,
          })),
          annualShipments,
          averageShipmentValue * annualShipments,
        );
        setProgramRecommendations(programs);

        // Analyze certificates
        const certAnalysis =
          tradeComplianceRootCauseAnalysisEngine.analyzeCertificateImpact(
            originCountry,
            destinationCountry,
            productCategory,
            [], // Current certificates - would come from props/context
          );
        setCertificateAnalysis(certAnalysis);

        // Get regulatory updates
        const regs =
          await regulatoryKnowledgeBase.getRegulatoryChanges(
            destinationCountry,
          );
        setRegulatoryAlerts(
          regs.filter((r) => new Date(r.effectiveDate) > new Date()),
        );

        // Get tariff updates
        const tariffs =
          await regulatoryKnowledgeBase.getTariffUpdates(destinationCountry);
        setTariffUpdates(tariffs);
      } catch (error) {
        console.error("Error loading intelligence data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [
    originCountry,
    destinationCountry,
    bottlenecks,
    criticalBottleneck,
    productCategory,
    annualShipments,
    averageShipmentValue,
  ]);

  // Calculate ROI when a program is selected
  useEffect(() => {
    async function calculateROI() {
      if (selectedProgram && criticalBottleneck) {
        const roi = await tradeProgramAdvisorService.calculateROI(
          selectedProgram.id,
          annualShipments,
          averageShipmentValue,
          criticalBottleneck.avgHours,
          30, // Estimated current inspection rate
        );
        setRoiAnalysis(roi);
      }
    }
    calculateROI();
  }, [
    selectedProgram,
    annualShipments,
    averageShipmentValue,
    criticalBottleneck,
  ]);

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "ri-dashboard-line" },
    {
      id: "root-cause" as TabType,
      label: "Root Cause",
      icon: "ri-search-eye-line",
    },
    {
      id: "programs" as TabType,
      label: "Trade Programs",
      icon: "ri-shield-star-line",
    },
    {
      id: "certificates" as TabType,
      label: "Certificates",
      icon: "ri-file-certificate-line",
    },
    {
      id: "regulations" as TabType,
      label: "Regulations",
      icon: "ri-book-open-line",
    },
    {
      id: "roi" as TabType,
      label: "ROI Calculator",
      icon: "ri-calculator-line",
    },
  ];

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-4 text-white">
            Analyzing customs intelligence...
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#0a0f1a] to-[#111827] border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <i className="ri-lightbulb-flash-line text-2xl text-white"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Journey Intelligence
              </h2>
              <p className="text-[#9ca3af] text-sm">
                {originCountry} → {destinationCountry} • AI-Powered Optimization
                Recommendations
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <i className="ri-close-line text-xl text-[#9ca3af]"></i>
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-xs text-[#9ca3af]">Critical Bottleneck</p>
            <p className="text-lg font-bold text-red-400">
              {criticalBottleneck?.avgHours.toFixed(1)}h
            </p>
            <p className="text-xs text-[#6b7280] truncate">
              {criticalBottleneck?.touchpoint}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-xs text-[#9ca3af]">Optimization Potential</p>
            <p className="text-lg font-bold text-green-400">
              {totalOptimizationPotential.toFixed(1)}h
            </p>
            <p className="text-xs text-[#6b7280]">savings possible</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-xs text-[#9ca3af]">Programs Available</p>
            <p className="text-lg font-bold text-cyan-400">
              {programRecommendations.length}
            </p>
            <p className="text-xs text-[#6b7280]">recommended</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-xs text-[#9ca3af]">Regulatory Alerts</p>
            <p className="text-lg font-bold text-yellow-400">
              {regulatoryAlerts.length}
            </p>
            <p className="text-xs text-[#6b7280]">upcoming changes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 px-4 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-xl p-6 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <i className="ri-lightbulb-line text-cyan-400"></i>
                  Executive Summary
                </h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Your{" "}
                  <strong className="text-white">
                    {originCountry} → {destinationCountry}
                  </strong>{" "}
                  trade lane has a{" "}
                  <strong className="text-red-400">
                    {criticalBottleneck?.avgHours.toFixed(1)}-hour bottleneck
                  </strong>{" "}
                  at
                  <strong className="text-white">
                    {" "}
                    {criticalBottleneck?.touchpoint}
                  </strong>
                  . This is primarily due to{" "}
                  <strong className="text-yellow-400">
                    {rootCauseAnalysis?.primaryCauseDescription ||
                      "customs processing delays"}
                  </strong>
                  . By implementing our recommended solutions, you could save up
                  to
                  <strong className="text-green-400">
                    {" "}
                    {totalOptimizationPotential.toFixed(0)} hours per shipment
                  </strong>
                  .
                </p>
              </div>

              {/* Top Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-star-line text-yellow-400"></i>
                  Top Recommendations
                </h3>
                <div className="space-y-3">
                  {/* Program Recommendation */}
                  {programRecommendations[0] && (
                    <div
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedProgram(programRecommendations[0].program);
                        setActiveTab("programs");
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mt-1">
                            <i className="ri-shield-star-line text-cyan-400"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white">
                                {programRecommendations[0].program.name}
                              </h4>
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                                RECOMMENDED
                              </span>
                            </div>
                            <p className="text-sm text-[#9ca3af] mt-1">
                              {programRecommendations[0].matchReason}
                            </p>
                            <p className="text-sm text-green-400 mt-2">
                              {programRecommendations[0].expectedBenefit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">
                            {programRecommendations[0].relevanceScore}%
                          </div>
                          <div className="text-xs text-[#6b7280]">match</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certificate Recommendation */}
                  {certificateAnalysis?.recommendations[0] && (
                    <div
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-all cursor-pointer"
                      onClick={() => setActiveTab("certificates")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mt-1">
                          <i className="ri-file-certificate-line text-green-400"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">
                              {
                                certificateAnalysis.recommendations[0]
                                  .certificate.fullName
                              }
                            </h4>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              OBTAIN
                            </span>
                          </div>
                          <p className="text-sm text-[#9ca3af] mt-1">
                            {
                              certificateAnalysis.recommendations[0]
                                .benefitIfObtained
                            }
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-[#6b7280]">
                            <span>
                              <i className="ri-time-line mr-1"></i>
                              {
                                certificateAnalysis.recommendations[0]
                                  .timeToObtain
                              }{" "}
                              days
                            </span>
                            <span>
                              <i className="ri-money-dollar-circle-line mr-1"></i>
                              {
                                certificateAnalysis.recommendations[0]
                                  .costToObtain.amount
                              }{" "}
                              {
                                certificateAnalysis.recommendations[0]
                                  .costToObtain.currency
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Win */}
                  {rootCauseAnalysis?.immediateSolutions[0] && (
                    <div
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-yellow-500/50 transition-all cursor-pointer"
                      onClick={() => setActiveTab("root-cause")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mt-1">
                          <i className="ri-flashlight-line text-yellow-400"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">
                              {rootCauseAnalysis.immediateSolutions[0].title}
                            </h4>
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              QUICK WIN
                            </span>
                          </div>
                          <p className="text-sm text-[#9ca3af] mt-1">
                            {
                              rootCauseAnalysis.immediateSolutions[0]
                                .description
                            }
                          </p>
                          <p className="text-sm text-green-400 mt-2">
                            <i className="ri-timer-line mr-1"></i>
                            Save{" "}
                            {
                              rootCauseAnalysis.immediateSolutions[0]
                                .expectedImpact.delayReduction
                            }
                            h per shipment
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Root Cause Tab */}
          {activeTab === "root-cause" && rootCauseAnalysis && (
            <motion.div
              key="root-cause"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Primary Cause */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <i className="ri-error-warning-line text-red-400"></i>
                  Primary Root Cause
                </h3>
                <p className="text-red-400 font-medium">
                  {rootCauseAnalysis.primaryCause.replace(/_/g, " ")}
                </p>
                <p className="text-[#9ca3af] mt-2">
                  {rootCauseAnalysis.primaryCauseDescription}
                </p>
              </div>

              {/* Cause Chain */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Cause Chain Analysis
                </h3>
                <div className="space-y-2">
                  {rootCauseAnalysis.causeChain.map((cause, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            cause.level === 1
                              ? "bg-red-500 text-white"
                              : cause.level === 2
                                ? "bg-yellow-500 text-black"
                                : "bg-blue-500 text-white"
                          }`}
                        >
                          {cause.level}
                        </div>
                        {index < rootCauseAnalysis.causeChain.length - 1 && (
                          <div className="w-0.5 h-8 bg-white/20"></div>
                        )}
                      </div>
                      <div className="flex-1 bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">
                            {cause.cause}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              cause.isControllable
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {cause.isControllable ? "Controllable" : "External"}
                          </span>
                        </div>
                        <p className="text-sm text-[#9ca3af]">
                          {cause.description}
                        </p>
                        <p className="text-xs text-[#6b7280] mt-1">
                          Owner: {cause.owner}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Contributing Factors
                </h3>
                <div className="space-y-3">
                  {rootCauseAnalysis.contributingFactors.map(
                    (factor, index) => (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">
                            {factor.factor}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                                style={{ width: `${factor.weight}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-cyan-400">
                              {factor.weight}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#9ca3af]">
                          {factor.description}
                        </p>
                        {factor.addressingSolution && (
                          <p className="text-sm text-green-400 mt-2">
                            <i className="ri-lightbulb-line mr-1"></i>
                            {factor.addressingSolution}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recommended Solutions
                </h3>

                {/* Immediate Solutions */}
                {rootCauseAnalysis.immediateSolutions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                      <i className="ri-flashlight-line"></i> Immediate (Quick
                      Wins)
                    </h4>
                    {rootCauseAnalysis.immediateSolutions.map((solution) => (
                      <SolutionCard
                        key={solution.id}
                        solution={solution}
                        isExpanded={expandedSolution === solution.id}
                        onToggle={() =>
                          setExpandedSolution(
                            expandedSolution === solution.id
                              ? null
                              : solution.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Short-term Solutions */}
                {rootCauseAnalysis.shortTermSolutions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
                      <i className="ri-time-line"></i> Short-term (1-3 months)
                    </h4>
                    {rootCauseAnalysis.shortTermSolutions.map((solution) => (
                      <SolutionCard
                        key={solution.id}
                        solution={solution}
                        isExpanded={expandedSolution === solution.id}
                        onToggle={() =>
                          setExpandedSolution(
                            expandedSolution === solution.id
                              ? null
                              : solution.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Long-term Solutions */}
                {rootCauseAnalysis.longTermSolutions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                      <i className="ri-calendar-line"></i> Long-term (3-12
                      months)
                    </h4>
                    {rootCauseAnalysis.longTermSolutions.map((solution) => (
                      <SolutionCard
                        key={solution.id}
                        solution={solution}
                        isExpanded={expandedSolution === solution.id}
                        onToggle={() =>
                          setExpandedSolution(
                            expandedSolution === solution.id
                              ? null
                              : solution.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Strategic Solutions */}
                {rootCauseAnalysis.strategicSolutions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                      <i className="ri-rocket-line"></i> Strategic (12+ months)
                    </h4>
                    {rootCauseAnalysis.strategicSolutions.map((solution) => (
                      <SolutionCard
                        key={solution.id}
                        solution={solution}
                        isExpanded={expandedSolution === solution.id}
                        onToggle={() =>
                          setExpandedSolution(
                            expandedSolution === solution.id
                              ? null
                              : solution.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Programs Tab */}
          {activeTab === "programs" && (
            <motion.div
              key="programs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recommended Trade Programs
                </h3>
                <div className="space-y-4">
                  {programRecommendations.map((rec, index) => (
                    <motion.div
                      key={rec.program.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/5 rounded-xl border transition-all cursor-pointer ${
                        selectedProgram?.id === rec.program.id
                          ? "border-cyan-500 ring-2 ring-cyan-500/30"
                          : "border-white/10 hover:border-cyan-500/50"
                      }`}
                      onClick={() => setSelectedProgram(rec.program)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <i className="ri-shield-star-line text-xl text-white"></i>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-lg">
                                {rec.program.name}
                              </h4>
                              <p className="text-sm text-[#9ca3af]">
                                {rec.program.fullName}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="px-2 py-0.5 bg-white/10 text-[#9ca3af] rounded text-xs">
                                  {rec.program.authority}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    rec.program.tier === "ELITE"
                                      ? "bg-purple-500/20 text-purple-400"
                                      : rec.program.tier === "ADVANCED"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {rec.program.tier}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-cyan-400">
                              {rec.relevanceScore}%
                            </div>
                            <div className="text-xs text-[#6b7280]">
                              relevance
                            </div>
                          </div>
                        </div>

                        <p className="text-[#9ca3af] mb-4">
                          {rec.program.description}
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <p className="text-xs text-[#6b7280]">
                              Processing Time
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {rec.program.estimatedProcessingTime.average} days
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <p className="text-xs text-[#6b7280]">
                              First Year Cost
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {rec.program.totalFirstYearCost.amount.toLocaleString()}{" "}
                              {rec.program.totalFirstYearCost.currency}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <p className="text-xs text-[#6b7280]">
                              Approval Rate
                            </p>
                            <p className="text-lg font-semibold text-green-400">
                              {rec.program.successMetrics.approvalRate}%
                            </p>
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-white mb-2">
                            Key Benefits
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {rec.program.benefits.slice(0, 4).map((benefit) => (
                              <div
                                key={benefit.id}
                                className="flex items-center gap-2"
                              >
                                <i className="ri-checkbox-circle-line text-green-400"></i>
                                <span className="text-sm text-[#9ca3af]">
                                  {benefit.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What it unlocks */}
                        {rec.unlocksPotential.length > 0 && (
                          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                            <h5 className="text-sm font-medium text-green-400 mb-2">
                              What This Unlocks for You
                            </h5>
                            <ul className="space-y-1">
                              {rec.unlocksPotential.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-[#9ca3af] flex items-start gap-2"
                                >
                                  <i className="ri-arrow-right-s-line text-green-400 mt-0.5"></i>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Pros and Cons Preview */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h5 className="text-sm font-medium text-green-400 mb-2">
                              Pros
                            </h5>
                            <ul className="space-y-1">
                              {rec.program.benefits.slice(0, 3).map((b) => (
                                <li
                                  key={b.id}
                                  className="text-xs text-[#9ca3af] flex items-start gap-1"
                                >
                                  <i className="ri-add-line text-green-400"></i>
                                  {b.quantifiableImpact
                                    ? `${b.quantifiableImpact.reduction}% ${b.quantifiableImpact.metric.toLowerCase()}`
                                    : b.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-red-400 mb-2">
                              Considerations
                            </h5>
                            <ul className="space-y-1">
                              <li className="text-xs text-[#9ca3af] flex items-start gap-1">
                                <i className="ri-subtract-line text-red-400"></i>
                                {rec.implementation.timeline} months to
                                implement
                              </li>
                              <li className="text-xs text-[#9ca3af] flex items-start gap-1">
                                <i className="ri-subtract-line text-red-400"></i>
                                {rec.implementation.effort} effort required
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Certificates Tab */}
          {activeTab === "certificates" && certificateAnalysis && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-xl p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Certificate Optimization Potential
                </h3>
                <p className="text-[#9ca3af]">
                  By obtaining the recommended certificates, you could save up
                  to
                  <span className="text-green-400 font-bold">
                    {" "}
                    {certificateAnalysis.totalPotentialTimeSavings} hours{" "}
                  </span>
                  per shipment in clearance time.
                </p>
              </div>

              {/* Missing Certificates */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recommended Certificates
                </h3>
                <div className="space-y-4">
                  {certificateAnalysis.recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.certificate.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <i className="ri-file-certificate-line text-xl text-green-400"></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {rec.certificate.fullName}
                            </h4>
                            <p className="text-sm text-[#9ca3af]">
                              Issued by: {rec.certificate.issuingAuthority}
                            </p>
                            <div className="flex gap-4 mt-3 text-sm">
                              <span className="text-[#9ca3af]">
                                <i className="ri-time-line mr-1 text-cyan-400"></i>
                                {rec.timeToObtain} days to obtain
                              </span>
                              <span className="text-[#9ca3af]">
                                <i className="ri-money-dollar-circle-line mr-1 text-cyan-400"></i>
                                {rec.costToObtain.amount}{" "}
                                {rec.costToObtain.currency}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            rec.recommendation === "OBTAIN"
                              ? "bg-green-500/20 text-green-400"
                              : rec.recommendation === "RENEW"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {rec.recommendation}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                          <h5 className="text-sm font-medium text-red-400 mb-2">
                            Without Certificate
                          </h5>
                          <p className="text-2xl font-bold text-red-400">
                            {
                              rec.certificate.impactOnClearance
                                .withoutCertificate.avgHours
                            }
                            h
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            {
                              rec.certificate.impactOnClearance
                                .withoutCertificate.inspectionRate
                            }
                            % inspection rate
                          </p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                          <h5 className="text-sm font-medium text-green-400 mb-2">
                            With Certificate
                          </h5>
                          <p className="text-2xl font-bold text-green-400">
                            {
                              rec.certificate.impactOnClearance.withCertificate
                                .avgHours
                            }
                            h
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            {
                              rec.certificate.impactOnClearance.withCertificate
                                .inspectionRate
                            }
                            % inspection rate
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-white/5 rounded-lg">
                        <h5 className="text-sm font-medium text-white mb-2">
                          Benefits
                        </h5>
                        <p className="text-sm text-[#9ca3af]">
                          {rec.benefitIfObtained}
                        </p>
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-white mb-2">
                            How to Obtain
                          </h5>
                          <ol className="space-y-1">
                            {rec.certificate.obtainingProcess.map((step, i) => (
                              <li
                                key={i}
                                className="text-sm text-[#9ca3af] flex items-start gap-2"
                              >
                                <span className="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-xs flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Regulations Tab */}
          {activeTab === "regulations" && (
            <motion.div
              key="regulations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Regulatory Alerts */}
              {regulatoryAlerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-alarm-warning-line text-yellow-400"></i>
                    Upcoming Regulatory Changes
                  </h3>
                  <div className="space-y-4">
                    {regulatoryAlerts.map((reg, index) => (
                      <motion.div
                        key={reg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white/5 rounded-xl p-6 border ${
                          reg.impactLevel === "HIGH" ||
                          reg.impactLevel === "CRITICAL"
                            ? "border-yellow-500/30"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white">
                              {reg.title}
                            </h4>
                            <p className="text-sm text-[#9ca3af]">
                              {reg.authority} • {reg.country}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              reg.impactLevel === "CRITICAL"
                                ? "bg-red-500/20 text-red-400"
                                : reg.impactLevel === "HIGH"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : reg.impactLevel === "MEDIUM"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {reg.impactLevel}
                          </span>
                        </div>
                        <p className="text-[#9ca3af] mb-4">{reg.description}</p>
                        <div className="flex items-center gap-4 text-sm text-[#6b7280] mb-4">
                          <span>
                            <i className="ri-calendar-line mr-1"></i>Effective:{" "}
                            {reg.effectiveDate}
                          </span>
                          <span>
                            <i className="ri-article-line mr-1"></i>Category:{" "}
                            {reg.category}
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-white mb-2">
                            Required Actions
                          </h5>
                          <ul className="space-y-1">
                            {reg.requiredActions.map((action, i) => (
                              <li
                                key={i}
                                className="text-sm text-[#9ca3af] flex items-start gap-2"
                              >
                                <i className="ri-checkbox-blank-circle-line text-cyan-400 mt-1"></i>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tariff Updates */}
              {tariffUpdates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-percent-line text-cyan-400"></i>
                    Recent Tariff Changes
                  </h3>
                  <div className="space-y-3">
                    {tariffUpdates.map((tariff, index) => (
                      <div
                        key={tariff.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">
                              {tariff.productDescription}
                            </h4>
                            <p className="text-sm text-[#9ca3af]">
                              HS Code: {tariff.hsCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-[#9ca3af]">
                                {tariff.previousRate}%
                              </span>
                              <i className="ri-arrow-right-line text-[#6b7280]"></i>
                              <span
                                className={
                                  tariff.impact === "POSITIVE"
                                    ? "text-green-400"
                                    : tariff.impact === "NEGATIVE"
                                      ? "text-red-400"
                                      : "text-white"
                                }
                              >
                                {tariff.newRate}%
                              </span>
                            </div>
                            <span
                              className={`text-xs ${
                                tariff.impact === "POSITIVE"
                                  ? "text-green-400"
                                  : tariff.impact === "NEGATIVE"
                                    ? "text-red-400"
                                    : "text-[#6b7280]"
                              }`}
                            >
                              {tariff.impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ROI Calculator Tab */}
          {activeTab === "roi" && (
            <motion.div
              key="roi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {selectedProgram ? (
                <>
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-xl p-6 border border-cyan-500/30">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      ROI Analysis: {selectedProgram.name}
                    </h3>
                    <p className="text-[#9ca3af]">
                      Based on {annualShipments} shipments/year at $
                      {averageShipmentValue.toLocaleString()} average value
                    </p>
                  </div>

                  {roiAnalysis && (
                    <div className="grid grid-cols-2 gap-6">
                      {/* Investment */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h4 className="text-sm font-medium text-[#9ca3af] mb-4">
                          Investment Required
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[#9ca3af]">
                              Initial Investment
                            </span>
                            <span className="text-xl font-bold text-white">
                              $
                              {roiAnalysis.initialInvestment.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#9ca3af]">Annual Costs</span>
                            <span className="text-lg font-semibold text-white">
                              ${roiAnalysis.annualCosts.amount.toLocaleString()}
                              /yr
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
                        <h4 className="text-sm font-medium text-green-400 mb-4">
                          Annual Benefits
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[#9ca3af]">Time Savings</span>
                            <span className="text-green-400 font-semibold">
                              $
                              {roiAnalysis.annualBenefits.timeSavings.monetaryValue.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#9ca3af]">
                              Inspection Reduction
                            </span>
                            <span className="text-green-400 font-semibold">
                              $
                              {roiAnalysis.annualBenefits.inspectionReductions.monetaryValue.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#9ca3af]">
                              Penalty Avoidance
                            </span>
                            <span className="text-green-400 font-semibold">
                              $
                              {roiAnalysis.annualBenefits.penaltyAvoidance.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                            <span className="text-white font-medium">
                              Net Annual Benefit
                            </span>
                            <span className="text-2xl font-bold text-green-400">
                              $
                              {roiAnalysis.netAnnualBenefit.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="col-span-2 grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                          <p className="text-3xl font-bold text-cyan-400">
                            {roiAnalysis.paybackPeriod}
                          </p>
                          <p className="text-sm text-[#9ca3af] mt-1">
                            Months Payback
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                          <p className="text-3xl font-bold text-green-400">
                            {roiAnalysis.fiveYearROI}%
                          </p>
                          <p className="text-sm text-[#9ca3af] mt-1">
                            5-Year ROI
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                          <p className="text-xl font-bold text-white">
                            {roiAnalysis.breakEvenPoint}
                          </p>
                          <p className="text-sm text-[#9ca3af] mt-1">
                            Break-Even Date
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <i className="ri-calculator-line text-6xl text-[#6b7280] mb-4"></i>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Select a Program
                  </h3>
                  <p className="text-[#9ca3af]">
                    Select a trade program from the Programs tab to see detailed
                    ROI analysis
                  </p>
                  <button
                    onClick={() => setActiveTab("programs")}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    View Programs
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Solution Card Component
function SolutionCard({
  solution,
  isExpanded,
  onToggle,
}: {
  solution: Solution;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-3">
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                solution.type === "PROGRAM"
                  ? "bg-cyan-500/20"
                  : solution.type === "CERTIFICATE"
                    ? "bg-green-500/20"
                    : solution.type === "PROCESS"
                      ? "bg-yellow-500/20"
                      : "bg-blue-500/20"
              }`}
            >
              <i
                className={`${
                  solution.type === "PROGRAM"
                    ? "ri-shield-star-line text-cyan-400"
                    : solution.type === "CERTIFICATE"
                      ? "ri-file-certificate-line text-green-400"
                      : solution.type === "PROCESS"
                        ? "ri-settings-3-line text-yellow-400"
                        : "ri-code-line text-blue-400"
                }`}
              ></i>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-white">{solution.title}</h5>
              <p className="text-sm text-[#9ca3af] mt-1 line-clamp-2">
                {solution.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#6b7280]">
                <span
                  className={`px-2 py-0.5 rounded ${
                    solution.implementationComplexity === "LOW"
                      ? "bg-green-500/20 text-green-400"
                      : solution.implementationComplexity === "MEDIUM"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {solution.implementationComplexity} effort
                </span>
                <span>
                  <i className="ri-timer-line mr-1"></i>
                  {solution.estimatedTimeToImplement} days
                </span>
                <span className="text-green-400 font-medium">
                  <i className="ri-subtract-line mr-1"></i>
                  {solution.expectedImpact.delayReduction}h savings
                </span>
              </div>
            </div>
          </div>
          <i
            className={`ri-arrow-${isExpanded ? "up" : "down"}-s-line text-xl text-[#6b7280]`}
          ></i>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Pros and Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h6 className="text-sm font-medium text-green-400 mb-2">
                    Pros
                  </h6>
                  <ul className="space-y-1">
                    {solution.pros.map((pro, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#9ca3af] flex items-start gap-2"
                      >
                        <i className="ri-add-line text-green-400 mt-0.5"></i>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-red-400 mb-2">
                    Cons
                  </h6>
                  <ul className="space-y-1">
                    {solution.cons.map((con, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#9ca3af] flex items-start gap-2"
                      >
                        <i className="ri-subtract-line text-red-400 mt-0.5"></i>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Implementation Steps */}
              <div>
                <h6 className="text-sm font-medium text-white mb-2">
                  Implementation Steps
                </h6>
                <ol className="space-y-2">
                  {solution.steps.map((step, i) => (
                    <li
                      key={i}
                      className="text-sm text-[#9ca3af] flex items-start gap-2"
                    >
                      <span className="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-xs flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* ROI Info */}
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {solution.expectedImpact.delayReduction}h
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      Time Saved/Shipment
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      $
                      {solution.expectedImpact.costSavings.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#9ca3af]">Cost Savings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {solution.roi.annualROI}%
                    </p>
                    <p className="text-xs text-[#9ca3af]">Annual ROI</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
