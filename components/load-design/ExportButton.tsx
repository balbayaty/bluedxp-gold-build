/**
 * Export Button Component
 *
 * Provides export functionality for load plans and analytics
 */

"use client";

import { useState } from "react";
import { exportService } from "@/lib/services/load-design/export/exportService";
import type { LoadPlan, LoadAnalytics } from "@/types/load-design";

interface ExportButtonProps {
  type: "load-plan" | "analytics" | "load-plans";
  loadPlan?: LoadPlan;
  loadPlanId?: string;
  analytics?: LoadAnalytics;
  filters?: any;
  className?: string;
}

export default function ExportButton({
  type,
  loadPlan,
  loadPlanId,
  analytics,
  filters,
  className = "",
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"PDF" | "EXCEL" | "CSV">(
    "PDF",
  );

  const handleExport = async (format: "PDF" | "EXCEL" | "CSV") => {
    setExporting(true);
    setExportFormat(format);

    try {
      if (type === "load-plan" && (loadPlan || loadPlanId)) {
        if (loadPlan) {
          // Client-side export
          if (format === "PDF") {
            const blob = await exportService.exportLoadPlanToPDF(loadPlan, {
              format: "PDF",
              includeDetails: true,
            });
            exportService.downloadFile(
              blob,
              `load-plan-${loadPlan.loadNumber}.pdf`,
            );
          } else if (format === "CSV") {
            const blob = await exportService.exportLoadPlansToCSV([loadPlan]);
            exportService.downloadFile(
              blob,
              `load-plan-${loadPlan.loadNumber}.csv`,
            );
          }
        } else if (loadPlanId) {
          // Server-side export
          const response = await fetch("/api/load-design/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "load-plan",
              format,
              loadPlanId,
            }),
          });

          if (response.ok) {
            const blob = await response.blob();
            const filename =
              response.headers
                .get("Content-Disposition")
                ?.split("filename=")[1]
                ?.replace(/"/g, "") || `load-plan.${format.toLowerCase()}`;
            exportService.downloadFile(blob, filename);
          } else {
            throw new Error("Export failed");
          }
        }
      } else if (type === "analytics" && analytics) {
        if (format === "EXCEL") {
          const blob = await exportService.exportAnalyticsToExcel(analytics);
          exportService.downloadFile(
            blob,
            `analytics-${new Date().toISOString().split("T")[0]}.xlsx`,
          );
        } else if (format === "CSV") {
          // For analytics CSV, export the underlying load plans
          const response = await fetch("/api/load-design/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "analytics",
              format: "CSV",
              filters,
            }),
          });

          if (response.ok) {
            const blob = await response.blob();
            const filename =
              response.headers
                .get("Content-Disposition")
                ?.split("filename=")[1]
                ?.replace(/"/g, "") || `analytics.csv`;
            exportService.downloadFile(blob, filename);
          }
        }
      } else if (type === "load-plans" && filters) {
        const response = await fetch("/api/load-design/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "load-plans",
            format: "CSV",
            filters,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const filename =
            response.headers
              .get("Content-Disposition")
              ?.split("filename=")[1]
              ?.replace(/"/g, "") || `load-plans.csv`;
          exportService.downloadFile(blob, filename);
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport("PDF")}
          disabled={
            exporting || (type === "analytics" && exportFormat !== "PDF")
          }
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {exporting && exportFormat === "PDF" ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <i className="ri-file-pdf-line"></i>
              PDF
            </>
          )}
        </button>

        {(type === "analytics" || type === "load-plans") && (
          <>
            <button
              onClick={() => handleExport("EXCEL")}
              disabled={exporting || exportFormat !== "EXCEL"}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting && exportFormat === "EXCEL" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="ri-file-excel-2-line"></i>
                  Excel
                </>
              )}
            </button>

            <button
              onClick={() => handleExport("CSV")}
              disabled={exporting || exportFormat !== "CSV"}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting && exportFormat === "CSV" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="ri-file-text-line"></i>
                  CSV
                </>
              )}
            </button>
          </>
        )}

        {type === "load-plan" && (
          <button
            onClick={() => handleExport("CSV")}
            disabled={exporting || exportFormat !== "CSV"}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting && exportFormat === "CSV" ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <i className="ri-file-text-line"></i>
                CSV
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
