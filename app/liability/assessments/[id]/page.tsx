/**
 * Individual Liability Assessment Detail Page
 * View detailed information about a specific liability assessment
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  // Mock data - in real app, fetch from API
  const assessment = {
    id: assessmentId,
    assessmentNumber: `LI-2025-${String(assessmentId).padStart(3, "0")}`,
    damageRecord: `DR-2025-${String(assessmentId).padStart(3, "0")}`,
    date: "2025-01-15",
    faultPercentage: {
      warehouse: 75,
      carrier: 15,
      supplier: 5,
      other: 5,
    },
    financialImpact: {
      totalValue: 5000,
      claimableAmount: 1250,
      deductible: 62.5,
      netClaim: 1187.5,
      currency: "AED",
    },
    insurance: {
      claimable: true,
      policyNumber: "POL-123456",
      provider: "Insurance Provider A",
    },
    status: "assessed",
    compliance: {
      legal: "compliant",
      insurance: "compliant",
      regulatory: "pending",
    },
  };

  return (
    <PageTemplate
      title={`⚖️ Assessment ${assessment.assessmentNumber}`}
      description="Detailed liability assessment information"
      icon="ri-file-list-line"
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
              onClick={() =>
                router.push(`/liability/claims/new?assessment=${assessmentId}`)
              }
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-white transition-all flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Create Claim
            </motion.button>
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

        {/* Assessment Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Fault Distribution */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Fault Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(assessment.faultPercentage).map(
                ([party, percentage]) => (
                  <div key={party}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white capitalize">
                        {party.replace("_", " ")}
                      </span>
                      <span className="text-white font-semibold">
                        {percentage}%
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      ></motion.div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Financial Impact */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Financial Impact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Total Value</span>
                <span className="text-white font-bold">
                  {assessment.financialImpact.currency}{" "}
                  {assessment.financialImpact.totalValue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Claimable Amount</span>
                <span className="text-green-400 font-bold">
                  {assessment.financialImpact.currency}{" "}
                  {assessment.financialImpact.claimableAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Deductible</span>
                <span className="text-white/70">
                  {assessment.financialImpact.currency}{" "}
                  {assessment.financialImpact.deductible.toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Net Claim</span>
                  <span className="text-white font-bold text-xl">
                    {assessment.financialImpact.currency}{" "}
                    {assessment.financialImpact.netClaim.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        {assessment.insurance.claimable && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Insurance Information
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-white/60 text-sm mb-1">Policy Number</p>
                <p className="text-white font-semibold">
                  {assessment.insurance.policyNumber}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Provider</p>
                <p className="text-white font-semibold">
                  {assessment.insurance.provider}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Status</p>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  Claimable
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Status */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Compliance Status
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(assessment.compliance).map(([category, status]) => (
              <div
                key={category}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <p className="text-white/60 text-sm mb-2 capitalize">
                  {category}
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    status === "compliant"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
