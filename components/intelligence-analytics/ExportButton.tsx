/**
 * Export Button Component
 * Exports intelligence data in various formats
 */

"use client";

import { useState } from "react";

interface ExportButtonProps {
  type: "root-cause" | "data-mining" | "process-mining" | "analytics";
  ids?: string[];
  tenantId: string;
  className?: string;
}

export default function ExportButton({
  type,
  ids = [],
  tenantId,
  className,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/intelligence/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          format: exportFormat,
          ids,
          tenantId,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `intelligence-${type}-${Date.now()}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value as "json" | "csv")}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
        disabled={exporting}
      >
        <option value="json">JSON</option>
        <option value="csv">CSV</option>
      </select>
      <button
        onClick={handleExport}
        disabled={exporting || (ids.length === 0 && type === "root-cause")}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <>
            <i className="ri-loader-4-line animate-spin mr-2"></i>
            Exporting...
          </>
        ) : (
          <>
            <i className="ri-download-line mr-2"></i>
            Export
          </>
        )}
      </button>
    </div>
  );
}
