/**
 * Liability Assessments List Page
 * View all liability assessments
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function AssessmentsListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<
    "all" | "assessed" | "pending" | "disputed"
  >("all");

  const assessments = [
    {
      id: 1,
      assessmentNumber: "LI-2025-001",
      damageRecord: "DR-2025-001",
      date: "2 hours ago",
      warehouseFault: 75,
      claimableAmount: 1250,
      status: "assessed",
    },
    {
      id: 2,
      assessmentNumber: "LI-2025-002",
      damageRecord: "DR-2025-002",
      date: "5 hours ago",
      warehouseFault: 60,
      claimableAmount: 2300,
      status: "assessed",
    },
    {
      id: 3,
      assessmentNumber: "LI-2025-003",
      damageRecord: "DR-2025-003",
      date: "1 day ago",
      warehouseFault: 80,
      claimableAmount: 1800,
      status: "pending",
    },
  ];

  const filteredAssessments =
    filter === "all"
      ? assessments
      : assessments.filter((a) => a.status === filter);

  return (
    <PageTemplate
      title="⚖️ Liability Assessments"
      description="View and manage all liability assessments"
      icon="ri-file-list-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">All Assessments</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/liability/calculator")}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            New Assessment
          </motion.button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["all", "assessed", "pending", "disputed"].map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </motion.button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredAssessments.map((assessment, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer"
              onClick={() =>
                router.push(`/liability/assessments/${assessment.id}`)
              }
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {assessment.assessmentNumber}
                  </h4>
                  <p className="text-white/70 text-sm">
                    Damage Record: {assessment.damageRecord}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-bold text-2xl">
                    {assessment.warehouseFault}%
                  </p>
                  <p className="text-white/60 text-xs">Warehouse Fault</p>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Primary Fault</p>
                  <p className="text-white font-semibold">Warehouse</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Claimable Amount</p>
                  <p className="text-green-400 font-semibold">
                    AED {assessment.claimableAmount}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Status</p>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    Assessed
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-1">Date</p>
                  <p className="text-white/70 text-xs">{assessment.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/liability/assessments/${assessment.id}`);
                  }}
                  className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/liability/claims/new?assessment=${assessment.id}`,
                    );
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                >
                  Create Claim
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}
