/**
 * 🌳 DEEP PERMISSION TREE
 * 
 * World's most flexible 5-level permission system:
 * Level 1: Module (wms, tms, finance, etc.)
 * Level 2: Feature (wms.inbound, tms.shipments, etc.)
 * Level 3: Tab (wms.inbound.asn, tms.shipments.tracking, etc.)
 * Level 4: Action (read, write, delete, approve, etc.)
 * Level 5: Field (field-level permissions)
 * 
 * This enables billion-dollar monetization through granular access control.
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HierarchicalPermission as TypedHierarchicalPermission, PermissionScope, PermissionAction } from "@/types/permissions";
import { COMPLETE_MODULE_REGISTRY } from "@/lib/services/permissions/moduleRegistry";
import AdvancedRestrictions, { type AdvancedRestrictionsValue } from "./AdvancedRestrictions";

// ============================================================================
// TYPES (Using module registry types)
// ============================================================================

interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  description?: string;
  category?: string;
  premium?: boolean;
  features: FeatureDefinition[];
}

interface FeatureDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  premium?: boolean;
  tabs: TabDefinition[];
}

interface TabDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  premium?: boolean;
  fields?: FieldDefinition[];
}

interface FieldDefinition {
  id: string;
  name: string;
  sensitive?: boolean;
  pii?: boolean;
  financial?: boolean;
  type?: "text" | "number" | "date" | "boolean" | "select" | "json" | "currency" | "file" | "email" | "phone";
}

interface DeepPermissionTreeProps {
  permissions: TypedHierarchicalPermission[];
  onChange: (permissions: TypedHierarchicalPermission[]) => void;
  readOnly?: boolean;
  showFieldLevel?: boolean;
  showAdvancedOptions?: boolean;
  showRestrictions?: boolean; // Show time/location/device restrictions
  className?: string;
}

// ============================================================================
// AVAILABLE ACTIONS
// ============================================================================

const ACTIONS: { id: PermissionAction; name: string; icon: string; description: string }[] = [
  { id: "read", name: "Read", icon: "ri-eye-line", description: "View data" },
  { id: "create", name: "Create", icon: "ri-add-line", description: "Create new records" },
  { id: "update", name: "Update", icon: "ri-edit-line", description: "Edit existing records" },
  { id: "delete", name: "Delete", icon: "ri-delete-bin-line", description: "Remove records" },
  { id: "approve", name: "Approve", icon: "ri-check-double-line", description: "Approve requests" },
  { id: "export", name: "Export", icon: "ri-download-line", description: "Export data" },
  { id: "import", name: "Import", icon: "ri-upload-line", description: "Import data" },
  { id: "execute", name: "Execute", icon: "ri-play-line", description: "Run actions/scripts" },
  { id: "manage", name: "Manage", icon: "ri-settings-3-line", description: "Full management access" },
  { id: "configure", name: "Configure", icon: "ri-tools-line", description: "Configure settings" },
  { id: "assign", name: "Assign", icon: "ri-user-add-line", description: "Assign resources" },
  { id: "audit", name: "Audit", icon: "ri-file-search-line", description: "View audit logs" },
];

const SCOPES: { id: PermissionScope; name: string; description: string }[] = [
  { id: "ALL", name: "All", description: "All resources across tenants" },
  { id: "TENANT", name: "Tenant", description: "All resources in tenant" },
  { id: "ASSIGNED_CUSTOMERS", name: "Assigned Customers", description: "Only assigned customers" },
  { id: "ASSIGNED_WAREHOUSES", name: "Assigned Warehouses", description: "Only assigned warehouses" },
  { id: "OWN", name: "Own", description: "Only own resources" },
];

// ============================================================================
// USE COMPLETE MODULE REGISTRY (All 35+ modules from centralized service)
// ============================================================================

// Cast the imported registry to our local type for compatibility
const MODULE_STRUCTURE: ModuleDefinition[] = COMPLETE_MODULE_REGISTRY as ModuleDefinition[];

// LEGACY: Keeping for reference - actual data is in lib/services/permissions/moduleRegistry.ts
const _LEGACY_MODULE_STRUCTURE: ModuleDefinition[] = [
  {
    id: "wms",
    name: "Warehouse Management",
    icon: "ri-building-4-line",
    features: [
      {
        id: "inventory",
        name: "Inventory Management",
        tabs: [
          { id: "stock", name: "Stock Overview", fields: [
            { id: "sku", name: "SKU", type: "text" },
            { id: "quantity", name: "Quantity", type: "number" },
            { id: "location", name: "Location", type: "text" },
            { id: "cost", name: "Unit Cost", type: "number", sensitive: true },
          ]},
          { id: "locations", name: "Storage Locations" },
          { id: "adjustments", name: "Adjustments" },
          { id: "valuation", name: "Valuation", fields: [
            { id: "total_value", name: "Total Value", type: "number", sensitive: true },
            { id: "valuation_method", name: "Valuation Method", type: "select" },
          ]},
        ],
      },
      {
        id: "inbound",
        name: "Inbound Operations",
        tabs: [
          { id: "asn", name: "ASN Management" },
          { id: "receiving", name: "Receiving" },
          { id: "putaway", name: "Putaway" },
          { id: "quality", name: "Quality Check" },
        ],
      },
      {
        id: "outbound",
        name: "Outbound Operations",
        tabs: [
          { id: "orders", name: "Sales Orders" },
          { id: "picking", name: "Picking" },
          { id: "packing", name: "Packing" },
          { id: "shipping", name: "Shipping" },
        ],
      },
      {
        id: "customers",
        name: "Customer Management",
        tabs: [
          { id: "list", name: "Customer List" },
          { id: "contracts", name: "Contracts", fields: [
            { id: "rate", name: "Rate", type: "number", sensitive: true },
            { id: "terms", name: "Payment Terms", type: "text" },
          ]},
          { id: "pricing", name: "Pricing", fields: [
            { id: "storage_rate", name: "Storage Rate", type: "number", sensitive: true },
            { id: "handling_rate", name: "Handling Rate", type: "number", sensitive: true },
          ]},
        ],
      },
    ],
  },
  {
    id: "tms",
    name: "Transportation Management",
    icon: "ri-truck-line",
    features: [
      {
        id: "shipments",
        name: "Shipments",
        tabs: [
          { id: "list", name: "Shipment List" },
          { id: "tracking", name: "Tracking" },
          { id: "pod", name: "Proof of Delivery" },
          { id: "documents", name: "Documents" },
        ],
      },
      {
        id: "carriers",
        name: "Carrier Management",
        tabs: [
          { id: "list", name: "Carrier List" },
          { id: "rates", name: "Rate Cards", fields: [
            { id: "base_rate", name: "Base Rate", type: "number", sensitive: true },
            { id: "fuel_surcharge", name: "Fuel Surcharge", type: "number", sensitive: true },
          ]},
          { id: "contracts", name: "Contracts", fields: [
            { id: "contract_value", name: "Contract Value", type: "number", sensitive: true },
          ]},
          { id: "performance", name: "Performance" },
        ],
      },
      {
        id: "routes",
        name: "Route Planning",
        tabs: [
          { id: "planning", name: "Route Planning" },
          { id: "optimization", name: "Optimization" },
          { id: "zones", name: "Delivery Zones" },
        ],
      },
      {
        id: "freight",
        name: "Freight Management",
        tabs: [
          { id: "quotes", name: "Freight Quotes" },
          { id: "bookings", name: "Bookings" },
          { id: "invoices", name: "Freight Invoices", fields: [
            { id: "amount", name: "Invoice Amount", type: "number", sensitive: true },
          ]},
        ],
      },
    ],
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    icon: "ri-money-dollar-circle-line",
    features: [
      {
        id: "accounts_receivable",
        name: "Accounts Receivable",
        tabs: [
          { id: "invoices", name: "Invoices", fields: [
            { id: "amount", name: "Amount", type: "number", sensitive: true },
            { id: "customer", name: "Customer", type: "text" },
            { id: "due_date", name: "Due Date", type: "date" },
          ]},
          { id: "payments", name: "Payments", fields: [
            { id: "payment_amount", name: "Payment Amount", type: "number", sensitive: true },
            { id: "payment_method", name: "Payment Method", type: "select" },
          ]},
          { id: "aging", name: "Aging Report" },
          { id: "credit_notes", name: "Credit Notes" },
        ],
      },
      {
        id: "accounts_payable",
        name: "Accounts Payable",
        tabs: [
          { id: "bills", name: "Bills", fields: [
            { id: "amount", name: "Bill Amount", type: "number", sensitive: true },
          ]},
          { id: "payments", name: "Payments" },
          { id: "vendors", name: "Vendor Payments" },
        ],
      },
      {
        id: "general_ledger",
        name: "General Ledger",
        tabs: [
          { id: "accounts", name: "Chart of Accounts" },
          { id: "journals", name: "Journal Entries", fields: [
            { id: "debit", name: "Debit", type: "number", sensitive: true },
            { id: "credit", name: "Credit", type: "number", sensitive: true },
          ]},
          { id: "trial_balance", name: "Trial Balance" },
        ],
      },
      {
        id: "billing",
        name: "Billing",
        tabs: [
          { id: "invoicing", name: "Invoice Generation" },
          { id: "payment_methods", name: "Payment Methods" },
          { id: "subscriptions", name: "Subscriptions" },
          { id: "usage", name: "Usage Billing" },
        ],
      },
    ],
  },
  {
    id: "crm",
    name: "Customer Relationship Management",
    icon: "ri-customer-service-2-line",
    features: [
      {
        id: "accounts",
        name: "Accounts",
        tabs: [
          { id: "list", name: "Account List" },
          { id: "details", name: "Account Details" },
          { id: "hierarchy", name: "Account Hierarchy" },
        ],
      },
      {
        id: "contacts",
        name: "Contacts",
        tabs: [
          { id: "list", name: "Contact List" },
          { id: "communications", name: "Communications" },
        ],
      },
      {
        id: "opportunities",
        name: "Opportunities",
        tabs: [
          { id: "pipeline", name: "Pipeline" },
          { id: "forecasting", name: "Forecasting", fields: [
            { id: "deal_value", name: "Deal Value", type: "number", sensitive: true },
            { id: "probability", name: "Probability", type: "number" },
          ]},
        ],
      },
      {
        id: "leads",
        name: "Leads",
        tabs: [
          { id: "list", name: "Lead List" },
          { id: "scoring", name: "Lead Scoring" },
          { id: "conversion", name: "Conversion" },
        ],
      },
    ],
  },
  {
    id: "qhse",
    name: "Quality, Health, Safety, Environment",
    icon: "ri-shield-check-line",
    features: [
      {
        id: "incidents",
        name: "Incident Management",
        tabs: [
          { id: "list", name: "Incident List" },
          { id: "investigation", name: "Investigation" },
          { id: "corrective_actions", name: "Corrective Actions" },
        ],
      },
      {
        id: "audits",
        name: "Audits",
        tabs: [
          { id: "schedule", name: "Audit Schedule" },
          { id: "findings", name: "Findings" },
          { id: "reports", name: "Audit Reports" },
        ],
      },
      {
        id: "compliance",
        name: "Compliance",
        tabs: [
          { id: "requirements", name: "Requirements" },
          { id: "certifications", name: "Certifications" },
          { id: "training", name: "Training Records" },
        ],
      },
    ],
  },
  {
    id: "hr",
    name: "Human Resources",
    icon: "ri-team-line",
    features: [
      {
        id: "employees",
        name: "Employee Management",
        tabs: [
          { id: "directory", name: "Employee Directory" },
          { id: "personal", name: "Personal Info", fields: [
            { id: "salary", name: "Salary", type: "number", sensitive: true },
            { id: "ssn", name: "SSN/ID", type: "text", sensitive: true },
            { id: "bank_account", name: "Bank Account", type: "text", sensitive: true },
          ]},
          { id: "documents", name: "Documents" },
        ],
      },
      {
        id: "payroll",
        name: "Payroll",
        tabs: [
          { id: "processing", name: "Payroll Processing", fields: [
            { id: "gross_pay", name: "Gross Pay", type: "number", sensitive: true },
            { id: "net_pay", name: "Net Pay", type: "number", sensitive: true },
            { id: "deductions", name: "Deductions", type: "number", sensitive: true },
          ]},
          { id: "history", name: "Pay History" },
          { id: "taxes", name: "Tax Information" },
        ],
      },
      {
        id: "recruitment",
        name: "Recruitment",
        tabs: [
          { id: "jobs", name: "Job Postings" },
          { id: "applicants", name: "Applicants" },
          { id: "interviews", name: "Interviews" },
        ],
      },
    ],
  },
  {
    id: "settings",
    name: "System Settings",
    icon: "ri-settings-3-line",
    features: [
      {
        id: "users",
        name: "User Management",
        tabs: [
          { id: "list", name: "User List" },
          { id: "roles", name: "Roles & Permissions" },
          { id: "security", name: "Security Settings" },
          { id: "api_keys", name: "API Keys" },
        ],
      },
      {
        id: "organization",
        name: "Organization",
        tabs: [
          { id: "profile", name: "Organization Profile" },
          { id: "branding", name: "Branding" },
          { id: "billing", name: "Billing Settings" },
        ],
      },
      {
        id: "integrations",
        name: "Integrations",
        tabs: [
          { id: "connectors", name: "Connectors" },
          { id: "webhooks", name: "Webhooks" },
          { id: "api", name: "API Configuration" },
        ],
      },
    ],
  },
  // Add more modules as needed...
  {
    id: "gcc-compliance",
    name: "GCC Compliance",
    icon: "ri-shield-star-line",
    features: [
      {
        id: "regulations",
        name: "Regulations",
        tabs: [
          { id: "saudi", name: "Saudi Arabia" },
          { id: "uae", name: "UAE" },
          { id: "qatar", name: "Qatar" },
          { id: "kuwait", name: "Kuwait" },
        ],
      },
      {
        id: "permits",
        name: "Permits & Licenses",
        tabs: [
          { id: "applications", name: "Applications" },
          { id: "renewals", name: "Renewals" },
          { id: "documents", name: "Documents" },
        ],
      },
    ],
  },
  {
    id: "ai",
    name: "AI & Intelligent Orchestration",
    icon: "ri-brain-line",
    features: [
      {
        id: "copilot",
        name: "Copilot",
        tabs: [
          { id: "chat", name: "AI Chat" },
          { id: "suggestions", name: "Suggestions" },
          { id: "automation", name: "Automation" },
        ],
      },
      {
        id: "analytics",
        name: "Predictive Analytics",
        tabs: [
          { id: "forecasting", name: "Forecasting" },
          { id: "insights", name: "Insights" },
          { id: "recommendations", name: "Recommendations" },
        ],
      },
    ],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DeepPermissionTree: React.FC<DeepPermissionTreeProps> = ({
  permissions,
  onChange,
  readOnly = false,
  showFieldLevel = false,
  showAdvancedOptions = false,
  showRestrictions = true,
  className = "",
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState<PermissionScope>("TENANT");
  const [showRestrictionsPanel, setShowRestrictionsPanel] = useState(false);
  
  // Advanced restrictions state
  const [restrictions, setRestrictions] = useState<AdvancedRestrictionsValue>({
    timeRestrictions: [],
    locationRestrictions: [],
    deviceRestrictions: [],
    conditionalRestrictions: [],
  });

  // Toggle expansion
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleFeature = (featureKey: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureKey)) {
      newExpanded.delete(featureKey);
    } else {
      newExpanded.add(featureKey);
    }
    setExpandedFeatures(newExpanded);
  };

  const toggleTab = (tabKey: string) => {
    const newExpanded = new Set(expandedTabs);
    if (newExpanded.has(tabKey)) {
      newExpanded.delete(tabKey);
    } else {
      newExpanded.add(tabKey);
    }
    setExpandedTabs(newExpanded);
  };

  // Check if permission exists
  const hasPermission = useCallback((module: string, feature?: string, tab?: string, action?: PermissionAction, field?: string): boolean => {
    return permissions.some(p => {
      if (p.module !== module) return false;
      if (feature && p.feature !== feature) return false;
      if (tab && p.tab !== tab) return false;
      if (action && p.action !== action) return false;
      if (field && p.field !== field) return false;
      return true;
    });
  }, [permissions]);

  // Get actions for a specific level
  const getActionsForLevel = useCallback((module: string, feature?: string, tab?: string): PermissionAction[] => {
    return permissions
      .filter(p => {
        if (p.module !== module) return false;
        if (feature !== undefined && p.feature !== feature) return false;
        if (tab !== undefined && p.tab !== tab) return false;
        return true;
      })
      .map(p => p.action);
  }, [permissions]);

  // Toggle action at any level
  const toggleAction = useCallback((
    module: string, 
    action: PermissionAction, 
    feature?: string, 
    tab?: string, 
    field?: string
  ) => {
    if (readOnly) return;

    const existingIndex = permissions.findIndex(p => 
      p.module === module &&
      p.feature === feature &&
      p.tab === tab &&
      p.action === action &&
      p.field === field
    );

    let newPermissions: TypedHierarchicalPermission[];

    if (existingIndex >= 0) {
      // Remove permission
      newPermissions = permissions.filter((_, i) => i !== existingIndex);
    } else {
      // Add permission
      const newPerm: TypedHierarchicalPermission = {
        module: module as any,
        action,
        scope: selectedScope,
        ...(feature && { feature: feature as any }),
        ...(tab && { tab: tab as any }),
        ...(field && { field }),
      };
      newPermissions = [...permissions, newPerm];
    }

    onChange(newPermissions);
  }, [permissions, onChange, readOnly, selectedScope]);

  // Grant/revoke all actions at a level
  const setAllActions = useCallback((
    module: string,
    grant: boolean,
    feature?: string,
    tab?: string
  ) => {
    if (readOnly) return;

    // Remove existing permissions at this level
    let newPermissions = permissions.filter(p => {
      if (p.module !== module) return true;
      if (feature !== undefined && p.feature !== feature) return true;
      if (tab !== undefined && p.tab !== tab) return true;
      return false;
    });

    // If granting, add all actions
    if (grant) {
      const actionsToAdd: PermissionAction[] = ["read", "create", "update", "delete", "export"];
      actionsToAdd.forEach(action => {
        newPermissions.push({
          module: module as any,
          action,
          scope: selectedScope,
          ...(feature && { feature: feature as any }),
          ...(tab && { tab: tab as any }),
        });
      });
    }

    onChange(newPermissions);
  }, [permissions, onChange, readOnly, selectedScope]);

  // Filter modules by search
  const filteredModules = useMemo(() => {
    if (!searchQuery) return MODULE_STRUCTURE;
    
    const query = searchQuery.toLowerCase();
    return MODULE_STRUCTURE.filter(module => 
      module.name.toLowerCase().includes(query) ||
      module.id.toLowerCase().includes(query) ||
      module.features.some(f => 
        f.name.toLowerCase().includes(query) ||
        f.tabs.some(t => t.name.toLowerCase().includes(query))
      )
    );
  }, [searchQuery]);

  // Count permissions
  const totalPermissions = permissions.length;
  const moduleCount = new Set(permissions.map(p => p.module)).size;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-git-branch-line text-purple-400"></i>
            Deep Permission Control
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {totalPermissions} permissions across {moduleCount} modules
          </p>
        </div>

        {/* Scope Selector & Restrictions Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9ca3af]">Default Scope:</span>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as PermissionScope)}
              disabled={readOnly}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {SCOPES.map(scope => (
                <option key={scope.id} value={scope.id}>{scope.name}</option>
              ))}
            </select>
          </div>
          
          {showRestrictions && (
            <button
              onClick={() => setShowRestrictionsPanel(!showRestrictionsPanel)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showRestrictionsPanel
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
              }`}
            >
              <i className="ri-lock-line"></i>
              Restrictions
              {(restrictions.timeRestrictions.length + restrictions.locationRestrictions.length + restrictions.deviceRestrictions.length) > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/30 text-red-300 rounded text-xs">
                  {restrictions.timeRestrictions.length + restrictions.locationRestrictions.length + restrictions.deviceRestrictions.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Advanced Restrictions Panel */}
      <AnimatePresence>
        {showRestrictions && showRestrictionsPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <AdvancedRestrictions
                value={restrictions}
                onChange={setRestrictions}
                readOnly={readOnly}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
        <input
          type="text"
          placeholder="Search modules, features, tabs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#9ca3af] p-3 bg-white/5 rounded-lg">
        <span className="flex items-center gap-1">
          <i className="ri-folder-line text-cyan-400"></i> Module
        </span>
        <span className="flex items-center gap-1">
          <i className="ri-apps-line text-purple-400"></i> Feature
        </span>
        <span className="flex items-center gap-1">
          <i className="ri-window-line text-green-400"></i> Tab
        </span>
        {showFieldLevel && (
          <span className="flex items-center gap-1">
            <i className="ri-input-field text-yellow-400"></i> Field
          </span>
        )}
      </div>

      {/* Tree */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {filteredModules.map((module) => {
          const isModuleExpanded = expandedModules.has(module.id);
          const moduleActions = getActionsForLevel(module.id);
          const hasAnyPermission = moduleActions.length > 0;

          return (
            <div key={module.id} className="rounded-lg border border-white/10 overflow-hidden">
              {/* Module Level */}
              <div
                className={`
                  flex items-center justify-between p-3 cursor-pointer transition-colors
                  ${hasAnyPermission ? "bg-cyan-500/10" : "bg-white/5 hover:bg-white/10"}
                `}
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center gap-3">
                  <i className={`${module.icon} text-lg text-cyan-400`}></i>
                  <div>
                    <span className="text-sm font-medium text-white">{module.name}</span>
                    <span className="text-xs text-[#9ca3af] ml-2">({module.features.length} features)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAllActions(module.id, true); }}
                        className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                      >
                        Grant All
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAllActions(module.id, false); }}
                        className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                      >
                        Revoke All
                      </button>
                    </>
                  )}
                  <i className={`ri-arrow-${isModuleExpanded ? "up" : "down"}-s-line text-[#9ca3af]`}></i>
                </div>
              </div>

              {/* Features */}
              <AnimatePresence>
                {isModuleExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    {module.features.map((feature) => {
                      const featureKey = `${module.id}.${feature.id}`;
                      const isFeatureExpanded = expandedFeatures.has(featureKey);
                      const featureActions = getActionsForLevel(module.id, feature.id);
                      const hasFeaturePermission = featureActions.length > 0;

                      return (
                        <div key={feature.id} className="border-b border-white/5 last:border-b-0">
                          {/* Feature Level */}
                          <div
                            className={`
                              flex items-center justify-between p-3 pl-8 cursor-pointer transition-colors
                              ${hasFeaturePermission ? "bg-purple-500/10" : "hover:bg-white/5"}
                            `}
                            onClick={() => toggleFeature(featureKey)}
                          >
                            <div className="flex items-center gap-3">
                              <i className="ri-apps-line text-purple-400"></i>
                              <span className="text-sm text-white">{feature.name}</span>
                              <span className="text-xs text-[#9ca3af]">({feature.tabs.length} tabs)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Quick action buttons */}
                              {!readOnly && (
                                <div className="flex gap-1">
                                  {ACTIONS.slice(0, 5).map((action) => (
                                    <button
                                      key={action.id}
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        toggleAction(module.id, action.id, feature.id); 
                                      }}
                                      className={`
                                        w-6 h-6 rounded flex items-center justify-center text-xs transition-colors
                                        ${hasPermission(module.id, feature.id, undefined, action.id)
                                          ? "bg-purple-500/30 text-purple-300"
                                          : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                                        }
                                      `}
                                      title={action.name}
                                    >
                                      <i className={action.icon}></i>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <i className={`ri-arrow-${isFeatureExpanded ? "up" : "down"}-s-line text-[#9ca3af]`}></i>
                            </div>
                          </div>

                          {/* Tabs */}
                          <AnimatePresence>
                            {isFeatureExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                              >
                                {feature.tabs.map((tab) => {
                                  const tabKey = `${featureKey}.${tab.id}`;
                                  const isTabExpanded = expandedTabs.has(tabKey);
                                  const tabActions = getActionsForLevel(module.id, feature.id, tab.id);
                                  const hasTabPermission = tabActions.length > 0;

                                  return (
                                    <div key={tab.id} className="border-t border-white/5">
                                      {/* Tab Level */}
                                      <div
                                        className={`
                                          flex items-center justify-between p-3 pl-14 cursor-pointer transition-colors
                                          ${hasTabPermission ? "bg-green-500/10" : "hover:bg-white/5"}
                                        `}
                                        onClick={() => tab.fields && toggleTab(tabKey)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <i className="ri-window-line text-green-400"></i>
                                          <span className="text-sm text-white">{tab.name}</span>
                                          {tab.fields && (
                                            <span className="text-xs text-[#9ca3af]">({tab.fields.length} fields)</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {/* All action toggles */}
                                          {!readOnly && (
                                            <div className="flex gap-1 flex-wrap">
                                              {ACTIONS.map((action) => (
                                                <button
                                                  key={action.id}
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    toggleAction(module.id, action.id, feature.id, tab.id); 
                                                  }}
                                                  className={`
                                                    w-6 h-6 rounded flex items-center justify-center text-xs transition-colors
                                                    ${hasPermission(module.id, feature.id, tab.id, action.id)
                                                      ? "bg-green-500/30 text-green-300"
                                                      : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                                                    }
                                                  `}
                                                  title={action.name}
                                                >
                                                  <i className={action.icon}></i>
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                          {tab.fields && (
                                            <i className={`ri-arrow-${isTabExpanded ? "up" : "down"}-s-line text-[#9ca3af]`}></i>
                                          )}
                                        </div>
                                      </div>

                                      {/* Fields (Level 5) */}
                                      {showFieldLevel && tab.fields && isTabExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="p-3 pl-20 bg-yellow-500/5 space-y-2"
                                        >
                                          {tab.fields.map((field) => (
                                            <div
                                              key={field.id}
                                              className="flex items-center justify-between p-2 bg-white/5 rounded"
                                            >
                                              <div className="flex items-center gap-2">
                                                <i className="ri-input-field text-yellow-400 text-sm"></i>
                                                <span className="text-sm text-white">{field.name}</span>
                                                {field.sensitive && (
                                                  <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">
                                                    Sensitive
                                                  </span>
                                                )}
                                              </div>
                                              {!readOnly && (
                                                <div className="flex gap-1">
                                                  {["read", "update"].map((action) => (
                                                    <button
                                                      key={action}
                                                      onClick={() => toggleAction(module.id, action as PermissionAction, feature.id, tab.id, field.id)}
                                                      className={`
                                                        px-2 py-1 text-xs rounded transition-colors
                                                        ${hasPermission(module.id, feature.id, tab.id, action as PermissionAction, field.id)
                                                          ? "bg-yellow-500/30 text-yellow-300"
                                                          : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                                                        }
                                                      `}
                                                    >
                                                      {action}
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </motion.div>
                                      )}
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {totalPermissions > 0 && (
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <i className="ri-shield-check-line text-purple-400 text-xl"></i>
            <div className="flex-1">
              <div className="text-sm font-medium text-white mb-1">
                Permission Summary
              </div>
              <div className="text-xs text-[#9ca3af]">
                {totalPermissions} permissions configured across {moduleCount} module{moduleCount !== 1 ? "s" : ""}.
                Click on modules to expand and configure granular permissions down to the field level.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepPermissionTree;
