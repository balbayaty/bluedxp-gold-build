/**
 * Workspace Toolbar - Top Navigation Bar
 *
 * Layout switching, widget library, settings, integrations
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetLibrary } from "./WidgetLibrary";
import type { WorkspaceConfig, WorkspaceLayout } from "@/types/workspace";

interface WorkspaceToolbarProps {
  config: WorkspaceConfig;
  currentLayout: WorkspaceLayout | null;
  onLayoutChange: (layout: WorkspaceLayout) => void;
  onSettingsToggle: () => void;
  onWidgetAdd?: (widget: any) => Promise<void>;
}

export function WorkspaceToolbar({
  config,
  currentLayout,
  onLayoutChange,
  onSettingsToggle,
  onWidgetAdd,
}: WorkspaceToolbarProps) {
  const [layouts, setLayouts] = useState<WorkspaceLayout[]>([]);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/workspace/layouts");
      if (response.ok) {
        const data = await response.json();
        setLayouts(data);
      }
    } catch (error) {
      console.error("Error loading layouts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Layout Selector */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Workspace</h1>

              <select
                value={currentLayout?.id || ""}
                onChange={(e) => {
                  const layout = layouts.find((l) => l.id === e.target.value);
                  if (layout) onLayoutChange(layout);
                }}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select Layout</option>
                {layouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name} {layout.isDefault && "(Default)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWidgetLibrary(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <i className="ri-add-line"></i>
                Add Widget
              </button>

              <button
                onClick={onSettingsToggle}
                className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <i className="ri-settings-3-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Library Modal */}
      <AnimatePresence>
        {showWidgetLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowWidgetLibrary(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1f2937] border border-white/10 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <WidgetLibrary
                config={config}
                onClose={() => setShowWidgetLibrary(false)}
                onWidgetAdd={async (widget) => {
                  if (onWidgetAdd) {
                    await onWidgetAdd(widget);
                  }
                  setShowWidgetLibrary(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
