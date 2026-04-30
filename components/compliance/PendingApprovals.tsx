"use client";

import { motion } from "framer-motion";
import { ComplianceRecommendation } from "@/types/compliance";

interface PendingApprovalsProps {
  approvals?: ComplianceRecommendation[];
}

export default function PendingApprovals({ approvals }: PendingApprovalsProps) {
  const approvalsData = approvals || [];
  const pendingApprovals = approvalsData.filter((a) => a.status === "PENDING");

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  if (pendingApprovals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-checkbox-multiple-line text-cyan-400"></i>
          Pending Approvals
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
          </div>
          <p className="text-[#9ca3af]">No pending approvals</p>
          <p className="text-xs text-[#6b7280] mt-1">
            All items have been reviewed
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-checkbox-multiple-line text-cyan-400"></i>
        Pending Approvals
        <span className="ml-auto bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs font-medium">
          {pendingApprovals.length}
        </span>
      </h2>
      <div className="space-y-3">
        {pendingApprovals.map((approval, index) => (
          <motion.div
            key={approval.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex-1 pr-2">
                {approval.title}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${getPriorityStyles(approval.priority)}`}
              >
                {approval.priority}
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mb-3 line-clamp-2">
              {approval.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <i className="ri-bar-chart-line"></i>
                <span>
                  Confidence:{" "}
                  <span className="text-cyan-400 font-medium">
                    {approval.confidence}%
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-colors font-medium border border-green-500/30">
                  <i className="ri-check-line mr-1"></i>
                  Approve
                </button>
                <button className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors font-medium border border-red-500/30">
                  <i className="ri-close-line mr-1"></i>
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
