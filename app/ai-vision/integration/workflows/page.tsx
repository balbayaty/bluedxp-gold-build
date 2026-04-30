/**
 * Integration Workflows
 * Configure and manage automation workflows triggered by vision analysis
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function IntegrationWorkflowsPage() {
  const router = useRouter();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const workflows = [
    {
      id: "wf-1",
      name: "Critical Damage Workflow",
      trigger: "Damage severity == CRITICAL",
      actions: [
        { module: "ISO-IMS", action: "Create NCR", enabled: true },
        { module: "QHSE", action: "Create Incident", enabled: true },
        { module: "Customer", action: "Notify Customer", enabled: true },
        { module: "Liability", action: "Assess Liability", enabled: true },
      ],
      status: "active",
    },
    {
      id: "wf-2",
      name: "Safety Violation Workflow",
      trigger: "Safety issue detected",
      actions: [
        { module: "QHSE", action: "Create Incident", enabled: true },
        { module: "ISO-IMS", action: "Create CAPA", enabled: true },
        { module: "HR", action: "Notify Supervisor", enabled: false },
      ],
      status: "active",
    },
  ];

  return (
    <PageTemplate
      title="⚙️ Integration Workflows"
      description="Configure automation workflows that trigger actions across modules based on vision analysis"
      icon="ri-flow-chart-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Automation Workflows
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create Workflow
          </motion.button>
        </div>

        <div className="space-y-4">
          {workflows.map((workflow, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {workflow.name}
                  </h3>
                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30 mb-3">
                    <p className="text-blue-300 font-mono text-xs mb-1">
                      Trigger:
                    </p>
                    <p className="text-white">{workflow.trigger}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    workflow.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {workflow.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-white/60 text-sm mb-2">Actions:</p>
                {workflow.actions.map((action, actionIdx) => (
                  <div
                    key={actionIdx}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${action.enabled ? "bg-green-400" : "bg-gray-400"}`}
                      ></div>
                      <span className="text-white">{action.module}</span>
                      <span className="text-white/40">→</span>
                      <span className="text-white/70">{action.action}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 rounded text-xs ${
                        action.enabled
                          ? "bg-green-500/20 text-green-400 border border-green-500/50"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                      }`}
                    >
                      {action.enabled ? "Enabled" : "Disabled"}
                    </motion.button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm transition-all"
                >
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                >
                  Test
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all"
                >
                  View History
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}
