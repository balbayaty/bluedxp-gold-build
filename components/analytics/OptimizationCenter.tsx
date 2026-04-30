/**
 * Optimization Center Component
 *
 * What-if scenario builder for journey optimization
 * Real-time impact calculation, ROI analysis, commercial model impact
 *
 * Migrated from: sustainability-dashboard/src/components/optimizationCenter/OptimizationCenter.tsx
 * Integrated with: Transportation Module, Analytics Module, Financial Module
 */

"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Using native HTML range input for slider
import { optimizationCenterService } from "@/lib/services/analytics";
import type {
  TouchpointAnalysis,
  OptimizationLevels,
  OptimizationResults,
  ROIAnalysis,
  CommercialModel,
  OptimizationPreset,
  JourneySummary,
  SustainabilityMetrics,
  AssetUtilization,
} from "@/types/analytics";

interface OptimizationCenterProps {
  touchpoints: TouchpointAnalysis[];
  journeySummary: JourneySummary;
  sustainabilityMetrics: SustainabilityMetrics[];
  assetUtilization: AssetUtilization[];
  commercialModels: CommercialModel[];
}

export default function OptimizationCenter({
  touchpoints,
  journeySummary,
  sustainabilityMetrics,
  assetUtilization,
  commercialModels,
}: OptimizationCenterProps) {
  const [optimizationLevels, setOptimizationLevels] =
    useState<OptimizationLevels>({});
  const [selectedPreset, setSelectedPreset] =
    useState<OptimizationPreset>("custom");
  const [optimizationResults, setOptimizationResults] =
    useState<OptimizationResults | null>(null);
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysis | null>(null);
  const [presets, setPresets] = useState<Record<OptimizationPreset, any>>(
    {} as any,
  );

  useEffect(() => {
    // Initialize optimization levels
    const initialLevels: OptimizationLevels = {};
    touchpoints.forEach((tp) => {
      initialLevels[tp.id] = 0;
    });
    setOptimizationLevels(initialLevels);

    // Get presets
    const presetData =
      optimizationCenterService.getOptimizationPresets(touchpoints);
    setPresets(presetData);
  }, [touchpoints]);

  useEffect(() => {
    calculateOptimization();
  }, [
    optimizationLevels,
    touchpoints,
    journeySummary,
    sustainabilityMetrics,
    assetUtilization,
    commercialModels,
  ]);

  const calculateOptimization = () => {
    const results = optimizationCenterService.calculateOptimizedValues(
      touchpoints,
      optimizationLevels,
      journeySummary,
      sustainabilityMetrics,
      assetUtilization,
      commercialModels,
    );
    setOptimizationResults(results);

    const roi = optimizationCenterService.calculateROI(
      results,
      commercialModels,
    );
    setRoiAnalysis(roi);

    // Publish event
    optimizationCenterService.publishOptimizationEvent(results, roi);
  };

  const handlePresetChange = (preset: OptimizationPreset) => {
    setSelectedPreset(preset);
    if (preset !== "custom" && presets[preset]) {
      setOptimizationLevels(presets[preset].levels);
    }
  };

  const handleOptimizationChange = (touchpointId: number, value: number[]) => {
    setOptimizationLevels((prev) => {
      if (selectedPreset !== "custom") {
        setSelectedPreset("custom");
      }
      return { ...prev, [touchpointId]: value[0] };
    });
  };

  const formatHours = (hours: number): string => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (!optimizationResults || !roiAnalysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Calculating optimization...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Optimization & Commercial Model Center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Optimization Controls */}
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenario Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization Preset
                </label>
                <div className="flex space-x-4">
                  {Object.entries(presets).map(([key, preset]) => (
                    <Button
                      key={key}
                      onClick={() =>
                        handlePresetChange(key as OptimizationPreset)
                      }
                      variant={selectedPreset === key ? "default" : "outline"}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-2">
                  Adjust the optimization level for each touchpoint to see the
                  impact on journey time, sustainability metrics, and commercial
                  models.
                </p>

                {touchpoints.map((tp) => (
                  <div
                    key={tp.id}
                    className="grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-3">
                      <span className="text-sm font-medium">{tp.name}</span>
                    </div>
                    <div className="col-span-6">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={optimizationLevels[tp.id] || 0}
                        onChange={(e) =>
                          handleOptimizationChange(tp.id, [
                            parseInt(e.target.value),
                          ])
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm">
                        {optimizationLevels[tp.id] || 0}% applied
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-sm font-medium text-green-600">
                        {(
                          (tp.potentialSaving *
                            (optimizationLevels[tp.id] || 0)) /
                          100
                        ).toFixed(1)}
                        h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-origin/5">
              <CardHeader>
                <CardTitle>Journey Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Original</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatHours(optimizationResults.journey.originalHours)}
                    </p>
                  </div>
                  <div className="text-2xl">→</div>
                  <div>
                    <p className="text-xs text-gray-500">Optimized</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatHours(optimizationResults.journey.optimizedHours)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Time Saving</p>
                    <p className="text-sm font-medium">
                      {formatHours(optimizationResults.journey.savingHours)}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Percentage</p>
                    <p className="text-sm font-medium">
                      {formatPercentage(
                        optimizationResults.journey.savingPercentage,
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardHeader>
                <CardTitle>Sustainability Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">CO2 Emissions</p>
                    <p className="text-xl font-bold text-gray-800">
                      {Math.round(
                        optimizationResults.sustainability.originalCO2,
                      )}{" "}
                      kg
                    </p>
                  </div>
                  <div className="text-2xl">→</div>
                  <div>
                    <p className="text-xs text-gray-500">Optimized</p>
                    <p className="text-xl font-bold text-green-600">
                      {Math.round(
                        optimizationResults.sustainability.optimizedCO2,
                      )}{" "}
                      kg
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">CO2 Reduction</p>
                    <p className="text-sm font-medium">
                      {formatPercentage(
                        optimizationResults.sustainability.co2Reduction,
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Fuel Reduction</p>
                    <p className="text-sm font-medium">
                      {formatPercentage(
                        optimizationResults.sustainability.fuelReduction,
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/5">
              <CardHeader>
                <CardTitle>Fleet Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Required Fleet</p>
                    <p className="text-xl font-bold text-gray-800">
                      {optimizationResults.fleet.originalSize} trucks
                    </p>
                  </div>
                  <div className="text-2xl">→</div>
                  <div>
                    <p className="text-xs text-gray-500">Optimized</p>
                    <p className="text-xl font-bold text-secondary">
                      {optimizationResults.fleet.optimizedSize} trucks
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Fleet Reduction</p>
                    <p className="text-sm font-medium">
                      {optimizationResults.fleet.reduction} trucks
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Cost Impact</p>
                    <p className="text-sm font-medium">
                      {formatPercentage(
                        optimizationResults.sustainability.costReduction,
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization by Touchpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={optimizationResults.touchpointSavings
                        .filter((tp) => tp.potentialSaving > 0)
                        .sort((a, b) => b.appliedSaving - a.appliedSaving)
                        .map((tp) => ({
                          name: tp.name,
                          original: tp.originalHours,
                          optimized: tp.optimizedHours,
                          saving: tp.appliedSaving,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="original"
                        name="Original Time"
                        fill="#a4a3a3"
                      />
                      <Bar
                        dataKey="optimized"
                        name="Optimized Time"
                        fill="#4364D8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commercial Model Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-semibold mb-2">
                    Monthly Lease Model
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Current Cost</p>
                      <p className="text-lg font-medium">
                        {commercialModels[0]?.currentCost.toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="text-lg">→</div>
                    <div>
                      <p className="text-xs text-gray-500">Optimized Cost</p>
                      <p className="text-lg font-medium text-green-600">
                        {(
                          (commercialModels[0]?.currentCost || 0) -
                          optimizationResults.fleet.reduction * 26000
                        ).toLocaleString()}{" "}
                        SAR
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-green-600 font-medium">
                      Monthly Saving:{" "}
                      {(
                        optimizationResults.fleet.reduction * 26000
                      ).toLocaleString()}{" "}
                      SAR
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-semibold mb-2">
                    Trip-Based Model
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Current Cost/Trip</p>
                      <p className="text-lg font-medium">
                        {commercialModels[1]?.currentCost.toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="text-lg">→</div>
                    <div>
                      <p className="text-xs text-gray-500">Optimized Cost</p>
                      <p className="text-lg font-medium text-green-600">
                        {(
                          3300 +
                          Math.max(
                            0,
                            28 -
                              Math.floor(
                                (28 *
                                  optimizationResults.journey
                                    .savingPercentage) /
                                  100,
                              ),
                          ) *
                            350
                        ).toLocaleString()}{" "}
                        SAR
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-md font-semibold mb-2">ROI Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Savings</p>
                      <p className="text-lg font-medium">
                        {Math.round(
                          roiAnalysis.monthlySavings,
                        ).toLocaleString()}{" "}
                        SAR
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Annual Savings</p>
                      <p className="text-lg font-medium">
                        {Math.round(roiAnalysis.annualSavings).toLocaleString()}{" "}
                        SAR
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payback Period</p>
                      <p className="text-lg font-medium">
                        {roiAnalysis.paybackPeriod.toFixed(1)} months
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">1-Year ROI</p>
                      <p className="text-lg font-medium">
                        {roiAnalysis.oneYearROI.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                This phased approach provides a structured path to achieve the
                optimizations modeled above.
              </p>

              <div className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-md">
                  <h3 className="font-medium text-blue-700">
                    Phase 1: Quick Wins (1-2 months)
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-blue-600">
                    <li>
                      • Optimize arrival timing to early morning (5-8am) window
                    </li>
                    <li>• Implement documentation pre-processing</li>
                    <li>• Establish priority queuing at border crossing</li>
                    <li>• Potential impact: ~15-20% journey time reduction</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-md">
                  <h3 className="font-medium text-yellow-700">
                    Phase 2: Process Optimization (3-4 months)
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-600">
                    <li>• Implement Kuwait customs expedited processing</li>
                    <li>• Deploy offloading scheduling system</li>
                    <li>• Optimize truck loading procedures</li>
                    <li>• Potential impact: ~25-30% journey time reduction</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-md">
                  <h3 className="font-medium text-green-700">
                    Phase 3: Systemic Transformation (5-6 months)
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-green-600">
                    <li>
                      • Deploy RAC (Recursive Analysis Charts) optimization tool
                    </li>
                    <li>• Implement AI-driven scheduling across touchpoints</li>
                    <li>• Introduce real-time detention risk monitoring</li>
                    <li>• Potential impact: ~40-45% journey time reduction</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-secondary/10 rounded-md">
                <h3 className="font-medium text-secondary">
                  Triple Bottom Line Impact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-sm font-medium">Economic</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(roiAnalysis.annualSavings).toLocaleString()}{" "}
                      SAR annual savings with{" "}
                      {roiAnalysis.paybackPeriod.toFixed(1)} month payback
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Environmental</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(
                        optimizationResults.sustainability.originalCO2 -
                          optimizationResults.sustainability.optimizedCO2,
                      )}{" "}
                      kg CO2 reduction per trip,{" "}
                      {formatPercentage(
                        optimizationResults.sustainability.fuelReduction,
                      )}{" "}
                      fuel efficiency gain
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Social</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(optimizationResults.journey.savingHours)}{" "}
                      hours driver time saved per trip, improved work conditions
                      and safety
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
