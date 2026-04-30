/**
 * 🔐 PERMISSION MANAGER COMPONENT
 * 
 * Comprehensive permission management with hierarchical structure
 * Module → Feature → Tab → Action level permissions
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, HierarchicalPermission, ModuleId, Action } from "@/types/user";

export interface PermissionManagerProps {
  user: User;
  onPermissionsChange: (permissions: HierarchicalPermission[]) => void;
  readOnly?: boolean;
  className?: string;
}

// Module definitions - Dynamically populated with ALL your modules
const MODULE_STRUCTURE: Record<
  string,
  {
    name: string;
    icon: string;
    features: Record<string, { name: string; tabs?: Record<string, string> }>;
  }
> = {
  wms: {
    name: "Warehouse Management System",
    icon: "ri-building-4-line",
    features: {
      inventory: { name: "Inventory Management" },
      inbound: { name: "Inbound Operations" },
      outbound: { name: "Outbound Operations" },
      orders: { name: "Order Management" },
      picking: { name: "Picking Operations" },
      putaway: { name: "Putaway Operations" },
    },
  },
  tms: {
    name: "Transportation Management System",
    icon: "ri-truck-line",
    features: {
      shipments: { name: "Shipments" },
      tracking: { name: "Tracking & Visibility" },
      routes: { name: "Route Planning" },
      carriers: { name: "Carrier Management" },
      freight: { name: "Freight Management" },
    },
  },
  finance: {
    name: "Finance & Accounting",
    icon: "ri-money-dollar-circle-line",
    features: {
      accounts_payable: { name: "Accounts Payable" },
      accounts_receivable: { name: "Accounts Receivable" },
      general_ledger: { name: "General Ledger" },
    },
  },
  crm: {
    name: "Customer Relationship Management",
    icon: "ri-customer-service-2-line",
    features: {
      accounts: { name: "Accounts" },
      contacts: { name: "Contacts" },
      opportunities: { name: "Opportunities" },
      leads: { name: "Leads" },
    },
  },
  qhse: {
    name: "Quality, Health, Safety, Environment",
    icon: "ri-shield-check-line",
    features: {
      incidents: { name: "Incident Management" },
      audits: { name: "Audits" },
      compliance: { name: "Compliance Management" },
    },
  },
  "iso-ims": {
    name: "ISO Integrated Management System",
    icon: "ri-file-shield-2-line",
    features: {
      audit_management: { name: "Audit Management" },
      capa_management: { name: "CAPA Management" },
      training_management: { name: "Training Management" },
      document_center: { name: "Document Center" },
    },
  },
  msds: {
    name: "Material Safety Data Sheets",
    icon: "ri-flask-line",
    features: {
      msds: { name: "MSDS Database" },
      chemical_safety: { name: "Chemical Safety" },
      compatibility: { name: "Compatibility Check" },
    },
  },
  ai: {
    name: "AI & Intelligent Orchestration",
    icon: "ri-brain-line",
    features: {
      intelligent_orchestration: { name: "Intelligent Orchestration" },
      process_mining: { name: "Process Mining" },
      root_cause: { name: "Root Cause Analysis" },
      predictive: { name: "Predictive Analytics" },
    },
  },
  integration: {
    name: "System Integration",
    icon: "ri-link-m",
    features: {
      erp: { name: "ERP Integration" },
      edi: { name: "EDI Integration" },
      api: { name: "API Management" },
      carriers: { name: "Carrier Integration" },
    },
  },
  maas: {
    name: "Manufacturing as a Service",
    icon: "ri-settings-4-line",
    features: {
      manufacturing: { name: "Manufacturing" },
      production_orders: { name: "Production Orders" },
      work_orders: { name: "Work Orders" },
      shop_floor: { name: "Shop Floor Control" },
    },
  },
  "proposals-rfq": {
    name: "Proposals & RFQ",
    icon: "ri-file-list-3-line",
    features: {
      proposals: { name: "Proposals" },
      rfq: { name: "Request for Quotation" },
      services: { name: "Service Catalog" },
      rate_cards: { name: "Rate Cards" },
    },
  },
  procurement: {
    name: "Procurement",
    icon: "ri-shopping-cart-2-line",
    features: {
      purchase_orders: { name: "Purchase Orders" },
      vendors: { name: "Vendor Management" },
      sourcing: { name: "Strategic Sourcing" },
    },
  },
  "project-management": {
    name: "Project Management",
    icon: "ri-project-line",
    features: {
      projects: { name: "Projects" },
      tasks: { name: "Task Management" },
      planning: { name: "Project Planning" },
    },
  },
  "business-intelligence": {
    name: "Business Intelligence",
    icon: "ri-dashboard-line",
    features: {
      dashboard: { name: "BI Dashboard" },
      reports: { name: "Advanced Reports" },
      analytics: { name: "Analytics Engine" },
    },
  },
  "warehouse-network": {
    name: "Warehouse Network",
    icon: "ri-building-2-line",
    features: {
      network: { name: "Network Management" },
      transfers: { name: "Inter-warehouse Transfers" },
      optimization: { name: "Network Optimization" },
    },
  },
  "facility-management": {
    name: "Facility Management",
    icon: "ri-home-gear-line",
    features: {
      facilities: { name: "Facilities" },
      maintenance: { name: "Maintenance" },
      contracts: { name: "Contracts & Leases" },
    },
  },
  marketplace: {
    name: "Marketplace",
    icon: "ri-store-3-line",
    features: {
      listings: { name: "Service Listings" },
      orders: { name: "Marketplace Orders" },
      vendors: { name: "Vendor Management" },
    },
  },
  hr: {
    name: "Human Resources",
    icon: "ri-team-line",
    features: {
      employees: { name: "Employee Management" },
      payroll: { name: "Payroll" },
      recruitment: { name: "Recruitment" },
    },
  },
  customs: {
    name: "Customs & Regulatory",
    icon: "ri-government-line",
    features: {
      declarations: { name: "Customs Declarations" },
      compliance: { name: "Regulatory Compliance" },
      documents: { name: "Customs Documents" },
    },
  },
  settings: {
    name: "System Settings",
    icon: "ri-settings-3-line",
    features: {
      users: { name: "User Management" },
      parameters: { name: "System Parameters" },
      workflows: { name: "Workflow Configuration" },
      notifications: { name: "Notification Rules" },
    },
  },
  reports: {
    name: "Reports",
    icon: "ri-file-chart-line",
    features: {
      operational: { name: "Operational Reports" },
      inventory: { name: "Inventory Reports" },
      financial: { name: "Financial Reports" },
      custom: { name: "Custom Reports" },
    },
  },
  analytics: {
    name: "Analytics",
    icon: "ri-line-chart-line",
    features: {
      dashboard: { name: "Analytics Dashboard" },
      kpi: { name: "KPI Monitoring" },
      sla: { name: "SLA Analytics" },
    },
  },
  // Additional modules from navigation
  "trade-compliance": {
    name: "Trade Compliance",
    icon: "ri-global-line",
    features: {
      regulations: { name: "Trade Regulations" },
      screening: { name: "Party Screening" },
      licensing: { name: "Export Licensing" },
      sanctions: { name: "Sanctions Compliance" },
    },
  },
  "gcc-compliance": {
    name: "GCC Compliance",
    icon: "ri-shield-star-line",
    features: {
      saudi_regulations: { name: "Saudi Regulations" },
      gcc_standards: { name: "GCC Standards" },
      transport_permits: { name: "Transport Permits" },
      driver_requirements: { name: "Driver Requirements" },
    },
  },
  pulse: {
    name: "Pulse Monitoring",
    icon: "ri-pulse-line",
    features: {
      realtime: { name: "Real-time Monitoring" },
      alerts: { name: "Alert Management" },
      health: { name: "System Health" },
    },
  },
  "truth-engine": {
    name: "Truth Engine",
    icon: "ri-verified-badge-line",
    features: {
      verification: { name: "Data Verification" },
      validation: { name: "Document Validation" },
      audit_trail: { name: "Audit Trail" },
    },
  },
  "intelligence-analytics": {
    name: "Intelligence Analytics",
    icon: "ri-brain-line",
    features: {
      predictive: { name: "Predictive Analytics" },
      prescriptive: { name: "Prescriptive Analytics" },
      insights: { name: "Business Insights" },
    },
  },
  liability: {
    name: "Liability Management",
    icon: "ri-shield-cross-line",
    features: {
      insurance: { name: "Insurance Management" },
      claims: { name: "Claims Processing" },
      risk: { name: "Risk Assessment" },
    },
  },
  "export-house": {
    name: "Export House",
    icon: "ri-ship-line",
    features: {
      documentation: { name: "Export Documentation" },
      certificates: { name: "Certificates of Origin" },
      shipping: { name: "Shipping Instructions" },
    },
  },
  "dmarc-monitoring": {
    name: "DMARC Monitoring",
    icon: "ri-mail-check-line",
    features: {
      email_security: { name: "Email Security" },
      reports: { name: "DMARC Reports" },
      policies: { name: "Policy Management" },
    },
  },
  "ict-hardware": {
    name: "ICT Hardware Ecosystem",
    icon: "ri-server-line",
    features: {
      assets: { name: "Hardware Assets" },
      inventory: { name: "Hardware Inventory" },
      maintenance: { name: "Maintenance Schedule" },
    },
  },
  etw: {
    name: "e-Waybill (ETW)",
    icon: "ri-file-paper-2-line",
    features: {
      generation: { name: "e-Waybill Generation" },
      verification: { name: "e-Waybill Verification" },
      archive: { name: "e-Waybill Archive" },
    },
  },
  workspace: {
    name: "Workspace",
    icon: "ri-layout-grid-line",
    features: {
      dashboard: { name: "Personal Dashboard" },
      tasks: { name: "My Tasks" },
      notifications: { name: "Notifications" },
    },
  },
  "external-integrations": {
    name: "External Integrations",
    icon: "ri-plug-line",
    features: {
      connectors: { name: "Integration Connectors" },
      webhooks: { name: "Webhooks" },
      apis: { name: "API Management" },
    },
  },
  "digital-signature": {
    name: "Digital Signature",
    icon: "ri-quill-pen-line",
    features: {
      signing: { name: "Document Signing" },
      certificates: { name: "Digital Certificates" },
      verification: { name: "Signature Verification" },
    },
  },
  chemical: {
    name: "Chemical Management",
    icon: "ri-flask-line",
    features: {
      inventory: { name: "Chemical Inventory" },
      safety: { name: "Chemical Safety" },
      hazards: { name: "Hazard Management" },
    },
  },
};

const AVAILABLE_ACTIONS: Action[] = [
  "read",
  "read_only",
  "read_write",
  "write",
  "delete",
  "approve",
  "export",
  "import",
  "manage",
  "configure",
  "assign",
  "execute",
];

const ACTION_LABELS: Record<Action, string> = {
  read: "Read",
  read_only: "Read Only",
  read_write: "Read & Write",
  write: "Write",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
  import: "Import",
  manage: "Manage",
  configure: "Configure",
  assign: "Assign",
  execute: "Execute",
};

const PermissionManager: React.FC<PermissionManagerProps> = ({
  user,
  onPermissionsChange,
  readOnly = false,
  className = "",
}) => {
  // Ensure permissions is always an array
  const initialPermissions = Array.isArray(user.hierarchicalPermissions) 
    ? user.hierarchicalPermissions 
    : [];
  
  const [permissions, setPermissions] = useState<HierarchicalPermission[]>(initialPermissions);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");

  // Get permission for a specific module
  const getModulePermission = (moduleId: string): HierarchicalPermission | undefined => {
    if (!Array.isArray(permissions)) return undefined;
    return permissions.find(
      (p) => p.moduleId === moduleId && !p.featureId && !p.tabId
    );
  };

  // Check if module has any permissions
  const hasModulePermissions = (moduleId: string): boolean => {
    return permissions.some((p) => p.moduleId === moduleId);
  };

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Update module-level permission
  const updateModulePermission = (
    moduleId: string,
    access: "full" | "partial" | "read_only" | "none"
  ) => {
    if (readOnly) return;

    let newPermissions = Array.isArray(permissions) ? [...permissions] : [];

    if (access === "none") {
      // Remove all permissions for this module
      newPermissions = newPermissions.filter((p) => p.moduleId !== moduleId);
    } else {
      // Remove existing module-level permission
      newPermissions = newPermissions.filter(
        (p) => !(p.moduleId === moduleId && !p.featureId && !p.tabId)
      );

      // Determine actions based on access level
      let actions: Action[] = [];
      switch (access) {
        case "full":
          actions = ["read", "read_write", "write", "delete", "approve", "export", "import", "manage", "configure"];
          break;
        case "partial":
          actions = ["read", "read_write", "write", "export"];
          break;
        case "read_only":
          actions = ["read", "read_only", "export"];
          break;
      }

      // Add new permission
      newPermissions.push({
        moduleId: moduleId as ModuleId,
        moduleAccess: access,
        actions,
        scope: "TENANT",
      });
    }

    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  // Toggle specific action
  const toggleAction = (moduleId: string, action: Action) => {
    if (readOnly) return;

    let perm = getModulePermission(moduleId);
    let newPermissions = Array.isArray(permissions) ? [...permissions] : [];

    if (!perm) {
      // Create new permission with this action
      perm = {
        moduleId: moduleId as ModuleId,
        moduleAccess: "partial",
        actions: [action],
        scope: "TENANT",
      };
      newPermissions.push(perm);
    } else {
      // Update existing permission
      const hasAction = perm.actions.includes(action);
      const newActions = hasAction
        ? perm.actions.filter((a) => a !== action)
        : [...perm.actions, action];

      newPermissions = newPermissions.map((p) =>
        p.moduleId === moduleId && !p.featureId && !p.tabId
          ? { ...p, actions: newActions }
          : p
      );
    }

    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery) return Object.keys(MODULE_STRUCTURE);

    const query = searchQuery.toLowerCase();
    return Object.keys(MODULE_STRUCTURE).filter((moduleId) => {
      const module = MODULE_STRUCTURE[moduleId];
      return (
        module.name.toLowerCase().includes(query) ||
        moduleId.toLowerCase().includes(query) ||
        Object.values(module.features).some((f) =>
          f.name.toLowerCase().includes(query)
        )
      );
    });
  }, [searchQuery]);

  // Count active permissions
  const activePermissionsCount = Array.isArray(permissions) ? permissions.length : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-shield-user-line text-purple-400"></i>
            Permission Management
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {activePermissionsCount} permission{activePermissionsCount !== 1 ? "s" : ""} configured
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === "tree"
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-node-tree mr-1"></i>
              Tree
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-list-check mr-1"></i>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
        <input
          type="text"
          placeholder="Search modules, features..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Permissions List */}
      <div className="space-y-2">
        {filteredModules.map((moduleId) => {
          const module = MODULE_STRUCTURE[moduleId];
          const modulePerm = getModulePermission(moduleId);
          const isExpanded = expandedModules.has(moduleId);
          const hasPerms = hasModulePermissions(moduleId);

          return (
            <motion.div
              key={moduleId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                bg-white/5 border rounded-lg overflow-hidden transition-all
                ${hasPerms ? "border-purple-500/30" : "border-white/10"}
              `}
            >
              {/* Module Header */}
              <div
                className={`
                  flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors
                  ${readOnly ? "cursor-default" : ""}
                `}
                onClick={() => !readOnly && toggleModule(moduleId)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <i className={`${module.icon} text-xl text-purple-400`}></i>
                  <div>
                    <div className="font-medium text-white">{module.name}</div>
                    <div className="text-xs text-[#9ca3af]">{moduleId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Access Level Selector */}
                  {!readOnly && (
                    <select
                      value={modulePerm?.moduleAccess || "none"}
                      onChange={(e) =>
                        updateModulePermission(
                          moduleId,
                          e.target.value as any
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="none">No Access</option>
                      <option value="read_only">Read Only</option>
                      <option value="partial">Partial</option>
                      <option value="full">Full Access</option>
                    </select>
                  )}

                  {readOnly && modulePerm && (
                    <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                      {modulePerm.moduleAccess}
                    </span>
                  )}

                  {/* Expand Icon */}
                  <i
                    className={`ri-arrow-${isExpanded ? "up" : "down"}-s-line text-[#9ca3af] text-xl transition-transform`}
                  ></i>
                </div>
              </div>

              {/* Module Details - Features & Actions */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {/* Features */}
                      <div>
                        <div className="text-xs font-medium text-[#9ca3af] mb-2">
                          Features
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(module.features).map(([featureId, feature]) => {
                            const hasFeatureAccess = modulePerm?.actions?.length > 0;
                            return (
                              <div
                                key={featureId}
                                className={`
                                  px-3 py-2 rounded-lg border text-xs transition-all
                                  ${hasFeatureAccess 
                                    ? "bg-purple-500/10 border-purple-500/30 text-purple-300" 
                                    : "bg-white/5 border-white/10 text-[#9ca3af]"
                                  }
                                `}
                              >
                                <div className="font-medium">{feature.name}</div>
                                <div className="text-[10px] opacity-60">{featureId}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="text-xs font-medium text-[#9ca3af] mb-2">
                          Allowed Actions
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_ACTIONS.map((action) => {
                            const isActive = modulePerm?.actions?.includes(action) || false;
                            return (
                              <button
                                key={action}
                                onClick={() =>
                                  !readOnly && toggleAction(moduleId, action)
                                }
                                disabled={readOnly}
                                className={`
                                  px-3 py-1.5 rounded text-xs font-medium transition-all
                                  ${
                                    isActive
                                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                      : "bg-white/5 text-[#9ca3af] border border-white/10 hover:border-white/20"
                                  }
                                  ${readOnly ? "cursor-default" : "cursor-pointer"}
                                `}
                              >
                                {ACTION_LABELS[action]}
                                {isActive && (
                                  <i className="ri-check-line ml-1"></i>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Access Buttons */}
                      {!readOnly && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={() => updateModulePermission(moduleId, "full")}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-500/30 transition-colors"
                          >
                            Grant Full Access
                          </button>
                          <button
                            onClick={() => updateModulePermission(moduleId, "read_only")}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition-colors"
                          >
                            Read Only
                          </button>
                          <button
                            onClick={() => updateModulePermission(moduleId, "none")}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors"
                          >
                            Revoke Access
                          </button>
                        </div>
                      )}

                      {/* Scope */}
                      {modulePerm && (
                        <div>
                          <div className="text-xs font-medium text-[#9ca3af] mb-2">
                            Scope
                          </div>
                          <div className="text-sm text-white">
                            {modulePerm.scope || "TENANT"}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-search-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af]">No modules found</p>
        </div>
      )}

      {/* Summary */}
      {!readOnly && activePermissionsCount > 0 && (
        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-purple-400 text-xl mt-0.5"></i>
            <div className="flex-1">
              <div className="text-sm font-medium text-white mb-1">
                Permission Summary
              </div>
              <div className="text-xs text-[#9ca3af]">
                {activePermissionsCount} module{activePermissionsCount !== 1 ? "s" : ""} configured.
                Changes will be saved when you submit the form.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
