/**
 * React Hook for Export Service
 * This hook should only be used in client components
 */

"use client";

import { useState, useCallback } from "react";
import {
  exportService,
  type ExportConfig,
  type ExportResult,
} from "./exportService";

interface UseExportReturn {
  exporting: boolean;
  progress: number;
  lastResult: ExportResult | null;
  error: string | null;
  exportData: (config: ExportConfig) => Promise<ExportResult>;
  exportAndDownload: (config: ExportConfig) => Promise<ExportResult>;
  reset: () => void;
}

export function useExport(): UseExportReturn {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(
    async (config: ExportConfig): Promise<ExportResult> => {
      setExporting(true);
      setProgress(0);
      setError(null);

      try {
        setProgress(50);
        const result = await exportService.export(config);
        setProgress(100);
        setLastResult(result);

        if (!result.success) {
          setError(result.error || "Export failed");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Export failed";
        setError(errorMessage);
        setProgress(0);
        return {
          success: false,
          error: errorMessage,
          fileUrl: null,
          fileName: null,
          fileSize: 0,
          format: config.format,
        };
      } finally {
        setExporting(false);
      }
    },
    [],
  );

  const exportAndDownload = useCallback(
    async (config: ExportConfig): Promise<ExportResult> => {
      const result = await exportData(config);

      if (result.success && result.fileUrl) {
        // Trigger download
        const link = document.createElement("a");
        link.href = result.fileUrl;
        link.download = result.fileName || `export.${config.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      return result;
    },
    [exportData],
  );

  const reset = useCallback(() => {
    setExporting(false);
    setProgress(0);
    setLastResult(null);
    setError(null);
  }, []);

  return {
    exporting,
    progress,
    lastResult,
    error,
    exportData,
    exportAndDownload,
    reset,
  };
}
