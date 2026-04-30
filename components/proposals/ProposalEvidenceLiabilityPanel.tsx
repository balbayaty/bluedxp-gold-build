/**
 * Proposal Evidence & Liability Panel
 * Comprehensive view of proposal evidence, liability assessment, and contract status
 * Deep integration with Evidence Ledger, Liability Engine, and Contract Service
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ProposalEvidenceLiabilityPanelProps {
  proposalId: string;
  tenantId?: string;
}

export default function ProposalEvidenceLiabilityPanel({
  proposalId,
  tenantId = "default",
}: ProposalEvidenceLiabilityPanelProps) {
  const [evidence, setEvidence] = useState<any>(null);
  const [liability, setLiability] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "evidence" | "liability" | "contract"
  >("evidence");

  useEffect(() => {
    loadAllData();
  }, [proposalId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load evidence lineage
      const evidenceRes = await fetch(
        `/api/proposals/${proposalId}/evidence?tenantId=${tenantId}`,
      );
      const evidenceData = await evidenceRes.json();
      if (evidenceData.success) setEvidence(evidenceData.data);

      // Load liability assessment
      const liabilityRes = await fetch(
        `/api/proposals/${proposalId}/liability?tenantId=${tenantId}`,
      );
      const liabilityData = await liabilityRes.json();
      if (liabilityData.success) setLiability(liabilityData.data);

      // Load contract status
      const contractRes = await fetch(
        `/api/proposals/${proposalId}/contract?tenantId=${tenantId}`,
      );
      const contractData = await contractRes.json();
      if (contractData.success) setContract(contractData.data);
    } catch (error) {
      console.error("Error loading evidence/liability/contract data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "HIGH":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "CRITICAL":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab("evidence")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "evidence"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <i className="ri-file-shield-line mr-2" />
            Evidence
          </button>
          <button
            onClick={() => setActiveTab("liability")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "liability"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <i className="ri-shield-cross-line mr-2" />
            Liability & Risk
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "contract"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <i className="ri-file-paper-line mr-2" />
            Contract
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "evidence" && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {evidence ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Evidence Lineage
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        evidence.integrity?.valid
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      <i
                        className={`ri-${evidence.integrity?.valid ? "check" : "close"}-line mr-1`}
                      />
                      {evidence.integrity?.valid ? "Verified" : "Invalid"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Evidence Chain
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {evidence.evidenceChain?.length || 0} records
                        </span>
                      </div>
                      <div className="space-y-2">
                        {evidence.evidenceChain
                          ?.slice(0, 5)
                          .map((ev: any, index: number) => (
                            <div
                              key={ev.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-gray-600 dark:text-gray-400">
                                {ev.metadata?.action || ev.type}
                              </span>
                              <span className="text-gray-400 dark:text-gray-500 text-xs">
                                {new Date(ev.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Chain of Custody
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {evidence.chainOfCustody?.length || 0} transfers
                        </span>
                      </div>
                      {evidence.chainOfCustody?.length > 0 ? (
                        <div className="space-y-2">
                          {evidence.chainOfCustody.map(
                            (custody: any, index: number) => (
                              <div
                                key={index}
                                className="text-sm text-gray-600 dark:text-gray-400"
                              >
                                <i className="ri-arrow-right-line mr-2" />
                                {custody.from} → {custody.to}
                                <span className="text-xs text-gray-400 ml-2">
                                  {new Date(
                                    custody.timestamp,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No custody transfers recorded
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/evidence?entityId=${proposalId}&entityType=Proposal`}
                      className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <i className="ri-external-link-line mr-2" />
                      View Full Evidence Ledger
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-file-shield-line text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No evidence recorded yet
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "liability" && (
            <motion.div
              key="liability"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {liability ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Liability Assessment
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(liability.riskLevel)}`}
                    >
                      {liability.riskLevel} Risk
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Potential Exposure
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency:
                            liability.liabilityExposure?.currency || "SAR",
                        }).format(
                          liability.liabilityExposure?.potentialExposure || 0,
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Risk Factors
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {liability.riskFactors?.length || 0}
                      </p>
                    </div>
                  </div>

                  {liability.riskFactors &&
                    liability.riskFactors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Risk Factors
                        </h4>
                        {liability.riskFactors
                          .slice(0, 3)
                          .map((factor: any, index: number) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-orange-500"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {factor.factor}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${getRiskColor(factor.severity)}`}
                                >
                                  {factor.severity}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {factor.description}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                💡 {factor.mitigation}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                  {liability.insurance && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Insurance Optimization
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Premium Impact
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              liability.insurance.premiumImpact?.changePercent <
                              0
                                ? "text-green-600 dark:text-green-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {liability.insurance.premiumImpact?.changePercent >
                            0
                              ? "+"
                              : ""}
                            {liability.insurance.premiumImpact?.changePercent?.toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                        {liability.insurance.premiumImpact?.changePercent <
                          0 && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            ✓ Risk mitigation measures can reduce premium
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {liability.recommendations &&
                    liability.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Recommendations
                        </h4>
                        {liability.recommendations
                          .slice(0, 3)
                          .map((rec: any, index: number) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border-l-4 ${
                                rec.priority === "HIGH"
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                                  : rec.priority === "MEDIUM"
                                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    rec.priority === "HIGH"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : rec.priority === "MEDIUM"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {rec.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {rec.recommendation}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {rec.impact}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                  <Link
                    href={`/liability/assessments?proposalId=${proposalId}`}
                    className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <i className="ri-external-link-line mr-2" />
                    View Full Liability Assessment
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-shield-cross-line text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No liability assessment yet
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/proposals/${proposalId}/liability/assess`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tenantId }),
                          },
                        );
                        const data = await res.json();
                        if (data.success) {
                          setLiability(data.data);
                          alert("Liability assessment completed!");
                        }
                      } catch (error) {
                        console.error("Error assessing liability:", error);
                        alert("Failed to assess liability");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Assess Liability
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "contract" && (
            <motion.div
              key="contract"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {contract ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Contract Status
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        contract.status === "CONVERTED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {contract.status}
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Contract Number
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {contract.contractNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Conversion Type
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {contract.conversionType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Converted At
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(contract.convertedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {contract.compliance && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="ri-checkbox-circle-fill text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Compliance Status
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>✓ All sections mapped</p>
                        <p>✓ Required sections present</p>
                        <p>✓ Terms validated</p>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/procurement/contracts/${contract.contractId}`}
                    className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <i className="ri-external-link-line mr-2" />
                    View Contract
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-file-paper-line text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No contract created yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Contract will be automatically created when proposal is
                    accepted
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
