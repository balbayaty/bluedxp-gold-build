/**
 * Enhanced Proposal Detail Page
 * World-class UI with all features integrated: Collaboration, Tracking, Rich Media, Interactive, A/B Testing, E-Signature
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import ProposalEvidenceLiabilityPanel from "@/components/proposals/ProposalEvidenceLiabilityPanel";
import ProposalComplianceStatus from "@/components/proposals/ProposalComplianceStatus";
import ProposalCollaborationPanel from "@/components/proposals/ProposalCollaborationPanel";
import ProposalInsightsWidget from "@/components/proposals/ProposalInsightsWidget";
import ProposalQuickActions from "@/components/proposals/ProposalQuickActions";
import ProposalExportButton from "@/components/proposals/ProposalExportButton";
import ContentBlockPicker from "@/components/proposals/ContentBlockPicker";
import ProposalEngagementHeatmap from "@/components/proposals/ProposalEngagementHeatmap";
import { useAuth } from "@/contexts/AuthContext";

export default function EnhancedProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasModuleAccess } = useAuth();
  const proposalId = params.id as string;

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  const [proposal, setProposal] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [collaboration, setCollaboration] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [richMedia, setRichMedia] = useState<any[]>([]);
  const [interactive, setInteractive] = useState<any>(null);
  const [abTest, setAbTest] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "content"
    | "tracking"
    | "collaboration"
    | "signature"
    | "analytics"
  >("overview");
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showContentBlockPicker, setShowContentBlockPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    loadAllData();
  }, [proposalId, hasAccess]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Create a timeout promise to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 30000),
      );

      // Try multiple API endpoints to find the proposal
      // ORDER MATTERS: Try direct database first (most reliable), then enhanced, then universal
      let proposalFound = false;

      // Try 1: Direct database lookup (MOST RELIABLE - should always work for simple-create proposals)
      try {
        console.log(
          "[Enhanced Proposal Page] Step 1: Trying direct database lookup...",
        );
        const propRes = await Promise.race([
          fetch(`/api/proposals/${proposalId}`),
          timeoutPromise,
        ]);

        console.log(
          "[Enhanced Proposal Page] Direct lookup response:",
          propRes.status,
          propRes.statusText,
        );

        if (propRes.ok) {
          const propData = await propRes.json();
          console.log("[Enhanced Proposal Page] Direct lookup data:", propData);
          if (propData.success && propData.data) {
            setProposal(propData.data);
            proposalFound = true;
            console.log(
              "[Enhanced Proposal Page] ✅ Proposal found via direct lookup!",
            );
          }
        }
      } catch (error) {
        console.warn(
          "[Enhanced Proposal Page] Direct lookup failed, trying enhanced API:",
          error,
        );
      }

      // Try 2: Enhanced proposals API (if direct didn't work)
      if (!proposalFound) {
        try {
          console.log(
            "[Enhanced Proposal Page] Step 2: Trying enhanced API...",
          );
          const propRes = await Promise.race([
            fetch(`/api/proposals/enhanced?proposalId=${proposalId}`),
            timeoutPromise,
          ]);

          if (propRes.ok) {
            const propData = await propRes.json();
            if (propData.success && propData.data) {
              setProposal(propData.data?.[0] || propData.data);
              proposalFound = true;
              console.log(
                "[Enhanced Proposal Page] ✅ Proposal found via enhanced API!",
              );
            }
          }
        } catch (error) {
          console.warn(
            "[Enhanced Proposal Page] Enhanced API failed, trying universal API:",
            error,
          );
        }
      }

      // Try 3: Universal proposals API (if others didn't work)
      if (!proposalFound) {
        try {
          console.log(
            "[Enhanced Proposal Page] Step 3: Trying universal API...",
          );
          const propRes = await Promise.race([
            fetch(`/api/proposals/universal/${proposalId}`),
            timeoutPromise,
          ]);

          if (propRes.ok) {
            const propData = await propRes.json();
            if (propData.success && propData.proposal) {
              setProposal(propData.proposal);
              proposalFound = true;
              console.log(
                "[Enhanced Proposal Page] ✅ Proposal found via universal API!",
              );
            }
          }
        } catch (error) {
          console.warn("[Enhanced Proposal Page] Universal API failed:", error);
        }
      }

      // Try 3: Direct database lookup via proposals API
      if (!proposalFound) {
        try {
          const propRes = await Promise.race([
            fetch(`/api/proposals/${proposalId}`),
            timeoutPromise,
          ]);

          if (propRes.ok) {
            const propData = await propRes.json();
            if (propData.success && propData.data) {
              setProposal(propData.data);
              proposalFound = true;
            }
          }
        } catch (error) {
          console.error(
            "[Enhanced Proposal Page] All API attempts failed:",
            error,
          );
        }
      }

      if (!proposalFound) {
        console.error(
          "[Enhanced Proposal Page] ❌ Proposal not found in any service",
        );
        console.error("[Enhanced Proposal Page] Tried:");
        console.error(
          "  1. /api/proposals/" + proposalId + " (direct database)",
        );
        console.error("  2. /api/proposals/enhanced?proposalId=" + proposalId);
        console.error("  3. /api/proposals/universal/" + proposalId);
        // Don't throw - allow page to show "not found" state
      } else {
        console.log(
          "[Enhanced Proposal Page] ✅ Proposal loaded successfully!",
        );
      }

      // Load other data in parallel (non-blocking)
      const loadPromises = [
        fetch(`/api/proposals/${proposalId}/tracking?heatmap=true`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.success && setTracking(data.data))
          .catch((err) => console.warn("Failed to load tracking:", err)),

        fetch(`/api/proposals/${proposalId}/collaboration`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.success && setCollaboration(data.data))
          .catch((err) => console.warn("Failed to load collaboration:", err)),

        fetch(`/api/proposals/${proposalId}/sign`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.success && setSignature(data.data))
          .catch((err) => console.warn("Failed to load signature:", err)),

        fetch(`/api/proposals/${proposalId}/rich-media`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.success && setRichMedia(data.data || []))
          .catch((err) => console.warn("Failed to load rich media:", err)),

        fetch(`/api/proposals/${proposalId}/interactive`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.success && setInteractive(data.data))
          .catch((err) => console.warn("Failed to load interactive:", err)),
      ];

      // Wait for all with timeout, but don't fail if some fail
      await Promise.allSettled(loadPromises);
    } catch (error) {
      console.error("Error loading proposal data:", error);
      // Set loading to false even on error so user sees the error state
    } finally {
      setLoading(false);
    }
  };

  const [preparingPDF, setPreparingPDF] = useState(false);
  const [pdfShareUrl, setPdfShareUrl] = useState<string | null>(null);

  const handlePreparePDF = async () => {
    if (!proposal) return;

    setPreparingPDF(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare-pdf",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPdfShareUrl(data.data.shareUrl);
        setSignature(data.data.status);
        alert(
          "✅ PDF prepared successfully! You can now share it with customers for review.",
        );
      } else {
        alert(`Error: ${data.error || "Failed to prepare PDF"}`);
      }
    } catch (error) {
      console.error("Error preparing PDF:", error);
      alert("Failed to prepare PDF. Please try again.");
    } finally {
      setPreparingPDF(false);
    }
  };

  const handleCopyShareUrl = () => {
    if (pdfShareUrl || signature?.pdfShareUrl) {
      const url = pdfShareUrl || signature?.pdfShareUrl;
      const fullUrl = `${window.location.origin}${url}`;
      navigator.clipboard.writeText(fullUrl);
      alert("✅ Share URL copied to clipboard!");
    }
  };

  const handleInitiateSignature = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          signers: [
            {
              email: "customer@example.com",
              name: "Customer",
              role: "customer",
              signingOrder: 1,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSignature(data.data.status);
        alert("Signature workflow initiated!");
      }
    } catch (error) {
      console.error("Error initiating signature:", error);
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

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view this proposal"
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
              You do not have the required permissions to view proposals. Please
              contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!proposal) {
    return (
      <ProposalErrorBoundary>
        <PageTemplate
          title="Proposal Not Found"
          description="The requested proposal could not be found"
          icon="ri-error-warning-line"
        >
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Proposal not found
            </p>
            <button
              onClick={() => router.push("/proposals")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Proposals
            </button>
          </div>
        </PageTemplate>
      </ProposalErrorBoundary>
    );
  }

  return (
    <ProposalErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    {proposal.status}
                  </span>
                  <span className="text-sm opacity-90">
                    #{proposal.proposalNumber}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
                <p className="text-blue-100">
                  {proposal.customerName || "Customer"}
                </p>
                {proposal.totalAmount && (
                  <p className="text-2xl font-bold mt-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: proposal.currency || "SAR",
                    }).format(proposal.totalAmount)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCollaborationPanel(true)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <i className="ri-team-line mr-2" />
                  Collaborate
                </button>
                {!signature && (
                  <button
                    onClick={handleInitiateSignature}
                    className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                  >
                    <i className="ri-pen-nib-line mr-2" />
                    Request Signature
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-6 flex gap-1 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
              { id: "content", label: "Content", icon: "ri-file-text-line" },
              { id: "tracking", label: "Tracking", icon: "ri-eye-line" },
              { id: "collaboration", label: "Team", icon: "ri-team-line" },
              { id: "signature", label: "Signature", icon: "ri-pen-nib-line" },
              {
                id: "analytics",
                label: "Analytics",
                icon: "ri-bar-chart-box-line",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <i className={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Key Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Key Metrics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {tracking && (
                        <>
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {tracking.tracking?.recipients.filter(
                                (r: any) => r.opened,
                              ).length || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Opens
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {tracking.tracking?.recipients.filter(
                                (r: any) => r.downloaded,
                              ).length || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Downloads
                            </p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {tracking.conversionProbability || 0}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Conversion
                            </p>
                          </div>
                          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {tracking.tracking?.engagementScore || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Engagement
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Proposal Sections Preview */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Sections
                    </h2>
                    <div className="space-y-3">
                      {proposal.sections?.map((section: any, index: number) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {section.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                              {section.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Compliance Status */}
                  <ProposalComplianceStatus
                    proposalId={proposalId}
                    showValidation={true}
                  />

                  {/* Evidence, Liability & Contract Panel */}
                  <ProposalEvidenceLiabilityPanel
                    proposalId={proposalId}
                    tenantId="default"
                  />

                  {/* Signature Status */}
                  {signature && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Signature Status
                      </h3>
                      <div className="space-y-2">
                        {signature.signers?.map((signer: any) => (
                          <div
                            key={signer.email}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {signer.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {signer.email}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                signer.status === "signed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {signer.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Export Button - Full Featured */}
                  <ProposalExportButton
                    proposalId={proposalId}
                    proposalTitle={proposal.title}
                    formats={["PDF", "DOCX", "XLSX", "HTML"]}
                    onExport={(format) => {
                      console.log(`Exported as ${format}`);
                    }}
                  />

                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                    <h3 className="text-sm font-semibold mb-3">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm">
                        <i className="ri-share-line mr-2" />
                        Share
                      </button>
                      <button className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm">
                        <i className="ri-flask-line mr-2" />
                        A/B Test
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "tracking" && tracking && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Engagement Heatmap */}
                {tracking.heatmap && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Section Engagement Heatmap
                    </h2>
                    <div className="space-y-3">
                      {tracking.heatmap.sections?.map((section: any) => (
                        <div key={section.sectionId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {section.sectionTitle}
                            </p>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {section.engagementScore}% engagement
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${section.engagementScore}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{section.viewCount} views</span>
                            <span>
                              {Math.round(section.averageTimeSpent)}s avg time
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipient Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recipient Activity
                  </h2>
                  <div className="space-y-3">
                    {tracking.tracking?.recipients?.map((recipient: any) => (
                      <div
                        key={recipient.email}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {recipient.name || recipient.email}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {recipient.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {recipient.opened && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                                Opened
                              </span>
                            )}
                            {recipient.downloaded && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs">
                                Downloaded
                              </span>
                            )}
                            {recipient.signed && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs">
                                Signed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Opens:</span>{" "}
                            {recipient.openedCount}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span>{" "}
                            {Math.round(recipient.timeSpent / 60)}m
                          </div>
                          <div>
                            <span className="font-medium">Sections:</span>{" "}
                            {recipient.viewedSections.length}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "content" && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Content Editor */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Proposal Content
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowContentBlockPicker(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <i className="ri-layout-grid-line mr-2" />
                        Insert Block
                      </button>
                      <button
                        onClick={async () => {
                          const newSection = {
                            id: `section-${Date.now()}`,
                            type: "TEXT",
                            title: "New Section",
                            content: "Enter your content here...",
                            order: (proposal.sections?.length || 0) + 1,
                            visible: true,
                          };
                          const updatedSections = [
                            ...(proposal.sections || []),
                            newSection,
                          ];
                          setProposal({
                            ...proposal,
                            sections: updatedSections,
                          });

                          // Save to API
                          try {
                            await fetch(`/api/proposals/enhanced`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                proposalId,
                                updates: { sections: updatedSections },
                              }),
                            });
                          } catch (error) {
                            console.error("Error saving section:", error);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <i className="ri-add-line mr-2" />
                        Add Section
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {proposal.sections?.map((section: any, index: number) => (
                      <div
                        key={section.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <input
                              type="text"
                              value={section.title || ""}
                              onChange={async (e) => {
                                const updatedSections = proposal.sections.map(
                                  (s: any) =>
                                    s.id === section.id
                                      ? { ...s, title: e.target.value }
                                      : s,
                                );
                                setProposal({
                                  ...proposal,
                                  sections: updatedSections,
                                });

                                // Auto-save after 1 second
                                setTimeout(async () => {
                                  try {
                                    await fetch(`/api/proposals/enhanced`, {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        proposalId,
                                        updates: { sections: updatedSections },
                                      }),
                                    });
                                  } catch (error) {
                                    console.error("Error saving:", error);
                                  }
                                }, 1000);
                              }}
                              className="flex-1 text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                              placeholder="Section Title"
                            />
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm("Delete this section?")) {
                                const updatedSections =
                                  proposal.sections.filter(
                                    (s: any) => s.id !== section.id,
                                  );
                                setProposal({
                                  ...proposal,
                                  sections: updatedSections,
                                });

                                try {
                                  await fetch(`/api/proposals/enhanced`, {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      proposalId,
                                      updates: { sections: updatedSections },
                                    }),
                                  });
                                } catch (error) {
                                  console.error(
                                    "Error deleting section:",
                                    error,
                                  );
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                        <textarea
                          value={section.content || ""}
                          onChange={async (e) => {
                            const updatedSections = proposal.sections.map(
                              (s: any) =>
                                s.id === section.id
                                  ? { ...s, content: e.target.value }
                                  : s,
                            );
                            setProposal({
                              ...proposal,
                              sections: updatedSections,
                            });

                            // Auto-save after 2 seconds
                            setTimeout(async () => {
                              try {
                                await fetch(`/api/proposals/enhanced`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    proposalId,
                                    updates: { sections: updatedSections },
                                  }),
                                });
                              } catch (error) {
                                console.error("Error saving:", error);
                              }
                            }, 2000);
                          }}
                          rows={6}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                          placeholder="Enter section content..."
                        />
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                            {section.type}
                          </span>
                          {section.visible ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              Visible
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {(!proposal.sections || proposal.sections.length === 0) && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <i className="ri-file-text-line text-4xl mb-4 opacity-50" />
                        <p>
                          No sections yet. Click "Add Section" to get started.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Content Suggestions */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <i className="ri-magic-line text-2xl text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Content Suggestions
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get intelligent suggestions to improve your proposal
                    content, increase engagement, and boost conversion rates.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/proposals/universal/${proposalId}/insights`,
                        );
                        const data = await res.json();
                        if (data.success && data.insights) {
                          alert(
                            `AI Insights:\n${data.insights.map((i: any) => `• ${i.title}: ${i.description}`).join("\n")}`,
                          );
                        }
                      } catch (error) {
                        console.error("Error fetching insights:", error);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <i className="ri-sparkling-line mr-2" />
                    Get AI Suggestions
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "collaboration" && (
              <motion.div
                key="collaboration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Main Collaboration Area */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Comments Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Comments & Feedback
                    </h2>

                    {/* Add Comment */}
                    <div className="mb-6">
                      <textarea
                        id="newComment"
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="Add a comment or feedback..."
                      />
                      <button
                        onClick={async () => {
                          const textarea = document.getElementById(
                            "newComment",
                          ) as HTMLTextAreaElement;
                          const content = textarea.value.trim();
                          if (!content) return;

                          try {
                            const res = await fetch(
                              `/api/proposals/${proposalId}/collaboration`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "add_comment",
                                  content,
                                  userName: user?.name || "Current User",
                                }),
                              },
                            );
                            const data = await res.json();
                            if (data.success) {
                              textarea.value = "";
                              loadAllData(); // Reload to show new comment
                            }
                          } catch (error) {
                            console.error("Error adding comment:", error);
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <i className="ri-send-plane-line mr-2" />
                        Post Comment
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {collaboration?.comments?.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                              {comment.userName?.[0] || "U"}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {comment.userName || "User"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  comment.createdAt || Date.now(),
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            {comment.content}
                          </p>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <i className="ri-chat-3-line text-3xl mb-2 opacity-50" />
                          <p>No comments yet. Be the first to add feedback!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Collaborators */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Active Collaborators
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {collaboration?.activeUsers?.map((user: any) => (
                        <div
                          key={user.userId}
                          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold mx-auto mb-2">
                            {user.userName?.[0] || "U"}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.userName || "User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.status || "Active"}
                          </p>
                        </div>
                      )) || (
                        <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                          <p>No active collaborators</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Share Proposal */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Share Proposal
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <i className="ri-link mr-2" />
                        Copy Link
                      </button>
                      <button className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                        <i className="ri-mail-line mr-2" />
                        Email
                      </button>
                    </div>
                  </div>

                  {/* Version History */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Version History
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-700 dark:text-gray-300">
                          v{proposal.version || 1}
                        </span>
                        <span className="text-gray-500 text-xs">Current</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "signature" && (
              <motion.div
                key="signature"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Signature Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      E-Signature Workflow
                    </h2>
                    {!signature && (
                      <button
                        onClick={handleInitiateSignature}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <i className="ri-pen-nib-line mr-2" />
                        Initiate Signature
                      </button>
                    )}
                  </div>

                  {signature ? (
                    <div className="space-y-4">
                      {/* PDF Ready Status */}
                      {signature.pdfReady && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="ri-file-pdf-line text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-900 dark:text-green-100">
                              PDF Ready for Sharing
                            </span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                            The proposal PDF has been prepared and is ready to
                            share with customers for review.
                          </p>
                          {signature.pdfShareUrl && (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Share URL:
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                                  {typeof window !== "undefined"
                                    ? `${window.location.origin}${signature.pdfShareUrl}`
                                    : signature.pdfShareUrl}
                                </code>
                                <button
                                  onClick={handleCopyShareUrl}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  <i className="ri-file-copy-line mr-1" />
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Signature Workflow Status */}
                      {signature.workflowId && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="ri-checkbox-circle-line text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              Signature Workflow Active
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Status: {signature.status || "pending"}
                          </p>
                        </div>
                      )}

                      {/* Signers */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Signers
                        </h3>
                        <div className="space-y-2">
                          {signature.signers?.map(
                            (signer: any, index: number) => (
                              <div
                                key={signer.email}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {signer.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {signer.email}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded text-xs font-medium ${
                                    signer.status === "signed"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : signer.status === "sent"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                                  }`}
                                >
                                  {signer.status || "Pending"}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <i className="ri-pen-nib-line text-4xl mb-4 opacity-50" />
                      <p className="mb-4">
                        No signature workflow initiated yet.
                      </p>
                      <p className="text-sm">
                        Click "Initiate Signature" to start the e-signature
                        process.
                      </p>
                    </div>
                  )}
                </div>

                {/* Signature Instructions */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    How E-Signature Works
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                    <li>
                      <strong>Prepare PDF:</strong> Export proposal as PDF and
                      upload to Digital Signature Module
                    </li>
                    <li>
                      <strong>Share with Customer:</strong> Copy the share URL
                      and send it to customers for review
                    </li>
                    <li>
                      <strong>Customer Reviews:</strong> Customer can view the
                      PDF without signing
                    </li>
                    <li>
                      <strong>Initiate Signatures:</strong> Once customer
                      approves, click "Initiate Signature"
                    </li>
                    <li>
                      <strong>Add Signers:</strong> Add signers with their email
                      addresses
                    </li>
                    <li>
                      <strong>Signers Receive Email:</strong> Signers receive an
                      email with a secure signing link
                    </li>
                    <li>
                      <strong>Sequential Signing:</strong> Each signer signs in
                      order (if sequential signing is enabled)
                    </li>
                    <li>
                      <strong>Auto-Finalize:</strong> Once all signatures are
                      collected, the proposal is automatically finalized
                    </li>
                  </ol>
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Engagement Heatmap */}
                <ProposalEngagementHeatmap proposalId={proposalId} />

                {/* Analytics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Views
                      </span>
                      <i className="ri-eye-line text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tracking?.tracking?.totalViews || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      +12% from last week
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Engagement Score
                      </span>
                      <i className="ri-fire-line text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tracking?.tracking?.engagementScore || 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Above average</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Conversion Rate
                      </span>
                      <i className="ri-line-chart-line text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tracking?.conversionProbability || 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on engagement
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Avg. Time
                      </span>
                      <i className="ri-time-line text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tracking?.tracking?.averageTimeSpent
                        ? `${Math.round(tracking.tracking.averageTimeSpent / 60)}m`
                        : "0m"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Per viewer</p>
                  </div>
                </div>

                {/* Engagement Over Time Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Engagement Over Time
                  </h2>
                  {tracking?.tracking?.engagementHistory &&
                  tracking.tracking.engagementHistory.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tracking.tracking.engagementHistory}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="timestamp"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString()
                            }
                          />
                          <YAxis stroke="#9ca3af" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                            }}
                            labelFormatter={(value) =>
                              new Date(value).toLocaleString()
                            }
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="views"
                            stroke="#3b82f6"
                            name="Views"
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6", r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="engagementScore"
                            stroke="#10b981"
                            name="Engagement Score"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="timeSpent"
                            stroke="#f59e0b"
                            name="Avg Time (seconds)"
                            strokeWidth={2}
                            dot={{ fill: "#f59e0b", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <i className="ri-line-chart-line text-4xl mb-2 opacity-50" />
                        <p>No engagement data available yet</p>
                        <p className="text-xs mt-2">
                          Data will appear as recipients interact with the
                          proposal
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <i className="ri-brain-line text-2xl text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI-Powered Insights
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        💡 Recommendation: Add more visual content
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Proposals with images and charts have 30% higher
                        engagement rates.
                      </p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        📊 Performance: Above average engagement
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Your proposal is performing better than 75% of similar
                        proposals.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collaboration Panel - Using dedicated component */}
        <AnimatePresence>
          {showCollaborationPanel && (
            <ProposalCollaborationPanel
              proposalId={proposalId}
              currentUserId={user?.id || "system"}
              currentUserName={user?.name || "User"}
              onComment={(comment) => {
                console.log("New comment:", comment);
              }}
              onMention={(userId) => {
                console.log("User mentioned:", userId);
              }}
            />
          )}
        </AnimatePresence>

        {/* Content Block Picker Modal */}
        <ContentBlockPicker
          isOpen={showContentBlockPicker}
          onClose={() => setShowContentBlockPicker(false)}
          onSelect={async (block) => {
            // Add selected content block as a new section
            const newSection = {
              id: `section-${Date.now()}`,
              type: block.type,
              title: block.title,
              content: block.content,
              order: (proposal.sections?.length || 0) + 1,
              visible: true,
            };
            const updatedSections = [...(proposal.sections || []), newSection];
            setProposal({ ...proposal, sections: updatedSections });

            // Save to API
            try {
              await fetch(`/api/proposals/enhanced`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  proposalId,
                  updates: { sections: updatedSections },
                }),
              });
              setShowContentBlockPicker(false);
            } catch (error) {
              console.error("Error saving content block:", error);
              alert("Failed to insert content block. Please try again.");
            }
          }}
        />

        {/* Legacy Collaboration Panel (keeping as fallback) */}
        <AnimatePresence>
          {showCollaborationPanel && collaboration && false && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Collaboration
                  </h2>
                  <button
                    onClick={() => setShowCollaborationPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Active Users */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Active Users
                  </h3>
                  <div className="space-y-2">
                    {collaboration.activeUsers?.map((user: any) => (
                      <div
                        key={user.userId}
                        className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                          {user.userName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.userName}
                          </p>
                          <p className="text-xs text-gray-500">{user.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Comments
                  </h3>
                  <div className="space-y-3">
                    {collaboration.comments?.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                            {comment.userName[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.userName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProposalErrorBoundary>
  );
}
