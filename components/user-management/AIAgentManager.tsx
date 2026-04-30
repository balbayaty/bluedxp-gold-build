/**
 * 🤖 AI AGENT MANAGER
 * 
 * Assign and configure AI agents with:
 * - Agent selection
 * - Token allocation
 * - Usage tracking
 * - Execution history
 * 
 * BlueDXP Platform - Production Ready
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { AgentAssignment, AgentType } from "@/types/userManagement";
import { format, formatDistanceToNow } from "date-fns";

export interface AIAgentManagerProps {
  userId: string;
  assignments: AgentAssignment[];
  onAssign: (assignment: Omit<AgentAssignment, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateAssignment: (id: string, updates: Partial<AgentAssignment>) => void;
  onRemoveAssignment: (id: string) => void;
  availableTokens?: number;
  readOnly?: boolean;
}

const AGENT_TYPES: {
  type: AgentType;
  name: string;
  icon: string;
  description: string;
  color: string;
  suggestedTokens: number;
}[] = [
  {
    type: "copilot",
    name: "Hazalyze Copilot",
    icon: "ri-sparkling-line",
    description: "General-purpose AI assistant for queries and tasks",
    color: "from-cyan-500 to-blue-500",
    suggestedTokens: 50000,
  },
  {
    type: "data_analyst",
    name: "Data Analyst",
    icon: "ri-bar-chart-grouped-line",
    description: "Advanced analytics and data visualization",
    color: "from-purple-500 to-pink-500",
    suggestedTokens: 100000,
  },
  {
    type: "compliance_officer",
    name: "Compliance Officer",
    icon: "ri-shield-check-line",
    description: "Regulatory compliance checking and alerts",
    color: "from-green-500 to-emerald-500",
    suggestedTokens: 75000,
  },
  {
    type: "logistics_optimizer",
    name: "Logistics Optimizer",
    icon: "ri-truck-line",
    description: "Route optimization and supply chain intelligence",
    color: "from-orange-500 to-red-500",
    suggestedTokens: 80000,
  },
  {
    type: "customer_success",
    name: "Customer Success",
    icon: "ri-user-heart-line",
    description: "Customer relationship and support automation",
    color: "from-pink-500 to-rose-500",
    suggestedTokens: 60000,
  },
  {
    type: "inventory_manager",
    name: "Inventory Manager",
    icon: "ri-archive-line",
    description: "Stock optimization and demand forecasting",
    color: "from-yellow-500 to-orange-500",
    suggestedTokens: 70000,
  },
  {
    type: "document_processor",
    name: "Document Processor",
    icon: "ri-file-text-line",
    description: "OCR, extraction, and document intelligence",
    color: "from-indigo-500 to-purple-500",
    suggestedTokens: 90000,
  },
  {
    type: "risk_assessor",
    name: "Risk Assessor",
    icon: "ri-error-warning-line",
    description: "Risk analysis and mitigation recommendations",
    color: "from-red-500 to-orange-500",
    suggestedTokens: 85000,
  },
];

// Note: Mock assignments removed - component now uses real API data
// When no assignments are provided, an empty state is shown instead of fake data

const AIAgentManager: React.FC<AIAgentManagerProps> = ({
  userId,
  assignments: providedAssignments,
  onAssign,
  onUpdateAssignment,
  onRemoveAssignment,
  availableTokens = 500000,
  readOnly = false,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [tokenQuota, setTokenQuota] = useState(50000);

  // Use provided assignments - no fallback to mock data
  const assignments = providedAssignments;

  // Calculate total used tokens
  const totalUsedTokens = assignments.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
  const totalAllocatedTokens = assignments.reduce((sum, a) => sum + (a.tokenQuota || 0), 0);

  // Get agent config
  const getAgentConfig = (type: AgentType) =>
    AGENT_TYPES.find((a) => a.type === type) || AGENT_TYPES[0];

  // Available agents (not yet assigned)
  const availableAgents = AGENT_TYPES.filter(
    (agent) => !assignments.some((a) => a.agentType === agent.type)
  );

  const handleAssign = () => {
    if (selectedAgent) {
      onAssign({
        userId,
        agentType: selectedAgent,
        isEnabled: true,
        tokenQuota,
        tokensUsed: 0,
        executionCount: 0,
        configuration: {},
      });
      setShowAssignModal(false);
      setSelectedAgent(null);
      setTokenQuota(50000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="ri-robot-line text-purple-400"></i>
            AI Agents
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {assignments.length} agents assigned • {totalUsedTokens.toLocaleString()} tokens used
          </p>
        </div>

        {!readOnly && availableAgents.length > 0 && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg shadow-purple-500/20"
          >
            <i className="ri-add-line mr-2"></i>
            Assign Agent
          </button>
        )}
      </div>

      {/* Token Overview */}
      <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-[#9ca3af] mb-1">Token Usage</div>
            <div className="text-2xl font-bold text-white">
              {totalUsedTokens.toLocaleString()} / {totalAllocatedTokens.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#9ca3af] mb-1">Available Pool</div>
            <div className="text-2xl font-bold text-purple-400">
              {availableTokens.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalUsedTokens / totalAllocatedTokens) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
      </div>

      {/* Assigned Agents */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <i className="ri-robot-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af] mb-4">No AI agents assigned yet</p>
          {!readOnly && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
            >
              Assign First Agent
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {assignments.map((assignment, index) => {
            const config = getAgentConfig(assignment.agentType);
            const usagePercent = ((assignment.tokensUsed || 0) / (assignment.tokenQuota || 1)) * 100;

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-5 bg-white/5 border rounded-xl transition-all hover:border-purple-500/30 ${
                  assignment.isEnabled ? "border-white/10" : "border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <i className={`${config.icon} text-2xl text-white`}></i>
                    </div>
                    <div>
                      <div className="text-white font-medium">{config.name}</div>
                      <div className="text-xs text-[#9ca3af]">{config.description}</div>
                    </div>
                  </div>
                  
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdateAssignment(assignment.id, {
                            isEnabled: !assignment.isEnabled,
                          })
                        }
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          assignment.isEnabled ? "bg-green-500" : "bg-white/20"
                        }`}
                      >
                        <motion.div
                          animate={{ x: assignment.isEnabled ? 18 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2 bg-white/5 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">
                      {(assignment.tokensUsed || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Tokens Used</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">
                      {assignment.executionCount || 0}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Executions</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">
                      {assignment.tokenQuota?.toLocaleString() || "∞"}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Quota</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#9ca3af]">Token Usage</span>
                    <span className={usagePercent >= 90 ? "text-red-400" : "text-white"}>
                      {usagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent >= 90
                          ? "bg-red-500"
                          : usagePercent >= 75
                            ? "bg-orange-500"
                            : `bg-gradient-to-r ${config.color}`
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Last Execution */}
                {assignment.lastExecution && (
                  <div className="text-xs text-[#9ca3af]">
                    Last run: {formatDistanceToNow(new Date(assignment.lastExecution), { addSuffix: true })}
                  </div>
                )}

                {/* Actions */}
                {!readOnly && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                    <button className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white hover:bg-white/10 transition-colors">
                      <i className="ri-settings-3-line mr-1"></i>
                      Configure
                    </button>
                    <button className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white hover:bg-white/10 transition-colors">
                      <i className="ri-history-line mr-1"></i>
                      History
                    </button>
                    <button
                      onClick={() => onRemoveAssignment(assignment.id)}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedAgent(null);
        }}
        title="Assign AI Agent"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#9ca3af]">
            Select an AI agent to assign to this user. Each agent has specialized capabilities.
          </p>

          {/* Agent Selection */}
          <div className="grid gap-3 max-h-[300px] overflow-y-auto">
            {availableAgents.map((agent) => (
              <button
                key={agent.type}
                onClick={() => {
                  setSelectedAgent(agent.type);
                  setTokenQuota(agent.suggestedTokens);
                }}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedAgent === agent.type
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`${agent.icon} text-xl text-white`}></i>
                  </div>
                  <div>
                    <div className="text-white font-medium">{agent.name}</div>
                    <div className="text-xs text-[#9ca3af]">{agent.description}</div>
                    <div className="text-xs text-purple-400 mt-1">
                      Suggested: {agent.suggestedTokens.toLocaleString()} tokens
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Token Quota */}
          {selectedAgent && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <label className="block text-sm font-medium text-white mb-2">
                Token Quota
              </label>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={tokenQuota}
                onChange={(e) => setTokenQuota(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-[#9ca3af] mt-1">
                <span>10K</span>
                <span className="text-purple-400 font-medium">{tokenQuota.toLocaleString()} tokens</span>
                <span>500K</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedAgent(null);
              }}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedAgent}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
            >
              Assign Agent
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIAgentManager;
