"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { agentOrchestrator } from "@/lib/services/agents";
import type {
  AgentDefinition,
  TaskRequest,
  WorkflowExecution,
} from "@/lib/services/agents/agentOrchestrator";

export default function AgentOrchestrationPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(
    null,
  );
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allAgents = await agentOrchestrator.getAgents();
      setAgents(allAgents.filter((a) => a.isEnabled));
      // Load workflows and executions if available
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Active Agents",
        value: agents.length,
        icon: "ri-robot-line",
        trend: "up" as const,
      },
      {
        label: "Total Workflows",
        value: workflows.length,
        icon: "ri-flow-chart-line",
        trend: "neutral" as const,
      },
      {
        label: "Running Executions",
        value: executions.filter((e) => e.status === "running").length,
        icon: "ri-play-circle-line",
        trend: "up" as const,
      },
    ],
    [agents, workflows, executions],
  );

  return (
    <PageTemplate
      title="Agent Orchestration"
      description="AI-Powered Agent Management & Workflow Orchestration"
      icon="ri-robot-line"
      stats={stats}
    >
      <div className="space-y-6">
        {/* Agents Grid */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">AI Agents</h3>
            <button
              onClick={() => setShowAgentModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-add-line mr-2"></i>Add Agent
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#9ca3af]">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <i className="ri-robot-line text-4xl mb-3 opacity-50"></i>
              <p>No agents configured</p>
              <p className="text-sm mt-2">
                Create your first AI agent to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedAgent(agent)}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{agent.name}</h4>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        {agent.type}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        agent.isEnabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {agent.isEnabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-[#9ca3af] line-clamp-2">
                    {agent.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#6b7280]">
                    <span>{agent.capabilities.length} capabilities</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Workflows */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Workflows</h3>
          {workflows.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <i className="ri-flow-chart-line text-4xl mb-3 opacity-50"></i>
              <p>No workflows configured</p>
              <p className="text-sm mt-2">
                Create workflows to orchestrate multiple agents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        {workflow.name}
                      </h4>
                      <p className="text-sm text-[#9ca3af]">
                        {workflow.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs ${
                        workflow.isEnabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {workflow.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <Modal
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          title={selectedAgent.name}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#9ca3af]">Description</label>
              <p className="text-white mt-1">{selectedAgent.description}</p>
            </div>
            <div>
              <label className="text-sm text-[#9ca3af]">Type</label>
              <p className="text-white mt-1">{selectedAgent.type}</p>
            </div>
            <div>
              <label className="text-sm text-[#9ca3af] mb-2 block">
                Capabilities
              </label>
              <div className="space-y-2">
                {selectedAgent.capabilities.map((cap) => (
                  <div key={cap.id} className="bg-white/5 rounded-lg p-3">
                    <h5 className="text-white font-medium text-sm">
                      {cap.name}
                    </h5>
                    <p className="text-xs text-[#9ca3af] mt-1">
                      {cap.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
