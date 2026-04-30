/**
 * 🔍 PERMISSION SEARCH COMPONENT
 * 
 * Search and filter permissions:
 * - Full-text search
 * - Module filtering
 * - Action filtering
 * - Quick access
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HierarchicalPermission, ModuleId, Action } from "@/types/user";

interface PermissionSearchProps {
  permissions: HierarchicalPermission[];
  onSelect?: (permission: HierarchicalPermission) => void;
  onFilter?: (filtered: HierarchicalPermission[]) => void;
}

const ALL_MODULES: { id: ModuleId; name: string; icon: string }[] = [
  { id: "wms", name: "Warehouse Management", icon: "ri-building-2-line" },
  { id: "tms", name: "Transport Management", icon: "ri-truck-line" },
  { id: "finance", name: "Finance", icon: "ri-money-dollar-circle-line" },
  { id: "qhse", name: "QHSE", icon: "ri-shield-check-line" },
  { id: "crm", name: "CRM", icon: "ri-contacts-line" },
  { id: "proposals", name: "Proposals", icon: "ri-file-list-line" },
  { id: "settings", name: "Settings", icon: "ri-settings-3-line" },
  { id: "iso-ims", name: "ISO IMS", icon: "ri-award-line" },
  { id: "integrations", name: "Integrations", icon: "ri-plug-line" },
  { id: "trade-compliance", name: "Trade Compliance", icon: "ri-global-line" },
  { id: "facility", name: "Facility", icon: "ri-home-2-line" },
  { id: "procurement", name: "Procurement", icon: "ri-shopping-cart-line" },
  { id: "maas", name: "MaaS", icon: "ri-car-line" },
  { id: "analytics", name: "Analytics", icon: "ri-bar-chart-box-line" },
];

const ALL_ACTIONS: { id: Action; name: string; color: string }[] = [
  { id: "create", name: "Create", color: "green" },
  { id: "read", name: "Read", color: "blue" },
  { id: "update", name: "Update", color: "yellow" },
  { id: "delete", name: "Delete", color: "red" },
];

const PermissionSearch: React.FC<PermissionSearchProps> = ({
  permissions,
  onSelect,
  onFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModules, setSelectedModules] = useState<Set<ModuleId>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<Action>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let result = [...permissions];

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.moduleId.toLowerCase().includes(query) ||
          (p.featureId && p.featureId.toLowerCase().includes(query)) ||
          (p.tabId && p.tabId.toLowerCase().includes(query))
      );
    }

    // Module filter
    if (selectedModules.size > 0) {
      result = result.filter((p) => selectedModules.has(p.moduleId));
    }

    // Action filter
    if (selectedActions.size > 0) {
      result = result.filter(
        (p) => p.actions?.some((a) => selectedActions.has(a))
      );
    }

    // Notify parent
    if (onFilter) {
      onFilter(result);
    }

    return result;
  }, [permissions, searchQuery, selectedModules, selectedActions, onFilter]);

  // Toggle module filter
  const toggleModule = (moduleId: ModuleId) => {
    const newSet = new Set(selectedModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setSelectedModules(newSet);
  };

  // Toggle action filter
  const toggleAction = (action: Action) => {
    const newSet = new Set(selectedActions);
    if (newSet.has(action)) {
      newSet.delete(action);
    } else {
      newSet.add(action);
    }
    setSelectedActions(newSet);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedModules(new Set());
    setSelectedActions(new Set());
  };

  const hasActiveFilters = searchQuery || selectedModules.size > 0 || selectedActions.size > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
            >
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          <i className="ri-filter-3-line"></i>
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center">
              {selectedModules.size + selectedActions.size + (searchQuery ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
              {/* Module Filters */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Filter by Module
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_MODULES.slice(0, 8).map((module) => (
                    <button
                      key={module.id}
                      onClick={() => toggleModule(module.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                        selectedModules.has(module.id)
                          ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                          : "bg-white/5 border border-white/10 text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      <i className={module.icon}></i>
                      {module.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Filters */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Filter by Action
                </label>
                <div className="flex gap-2">
                  {ALL_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => toggleAction(action.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedActions.has(action.id)
                          ? action.color === "green"
                            ? "bg-green-500/20 border border-green-500/30 text-green-400"
                            : action.color === "blue"
                            ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                            : action.color === "yellow"
                            ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400"
                            : "bg-red-500/20 border border-red-500/30 text-red-400"
                          : "bg-white/5 border border-white/10 text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      {action.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#9ca3af]">
          {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? "s" : ""} found
        </span>
        {hasActiveFilters && (
          <span className="text-cyan-400">
            (filtered from {permissions.length})
          </span>
        )}
      </div>

      {/* Results List */}
      {filteredPermissions.length > 0 ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredPermissions.map((perm, index) => {
            const module = ALL_MODULES.find((m) => m.id === perm.moduleId);

            return (
              <motion.div
                key={`${perm.moduleId}-${perm.featureId || ""}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onSelect?.(perm)}
                className={`p-3 rounded-lg border bg-white/5 border-white/10 transition-colors ${
                  onSelect ? "cursor-pointer hover:border-cyan-500/30" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <i className={`${module?.icon || "ri-folder-line"} text-cyan-400`}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium capitalize">
                          {perm.moduleId.replace(/-/g, " ")}
                        </span>
                        {perm.featureId && (
                          <>
                            <span className="text-[#6b7280]">→</span>
                            <span className="text-[#9ca3af] capitalize">
                              {perm.featureId.replace(/-/g, " ")}
                            </span>
                          </>
                        )}
                        {perm.tabId && (
                          <>
                            <span className="text-[#6b7280]">→</span>
                            <span className="text-[#6b7280] capitalize text-xs">
                              {perm.tabId.replace(/-/g, " ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {perm.actions?.map((action) => {
                      const actionConfig = ALL_ACTIONS.find((a) => a.id === action);
                      return (
                        <span
                          key={action}
                          className={`px-2 py-0.5 rounded text-xs capitalize ${
                            action === "create"
                              ? "bg-green-500/20 text-green-400"
                              : action === "read"
                              ? "bg-blue-500/20 text-blue-400"
                              : action === "update"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {action}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl">
          <i className="ri-search-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af]">No permissions match your filters</p>
        </div>
      )}
    </div>
  );
};

export default PermissionSearch;
