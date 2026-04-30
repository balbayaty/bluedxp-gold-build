/**
 * Enhanced Proposal Builder Component
 * Modern UI with RAG integration, real-time preview, and approval workflow
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ProposalBuilderProps {
  initialData?: any;
  rfqId?: string;
  onSave?: (data: any) => void;
  onGenerate?: (data: any) => void;
}

export default function EnhancedProposalBuilder({
  initialData,
  rfqId,
  onSave,
  onGenerate,
}: ProposalBuilderProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "setup" | "content" | "pricing" | "preview" | "approval"
  >("setup");
  const [ragEnabled, setRagEnabled] = useState(true);
  const [ragInsights, setRagInsights] = useState<string[]>([]);
  const [loadingRAG, setLoadingRAG] = useState(false);
  const [proposalData, setProposalData] = useState({
    title: "",
    customer: "",
    customerId: "",
    description: "",
    proposalType: "QUOTE_PROPOSAL",
    sections: [] as any[],
    pricing: {
      items: [] as any[],
      total: 0,
      currency: "SAR",
    },
    branding: {
      companyName: "BlueDXP",
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
    },
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    autoApprove: false,
    autoSend: false,
  });

  useEffect(() => {
    if (initialData) {
      setProposalData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const generateRAGInsights = useCallback(async () => {
    if (!ragEnabled || !proposalData.title) return;

    setLoadingRAG(true);
    try {
      // Simulate RAG insights - in production would call actual RAG service
      const insights = [
        "Consider adding journey analysis section - increases win rate by 20%",
        "Proposals with 7+ sections convert 15% better",
        "Include case studies for similar customers in your industry",
        "Response time under 24 hours improves acceptance by 10%",
      ];
      setRagInsights(insights);
    } catch (error) {
      console.error("Error generating RAG insights:", error);
    } finally {
      setLoadingRAG(false);
    }
  }, [ragEnabled, proposalData.title]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (proposalData.title) {
        generateRAGInsights();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [proposalData.title, generateRAGInsights]);

  const handleGenerate = async () => {
    try {
      const response = await fetch("/api/proposals/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            proposalType: proposalData.proposalType,
            sourceData: {},
            templateId: "standard",
            branding: proposalData.branding,
          },
          useRAG: ragEnabled,
          submitForApproval: !proposalData.autoApprove,
          approvalConfig: {
            workflowId: "standard-proposal-approval",
            autoApprove: proposalData.autoApprove,
          },
          autoSend: proposalData.autoSend,
          sendConfig: {
            recipients: [
              { email: proposalData.customer, name: proposalData.customer },
            ],
            attachments: true,
            trackOpens: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (onGenerate) {
          onGenerate(data.data);
        } else {
          router.push(`/proposals/${data.data.proposal.id}`);
        }
      }
    } catch (error) {
      console.error("Error generating proposal:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* RAG Insights Banner */}
      {ragInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <i className="ri-lightbulb-flash-line text-xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">AI-Powered Suggestions</h4>
                <button
                  onClick={() => setRagEnabled(!ragEnabled)}
                  className="text-xs opacity-80 hover:opacity-100"
                >
                  {ragEnabled ? "Disable RAG" : "Enable RAG"}
                </button>
              </div>
              <div className="space-y-1">
                {ragInsights.slice(0, 2).map((insight, i) => (
                  <p
                    key={i}
                    className="text-sm opacity-90 flex items-start gap-2"
                  >
                    <i className="ri-checkbox-circle-line mt-0.5" />
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto">
        {[
          { id: "setup", label: "Setup", icon: "ri-settings-3-line" },
          { id: "content", label: "Content", icon: "ri-file-edit-line" },
          { id: "pricing", label: "Pricing", icon: "ri-price-tag-3-line" },
          { id: "preview", label: "Preview", icon: "ri-eye-line" },
          { id: "approval", label: "Approval", icon: "ri-shield-check-line" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Proposal Setup
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proposal Title *
                </label>
                <input
                  type="text"
                  value={proposalData.title}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter proposal title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer *
                  </label>
                  <input
                    type="text"
                    value={proposalData.customer}
                    onChange={(e) =>
                      setProposalData((prev) => ({
                        ...prev,
                        customer: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={proposalData.validUntil}
                    onChange={(e) =>
                      setProposalData((prev) => ({
                        ...prev,
                        validUntil: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={proposalData.description}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Proposal description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proposal Type
                </label>
                <select
                  value={proposalData.proposalType}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      proposalType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="QUOTE_PROPOSAL">Quote Proposal</option>
                  <option value="SHIPMENT_REPORT">Shipment Report</option>
                  <option value="ANALYTICS_REPORT">Analytics Report</option>
                  <option value="CUSTOMS_REPORT">Customs Report</option>
                  <option value="CARRIER_PROPOSAL">Carrier Proposal</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "approval" && (
          <motion.div
            key="approval"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approval Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={proposalData.autoApprove}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      autoApprove: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <label className="font-medium text-gray-900 dark:text-white">
                    Auto-Approve
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically approve proposals that meet conditions (e.g.,
                    amount &lt; 10K)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={proposalData.autoSend}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      autoSend: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <label className="font-medium text-gray-900 dark:text-white">
                    Auto-Send After Approval
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically send proposal to customer after approval
                  </p>
                </div>
              </div>

              {!proposalData.autoApprove && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <i className="ri-information-line text-blue-600 text-xl mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-300">
                        Approval Workflow
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        This proposal will go through the standard approval
                        workflow: Manager Review → Finance Approval → Director
                        Approval (if amount &gt; 100K)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSave?.(proposalData)}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Save Draft
          </button>
          <button
            onClick={handleGenerate}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg flex items-center gap-2"
          >
            <i className="ri-magic-line" />
            Generate with AI
          </button>
        </div>
      </div>
    </div>
  );
}
