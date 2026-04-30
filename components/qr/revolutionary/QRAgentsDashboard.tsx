"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function QRAgentsDashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/agents");
      const data = await res.json();
      if (data.success && data.agents) {
        setAgents(data.agents);
      } else {
        // Fallback to mock data
        setAgents([
          {
            id: "opt-1",
            name: "QR Optimizer",
            type: "optimizer",
            status: "active",
            tasks: 234,
            successRate: 98,
          },
          {
            id: "ana-1",
            name: "QR Analyst",
            type: "analyst",
            status: "active",
            tasks: 156,
            successRate: 95,
          },
          {
            id: "mnt-1",
            name: "QR Maintainer",
            type: "maintainer",
            status: "working",
            tasks: 89,
            successRate: 99,
          },
          {
            id: "sec-1",
            name: "QR Security",
            type: "security",
            status: "active",
            tasks: 67,
            successRate: 100,
          },
          {
            id: "com-1",
            name: "QR Compliance",
            type: "compliance",
            status: "idle",
            tasks: 45,
            successRate: 97,
          },
        ]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load agents";
      setError(errorMessage);
      // Fallback to mock data
      setAgents([
        {
          id: "opt-1",
          name: "QR Optimizer",
          type: "optimizer",
          status: "active",
          tasks: 234,
          successRate: 98,
        },
        {
          id: "ana-1",
          name: "QR Analyst",
          type: "analyst",
          status: "active",
          tasks: 156,
          successRate: 95,
        },
        {
          id: "mnt-1",
          name: "QR Maintainer",
          type: "maintainer",
          status: "working",
          tasks: 89,
          successRate: 99,
        },
        {
          id: "sec-1",
          name: "QR Security",
          type: "security",
          status: "active",
          tasks: 67,
          successRate: 100,
        },
        {
          id: "com-1",
          name: "QR Compliance",
          type: "compliance",
          status: "idle",
          tasks: 45,
          successRate: 97,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async (agentId: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/qr/agents?agentId=${agentId}`);
      const data = await res.json();
      if (data.success) {
        setInsights((prev) => [...(data.insights || []), ...prev]);
      } else {
        setError(data.error || "Failed to generate insights");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate insights";
      setError(errorMessage);
      console.error("Error generating insights:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-gray-400">Loading agents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <i className="ri-error-warning-line"></i>
              <div>{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </motion.div>
      )}

      {/* Agents Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-robot-line text-blue-400"></i>
          AI Autonomous Agents
        </h2>
        {agents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="ri-robot-line text-4xl mb-4"></i>
            <div>No agents found. Create your first agent to get started.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  generateInsights(agent.id);
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 hover:border-blue-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{agent.name}</h3>
                    <div className="text-sm text-gray-400 capitalize">
                      {agent.type}
                    </div>
                  </div>
                  <motion.div
                    animate={{
                      scale: agent.status === "working" ? [1, 1.2, 1] : 1,
                      opacity: agent.status === "working" ? [1, 0.7, 1] : 1,
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-3 h-3 rounded-full ${
                      agent.status === "active"
                        ? "bg-green-400"
                        : agent.status === "working"
                          ? "bg-blue-400"
                          : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">Tasks</div>
                    <div className="font-bold text-blue-400">{agent.tasks}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Success</div>
                    <div className="font-bold text-green-400">
                      {agent.successRate}%
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <i className="ri-lightbulb-line text-yellow-400"></i>
            Autonomous Insights
          </h2>
          <button
            onClick={() => generateInsights(selectedAgent || agents[0]?.id)}
            disabled={isGenerating || !selectedAgent}
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"
                />
                Generating...
              </>
            ) : (
              "Generate New Insights"
            )}
          </button>
        </div>
        {insights.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="ri-lightbulb-line text-4xl mb-4"></i>
            <div>No insights yet. Select an agent and generate insights.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border ${
                  insight.severity === "high"
                    ? "border-red-500/50 bg-red-500/10"
                    : insight.severity === "medium"
                      ? "border-yellow-500/50 bg-yellow-500/10"
                      : "border-blue-500/50 bg-blue-500/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">{insight.title}</div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      insight.severity === "high"
                        ? "bg-red-500"
                        : insight.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                    }`}
                  >
                    {insight.severity.toUpperCase()}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {insight.description || "Agent-generated insight"}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-gray-500">
                    Confidence:{" "}
                    <span className="text-green-400">
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Type:{" "}
                    <span className="text-purple-400 capitalize">
                      {insight.type}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
