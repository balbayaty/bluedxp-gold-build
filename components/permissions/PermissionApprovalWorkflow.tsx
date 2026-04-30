/**
 * ✅ PERMISSION APPROVAL WORKFLOW UI
 *
 * Beautiful approval interface:
 * - View pending approvals
 * - Approve/reject requests
 * - Approval chain visualization
 * - Comments and notes
 * - History tracking
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { permissionApprovalWorkflow } from "@/lib/services/permissions/permissionApprovalWorkflow";
import type { ApprovalRequest } from "@/lib/services/permissions/permissionApprovalWorkflow";

export default function PermissionApprovalWorkflowComponent() {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const loadRequests = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [all, pending] = await Promise.all([
        permissionApprovalWorkflow.getAllRequests(),
        permissionApprovalWorkflow.getPendingRequestsForApprover(currentUser),
      ]);
      setRequests(all);
      setPendingRequests(pending);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!currentUser) return;

    try {
      await permissionApprovalWorkflow.approveRequest(
        requestId,
        currentUser,
        comments,
      );
      setComments("");
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await permissionApprovalWorkflow.getAllRequests();
        const updatedRequest = updated.find((r) => r.id === requestId);
        if (updatedRequest) setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!currentUser) return;

    try {
      await permissionApprovalWorkflow.rejectRequest(
        requestId,
        currentUser,
        comments,
      );
      setComments("");
      await loadRequests();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-500/20 text-yellow-400",
      APPROVED: "bg-green-500/20 text-green-400",
      REJECTED: "bg-red-500/20 text-red-400",
      ESCALATED: "bg-orange-500/20 text-orange-400",
      EXPIRED: "bg-gray-500/20 text-gray-400",
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      LOW: "text-gray-400",
      MEDIUM: "text-blue-400",
      HIGH: "text-orange-400",
      CRITICAL: "text-red-400",
    };
    return colors[urgency as keyof typeof colors] || colors.MEDIUM;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl animate-spin text-cyan-400 mb-4"></i>
          <p className="text-gray-400">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-checkbox-circle-line text-cyan-400"></i>
            Permission Approval Workflow
          </h1>
          <p className="text-gray-400">
            Review and approve permission change requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pending Requests */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Pending Approvals</h2>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-inbox-line text-4xl mb-2"></i>
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedRequest?.id === request.id
                          ? "bg-cyan-500/20 border-cyan-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm">
                          {request.targetUser.name}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getUrgencyColor(request.urgency)}`}
                        >
                          {request.urgency}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {request.requestType} • {request.permissions.length}{" "}
                        permission(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle: Request Details */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-4">Request Details</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      Request Type
                    </div>
                    <div className="font-semibold">
                      {selectedRequest.requestType}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      Target User
                    </div>
                    <div className="font-semibold">
                      {selectedRequest.targetUser.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedRequest.targetUser.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      Requested By
                    </div>
                    <div className="font-semibold">
                      {selectedRequest.requestedBy.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedRequest.requestedBy.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Reason</div>
                    <div className="text-sm">{selectedRequest.reason}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">
                      Permissions
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedRequest.permissions.map((perm, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white/5 rounded text-xs font-mono"
                        >
                          {perm.moduleId}
                          {perm.featureId &&
                            ` → ${perm.featureId.split(".")[1]}`}
                          {perm.tabId && ` → ${perm.tabId.split(".").pop()}`}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">
                      Approval Chain
                    </div>
                    <div className="space-y-2">
                      {selectedRequest.approvalChain.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            step.status === "APPROVED"
                              ? "bg-green-500/20 border-green-500/30"
                              : step.status === "REJECTED"
                                ? "bg-red-500/20 border-red-500/30"
                                : idx === selectedRequest.currentStep
                                  ? "bg-cyan-500/20 border-cyan-500/30"
                                  : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-semibold">
                              Step {step.stepNumber}: {step.approverRole}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                step.status === "APPROVED"
                                  ? "bg-green-500/20 text-green-400"
                                  : step.status === "REJECTED"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                          {step.approvedBy && (
                            <div className="text-xs text-gray-400">
                              Approved by {step.approvedBy.name}
                            </div>
                          )}
                          {step.comments && (
                            <div className="text-xs text-gray-300 mt-1">
                              {step.comments}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <i className="ri-file-list-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">
                  Select a request to view details
                </p>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-1">
            {selectedRequest && selectedRequest.status === "PENDING" && (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-4">Actions</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg resize-none"
                      rows={4}
                      placeholder="Add comments..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 font-semibold flex items-center justify-center gap-2"
                    >
                      <i className="ri-check-line"></i>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-semibold flex items-center justify-center gap-2"
                    >
                      <i className="ri-close-line"></i>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* All Requests */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">All Requests</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {requests.slice(0, 10).map((request) => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRequest?.id === request.id
                        ? "bg-cyan-500/20 border-cyan-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold">
                        {request.targetUser.name}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {request.requestType} •{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
