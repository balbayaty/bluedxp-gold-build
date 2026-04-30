/**
 * Universal Lifecycle View Component
 * Works with any entity type (Sales Orders, Purchase Orders, ASNs, etc.)
 * Supports multiple view modes: timeline, gantt, kanban, network, journey, process-mining
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import type {
  LifecycleViewProps,
  EntityLifecycle,
  LifecycleUpdate,
} from "@/types/lifecycle";
import TimelineView from "./views/TimelineView";
import GanttView from "./views/GanttView";
import KanbanView from "./views/KanbanView";
import NetworkView from "./views/NetworkView";
import ErrorBoundary from "@/components/ErrorBoundary";

// Initialize lifecycle configurations on import
import { initializeLifecycleSystem } from "@/lib/services/process-lifecycle/lifecycle/configurations/initialize";

// Register configurations
if (typeof window !== "undefined") {
  initializeLifecycleSystem();
}

export default function LifecycleView({
  entityId,
  entityType,
  viewMode = "timeline",
  showLayers = ["overview", "details"],
  onStageClick,
  onModuleLinkClick,
  onStageTransition,
  className = "",
  height = 600,
  enableRealTime = true,
  enablePredictive = false,
}: LifecycleViewProps) {
  const [lifecycle, setLifecycle] = useState<EntityLifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  // Load lifecycle data
  useEffect(() => {
    let mounted = true;

    async function loadLifecycle() {
      try {
        setLoading(true);
        setError(null);

        // Try to get existing lifecycle
        let lifecycleData = await lifecycleService.getLifecycle(
          entityId,
          entityType,
        );

        // If no lifecycle exists, initialize it
        if (!lifecycleData) {
          lifecycleData = await lifecycleService.initializeLifecycle(
            entityId,
            entityType,
          );
        }

        if (mounted) {
          setLifecycle(lifecycleData);
        }
      } catch (err) {
        console.error("Error loading lifecycle:", err);
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load lifecycle",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLifecycle();

    return () => {
      mounted = false;
    };
  }, [entityId, entityType]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enableRealTime || !lifecycle) return;

    const subscription = lifecycleService.subscribe(
      entityId,
      entityType,
      (update: LifecycleUpdate) => {
        // Reload lifecycle on update
        lifecycleService.getLifecycle(entityId, entityType).then((updated) => {
          if (updated) {
            setLifecycle(updated);
          }
        });
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [entityId, entityType, enableRealTime, lifecycle]);

  // Get configuration
  const config = useMemo(() => {
    return lifecycleService.getLifecycleConfig(entityType);
  }, [entityType]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading lifecycle...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-500/10 border border-red-500/30 rounded-lg p-6 ${className}`}
        style={{ height }}
      >
        <div className="flex items-center gap-3 text-red-400">
          <i className="ri-error-warning-line text-xl"></i>
          <div>
            <div className="font-semibold">Error Loading Lifecycle</div>
            <div className="text-sm text-red-300/80">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!lifecycle || !config) {
    return (
      <div
        className={`bg-white/5 border border-white/10 rounded-lg p-6 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-[#9ca3af]">
          <i className="ri-information-line text-2xl mb-2"></i>
          <div>No lifecycle configuration found for {entityType}</div>
        </div>
      </div>
    );
  }

  // Render appropriate view based on mode
  const renderView = () => {
    switch (currentViewMode) {
      case "timeline":
        return (
          <TimelineView
            lifecycle={lifecycle}
            config={config}
            showLayers={showLayers}
            onStageClick={onStageClick}
            onModuleLinkClick={onModuleLinkClick}
            onStageTransition={onStageTransition}
            enablePredictive={enablePredictive}
          />
        );
      case "gantt":
        return (
          <GanttView
            lifecycle={lifecycle}
            onStageClick={onStageClick}
            onStageUpdate={(stageId, newDate) => {
              // Handle stage date update
              console.log("Update stage", stageId, "to", newDate);
            }}
            enableEditing={true}
          />
        );
      case "kanban":
        return (
          <KanbanView
            lifecycle={lifecycle}
            onStageClick={onStageClick}
            onStageMove={(stageId, newStatus) => {
              // Handle stage status change
              onStageTransition?.(stageId, newStatus as any);
            }}
            enableDragDrop={true}
          />
        );
      case "network":
        return (
          <NetworkView
            lifecycle={lifecycle}
            onStageClick={onStageClick}
            onStageHover={(stage) => {
              // Handle stage hover
            }}
          />
        );
      case "journey":
      case "process-mining":
      case "workflow":
        // These will be implemented in separate components
        return (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="text-center text-[#9ca3af]">
              <i className="ri-information-line text-2xl mb-2"></i>
              <div>{currentViewMode} view coming soon</div>
              <div className="text-sm mt-2">
                Currently showing timeline view
              </div>
            </div>
            <TimelineView
              lifecycle={lifecycle}
              config={config}
              showLayers={showLayers}
              onStageClick={onStageClick}
              onModuleLinkClick={onModuleLinkClick}
              onStageTransition={onStageTransition}
              enablePredictive={enablePredictive}
            />
          </div>
        );
      default:
        return (
          <TimelineView
            lifecycle={lifecycle}
            config={config}
            showLayers={showLayers}
            onStageClick={onStageClick}
            onModuleLinkClick={onModuleLinkClick}
            onStageTransition={onStageTransition}
            enablePredictive={enablePredictive}
          />
        );
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">Error rendering lifecycle view</div>
      }
    >
      <div
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ${className}`}
      >
        {/* View Mode Switcher */}
        {viewMode && (
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ri-flow-chart-line text-cyan-400"></i>
              <h3 className="text-lg font-semibold text-white">
                Lifecycle View
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              {(["timeline", "gantt", "kanban", "workflow"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setCurrentViewMode(mode)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      currentViewMode === mode
                        ? "bg-cyan-500 text-white"
                        : "text-[#9ca3af] hover:text-white"
                    }`}
                    title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  >
                    <i
                      className={`ri-${mode === "timeline" ? "time-line" : mode === "gantt" ? "calendar-line" : mode === "kanban" ? "layout-grid-line" : "flow-chart-line"}`}
                    ></i>
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* Main View */}
        <div style={{ minHeight: height }}>{renderView()}</div>
      </div>
    </ErrorBoundary>
  );
}
