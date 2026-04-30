/**
 * Interactive Feature Demos Page
 * Showcase all BlueDXP platform features with interactive demos
 *
 * FEATURES:
 * - Feature categories (WMS, TMS, Proposals, AI, etc.)
 * - Live interactive demos
 * - Code examples
 * - Best practices
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import Warehouse3DVisualization from "@/components/wms/Warehouse3DVisualization";
import OutboundTimelineVisualization from "@/components/wms/OutboundTimelineVisualization";
import QHSECalendarGridView from "@/components/qhse/QHSECalendarGridView";
import D3AdvancedChart from "@/components/charts/D3AdvancedChart";
import ExportPDFButton from "@/components/shared/ExportPDFButton";

type DemoCategory = "visualization" | "export" | "ai" | "workflow" | "security";

interface Demo {
  id: string;
  title: string;
  description: string;
  category: DemoCategory;
  icon: string;
  component: React.ReactNode;
}

function InteractiveDemosPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<DemoCategory>("visualization");
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);

  const demos: Demo[] = [
    {
      id: "3d-warehouse",
      title: "3D Warehouse Visualization",
      description:
        "Interactive 3D warehouse layout with real-time inventory and heatmap overlay",
      category: "visualization",
      icon: "ri-building-4-line",
      component: (
        <Warehouse3DVisualization
          warehouseId="demo-warehouse"
          showHeatmap={true}
        />
      ),
    },
    {
      id: "outbound-timeline",
      title: "Outbound Timeline",
      description:
        "7-milestone tracking for outbound shipments with delay detection",
      category: "visualization",
      icon: "ri-timeline-view",
      component: <OutboundTimelineVisualization warehouseId="demo-warehouse" />,
    },
    {
      id: "qhse-calendar",
      title: "QHSE Calendar Grid",
      description:
        "Interactive calendar for incidents, audits, training, and inspections",
      category: "visualization",
      icon: "ri-calendar-line",
      component: <QHSECalendarGridView tenantId="demo" />,
    },
    {
      id: "d3-network",
      title: "D3 Network Graph",
      description: "Advanced relationship visualization using D3.js",
      category: "visualization",
      icon: "ri-node-tree",
      component: (
        <D3AdvancedChart
          type="network"
          data={{}}
          title="Module Relationships"
        />
      ),
    },
    {
      id: "pdf-export",
      title: "PDF Export",
      description: "Export any dashboard or report to PDF with branding",
      category: "export",
      icon: "ri-file-pdf-line",
      component: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Click the button below to export a sample dashboard to PDF:
          </p>
          <ExportPDFButton
            title="Sample Dashboard Export"
            subtitle="Generated from BlueDXP Platform"
            data={{ sample: "data" }}
            filename="sample-dashboard.pdf"
          />
        </div>
      ),
    },
  ];

  const categories = [
    {
      id: "visualization" as DemoCategory,
      name: "Visualizations",
      icon: "ri-bar-chart-box-line",
      count: demos.filter((d) => d.category === "visualization").length,
    },
    {
      id: "export" as DemoCategory,
      name: "Export",
      icon: "ri-download-line",
      count: demos.filter((d) => d.category === "export").length,
    },
    {
      id: "ai" as DemoCategory,
      name: "AI Features",
      icon: "ri-brain-line",
      count: demos.filter((d) => d.category === "ai").length,
    },
    {
      id: "workflow" as DemoCategory,
      name: "Workflows",
      icon: "ri-flow-chart",
      count: demos.filter((d) => d.category === "workflow").length,
    },
    {
      id: "security" as DemoCategory,
      name: "Security",
      icon: "ri-shield-check-line",
      count: demos.filter((d) => d.category === "security").length,
    },
  ];

  const filteredDemos = demos.filter((d) => d.category === selectedCategory);

  return (
    <PageTemplate
      title="Interactive Feature Demos"
      description="Explore BlueDXP platform capabilities with live interactive demonstrations"
      icon="ri-play-circle-line"
    >
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setSelectedDemo(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md"
              }`}
            >
              <i className={category.icon} />
              {category.name}
              {category.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === category.id
                      ? "bg-white/20"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {category.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemos.map((demo) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 p-6 cursor-pointer transition-all hover:shadow-xl"
              onClick={() => setSelectedDemo(demo)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <i className={`${demo.icon} text-2xl text-white`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {demo.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {demo.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click to view demo
                </span>
                <i className="ri-arrow-right-line text-blue-600 dark:text-blue-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {filteredDemos.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <i className="ri-inbox-line text-4xl mb-2 opacity-50" />
            <p>No demos in this category yet</p>
            <p className="text-sm mt-2">More demos coming soon!</p>
          </div>
        )}

        {/* Demo Modal */}
        <AnimatePresence>
          {selectedDemo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedDemo(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                        <i className={`${selectedDemo.icon} text-2xl`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          {selectedDemo.title}
                        </h2>
                        <p className="text-blue-100 mt-1">
                          {selectedDemo.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDemo(null)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <i className="ri-close-line text-2xl" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">{selectedDemo.component}</div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This is a live interactive demo. All features are fully
                      functional.
                    </p>
                    <button
                      onClick={() => setSelectedDemo(null)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Close Demo
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

export default function InteractiveDemosPageWrapper() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Interactive Feature Demos"
          description="Explore BlueDXP platform capabilities"
          icon="ri-play-circle-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <InteractiveDemosPage />
    </ErrorBoundary>
  );
}
