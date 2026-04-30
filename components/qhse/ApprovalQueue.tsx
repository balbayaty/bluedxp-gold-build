/**
 * QHSE Approval Queue Component
 * Display pending approvals for user
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiClock, FiUser, FiFileText } from "react-icons/fi";
import type { PendingApproval } from "@/lib/services/qhse/workflows/qhseApprovalWorkflowService";

interface ApprovalQueueProps {
  userId: string;
  role: string;
}

export default function ApprovalQueue({ userId, role }: ApprovalQueueProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovals();
  }, [userId, role]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/qhse/approvals?userId=${userId}&role=${role}`,
      );
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data || []);
      }
    } catch (error) {
      console.error("Error loading approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    approvalId: string,
    stepIndex: number,
    action: "APPROVE" | "REJECT",
    comments?: string,
  ) => {
    try {
      const response = await fetch("/api/qhse/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process",
          approvalId,
          stepIndex,
          action: action,
          approverId: userId,
          comments,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await loadApprovals();
      }
    } catch (error) {
      console.error("Error processing approval:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FiFileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No pending approvals</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Pending Approvals
        </h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {approvals.length} Pending
        </span>
      </div>

      {approvals.map((approval) => {
        const currentStep = approval.steps[approval.currentStep];
        if (!currentStep || currentStep.status !== "PENDING") return null;

        return (
          <motion.div
            key={approval.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FiFileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {approval.entityTitle}
                  </h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {approval.entityType}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Step {approval.currentStep + 1} of {approval.steps.length} -
                  Requires {currentStep.approverRole}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiUser className="w-4 h-4" />
                    <span>Submitted by: {approval.submittedBy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    <span>
                      {new Date(approval.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleApproval(approval.id, approval.currentStep, "APPROVE")
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleApproval(approval.id, approval.currentStep, "REJECT")
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
