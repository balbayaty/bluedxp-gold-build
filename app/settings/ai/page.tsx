"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import { isAIAvailable, getAvailableProviders, callAI } from "@/utils/aiClient";
import {
  getAllAgents,
  executeAgentAction,
  approveAction,
  rejectAction,
  getPendingActions,
  getActionsByAgent,
} from "@/utils/agentEngine";
import { Agent, AgentAction } from "@/types/agents";
import {
  importAPIKeysFromFile,
  saveImportedKeys,
} from "@/utils/apiKeyImporter";
import { debugAPIKeys } from "@/utils/debugAI";
import Modal from "@/components/Modal";

export default function AISettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
  });
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(
    null,
  );
  const [testPrompt, setTestPrompt] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileContent, setImportFileContent] = useState("");
  const [importFileName, setImportFileName] = useState("");

  useEffect(() => {
    // Load API keys from localStorage
    if (typeof window !== "undefined") {
      const openaiKey = localStorage.getItem("openai_api_key") || "";
      const anthropicKey = localStorage.getItem("anthropic_api_key") || "";
      setApiKeys({ openai: openaiKey, anthropic: anthropicKey });
      setIsAIConfigured(isAIAvailable() || !!openaiKey || !!anthropicKey);
    }

    // Load agents
    setAgents(getAllAgents());

    // Load pending actions
    setPendingActions(getPendingActions());
  }, []);

  const handleSaveAPIKeys = () => {
    if (typeof window !== "undefined") {
      try {
        if (apiKeys.openai && apiKeys.openai.trim()) {
          // Validate OpenAI key format
          if (!apiKeys.openai.startsWith("sk-") || apiKeys.openai.length < 20) {
            alert(
              'Invalid OpenAI API key format. Keys should start with "sk-" and be at least 20 characters.',
            );
            return;
          }
          localStorage.setItem("openai_api_key", apiKeys.openai.trim());
          console.log("OpenAI API key saved to localStorage");
        }
        if (apiKeys.anthropic && apiKeys.anthropic.trim()) {
          // Validate Anthropic key format
          if (
            !apiKeys.anthropic.startsWith("sk-ant-") ||
            apiKeys.anthropic.length < 20
          ) {
            alert(
              'Invalid Anthropic API key format. Keys should start with "sk-ant-" and be at least 20 characters.',
            );
            return;
          }
          localStorage.setItem("anthropic_api_key", apiKeys.anthropic.trim());
          console.log("Anthropic API key saved to localStorage");
        }

        // Verify keys were saved
        const savedOpenAI = localStorage.getItem("openai_api_key");
        const savedAnthropic = localStorage.getItem("anthropic_api_key");

        if (savedOpenAI || savedAnthropic) {
          setIsAIConfigured(true);
          alert(
            `✅ API keys saved successfully!\n\n${savedOpenAI ? "OpenAI: ✓" : ""} ${savedAnthropic ? "Anthropic: ✓" : ""}\n\nYou can now use AI features. No need to refresh!`,
          );
        } else {
          alert("⚠️ No API keys were saved. Please check your input.");
        }
      } catch (error: any) {
        console.error("Error saving API keys:", error);
        alert(`Error saving API keys: ${error.message}`);
      }
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportFileContent(content);

      // Auto-parse and import
      const importedKeys = importAPIKeysFromFile(content, file.name);
      if (importedKeys.openai || importedKeys.anthropic) {
        setApiKeys({
          openai: importedKeys.openai || apiKeys.openai,
          anthropic: importedKeys.anthropic || apiKeys.anthropic,
        });
        saveImportedKeys(importedKeys);
        alert(
          `✅ Imported API keys from ${file.name}!\n${importedKeys.openai ? "OpenAI: ✓" : ""} ${importedKeys.anthropic ? "Anthropic: ✓" : ""}`,
        );
        setShowImportModal(false);
      } else {
        setShowImportModal(true);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    const text = prompt("Paste your .env file content or config file content:");
    if (!text) return;

    const importedKeys = importAPIKeysFromFile(text, "pasted-content");
    if (importedKeys.openai || importedKeys.anthropic) {
      setApiKeys({
        openai: importedKeys.openai || apiKeys.openai,
        anthropic: importedKeys.anthropic || apiKeys.anthropic,
      });
      saveImportedKeys(importedKeys);
      alert(
        `✅ Imported API keys!\n${importedKeys.openai ? "OpenAI: ✓" : ""} ${importedKeys.anthropic ? "Anthropic: ✓" : ""}`,
      );
    } else {
      alert(
        "❌ No API keys found in the pasted content. Make sure it contains OPENAI_API_KEY or ANTHROPIC_API_KEY.",
      );
    }
  };

  const getClientAIKeys = (): { openai?: string; anthropic?: string } => {
    let keys: { openai?: string; anthropic?: string } = {};
    if (typeof window === "undefined") return keys;
    try {
      const openaiKey = localStorage.getItem("openai_api_key");
      const anthropicKey = localStorage.getItem("anthropic_api_key");
      if (
        openaiKey &&
        openaiKey.length > 20 &&
        openaiKey.startsWith("sk-") &&
        !openaiKey.includes("****")
      ) {
        keys.openai = openaiKey;
      }
      if (
        anthropicKey &&
        anthropicKey.length > 20 &&
        anthropicKey.startsWith("sk-ant-") &&
        !anthropicKey.includes("****")
      ) {
        keys.anthropic = anthropicKey;
      }
    } catch {
      // ignore
    }
    return keys;
  };

  const handleTestAI = async () => {
    if (!testPrompt.trim()) return;

    setIsTesting(true);
    setTestResponse("");

    try {
      const response = await callAI([{ role: "user", content: testPrompt }]);
      setTestResponse(response.content);
    } catch (error: any) {
      setTestResponse(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    try {
      await approveAction(actionId, "Current User");
      setPendingActions(getPendingActions());
      setShowActionModal(false);
      setSelectedAction(null);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleRejectAction = (actionId: string, reason?: string) => {
    try {
      rejectAction(actionId, "Current User", reason);
      setPendingActions(getPendingActions());
      setShowActionModal(false);
      setSelectedAction(null);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleExecuteAction = async (
    agentId: string,
    actionType: any,
    parameters: Record<string, any>,
  ) => {
    try {
      const action = await executeAgentAction(agentId, actionType, parameters);
      if (action.requiresApproval && action.status === "PENDING") {
        setPendingActions(getPendingActions());
        setSelectedAction(action);
        setShowActionModal(true);
      } else {
        alert(`Action executed: ${action.description}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const stats = [
    {
      label: "AI Available",
      value: isAIConfigured ? "Yes" : "No",
      icon: "ri-robot-line",
      tooltip: "AI API configured and available",
      trend: isAIConfigured ? ("up" as const) : ("down" as const),
    },
    {
      label: "Active Agents",
      value: agents.filter((a) => a.status === "ACTIVE").length,
      icon: "ri-group-line",
      tooltip: "Currently active AI agents",
      trend: "neutral" as const,
    },
    {
      label: "Total Agents",
      value: agents.length,
      icon: "ri-stack-line",
      tooltip: "Total configured agents",
      trend: "neutral" as const,
    },
    {
      label: "Pending Actions",
      value: pendingActions.length,
      icon: "ri-time-line",
      tooltip: "Actions awaiting approval",
      trend: pendingActions.length > 0 ? ("up" as const) : ("neutral" as const),
    },
  ];

  return (
    <PageTemplate
      title="AI & Agentic Settings"
      description="Configure AI providers, manage autonomous agents, and control agentic capabilities. Enable OpenAI, Anthropic Claude, and configure autonomous AI agents for intelligent automation."
      shortDescription="AI configuration and agentic capabilities"
      icon="ri-robot-line"
      stats={stats}
    >
      <div className="space-y-6">
        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-key-line text-cyan-400"></i>
            API Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKeys.openai}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, openai: e.target.value })
                }
                placeholder="sk-..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
              />
              <p className="text-xs text-[#6b7280] mt-1">
                Get your key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, anthropic: e.target.value })
                }
                placeholder="sk-ant-..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
              />
              <p className="text-xs text-[#6b7280] mt-1">
                Get your key from{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Anthropic Console
                </a>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveAPIKeys}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Save API Keys
              </button>
              <label className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".env,.json,.js,.ts,.txt"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <i className="ri-upload-line mr-2"></i>
                Import from File
              </label>
              <button
                onClick={handlePasteImport}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-file-paste-line mr-2"></i>
                Paste Config
              </button>
            </div>

            {isAIConfigured && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <i className="ri-checkbox-circle-line mr-2"></i>
                AI is configured and available
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Test */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-flask-line text-cyan-400"></i>
            Test AI Connection
          </h3>

          <div className="space-y-4">
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                onClick={handleTestAI}
                disabled={isTesting || !testPrompt.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? "Testing..." : "Test AI"}
              </button>
              <button
                onClick={async () => {
                  try {
                    const apiKeys = getClientAIKeys();
                    const headers: HeadersInit = {
                      "Content-Type": "application/json",
                    };
                    if (apiKeys.openai)
                      headers["x-openai-key"] = apiKeys.openai;
                    if (apiKeys.anthropic)
                      headers["x-anthropic-key"] = apiKeys.anthropic;

                    const response = await fetch("/api/ai/test-connection", {
                      method: "POST",
                      headers,
                      credentials: "include",
                      body: JSON.stringify({ provider: "auto" }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      alert(
                        `✅ ${result.provider.toUpperCase()} API is working!\n\nResponse: ${result.response}\nModel: ${result.model}\nTokens: ${result.tokensUsed || "N/A"}`,
                      );
                    } else {
                      alert(
                        `❌ API Test Failed\n\nError: ${result.error}\n\nDetails: ${JSON.stringify(result.details, null, 2)}\n\n${result.suggestion || ""}`,
                      );
                    }
                  } catch (error: any) {
                    alert(
                      `❌ Test Error: ${error.message}\n\nCheck browser console (F12) for details.`,
                    );
                    console.error("API test error:", error);
                  }
                }}
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-checkbox-circle-line mr-2"></i>
                Test Connection
              </button>
              <button
                onClick={() => {
                  debugAPIKeys();
                  alert("Debug info logged to browser console (F12)");
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-bug-line mr-2"></i>
                Debug Keys
              </button>
            </div>

            {testResponse && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-sm text-white whitespace-pre-wrap">
                  {testResponse}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-group-line text-cyan-400"></i>
            Autonomous Agents
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{agent.name}</h4>
                    <p className="text-xs text-[#9ca3af] mt-1">
                      {agent.description}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      agent.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : agent.status === "IDLE"
                          ? "bg-gray-500/20 text-gray-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {agent.status}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9ca3af]">Autonomy:</span>
                    <span className="text-white">
                      {agent.config.autonomyLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9ca3af]">Actions:</span>
                    <span className="text-white">
                      {agent.metrics.totalActions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9ca3af]">Success Rate:</span>
                    <span className="text-green-400">
                      {agent.metrics.totalActions > 0
                        ? (
                            (agent.metrics.successfulActions /
                              agent.metrics.totalActions) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-time-line text-yellow-400"></i>
              Pending Actions ({pendingActions.length})
            </h3>

            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedAction(action);
                    setShowActionModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">
                        {action.description}
                      </h4>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        Agent: {action.agentType} • Created:{" "}
                        {new Date(action.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveAction(action.id);
                        }}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectAction(action.id);
                        }}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Detail Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedAction(null);
        }}
        title={
          selectedAction
            ? `Action: ${selectedAction.description}`
            : "Action Details"
        }
        size="lg"
      >
        {selectedAction && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#9ca3af]">Agent</label>
              <p className="text-white">{selectedAction.agentType}</p>
            </div>
            <div>
              <label className="text-sm text-[#9ca3af]">Action Type</label>
              <p className="text-white">{selectedAction.actionType}</p>
            </div>
            <div>
              <label className="text-sm text-[#9ca3af]">Parameters</label>
              <pre className="bg-white/5 p-3 rounded-lg text-xs text-white overflow-auto">
                {JSON.stringify(selectedAction.parameters, null, 2)}
              </pre>
            </div>
            <div>
              <label className="text-sm text-[#9ca3af]">Status</label>
              <p className="text-white">{selectedAction.status}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleApproveAction(selectedAction.id)}
                className="flex-1 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Approve & Execute
              </button>
              <button
                onClick={() => handleRejectAction(selectedAction.id)}
                className="flex-1 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
