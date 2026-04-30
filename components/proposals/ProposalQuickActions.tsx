/**
 * Proposal Quick Actions Component
 *
 * Provides quick access to proposal actions from any module
 * Can be embedded in module pages for easy proposal generation
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ProposalQuickActionsProps {
  moduleId: string;
  proposalType?: string;
  customerId?: string;
  customerName?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  compact?: boolean;
}

export default function ProposalQuickActions({
  moduleId,
  proposalType,
  customerId,
  customerName,
  relatedEntityId,
  relatedEntityType,
  compact = false,
}: ProposalQuickActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerateProposal = async () => {
    setLoading(true);
    try {
      // Navigate to universal proposal builder with context
      const params = new URLSearchParams();
      if (moduleId) params.set("moduleId", moduleId);
      if (proposalType) params.set("proposalType", proposalType);
      if (customerId) params.set("customerId", customerId);
      if (customerName) params.set("customerName", customerName);
      if (relatedEntityId) params.set("relatedEntityId", relatedEntityId);
      if (relatedEntityType) params.set("relatedEntityType", relatedEntityType);

      router.push(`/proposals/universal/new?${params.toString()}`);
    } catch (error) {
      console.error("Error navigating to proposal builder:", error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleGenerateProposal}
        disabled={loading}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <i className="ri-loader-4-line animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <i className="ri-file-add-line" />
            Create Proposal
          </>
        )}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h3>
        <i className="ri-magic-line text-blue-600 dark:text-blue-400" />
      </div>

      <div className="space-y-2">
        <button
          onClick={handleGenerateProposal}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <i className="ri-magic-line" />
              Generate Intelligent Proposal
            </>
          )}
        </button>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          AI-powered insights • Win probability analysis • Cross-module
          integration
        </div>
      </div>
    </motion.div>
  );
}
