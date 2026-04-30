/**
 * SKU Bulk Import/Export Component
 * Import and export SKUs in bulk
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

interface SKUBulkImportExportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SKUBulkImportExport({
  isOpen,
  onClose,
}: SKUBulkImportExportProps) {
  const notifications = useNotifications();
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await fetch("/api/wms/skus/bulk/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const results = await response.json();
      setImportResults(results);
    } catch (error) {
      console.error("Error importing SKUs:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to import SKUs";
      notifications.error(
        "Import Failed",
        errorMsg,
        NotificationPatterns.exportError(errorMsg),
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/wms/skus/bulk/export", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skus-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifications.success(
        NotificationPatterns.exportSuccess("CSV").title,
        NotificationPatterns.exportSuccess("CSV").message,
        NotificationPatterns.exportSuccess("CSV"),
      );
    } catch (error) {
      console.error("Error exporting SKUs:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to export SKUs";
      notifications.error(
        NotificationPatterns.exportError(errorMsg).title,
        NotificationPatterns.exportError(errorMsg).message,
        NotificationPatterns.exportError(errorMsg),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `SKU Code,Material Number,Material Description,Category,Material Type,Base Unit,Status,Weight,Volume,Standard Cost,Currency,Hazardous,Batch Managed,Serial Managed,Reorder Point,Max Stock,Safety Stock
SKU-001,MAT-001,Example Product,HAZMAT,FINISHED_GOOD,EA,ACTIVE,1.5,0.5,100.00,SAR,true,true,false,50,500,20`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sku-import-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import/Export SKUs"
      size="lg"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "import"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-[#9ca3af] hover:text-white"
            }`}
          >
            <i className="ri-upload-line mr-2"></i>
            Import
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "export"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-[#9ca3af] hover:text-white"
            }`}
          >
            <i className="ri-download-line mr-2"></i>
            Export
          </button>
        </div>

        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-blue-400 text-xl mt-0.5"></i>
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Import Instructions
                  </h4>
                  <ul className="text-sm text-[#9ca3af] space-y-1 list-disc list-inside">
                    <li>Download the template CSV file</li>
                    <li>Fill in your SKU data following the template format</li>
                    <li>Upload the CSV file to import SKUs</li>
                    <li>
                      Required fields: Material Description or SKU Code,
                      Category, Base Unit
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <i className="ri-file-download-line mr-2"></i>
                Download Template
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
              />
              {importFile && (
                <p className="mt-2 text-sm text-[#9ca3af]">
                  Selected: {importFile.name} (
                  {(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {importResults && (
              <div
                className={`p-4 rounded-lg ${
                  importResults.failed === 0
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-yellow-500/10 border border-yellow-500/20"
                }`}
              >
                <h4 className="text-white font-medium mb-2">Import Results</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Total Rows:</span>
                    <span className="text-white">{importResults.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Success:</span>
                    <span className="text-green-400">
                      {importResults.success}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9ca3af]">Failed:</span>
                    <span className="text-red-400">{importResults.failed}</span>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[#9ca3af] mb-1">Errors:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResults.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-400">
                            Row {error.row}: {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Importing...
                  </>
                ) : (
                  <>
                    <i className="ri-upload-line mr-2"></i>
                    Import SKUs
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === "export" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-blue-400 text-xl mt-0.5"></i>
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Export Information
                  </h4>
                  <p className="text-sm text-[#9ca3af]">
                    Export all SKUs to a CSV file. The file will include all SKU
                    details including codes, descriptions, categories, costs,
                    and inventory settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="ri-download-line mr-2"></i>
                    Export SKUs
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
