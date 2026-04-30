/**
 * Proposal Export Button
 *
 * Export proposals in multiple formats
 * PDF, DOCX, XLSX, HTML
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ExportFormat = "PDF" | "DOCX" | "XLSX" | "HTML";

interface ProposalExportButtonProps {
  proposalId: string;
  proposalTitle?: string;
  formats?: ExportFormat[];
  onExport?: (format: ExportFormat) => void;
  compact?: boolean;
}

export default function ProposalExportButton({
  proposalId,
  proposalTitle,
  formats = ["PDF", "DOCX", "XLSX", "HTML"],
  onExport,
  compact = false,
}: ProposalExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      const data = await response.json();

      if (data.success && data.downloadUrl) {
        // Download file
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = `${proposalTitle || "proposal"}.${format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onExport?.(format);
      }
    } catch (error) {
      console.error("Error exporting proposal:", error);
      alert("Error exporting proposal. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case "PDF":
        return "ri-file-pdf-line";
      case "DOCX":
        return "ri-file-word-line";
      case "XLSX":
        return "ri-file-excel-line";
      case "HTML":
        return "ri-file-code-line";
      default:
        return "ri-file-line";
    }
  };

  const getFormatColor = (format: ExportFormat) => {
    switch (format) {
      case "PDF":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "DOCX":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "XLSX":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "HTML":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={exporting !== null}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
        >
          {exporting ? (
            <>
              <i className="ri-loader-4-line animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <i className="ri-download-line" />
              Export
            </>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              <div className="p-2">
                {formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 transition-colors"
                  >
                    <i
                      className={`${getFormatIcon(format)} ${getFormatColor(format).split(" ")[0]}`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {format}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Export Proposal
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {formats.map((format) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={exporting === format}
            className={`p-4 border-2 rounded-lg transition-all ${
              exporting === format
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <i
                className={`${getFormatIcon(format)} text-3xl ${getFormatColor(format).split(" ")[0]}`}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format}
              </span>
              {exporting === format && (
                <i className="ri-loader-4-line animate-spin text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {exporting && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <i className="ri-loader-4-line animate-spin" />
            <span className="text-sm">Exporting to {exporting}...</span>
          </div>
        </div>
      )}
    </div>
  );
}
