"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface WarehouseExportOptionsProps {
  warehouseId: string;
  warehouseName: string;
  onExport?: (format: "pdf" | "excel" | "csv") => void;
}

export default function WarehouseExportOptions({
  warehouseId,
  warehouseName,
  onExport,
}: WarehouseExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "pdf" | "excel" | "csv" | null
  >(null);

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      // Call API with lifecycle integration
      const response = await fetch(
        `/api/warehouse/${warehouseId}/export?format=${format}&includeLifecycle=true`,
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${warehouseName}-report-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv"}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: Create simple export
        const data = `Warehouse Report: ${warehouseName}\nGenerated: ${new Date().toLocaleString()}\n\nThis is a placeholder export. Full lifecycle-integrated reporting will be available in production.`;
        const blob = new Blob([data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${warehouseName}-report-${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      onExport?.(format);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-white">
          Export Warehouse Report
        </h4>
        <i className="ri-download-line text-gray-400"></i>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
            isExporting && exportFormat === "pdf"
              ? "bg-red-500/20 text-red-400"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {isExporting && exportFormat === "pdf" ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <i className="ri-file-pdf-line"></i>
              <span>PDF</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleExport("excel")}
          disabled={isExporting}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
            isExporting && exportFormat === "excel"
              ? "bg-green-500/20 text-green-400"
              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          }`}
        >
          {isExporting && exportFormat === "excel" ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <i className="ri-file-excel-line"></i>
              <span>Excel</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
            isExporting && exportFormat === "csv"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          }`}
        >
          {isExporting && exportFormat === "csv" ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <i className="ri-file-text-line"></i>
              <span>CSV</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
