/**
 * Client Portal - Proposal Viewing Page
 * Customer-facing portal for viewing and interacting with proposals
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import type { Proposal } from "@/types/proposals";

export default function ClientProposalViewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    loadProposal();
    initializeTracking();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      const response = await fetch(
        `/api/proposals/enhanced?proposalId=${proposalId}`,
      );
      const data = await response.json();
      if (data.success) {
        setProposal(data.data);
        if (data.data.sections && data.data.sections.length > 0) {
          setActiveSection(data.data.sections[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeTracking = async () => {
    // Track proposal open
    try {
      await fetch(`/api/proposals/${proposalId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "open",
          recipientEmail: "client@example.com", // Would get from auth
        }),
      });
    } catch (error) {
      console.error("Error tracking open:", error);
    }
  };

  const trackSectionView = async (sectionId: string) => {
    try {
      await fetch(`/api/proposals/${proposalId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "view",
          recipientEmail: "client@example.com",
          sectionId,
          timeSpent: 5, // Would track actual time
        }),
      });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "PDF" }),
      });
      const data = await response.json();
      if (data.success && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, "_blank");

        // Track download
        await fetch(`/api/proposals/${proposalId}/tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "download",
            recipientEmail: "client@example.com",
          }),
        });
      }
    } catch (error) {
      console.error("Error downloading proposal:", error);
    }
  };

  const handleSign = async () => {
    // Would integrate with digital signature service
    router.push(`/client/proposals/${proposalId}/sign`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading proposal...
          </p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Proposal Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The proposal you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposal.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Proposal #{proposal.proposalNumber} • Valid until{" "}
                {new Date(proposal.validUntil || "").toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowComments(!showComments)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {showComments ? "Hide" : "Show"} Comments
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Download PDF
              </button>
              <button
                onClick={handleSign}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Sign Proposal
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contents
              </h2>
              <nav className="space-y-2">
                {proposal.sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      trackSectionView(section.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {index + 1}. {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Executive Summary */}
            {proposal.executiveSummary && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Executive Summary
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {proposal.executiveSummary}
                </p>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-6">
              {proposal.sections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  id={`section-${section.id}`}
                >
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    {section.title}
                  </h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pricing Summary */}
            {proposal.pricing && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Pricing Summary
                </h2>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: proposal.currency || "SAR",
                  }).format(proposal.totalAmount || 0)}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Comments
                </h2>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b border-gray-200 dark:border-gray-700 pb-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {comment.userName?.[0] || "U"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.userName}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
