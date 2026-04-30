/**
 * CRM Lead Detail Page
 * Comprehensive lead view with scoring, activities, and conversion
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Lead } from "@/types/crm";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "activities", label: "Activities", icon: "ri-calendar-line" },
  { id: "scoring", label: "AI Scoring", icon: "ri-brain-line" },
  { id: "timeline", label: "Timeline", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  NEW: { bg: "bg-blue-500/20", text: "text-blue-400", icon: "ri-add-circle-line" },
  CONTACTED: { bg: "bg-cyan-500/20", text: "text-cyan-400", icon: "ri-phone-line" },
  QUALIFIED: { bg: "bg-green-500/20", text: "text-green-400", icon: "ri-checkbox-circle-line" },
  CONVERTED: { bg: "bg-purple-500/20", text: "text-purple-400", icon: "ri-exchange-line" },
  LOST: { bg: "bg-red-500/20", text: "text-red-400", icon: "ri-close-circle-line" },
};

const sourceIcons: Record<string, string> = {
  WEBSITE: "ri-global-line",
  REFERRAL: "ri-share-line",
  EVENT: "ri-calendar-event-line",
  COLD_CALL: "ri-phone-line",
  SOCIAL_MEDIA: "ri-twitter-line",
  OTHER: "ri-more-line",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [converting, setConverting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  // Load lead data
  const loadLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`);
      if (!response.ok) throw new Error("Lead not found");
      const data = await response.json();
      if (data.success) {
        setLead(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // Handle conversion with confirmation
  const handleConvert = async () => {
    if (!lead || lead.status === "CONVERTED") return;
    setConverting(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess("Lead Converted!", `${lead.firstName} ${lead.lastName} is now an opportunity`);
          setTimeout(() => {
            router.push(`/crm/opportunities/${data.data.opportunityId}`);
          }, 1500);
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error("Conversion failed");
      }
    } catch (err) {
      showError("Conversion Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setConverting(false);
      setShowConvertDialog(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showSuccess("Lead Deleted", "The lead has been removed");
        setTimeout(() => {
          router.push("/crm/leads");
        }, 1500);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      showError("Delete Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Score color helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-lime-400";
    if (score >= 40) return "text-yellow-400";
    if (score >= 20) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-lime-500 to-green-500";
    if (score >= 40) return "from-yellow-500 to-lime-500";
    if (score >= 20) return "from-orange-500 to-yellow-500";
    return "from-red-500 to-orange-500";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading lead...</p>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Lead Not Found"
          message={error || "The requested lead could not be found"}
          onRetry={loadLead}
          onBack={() => router.push("/crm/leads")}
          icon="ri-user-unfollow-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[lead.status] || statusConfig.NEW;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Convert Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        onConfirm={handleConvert}
        title="Convert to Opportunity"
        message={`Are you sure you want to convert "${lead.firstName} ${lead.lastName}" to an opportunity? This will create a new opportunity record.`}
        confirmLabel="Convert"
        variant="info"
        loading={converting}
        icon="ri-exchange-line"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${lead.firstName} ${lead.lastName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/crm/leads" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back to leads">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-purple-500/30">
                {lead.firstName[0]}{lead.lastName[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{lead.firstName} {lead.lastName}</h1>
                <div className="flex items-center gap-4 mt-2">
                  {lead.title && <span className="text-gray-400">{lead.title}</span>}
                  {lead.company && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400">{lead.company}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
                    <i className={statusStyle.icon}></i>
                    {lead.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-gray-300 flex items-center gap-1">
                    <i className={sourceIcons[lead.source]}></i>
                    {lead.source.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all text-gray-400 hover:text-red-400"
                aria-label="Delete lead"
              >
                <i className="ri-delete-bin-line text-lg"></i>
              </button>
              <Link
                href={`/crm/leads/${leadId}/edit`}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
              >
                <i className="ri-edit-line"></i>
                Edit
              </Link>
              {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
                <button
                  onClick={() => setShowConvertDialog(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  <i className="ri-exchange-line"></i>
                  Convert to Opportunity
                </button>
              )}
            </div>
          </div>

          {/* Score Badge */}
          <div className="absolute top-8 right-8">
            <div className="relative group cursor-help">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreGradient(lead.score)} p-1`}>
                <div className="w-full h-full rounded-full bg-gray-900 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                  <span className="text-xs text-gray-400">AI Score</span>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-center whitespace-nowrap">
                  {lead.score >= 80 ? "Hot Lead - High conversion probability" : 
                   lead.score >= 60 ? "Warm Lead - Good potential" : 
                   lead.score >= 40 ? "Lukewarm - Needs nurturing" : 
                   "Cold Lead - More engagement needed"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1" role="tablist" aria-label="Lead details tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="panel-overview"
              role="tabpanel"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="ri-user-line text-purple-400"></i>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <a href={`mailto:${lead.email}`} className="block mt-1 text-purple-400 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Phone</label>
                      <a href={`tel:${lead.phone}`} className="block mt-1 text-white">
                        {lead.phone || "-"}
                      </a>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Company</label>
                      <p className="mt-1 text-white">{lead.company || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Title</label>
                      <p className="mt-1 text-white">{lead.title || "-"}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="ri-file-text-line text-purple-400"></i>
                    Notes
                  </h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{lead.notes || "No notes added yet."}</p>
                </motion.div>

                {lead.tags && lead.tags.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <i className="ri-price-tag-3-line text-purple-400"></i>
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="ri-information-line text-purple-400"></i>
                    Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Assigned To</label>
                      <p className="mt-1 text-white">{lead.assignedTo || "Unassigned"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Created</label>
                      <p className="mt-1 text-white">{new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Updated</label>
                      <p className="mt-1 text-white">{new Date(lead.updatedAt).toLocaleDateString()}</p>
                    </div>
                    {lead.convertedAt && (
                      <div>
                        <label className="text-sm text-gray-400">Converted</label>
                        <p className="mt-1 text-green-400">{new Date(lead.convertedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="ri-speed-line text-purple-400"></i>
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <a 
                      href={`mailto:${lead.email}`} 
                      onClick={() => showInfo("Email", `Opening email to ${lead.email}`)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="ri-mail-line"></i>
                      Send Email
                    </a>
                    <a 
                      href={`tel:${lead.phone}`} 
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="ri-phone-line"></i>
                      Call
                    </a>
                    <button 
                      onClick={() => showInfo("Coming Soon", "Meeting scheduling will be available soon")}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="ri-calendar-line"></i>
                      Schedule Meeting
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "scoring" && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="panel-scoring"
              role="tabpanel"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <i className="ri-brain-line text-purple-400"></i>
                  AI Lead Score Analysis
                </h3>
                <div className="flex items-center justify-center mb-8">
                  <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${getScoreGradient(lead.score)} p-1.5`}>
                    <div className="w-full h-full rounded-full bg-gray-900 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                      <span className="text-sm text-gray-400 mt-1">out of 100</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-medium ${getScoreColor(lead.score)}`}>
                    {lead.score >= 80 ? "Hot Lead 🔥" : lead.score >= 60 ? "Warm Lead" : lead.score >= 40 ? "Lukewarm" : "Cold Lead"}
                  </p>
                  <p className="text-gray-400 mt-1">
                    {lead.score >= 80 ? "High probability of conversion" : lead.score >= 60 ? "Good potential, needs nurturing" : lead.score >= 40 ? "Moderate interest shown" : "Requires more engagement"}
                  </p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <i className="ri-bar-chart-grouped-line text-purple-400"></i>
                  Score Factors
                </h3>
                <div className="space-y-4">
                  {lead.scoreFactors && lead.scoreFactors.length > 0 ? (
                    lead.scoreFactors.map((factor, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300">{factor.factor}</span>
                          <span className={`text-sm font-medium ${factor.impact > 0 ? "text-green-400" : "text-red-400"}`}>
                            {factor.impact > 0 ? "+" : ""}{factor.impact}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${factor.impact > 0 ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${Math.abs(factor.impact)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <i className="ri-bar-chart-line text-4xl mb-2"></i>
                      <p>Score factors not yet analyzed</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "activities" && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="panel-activities"
              role="tabpanel"
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-calendar-line text-purple-400"></i>
                  Activities
                </h3>
                <button 
                  onClick={() => showInfo("Coming Soon", "Activity logging will be available soon")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  Log Activity
                </button>
              </div>
              <div className="text-center py-12 text-gray-400">
                <i className="ri-calendar-todo-line text-5xl mb-4"></i>
                <p>No activities logged yet</p>
                <p className="text-sm mt-1">Start by logging a call, email, or meeting</p>
              </div>
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="panel-timeline"
              role="tabpanel"
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="ri-time-line text-purple-400"></i>
                Lead Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
                <div className="space-y-6">
                  <div className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-purple-500 border-2 border-gray-900"></div>
                    <div>
                      <p className="font-medium text-white">Lead Created</p>
                      <p className="text-sm text-gray-400">{new Date(lead.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-500 mt-1">Source: {lead.source.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  {lead.status !== "NEW" && (
                    <div className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-cyan-500 border-2 border-gray-900"></div>
                      <div>
                        <p className="font-medium text-white">Status: {lead.status}</p>
                        <p className="text-sm text-gray-400">{new Date(lead.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {lead.convertedAt && (
                    <div className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-900"></div>
                      <div>
                        <p className="font-medium text-green-400">Converted to Opportunity</p>
                        <p className="text-sm text-gray-400">{new Date(lead.convertedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
