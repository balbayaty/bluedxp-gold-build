/**
 * CRM Opportunity Detail Page
 * Sales pipeline opportunity with full details
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Opportunity } from "@/types/crm";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const STAGES = [
  { id: "DISCOVERY", label: "Discovery", color: "from-blue-500 to-cyan-500", probability: 10 },
  { id: "QUALIFICATION", label: "Qualification", color: "from-cyan-500 to-teal-500", probability: 25 },
  { id: "PROPOSAL", label: "Proposal", color: "from-teal-500 to-green-500", probability: 50 },
  { id: "NEGOTIATION", label: "Negotiation", color: "from-green-500 to-lime-500", probability: 75 },
  { id: "CLOSED_WON", label: "Closed Won", color: "from-lime-500 to-emerald-500", probability: 100 },
  { id: "CLOSED_LOST", label: "Closed Lost", color: "from-gray-500 to-gray-600", probability: 0 },
];

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "activities", label: "Activities", icon: "ri-calendar-line" },
  { id: "quotes", label: "Quotes", icon: "ri-file-list-3-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;
  
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showWonDialog, setShowWonDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  const loadOpportunity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/opportunities/${opportunityId}`);
      if (!response.ok) throw new Error("Opportunity not found");
      const data = await response.json();
      if (data.success) {
        setOpportunity(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    loadOpportunity();
  }, [loadOpportunity]);

  const updateStage = async (newStage: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/crm/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (response.ok) {
        const stageLabel = STAGES.find(s => s.id === newStage)?.label || newStage;
        showSuccess("Stage Updated", `Opportunity moved to ${stageLabel}`);
        loadOpportunity();
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      showError("Update Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowWonDialog(false);
      setShowLostDialog(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/crm/opportunities/${opportunityId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showSuccess("Opportunity Deleted", "The opportunity has been removed");
        setTimeout(() => router.push("/crm/opportunities"), 1500);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      showError("Delete Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Opportunity Not Found"
          message={error || "The requested opportunity could not be found"}
          onRetry={loadOpportunity}
          onBack={() => router.push("/crm/opportunities")}
          icon="ri-funds-line"
        />
      </div>
    );
  }

  const currentStage = STAGES.find(s => s.id === opportunity.stage) || STAGES[0];
  const weightedValue = (opportunity.value * opportunity.probability) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Mark Won Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showWonDialog}
        onClose={() => setShowWonDialog(false)}
        onConfirm={() => updateStage("CLOSED_WON")}
        title="Mark as Won"
        message={`Mark "${opportunity.name}" as won? This will close the opportunity with a 100% probability.`}
        confirmLabel="Mark Won"
        variant="info"
        loading={processing}
        icon="ri-trophy-line"
      />

      {/* Mark Lost Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLostDialog}
        onClose={() => setShowLostDialog(false)}
        onConfirm={() => updateStage("CLOSED_LOST")}
        title="Mark as Lost"
        message={`Mark "${opportunity.name}" as lost? This will close the opportunity.`}
        confirmLabel="Mark Lost"
        variant="warning"
        loading={processing}
        icon="ri-close-circle-line"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={processing}
      />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${currentStage.color} opacity-10`}></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/crm/opportunities" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{opportunity.name}</h1>
                <p className="text-gray-400 mt-1">{opportunity.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${currentStage.color} text-white`}>
                    {currentStage.label}
                  </span>
                  <span className="text-gray-400">
                    <i className="ri-percent-line mr-1"></i>
                    {opportunity.probability}% probability
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all text-gray-400 hover:text-red-400"
                aria-label="Delete opportunity"
              >
                <i className="ri-delete-bin-line text-lg"></i>
              </button>
              <Link href={`/crm/opportunities/${opportunityId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors">
                <i className="ri-edit-line"></i>Edit
              </Link>
              {opportunity.stage !== "CLOSED_WON" && opportunity.stage !== "CLOSED_LOST" && (
                <>
                  <button
                    onClick={() => setShowLostDialog(true)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-red-500/20 rounded-xl flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <i className="ri-close-circle-line"></i>Lost
                  </button>
                  <button
                    onClick={() => setShowWonDialog(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2 transition-all"
                  >
                    <i className="ri-trophy-line"></i>Mark Won
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Deal Value</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(opportunity.value, opportunity.currency)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Weighted Value</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">{formatCurrency(weightedValue, opportunity.currency)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Expected Close</p>
              <p className="text-3xl font-bold mt-1">{new Date(opportunity.expectedCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            </div>
          </div>

          {/* Pipeline Stages */}
          <div className="mt-8">
            <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
              {STAGES.filter(s => s.id !== "CLOSED_LOST").map((stage, i) => {
                const isActive = opportunity.stage === stage.id;
                const isPast = STAGES.findIndex(s => s.id === opportunity.stage) > i;
                return (
                  <button
                    key={stage.id}
                    onClick={() => stage.id !== "CLOSED_WON" && updateStage(stage.id)}
                    disabled={opportunity.stage === "CLOSED_WON" || opportunity.stage === "CLOSED_LOST"}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${stage.color} text-white shadow-lg`
                        : isPast
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <i className={tab.icon}></i>{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="ri-information-line text-emerald-400"></i>
                  Opportunity Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-400">Source</label>
                    <p className="mt-1">{opportunity.source}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Competitor</label>
                    <p className="mt-1">{opportunity.competitor || "None identified"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Owner</label>
                    <p className="mt-1">{opportunity.ownerId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Created</label>
                    <p className="mt-1">{new Date(opportunity.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {opportunity.notes && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <label className="text-sm text-gray-400">Notes</label>
                    <p className="mt-1 text-gray-300">{opportunity.notes}</p>
                  </div>
                )}
              </motion.div>

              {opportunity.tags && opportunity.tags.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href={`/proposals/universal/new?opportunityId=${opportunityId}`} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                    <i className="ri-file-paper-2-line"></i>Create Proposal
                  </Link>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2">
                    <i className="ri-calendar-line"></i>Schedule Meeting
                  </button>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2">
                    <i className="ri-mail-line"></i>Send Email
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Related</h3>
                <div className="space-y-3">
                  {opportunity.accountId && (
                    <Link href={`/crm/accounts/${opportunity.accountId}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <i className="ri-building-line text-blue-400"></i>
                      <span>View Account</span>
                    </Link>
                  )}
                  {opportunity.leadId && (
                    <Link href={`/crm/leads/${opportunity.leadId}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <i className="ri-user-line text-purple-400"></i>
                      <span>View Lead</span>
                    </Link>
                  )}
                  {opportunity.sourceId && opportunity.source === "RFQ" && (
                    <Link href={`/proposals/rfq/${opportunity.sourceId}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <i className="ri-file-list-3-line text-orange-400"></i>
                      <span>View RFQ</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Activities</h3>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>Log Activity
              </button>
            </div>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-calendar-todo-line text-5xl mb-4"></i>
              <p>No activities logged yet</p>
            </div>
          </motion.div>
        )}

        {activeTab === "quotes" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Quotes & Proposals</h3>
              <Link href={`/proposals/universal/new?opportunityId=${opportunityId}`} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>Create Proposal
              </Link>
            </div>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-file-paper-2-line text-5xl mb-4"></i>
              <p>No quotes or proposals created yet</p>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Stage History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Opportunity Created</p>
                    <p className="text-sm text-gray-400">{new Date(opportunity.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-10">
                  <div className={`absolute left-2 w-5 h-5 rounded-full bg-gradient-to-r ${currentStage.color} border-2 border-gray-900`}></div>
                  <div>
                    <p className="font-medium">Current: {currentStage.label}</p>
                    <p className="text-sm text-gray-400">{new Date(opportunity.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                {opportunity.closedAt && (
                  <div className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-gray-500 border-2 border-gray-900"></div>
                    <div>
                      <p className="font-medium">Closed</p>
                      <p className="text-sm text-gray-400">{new Date(opportunity.closedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
