/**
 * Bottleneck Analysis Component
 *
 * Identifies and analyzes bottlenecks in journey/process flows
 * Vulnerability scoring, arrival timing impact, resilience analysis
 *
 * Migrated from: sustainability-dashboard/src/components/bottleneckAnalysis/BottleneckAnalysis.tsx
 * Integrated with: Transportation Module, Analytics Module
 */

"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
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
import { bottleneckAnalysisService } from "@/lib/services/analytics";
import type {
  TouchpointAnalysis,
  BottleneckAnalysis as BottleneckAnalysisType,
  OperatingHours,
} from "@/types/analytics";

interface BottleneckAnalysisProps {
  touchpoints: TouchpointAnalysis[];
  shipments?: Array<{
    waybill: string;
    arrivalTime: string;
    totalOffloading: number;
    outsideHoursWaiting: number;
    actualOffloading: number;
  }>;
  operatingHours?: OperatingHours[];
}

const COLORS = ["#FF6B45", "#FFB11F", "#43A6DD", "#4364D8", "#a4a3a3"];

export default function BottleneckAnalysis({
  touchpoints,
  shipments,
  operatingHours,
}: BottleneckAnalysisProps) {
  const [analysis, setAnalysis] = useState<BottleneckAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzeBottlenecks();
  }, [touchpoints, shipments, operatingHours]);

  const analyzeBottlenecks = async () => {
    setLoading(true);
    try {
      const result = await bottleneckAnalysisService.analyzeBottlenecks(
        touchpoints,
        shipments,
        operatingHours,
      );
      setAnalysis(result);
    } catch (error) {
      console.error("Bottleneck analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing bottlenecks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">No analysis results available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bottleneck & Resilience Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Bottlenecks */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Primary Bottlenecks</h3>
            <p className="text-sm text-gray-600 mb-6">
              These are the critical touchpoints with the highest impact on
              total journey time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.primaryBottlenecks.map((bottleneck, index) => {
                const constraint =
                  bottleneckAnalysisService.getOperatingHoursConstraint(
                    bottleneck.name,
                    operatingHours,
                  );
                return (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      index === 0
                        ? "border-l-red-500"
                        : index === 1
                          ? "border-l-orange-500"
                          : "border-l-yellow-500"
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">
                        {bottleneck.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-gray-500">
                            Time Impact:
                          </span>
                          <span className="font-bold">
                            {formatHours(bottleneck.hours)}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-gray-500">
                            % of Journey:
                          </span>
                          <span className="font-bold">
                            {bottleneck.percentOfJourney.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-gray-500">
                            Potential Saving:
                          </span>
                          <span className="font-bold text-green-600">
                            {formatHours(bottleneck.potentialSaving)}
                          </span>
                        </div>

                        {constraint && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                            <p className="font-semibold text-yellow-800">
                              Operating Hours Constraint:
                            </p>
                            <p className="text-yellow-700">
                              {constraint.weekdays}
                            </p>
                            <p className="text-yellow-700">
                              {constraint.weekend}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bottleneck Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Distribution Across Touchpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={touchpoints.map((tp) => ({
                          name: tp.name,
                          value: tp.hours,
                          color: tp.name.includes("Kuwait custom")
                            ? "#FF6B45"
                            : tp.name.includes("Offloading")
                              ? "#FFB11F"
                              : tp.name.includes("Saudi custom")
                                ? "#43A6DD"
                                : undefined,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {touchpoints.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name.includes("Kuwait custom")
                                ? "#FF6B45"
                                : entry.name.includes("Offloading")
                                  ? "#FFB11F"
                                  : entry.name.includes("Saudi custom")
                                    ? "#43A6DD"
                                    : COLORS[index % COLORS.length]
                            }
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

            <Card>
              <CardHeader>
                <CardTitle>Bottleneck Impact on Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...touchpoints].sort(
                        (a, b) => b.percentOfJourney - a.percentOfJourney,
                      )}
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
                      <Bar dataKey="percentOfJourney" fill="#4364D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vulnerability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Resilience & Vulnerability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                This analysis identifies touchpoints that pose the highest risk
                to operational resilience.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analysis.vulnerabilityScores.sort(
                        (a, b) => b.vulnerabilityScore - a.vulnerabilityScore,
                      )}
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
                      <Bar dataKey="vulnerabilityScore" fill="#e74c3c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerability Factors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-medium text-red-800">
                        Critical Vulnerability: Kuwait Customs
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Kuwait Customs represents both the largest time sink and
                        a single point of failure with constrained operating
                        hours.
                      </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h4 className="font-medium text-yellow-800">
                        Secondary Vulnerabilities
                      </h4>
                      <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                        <li>
                          Offloading Process: Highly variable with significant
                          potential for optimization
                        </li>
                        <li>
                          Saudi Customs Return: High time impact with moderate
                          variability
                        </li>
                        <li>
                          Documentation waiting: Process inefficiency with
                          operating hours constraints
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Arrival Timing Impact */}
          {analysis.arrivalTimingImpact.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Arrival Timing Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  Analysis of how arrival timing affects waiting times and
                  operational efficiency.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.arrivalTimingImpact}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="window" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="avgWaiting"
                          name="Average Waiting Time"
                          fill="#FF6B45"
                        />
                        <Bar
                          dataKey="avgTotal"
                          name="Total Offloading Time"
                          fill="#a4a3a3"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.arrivalTimingImpact}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="window" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="efficiency"
                          name="Efficiency %"
                          fill="#4364D8"
                        />
                        <Bar
                          dataKey="count"
                          name="Shipment Count"
                          fill="#43A6DD"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-md">
                  <h4 className="font-medium text-green-800">Key Finding</h4>
                  <p className="text-green-700 mt-1">
                    <span className="font-bold">
                      Early morning arrivals (5-8am)
                    </span>{" "}
                    achieve nearly 100% efficiency with minimal waiting time
                    outside hours. This aligns perfectly with the operating
                    hours of the Consignee Offloading Plant (5am-4pm).
                  </p>
                  <p className="text-green-700 mt-2">
                    <span className="font-bold">Recommendation:</span> Schedule
                    arrivals between 5:00 AM and 8:00 AM to minimize waiting
                    time and maximize offloading efficiency.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
