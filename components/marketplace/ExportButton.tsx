"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileJson } from "lucide-react";

interface ExportButtonProps {
  type: "listings" | "bookings" | "reviews" | "stats" | "provider";
  format?: "xlsx" | "pdf" | "csv" | "json";
  providerId?: string;
  periodStart?: string;
  periodEnd?: string;
  className?: string;
}

export default function ExportButton({
  type,
  format = "xlsx",
  providerId,
  periodStart,
  periodEnd,
  className = "",
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleExport = async (exportFormat: string) => {
    setExporting(true);
    setShowFormatMenu(false);

    try {
      const params = new URLSearchParams({
        type,
        format: exportFormat,
      });

      if (providerId) params.append("providerId", providerId);
      if (periodStart) params.append("periodStart", periodStart);
      if (periodEnd) params.append("periodEnd", periodEnd);

      const response = await fetch(
        `/api/marketplace/export?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketplace-${type}-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const formatIcons = {
    xlsx: FileSpreadsheet,
    pdf: FileText,
    csv: FileSpreadsheet,
    json: FileJson,
  };

  const FormatIcon =
    formatIcons[format as keyof typeof formatIcons] || Download;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={exporting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50"
      >
        <FormatIcon className="w-4 h-4" />
        <span>{exporting ? "Exporting..." : "Export"}</span>
      </button>

      {showFormatMenu && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 min-w-[150px]">
          <button
            onClick={() => handleExport("xlsx")}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>PDF (.pdf)</span>
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>CSV (.csv)</span>
          </button>
          <button
            onClick={() => handleExport("json")}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2"
          >
            <FileJson className="w-4 h-4 text-yellow-600" />
            <span>JSON (.json)</span>
          </button>
        </div>
      )}
    </div>
  );
}
