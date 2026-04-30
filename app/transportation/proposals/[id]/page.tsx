/**
 * Proposal Detail Page
 *
 * View and manage individual proposal
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import type { Proposal, ExportFormat } from "@/types/proposals";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProposal(params.id as string);
    }
  }, [params.id]);

  const loadProposal = async (id: string) => {
    try {
      const response = await apiFetch(`/api/transportation/proposals/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to load proposal (${response.status})`);
      }
      const data = (await response.json()) as Proposal;
      setProposal(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading proposal", err, {
        module: "transportation",
        service: "proposals",
        proposalId: id,
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "proposals",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!proposal) return;

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
        proposalId: proposal.id,
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "proposals",
      });
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Loading..."
        description=""
        icon="ri-file-paper-2-line"
      >
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageTemplate>
    );
  }

  if (!proposal) {
    return (
      <PageTemplate
        title="Proposal Not Found"
        description=""
        icon="ri-file-paper-2-line"
      >
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Proposal not found</p>
          <button
            onClick={() => router.push("/transportation/proposals")}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Proposals
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={proposal.title}
      description={proposal.proposalNumber}
      icon="ri-file-paper-2-line"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
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
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Version {proposal.version} • Created{" "}
              {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <i className="ri-download-line"></i>
              Export
            </button>
            <button
              onClick={() => router.push("/transportation/proposals")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        {proposal.executiveSummary && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Executive Summary
            </h3>
            <p className="text-blue-800 dark:text-blue-200">
              {proposal.executiveSummary}
            </p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {proposal.sections
            .filter((s) => s.visible)
            .map((section) => (
              <div
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                {section.title && (
                  <h3 className="text-xl font-semibold mb-4">
                    {section.title}
                  </h3>
                )}

                {section.type === "TEXT" && section.content && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line">{section.content}</p>
                  </div>
                )}

                {section.type === "TABLE" && section.data && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {section.data.headers?.map(
                            (header: string, idx: number) => (
                              <th
                                key={idx}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {section.data.rows?.map(
                          (row: any[], rowIdx: number) => (
                            <tr key={rowIdx}>
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.type === "PRICING" && section.data && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Description
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {section.data.items?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                              {item.unitPrice} {section.data.currency || "SAR"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                              {(item.quantity || 1) * (item.unitPrice || 0)}{" "}
                              {section.data.currency || "SAR"}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 text-right"
                          >
                            TOTAL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                            {section.data.total}{" "}
                            {section.data.currency || "SAR"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Recipients */}
        {proposal.recipients.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recipients</h3>
            <div className="space-y-2">
              {proposal.recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {recipient.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {recipient.viewed && (
                      <span className="text-xs text-green-600">Viewed</span>
                    )}
                    {recipient.accepted && (
                      <span className="text-xs text-blue-600">Accepted</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Export Proposal</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(["PDF", "WORD", "EXCEL", "HTML"] as ExportFormat[]).map(
                  (format) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
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
