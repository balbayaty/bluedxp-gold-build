/**
 * 🚀 ROLE EDITOR COMPONENT
 *
 * Beautiful role creation and editing interface
 * Supports dynamic roles, templates, inheritance
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiSave,
  FiCopy,
  FiTrash2,
  FiPlus,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import PermissionMatrix from "./PermissionMatrix";
import type { HierarchicalPermission } from "@/types/permissions";

interface RoleEditorProps {
  roleId?: string;
  tenantId: string;
  onSave: (role: any) => void;
  onCancel: () => void;
  className?: string;
}

export default function RoleEditor({
  roleId,
  tenantId,
  onSave,
  onCancel,
  className = "",
}: RoleEditorProps) {
  const [loading, setLoading] = useState(!!roleId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    isSystemRole: false,
    parentRoleId: "",
    templateId: "",
    permissions: [] as HierarchicalPermission[],
    defaultScope: "TENANT" as const,
  });
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [roleId, tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load role if editing
      if (roleId) {
        const response = await fetch(`/api/roles/${roleId}`);
        const data = await response.json();
        if (data.success) {
          setFormData({
            name: data.data.name,
            displayName: data.data.displayName,
            description: data.data.description || "",
            isSystemRole: data.data.isSystemRole || false,
            parentRoleId: data.data.parentRoleId || "",
            templateId: data.data.templateId || "",
            permissions: (data.data.permissions ||
              []) as HierarchicalPermission[],
            defaultScope: data.data.defaultScope || "TENANT",
          });
        }
      }

      // Load available roles and templates
      const [rolesRes, templatesRes] = await Promise.all([
        fetch(`/api/roles?tenantId=${tenantId}`),
        fetch(`/api/permission-templates?tenantId=${tenantId}`),
      ]);

      const rolesData = await rolesRes.json();
      const templatesData = await templatesRes.json();

      setAvailableRoles(rolesData.data || []);
      setAvailableTemplates(templatesData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const url = roleId ? `/api/roles/${roleId}` : "/api/roles";
      const method = roleId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tenantId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSave(data.data);
      } else {
        alert(data.error || "Failed to save role");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleCloneFromTemplate = (templateId: string) => {
    const template = availableTemplates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        permissions: (template.permissions || []) as HierarchicalPermission[],
      });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {roleId ? "Edit Role" : "Create New Role"}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Define permissions and access levels for this role
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.displayName}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            {saving ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FiUsers className="w-5 h-5" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name (Internal) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., warehouse_manager"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Internal identifier (lowercase, underscores)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              placeholder="e.g., Warehouse Manager"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the role and its responsibilities..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Parent Role (Inheritance)
            </label>
            <select
              value={formData.parentRoleId}
              onChange={(e) =>
                setFormData({ ...formData, parentRoleId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None (Standalone Role)</option>
              {availableRoles
                .filter((r) => r.id !== roleId)
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Inherit permissions from parent role
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Scope
            </label>
            <select
              value={formData.defaultScope}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultScope: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Resources</option>
              <option value="TENANT">Tenant Only</option>
              <option value="ASSIGNED_CUSTOMERS">Assigned Customers</option>
              <option value="ASSIGNED_WAREHOUSES">Assigned Warehouses</option>
              <option value="ASSIGNED_REGIONS">Assigned Regions</option>
              <option value="OWN">Own Resources</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permission Templates */}
      {availableTemplates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Start from Template
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleCloneFromTemplate(template.id)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  formData.templateId === template.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {template.name}
                </div>
                {template.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {((template.permissions || []) as any[]).length} permissions
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FiShield className="w-5 h-5" />
          Permissions
        </h3>
        <PermissionMatrix
          userId=""
          permissions={formData.permissions}
          onChange={(permissions) => setFormData({ ...formData, permissions })}
          readOnly={false}
        />
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          Role Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Permissions
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formData.permissions.length}
            </div>
          </div>
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Modules
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {new Set(formData.permissions.map((p) => p.module)).size}
            </div>
          </div>
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Default Scope
            </div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {formData.defaultScope.replace("_", " ")}
            </div>
          </div>
          <div>
            <div className="text-blue-700 dark:text-blue-300 font-medium">
              Inheritance
            </div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {formData.parentRoleId ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
