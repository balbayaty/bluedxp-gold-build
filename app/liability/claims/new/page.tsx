/**
 * New Claim Form
 * Create a new insurance claim from a liability assessment
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function NewClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment");

  const [formData, setFormData] = useState({
    assessmentId: assessmentId || "",
    insuranceProvider: "",
    policyNumber: "",
    claimAmount: "",
    description: "",
    documents: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle claim submission
    alert("Claim submitted successfully!");
    router.push("/liability/claims");
  };

  return (
    <PageTemplate
      title="📄 New Insurance Claim"
      description="Create a new insurance claim from a liability assessment"
      icon="ri-file-paper-line"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2"
        >
          <i className="ri-arrow-left-line"></i>
          Back
        </motion.button>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6"
        >
          <div>
            <label className="text-white/60 text-sm mb-2 block">
              Assessment ID
            </label>
            <input
              type="text"
              value={formData.assessmentId}
              onChange={(e) =>
                setFormData({ ...formData, assessmentId: e.target.value })
              }
              placeholder="LI-2025-001"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">
              Insurance Provider
            </label>
            <input
              type="text"
              value={formData.insuranceProvider}
              onChange={(e) =>
                setFormData({ ...formData, insuranceProvider: e.target.value })
              }
              placeholder="Insurance Provider Name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">
              Policy Number
            </label>
            <input
              type="text"
              value={formData.policyNumber}
              onChange={(e) =>
                setFormData({ ...formData, policyNumber: e.target.value })
              }
              placeholder="POL-123456"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">
              Claim Amount (AED)
            </label>
            <input
              type="number"
              value={formData.claimAmount}
              onChange={(e) =>
                setFormData({ ...formData, claimAmount: e.target.value })
              }
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provide details about the claim..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <i className="ri-check-line"></i>
              Submit Claim
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}
