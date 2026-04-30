/**
 * Draggable Dashboard Component
 * Drag-and-drop dashboard customization
 * Much more comprehensive than source apps
 */

"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WidgetDefinition } from "@/lib/services/dashboards/widgetLibrary";
import WidgetLibrary from "./WidgetLibrary";

interface DashboardWidget {
  id: string;
  widget: WidgetDefinition;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, any>;
}

interface DraggableDashboardProps {
  initialWidgets?: DashboardWidget[];
  onSave?: (widgets: DashboardWidget[]) => void;
  editable?: boolean;
}

export default function DraggableDashboard({
  initialWidgets = [],
  onSave,
  editable = true,
}: DraggableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [gridSize] = useState(12); // 12-column grid

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const handleAddWidget = (widget: WidgetDefinition) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      widget,
      position: { x: 0, y: widgets.length },
      size: widget.defaultSize,
      config: {},
    };

    setWidgets([...widgets, newWidget]);
    setShowWidgetLibrary(false);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const handleResizeWidget = (
    id: string,
    size: { width: number; height: number },
  ) => {
    setWidgets(
      widgets.map((w) =>
        w.id === id
          ? {
              ...w,
              size: {
                width: Math.max(
                  w.widget.defaultSize.minWidth || 1,
                  Math.min(
                    w.widget.defaultSize.maxWidth || gridSize,
                    size.width,
                  ),
                ),
                height: Math.max(
                  w.widget.defaultSize.minHeight || 1,
                  Math.min(w.widget.defaultSize.maxHeight || 12, size.height),
                ),
              },
            }
          : w,
      ),
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave(widgets);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Custom Dashboard</h1>
        <div className="flex gap-2">
          {editable && (
            <>
              <button
                onClick={() => setShowWidgetLibrary(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <i className="ri-add-line mr-2"></i>
                Add Widget
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i className="ri-save-line mr-2"></i>
                Save Dashboard
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-12 gap-4">
            {widgets.map((widgetItem) => (
              <SortableWidget
                key={widgetItem.id}
                widgetItem={widgetItem}
                gridSize={gridSize}
                editable={editable}
                onRemove={handleRemoveWidget}
                onResize={handleResizeWidget}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg shadow-lg p-4 opacity-90">
              <p className="font-semibold">
                {widgets.find((w) => w.id === activeId)?.widget.name}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Widget Library
              </h2>
              <button
                onClick={() => setShowWidgetLibrary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <WidgetLibrary onSelectWidget={handleAddWidget} />
            </div>
          </div>
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
          <i className="ri-dashboard-line text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-500 text-lg mb-4">No widgets added yet</p>
          {editable && (
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Widget
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Sortable Widget Component
interface SortableWidgetProps {
  widgetItem: DashboardWidget;
  gridSize: number;
  editable: boolean;
  onRemove: (id: string) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
}

function SortableWidget({
  widgetItem,
  gridSize,
  editable,
  onRemove,
  onResize,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widgetItem.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`col-span-${widgetItem.size.width} bg-white rounded-lg shadow p-4 relative group ${
        editable ? "cursor-move" : ""
      }`}
      {...attributes}
      {...(editable ? listeners : {})}
    >
      {editable && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onRemove(widgetItem.id)}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <i className={`${widgetItem.widget.icon} text-xl text-blue-600`}></i>
        <h3 className="font-semibold text-gray-900">
          {widgetItem.widget.name}
        </h3>
      </div>

      <div className="text-sm text-gray-600">
        <p>{widgetItem.widget.description}</p>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Widget Preview</p>
          <p className="text-xs text-gray-400 mt-2">
            Configure this widget to display your data
          </p>
        </div>
      </div>

      {editable && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button
            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() =>
              onResize(widgetItem.id, {
                width: Math.max(1, widgetItem.size.width - 1),
                height: widgetItem.size.height,
              })
            }
          >
            <i className="ri-subtract-line text-xs"></i>
          </button>
          <button
            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() =>
              onResize(widgetItem.id, {
                width: Math.min(gridSize, widgetItem.size.width + 1),
                height: widgetItem.size.height,
              })
            }
          >
            <i className="ri-add-line text-xs"></i>
          </button>
        </div>
      )}
    </div>
  );
}
