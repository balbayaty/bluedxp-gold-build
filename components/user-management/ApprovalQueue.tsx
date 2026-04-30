/**
 * 📋 APPROVAL QUEUE COMPONENT
 * 
 * Manager approval queue for:
 * - Access requests
 * - Permission changes
 * - Role upgrades
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccessRequest } from "@/lib/services/auth/accessRequestService";
import { formatDistanceToNow } from "date-fns";
import Modal from "@/components/ui/Modal";

interface ApprovalQueueProps {
  approverId?: string;
}

const getUrgencyConfig = (urgency: string) => {
  switch (urgency) {
    case "high":
      return { color: "bg-red-500", textColor: "text-red-400", borderColor: "border-red-500/30" };
    case "medium":
      return { color: "bg-yellow-500", textColor: "text-yellow-400", borderColor: "border-yellow-500/30" };
    default:
      return { color: "bg-green-500", textColor: "text-green-400", borderColor: "border-green-500/30" };
  }
};

const getTypeIcon = (type: string): string => {
  switch (type) {
    case "permission":
      return "ri-key-line";
    case "module":
      return "ri-apps-line";
    case "api_key":
      return "ri-code-s-slash-line";
    case "role":
      return "ri-user-star-line";
    default:
      return "ri-question-line";
  }
};

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ approverId }) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending requests
  useEffect(() => {
    fetchRequests();
  }, [approverId]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/access-requests/pending");
      
      if (response.ok) {
        const result = await response.json();
        setRequests(result.data || []);
      } else {
        // API not available - show empty state
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch access requests:", error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Mock requests removed - component now uses real API from /api/access-requests/pending

  // Process request
  const handleProcess = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/access-requests/${selectedRequest.id}/${actionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
        setSelectedRequest(null);
        setActionType(null);
        setComments("");
      }
    } catch (error) {
      console.error("Failed to process request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10"></div>
              <div className="flex-1">
                <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-64 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <i className="ri-inbox-line text-xl text-white"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pending Approvals</h3>
            <p className="text-xs text-[#9ca3af]">
              {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting review
            </p>
          </div>
        </div>

        <button
          onClick={fetchRequests}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
        >
          <i className="ri-refresh-line mr-1"></i>
          Refresh
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        <AnimatePresence>
          {requests.map((request, index) => {
            const urgencyConfig = getUrgencyConfig(request.urgency);

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <i className={`${getTypeIcon(request.type)} text-2xl text-purple-400`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{request.requesterName}</span>
                      <span className="text-[#6b7280]">•</span>
                      <span className="text-xs text-[#9ca3af]">{request.requesterEmail}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${urgencyConfig.textColor} ${urgencyConfig.color}/20 capitalize`}
                      >
                        {request.urgency}
                      </span>
                    </div>

                    <p className="text-sm text-white mb-2">
                      Requesting{" "}
                      <span className="text-cyan-400 capitalize">
                        {request.type === "permission"
                          ? `${request.requestedItem.actions?.join(", ")} access to ${request.requestedItem.moduleId}`
                          : request.type === "module"
                          ? `full access to ${request.requestedItem.moduleId}`
                          : request.type === "api_key"
                          ? "API key"
                          : request.type}
                      </span>
                    </p>

                    <p className="text-xs text-[#9ca3af] line-clamp-2 mb-2">
                      {request.justification}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <i className="ri-time-line"></i>
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setActionType("reject");
                      }}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <i className="ri-close-line mr-1"></i>
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setActionType("approve");
                      }}
                      className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      <i className="ri-check-line mr-1"></i>
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
            <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-sm text-[#9ca3af]">
            No pending access requests to review
          </p>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={!!selectedRequest && !!actionType}
        onClose={() => {
          setSelectedRequest(null);
          setActionType(null);
          setComments("");
        }}
        title={actionType === "approve" ? "Approve Request" : "Reject Request"}
        size="sm"
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Request Summary */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <i className={`${getTypeIcon(selectedRequest.type)} text-xl text-purple-400`}></i>
                </div>
                <div>
                  <div className="text-white font-medium">{selectedRequest.requesterName}</div>
                  <div className="text-xs text-[#9ca3af]">{selectedRequest.requesterEmail}</div>
                </div>
              </div>
              <p className="text-sm text-[#9ca3af]">{selectedRequest.justification}</p>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Comments (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Any notes for the requester..."
                    : "Reason for rejection..."
                }
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setComments("");
                }}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  actionType === "approve"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {isProcessing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Processing...
                  </>
                ) : actionType === "approve" ? (
                  <>
                    <i className="ri-check-line"></i>
                    Approve
                  </>
                ) : (
                  <>
                    <i className="ri-close-line"></i>
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalQueue;
