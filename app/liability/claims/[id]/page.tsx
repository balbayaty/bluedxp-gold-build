/**
 * Individual Claim Detail Page
 * View detailed information about a specific insurance claim
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  // Mock data - in real app, fetch from API
  const claim = {
    id: claimId,
    claimNumber: `CL-2025-${String(claimId).padStart(3, "0")}`,
    assessment: `LI-2025-${String(claimId).padStart(3, "0")}`,
    amount: [1250, 2300, 1800, 3200][Number(claimId) - 1] || 1250,
    status:
      ["submitted", "approved", "pending", "rejected"][Number(claimId) - 1] ||
      "submitted",
    provider: "Insurance Provider A",
    policyNumber: `POL-${String(claimId).padStart(6, "0")}`,
    date: "2025-01-15",
    description: "Damage claim for warehouse handling incident",
  };

  return (
    <PageTemplate
      title={`📄 Claim ${claim.claimNumber}`}
      description="Detailed insurance claim information"
      icon="ri-file-paper-line"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-white transition-all flex items-center gap-2"
            >
              <i className="ri-download-line"></i>
              Export
            </motion.button>
          </div>
        </div>

        {/* Claim Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Claim Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm mb-1">Claim Number</p>
                <p className="text-white font-semibold">{claim.claimNumber}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Assessment</p>
                <p className="text-white font-semibold">{claim.assessment}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    claim.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : claim.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : claim.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {claim.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Financial Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm mb-1">Claim Amount</p>
                <p className="text-green-400 font-bold text-2xl">
                  AED {claim.amount}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Date Submitted</p>
                <p className="text-white/70">{claim.date}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Insurance Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Provider</p>
              <p className="text-white font-semibold">{claim.provider}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Policy Number</p>
              <p className="text-white font-semibold font-mono">
                {claim.policyNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
          <p className="text-white/70">{claim.description}</p>
        </div>
      </div>
    </PageTemplate>
  );
}
