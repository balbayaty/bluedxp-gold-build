/**
 * Draggable Widget Wrapper
 *
 * Makes any widget draggable, resizable, and collapsible
 * Prevents overlaps and provides beautiful UX
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { widgetManager, WidgetPosition } from "@/lib/services/widget-manager";
import { X, Minimize2, Maximize2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraggableWidgetProps {
  widgetId: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  priority?: "high" | "medium" | "low";
  onClose?: () => void;
  className?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function DraggableWidget({
  widgetId,
  title,
  children,
  defaultPosition,
  defaultSize,
  priority = "medium",
  onClose,
  className = "",
  minWidth = 300,
  minHeight = 200,
  maxWidth,
  maxHeight,
}: DraggableWidgetProps) {
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(defaultSize?.width || 400);
  const height = useMotionValue(defaultSize?.height || 300);

  // Update motion values when position changes
  useEffect(() => {
    if (position) {
      x.set(position.x);
      y.set(position.y);
      if (position.width) width.set(position.width);
      if (position.height) height.set(position.height);
    }
  }, [position, x, y, width, height]);

  useEffect(() => {
    // Register widget
    widgetManager.registerWidget({
      id: widgetId,
      name: title,
      component: () => null,
      defaultPosition: defaultPosition || {
        x: window.innerWidth - 420,
        y: 100,
      },
      defaultSize,
      zIndex: priority === "high" ? 1000 : priority === "medium" ? 500 : 100,
      priority,
      draggable: true,
      resizable: true,
      collapsible: true,
      dockable: true,
    });

    // Get initial position
    const initialPos = widgetManager.getPosition(widgetId);
    if (initialPos) {
      setPosition(initialPos);
      x.set(initialPos.x);
      y.set(initialPos.y);
      if (initialPos.width) width.set(initialPos.width);
      if (initialPos.height) height.set(initialPos.height);
    } else {
      // Find best position
      const bestPos = widgetManager.findBestPosition(
        defaultSize?.width || 400,
        defaultSize?.height || 300,
        priority,
      );
      const newPos = widgetManager.updatePosition(widgetId, bestPos);
      setPosition(newPos);
      x.set(newPos.x);
      y.set(newPos.y);
    }

    // Load saved position
    widgetManager.loadPositions();
    const saved = widgetManager.getPosition(widgetId);
    if (saved) {
      setPosition(saved);
      x.set(saved.x);
      y.set(saved.y);
      if (saved.width) width.set(saved.width);
      if (saved.height) height.set(saved.height);
    }
  }, [
    widgetId,
    title,
    defaultPosition,
    defaultSize,
    priority,
    x,
    y,
    width,
    height,
  ]);

  const handleDragStart = () => {
    setIsDragging(true);
    widgetManager.bringToFront(widgetId);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    const newX = x.get() + info.offset.x;
    const newY = y.get() + info.offset.y;

    const updated = widgetManager.updatePosition(widgetId, {
      x: newX,
      y: newY,
    });
    setPosition(updated);
    x.set(updated.x);
    y.set(updated.y);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
    widgetManager.bringToFront(widgetId);
  };

  const handleResizeEnd = (newWidth: number, newHeight: number) => {
    setIsResizing(false);
    const w = Math.max(minWidth, Math.min(newWidth, maxWidth || Infinity));
    const h = Math.max(minHeight, Math.min(newHeight, maxHeight || Infinity));

    const updated = widgetManager.updatePosition(widgetId, {
      width: w,
      height: h,
    });
    setPosition(updated);
    width.set(w);
    height.set(h);
  };

  const handleCollapse = () => {
    if (position?.collapsed) {
      widgetManager.expandWidget(widgetId);
    } else {
      widgetManager.collapseWidget(widgetId);
    }
    const updated = widgetManager.getPosition(widgetId);
    if (updated) setPosition(updated);
  };

  if (!position) return null;

  const currentZIndex =
    position.zIndex ||
    (priority === "high" ? 1000 : priority === "medium" ? 500 : 100);

  return (
    <motion.div
      ref={widgetRef}
      className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 ${className}`}
      style={{
        x,
        y,
        width: position.collapsed ? "auto" : width,
        height: position.collapsed ? "auto" : height,
        zIndex: currentZIndex,
        cursor: isDragging ? "grabbing" : "default",
      }}
      drag={!position.docked && !position.collapsed}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
      animate={{
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging
          ? "0 20px 40px rgba(0,0,0,0.3)"
          : "0 4px 6px rgba(0,0,0,0.1)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 cursor-move"
        onMouseDown={(e) => {
          if (!position.docked && !position.collapsed) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapse}
            className="h-6 w-6 p-0"
          >
            {position.collapsed ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!position.collapsed && (
        <div className="overflow-auto" style={{ height: height.get() - 50 }}>
          {children}
        </div>
      )}

      {/* Resize Handle */}
      {!position.collapsed && !position.docked && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
          style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleResizeStart();

            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = width.get();
            const startHeight = height.get();

            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = startWidth + (e.clientX - startX);
              const newHeight = startHeight + (e.clientY - startY);
              width.set(newWidth);
              height.set(newHeight);
            };

            const handleMouseUp = () => {
              handleResizeEnd(width.get(), height.get());
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
      )}
    </motion.div>
  );
}
