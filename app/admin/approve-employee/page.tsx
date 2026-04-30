/**
 * ✅ ADMIN EMPLOYEE APPROVAL PAGE
 * 
 * Beautiful admin dashboard for approving employee requests
 * Inspired by Slack, Microsoft Teams, GitHub
 * 
 * Features:
 * - Pending approvals list
 * - Quick approve/reject
 * - Employee details
 * - Company subscription linking
 * - Real-time updates
 * 
 * BlueDXP Platform - Enterprise Employee Onboarding
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckLine,
  RiCloseLine,
  RiUserAddLine,
  RiMailLine,
  RiBuildingLine,
  RiTimeLine,
  RiAlertLine,
  RiArrowRightLine,
  RiRefreshLine,
} from "react-icons/ri";
import { format } from "date-fns";

interface PendingApproval {
  id: string;
  email: string;
  name?: string;
  role: string;
  department?: string;
  jobTitle?: string;
  status: string;
  createdAt: string;
  companySubscriptionId?: string;
}

export default function ApproveEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees/pending-approvals");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApprovals(data.data);
        }
      }
    } catch (err) {
      console.error("Error loading approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invitationId: string) => {
    try {
      setProcessing(invitationId);
      setError("");

      const res = await fetch("/api/employees/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remove from list
        setApprovals((prev) => prev.filter((a) => a.id !== invitationId));
        // Reload to get updated list
        await loadPendingApprovals();
      } else {
        setError(data.error || "Failed to approve invitation");
      }
    } catch (err) {
      setError("Failed to approve invitation");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (invitationId: string, reason?: string) => {
    if (!confirm("Are you sure you want to reject this invitation?")) {
      return;
    }

    try {
      setProcessing(invitationId);
      setError("");

      const res = await fetch("/api/employees/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, reason }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remove from list
        setApprovals((prev) => prev.filter((a) => a.id !== invitationId));
        // Reload
        await loadPendingApprovals();
      } else {
        setError(data.error || "Failed to reject invitation");
      }
    } catch (err) {
      setError("Failed to reject invitation");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl"
        >
          Loading pending approvals...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <RiUserAddLine className="text-[#05a4ff]" />
                Employee Approvals
              </h1>
              <p className="text-gray-400">
                Review and approve employee invitations
              </p>
            </div>
            <button
              onClick={loadPendingApprovals}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <RiRefreshLine />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-white">{approvals.length}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">This Week</div>
              <div className="text-2xl font-bold text-white">
                {approvals.filter((a) => {
                  const created = new Date(a.createdAt);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return created > weekAgo;
                }).length}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-2xl font-bold text-green-400">Active</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2"
          >
            <RiAlertLine />
            {error}
          </motion.div>
        )}

        {/* Approvals List */}
        {approvals.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <RiUserAddLine className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Pending Approvals</h3>
            <p className="text-gray-400">All employee invitations have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#05a4ff] to-[#00d4a8] rounded-full flex items-center justify-center text-white font-bold">
                        {approval.name?.[0]?.toUpperCase() || approval.email[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {approval.name || "New Employee"}
                        </h3>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <RiMailLine />
                          {approval.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Role</div>
                        <div className="text-sm text-white capitalize">{approval.role}</div>
                      </div>
                      {approval.department && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Department</div>
                          <div className="text-sm text-white">{approval.department}</div>
                        </div>
                      )}
                      {approval.jobTitle && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Job Title</div>
                          <div className="text-sm text-white">{approval.jobTitle}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Requested</div>
                        <div className="text-sm text-white flex items-center gap-1">
                          <RiTimeLine />
                          {format(new Date(approval.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    <button
                      onClick={() => handleReject(approval.id)}
                      disabled={processing === approval.id}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <RiCloseLine />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(approval.id)}
                      disabled={processing === approval.id}
                      className="px-4 py-2 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processing === approval.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RiCheckLine />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
