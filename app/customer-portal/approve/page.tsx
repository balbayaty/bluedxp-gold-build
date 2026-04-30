"use client";

/**
 * Customer Portal Approval Page
 * Secure token-based approval interface for customers
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CustomerApprovalRequest,
  ApprovalLinkItem,
  CustomerApprovalResponse,
} from "@/types/msdsSkuLinking";

export default function CustomerApprovalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvalRequest, setApprovalRequest] =
    useState<CustomerApprovalRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkDecisions, setLinkDecisions] = useState<
    Record<string, "APPROVE" | "REJECT">
  >({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [success, setSuccess] = useState(false);

  // Load approval request
  useEffect(() => {
    if (!token) {
      setError("Approval token is required");
      setLoading(false);
      return;
    }

    const loadApprovalRequest = async () => {
      try {
        const response = await fetch(
          `/api/customer-portal/approve?token=${token}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load approval request");
          setLoading(false);
          return;
        }

        if (data.data) {
          setApprovalRequest(data.data);

          // Initialize decisions (default to approve)
          const initialDecisions: Record<string, "APPROVE" | "REJECT"> = {};
          data.data.links.forEach((link: ApprovalLinkItem) => {
            initialDecisions[link.linkId] = "APPROVE";
          });
          setLinkDecisions(initialDecisions);
        }
      } catch (err) {
        setError("Failed to load approval request");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadApprovalRequest();
  }, [token]);

  // Handle approval submission
  const handleSubmit = async (action: "APPROVE" | "REJECT") => {
    if (!approvalRequest || !token) return;

    setSubmitting(true);
    setError(null);

    try {
      const links = approvalRequest.links.map((link) => ({
        linkId: link.linkId,
        action: linkDecisions[link.linkId] || action,
        notes: notes[link.linkId] || undefined,
      }));

      const response = await fetch("/api/customer-portal/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          action,
          links,
          notes: generalNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process approval");
        setSubmitting(false);
        return;
      }

      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/customer-portal/approval-success");
      }, 3000);
    } catch (err) {
      setError("Failed to submit approval");
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading approval request...
          </p>
        </div>
      </div>
    );
  }

  if (error && !approvalRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Approval Submitted
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Thank you for your response. Redirecting...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!approvalRequest) return null;

  const isExpired = new Date(approvalRequest.expiresAt) < new Date();
  const isProcessed = approvalRequest.status !== "PENDING";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              MSDS-SKU Link Approval
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please review and approve the following MSDS-SKU links
            </p>
          </div>

          {/* Status Alerts */}
          {isExpired && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                ⚠️ This approval request has expired.
              </p>
            </div>
          )}

          {isProcessed && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">
                This approval request has already been{" "}
                {approvalRequest.status.toLowerCase()}.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Links List */}
          <div className="space-y-4 mb-8">
            {approvalRequest.links.map((link, index) => (
              <motion.div
                key={link.linkId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Link #{index + 1}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          MSDS:
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {link.msdsName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          SKU:
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {link.skuCode} - {link.skuDescription}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Confidence:
                        </span>{" "}
                        <span
                          className={`font-semibold ${
                            link.confidenceScore >= 80
                              ? "text-green-600"
                              : link.confidenceScore >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {link.confidenceScore}%
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Strategy:
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {link.matchingStrategy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decision Buttons */}
                {!isExpired && !isProcessed && (
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() =>
                        setLinkDecisions({
                          ...linkDecisions,
                          [link.linkId]: "APPROVE",
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg transition ${
                        linkDecisions[link.linkId] === "APPROVE"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() =>
                        setLinkDecisions({
                          ...linkDecisions,
                          [link.linkId]: "REJECT",
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg transition ${
                        linkDecisions[link.linkId] === "REJECT"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      }`}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {/* Notes */}
                {!isExpired && !isProcessed && (
                  <textarea
                    placeholder="Add notes for this link (optional)"
                    value={notes[link.linkId] || ""}
                    onChange={(e) =>
                      setNotes({ ...notes, [link.linkId]: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    rows={2}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* General Notes */}
          {!isExpired && !isProcessed && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Notes (optional)
              </label>
              <textarea
                placeholder="Add any general notes or comments..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          {!isExpired && !isProcessed && (
            <div className="flex gap-4">
              <button
                onClick={() => handleSubmit("APPROVE")}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Approval"}
              </button>
              <button
                onClick={() => handleSubmit("REJECT")}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Rejection"}
              </button>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <p>Request ID: {approvalRequest.id}</p>
            <p>
              Expires: {new Date(approvalRequest.expiresAt).toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
