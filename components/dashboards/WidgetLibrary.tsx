/**
 * Comprehensive Widget Library Component
 * Browse and add widgets to dashboards
 * Much more comprehensive than source apps
 */

"use client";

import { useState, useMemo } from "react";
import {
  widgetLibraryService,
  type WidgetDefinition,
  type WidgetCategory,
} from "@/lib/services/dashboards/widgetLibrary";

interface WidgetLibraryProps {
  onSelectWidget?: (widget: WidgetDefinition) => void;
  selectedWidgets?: string[];
  moduleId?: string;
}

export default function WidgetLibrary({
  onSelectWidget,
  selectedWidgets = [],
  moduleId,
}: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    WidgetCategory | "ALL"
  >("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories: (WidgetCategory | "ALL")[] = [
    "ALL",
    "METRICS",
    "ANALYTICS",
    "VISUALIZATION",
    "OPERATIONS",
    "COMPLIANCE",
    "SAFETY",
    "ENVIRONMENTAL",
    "QUALITY",
    "FINANCIAL",
    "HUMAN_RESOURCES",
    "SUPPLY_CHAIN",
    "IOT",
    "AI_ML",
    "SYSTEM",
  ];

  const widgets = useMemo(() => {
    let filtered = moduleId
      ? widgetLibraryService.getRecommendedWidgets(moduleId)
      : widgetLibraryService.getAllWidgets();

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = widgetLibraryService.searchWidgets(searchQuery);
    }

    return filtered;
  }, [searchQuery, selectedCategory, moduleId]);

  const handleSelectWidget = (widget: WidgetDefinition) => {
    if (onSelectWidget) {
      onSelectWidget(widget);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Widget Library</h1>
          <p className="text-gray-600 mt-1">
            {widgets.length} widgets available - Browse and add to your
            dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              onClick={() => handleSelectWidget(widget)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition ${
                selectedWidgets.includes(widget.id)
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className={`${widget.icon} text-2xl text-blue-600`}></i>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {widget.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {widget.category.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                {selectedWidgets.includes(widget.id) && (
                  <i className="ri-checkbox-circle-fill text-blue-600 text-xl"></i>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {widget.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Size: {widget.defaultSize.width}×{widget.defaultSize.height}
                </span>
                {widget.dataSource.type === "REAL_TIME" && (
                  <span className="flex items-center gap-1 text-red-600">
                    <i className="ri-pulse-line"></i>
                    Live
                  </span>
                )}
                {widget.dataSource.type === "AI_GENERATED" && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <i className="ri-magic-line"></i>
                    AI
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              onClick={() => handleSelectWidget(widget)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${
                selectedWidgets.includes(widget.id)
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <i className={`${widget.icon} text-2xl text-blue-600`}></i>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {widget.name}
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {widget.category.replace(/_/g, " ")}
                      </span>
                      {widget.dataSource.type === "REAL_TIME" && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <i className="ri-pulse-line"></i>
                          Live
                        </span>
                      )}
                      {widget.dataSource.type === "AI_GENERATED" && (
                        <span className="text-xs text-purple-600 flex items-center gap-1">
                          <i className="ri-magic-line"></i>
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {widget.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {widget.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {widget.defaultSize.width}×{widget.defaultSize.height}
                    </span>
                    {selectedWidgets.includes(widget.id) && (
                      <i className="ri-checkbox-circle-fill text-blue-600 text-xl block mt-2"></i>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="ri-search-line text-4xl mb-4"></i>
          <p>No widgets found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
