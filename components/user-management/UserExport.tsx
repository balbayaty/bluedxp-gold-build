/**
 * 📤 USER EXPORT COMPONENT
 * 
 * Export users to various formats:
 * - CSV
 * - JSON
 * - Excel
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { EnhancedUser } from "@/types/userManagement";

interface UserExportProps {
  users: EnhancedUser[];
}

type ExportFormat = "csv" | "json" | "xlsx";

const UserExport: React.FC<UserExportProps> = ({ users }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [includeFields, setIncludeFields] = useState({
    basic: true,
    contact: true,
    permissions: false,
    activity: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = (): string => {
    const headers: string[] = [];
    
    if (includeFields.basic) {
      headers.push("ID", "Name", "Email", "Role", "Status", "Department");
    }
    if (includeFields.contact) {
      headers.push("Phone", "Mobile");
    }
    if (includeFields.permissions) {
      headers.push("Permissions Count", "Modules");
    }
    if (includeFields.activity) {
      headers.push("Last Login", "Created At");
    }

    const rows = users.map((user) => {
      const row: string[] = [];
      
      if (includeFields.basic) {
        row.push(
          user.id,
          user.name,
          user.email,
          user.role,
          user.status,
          user.department || ""
        );
      }
      if (includeFields.contact) {
        row.push(user.phone || "", user.mobile || "");
      }
      if (includeFields.permissions) {
        const permCount = Array.isArray(user.hierarchicalPermissions) 
          ? user.hierarchicalPermissions.length 
          : 0;
        const modules = Array.isArray(user.hierarchicalPermissions)
          ? [...new Set(user.hierarchicalPermissions.map((p) => p.moduleId))].join("; ")
          : "";
        row.push(String(permCount), modules);
      }
      if (includeFields.activity) {
        row.push(
          user.lastLogin ? new Date(user.lastLogin).toISOString() : "",
          user.createdAt ? new Date(user.createdAt).toISOString() : ""
        );
      }

      return row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  const generateJSON = (): string => {
    const exportData = users.map((user) => {
      const data: Record<string, any> = {};
      
      if (includeFields.basic) {
        data.id = user.id;
        data.name = user.name;
        data.email = user.email;
        data.role = user.role;
        data.status = user.status;
        data.department = user.department;
      }
      if (includeFields.contact) {
        data.phone = user.phone;
        data.mobile = user.mobile;
      }
      if (includeFields.permissions) {
        data.permissions = user.hierarchicalPermissions;
      }
      if (includeFields.activity) {
        data.lastLogin = user.lastLogin;
        data.createdAt = user.createdAt;
      }

      return data;
    });

    return JSON.stringify(exportData, null, 2);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case "json":
          content = generateJSON();
          mimeType = "application/json";
          extension = "json";
          break;
        case "csv":
        default:
          content = generateCSV();
          mimeType = "text/csv";
          extension = "csv";
          break;
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
      >
        <i className="ri-download-line mr-2"></i>
        Export
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Export Users"
        size="sm"
      >
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "csv", label: "CSV", icon: "ri-file-excel-line" },
                { id: "json", label: "JSON", icon: "ri-code-s-slash-line" },
                { id: "xlsx", label: "Excel", icon: "ri-file-excel-2-line", disabled: true },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => !opt.disabled && setFormat(opt.id as ExportFormat)}
                  disabled={opt.disabled}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    format === opt.id
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : opt.disabled
                      ? "bg-white/5 border-white/10 text-[#6b7280] cursor-not-allowed"
                      : "bg-white/5 border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  <i className={`${opt.icon} text-xl block mb-1`}></i>
                  <span className="text-xs">{opt.label}</span>
                  {opt.disabled && (
                    <span className="block text-[10px] text-[#6b7280]">Coming soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Include Fields
            </label>
            <div className="space-y-2">
              {[
                { id: "basic", label: "Basic Info", desc: "Name, Email, Role, Status" },
                { id: "contact", label: "Contact", desc: "Phone, Mobile" },
                { id: "permissions", label: "Permissions", desc: "Permission count, Modules" },
                { id: "activity", label: "Activity", desc: "Last login, Created date" },
              ].map((field) => (
                <label
                  key={field.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    includeFields[field.id as keyof typeof includeFields]
                      ? "bg-cyan-500/10 border-cyan-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeFields[field.id as keyof typeof includeFields]}
                    onChange={(e) =>
                      setIncludeFields((prev) => ({
                        ...prev,
                        [field.id]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-sm text-white">{field.label}</div>
                    <div className="text-xs text-[#9ca3af]">{field.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9ca3af]">Users to export:</span>
              <span className="text-white font-medium">{users.length}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="ri-download-line"></i>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserExport;
