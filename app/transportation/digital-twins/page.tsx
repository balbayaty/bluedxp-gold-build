/**
 * Digital Twins Page
 *
 * Virtual fleet representation and predictive maintenance
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Settings,
  RefreshCw,
  Play,
  BarChart3,
  Target,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import type {
  DigitalTwin,
  DigitalTwinHealth,
  DigitalTwinPrediction,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function DigitalTwinsPage() {
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [selectedTwin, setSelectedTwin] = useState<DigitalTwin | null>(null);
  const [viewMode, setViewMode] = useState<
    "LIST" | "DETAIL" | "HEALTH" | "PREDICTIONS"
  >("LIST");

  useEffect(() => {
    loadTwins();
  }, []);

  const loadTwins = async () => {
    try {
      const response = await apiFetch("/api/transportation/digital-twins");
      const data = await response.json();
      if (data.twins) {
        setTwins(data.twins);
        if (data.twins.length > 0 && !selectedTwin) {
          setSelectedTwin(data.twins[0]);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading twins", err, {
        module: "transportation",
        service: "digital-twins",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "digital-twins",
      });
    }
  };

  const syncTwin = async (twinId: string) => {
    try {
      await apiFetch("/api/transportation/digital-twins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync-from-iot",
          twinId,
        }),
      });
      loadTwins();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error syncing twin", err, {
        module: "transportation",
        service: "digital-twins",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "digital-twins",
      });
    }
  };

  return (
    <PageTemplate
      title="Digital Twins"
      description="Virtual fleet representation with predictive maintenance and real-time synchronization"
      icon="ri-cpu-line"
      stats={[
        { label: "Total Twins", value: twins.length, icon: "ri-cpu-line" },
        {
          label: "Healthy",
          value: twins.filter((t) => t.health.overall === "HEALTHY").length,
          icon: "ri-checkbox-circle-line",
        },
        {
          label: "Critical",
          value: twins.filter((t) => t.health.overall === "CRITICAL").length,
          icon: "ri-error-warning-line",
        },
        {
          label: "Last Sync",
          value: selectedTwin
            ? new Date(selectedTwin.lastSync).toLocaleTimeString()
            : "N/A",
          icon: "ri-time-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          {selectedTwin && (
            <button
              onClick={() => syncTwin(selectedTwin.id)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Twin List */}
        {viewMode === "LIST" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {twins.map((twin) => (
              <TwinCard
                key={twin.id}
                twin={twin}
                onClick={() => {
                  setSelectedTwin(twin);
                  setViewMode("DETAIL");
                }}
              />
            ))}
          </div>
        )}

        {/* Detail View */}
        {viewMode === "DETAIL" && selectedTwin && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedTwin.name}</h3>
                  <p className="text-gray-500">
                    {selectedTwin.entityType} • {selectedTwin.entityId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <HealthBadge health={selectedTwin.health} />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                {[
                  { id: "DETAIL", label: "Details", icon: Settings },
                  { id: "HEALTH", label: "Health", icon: Activity },
                  { id: "PREDICTIONS", label: "Predictions", icon: TrendingUp },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      viewMode === mode.id
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <mode.icon className="w-4 h-4 inline mr-2" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Health View */}
            {viewMode === "HEALTH" && (
              <div className="space-y-4">
                <HealthDashboard health={selectedTwin.health} />
              </div>
            )}

            {/* Predictions View */}
            {viewMode === "PREDICTIONS" && (
              <div className="space-y-4">
                <PredictionsPanel predictions={selectedTwin.predictions} />
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function TwinCard({
  twin,
  onClick,
}: {
  twin: DigitalTwin;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <HealthBadge health={twin.health} />
      </div>
      <h4 className="font-bold mb-2">{twin.name}</h4>
      <p className="text-sm text-gray-500 mb-4">{twin.entityType}</p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Health Score</span>
          <span className="font-medium">
            {twin.health.score.toFixed(0)}/100
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Predictions</span>
          <span className="font-medium">{twin.predictions.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
          <span className="font-medium">
            {new Date(twin.lastSync).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function HealthBadge({ health }: { health: DigitalTwinHealth }) {
  const colorClasses = {
    HEALTHY:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    DEGRADED:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    CRITICAL:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <span
      className={`px-3 py-1 rounded text-sm font-medium ${colorClasses[health.overall]}`}
    >
      {health.overall}
    </span>
  );
}

function HealthDashboard({ health }: { health: DigitalTwinHealth }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold mb-6">Health Dashboard</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Health</span>
            <span className="text-2xl font-bold">
              {health.score.toFixed(0)}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${
                health.score >= 80
                  ? "bg-green-500"
                  : health.score >= 60
                    ? "bg-yellow-500"
                    : health.score >= 40
                      ? "bg-orange-500"
                      : "bg-red-500"
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        {health.components.length > 0 && (
          <div>
            <h4 className="font-bold mb-3">Component Health</h4>
            <div className="space-y-2">
              {health.components.map((component, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{component.name}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        component.status === "HEALTHY"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : component.status === "WARNING"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : component.status === "CRITICAL"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {component.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${component.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PredictionsPanel({
  predictions,
}: {
  predictions: DigitalTwinPrediction[];
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold mb-6">Predictions</h3>
      <div className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No predictions available</p>
          </div>
        ) : (
          predictions.map((prediction, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                prediction.impact === "CRITICAL"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : prediction.impact === "HIGH"
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold">{prediction.event}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {prediction.type}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    prediction.impact === "CRITICAL"
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : prediction.impact === "HIGH"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  }`}
                >
                  {prediction.impact}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Probability:
                  </span>
                  <span className="ml-2 font-medium">
                    {prediction.probability}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Confidence:
                  </span>
                  <span className="ml-2 font-medium">
                    {prediction.confidence}%
                  </span>
                </div>
              </div>
              {prediction.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium mb-1">
                    Recommendations:
                  </div>
                  <ul className="space-y-1">
                    {prediction.recommendations.map((rec, recIdx) => (
                      <li
                        key={recIdx}
                        className="text-sm flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
