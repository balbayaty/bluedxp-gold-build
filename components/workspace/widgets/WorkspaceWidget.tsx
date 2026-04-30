/**
 * Workspace Widget - Base Widget Component
 *
 * Resizable, collapsible widget with settings and actions
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WidgetRenderer } from "./WidgetRenderer";
import type { UserWidget, WorkspaceConfig } from "@/types/workspace";

interface WorkspaceWidgetProps {
  widget: UserWidget;
  config: WorkspaceConfig;
  isEditing: boolean;
  onRemove: () => void;
}

export function WorkspaceWidget({
  widget,
  config,
  isEditing,
  onRemove,
}: WorkspaceWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(widget.isCollapsed);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!widget.widgetDef) {
    return null;
  }

  const widgetDef = widget.widgetDef;

  return (
    <div className="w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <i className={`${widgetDef.icon} text-lg text-cyan-400`}></i>
          <h3 className="font-semibold text-white">{widgetDef.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {isEditing && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
              aria-label="Remove widget"
            >
              <i className="ri-close-line"></i>
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-white/10 text-white rounded transition-colors"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            <i
              className={`ri-${isCollapsed ? "arrow-down-s" : "arrow-up-s"}-line`}
            ></i>
          </button>
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <WidgetRenderer
              widget={widget}
              config={config}
              onLoad={() => setIsLoading(false)}
              onError={(err) => {
                setError(err);
                setIsLoading(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
