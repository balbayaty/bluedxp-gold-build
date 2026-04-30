/**
 * Enhanced Batch Job Monitor Component
 *
 * Unified, collapsible component that combines ProcessingQueue and Batch Job Monitor
 * with smart state management, persistence, and beautiful UI/UX.
 *
 * Features:
 * - Collapsible sections with state persistence (localStorage)
 * - Smart defaults (auto-collapse completed, expand active)
 * - Beautiful animations and transitions
 * - Summary view when collapsed
 * - Full details when expanded
 * - Persists across page refreshes
 *
 * @module components/msds/BatchJobMonitor
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProcessingQueue from "./ProcessingQueue";

export interface BatchJobMonitorProps {
  /**
   * Job ID to monitor
   */
  jobId?: string | null;

  /**
   * Tenant ID for multi-tenant support
   */
  tenantId: string;

  /**
   * User ID for notifications
   */
  userId: string;

  /**
   * Module identifier (e.g., 'msds')
   */
  moduleId: string;

  /**
   * API endpoint to fetch job status
   */
  jobApiEndpoint?: string;

  /**
   * Polling interval in milliseconds
   */
  pollInterval?: number;

  /**
   * Enable real-time updates via event bus
   */
  enableEventBus?: boolean;

  /**
   * Initial job data (optional)
   */
  initialJobData?: any;

  /**
   * Disable polling if job is completed/failed
   */
  disablePollingIfComplete?: boolean;

  /**
   * System health information
   */
  systemHealth?: {
    ai?: {
      mode?: string;
      activeProvider?: string;
    };
    ocr?: {
      pdfOcrAvailable?: boolean;
    };
  };

  /**
   * AI key status
   */
  aiKeyStatus?: "configured" | "not-configured";

  /**
   * Job snapshot data
   */
  jobSnapshot?: any;

  /**
   * Last job summary
   */
  lastJobSummary?: {
    successful: number;
    failed: number;
  };

  /**
   * Callback when job completes
   */
  onJobComplete?: (job: any) => void;

  /**
   * Callback when job fails
   */
  onJobFailed?: (job: any) => void;

  /**
   * Callback to copy job diagnostics
   */
  onCopyDiagnostics?: () => void;

  /**
   * Callback to retry failed files
   */
  onRetryFailed?: () => void;

  /**
   * Whether batch processing is in progress
   */
  batchProcessing?: boolean;
}

export default function BatchJobMonitor({
  jobId,
  tenantId,
  userId,
  moduleId,
  jobApiEndpoint,
  pollInterval = 2000,
  enableEventBus = true,
  initialJobData,
  disablePollingIfComplete = false,
  systemHealth,
  aiKeyStatus,
  jobSnapshot,
  lastJobSummary,
  onJobComplete,
  onJobFailed,
  onCopyDiagnostics,
  onRetryFailed,
  batchProcessing = false,
}: BatchJobMonitorProps) {
  // State for collapsed/expanded sections
  const [isQueueExpanded, setIsQueueExpanded] = useState(true);
  const [isMonitorExpanded, setIsMonitorExpanded] = useState(false);

  // Storage keys for persistence
  const queueStorageKey = `msds_batch_monitor_queue_expanded_${jobId || "default"}`;
  const monitorStorageKey = `msds_batch_monitor_monitor_expanded_${jobId || "default"}`;

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Smart defaults based on job status
      const isJobActive =
        jobSnapshot?.status === "running" || jobSnapshot?.status === "queued";
      const isJobComplete =
        jobSnapshot?.status === "completed" || jobSnapshot?.status === "failed";

      // Load from localStorage or use smart defaults
      const savedQueueExpanded = window.localStorage.getItem(queueStorageKey);
      const savedMonitorExpanded =
        window.localStorage.getItem(monitorStorageKey);

      if (savedQueueExpanded !== null) {
        setIsQueueExpanded(savedQueueExpanded === "true");
      } else {
        // Smart default: expand if active, collapse if complete
        setIsQueueExpanded(isJobActive);
      }

      if (savedMonitorExpanded !== null) {
        setIsMonitorExpanded(savedMonitorExpanded === "true");
      } else {
        // Smart default: collapse monitor by default
        setIsMonitorExpanded(false);
      }
    } catch (error) {
      console.warn("[BatchJobMonitor] Failed to load persisted state:", error);
    }
  }, [jobId, queueStorageKey, monitorStorageKey, jobSnapshot?.status]);

  // Persist state changes
  const toggleQueue = useCallback(() => {
    setIsQueueExpanded((prev) => {
      const newValue = !prev;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(queueStorageKey, String(newValue));
        }
      } catch (error) {
        console.warn("[BatchJobMonitor] Failed to persist queue state:", error);
      }
      return newValue;
    });
  }, [queueStorageKey]);

  const toggleMonitor = useCallback(() => {
    setIsMonitorExpanded((prev) => {
      const newValue = !prev;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(monitorStorageKey, String(newValue));
        }
      } catch (error) {
        console.warn(
          "[BatchJobMonitor] Failed to persist monitor state:",
          error,
        );
      }
      return newValue;
    });
  }, [monitorStorageKey]);

  // Don't render if no job ID
  if (!jobId) {
    return null;
  }

  // Calculate summary statistics
  const items = jobSnapshot?.items || initialJobData?.items || [];
  const activeCount = items.filter(
    (i: any) => i.status === "queued" || i.status === "running",
  ).length;
  const completedCount = items.filter(
    (i: any) => i.status === "completed",
  ).length;
  const failedCount = items.filter((i: any) => i.status === "failed").length;
  const totalCount = items.length;
  const progress = jobSnapshot?.progress || initialJobData?.progress || 0;
  const jobStatus = jobSnapshot?.status || initialJobData?.status || "queued";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Unified Header */}
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                  <i className="ri-stack-line text-cyan-400 text-xl"></i>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                  Batch Processing Monitor
                  {activeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                      {activeCount} active
                    </span>
                  )}
                </h4>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-cyan-400">{jobId}</span>
                  <span>•</span>
                  <span
                    className={`font-semibold ${
                      jobStatus === "completed"
                        ? "text-green-400"
                        : jobStatus === "failed"
                          ? "text-red-400"
                          : "text-cyan-400"
                    }`}
                  >
                    {jobStatus === "completed"
                      ? "✓ Complete"
                      : jobStatus === "failed"
                        ? "✗ Failed"
                        : jobStatus === "running"
                          ? "⟳ Processing"
                          : "⏳ Queued"}
                  </span>
                  {totalCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{Math.round(progress)}% complete</span>
                      <span>•</span>
                      <span className="text-green-400">
                        {completedCount} success
                      </span>
                      {failedCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400">
                            {failedCount} failed
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar (only when active) */}
            {jobStatus === "running" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="font-semibold text-gray-300">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 animate-pulse"></div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="divide-y divide-gray-700/50">
        {/* Processing Queue Section */}
        <div>
          <button
            onClick={toggleQueue}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <motion.i
                animate={{ rotate: isQueueExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="ri-arrow-right-s-line text-gray-400 text-lg group-hover:text-cyan-400 transition-colors"
              ></motion.i>
              <div className="text-left">
                <h5 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <i className="ri-list-check text-cyan-400"></i>
                  Processing Queue
                </h5>
                {!isQueueExpanded && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeCount > 0
                      ? `${activeCount} files processing`
                      : totalCount > 0
                        ? `${completedCount} completed, ${failedCount} failed`
                        : "No files"}
                  </p>
                )}
              </div>
            </div>
            {!isQueueExpanded && totalCount > 0 && (
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                    {activeCount} active
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30">
                    {completedCount} done
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30">
                    {failedCount} failed
                  </span>
                )}
              </div>
            )}
          </button>

          <AnimatePresence>
            {isQueueExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 -mx-4">
                  <div className="[&>div]:mt-0 [&>div]:rounded-none [&>div]:border-x-0 [&>div]:shadow-none [&>div>div:first-child]:hidden">
                    <ProcessingQueue
                      jobId={jobId}
                      tenantId={tenantId}
                      userId={userId}
                      moduleId={moduleId}
                      jobApiEndpoint={jobApiEndpoint}
                      pollInterval={pollInterval}
                      enableEventBus={enableEventBus}
                      initialJobData={initialJobData}
                      disablePollingIfComplete={disablePollingIfComplete}
                      onJobComplete={onJobComplete}
                      onJobFailed={onJobFailed}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Batch Job Monitor Section */}
        {(jobSnapshot || lastJobSummary) && (
          <div>
            <button
              onClick={toggleMonitor}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <motion.i
                  animate={{ rotate: isMonitorExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ri-arrow-right-s-line text-gray-400 text-lg group-hover:text-cyan-400 transition-colors"
                ></motion.i>
                <div className="text-left">
                  <h5 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <i className="ri-radar-line text-cyan-400"></i>
                    System Status & Diagnostics
                  </h5>
                  {!isMonitorExpanded && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      AI mode, OCR status, and job diagnostics
                    </p>
                  )}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isMonitorExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4 bg-gray-900/30">
                    {/* System Health Grid */}
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-gray-700/40 border border-gray-600/40">
                        <div className="text-xs text-gray-400 mb-1">
                          AI Mode
                        </div>
                        <div className="text-sm font-semibold text-gray-200">
                          {systemHealth?.ai?.mode
                            ? systemHealth.ai.mode.toUpperCase()
                            : aiKeyStatus === "configured"
                              ? "REAL (keys present)"
                              : "MOCK / LIMITED"}
                        </div>
                        {systemHealth?.ai?.activeProvider && (
                          <div className="text-xs text-gray-400 mt-1">
                            Provider: {systemHealth.ai.activeProvider}
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-gray-700/40 border border-gray-600/40">
                        <div className="text-xs text-gray-400 mb-1">
                          Scanned PDF OCR
                        </div>
                        <div className="text-sm font-semibold text-gray-200">
                          {systemHealth?.ocr?.pdfOcrAvailable === false
                            ? "NOT AVAILABLE"
                            : "AVAILABLE"}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {systemHealth?.ocr?.pdfOcrAvailable === false
                            ? "Add keys for cloud OCR support"
                            : "Cloud OCR enabled"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-700/40 border border-gray-600/40">
                        <div className="text-xs text-gray-400 mb-1">
                          Job Status
                        </div>
                        <div className="text-sm font-semibold text-gray-200 font-mono">
                          {jobId || "—"}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Status:{" "}
                          {jobSnapshot?.status ||
                            (lastJobSummary ? "completed" : "—")}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {onCopyDiagnostics && (
                        <button
                          onClick={onCopyDiagnostics}
                          className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm transition flex items-center gap-2"
                          title="Copy diagnostics JSON for support/engineering"
                        >
                          <i className="ri-clipboard-line"></i>
                          Copy Diagnostics
                        </button>
                      )}
                      {onRetryFailed &&
                        lastJobSummary?.failed &&
                        lastJobSummary.failed > 0 && (
                          <button
                            onClick={onRetryFailed}
                            disabled={batchProcessing}
                            className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 text-sm transition disabled:opacity-50 flex items-center gap-2"
                            title="Retry only failed files from the last job"
                          >
                            <i className="ri-refresh-line"></i>
                            Retry Failed ({lastJobSummary.failed})
                          </button>
                        )}
                    </div>

                    {/* Files List (if available) */}
                    {Array.isArray(jobSnapshot?.items) &&
                      jobSnapshot.items.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                            File Status Details
                          </div>
                          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                            {jobSnapshot.items.map((it: any) => (
                              <div
                                key={it.id}
                                className={`p-3 rounded-lg border flex items-start justify-between gap-4 ${
                                  it.status === "failed"
                                    ? "bg-red-500/10 border-red-500/30"
                                    : it.status === "completed"
                                      ? "bg-green-500/10 border-green-500/30"
                                      : "bg-gray-700/40 border-gray-600/40"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-200 truncate">
                                    {it.filename}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Status:{" "}
                                    <span
                                      className={`font-semibold ${
                                        it.status === "completed"
                                          ? "text-green-400"
                                          : it.status === "failed"
                                            ? "text-red-400"
                                            : "text-cyan-400"
                                      }`}
                                    >
                                      {it.status}
                                    </span>
                                    {typeof it.progress === "number" && (
                                      <span> • {it.progress}%</span>
                                    )}
                                    {typeof it.result?.confidence ===
                                      "number" && (
                                      <span
                                        className={` ${
                                          it.result.confidence >= 80
                                            ? "text-green-400"
                                            : it.result.confidence >= 50
                                              ? "text-yellow-400"
                                              : "text-red-400"
                                        }`}
                                      >
                                        {" "}
                                        • Confidence: {it.result.confidence}%
                                      </span>
                                    )}
                                  </div>
                                  {it.error && (
                                    <div className="text-xs text-red-200 mt-1 line-clamp-2">
                                      Error:{" "}
                                      <span className="text-red-100">
                                        {it.error}
                                      </span>
                                    </div>
                                  )}
                                  {Array.isArray(it.result?.issues) &&
                                    it.result.issues.length > 0 && (
                                      <div className="text-xs text-yellow-200/80 mt-1">
                                        Issues:{" "}
                                        {it.result.issues
                                          .slice(0, 2)
                                          .map((x: any) => x?.message)
                                          .filter(Boolean)
                                          .join(" • ")}
                                        {it.result.issues.length > 2
                                          ? " …"
                                          : ""}
                                      </div>
                                    )}
                                </div>
                                <div className="shrink-0 text-xs text-gray-400">
                                  {it.status === "completed" ? (
                                    <i className="ri-checkbox-circle-line text-green-400 text-lg"></i>
                                  ) : it.status === "failed" ? (
                                    <i className="ri-close-circle-line text-red-400 text-lg"></i>
                                  ) : (
                                    <i className="ri-loader-4-line animate-spin text-cyan-400 text-lg"></i>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
