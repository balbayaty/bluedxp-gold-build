/**
 * Widget Dock Component
 *
 * Dock for collapsed/minimized widgets
 * Provides quick access without taking up screen space
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { widgetManager } from "@/lib/services/widget-manager";
import { GripVertical } from "lucide-react";

interface WidgetDockProps {
  position?: "top" | "bottom" | "left" | "right";
}

export function WidgetDock({ position = "bottom" }: WidgetDockProps) {
  const [expanded, setExpanded] = useState(false);
  const positions = widgetManager.getAllPositions();

  const dockedWidgets = Array.from(positions.values()).filter(
    (p) => p.docked && p.dockedEdge === position,
  );
  const collapsedWidgets = Array.from(positions.values()).filter(
    (p) => p.collapsed && !p.docked,
  );

  const allWidgets = [...dockedWidgets, ...collapsedWidgets];

  if (allWidgets.length === 0) return null;

  return (
    <motion.div
      className={`fixed ${
        position === "bottom"
          ? "bottom-0 left-0 right-0"
          : position === "top"
            ? "top-0 left-0 right-0"
            : position === "left"
              ? "left-0 top-0 bottom-0"
              : "right-0 top-0 bottom-0"
      } z-[9998] pointer-events-none`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        className={`${
          position === "bottom" || position === "top" ? "flex-row" : "flex-col"
        } flex items-center gap-2 p-2 pointer-events-auto`}
      >
        <AnimatePresence>
          {allWidgets.map((widgetPos) => (
            <motion.button
              key={widgetPos.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                widgetManager.expandWidget(widgetPos.id);
                widgetManager.bringToFront(widgetPos.id);
              }}
              className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow flex items-center gap-2"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{widgetPos.id}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
