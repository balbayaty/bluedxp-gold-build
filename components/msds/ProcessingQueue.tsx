/**
 * Reusable Processing Queue Component
 *
 * Displays processing queue with expandable items, live progress, and integrated errors.
 * Can be used across modules (MSDS, WMS, TMS, etc.)
 *
 * @module components/msds/ProcessingQueue
 *
 * @example
 * ```tsx
 * <ProcessingQueue
 *   jobId="msdsjob-123"
 *   tenantId="tenant-1"
 *   userId="user-1"
 *   moduleId="msds"
 *   onJobComplete={(job) => console.log('Job completed:', job)}
 * />
 * ```
 *
 * ## Architecture
 *
 * - **Service Layer Integration**: Event bus, notifications, error tracking
 * - **Real-Time Updates**: WebSocket (MSDS) or Event Bus subscription + polling fallback
 * - **Fully Dynamic**: No hardcoded text, all content from job data
 * - **Professional UI/UX**: Industry-standard design with animations
 *
 * ## Features
 *
 * - ✅ Expandable items with detailed progress
 * - ✅ Live progress tracking with stage indicators
 * - ✅ Integrated error display (no separate section)
 * - ✅ Processing stage timeline visualization
 * - ✅ Error details with full context
 * - ✅ Issues/warnings display
 * - ✅ Extraction preview
 * - ✅ WebSocket support for real-time updates
 * - ✅ Event bus integration for cross-module communication
 *
 * ## Integration
 *
 * - **Event Bus**: Subscribes to `{moduleId}.job.*` events
 * - **WebSocket**: Uses `msdsRealtimeService` for MSDS module
 * - **Notifications**: Can trigger notifications via callbacks
 * - **Error Tracking**: Errors are tracked by job service
 *
 * @see {@link lib/services/chemical/msdsJobService} - Job processing service
 * @see {@link lib/services/realtime/msdsRealtimeService} - Real-time updates
 * @see {@link lib/services/event-store} - Event bus
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import { msdsRealtimeService } from "@/lib/services/realtime/msdsRealtimeService";
import type { MSDSRealtimeUpdate } from "@/lib/services/realtime/msdsRealtimeService";
import { apiFetch } from "@/utils/apiFetch";

export interface ProcessingQueueItem {
  id: string;
  filename: string;
  mimeType?: string;
  size?: number;
  status: "queued" | "running" | "completed" | "failed";
  progress: number; // 0-100
  error?: string;
  result?: {
    extractedData?: any;
    confidence?: number;
    issues?: Array<{
      code: string;
      message: string;
      severity: "info" | "warning" | "error";
      field?: string;
    }>;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

export interface ProcessingQueueProps {
  /**
   * Job ID to monitor
   */
  jobId: string;

  /**
   * Tenant ID for multi-tenant support
   */
  tenantId: string;

  /**
   * User ID for notifications
   */
  userId: string;

  /**
   * Module identifier (e.g., 'msds', 'wms', 'tms')
   */
  moduleId: string;

  /**
   * API endpoint to fetch job status
   * Default: `/api/chemical/msds/jobs/${jobId}`
   */
  jobApiEndpoint?: string;

  /**
   * Polling interval in milliseconds
   * Default: 2000 (2 seconds)
   */
  pollInterval?: number;

  /**
   * Enable real-time updates via event bus
   * Default: true
   */
  enableEventBus?: boolean;

  /**
   * Custom processing stages
   */
  stages?: Array<{
    key: string;
    label: string;
    icon: string;
    threshold: number;
  }>;

  /**
   * Custom render function for extraction preview
   */
  renderExtractionPreview?: (item: ProcessingQueueItem) => React.ReactNode;

  /**
   * Callback when job completes
   */
  onJobComplete?: (job: any) => void;

  /**
   * Callback when job fails
   */
  onJobFailed?: (job: any) => void;

  /**
   * Initial job data (optional) - if provided, component will use this instead of fetching
   * This prevents duplicate API calls when parent component already has the job data
   */
  initialJobData?: any;

  /**
   * Disable polling if job is completed/failed (use initialJobData instead)
   */
  disablePollingIfComplete?: boolean;
}

export default function ProcessingQueue({
  jobId,
  tenantId,
  userId,
  moduleId,
  jobApiEndpoint,
  pollInterval = 2000,
  enableEventBus = true,
  stages,
  renderExtractionPreview,
  onJobComplete,
  onJobFailed,
  initialJobData,
  disablePollingIfComplete = false,
}: ProcessingQueueProps) {
  const [items, setItems] = useState<ProcessingQueueItem[]>(
    initialJobData?.items || [],
  );
  const [jobStatus, setJobStatus] = useState<
    "queued" | "running" | "completed" | "failed" | null
  >(initialJobData?.status || null);
  const [jobProgress, setJobProgress] = useState(initialJobData?.progress || 0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [jobData, setJobData] = useState<any>(initialJobData || null);
  const [useWebSocket, setUseWebSocket] = useState(false);
  const [jobNotFound, setJobNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [stopPolling, setStopPolling] = useState(
    disablePollingIfComplete &&
      (initialJobData?.status === "completed" ||
        initialJobData?.status === "failed"),
  );
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize from initialJobData if provided
  useEffect(() => {
    if (initialJobData) {
      setJobData(initialJobData);
      setJobStatus(initialJobData.status || "queued");
      setJobProgress(Math.max(0, Math.min(100, initialJobData.progress || 0)));
      setItems(Array.isArray(initialJobData.items) ? initialJobData.items : []);

      // If job is complete, stop polling immediately
      if (
        initialJobData.status === "completed" ||
        initialJobData.status === "failed"
      ) {
        setStopPolling(true);
        if (initialJobData.status === "completed" && onJobComplete) {
          onJobComplete(initialJobData);
        } else if (initialJobData.status === "failed" && onJobFailed) {
          onJobFailed(initialJobData);
        }
      }
    }
  }, [initialJobData, onJobComplete, onJobFailed]);

  // Default stages for MSDS processing
  const defaultStages = stages || [
    { key: "queued", label: "Queued", icon: "ri-time-line", threshold: 0 },
    {
      key: "extracting",
      label: "Text Extraction",
      icon: "ri-file-text-line",
      threshold: 5,
    },
    {
      key: "analyzing",
      label: "AI Analysis",
      icon: "ri-brain-line",
      threshold: 35,
    },
    {
      key: "finalizing",
      label: "Finalizing",
      icon: "ri-checkbox-circle-line",
      threshold: 70,
    },
    {
      key: "completed",
      label: "Completed",
      icon: "ri-check-double-line",
      threshold: 100,
    },
  ];

  // Fetch job status
  const fetchJobStatus = async () => {
    if (!jobId || stopPolling) return;

    // If we have initial data and polling is disabled for completed jobs, don't fetch
    if (
      initialJobData &&
      disablePollingIfComplete &&
      (initialJobData.status === "completed" ||
        initialJobData.status === "failed")
    ) {
      return;
    }

    try {
      const endpoint = jobApiEndpoint || `/api/chemical/msds/jobs/${jobId}`;

      // Use apiFetch to ensure tenant headers are automatically included
      const res = await apiFetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for auth
        tenantId: tenantId && tenantId !== "default" ? tenantId : undefined, // Pass tenantId to apiFetch
      });

      if (!res.ok) {
        // Handle 404 - job not found
        if (res.status === 404) {
          // If we have initialJobData, the job exists but expired from Redis
          // Don't show "Job Not Found" - use the data we have
          if (initialJobData && disablePollingIfComplete) {
            console.log(
              `[${moduleId}-queue] Job expired from Redis but we have cached data, using it`,
            );
            setStopPolling(true);
            return;
          }

          const errorMsg = `Job not found: ${jobId}`;
          setFetchError(errorMsg);
          console.warn(
            `[${moduleId}-queue] Job not found (404):`,
            jobId,
            "tenantId:",
            tenantId,
          );

          // Try to get error details from response
          try {
            const errorJson = await res.json();
            if (errorJson?.error) {
              setFetchError(errorJson.error);
            }
          } catch {
            // Ignore JSON parse errors
          }

          // Mark as not found and stop polling after 404
          // (Job might have been deleted or doesn't exist for this tenant)
          setJobNotFound(true);
          setStopPolling(true);
          return;
        }
        // Handle other HTTP errors
        const errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        setFetchError(errorMsg);
        console.error(`[${moduleId}-queue] HTTP error:`, res.status, errorMsg);
        return;
      }

      const json = await res.json();
      if (json?.success && json?.job) {
        const job = json.job;
        setJobData(job);
        setJobStatus(job.status || "queued");
        setJobProgress(Math.max(0, Math.min(100, job.progress || 0)));
        setItems(Array.isArray(job.items) ? job.items : []);
        setJobNotFound(false);
        setFetchError(null);

        // Stop polling if job is completed or failed
        if (job.status === "completed" || job.status === "failed") {
          setStopPolling(true);
        }

        // Callbacks (only call once per status change)
        if (job.status === "completed" && onJobComplete) {
          onJobComplete(job);
        } else if (job.status === "failed" && onJobFailed) {
          onJobFailed(job);
        }
      } else if (json?.error) {
        const errorMsg = json.error || "Unknown API error";
        setFetchError(errorMsg);
        console.error(`[${moduleId}-queue] API error:`, errorMsg);
        // If error indicates job doesn't exist, mark as not found but don't stop immediately
        if (
          errorMsg.toLowerCase().includes("not found") ||
          errorMsg.toLowerCase().includes("404")
        ) {
          // Will be handled by the 404 check above
        }
      } else {
        // Unexpected response format
        console.warn(`[${moduleId}-queue] Unexpected response format:`, json);
        setFetchError("Unexpected response from server");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch job status";
      console.error(`[${moduleId}-queue] Failed to fetch job status:`, error);
      setFetchError(errorMsg);

      // If it's a network error, don't stop polling - might be temporary
      // The timeout mechanism will handle persistent failures
    }
  };

  // Poll job status (only if we don't have initial data or job is still active)
  useEffect(() => {
    if (!jobId || stopPolling) return;

    // If we have initialJobData and job is completed/failed, don't poll
    if (
      initialJobData &&
      (initialJobData.status === "completed" ||
        initialJobData.status === "failed")
    ) {
      setStopPolling(true);
      return;
    }

    // Reset states when jobId changes (but preserve initial data)
    if (!initialJobData) {
      setJobNotFound(false);
      setFetchError(null);
    }

    // Initial fetch (skip if we have initial data and it's still active - will update via polling)
    if (
      !initialJobData ||
      initialJobData.status === "queued" ||
      initialJobData.status === "running"
    ) {
      fetchJobStatus();
    }

    // Set up polling interval (only if not stopped and job is active)
    const interval = setInterval(() => {
      if (
        !stopPolling &&
        (jobStatus === "queued" || jobStatus === "running" || !jobStatus)
      ) {
        fetchJobStatus();
      }
    }, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [
    jobId,
    tenantId,
    pollInterval,
    jobApiEndpoint,
    moduleId,
    stopPolling,
    initialJobData,
    jobStatus,
  ]);

  // Subscribe to real-time updates (WebSocket/Event Bus)
  useEffect(() => {
    if (!enableEventBus || !jobId) return;

    let eventBusUnsubscribe: (() => void) | null = null;

    // Try WebSocket first (MSDS-specific)
    if (moduleId === "msds") {
      let unsubscribe: (() => void) | null = null;

      try {
        // Ensure service is initialized (non-blocking)
        msdsRealtimeService.initialize().catch((err) => {
          console.warn(
            "[ProcessingQueue] Failed to initialize realtime service:",
            err,
          );
        });

        unsubscribe = msdsRealtimeService.subscribe(
          jobId,
          (update: MSDSRealtimeUpdate) => {
            // Only refresh if update is for this job
            if (update.jobId === jobId) {
              fetchJobStatus().catch((err) => {
                console.error(
                  "[ProcessingQueue] Error fetching job status:",
                  err,
                );
              });
            }
          },
        );
        realtimeUnsubscribeRef.current = unsubscribe;
        setUseWebSocket(true);

        return () => {
          try {
            if (unsubscribe && typeof unsubscribe === "function") {
              unsubscribe();
            }
            realtimeUnsubscribeRef.current = null;
          } catch (error) {
            console.error(
              "[ProcessingQueue] Error unsubscribing from WebSocket:",
              error,
            );
          }
        };
      } catch (error) {
        console.warn(
          "[ProcessingQueue] WebSocket not available, falling back to event bus:",
          error,
        );
        setUseWebSocket(false);
        // Continue to event bus fallback below
      }
    }

    // Fallback to event bus subscription
    if (moduleId !== "msds" || !useWebSocket) {
      try {
        const subscription = eventBus.subscribe(
          `${moduleId}.job.*`,
          async (event: DomainEvent) => {
            if (event.payload?.jobId === jobId) {
              // Refresh job status when relevant event is published
              try {
                await fetchJobStatus();
              } catch (err) {
                console.error(
                  "[ProcessingQueue] Error fetching job status from event:",
                  err,
                );
              }
            }
          },
        );

        eventBusUnsubscribe = () => {
          try {
            if (
              subscription &&
              subscription.unsubscribe &&
              typeof subscription.unsubscribe === "function"
            ) {
              subscription.unsubscribe();
            }
          } catch (error) {
            console.error(
              "[ProcessingQueue] Error unsubscribing from event bus:",
              error,
            );
          }
        };
      } catch (error) {
        console.error(
          "[ProcessingQueue] Failed to subscribe to event bus:",
          error,
        );
      }
    }

    return () => {
      if (eventBusUnsubscribe) {
        eventBusUnsubscribe();
      }
    };
  }, [jobId, moduleId, enableEventBus]);

  // Determine current processing stage for an item
  const getProcessingStage = (item: ProcessingQueueItem) => {
    if (!item || !item.status) {
      return { stage: "queued", label: "Queued", progress: 0 };
    }

    if (item.status === "queued")
      return { stage: "queued", label: "Queued", progress: 0 };
    if (item.status === "failed")
      return {
        stage: "failed",
        label: "Failed",
        progress: Math.max(0, Math.min(100, item.progress || 0)),
      };
    if (item.status === "completed")
      return { stage: "completed", label: "Completed", progress: 100 };

    // Running - determine sub-stage based on progress
    const progress = Math.max(0, Math.min(100, item.progress || 0));
    if (progress < 35)
      return { stage: "extracting", label: "Extracting Text", progress };
    if (progress < 70)
      return { stage: "analyzing", label: "AI Analysis", progress };
    return { stage: "finalizing", label: "Finalizing", progress };
  };

  // Show loading state if no items yet (with timeout) - must be before any conditional returns
  useEffect(() => {
    // Don't show timeout if we have initial data or no jobId
    if (initialJobData || !jobId) {
      setLoadingTimeout(false);
      return;
    }

    if (items.length === 0 && jobStatus === null && !jobNotFound) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [items.length, jobStatus, jobNotFound, initialJobData, jobId]);

  // Don't render if no jobId
  if (!jobId) {
    return null;
  }

  // Show job not found message (only if we don't have initial data)
  if (jobNotFound && !initialJobData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/30"
      >
        <div className="flex items-start gap-3">
          <i className="ri-error-warning-line text-yellow-400 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="flex-1">
            <span className="text-sm font-semibold text-yellow-400 block mb-1">
              Job Not Found
            </span>
            <span className="text-xs text-gray-400 block mb-2">
              The job{" "}
              <code className="px-1.5 py-0.5 bg-gray-800/50 rounded text-cyan-400">
                {jobId}
              </code>{" "}
              could not be found. It may have been deleted or the job ID is
              incorrect.
            </span>
            {fetchError && (
              <span className="text-xs text-gray-500 block mt-1">
                Error: {fetchError}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Show loading state
  if (items.length === 0 && jobStatus === null && !jobNotFound) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50"
      >
        <div className="flex items-center gap-3">
          {!loadingTimeout ? (
            <>
              <i className="ri-loader-4-line text-cyan-400 text-xl animate-spin"></i>
              <span className="text-sm text-gray-400">
                Loading job status...
              </span>
            </>
          ) : (
            <>
              <i className="ri-error-warning-line text-yellow-400 text-xl"></i>
              <div className="flex-1">
                <span className="text-sm text-yellow-400 block">
                  Job status loading timeout
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {fetchError ? (
                    <>
                      Connection issue: {fetchError}. Please check your network
                      connection and try refreshing the page.
                    </>
                  ) : (
                    <>
                      The job may not exist or there may be a connection issue.
                      Please check your network connection.
                    </>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // Don't render if no items and job is completed/failed (nothing to show)
  if (items.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
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
              <div>
                <h4 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                  Processing Queue
                  <span className="text-sm font-normal text-gray-400">
                    (
                    {
                      items.filter(
                        (i) => i.status === "queued" || i.status === "running",
                      ).length
                    }{" "}
                    active)
                  </span>
                </h4>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <span className="font-mono text-cyan-400">{jobId}</span>
                  <span>•</span>
                  <span>{Math.round(jobProgress)}% complete</span>
                </div>
              </div>
            </div>
            {jobStatus === "running" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="font-semibold text-gray-300">
                    {Math.round(jobProgress)}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 animate-pulse"></div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(0, Math.min(100, jobProgress))}%`,
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

      {/* Queue Items */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => {
          const isExpanded = expandedItems.has(item.id);
          const isActive =
            item.status === "queued" || item.status === "running";
          const isFailed = item.status === "failed";
          const isCompleted = item.status === "completed";
          const currentStage = getProcessingStage(item);
          const fileSize =
            item.size && item.size > 0
              ? `${(item.size / 1024).toFixed(1)} KB`
              : null;
          const fileType =
            item.mimeType?.split("/")[1]?.toUpperCase() ||
            (item.filename
              ? item.filename.split(".").pop()?.toUpperCase()
              : null) ||
            "FILE";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative rounded-xl border transition-all duration-300 ${
                isFailed
                  ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
                  : isCompleted
                    ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
                    : "bg-gray-800/50 border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/70"
              }`}
            >
              {/* Main Item Card */}
              <button
                onClick={() => {
                  setExpandedItems((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) {
                      next.delete(item.id);
                    } else {
                      next.add(item.id);
                    }
                    return next;
                  });
                }}
                className="w-full p-4 flex items-start gap-4 text-left"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 relative">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isFailed
                        ? "bg-red-500/20 border-2 border-red-500/40"
                        : isCompleted
                          ? "bg-green-500/20 border-2 border-green-500/40"
                          : "bg-cyan-500/20 border-2 border-cyan-500/40"
                    }`}
                  >
                    {isFailed ? (
                      <i className="ri-error-warning-line text-red-400 text-xl"></i>
                    ) : isCompleted ? (
                      <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
                    ) : (
                      <i className="ri-loader-4-line text-cyan-400 text-xl animate-spin"></i>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full animate-ping"></div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-100 truncate mb-1">
                        {item.filename}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {fileSize && (
                          <span className="flex items-center gap-1">
                            <i className="ri-file-line"></i> {fileSize}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <i className="ri-file-type-line"></i> {fileType}
                        </span>
                        {item.result?.confidence && (
                          <span
                            className={`flex items-center gap-1 ${
                              item.result.confidence >= 80
                                ? "text-green-400"
                                : item.result.confidence >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            <i className="ri-brain-line"></i>{" "}
                            {Math.round(item.result.confidence)}% confidence
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold ${
                        isFailed
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : isCompleted
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {currentStage.label}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isActive && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <i className="ri-progress-1-line"></i>
                          {currentStage.label}
                        </span>
                        <span className="font-semibold text-gray-300">
                          {Math.round(currentStage.progress)}%
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${currentStage.progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isFailed
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : "bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600"
                          } relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                        </motion.div>
                      </div>
                    </div>
                  )}

                  {/* Error Preview */}
                  {isFailed && !isExpanded && item.error && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-start gap-2">
                        <i className="ri-error-warning-line text-red-400 text-sm mt-0.5 flex-shrink-0"></i>
                        <p className="text-xs text-red-200 line-clamp-2">
                          {item.error}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Issues Preview */}
                  {isCompleted &&
                    !isExpanded &&
                    Array.isArray(item.result?.issues) &&
                    item.result.issues.length > 0 && (
                      <div className="mt-3 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-2">
                          <i className="ri-alert-line text-yellow-400 text-sm mt-0.5 flex-shrink-0"></i>
                          <p className="text-xs text-yellow-200">
                            {item.result.issues.length}{" "}
                            {item.result.issues.length === 1
                              ? "issue"
                              : "issues"}{" "}
                            detected
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex-shrink-0">
                  <motion.i
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ri-arrow-down-s-line text-gray-400 text-xl"
                  ></motion.i>
                </div>
              </button>

              {/* Expanded Details - Same as in page.tsx but extracted */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-gray-700/50"
                  >
                    <div className="p-4 space-y-4 bg-gray-900/30">
                      {/* Processing Stages Timeline */}
                      <div>
                        <h6 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                          Processing Stages
                        </h6>
                        <div className="space-y-3">
                          {defaultStages.map((stage, stageIdx) => {
                            const stageProgress = item.progress || 0;
                            const isStageActive =
                              stage.key === currentStage.stage;
                            const isStageCompleted =
                              stageProgress >= stage.threshold ||
                              (stage.key === "completed" && isCompleted);
                            const isStageFailed =
                              isFailed && stageProgress >= stage.threshold;

                            return (
                              <div
                                key={stage.key}
                                className="flex items-start gap-3"
                              >
                                <div className="flex-shrink-0 relative">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                      isStageFailed
                                        ? "bg-red-500/20 border-2 border-red-500/40"
                                        : isStageCompleted
                                          ? "bg-green-500/20 border-2 border-green-500/40"
                                          : isStageActive
                                            ? "bg-cyan-500/20 border-2 border-cyan-500/40 animate-pulse"
                                            : "bg-gray-700/50 border-2 border-gray-600/40"
                                    }`}
                                  >
                                    {isStageFailed ? (
                                      <i className="ri-close-line text-red-400 text-sm"></i>
                                    ) : isStageCompleted ? (
                                      <i className="ri-check-line text-green-400 text-sm"></i>
                                    ) : (
                                      <i
                                        className={
                                          stage.icon +
                                          ` ${isStageActive ? "text-cyan-400" : "text-gray-500"} text-sm`
                                        }
                                      ></i>
                                    )}
                                  </div>
                                  {stageIdx < defaultStages.length - 1 && (
                                    <div
                                      className={`absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 ${
                                        isStageCompleted
                                          ? "bg-green-500/40"
                                          : "bg-gray-700/50"
                                      }`}
                                    ></div>
                                  )}
                                </div>
                                <div className="flex-1 pt-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span
                                      className={`text-sm font-medium ${
                                        isStageActive
                                          ? "text-cyan-300"
                                          : isStageCompleted
                                            ? "text-green-300"
                                            : "text-gray-400"
                                      }`}
                                    >
                                      {stage.label}
                                    </span>
                                    {isStageActive && (
                                      <span className="text-xs text-cyan-400 font-semibold">
                                        {Math.round(stageProgress)}%
                                      </span>
                                    )}
                                  </div>
                                  {isStageActive && stageProgress < 100 && (
                                    <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-1.5">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stageProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                                      ></motion.div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Error Details */}
                      {isFailed && item.error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                          <div className="flex items-start gap-3 mb-2">
                            <i className="ri-error-warning-line text-red-400 text-lg flex-shrink-0 mt-0.5"></i>
                            <h6 className="text-sm font-semibold text-red-200">
                              Error Details
                            </h6>
                          </div>
                          <p className="text-sm text-red-100/90 leading-relaxed mb-3">
                            {item.error}
                          </p>
                          {/* Actionable guidance based on error type */}
                          {item.error
                            .toLowerCase()
                            .includes("insufficient text") ||
                          item.error.toLowerCase().includes("ocr") ? (
                            <div className="text-xs text-red-200/70 bg-red-500/5 p-2 rounded border border-red-500/20">
                              <strong>Tip:</strong> For scanned PDFs, ensure API
                              keys are configured in Settings → AI & Agents for
                              cloud OCR support.
                            </div>
                          ) : item.error.toLowerCase().includes("timeout") ? (
                            <div className="text-xs text-red-200/70 bg-red-500/5 p-2 rounded border border-red-500/20">
                              <strong>Tip:</strong> This may indicate a slow
                              network or LLM response. Check your API keys and
                              network connection, then try again.
                            </div>
                          ) : item.error.toLowerCase().includes("api key") ||
                            item.error
                              .toLowerCase()
                              .includes("authentication") ? (
                            <div className="text-xs text-red-200/70 bg-red-500/5 p-2 rounded border border-red-500/20">
                              <strong>Tip:</strong> Configure your API keys in
                              Settings → AI & Agents to enable real AI
                              processing.
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Issues & Warnings */}
                      {isCompleted &&
                        Array.isArray(item.result?.issues) &&
                        item.result.issues.length > 0 && (
                          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                            <div className="flex items-start gap-3 mb-3">
                              <i className="ri-alert-line text-yellow-400 text-lg flex-shrink-0 mt-0.5"></i>
                              <div className="flex-1">
                                <h6 className="text-sm font-semibold text-yellow-200 mb-1">
                                  {item.result.issues.length}{" "}
                                  {item.result.issues.length === 1
                                    ? "Issue"
                                    : "Issues"}{" "}
                                  Detected
                                </h6>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {item.result.issues.map(
                                (issue: any, issueIdx: number) => (
                                  <div
                                    key={issueIdx}
                                    className={`p-2.5 rounded-lg border ${
                                      issue.severity === "error"
                                        ? "bg-red-500/10 border-red-500/20"
                                        : issue.severity === "warning"
                                          ? "bg-yellow-500/10 border-yellow-500/20"
                                          : "bg-blue-500/10 border-blue-500/20"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <i
                                        className={`${
                                          issue.severity === "error"
                                            ? "ri-error-warning-line text-red-400"
                                            : issue.severity === "warning"
                                              ? "ri-alert-line text-yellow-400"
                                              : "ri-information-line text-blue-400"
                                        } text-sm mt-0.5 flex-shrink-0`}
                                      ></i>
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-200 mb-0.5">
                                          {issue.message ||
                                            issue.code ||
                                            "Unknown issue"}
                                        </p>
                                        {issue.field && (
                                          <p className="text-xs text-gray-400">
                                            Field: {issue.field}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Extraction Preview */}
                      {isCompleted && item.result?.extractedData && (
                        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                          <div className="flex items-start gap-3 mb-3">
                            <i className="ri-file-text-line text-cyan-400 text-lg flex-shrink-0 mt-0.5"></i>
                            <h6 className="text-sm font-semibold text-gray-200">
                              Extraction Preview
                            </h6>
                          </div>
                          {renderExtractionPreview ? (
                            renderExtractionPreview(item)
                          ) : (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {item.result.extractedData.productName && (
                                <div>
                                  <span className="text-gray-400">
                                    Product:
                                  </span>
                                  <p className="text-gray-200 font-medium mt-0.5">
                                    {item.result.extractedData.productName}
                                  </p>
                                </div>
                              )}
                              {item.result.extractedData.manufacturer && (
                                <div>
                                  <span className="text-gray-400">
                                    Manufacturer:
                                  </span>
                                  <p className="text-gray-200 font-medium mt-0.5">
                                    {item.result.extractedData.manufacturer}
                                  </p>
                                </div>
                              )}
                              {item.result.extractedData.casNumber && (
                                <div>
                                  <span className="text-gray-400">
                                    CAS Number:
                                  </span>
                                  <p className="text-gray-200 font-medium mt-0.5">
                                    {item.result.extractedData.casNumber}
                                  </p>
                                </div>
                              )}
                              {item.result.confidence && (
                                <div>
                                  <span className="text-gray-400">
                                    Confidence:
                                  </span>
                                  <p
                                    className={`font-medium mt-0.5 ${
                                      item.result.confidence >= 80
                                        ? "text-green-400"
                                        : item.result.confidence >= 50
                                          ? "text-yellow-400"
                                          : "text-red-400"
                                    }`}
                                  >
                                    {Math.round(item.result.confidence)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
