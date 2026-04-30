/**
 * Permission Builder Component
 *
 * Visual builder for creating hierarchical permissions
 * with intelligent suggestions and validation
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
  Action,
} from "@/types/user";
import { RiAddLine, RiCloseLine, RiCheckLine } from "react-icons/ri";

interface PermissionBuilderProps {
  onPermissionCreate: (permission: HierarchicalPermission) => void;
  onCancel: () => void;
}

const MODULES: { id: ModuleId; label: string }[] = [
  { id: "WMS", label: "Warehouse Management" },
  { id: "TMS", label: "Transportation Management" },
  { id: "COMPLIANCE", label: "Compliance" },
  { id: "USER_MANAGEMENT", label: "User Management" },
  { id: "SYSTEM_SETTINGS", label: "System Settings" },
  { id: "BILLING", label: "Billing" },
  { id: "SECURITY", label: "Security" },
];

const ACTIONS: {
  id: Action;
  label: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}[] = [
  { id: "read", label: "Read", risk: "LOW" },
  { id: "write", label: "Write", risk: "MEDIUM" },
  { id: "delete", label: "Delete", risk: "CRITICAL" },
  { id: "approve", label: "Approve", risk: "HIGH" },
  { id: "export", label: "Export", risk: "MEDIUM" },
  { id: "import", label: "Import", risk: "MEDIUM" },
  { id: "manage", label: "Manage", risk: "HIGH" },
  { id: "configure", label: "Configure", risk: "HIGH" },
];

const SCOPES = [
  { id: "ALL", label: "All Resources", description: "Access to all resources" },
  { id: "TENANT", label: "Tenant", description: "Access within tenant" },
  {
    id: "ASSIGNED_CUSTOMERS",
    label: "Assigned Customers",
    description: "Only assigned customers",
  },
  {
    id: "ASSIGNED_WAREHOUSES",
    label: "Assigned Warehouses",
    description: "Only assigned warehouses",
  },
  { id: "OWN", label: "Own", description: "Only own resources" },
];

export default function PermissionBuilder({
  onPermissionCreate,
  onCancel,
}: PermissionBuilderProps) {
  const [moduleId, setModuleId] = useState<ModuleId | undefined>();
  const [featureId, setFeatureId] = useState<FeatureId | undefined>();
  const [tabId, setTabId] = useState<TabId | undefined>();
  const [moduleAccess, setModuleAccess] = useState<
    "full" | "partial" | "read_only" | "none"
  >("full");
  const [featureAccess, setFeatureAccess] = useState<
    "full" | "partial" | "read_only" | "none"
  >("full");
  const [tabAccess, setTabAccess] = useState<
    "full" | "partial" | "read_only" | "none"
  >("full");
  const [selectedActions, setSelectedActions] = useState<Action[]>(["read"]);
  const [scope, setScope] = useState<string>("TENANT");

  const handleActionToggle = (action: Action) => {
    setSelectedActions((prev) =>
      prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action],
    );
  };

  const handleCreate = () => {
    if (!moduleId || selectedActions.length === 0) {
      return;
    }

    const permission: HierarchicalPermission = {
      moduleId,
      moduleAccess,
      featureId,
      featureAccess,
      tabId,
      tabAccess,
      actions: selectedActions,
      scope: scope as any,
    };

    onPermissionCreate(permission);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0e14] border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Create Permission
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Module Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module *
            </label>
            <select
              value={moduleId || ""}
              onChange={(e) => setModuleId(e.target.value as ModuleId)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Module</option>
              {MODULES.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>

          {/* Module Access Level */}
          {moduleId && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Module Access Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["full", "partial", "read_only", "none"] as const).map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() => setModuleAccess(level)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        moduleAccess === level
                          ? "bg-blue-500 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {level.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Actions *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map((action) => {
                const isSelected = selectedActions.includes(action.id);
                const riskColor = {
                  LOW: "border-green-500/50",
                  MEDIUM: "border-yellow-500/50",
                  HIGH: "border-orange-500/50",
                  CRITICAL: "border-red-500/50",
                }[action.risk];

                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionToggle(action.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-500/20 border-2 border-blue-500 text-white"
                        : `bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 ${riskColor}`
                    }`}
                  >
                    <span>{action.label}</span>
                    {isSelected && <RiCheckLine className="text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SCOPES.map((scopeOption) => (
                <option key={scopeOption.id} value={scopeOption.id}>
                  {scopeOption.label} - {scopeOption.description}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleCreate}
              disabled={!moduleId || selectedActions.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Permission
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
