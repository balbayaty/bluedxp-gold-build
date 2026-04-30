"use client";

/**
 * 🚀 AGENT CAPABILITIES SHOWCASE
 *
 * Mind-blowing, shocking, and impressive demonstration of AI agent capabilities
 * Shows real-time agent intelligence, live demos, and bulletproof performance
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { agentOrchestrator } from "@/lib/services/agents";
import type {
  AgentDefinition,
  TaskRequest,
  TaskResult,
} from "@/lib/services/agents/agentOrchestrator";
import { allSpecializedAgents } from "@/lib/services/agents/specializedAgents";
// Helper function for API calls
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

interface LiveDemo {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  result?: TaskResult;
  status: "idle" | "running" | "success" | "error";
  startTime?: number;
}

export default function AgentShowcasePage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(
    null,
  );
  const [liveDemos, setLiveDemos] = useState<LiveDemo[]>([]);
  const [showcaseMode, setShowcaseMode] = useState<
    "grid" | "detailed" | "live"
  >("grid");
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalCapabilities: 0,
    activeDemos: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadAgents();
    initializeShowcaseDemos();
  }, []);

  const loadAgents = async () => {
    try {
      const allAgents = await agentOrchestrator.getAgents();
      const enabledAgents = allAgents.filter((a) => a.isEnabled);
      setAgents(enabledAgents);

      // Calculate stats
      const totalCapabilities = enabledAgents.reduce(
        (sum, agent) => sum + agent.capabilities.length,
        0,
      );
      setStats({
        totalAgents: enabledAgents.length,
        totalCapabilities,
        activeDemos: liveDemos.filter((d) => d.status === "running").length,
        successRate:
          liveDemos.length > 0
            ? (liveDemos.filter((d) => d.status === "success").length /
                liveDemos.length) *
              100
            : 0,
      });
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const initializeShowcaseDemos = () => {
    // Pre-configured showcase demos for each agent type
    const demos: LiveDemo[] = [
      {
        id: "demo-1",
        agentId: "hazalyze-chemical-intelligence",
        agentName: "Hazalyze Chemical Intelligence",
        prompt:
          "Analyze the safety and compatibility of storing Sodium Hydroxide (CAS 1310-73-2) with Hydrochloric Acid (CAS 7647-01-0) in the same warehouse zone.",
        status: "idle",
      },
      {
        id: "demo-2",
        agentId: "customscheck-hs-code-compliance",
        agentName: "CustomsCheck HS Code",
        prompt:
          'Classify a shipment of "Industrial grade polyethylene pellets for manufacturing" and provide customs compliance requirements for import to Saudi Arabia from China.',
        status: "idle",
      },
      {
        id: "demo-3",
        agentId: "storage-zone-recommender",
        agentName: "Storage Zone Recommender",
        prompt:
          "Recommend optimal storage zones for a batch of flammable liquids (flash point: -20°C) requiring temperature control (2-8°C) in a 10,000 sqm warehouse with 5 zones.",
        status: "idle",
      },
      {
        id: "demo-4",
        agentId: "incident-prevention-ai",
        agentName: "Incident Prevention AI",
        prompt:
          "Analyze historical incident data showing 3 chemical spills in Zone A over the past 6 months and predict potential future incidents with preventive recommendations.",
        status: "idle",
      },
    ];
    setLiveDemos(demos);
  };

  const runLiveDemo = useCallback(
    async (demo: LiveDemo) => {
      const agent = agents.find((a) => a.id === demo.agentId);
      if (!agent) {
        alert("Agent not found");
        return;
      }

      // Update demo status
      setLiveDemos((prev) =>
        prev.map((d) =>
          d.id === demo.id
            ? { ...d, status: "running" as const, startTime: Date.now() }
            : d,
        ),
      );

      try {
        const taskRequest: TaskRequest = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          type: agent.type,
          description: demo.prompt,
          input: {
            userMessage: demo.prompt,
            systemPrompt: agent.systemPrompt,
          },
          priority: "high",
          tenantId: "default",
          userId: "showcase-user",
        };

        // Execute via API route (server-side execution)
        const response = await apiFetch("/api/agents/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: demo.agentId,
            description: demo.prompt,
            input: {
              userMessage: demo.prompt,
              systemPrompt: agent.systemPrompt,
            },
            priority: "high",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.result;

        setLiveDemos((prev) =>
          prev.map((d) =>
            d.id === demo.id
              ? {
                  ...d,
                  status:
                    result.status === "success"
                      ? ("success" as const)
                      : ("error" as const),
                  result,
                }
              : d,
          ),
        );

        // Update stats
        loadAgents();
      } catch (error) {
        console.error("Demo execution error:", error);
        setLiveDemos((prev) =>
          prev.map((d) =>
            d.id === demo.id ? { ...d, status: "error" as const } : d,
          ),
        );
      }
    },
    [agents],
  );

  const agentCategories = [
    {
      name: "Chemical Intelligence",
      icon: "ri-flask-line",
      color: "from-red-500 to-orange-500",
      agents: agents.filter((a) => a.type.includes("chemical")),
    },
    {
      name: "Compliance & Safety",
      icon: "ri-shield-check-line",
      color: "from-green-500 to-emerald-500",
      agents: agents.filter(
        (a) => a.type.includes("compliance") || a.type.includes("safety"),
      ),
    },
    {
      name: "Warehouse Optimization",
      icon: "ri-warehouse-line",
      color: "from-blue-500 to-cyan-500",
      agents: agents.filter(
        (a) => a.type.includes("warehouse") || a.type.includes("storage"),
      ),
    },
    {
      name: "Trade & Customs",
      icon: "ri-global-line",
      color: "from-purple-500 to-pink-500",
      agents: agents.filter(
        (a) => a.type.includes("customs") || a.type.includes("trade"),
      ),
    },
    {
      name: "Predictive Intelligence",
      icon: "ri-brain-line",
      color: "from-yellow-500 to-amber-500",
      agents: agents.filter(
        (a) => a.type.includes("predictive") || a.type.includes("prevention"),
      ),
    },
  ];

  return (
    <PageTemplate
      title="🤖 AI Agent Capabilities Showcase"
      description="Experience the most advanced AI agent system in the world. See real-time intelligence, live demonstrations, and mind-blowing capabilities."
      icon="ri-robot-3-line"
      stats={[
        {
          label: "Active Agents",
          value: stats.totalAgents,
          icon: "ri-robot-line",
          trend: "up" as const,
        },
        {
          label: "Total Capabilities",
          value: stats.totalCapabilities,
          icon: "ri-star-line",
          trend: "up" as const,
        },
        {
          label: "Success Rate",
          value: `${Math.round(stats.successRate)}%`,
          icon: "ri-checkbox-circle-line",
          trend:
            stats.successRate > 80 ? ("up" as const) : ("neutral" as const),
        },
      ]}
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-cyan-500/30 p-8"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')'] opacity-10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4">
              🚀 The Most Advanced AI Agent System
            </h1>
            <p className="text-xl text-white/80 mb-6">
              Experience autonomous intelligence that learns, adapts, and
              delivers mind-blowing results
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowcaseMode("live")}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-cyan-500/50"
              >
                <i className="ri-play-circle-line mr-2"></i>
                Live Demos
              </button>
              <button
                onClick={() => setShowcaseMode("detailed")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all"
              >
                <i className="ri-eye-line mr-2"></i>
                Detailed View
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live Demo Section */}
        {showcaseMode === "live" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <i className="ri-live-line text-cyan-400"></i>
              Live Agent Demonstrations
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveDemos.map((demo) => {
                const agent = agents.find((a) => a.id === demo.agentId);
                const isRunning = demo.status === "running";
                const isSuccess = demo.status === "success";
                const isError = demo.status === "error";

                return (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative overflow-hidden rounded-2xl border-2 p-6 ${
                      isRunning
                        ? "border-cyan-500 bg-cyan-500/10"
                        : isSuccess
                          ? "border-green-500 bg-green-500/10"
                          : isError
                            ? "border-red-500 bg-red-500/10"
                            : "border-white/20 bg-white/5"
                    } backdrop-blur-xl`}
                  >
                    {/* Animated background for running state */}
                    {isRunning && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20"
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        style={{ backgroundSize: "200% 200%" }}
                      />
                    )}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {demo.agentName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            {isRunning && (
                              <>
                                <motion.div
                                  className="w-2 h-2 bg-cyan-400 rounded-full"
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                                <span>Processing...</span>
                              </>
                            )}
                            {isSuccess && (
                              <>
                                <i className="ri-checkbox-circle-line text-green-400"></i>
                                <span>Completed</span>
                              </>
                            )}
                            {isError && (
                              <>
                                <i className="ri-error-warning-line text-red-400"></i>
                                <span>Error</span>
                              </>
                            )}
                            {demo.status === "idle" && (
                              <span>Ready to run</span>
                            )}
                          </div>
                        </div>
                        {agent && (
                          <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white/70">
                            {agent.capabilities.length} capabilities
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-white/90 font-medium mb-2">
                          Demo Prompt:
                        </p>
                        <p className="text-sm text-white/70 bg-black/20 rounded-lg p-3">
                          {demo.prompt}
                        </p>
                      </div>

                      {isRunning && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-cyan-400">
                            <motion.div
                              className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                            <span className="text-sm">
                              Agent is thinking...
                            </span>
                          </div>
                        </div>
                      )}

                      {isSuccess && demo.result && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-4 space-y-3"
                        >
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-green-400">
                                Result
                              </span>
                              <span className="text-xs text-white/70">
                                {demo.result.processingTime}ms •{" "}
                                {demo.result.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-white/90 whitespace-pre-wrap">
                              {demo.result.output?.result ||
                                demo.result.output?.content ||
                                "No result"}
                            </p>
                            {demo.result.learningNotes &&
                              demo.result.learningNotes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-green-500/20">
                                  <p className="text-xs text-green-400/70 mb-1">
                                    Learning Notes:
                                  </p>
                                  <ul className="text-xs text-white/60 space-y-1">
                                    {demo.result.learningNotes.map(
                                      (note, i) => (
                                        <li key={i}>• {note}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </motion.div>
                      )}

                      {isError && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                          <p className="text-sm text-red-400">
                            {demo.result?.error ||
                              "An error occurred during execution"}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => runLiveDemo(demo)}
                        disabled={isRunning}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${
                          isRunning
                            ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/50"
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Processing...
                          </>
                        ) : isSuccess ? (
                          <>
                            <i className="ri-refresh-line mr-2"></i>
                            Run Again
                          </>
                        ) : (
                          <>
                            <i className="ri-play-line mr-2"></i>
                            Run Live Demo
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Agent Categories Grid */}
        {showcaseMode === "grid" && (
          <div className="space-y-8">
            {agentCategories.map((category, catIndex) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}
                  >
                    <i className={`${category.icon} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {category.name}
                    </h2>
                    <p className="text-sm text-white/60">
                      {category.agents.length} specialized agents
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.agents.map((agent, agentIndex) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: catIndex * 0.1 + agentIndex * 0.05 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => setSelectedAgent(agent)}
                      className="group relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
                    >
                      {/* Animated gradient background */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 transition-opacity`}
                        animate={{
                          backgroundPosition: ["0% 0%", "100% 100%"],
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}
                          >
                            <i
                              className={`${category.icon} text-xl text-white`}
                            ></i>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg">
                            Active
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-white/70 mb-4 line-clamp-2">
                          {agent.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Capabilities</span>
                            <span className="text-cyan-400 font-semibold">
                              {agent.capabilities.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {agent.capabilities.slice(0, 3).map((cap) => (
                              <span
                                key={cap.id}
                                className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                              >
                                {cap.name}
                              </span>
                            ))}
                            {agent.capabilities.length > 3 && (
                              <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded">
                                +{agent.capabilities.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>Model: {agent.model || "gpt-4o-mini"}</span>
                            <span className="flex items-center gap-1">
                              <i className="ri-brain-line"></i>
                              AI Powered
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detailed View */}
        {showcaseMode === "detailed" && selectedAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedAgent.name}
                  </h2>
                  <p className="text-white/70">{selectedAgent.description}</p>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-white/60 hover:text-white"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">Type</p>
                  <p className="text-white font-semibold">
                    {selectedAgent.type}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">Model</p>
                  <p className="text-white font-semibold">
                    {selectedAgent.model || "gpt-4o-mini"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">Temperature</p>
                  <p className="text-white font-semibold">
                    {selectedAgent.temperature || 0.7}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">Max Tokens</p>
                  <p className="text-white font-semibold">
                    {selectedAgent.maxTokens || 2000}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Capabilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAgent.capabilities.map((cap) => (
                    <motion.div
                      key={cap.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-semibold">{cap.name}</h4>
                        {cap.priority && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                            Priority {cap.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/70 mb-3">
                        {cap.description}
                      </p>
                      {cap.confidenceThreshold && (
                        <div className="text-xs text-white/60">
                          Confidence Threshold:{" "}
                          {Math.round(cap.confidenceThreshold * 100)}%
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {selectedAgent.systemPrompt && (
                <div className="mt-6 bg-black/20 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-3">
                    System Prompt
                  </h3>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">
                    {selectedAgent.systemPrompt}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </PageTemplate>
  );
}
