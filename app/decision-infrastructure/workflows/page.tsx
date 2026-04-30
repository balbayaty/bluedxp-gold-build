/**
 * Decision Workflows Page
 */

"use client";

import { useState } from "react";
import DecisionWorkflowBuilder from "@/components/decision/DecisionWorkflowBuilder";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

export default function DecisionWorkflowsPage() {
  const [module, setModule] = useState("hazalyze");
  const [entityType, setEntityType] = useState("msds");
  const notifications = useNotifications();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">
          Decision Workflow Builder
        </h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Module</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="hazalyze">Hazalyze</option>
              <option value="procurement">Procurement</option>
              <option value="route-ops">Route Operations</option>
              <option value="legal">Legal</option>
              <option value="wms">WMS</option>
              <option value="qhse">QHSE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Entity Type
            </label>
            <input
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="e.g., msds, purchase_order"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
      <DecisionWorkflowBuilder
        module={module}
        entityType={entityType}
        onSave={(workflow) => {
          notifications.success(
            NotificationPatterns.workflowSaved(workflow.name).title,
            NotificationPatterns.workflowSaved(workflow.name).message,
            NotificationPatterns.workflowSaved(workflow.name),
          );
        }}
      />
    </div>
  );
}
