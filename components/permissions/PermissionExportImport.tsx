"use client";

/**
 * 🔄 PERMISSION EXPORT/IMPORT COMPONENT
 *
 * UI for exporting and importing permission configurations
 */

import { useState } from "react";
import {
  permissionExportImport,
  type PermissionExport,
  type ImportResult,
  type ImportOptions,
} from "@/lib/services/permissions";

export default function PermissionExportImport() {
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    mode: "merge",
    conflictResolution: "ask",
    dryRun: false,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let exportData: PermissionExport | string;

      if (exportFormat === "json") {
        exportData = await permissionExportImport.exportToJSON({
          includeMetadata: true,
        });
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `permissions-export-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        exportData = await permissionExportImport.exportToCSV({});
        const blob = new Blob([exportData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `permissions-export-${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert("Please select a file to import");
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      let exportData: PermissionExport;

      if (importFile.name.endsWith(".json")) {
        exportData = JSON.parse(text) as PermissionExport;
      } else if (importFile.name.endsWith(".csv")) {
        const result = await permissionExportImport.importFromCSV(
          text,
          importOptions,
        );
        setImportResult(result);
        setIsImporting(false);
        return;
      } else {
        alert("Unsupported file format. Please use JSON or CSV.");
        setIsImporting(false);
        return;
      }

      const result = await permissionExportImport.importFromJSON(
        exportData,
        importOptions,
      );
      setImportResult(result);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check the file format and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Export Permissions</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) =>
                setExportFormat(e.target.value as "json" | "csv")
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Export Permissions"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Import Permissions</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Import File
            </label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Import Mode
            </label>
            <select
              value={importOptions.mode}
              onChange={(e) =>
                setImportOptions({
                  ...importOptions,
                  mode: e.target.value as "merge" | "replace" | "validate-only",
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="merge">Merge</option>
              <option value="replace">Replace</option>
              <option value="validate-only">Validate Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Conflict Resolution
            </label>
            <select
              value={importOptions.conflictResolution}
              onChange={(e) =>
                setImportOptions({
                  ...importOptions,
                  conflictResolution: e.target.value as
                    | "skip"
                    | "overwrite"
                    | "rename"
                    | "ask",
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="skip">Skip</option>
              <option value="overwrite">Overwrite</option>
              <option value="rename">Rename</option>
              <option value="ask">Ask</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="dryRun"
              checked={importOptions.dryRun || false}
              onChange={(e) =>
                setImportOptions({
                  ...importOptions,
                  dryRun: e.target.checked,
                })
              }
              className="mr-2"
            />
            <label htmlFor="dryRun">Dry Run (Preview Only)</label>
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || !importFile}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Import Permissions"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Import Results</h2>
          <div className="space-y-2">
            <div
              className={`p-4 rounded ${
                importResult.success
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <p className="font-semibold">
                {importResult.success ? "Import Successful" : "Import Failed"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Imported</p>
                <p className="text-2xl font-bold">
                  {importResult.imported.users +
                    importResult.imported.roles +
                    importResult.imported.templates}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Skipped</p>
                <p className="text-2xl font-bold">
                  {importResult.skipped.users +
                    importResult.skipped.roles +
                    importResult.skipped.templates}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {importResult.errors.length}
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">
                      {error.type}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.warnings.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Warnings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
