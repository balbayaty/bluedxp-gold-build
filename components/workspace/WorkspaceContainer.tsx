/**
 * Workspace Container - Main Container Component
 *
 * Manages layout, widget rendering, and real-time updates
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { WorkspaceWidget } from "./widgets/WorkspaceWidget";
import { LayoutCreationModal } from "./LayoutCreationModal";
import type {
  WorkspaceConfig,
  WorkspaceLayout,
  UserWidget,
  CreateWorkspaceLayoutInput,
} from "@/types/workspace";

interface WorkspaceContainerProps {
  config: WorkspaceConfig;
  layout: WorkspaceLayout | null;
  onLayoutChange: (layout: WorkspaceLayout) => void;
  onSaveLayout: (layout: WorkspaceLayout) => void;
  onCreateLayout?: (
    input: CreateWorkspaceLayoutInput,
  ) => Promise<WorkspaceLayout>;
}

export function WorkspaceContainer({
  config,
  layout,
  onLayoutChange,
  onSaveLayout,
  onCreateLayout,
}: WorkspaceContainerProps) {
  const [widgets, setWidgets] = useState<UserWidget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (layout?.widgets) {
      setWidgets(layout.widgets);
    }
  }, [layout]);

  const handleWidgetMove = useCallback(
    (widgetId: string, position: any) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, position } : w)),
      );

      // Auto-save after move
      if (layout) {
        const updatedLayout = {
          ...layout,
          widgets: widgets.map((w) =>
            w.id === widgetId ? { ...w, position } : w,
          ),
        };
        onSaveLayout(updatedLayout as WorkspaceLayout);
      }
    },
    [layout, widgets, onSaveLayout],
  );

  const handleWidgetResize = useCallback(
    (widgetId: string, size: any) => {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === widgetId
            ? { ...w, position: { ...w.position, ...size } }
            : w,
        ),
      );

      // Auto-save after resize
      if (layout) {
        const updatedLayout = {
          ...layout,
          widgets: widgets.map((w) =>
            w.id === widgetId
              ? { ...w, position: { ...w.position, ...size } }
              : w,
          ),
        };
        onSaveLayout(updatedLayout as WorkspaceLayout);
      }
    },
    [layout, widgets, onSaveLayout],
  );

  const handleWidgetRemove = useCallback(
    (widgetId: string) => {
      setWidgets((prev) => prev.filter((w) => w.id !== widgetId));

      if (layout) {
        const updatedLayout = {
          ...layout,
          widgets: widgets.filter((w) => w.id !== widgetId),
        };
        onSaveLayout(updatedLayout as WorkspaceLayout);
      }
    },
    [layout, widgets, onSaveLayout],
  );

  const handleCreateLayout = async (input: CreateWorkspaceLayoutInput) => {
    if (!onCreateLayout) {
      console.error("onCreateLayout function not provided");
      return;
    }

    try {
      const newLayout = await onCreateLayout(input);
      onLayoutChange(newLayout);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating layout:", error);
      throw error;
    }
  };

  if (!layout) {
    return (
      <>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
          <i className="ri-layout-line text-6xl text-cyan-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-white mb-2">
            No Layout Selected
          </h2>
          <p className="text-[#9ca3af] mb-6">
            Create a new layout or select an existing one
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Create Layout
          </button>
        </div>

        {onCreateLayout && (
          <LayoutCreationModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateLayout}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layout Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {layout.name}
          </h1>
          {layout.description && (
            <p className="text-[#9ca3af] mt-1">{layout.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <i className={`ri-${isEditing ? "check" : "edit"}-line mr-2`}></i>
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <WorkspaceGrid
        widgets={widgets}
        isEditing={isEditing}
        onWidgetMove={handleWidgetMove}
        onWidgetResize={handleWidgetResize}
        onWidgetRemove={handleWidgetRemove}
        renderWidget={(widget) => (
          <WorkspaceWidget
            key={widget.id}
            widget={widget}
            config={config}
            isEditing={isEditing}
            onRemove={() => handleWidgetRemove(widget.id)}
          />
        )}
      />
    </div>
  );
}
