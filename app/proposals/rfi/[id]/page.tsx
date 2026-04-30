/**
 * RFI Detail Page
 * Comprehensive RFI view with intelligence, analysis, and pipeline actions
 * End-user ready with full integration
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import type { RFI, RFIAnalysis } from "@/lib/services/proposals/RFIService";

export default function RFIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, tenant, hasModuleAccess, canPerformAction } = useAuth();
  const rfiId = params.id as string;

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreateRFQ = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.rfq",
    undefined,
    "write",
  );
  const canCreateProposal = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.proposals",
    undefined,
    "write",
  );

  const [rfi, setRfi] = useState<RFI | null>(null);
  const [analysis, setAnalysis] = useState<RFIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analysis" | "pipeline" | "intelligence"
  >("overview");
  const [generatingRFQ, setGeneratingRFQ] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  useEffect(() => {
    if (!hasAccess) {
      setError("You do not have permission to view RFIs");
      setLoading(false);
      return;
    }

    if (rfiId) {
      loadRFIData();
    }
  }, [rfiId, hasAccess]);

  const loadRFIData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = tenant?.id || "default";

      // Load RFI and analysis in parallel
      const [rfiRes, analysisRes] = await Promise.allSettled([
        fetch(`/api/rfi/${rfiId}`, {
          headers: {
            "x-tenant-id": tenantId,
          },
        }),
        fetch(`/api/rfi/${rfiId}/analyze`, {
          headers: {
            "x-tenant-id": tenantId,
          },
        }),
      ]);

      if (rfiRes.status === "fulfilled" && rfiRes.value.ok) {
        const rfiData = await rfiRes.value.json();
        if (rfiData.success) {
          setRfi(rfiData.data);
        } else {
          setError(rfiData.error || "Failed to load RFI");
        }
      } else {
        setError("Failed to load RFI");
      }

      if (analysisRes.status === "fulfilled" && analysisRes.value.ok) {
        const analysisData = await analysisRes.value.json();
        if (analysisData.success) {
          setAnalysis(analysisData.data);
        }
      }
    } catch (err) {
      console.error("Error loading RFI data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRFQ = async () => {
    if (!rfi) return;
    if (!canCreateRFQ) {
      alert("You do not have permission to create RFQs");
      return;
    }
    setGeneratingRFQ(true);
    try {
      const tenantId = tenant?.id || "default";
      const res = await fetch(`/api/rfi/${rfiId}/generate-rfq`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        // Reload RFI to get updated status
        await loadRFIData();
        // Navigate to RFQ if generated
        if (data.data.rfqId) {
          router.push(`/proposals/rfq?rfqId=${data.data.rfqId}`);
        }
      } else {
        alert(data.error || "Failed to generate RFQ");
      }
    } catch (err) {
      console.error("Error generating RFQ:", err);
      alert("An error occurred while generating RFQ");
    } finally {
      setGeneratingRFQ(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!rfi) return;
    if (!canCreateProposal) {
      alert("You do not have permission to create proposals");
      return;
    }
    setGeneratingProposal(true);
    try {
      const tenantId = tenant?.id || "default";
      const res = await fetch(`/api/rfi/${rfiId}/generate-proposal`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        // Reload RFI to get updated status
        await loadRFIData();
        // Navigate to proposal if generated
        if (data.data.proposalId) {
          router.push(`/proposals/${data.data.proposalId}/enhanced`);
        }
      } else {
        alert(data.error || "Failed to generate proposal");
      }
    } catch (err) {
      console.error("Error generating proposal:", err);
      alert("An error occurred while generating proposal");
    } finally {
      setGeneratingProposal(false);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Green":
        return "bg-green-500";
      case "Amber":
        return "bg-yellow-500";
      case "Red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "RFQ_GENERATED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "PROPOSAL_GENERATED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Loading RFI"
        description="Loading RFI details..."
        icon="ri-file-search-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader message="Loading RFI details..." />
        </div>
      </PageTemplate>
    );
  }

  if (error || !rfi) {
    return (
      <PageTemplate
        title="RFI Not Found"
        description="The requested RFI could not be loaded"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {error || "RFI Not Found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The RFI you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/proposals/rfi")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to RFI Portal
              </button>
              <button
                onClick={loadRFIData}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title={`RFI ${rfi.rfiNumber}`}
        description={`${rfi.companyName} - Intelligent Request for Information`}
        icon="ri-file-search-line"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/proposals/rfi"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className="ri-arrow-left-line mr-2" />
              Back
            </Link>
            {rfi.status === "SUBMITTED" && !rfi.generatedRFQId && (
              <button
                onClick={handleGenerateRFQ}
                disabled={generatingRFQ}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingRFQ ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="ri-questionnaire-line" />
                    Generate RFQ
                  </>
                )}
              </button>
            )}
            {rfi.status === "SUBMITTED" && !rfi.generatedProposalId && (
              <button
                onClick={handleGenerateProposal}
                disabled={generatingProposal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingProposal ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="ri-file-add-line" />
                    Generate Proposal
                  </>
                )}
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="text-sm opacity-90">Status</div>
              <div className="text-2xl font-bold mt-1">{rfi.status}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="text-sm opacity-90">Data Completeness</div>
              <div className="text-2xl font-bold mt-1">
                {rfi.dataCompleteness}%
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="text-sm opacity-90">Pricing Readiness</div>
              <div className="text-2xl font-bold mt-1">
                {rfi.pricingReadiness}%
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="text-sm opacity-90">Confidence</div>
              <div className="text-2xl font-bold mt-1">
                {rfi.pricingConfidence}
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1 p-2">
                {(
                  ["overview", "analysis", "pipeline", "intelligence"] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      {/* Company Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Company Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Company Name
                            </label>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {rfi.companyName}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Contact Person
                            </label>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {rfi.contactPerson}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Email
                            </label>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {rfi.email}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Phone
                            </label>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {rfi.phone || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Storage Details */}
                      {rfi.storage && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Storage Requirements
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {rfi.storage.storageSqm && (
                              <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400">
                                  Storage (sqm)
                                </label>
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {rfi.storage.storageSqm}
                                </div>
                              </div>
                            )}
                            {rfi.storage.storageCbm && (
                              <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400">
                                  Storage (cbm)
                                </label>
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {rfi.storage.storageCbm}
                                </div>
                              </div>
                            )}
                            {rfi.storage.palletPositions && (
                              <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400">
                                  Pallet Positions
                                </label>
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {rfi.storage.palletPositions}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pipeline Status */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Pipeline Status
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${rfi.status === "SUBMITTED" ? "bg-blue-500" : "bg-gray-300"}`}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              RFI Submitted
                            </span>
                          </div>
                          {rfi.generatedRFQId && (
                            <>
                              <i className="ri-arrow-right-line text-gray-400" />
                              <Link
                                href={`/proposals/rfq?rfqId=${rfi.generatedRFQId}`}
                                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                              >
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-sm font-medium">
                                  RFQ Generated
                                </span>
                              </Link>
                            </>
                          )}
                          {rfi.generatedProposalId && (
                            <>
                              <i className="ri-arrow-right-line text-gray-400" />
                              <Link
                                href={`/proposals/${rfi.generatedProposalId}/enhanced`}
                                className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline"
                              >
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm font-medium">
                                  Proposal Generated
                                </span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "analysis" && analysis && (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Intelligence Analysis
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Completeness
                            </div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {analysis.completeness}%
                            </div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Readiness
                            </div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {analysis.readiness}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {analysis.recommendations &&
                        analysis.recommendations.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Recommendations
                            </h3>
                            <ul className="space-y-2">
                              {analysis.recommendations.map((rec, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <i className="ri-checkbox-circle-line text-green-500 mt-0.5" />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {rec}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {analysis.riskFactors &&
                        analysis.riskFactors.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Risk Factors
                            </h3>
                            <ul className="space-y-2">
                              {analysis.riskFactors.map((risk, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <i className="ri-alert-line text-orange-500 mt-0.5" />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {risk}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "pipeline" && (
                  <motion.div
                    key="pipeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Automation Pipeline
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                1
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  RFI Submitted
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {rfi.submittedAt
                                    ? new Date(
                                        rfi.submittedAt,
                                      ).toLocaleDateString()
                                    : "Not submitted"}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rfi.status)}`}
                            >
                              {rfi.status}
                            </div>
                          </div>

                          {rfi.generatedRFQId && (
                            <>
                              <div className="flex items-center justify-center">
                                <i className="ri-arrow-down-line text-2xl text-gray-400" />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                                    2
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      RFQ Generated
                                    </div>
                                    <Link
                                      href={`/proposals/rfq?rfqId=${rfi.generatedRFQId}`}
                                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                      View RFQ
                                    </Link>
                                  </div>
                                </div>
                                <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                  Complete
                                </div>
                              </div>
                            </>
                          )}

                          {rfi.generatedProposalId && (
                            <>
                              <div className="flex items-center justify-center">
                                <i className="ri-arrow-down-line text-2xl text-gray-400" />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                                    3
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      Proposal Generated
                                    </div>
                                    <Link
                                      href={`/proposals/${rfi.generatedProposalId}/enhanced`}
                                      className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                    >
                                      View Proposal
                                    </Link>
                                  </div>
                                </div>
                                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Complete
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {rfi.status === "SUBMITTED" &&
                        !rfi.generatedRFQId &&
                        !rfi.generatedProposalId && (
                          <div className="flex gap-3">
                            <button
                              onClick={handleGenerateRFQ}
                              disabled={generatingRFQ}
                              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {generatingRFQ ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  Generating RFQ...
                                </>
                              ) : (
                                <>
                                  <i className="ri-questionnaire-line" />
                                  Generate RFQ
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleGenerateProposal}
                              disabled={generatingProposal}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {generatingProposal ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  Generating Proposal...
                                </>
                              ) : (
                                <>
                                  <i className="ri-file-add-line" />
                                  Generate Proposal
                                </>
                              )}
                            </button>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "intelligence" && analysis && (
                  <motion.div
                    key="intelligence"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Key Drivers
                        </h3>
                        {rfi.keyDrivers && (
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(rfi.keyDrivers).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                                >
                                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </div>
                                  <div className="text-gray-900 dark:text-white font-medium mt-1">
                                    {value}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {analysis.assumptions &&
                        analysis.assumptions.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Assumptions
                            </h3>
                            <ul className="space-y-2">
                              {analysis.assumptions.map((assumption, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <i className="ri-information-line text-blue-500 mt-0.5" />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {assumption}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {analysis.estimatedValue && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Estimated Value
                          </h3>
                          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                            <div className="text-sm opacity-90">
                              Estimated Proposal Value
                            </div>
                            <div className="text-3xl font-bold mt-1">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "SAR",
                              }).format(analysis.estimatedValue)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
