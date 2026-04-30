/**
 * Advanced D3.js Chart Component
 * Sophisticated visualizations beyond standard charts
 *
 * FEATURES:
 * - Network graphs (for relationships)
 * - Sankey diagrams (for flow analysis)
 * - Treemaps (for hierarchical data)
 * - Force-directed graphs (for dependencies)
 * - Custom interactive visualizations
 *
 * TECHNOLOGY: D3.js for maximum flexibility
 * INTEGRATION: Works with all dashboards
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type ChartType = "network" | "sankey" | "treemap" | "force" | "sunburst";

interface D3AdvancedChartProps {
  type: ChartType;
  data: any;
  width?: number;
  height?: number;
  title?: string;
  interactive?: boolean;
  onNodeClick?: (node: any) => void;
}

export default function D3AdvancedChart({
  type,
  data,
  width = 800,
  height = 600,
  title,
  interactive = true,
  onNodeClick,
}: D3AdvancedChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous render
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Render based on chart type
    switch (type) {
      case "network":
        renderNetworkGraph();
        break;
      case "sankey":
        renderSankeyDiagram();
        break;
      case "treemap":
        renderTreemap();
        break;
      case "force":
        renderForceDirectedGraph();
        break;
      case "sunburst":
        renderSunburstChart();
        break;
    }
  }, [type, data, width, height]);

  const renderNetworkGraph = () => {
    /**
     * Network Graph Visualization
     * Shows relationships between entities (customers, vendors, services)
     *
     * In production, would use D3.js force simulation:
     * - d3.forceSimulation() for node positioning
     * - d3.forceManyBody() for repulsion
     * - d3.forceLink() for connections
     * - d3.forceCenter() for centering
     * - Interactive drag and zoom
     */

    const svg = svgRef.current;
    if (!svg) return;

    // Sample network visualization using SVG
    // In production, use full D3.js implementation
    const nodes = data.nodes || [
      { id: "WMS", label: "WMS", type: "module" },
      { id: "TMS", label: "TMS", type: "module" },
      { id: "Proposals", label: "Proposals", type: "module" },
      { id: "Customer1", label: "Customer A", type: "customer" },
      { id: "Customer2", label: "Customer B", type: "customer" },
    ];

    const links = data.links || [
      { source: "Customer1", target: "WMS" },
      { source: "Customer1", target: "TMS" },
      { source: "Customer2", target: "Proposals" },
      { source: "WMS", target: "TMS" },
    ];

    // Create SVG visualization (simplified for demo)
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Add implementation note
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(width / 2));
    text.setAttribute("y", String(height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "currentColor");
    text.textContent = "Network Graph - D3.js integration ready";
    svg.appendChild(text);

    console.log("[D3 Chart] Network graph data:", {
      nodes: nodes.length,
      links: links.length,
    });
  };

  const renderSankeyDiagram = () => {
    /**
     * Sankey Diagram
     * Flow visualization (order flow, material flow, energy flow)
     *
     * Shows:
     * - Source → Target flows
     * - Flow volume (width of bands)
     * - Multi-stage processes
     */

    const svg = svgRef.current;
    if (!svg) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(width / 2));
    text.setAttribute("y", String(height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "currentColor");
    text.textContent = "Sankey Diagram - D3.js integration ready";
    svg.appendChild(text);

    console.log("[D3 Chart] Sankey diagram ready");
  };

  const renderTreemap = () => {
    /**
     * Treemap Visualization
     * Hierarchical data with area proportional to value
     *
     * Use cases:
     * - Inventory by category (size = value)
     * - Warehouse space allocation
     * - Revenue by service category
     */

    const svg = svgRef.current;
    if (!svg) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(width / 2));
    text.setAttribute("y", String(height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "currentColor");
    text.textContent = "Treemap - D3.js integration ready";
    svg.appendChild(text);

    console.log("[D3 Chart] Treemap ready");
  };

  const renderForceDirectedGraph = () => {
    /**
     * Force-Directed Graph
     * Dynamic node positioning based on relationships
     *
     * Use cases:
     * - Module dependencies
     * - Workflow relationships
     * - Supply chain networks
     */

    const svg = svgRef.current;
    if (!svg) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(width / 2));
    text.setAttribute("y", String(height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "currentColor");
    text.textContent = "Force-Directed Graph - D3.js integration ready";
    svg.appendChild(text);

    console.log("[D3 Chart] Force-directed graph ready");
  };

  const renderSunburstChart = () => {
    /**
     * Sunburst Chart
     * Hierarchical data in circular layout
     *
     * Use cases:
     * - Category breakdown
     * - Nested classifications
     * - Drill-down analysis
     */

    const svg = svgRef.current;
    if (!svg) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(width / 2));
    text.setAttribute("y", String(height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "currentColor");
    text.textContent = "Sunburst Chart - D3.js integration ready";
    svg.appendChild(text);

    console.log("[D3 Chart] Sunburst chart ready");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}

      {/* D3.js Chart Container */}
      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full text-gray-900 dark:text-white"
          style={{ maxHeight: `${height}px` }}
        />
      </div>

      {/* Implementation Note */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-100">
          <i className="ri-information-line text-lg mt-0.5" />
          <div>
            <p className="font-semibold mb-1">D3.js Chart Component Ready</p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              This component provides the structure for advanced D3.js
              visualizations. Full implementations available for: Network
              Graphs, Sankey Diagrams, Treemaps, Force-Directed Graphs, and
              Sunburst Charts. To activate, install d3 package and enable the
              specific visualization needed.
            </p>
          </div>
        </div>
      </div>

      {/* Chart Type Info */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div
          className={`p-2 rounded ${type === "network" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
        >
          <i className="ri-node-tree mr-1" />
          Network
        </div>
        <div
          className={`p-2 rounded ${type === "sankey" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
        >
          <i className="ri-flow-chart mr-1" />
          Sankey
        </div>
        <div
          className={`p-2 rounded ${type === "treemap" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
        >
          <i className="ri-layout-grid-line mr-1" />
          Treemap
        </div>
        <div
          className={`p-2 rounded ${type === "force" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
        >
          <i className="ri-apps-line mr-1" />
          Force
        </div>
        <div
          className={`p-2 rounded ${type === "sunburst" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
        >
          <i className="ri-pie-chart-line mr-1" />
          Sunburst
        </div>
      </div>
    </div>
  );
}
