/**
 * Workspace Page - Enterprise-Grade Workspace Experience
 *
 * Mind-blowing UI/UX with intelligent category display
 * 4IR & 5IR Aligned • Professional • Enterprise-Grade
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";
import { WorkspaceContainer } from "@/components/workspace/WorkspaceContainer";
import { WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";
import type {
  WorkspaceConfig,
  WorkspaceLayout,
  WidgetDefinition,
  WidgetCategory,
} from "@/types/workspace";

// Professional icon mapping for categories
const categoryIcons: Record<string, string> = {
  Management: "ri-building-4-line",
  "Finance & Accounting": "ri-money-dollar-circle-line",
  Operations: "ri-settings-3-line",
  Analytics: "ri-bar-chart-box-line",
  Compliance: "ri-shield-check-line",
  IoT: "ri-wifi-line",
  "AI/ML": "ri-brain-line",
  System: "ri-server-line",
  "Warehouse Management": "ri-warehouse-line",
  Transportation: "ri-truck-line",
  Quality: "ri-award-line",
  Safety: "ri-shield-star-line",
  Environmental: "ri-leaf-line",
  "Human Resources": "ri-team-line",
  "Supply Chain": "ri-links-line",
  Financial: "ri-money-cny-circle-line",
  Metrics: "ri-dashboard-line",
};

// Professional gradient colors
const categoryGradients: Record<string, string> = {
  Management: "from-blue-600 via-cyan-500 to-teal-500",
  "Finance & Accounting": "from-emerald-600 via-green-500 to-lime-500",
  Operations: "from-purple-600 via-pink-500 to-rose-500",
  Analytics: "from-orange-600 via-amber-500 to-yellow-500",
  Compliance: "from-red-600 via-pink-500 to-rose-500",
  IoT: "from-indigo-600 via-blue-500 to-cyan-500",
  "AI/ML": "from-violet-600 via-purple-500 to-fuchsia-500",
  System: "from-slate-600 via-gray-500 to-zinc-500",
  "Warehouse Management": "from-blue-600 via-cyan-500 to-teal-500",
  Transportation: "from-indigo-600 via-blue-500 to-cyan-500",
  Quality: "from-emerald-600 via-green-500 to-lime-500",
  Safety: "from-red-600 via-orange-500 to-yellow-500",
  Environmental: "from-green-600 via-emerald-500 to-teal-500",
  "Human Resources": "from-purple-600 via-pink-500 to-rose-500",
  "Supply Chain": "from-blue-600 via-indigo-500 to-purple-500",
  Financial: "from-emerald-600 via-green-500 to-lime-500",
  Metrics: "from-cyan-600 via-blue-500 to-indigo-500",
};

export default function WorkspacePage() {
  const router = useRouter();
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [currentLayout, setCurrentLayout] = useState<WorkspaceLayout | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    // Always show categories if no layout is selected
    // Even if API returns empty, we'll show fallback categories
    const shouldShow = !currentLayout && !!config && !loading;
    console.log("[Workspace] Show categories?", {
      shouldShow,
      hasCurrentLayout: !!currentLayout,
      hasConfig: !!config,
      isLoading: loading,
      categoriesCount: config?.availableCategories?.length || 0,
    });
    setShowCategories(shouldShow);
  }, [currentLayout, config, loading]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/v1/workspace/config");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          `Failed to load workspace (${response.status})`;
        setError(errorMessage);
        console.error("Error loading workspace:", errorMessage);
        return;
      }

      const data = await response.json();
      console.log("[Workspace] Config loaded:", {
        hasCategories: !!data.availableCategories,
        categoriesCount: data.availableCategories?.length || 0,
        hasDefaultLayout: !!data.defaultLayout,
      });
      setConfig(data);
      if (data.defaultLayout) {
        setCurrentLayout(data.defaultLayout);
      } else {
        // Explicitly set to null to trigger categories display
        setCurrentLayout(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLayoutChange = (layout: WorkspaceLayout) => {
    setCurrentLayout(layout);
  };

  const handleSaveLayout = async (layout: WorkspaceLayout) => {
    try {
      const response = await fetch(`/api/v1/workspace/layouts/${layout.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
      if (response.ok) {
        const updated = await response.json();
        setCurrentLayout(updated);
      }
    } catch (error) {
      console.error("Error saving layout:", error);
    }
  };

  const handleCreateLayout = async (input: any) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/v1/workspace/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          `Failed to create layout (${response.status})`;
        throw new Error(errorMessage);
      }

      const newLayout = await response.json();

      if (!newLayout || !newLayout.id) {
        throw new Error("Invalid response from server");
      }

      setCurrentLayout(newLayout);
      loadWorkspace().catch((err) => {
        console.warn("Failed to reload workspace config:", err);
      });

      return newLayout;
    } catch (error) {
      console.error("Error creating layout:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(
            "Request timed out. Please check your connection and try again.",
          );
        }
        throw error;
      }

      throw new Error("An unexpected error occurred. Please try again.");
    }
  };

  const handleWidgetAdd = async (widget: WidgetDefinition) => {
    if (!currentLayout) {
      alert("Please create a layout first before adding widgets.");
      return;
    }

    try {
      const existingWidgets = currentLayout.widgets || [];
      const cols = 12;
      const widgetWidth = (widget.defaultSize as any)?.width || 2;
      const widgetHeight = (widget.defaultSize as any)?.height || 1;

      let x = 0;
      let y = 0;
      let placed = false;

      for (let row = 0; row < 10 && !placed; row++) {
        for (let col = 0; col < cols - widgetWidth + 1; col++) {
          const wouldOverlap = existingWidgets.some((w: any) => {
            const pos = w.position || {};
            const wX = pos.x || 0;
            const wY = pos.y || 0;
            const wW = pos.w || 2;
            const wH = pos.h || 1;

            return !(
              col + widgetWidth <= wX ||
              col >= wX + wW ||
              row + widgetHeight <= wY ||
              row >= wY + wH
            );
          });

          if (!wouldOverlap) {
            x = col;
            y = row;
            placed = true;
            break;
          }
        }
      }

      const response = await fetch("/api/v1/workspace/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetDefId: widget.id,
          layoutId: currentLayout.id,
          position: { x, y, w: widgetWidth, h: widgetHeight },
          config: {},
          order: existingWidgets.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || "Failed to add widget",
        );
      }

      const newWidget = await response.json();

      const layoutResponse = await fetch(
        `/api/v1/workspace/layouts/${currentLayout.id}`,
      );
      if (layoutResponse.ok) {
        const updatedLayout = await layoutResponse.json();
        setCurrentLayout(updatedLayout);
      }
    } catch (error) {
      console.error("Error adding widget:", error);
      alert(error instanceof Error ? error.message : "Failed to add widget");
    }
  };

  const handleCategoryClick = (category: WidgetCategory) => {
    router.push(`/workspace?category=${category.slug || category.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-white text-sm">Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (!config && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-center text-white max-w-md px-4">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xl font-semibold mb-2">
              Failed to load workspace
            </p>
            {error && <p className="text-sm text-gray-400 mb-4">{error}</p>}
            {!error && (
              <p className="text-sm text-gray-400 mb-4">
                Unable to load workspace configuration. Please check your
                connection and try again.
              </p>
            )}
          </div>
          <button
            onClick={loadWorkspace}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e]">
      {/* Toolbar */}
      <WorkspaceToolbar
        config={config}
        currentLayout={currentLayout}
        onLayoutChange={handleLayoutChange}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onWidgetAdd={handleWidgetAdd}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">
            Debug: showCategories={String(showCategories)}, hasLayout=
            {String(!!currentLayout)}, hasConfig={String(!!config)}, categories=
            {config?.availableCategories?.length || 0}
          </div>
        )}
        <AnimatePresence mode="wait">
          {showCategories ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <EnterpriseCategoryGrid
                categories={
                  config?.availableCategories &&
                  config.availableCategories.length > 0
                    ? config.availableCategories
                    : getFallbackCategories()
                }
                onCategoryClick={handleCategoryClick}
              />
            </motion.div>
          ) : currentLayout ? (
            <motion.div
              key="layout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <WorkspaceContainer
                config={config}
                layout={currentLayout}
                onLayoutChange={handleLayoutChange}
                onSaveLayout={handleSaveLayout}
                onCreateLayout={handleCreateLayout}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 max-w-2xl mx-auto">
                <i className="ri-layout-line text-6xl text-cyan-400 mb-6 block"></i>
                <h2 className="text-2xl font-bold text-white mb-4">
                  No Layout Selected
                </h2>
                <p className="text-gray-400 mb-8">
                  Create a new layout or select an existing one to get started
                </p>
                <button
                  onClick={() => {
                    // Trigger layout creation
                    const event = new CustomEvent("workspace:create-layout");
                    window.dispatchEvent(event);
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Create Layout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      {showSettings && config && (
        <WorkspaceSettings
          config={config}
          onClose={() => setShowSettings(false)}
          onConfigUpdate={setConfig}
        />
      )}
    </div>
  );
}

// Fallback categories if API doesn't return any
function getFallbackCategories(): WidgetCategory[] {
  return [
    {
      id: "management",
      name: "Management",
      slug: "management",
      description: "Enterprise Facility & Asset Management",
      icon: "ri-building-4-line",
      color: "blue",
      order: 1,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "finance-accounting",
      name: "Finance & Accounting",
      slug: "finance-accounting",
      description: "Comprehensive Financial Management",
      icon: "ri-money-dollar-circle-line",
      color: "green",
      order: 2,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "operations",
      name: "Operations",
      slug: "operations",
      description: "Operational workflows and processes",
      icon: "ri-settings-3-line",
      color: "purple",
      order: 3,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "analytics",
      name: "Analytics",
      slug: "analytics",
      description: "Business intelligence and insights",
      icon: "ri-bar-chart-box-line",
      color: "orange",
      order: 4,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as WidgetCategory[];
}

// Enterprise-Grade Category Grid Component
interface EnterpriseCategoryGridProps {
  categories: WidgetCategory[];
  onCategoryClick: (category: WidgetCategory) => void;
}

function EnterpriseCategoryGrid({
  categories,
  onCategoryClick,
}: EnterpriseCategoryGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || "ri-folder-line";
  };

  const getGradient = (categoryName: string) => {
    return (
      categoryGradients[categoryName] ||
      "from-cyan-600 via-blue-500 to-indigo-500"
    );
  };

  // Safety check - if no categories, show fallback
  const displayCategories =
    categories.length > 0 ? categories : getFallbackCategories();

  console.log(
    "[EnterpriseCategoryGrid] Rendering with",
    displayCategories.length,
    "categories",
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Workspace Categories
        </h1>
        <p className="text-xl text-gray-400">
          Explore intelligent modules and capabilities
        </p>
      </motion.div>

      {/* Category Grid - Responsive, No Scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayCategories.map((category, index) => {
          const icon = getIcon(category.name);
          const gradient = getGradient(category.name);
          const isHovered = hoveredIndex === index;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: isHovered ? -8 : 0,
                scale: 1,
              }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                type: "spring",
                stiffness: 100,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onCategoryClick(category)}
              className="group relative cursor-pointer"
            >
              {/* Glow Effect */}
              <motion.div
                animate={{
                  opacity: isHovered ? 0.4 : 0,
                  scale: isHovered ? 1.1 : 1,
                }}
                className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur-xl`}
              />

              {/* Card */}
              <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-white/20">
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: isHovered ? 1.15 : 1,
                    rotate: isHovered ? 5 : 0,
                  }}
                  className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
                >
                  <i className={`${icon} text-3xl text-white`}></i>
                </motion.div>

                {/* Category Name */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all">
                  {category.name}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                  {category.description ||
                    "Explore category modules and capabilities"}
                </p>

                {/* Action Indicator */}
                <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm">
                  <span>Explore</span>
                  <motion.i
                    animate={{
                      x: isHovered ? [0, 5, 0] : 0,
                    }}
                    transition={{
                      duration: 1,
                      repeat: isHovered ? Infinity : 0,
                    }}
                    className="ri-arrow-right-line text-lg"
                  ></motion.i>
                </div>

                {/* Shine Effect */}
                <motion.div
                  animate={{
                    x: isHovered ? ["-100%", "200%"] : "-100%",
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isHovered ? Infinity : 0,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 rounded-2xl"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
