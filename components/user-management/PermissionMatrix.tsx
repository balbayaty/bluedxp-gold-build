/**
 * 🚀 PERMISSION MATRIX COMPONENT
 *
 * Beautiful visual permission matrix for managing 5-level permissions
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiLock,
  FiUnlock,
  FiAlertTriangle,
} from "react-icons/fi";
import type { HierarchicalPermission } from "@/types/permissions";

interface PermissionMatrixProps {
  userId: string;
  permissions: HierarchicalPermission[];
  onChange: (permissions: HierarchicalPermission[]) => void;
  readOnly?: boolean;
  className?: string;
}

const MODULES = ["wms", "tms", "iso-ims", "compliance", "settings", "reports"];
const ACTIONS = ["read", "write", "delete", "approve", "export", "manage"];
const SCOPES = [
  "ALL",
  "TENANT",
  "ASSIGNED_CUSTOMERS",
  "ASSIGNED_WAREHOUSES",
  "ASSIGNED_REGIONS",
  "OWN",
];

export default function PermissionMatrix({
  userId,
  permissions,
  onChange,
  readOnly = false,
  className = "",
}: PermissionMatrixProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(MODULES),
  );
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "tree" | "list">(
    "matrix",
  );

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const togglePermission = (module: string, action: string, scope: string) => {
    if (readOnly) return;

    const key = `${module}:${action}:${scope}`;
    const existing = permissions.find(
      (p) => p.module === module && p.action === action && p.scope === scope,
    );

    const newPermissions = existing
      ? permissions.filter(
          (p) =>
            !(p.module === module && p.action === action && p.scope === scope),
        )
      : [
          ...permissions,
          {
            module,
            action,
            scope: scope as any,
          } as HierarchicalPermission,
        ];

    onChange(newPermissions);
  };

  const hasPermission = (
    module: string,
    action: string,
    scope: string,
  ): boolean => {
    return permissions.some(
      (p) => p.module === module && p.action === action && p.scope === scope,
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("matrix")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "matrix"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            Matrix View
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "tree"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            List View
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {permissions.length} permissions
        </div>
      </div>

      {/* Matrix View */}
      {viewMode === "matrix" && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                    Module / Action
                  </th>
                  {SCOPES.map((scope) => (
                    <th
                      key={scope}
                      className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[120px]"
                    >
                      {scope.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {MODULES.map((module) => (
                  <React.Fragment key={module}>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td
                        className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 cursor-pointer"
                        onClick={() => toggleModule(module)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedModules.has(module) ? (
                            <FiChevronDown className="w-4 h-4" />
                          ) : (
                            <FiChevronRight className="w-4 h-4" />
                          )}
                          <span className="uppercase">{module}</span>
                        </div>
                      </td>
                      {SCOPES.map((scope) => (
                        <td key={scope} className="px-4 py-3"></td>
                      ))}
                    </tr>
                    {expandedModules.has(module) &&
                      ACTIONS.map((action) => (
                        <tr
                          key={`${module}-${action}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-2 pl-8 text-sm text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-900 z-10">
                            {action}
                          </td>
                          {SCOPES.map((scope) => {
                            const hasPerm = hasPermission(
                              module,
                              action,
                              scope,
                            );
                            return (
                              <td key={scope} className="px-4 py-2 text-center">
                                <button
                                  onClick={() =>
                                    togglePermission(module, action, scope)
                                  }
                                  disabled={readOnly}
                                  className={`
                                  w-8 h-8 rounded flex items-center justify-center transition-colors
                                  ${
                                    hasPerm
                                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                  }
                                  ${!readOnly && "hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"}
                                  ${readOnly && "cursor-not-allowed"}
                                `}
                                >
                                  {hasPerm ? (
                                    <FiCheck className="w-4 h-4" />
                                  ) : (
                                    <FiX className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tree View */}
      {viewMode === "tree" && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-2">
          {MODULES.map((module) => (
            <div key={module} className="space-y-1">
              <button
                onClick={() => toggleModule(module)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {expandedModules.has(module) ? (
                  <FiChevronDown className="w-4 h-4" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
                <span className="font-semibold uppercase">{module}</span>
              </button>
              {expandedModules.has(module) && (
                <div className="ml-6 space-y-1">
                  {ACTIONS.map((action) => (
                    <div key={action} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                        {action}
                      </span>
                      <div className="flex gap-1">
                        {SCOPES.map((scope) => {
                          const hasPerm = hasPermission(module, action, scope);
                          return (
                            <button
                              key={scope}
                              onClick={() =>
                                togglePermission(module, action, scope)
                              }
                              disabled={readOnly}
                              className={`
                                px-2 py-1 text-xs rounded transition-colors
                                ${
                                  hasPerm
                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                }
                                ${!readOnly && "hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"}
                                ${readOnly && "cursor-not-allowed"}
                              `}
                            >
                              {scope.replace("_", " ")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {permissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No permissions assigned
            </div>
          ) : (
            permissions.map((perm, index) => (
              <div
                key={index}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {perm.module.toUpperCase()} / {perm.action}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Scope: {perm.scope.replace("_", " ")}
                      {perm.feature && ` • Feature: ${perm.feature}`}
                      {perm.tab && ` • Tab: ${perm.tab}`}
                    </div>
                  </div>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => {
                      const newPermissions = permissions.filter(
                        (_, i) => i !== index,
                      );
                      onChange(newPermissions);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <FiAlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
            Permission Summary
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Total Permissions
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {permissions.length}
            </div>
          </div>
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Modules
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {new Set(permissions.map((p) => p.module)).size}
            </div>
          </div>
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Scopes
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {new Set(permissions.map((p) => p.scope)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
