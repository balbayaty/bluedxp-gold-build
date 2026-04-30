/**
 * Widget Library - Browse and Add Widgets
 *
 * Displays available widgets filtered by permissions
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  WorkspaceConfig,
  WidgetDefinition,
  WidgetCategory,
} from "@/types/workspace";

interface WidgetLibraryProps {
  config: WorkspaceConfig;
  onClose: () => void;
  onWidgetAdd: (widget: WidgetDefinition) => void;
}

export function WidgetLibrary({
  config,
  onClose,
  onWidgetAdd,
}: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">(
    "ALL",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredWidgets = useMemo(() => {
    let widgets = config.availableWidgets;

    if (selectedCategory !== "ALL") {
      widgets = widgets.filter((w) => w.categoryId === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      widgets = widgets.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query) ||
          w.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return widgets;
  }, [config.availableWidgets, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Widget Library</h2>
          <p className="text-[#9ca3af] mt-1">
            {filteredWidgets.length} widgets available
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <i className="ri-close-line text-xl text-white"></i>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "grid"
                ? "bg-cyan-600 text-white"
                : "bg-white/5 text-white hover:bg-white/10"
            } transition-colors`}
          >
            <i className="ri-grid-line"></i>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "list"
                ? "bg-cyan-600 text-white"
                : "bg-white/5 text-white hover:bg-white/10"
            } transition-colors`}
          >
            <i className="ri-list-check"></i>
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedCategory === "ALL"
              ? "bg-cyan-600 text-white"
              : "bg-white/5 text-white hover:bg-white/10"
          } transition-colors`}
        >
          All
        </button>
        {config.availableCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedCategory === category.id
                ? "bg-cyan-600 text-white"
                : "bg-white/5 text-white hover:bg-white/10"
            } transition-colors`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Widget Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWidgets.map((widget) => (
            <div
              key={widget.id}
              onClick={() => onWidgetAdd(widget)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className={`${widget.icon} text-2xl text-cyan-400`}></i>
                  <div>
                    <h3 className="font-semibold text-white">{widget.name}</h3>
                    <span className="text-xs text-[#9ca3af]">
                      {
                        config.availableCategories.find(
                          (c) => c.id === widget.categoryId,
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#9ca3af] mb-3">
                {widget.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {widget.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-white/5 text-[#9ca3af] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWidgets.map((widget) => (
            <div
              key={widget.id}
              onClick={() => onWidgetAdd(widget)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <i className={`${widget.icon} text-2xl text-cyan-400`}></i>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">
                        {widget.name}
                      </h3>
                      <span className="text-xs text-[#9ca3af] bg-white/5 px-2 py-1 rounded">
                        {
                          config.availableCategories.find(
                            (c) => c.id === widget.categoryId,
                          )?.name
                        }
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af] mt-1">
                      {widget.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredWidgets.length === 0 && (
        <div className="text-center py-12 text-[#9ca3af]">
          <i className="ri-search-line text-4xl mb-4"></i>
          <p>No widgets found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
