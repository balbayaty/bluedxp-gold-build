/**
 * Network Modeling Page
 *
 * Comprehensive logistics network design and optimization
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Network,
  MapPin,
  Zap,
  TrendingUp,
  Settings,
  Download,
  Upload,
  Play,
  RefreshCw,
  BarChart3,
  Target,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import NetworkGraphVisualization from "@/components/transportation/NetworkGraphVisualization";
import type {
  NetworkModel,
  NetworkOptimizationResult,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function NetworkModelingPage() {
  const [models, setModels] = useState<NetworkModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<NetworkModel | null>(null);
  const [optimizationResult, setOptimizationResult] =
    useState<NetworkOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<
    "VISUALIZATION" | "METRICS" | "OPTIMIZATION"
  >("VISUALIZATION");

  const loadModels = async () => {
    try {
      const response = await apiFetch("/api/transportation/network-modeling");
      const data = await response.json();
      if (data.models) {
        setModels(data.models);
        if (data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0]);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading models", err, {
        module: "transportation",
        service: "network-modeling",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "network-modeling",
      });
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const runOptimization = async () => {
    if (!selectedModel) return;

    setIsOptimizing(true);
    try {
      const response = await apiFetch("/api/transportation/network-modeling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize",
          modelId: selectedModel.id,
          objectives: ["MINIMIZE_COST", "MAXIMIZE_COVERAGE"],
        }),
      });

      const result = await response.json();
      setOptimizationResult(result);
      setViewMode("OPTIMIZATION");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error optimizing network", err, {
        module: "transportation",
        service: "network-modeling",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "network-modeling",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <PageTemplate
      title="Network Modeling"
      description="Design and optimize logistics networks with facility location optimization and scenario analysis"
      icon="ri-node-tree"
      stats={[
        { label: "Models", value: models.length, icon: "ri-file-list-line" },
        {
          label: "Nodes",
          value: selectedModel?.nodes.length || 0,
          icon: "ri-map-pin-line",
        },
        {
          label: "Links",
          value: selectedModel?.links.length || 0,
          icon: "ri-links-line",
        },
        {
          label: "Efficiency",
          value:
            optimizationResult?.metrics.networkEfficiency.toFixed(1) + "%" ||
            "N/A",
          icon: "ri-speed-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={runOptimization}
            disabled={!selectedModel || isOptimizing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize Network
              </>
            )}
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Model Selector */}
        {models.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2">
              Select Model
            </label>
            <select
              value={selectedModel?.id || ""}
              onChange={(e) => {
                const model = models.find((m) => m.id === e.target.value);
                setSelectedModel(model || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.nodes.length} nodes, {model.links.length}{" "}
                  links)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "VISUALIZATION", label: "Visualization", icon: Network },
            { id: "METRICS", label: "Metrics", icon: BarChart3 },
            { id: "OPTIMIZATION", label: "Optimization", icon: Target },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                viewMode === mode.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <mode.icon className="w-4 h-4 inline mr-2" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {viewMode === "VISUALIZATION" && selectedModel && (
          <NetworkGraphVisualization
            model={selectedModel}
            onNodeClick={(node) => {
              logger.debug("Node clicked", undefined, {
                module: "transportation",
                service: "network-modeling",
                nodeId: node.id,
              });
            }}
            onLinkClick={(link) => {
              logger.debug("Link clicked", undefined, {
                module: "transportation",
                service: "network-modeling",
                linkId: link.id,
              });
            }}
          />
        )}

        {viewMode === "METRICS" && selectedModel && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Cost"
              value={`$${selectedModel.nodes.reduce((sum, n) => sum + n.costs.fixed, 0).toLocaleString()}`}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Total Distance"
              value={`${selectedModel.links.reduce((sum, l) => sum + l.distance, 0).toLocaleString()} km`}
              icon={MapPin}
              color="blue"
            />
            <MetricCard
              title="Average Reliability"
              value={`${(selectedModel.links.reduce((sum, l) => sum + l.reliability, 0) / selectedModel.links.length).toFixed(1)}%`}
              icon={Target}
              color="purple"
            />
            <MetricCard
              title="Network Efficiency"
              value={
                optimizationResult?.metrics.networkEfficiency.toFixed(1) +
                  "%" || "N/A"
              }
              icon={Zap}
              color="orange"
            />
          </div>
        )}

        {viewMode === "OPTIMIZATION" && optimizationResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-6">Optimization Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs text-gray-500">Total Cost</label>
                <p className="text-2xl font-bold">
                  ${optimizationResult.metrics.totalCost.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Total Distance</label>
                <p className="text-2xl font-bold">
                  {optimizationResult.metrics.totalDistance.toLocaleString()} km
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Efficiency</label>
                <p className="text-2xl font-bold">
                  {optimizationResult.metrics.networkEfficiency.toFixed(1)}%
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Coverage</label>
                <p className="text-2xl font-bold">
                  {optimizationResult.metrics.coverage.toFixed(1)}%
                </p>
              </div>
            </div>

            {optimizationResult.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {optimizationResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
  };

  return (
    <div
      className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
