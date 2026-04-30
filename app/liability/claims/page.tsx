/**
 * Claims List Page
 * View all insurance claims
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function ClaimsListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<
    "all" | "submitted" | "approved" | "pending" | "rejected"
  >("all");

  const claims = [
    {
      id: 1,
      claimNumber: "CL-2025-001",
      assessment: "LI-2025-001",
      amount: 1250,
      status: "submitted",
      provider: "Insurance Provider A",
      policyNumber: "POL-123456",
      date: "2 days ago",
    },
    {
      id: 2,
      claimNumber: "CL-2025-002",
      assessment: "LI-2025-002",
      amount: 2300,
      status: "approved",
      provider: "Insurance Provider B",
      policyNumber: "POL-234567",
      date: "5 days ago",
    },
    {
      id: 3,
      claimNumber: "CL-2025-003",
      assessment: "LI-2025-003",
      amount: 1800,
      status: "pending",
      provider: "Insurance Provider A",
      policyNumber: "POL-345678",
      date: "1 week ago",
    },
    {
      id: 4,
      claimNumber: "CL-2025-004",
      assessment: "LI-2025-004",
      amount: 3200,
      status: "rejected",
      provider: "Insurance Provider C",
      policyNumber: "POL-456789",
      date: "2 weeks ago",
    },
  ];

  const filteredClaims =
    filter === "all" ? claims : claims.filter((c) => c.status === filter);

  return (
    <PageTemplate
      title="📄 Insurance Claims"
      description="View and manage all insurance claims"
      icon="ri-file-paper-line"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">All Claims</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/liability/claims/new")}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            New Claim
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "submitted", "approved", "pending", "rejected"].map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-green-500 text-white"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.map((claim, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-green-500/50 transition-all cursor-pointer"
              onClick={() => router.push(`/liability/claims/${claim.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {claim.claimNumber}
                  </h4>
                  <p className="text-white/70 text-sm">
                    Assessment: {claim.assessment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-2xl">
                    AED {claim.amount}
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block ${
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
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">
                    Insurance Provider
                  </p>
                  <p className="text-white font-semibold text-sm">
                    {claim.provider}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Policy Number</p>
                  <p className="text-white/70 text-xs font-mono">
                    {claim.policyNumber}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Date</p>
                  <p className="text-white/70 text-xs">{claim.date}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Actions</p>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/liability/claims/${claim.id}`);
                      }}
                      className="text-green-400 hover:text-green-300"
                    >
                      <i className="ri-eye-line"></i>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}
