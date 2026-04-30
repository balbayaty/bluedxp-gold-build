/**
 * Client Portal - Proposal PDF Viewer
 * Beautiful PDF viewer for customers to review proposals before signing
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function ClientProposalPDFViewer() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = params.id as string;
  const token = searchParams.get("token");

  const [proposal, setProposal] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProposal();
  }, [proposalId, token]);

  const loadProposal = async () => {
    try {
      // Verify token if provided
      if (token) {
        // In production, verify token with backend
        // For now, just check if token exists
      }

      // Load proposal
      const res = await fetch(
        `/api/proposals/enhanced?proposalId=${proposalId}`,
      );
      const data = await res.json();

      if (data.success) {
        const proposalData = data.data?.[0] || data.data;
        setProposal(proposalData);

        // Get PDF share URL
        const pdfRes = await fetch(`/api/proposals/${proposalId}/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-pdf-share-url",
          }),
        });

        const pdfData = await pdfRes.json();
        if (pdfData.success && pdfData.data.shareUrl) {
          // In production, this would be a direct PDF download URL
          // For now, we'll use the export endpoint
          setPdfUrl(`/api/proposals/${proposalId}/export`);
        } else {
          // Fallback: try to export PDF on the fly
          setPdfUrl(`/api/proposals/${proposalId}/export`);
        }
      } else {
        setError("Proposal not found");
      }
    } catch (err) {
      console.error("Error loading proposal:", err);
      setError("Failed to load proposal");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading proposal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Proposal Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error || "The proposal you're looking for doesn't exist."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposal.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Proposal #{proposal.proposalNumber || proposalId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <i className="ri-download-line" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          {pdfUrl ? (
            <div className="w-full" style={{ height: "calc(100vh - 200px)" }}>
              <iframe
                src={`${pdfUrl}?format=PDF`}
                className="w-full h-full border-0"
                title="Proposal PDF"
              />
            </div>
          ) : (
            <div className="p-12 text-center">
              <i className="ri-file-pdf-line text-6xl text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                PDF is being prepared...
              </p>
              <button
                onClick={handleDownloadPDF}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Download
              </button>
            </div>
          )}
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6"
        >
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-2xl text-blue-600 dark:text-blue-400 mt-1" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Review Mode
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                You are viewing this proposal for review. Once you're ready to
                proceed, the proposal owner will initiate the signature process.
                You'll receive an email notification when it's time to sign.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
