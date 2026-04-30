/**
 * Export Button Component
 *
 * Reusable export button for MaaS data
 * - Multiple format support
 * - Dropdown menu
 * - Loading states
 */

"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  File,
} from "lucide-react";
import { maasExportService } from "@/lib/services/maas/exportService";
import type { ExportFormat } from "@/lib/services/maas/exportService";

interface ExportButtonProps {
  data: any;
  filename?: string;
  formats?: ExportFormat[];
  onExport?: (format: ExportFormat) => void;
}

export default function ExportButton({
  data,
  filename = "maas-export",
  formats = ["csv", "json"],
  onExport,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setLoading(true);
      setShowMenu(false);

      maasExportService.exportDashboard({
        format,
        data,
        filename,
      });

      onExport?.(format);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatIcons = {
    csv: FileText,
    excel: FileSpreadsheet,
    json: FileJson,
    pdf: File,
  };

  const formatLabels = {
    csv: "CSV",
    excel: "Excel",
    json: "JSON",
    pdf: "PDF",
  };

  if (formats.length === 1) {
    const format = formats[0];
    const Icon = formatIcons[format] || Download;

    return (
      <button
        onClick={() => handleExport(format)}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Exporting...
          </>
        ) : (
          <>
            <Icon className="w-4 h-4" />
            Export {formatLabels[format]}
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-20">
            <div className="py-1">
              {formats.map((format) => {
                const Icon = formatIcons[format] || Download;
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    {formatLabels[format]}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
