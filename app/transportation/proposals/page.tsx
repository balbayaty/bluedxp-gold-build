/**
 * Proposals & Reports Management
 *
 * Generate professional proposals, reports, and documents
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import type { Proposal, ProposalType, ExportFormat } from "@/types/proposals";
import { PremiumLoader, SkeletonCard } from "@/components/loading";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const response = await apiFetch("/api/transportation/proposals");
      if (!response.ok) {
        throw new Error(`Failed to load proposals (${response.status})`);
      }
      const data = (await response.json()) as Proposal[];
      setProposals(data || []);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading proposals", err, {
        module: "transportation",
        service: "proposals",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "proposals",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (type: ProposalType) => {
    try {
      const response = await apiFetch("/api/transportation/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalType: type,
          // API expects `quote`, `shipment`, etc. We start minimal and can enhance later.
        }),
      });

      if (response.ok) {
        const proposal = (await response.json()) as Proposal;
        router.push(`/transportation/proposals/${proposal.id}`);
      } else {
        throw new Error(`Failed to create proposal (${response.status})`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating proposal", err, {
        module: "transportation",
        service: "proposals",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "proposals",
      });
    }
  };

  const handleExport = async (proposal: Proposal, format: ExportFormat) => {
    try {
      const response = await apiFetch(
        `/api/transportation/proposals/${proposal.id}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.fileUrl) {
          // Download file
          const link = document.createElement("a");
          link.href = result.fileUrl;
          link.download = result.fileName;
          link.click();
        }
        setShowExportModal(false);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error exporting proposal", err, {
        module: "transportation",
        service: "proposals",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "proposals",
      });
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterType !== "ALL" && p.type !== filterType) return false;
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
    return true;
  });

  const proposalTypes: {
    type: ProposalType;
    name: string;
    icon: string;
    description: string;
  }[] = [
    {
      type: "QUOTE_PROPOSAL",
      name: "Quote Proposal",
      icon: "ri-file-list-3-line",
      description: "Convert quote to professional proposal",
    },
    {
      type: "SHIPMENT_REPORT",
      name: "Shipment Report",
      icon: "ri-ship-line",
      description: "Generate shipment status report",
    },
    {
      type: "ANALYTICS_REPORT",
      name: "Analytics Report",
      icon: "ri-bar-chart-box-line",
      description: "Performance analytics and insights",
    },
    {
      type: "CUSTOMS_REPORT",
      name: "Customs Report",
      icon: "ri-passport-line",
      description: "Customs clearance documentation",
    },
    {
      type: "CARRIER_PROPOSAL",
      name: "Carrier Proposal",
      icon: "ri-truck-line",
      description: "Carrier service proposal",
    },
    {
      type: "COST_ANALYSIS",
      name: "Cost Analysis",
      icon: "ri-money-dollar-circle-line",
      description: "Detailed cost breakdown",
    },
    {
      type: "PERFORMANCE_REPORT",
      name: "Performance Report",
      icon: "ri-line-chart-line",
      description: "KPI and performance metrics",
    },
  ];

  return (
    <PageTemplate
      title="Proposals & Reports"
      description="Generate professional proposals and comprehensive reports"
      icon="ri-file-paper-2-line"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="ALL">All Types</option>
              {proposalTypes.map((pt) => (
                <option key={pt.type} value={pt.type}>
                  {pt.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="VIEWED">Viewed</option>
              <option value="ACCEPTED">Accepted</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Proposal
          </button>
        </div>

        {/* Proposal Types Grid */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create New Proposal</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposalTypes.map((pt) => (
                  <button
                    key={pt.type}
                    onClick={() => {
                      handleCreateProposal(pt.type);
                      setShowCreateModal(false);
                    }}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i
                          className={`${pt.icon} text-2xl text-blue-600 dark:text-blue-400`}
                        ></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {pt.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Proposals List */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="text-center py-4">
              <PremiumLoader message="Loading proposals..." size="md" />
            </div>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <i className="ri-file-paper-2-line text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No Proposals Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first proposal to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Proposal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {proposal.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          proposal.status === "ACCEPTED"
                            ? "bg-green-100 text-green-800"
                            : proposal.status === "SENT"
                              ? "bg-blue-100 text-blue-800"
                              : proposal.status === "VIEWED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {proposal.proposalNumber} •{" "}
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </p>
                    {proposal.executiveSummary && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {proposal.executiveSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setShowExportModal(true);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Export"
                    >
                      <i className="ri-download-line text-xl"></i>
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/transportation/proposals/${proposal.id}`)
                      }
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="View"
                    >
                      <i className="ri-eye-line text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && selectedProposal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Export Proposal</h2>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setSelectedProposal(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select export format for{" "}
                <strong>{selectedProposal.proposalNumber}</strong>
              </p>

              <div className="grid grid-cols-2 gap-4">
                {(["PDF", "WORD", "EXCEL", "HTML"] as ExportFormat[]).map(
                  (format) => (
                    <button
                      key={format}
                      onClick={() => handleExport(selectedProposal, format)}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                      <i
                        className={`ri-file-${format === "PDF" ? "pdf" : format === "WORD" ? "word" : format === "EXCEL" ? "excel" : "code"}-line text-2xl mb-2`}
                      ></i>
                      <div className="font-medium">{format}</div>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
