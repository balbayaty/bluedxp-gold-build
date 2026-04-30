/**
 * Sustainability Command Center Component
 *
 * Sustainability metrics dashboard and analysis
 * Journey breakdown by phase, touchpoint optimization potential
 *
 * Migrated from: sustainability-dashboard/src/components/commandCenter/CommandCenter.tsx
 * Integrated with: Transportation Module, Sustainability Module, Analytics Module
 */

"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sustainabilityCommandCenterService } from "@/lib/services/analytics";
import type {
  TouchpointAnalysis,
  SustainabilityMetrics,
  JourneySummary,
  JourneyByPhase,
  TouchpointOptimization,
} from "@/types/analytics";

interface SustainabilityCommandCenterProps {
  touchpoints: TouchpointAnalysis[];
  journeySummary: JourneySummary;
  sustainabilityMetrics: SustainabilityMetrics[];
}

const COLORS = ["#4364D8", "#43A6DD", "#FFB11F", "#FF6B45"];

export default function SustainabilityCommandCenter({
  touchpoints,
  journeySummary,
  sustainabilityMetrics,
}: SustainabilityCommandCenterProps) {
  const [journeyByPhase, setJourneyByPhase] = useState<JourneyByPhase[]>([]);
  const [touchpointOptimization, setTouchpointOptimization] = useState<
    TouchpointOptimization[]
  >([]);
  const [sustainabilityComparison, setSustainabilityComparison] = useState<
    Array<{
      name: string;
      current: number;
      optimized: number;
      unit: string;
    }>
  >([]);
  const [keyMetrics, setKeyMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [touchpoints, journeySummary, sustainabilityMetrics]);

  const loadData = async () => {
    const phaseData =
      sustainabilityCommandCenterService.getJourneyByPhase(touchpoints);
    setJourneyByPhase(phaseData);

    const optimizationData =
      sustainabilityCommandCenterService.getTouchpointOptimization(touchpoints);
    setTouchpointOptimization(optimizationData);

    const comparisonData =
      sustainabilityCommandCenterService.getSustainabilityComparison(
        sustainabilityMetrics,
      );
    setSustainabilityComparison(comparisonData);

    const metrics = sustainabilityCommandCenterService.getKeyMetrics(
      journeySummary,
      sustainabilityMetrics,
    );
    setKeyMetrics(metrics);

    // Publish metrics event
    await sustainabilityCommandCenterService.publishMetricsEvent(
      journeySummary,
      sustainabilityMetrics,
    );
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

  if (!keyMetrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading sustainability metrics...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sustainability & Efficiency Command Center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-origin/10">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Journey Time
                </p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-semibold text-origin">
                    {keyMetrics.totalJourneyTime.value}
                  </p>
                </div>
                <div className="flex items-center mt-1 text-green-500">
                  <span className="text-xs">
                    {keyMetrics.totalJourneyTime.changeText}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">
                  CO2 Emissions
                </p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-semibold text-green-700">
                    {keyMetrics.co2Emissions.value}
                  </p>
                  <span className="ml-1 text-sm text-gray-500">
                    {keyMetrics.co2Emissions.unit}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-green-500">
                  <span className="text-xs">
                    {keyMetrics.co2Emissions.changeText}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">
                  Idle Emissions
                </p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-semibold text-yellow-700">
                    {keyMetrics.idleEmissions.value}
                  </p>
                  <span className="ml-1 text-sm text-gray-500">
                    {keyMetrics.idleEmissions.unit}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-green-500">
                  <span className="text-xs">
                    {keyMetrics.idleEmissions.changeText}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/10">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600">
                  Cost Per Trip
                </p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-semibold text-secondary">
                    {keyMetrics.costPerTrip.value}
                  </p>
                  <span className="ml-1 text-sm text-gray-500">
                    {keyMetrics.costPerTrip.unit}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-green-500">
                  <span className="text-xs">
                    {keyMetrics.costPerTrip.changeText}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Journey breakdown by phase */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Breakdown by Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={journeyByPhase}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {journeyByPhase.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Touchpoint optimization potential */}
            <Card>
              <CardHeader>
                <CardTitle>Touchpoint Optimization Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={touchpointOptimization}>
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
                        dataKey="potentialSaving"
                        name="Potential Saving"
                        fill="#4364D8"
                      />
                      <Bar dataKey="hours" name="Current Time" fill="#a4a3a3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sustainability metrics comparison */}
          <Card>
            <CardHeader>
              <CardTitle>
                Sustainability Metrics: Current vs. Optimized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sustainabilityComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="#FF6B45"
                      name="Current"
                    />
                    <Line
                      type="monotone"
                      dataKey="optimized"
                      stroke="#4364D8"
                      name="Optimized"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
