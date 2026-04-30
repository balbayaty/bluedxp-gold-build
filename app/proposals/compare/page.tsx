/**
 * Proposal Comparison Tool
 * Side-by-side comparison of multiple proposals with diff highlighting
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import type { Proposal } from "@/types/proposals";

export default function ProposalComparePage() {
  const router = useRouter();
  const { hasModuleAccess } = useAuth();

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const [proposalIds, setProposalIds] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);

  useEffect(() => {
    if (!hasAccess) {
      return;
    }
    loadAvailableProposals();
  }, [hasAccess]);

  const loadAvailableProposals = async () => {
    try {
      const response = await fetch("/api/proposals/enhanced");
      const data = await response.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error("Error loading proposals:", error);
    }
  };

  const handleCompare = async () => {
    if (selectedProposals.length < 2) {
      alert("Please select at least 2 proposals to compare");
      return;
    }

    setLoading(true);
    try {
      const [proposal1, ...rest] = selectedProposals;
      const comparisons = await Promise.all(
        rest.map((proposal2) =>
          fetch(`/api/proposals/${proposal1}/compare?with=${proposal2}`).then(
            (res) => res.json(),
          ),
        ),
      );

      setComparison({
        base: proposals.find((p) => p.id === proposal1),
        comparisons: comparisons.map((comp, index) => ({
          proposal: proposals.find((p) => p.id === rest[index]),
          ...comp.data,
        })),
      });
    } catch (error) {
      console.error("Error comparing proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProposal = (proposalId: string) => {
    setSelectedProposals((prev) =>
      prev.includes(proposalId)
        ? prev.filter((id) => id !== proposalId)
        : [...prev, proposalId],
    );
  };

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to compare proposals"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to compare proposals.
              Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Compare Proposals"
        description="Side-by-side comparison of proposals to identify best practices"
      >
        <div className="space-y-6">
          {/* Proposal Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Proposals to Compare
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {proposals.map((proposal) => (
                <label
                  key={proposal.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedProposals.includes(proposal.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProposals.includes(proposal.id)}
                    onChange={() => toggleProposal(proposal.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {proposal.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      #{proposal.proposalNumber} • {proposal.status}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: proposal.currency || "SAR",
                      }).format(proposal.totalAmount || 0)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleCompare}
              disabled={selectedProposals.length < 2 || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Comparing..."
                : `Compare ${selectedProposals.length} Proposals`}
            </button>
          </div>

          {/* Comparison Results */}
          {comparison && (
            <div className="space-y-6">
              {comparison.comparisons.map((comp: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-0 border-b border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-r border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {comparison.base?.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        #{comparison.base?.proposalNumber}
                      </p>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {comp.proposal?.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        #{comp.proposal?.proposalNumber}
                      </p>
                    </div>
                  </div>

                  {/* Differences */}
                  <div className="p-6 space-y-4">
                    {comp.differences.title && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Titles differ
                        </p>
                      </div>
                    )}

                    {comp.differences.pricing.different && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Pricing Difference
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Proposal 1
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: comparison.base?.currency || "SAR",
                              }).format(comparison.base?.totalAmount || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Proposal 2
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: comp.proposal?.currency || "SAR",
                              }).format(comp.proposal?.totalAmount || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {comp.differences.sections.differences.length > 0 && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                          Section Differences (
                          {comp.differences.sections.differences.length})
                        </p>
                        <div className="space-y-2">
                          {comp.differences.sections.differences.map(
                            (diff: any, i: number) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium">
                                  {diff.type === "ADDED" && "➕ Added: "}
                                  {diff.type === "DELETED" && "➖ Removed: "}
                                  {diff.type === "MODIFIED" && "✏️ Modified: "}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {diff.section?.title || diff.section1?.title}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  {comp.summary.recommendation && (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        💡 Recommendation: {comp.summary.recommendation}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
