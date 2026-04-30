/**
 * System Admin Export Buttons
 * Beautiful export functionality for reports and data
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/utils/apiFetch";

interface ExportButtonsProps {
  section?: string;
  tenantId?: string;
}

export default function ExportButtons({
  section = "overview",
  tenantId = "default-tenant",
}: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exportData = async (format: "csv" | "json" | "pdf") => {
    setLoading(format);
    setSuccess(null);

    try {
      const url = `/api/system-admin/export?format=${format}&section=${section}&tenantId=${tenantId}`;

      if (format === "pdf") {
        // PDF export using HTML print
        try {
          const { exportToPDF } = await import("@/utils/exportUtils");

          // Fetch data for export
          const dataResponse = await fetch(
            `/api/system-admin/export?format=json&section=${section}&tenantId=${tenantId}`,
          );
          if (!dataResponse.ok) {
            throw new Error("Failed to fetch data");
          }

          const exportData = await dataResponse.json();

          await exportToPDF({
            data: Array.isArray(exportData) ? exportData : [exportData],
            filename: `system-admin-${section}`,
            title: `System Admin - ${section.charAt(0).toUpperCase() + section.slice(1)} Report`,
            companyName: "System Administration",
            includeTimestamp: true,
          });

          setSuccess("PDF exported successfully!");
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          console.error("PDF export error:", err);
          setSuccess("PDF export failed");
          setTimeout(() => setSuccess(null), 3000);
        } finally {
          setLoading(null);
        }
        return;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `system-admin-${section}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(`${format.toUpperCase()} exported successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    { id: "csv", label: "CSV", icon: "ri-file-excel-line", color: "green" },
    { id: "json", label: "JSON", icon: "ri-code-s-slash-line", color: "cyan" },
    { id: "pdf", label: "PDF", icon: "ri-file-pdf-line", color: "red" },
  ];

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs"
          >
            <i className="ri-check-line mr-2"></i>
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {exportOptions.map((option) => {
          const isLoading = loading === option.id;
          const colorClasses = {
            green:
              "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30",
            cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30",
            red: "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30",
          };

          return (
            <motion.button
              key={option.id}
              onClick={() => exportData(option.id as "csv" | "json" | "pdf")}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                colorClasses[option.color as keyof typeof colorClasses]
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <i className={option.icon}></i>
              )}
              <span className="text-sm font-medium">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
