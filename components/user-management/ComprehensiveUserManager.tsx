/**
 * 🎯 COMPREHENSIVE USER MANAGER
 * 
 * All-in-one user management interface with tabs for:
 * - Permissions
 * - API Keys
 * - Agents
 * - Billing
 * - Compliance
 * - Activity Log
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedUser } from "@/types/userManagement";
import PermissionManager from "@/components/permissions/PermissionManager";
import CustomerHierarchySelector from "./CustomerHierarchySelector";
import UserDataVisibilitySettings from "./UserDataVisibilitySettings";
import { UserDataVisibility } from "@/types/user";

export interface ComprehensiveUserManagerProps {
  user: EnhancedUser;
  onUpdate: (updates: Partial<EnhancedUser>) => void;
  readOnly?: boolean;
  className?: string;
}

type TabId =
  | "permissions"
  | "customers"
  | "api-keys"
  | "agents"
  | "billing"
  | "compliance"
  | "activity";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  badge?: number;
}

const ComprehensiveUserManager: React.FC<ComprehensiveUserManagerProps> = ({
  user,
  onUpdate,
  readOnly = false,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("permissions");

  const tabs: Tab[] = [
    {
      id: "permissions",
      label: "Permissions",
      icon: "ri-shield-user-line",
      badge: Array.isArray(user.hierarchicalPermissions) ? user.hierarchicalPermissions.length : 0,
    },
    {
      id: "customers",
      label: "Customers",
      icon: "ri-building-line",
      badge: user.assignedCustomers?.length || 0,
    },
    {
      id: "api-keys",
      label: "API Keys",
      icon: "ri-key-line",
      badge: user.apiKeys?.length || 0,
    },
    {
      id: "agents",
      label: "Agents",
      icon: "ri-robot-line",
      badge: user.assignedAgents?.length || 0,
    },
    {
      id: "billing",
      label: "Billing",
      icon: "ri-money-dollar-circle-line",
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: "ri-award-line",
      badge: user.complianceRecords?.length || 0,
    },
    {
      id: "activity",
      label: "Activity",
      icon: "ri-history-line",
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Header */}
      <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-semibold">
          {user.name?.charAt(0) || "U"}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
          <p className="text-sm text-[#9ca3af] mb-2">{user.email}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
              {user.role}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.status === "ACTIVE"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : user.status === "SUSPENDED"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }`}
            >
              {user.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "border-purple-500 text-white"
                    : "border-transparent text-[#9ca3af] hover:text-white hover:border-white/20"
                }
              `}
            >
              <i className={`${tab.icon} text-lg`}></i>
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <PermissionManager
              user={user}
              onPermissionsChange={(permissions) =>
                onUpdate({ hierarchicalPermissions: permissions })
              }
              readOnly={readOnly}
            />
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <CustomerHierarchySelector
                selectedCustomers={user.assignedCustomers || []}
                onChange={(customerIds) =>
                  onUpdate({ assignedCustomers: customerIds })
                }
                readOnly={readOnly}
              />

              {user.assignedCustomers && user.assignedCustomers.length > 0 && (
                <UserDataVisibilitySettings
                  visibility={
                    user.customerDataVisibility?.[user.assignedCustomers[0]] ||
                    {
                      canViewInventory: false,
                      canViewOrders: false,
                      canViewShipments: false,
                      canViewReports: false,
                      canViewFinancials: false,
                      canViewAllWarehouses: false,
                      canViewDocuments: false,
                      canExportData: false,
                    }
                  }
                  onChange={(visibility) => {
                    const newDataVisibility = {
                      ...user.customerDataVisibility,
                      [user.assignedCustomers![0]]: visibility,
                    };
                    onUpdate({ customerDataVisibility: newDataVisibility });
                  }}
                  readOnly={readOnly}
                />
              )}
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "api-keys" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">API Keys</h3>
                {!readOnly && (
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-cyan-600 transition-colors">
                    <i className="ri-add-line mr-2"></i>
                    Generate New Key
                  </button>
                )}
              </div>

              {!user.apiKeys || user.apiKeys.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <i className="ri-key-line text-4xl text-[#6b7280] mb-2"></i>
                  <p className="text-sm text-[#9ca3af]">No API keys configured</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white">{key.name}</div>
                          <div className="text-xs text-[#9ca3af] mt-1 font-mono">
                            {key.prefix}****
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            key.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {key.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === "agents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">AI Agents</h3>
                {!readOnly && (
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-cyan-600 transition-colors">
                    <i className="ri-add-line mr-2"></i>
                    Assign Agent
                  </button>
                )}
              </div>

              {!user.assignedAgents || user.assignedAgents.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <i className="ri-robot-line text-4xl text-[#6b7280] mb-2"></i>
                  <p className="text-sm text-[#9ca3af]">No agents assigned</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {user.assignedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-white">{agent.agentName}</div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            agent.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#9ca3af]">{agent.agentType}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-[#9ca3af]">Executions:</span>
                          <span className="text-white ml-1">{agent.executionCount}</span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Success Rate:</span>
                          <span className="text-white ml-1">{agent.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Billing Information</h3>

              {!user.billingInfo ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <i className="ri-money-dollar-circle-line text-4xl text-[#6b7280] mb-2"></i>
                  <p className="text-sm text-[#9ca3af]">No billing information configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-xs text-[#9ca3af] mb-1">Plan</div>
                      <div className="text-lg font-semibold text-white capitalize">
                        {user.billingInfo.plan}
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-xs text-[#9ca3af] mb-1">Status</div>
                      <div className="text-lg font-semibold text-white capitalize">
                        {user.billingInfo.status}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Compliance Records</h3>
                {!readOnly && (
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-cyan-600 transition-colors">
                    <i className="ri-add-line mr-2"></i>
                    Add Record
                  </button>
                )}
              </div>

              {!user.complianceRecords || user.complianceRecords.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <i className="ri-award-line text-4xl text-[#6b7280] mb-2"></i>
                  <p className="text-sm text-[#9ca3af]">No compliance records</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.complianceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {record.certificationName || record.type}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-1">
                            Type: {record.type}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            record.status === "compliant"
                              ? "bg-green-500/20 text-green-400"
                              : record.status === "non_compliant"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Activity Log</h3>

              {!user.activityLog || user.activityLog.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <i className="ri-history-line text-4xl text-[#6b7280] mb-2"></i>
                  <p className="text-sm text-[#9ca3af]">No activity logged</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.activityLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white">{entry.action}</div>
                          {entry.resource && (
                            <div className="text-xs text-[#9ca3af] mt-1">
                              {entry.resource} {entry.resourceId && `#${entry.resourceId}`}
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            entry.status === "success"
                              ? "bg-green-500/20 text-green-400"
                              : entry.status === "failure"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ComprehensiveUserManager;
