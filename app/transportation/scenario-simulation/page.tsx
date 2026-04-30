/**
 * Scenario Simulation Page
 *
 * Comprehensive what-if modeling interface
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Pause,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Target,
  Activity,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import ScenarioComparisonChart from "@/components/transportation/ScenarioComparisonChart";
import type {
  ScenarioSimulationRequest,
  ScenarioSimulationResult,
  ScenarioResult,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function ScenarioSimulationPage() {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] =
    useState<ScenarioSimulationResult | null>(null);
  const [viewMode, setViewMode] = useState<"GRID" | "COMPARISON" | "DETAIL">(
    "GRID",
  );
  const [metricsFilter, setMetricsFilter] = useState<string[]>([
    "COST",
    "TIME",
    "EMISSIONS",
  ]);

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      // In production, fetch actual shipment data
      const request: ScenarioSimulationRequest = {
        baseShipment: {
          id: "base-1",
          shipmentNumber: "SH-2024-001",
          origin: {
            address: {
              street: "123 Main St",
              city: "Riyadh",
              country: "Saudi Arabia",
              countryCode: "SA",
            },
            coordinates: { lat: 24.7136, lng: 46.6753 },
          },
          destination: {
            address: {
              street: "456 Business Ave",
              city: "Jeddah",
              country: "Saudi Arabia",
              countryCode: "SA",
            },
            coordinates: { lat: 21.4858, lng: 39.1925 },
          },
          mode: "LAND",
          type: "FTL",
          totalWeight: 10000,
          totalVolume: 50,
          status: "PLANNED",
          createdAt: new Date(),
          createdBy: "user",
          items: [],
          trackingEvents: [],
          documents: [],
          exceptions: [],
        },
        scenarios: [
          {
            name: "Alternative Route",
            description: "Using alternative highway route",
            variables: [
              {
                type: "ROUTE",
                name: "Alternative Route",
                value: {
                  origin: "Riyadh",
                  destination: "Jeddah",
                  via: "Highway 5",
                },
              },
            ],
            assumptions: [],
          },
          {
            name: "Different Carrier",
            description: "Using premium carrier",
            variables: [
              {
                type: "CARRIER",
                name: "Premium Carrier",
                value: {
                  carrierId: "carrier-2",
                  carrierName: "Premium Logistics",
                },
              },
            ],
            assumptions: [],
          },
        ],
        includeComparison: true,
        includeRiskAssessment: true,
        createdBy: "user",
      };

      const response = await apiFetch(
        "/api/transportation/scenario-simulation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        },
      );

      const result = await response.json();
      setSimulationResult(result);
      setScenarios(result.scenarios || []);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error running simulation", err, {
        module: "transportation",
        service: "scenario-simulation",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "scenario-simulation",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <PageTemplate
      title="Scenario Simulation"
      description="What-if modeling for transportation planning with cost/benefit analysis and risk assessment"
      icon="ri-bar-chart-box-line"
      stats={[
        {
          label: "Scenarios",
          value: scenarios.length,
          icon: "ri-file-list-line",
        },
        {
          label: "Best Scenario",
          value: simulationResult?.bestScenario?.scenarioName || "N/A",
          icon: "ri-trophy-line",
        },
        {
          label: "Cost Savings",
          value:
            simulationResult?.bestScenario?.comparison?.vsBaseScenario?.costPercentage?.toFixed(
              1,
            ) + "%" || "0%",
          icon: "ri-money-dollar-circle-line",
        },
        {
          label: "Risk Level",
          value:
            simulationResult?.bestScenario?.riskAssessment?.overallRisk ||
            "N/A",
          icon: "ri-shield-line",
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Simulation
              </>
            )}
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {[
            { id: "GRID", label: "Grid View", icon: BarChart3 },
            { id: "COMPARISON", label: "Comparison", icon: TrendingUp },
            { id: "DETAIL", label: "Details", icon: Target },
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

        {/* Simulation Results */}
        {simulationResult && (
          <AnimatePresence mode="wait">
            {viewMode === "GRID" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {/* Base Scenario */}
                <ScenarioCard
                  scenario={simulationResult.baseScenario}
                  isBase={true}
                  onClick={() =>
                    setSelectedScenario(simulationResult.baseScenario)
                  }
                />

                {/* All Scenarios */}
                {simulationResult.scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.scenarioId}
                    scenario={scenario}
                    isBest={
                      scenario.scenarioId ===
                      simulationResult.bestScenario.scenarioId
                    }
                    isWorst={
                      scenario.scenarioId ===
                      simulationResult.worstScenario.scenarioId
                    }
                    onClick={() => setSelectedScenario(scenario)}
                  />
                ))}
              </motion.div>
            )}

            {viewMode === "COMPARISON" && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Scenario Comparison
                </h3>
                <ScenarioComparisonChart
                  scenarios={[
                    simulationResult.baseScenario,
                    ...simulationResult.scenarios,
                  ]}
                />
              </motion.div>
            )}

            {viewMode === "DETAIL" && selectedScenario && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <ScenarioDetailView scenario={selectedScenario} />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Recommendations */}
        {simulationResult && simulationResult.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {simulationResult.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function ScenarioCard({
  scenario,
  isBase = false,
  isBest = false,
  isWorst = false,
  onClick,
}: {
  scenario: ScenarioResult;
  isBase?: boolean;
  isBest?: boolean;
  isWorst?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 cursor-pointer transition ${
        isBest
          ? "border-green-500 shadow-green-500/20"
          : isWorst
            ? "border-red-500 shadow-red-500/20"
            : isBase
              ? "border-blue-500 shadow-blue-500/20"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">{scenario.scenarioName}</h4>
          {isBest && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">
              Best
            </span>
          )}
          {isWorst && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium">
              Worst
            </span>
          )}
          {isBase && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
              Base
            </span>
          )}
        </div>

        <div className="space-y-3">
          <MetricRow
            icon={DollarSign}
            label="Total Cost"
            value={`$${scenario.metrics.totalCost.toLocaleString()}`}
            color="text-green-600 dark:text-green-400"
          />
          <MetricRow
            icon={Clock}
            label="Transit Time"
            value={`${scenario.metrics.totalTime.toFixed(1)} days`}
            color="text-blue-600 dark:text-blue-400"
          />
          <MetricRow
            icon={Activity}
            label="CO2 Emissions"
            value={`${(scenario.metrics?.totalCO2e ?? 0).toFixed(1)} kg`}
            color="text-purple-600 dark:text-purple-400"
          />
          <MetricRow
            icon={Target}
            label="Reliability"
            value={`${scenario.metrics.reliability.toFixed(1)}%`}
            color="text-orange-600 dark:text-orange-400"
          />
        </div>

        {scenario.comparison?.vsBaseScenario && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>
                Cost:{" "}
                {scenario.comparison.vsBaseScenario.costPercentage > 0
                  ? "+"
                  : ""}
                {scenario.comparison.vsBaseScenario.costPercentage.toFixed(1)}%
              </div>
              <div>
                Time:{" "}
                {scenario.comparison.vsBaseScenario.timePercentage > 0
                  ? "+"
                  : ""}
                {scenario.comparison.vsBaseScenario.timePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                scenario.riskAssessment.overallRisk === "LOW"
                  ? "bg-green-500"
                  : scenario.riskAssessment.overallRisk === "MEDIUM"
                    ? "bg-yellow-500"
                    : scenario.riskAssessment.overallRisk === "HIGH"
                      ? "bg-orange-500"
                      : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Risk: {scenario.riskAssessment.overallRisk} (
              {scenario.riskAssessment.riskScore.toFixed(0)})
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricRow({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function ScenarioDetailView({ scenario }: { scenario: ScenarioResult }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">{scenario.scenarioName}</h3>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cost"
          value={`$${scenario.metrics.totalCost.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Transit Time"
          value={`${scenario.metrics.totalTime.toFixed(1)} days`}
          icon={Clock}
          color="blue"
        />
        <MetricCard
          title="CO2 Emissions"
          value={`${scenario.metrics.totalCO2e.toFixed(1)} kg`}
          icon={Activity}
          color="purple"
        />
        <MetricCard
          title="Reliability"
          value={`${scenario.metrics.reliability.toFixed(1)}%`}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Risk Assessment */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          Risk Assessment
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Overall Risk</span>
            <span className="font-bold">
              {scenario.riskAssessment.overallRisk}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Risk Score</span>
            <span className="font-bold">
              {scenario.riskAssessment.riskScore.toFixed(0)}/100
            </span>
          </div>
          {scenario.riskAssessment.riskFactors.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">Risk Factors:</div>
              <ul className="space-y-1">
                {scenario.riskAssessment.riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm">
                    • {factor.name}: {factor.impact} ({factor.probability}%
                    probability)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scenario.riskAssessment.mitigationStrategies.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">
                Mitigation Strategies:
              </div>
              <ul className="space-y-1">
                {scenario.riskAssessment.mitigationStrategies.map(
                  (strategy, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {strategy}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {scenario.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {scenario.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
