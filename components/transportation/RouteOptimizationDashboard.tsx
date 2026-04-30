/**
 * Route Optimization Dashboard Component
 *
 * Visual journey breakdown, bottleneck identification, business impact
 *
 * Migrated from: route-optimization-dashboard/src/components/LogisticsDashboard.js
 * Integrated with: Transportation Module
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RouteOptimizationDashboardProps {
  journeyPhases?: Array<{
    name: string;
    hours: number;
    percentage: number;
  }>;
  currentTime?: number;
  targetTime?: number;
  savings?: number;
  savingsPercentage?: number;
  bottlenecks?: Array<{
    name: string;
    percentage: number;
    current: number;
    target: number;
    savings: number;
    issues: string[];
  }>;
  financialImpact?: {
    annualSavings: number;
    additionalRevenue: number;
  };
  environmentalImpact?: {
    co2Reduction: number;
    co2SavedAnnually: number;
  };
  kpis?: {
    currentOnTime: number;
    targetOnTime: number;
    annualShipments: number;
    addedCapacity: number;
  };
}

export default function RouteOptimizationDashboard({
  journeyPhases = [
    { name: "Origin", hours: 13.71, percentage: 10.2 },
    { name: "Transport", hours: 25.62, percentage: 19.1 },
    { name: "Customs", hours: 78.38, percentage: 58.3 },
    { name: "Destination", hours: 16.77, percentage: 12.5 },
  ],
  currentTime = 125.37,
  targetTime = 67.08,
  savings = 58.39,
  savingsPercentage = 43.4,
  bottlenecks = [
    {
      name: "Kuwait Customs",
      percentage: 44.2,
      current: 55.43,
      target: 20.0,
      savings: 35.43,
      issues: [
        "Limited hours: 8am-1pm (Sat-Thu), closed Friday",
        "Only 30 hrs/week vs 168 hrs for 24/7 facilities",
        "Return clearance at same facility: 0.53 hrs (100x faster)",
      ],
    },
  ],
  financialImpact = {
    annualSavings: 774251,
    additionalRevenue: 850000,
  },
  environmentalImpact = {
    co2Reduction: 24.7,
    co2SavedAnnually: 670.4,
  },
  kpis = {
    currentOnTime: 63,
    targetOnTime: 95,
    annualShipments: 156,
    addedCapacity: 68,
  },
}: RouteOptimizationDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const formatHours = (hours: number) => `${hours.toFixed(2)} hours`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saudi-Kuwait Logistics Optimization Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="impact">Business Impact</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Journey Time Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Driving vs. Idle Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold">Driving: 14%</div>
                          <div className="text-lg font-bold mt-2">
                            Idle: 86%
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Only 14% of journey time (17.72 hours) is spent driving,
                        while 86% (107.65 hours) is idle time.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Journey Phases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        {journeyPhases.map((phase, index) => (
                          <div key={index} className="mb-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span>{phase.name}</span>
                              <span>
                                {phase.hours} hours ({phase.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div
                                className={`h-2.5 rounded-full ${
                                  index === 0
                                    ? "bg-blue-500"
                                    : index === 1
                                      ? "bg-green-500"
                                      : index === 2
                                        ? "bg-red-500"
                                        : "bg-yellow-500"
                                }`}
                                style={{ width: `${phase.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Journey Time Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="p-3 bg-red-100 rounded text-center">
                        <div className="text-lg font-bold">Current</div>
                        <div className="text-xl font-bold">
                          {formatHours(currentTime)}
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 rounded text-center">
                        <div className="text-lg font-bold">Target</div>
                        <div className="text-xl font-bold">
                          {formatHours(targetTime)}
                        </div>
                      </div>
                      <div className="p-3 bg-amber-100 rounded text-center">
                        <div className="text-lg font-bold">Savings</div>
                        <div className="text-xl font-bold">
                          {formatHours(savings)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-4">
                      Our optimization strategy can reduce journey time from{" "}
                      {formatHours(currentTime)} to {formatHours(targetTime)},
                      saving {formatHours(savings)} ({savingsPercentage}%) per
                      journey.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Key Performance Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-xl font-bold text-yellow-500">
                          {kpis.currentOnTime}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Current On-Time Delivery
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-xl font-bold text-green-500">
                          {kpis.targetOnTime}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Target On-Time Delivery
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-xl font-bold text-blue-500">
                          {kpis.annualShipments}
                        </div>
                        <div className="text-xs text-gray-500">
                          Annual Shipments
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-xl font-bold text-green-500">
                          +{kpis.addedCapacity}
                        </div>
                        <div className="text-xs text-gray-500">
                          Added Capacity
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bottlenecks" className="mt-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Critical Bottlenecks</h2>
                {bottlenecks.map((bottleneck, index) => (
                  <Card key={index} className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {bottleneck.name} ({bottleneck.percentage}%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Current:</span>{" "}
                          {formatHours(bottleneck.current)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Target:</span>{" "}
                          {formatHours(bottleneck.target)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Savings:</span>{" "}
                          {formatHours(bottleneck.savings)}
                        </p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm mb-1">
                          <span className="font-medium">Key Issues:</span>
                        </p>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {bottleneck.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="mt-6">
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Optimization Strategy
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Three-Phase Approach
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="p-3 bg-blue-100 rounded text-center">
                        <div className="text-lg font-bold">Phase 1</div>
                        <div>Scheduling</div>
                        <div className="text-lg font-bold mt-2">7.94 hours</div>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded text-center">
                        <div className="text-lg font-bold">Phase 2</div>
                        <div>Process</div>
                        <div className="text-lg font-bold mt-2">
                          15.02 hours
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 rounded text-center">
                        <div className="text-lg font-bold">Phase 3</div>
                        <div>External</div>
                        <div className="text-lg font-bold mt-2">
                          35.43 hours
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-4">
                      External coordination (Phase 3) offers the largest
                      potential savings at 35.43 hours.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="impact" className="mt-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Business Impact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Financial Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-4">
                        <div className="p-3 bg-green-100 rounded-lg mb-3">
                          <div className="text-lg font-medium">
                            Annual Cost Savings
                          </div>
                          <div className="text-2xl font-bold">
                            ${financialImpact.annualSavings.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <div className="text-lg font-medium">
                            Additional Revenue
                          </div>
                          <div className="text-2xl font-bold">
                            $
                            {financialImpact.additionalRevenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-4">
                        Total annual financial benefit: $
                        {(
                          financialImpact.annualSavings +
                          financialImpact.additionalRevenue
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Environmental Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3 mt-4">
                        <div className="flex items-center p-3 bg-green-50 rounded-lg">
                          <div className="bg-green-500 text-white p-3 rounded-full mr-3">
                            ✓
                          </div>
                          <div>
                            <div className="font-bold text-lg">
                              {environmentalImpact.co2Reduction}%
                            </div>
                            <div className="text-xs text-gray-600">
                              Per Trip CO2 Reduction
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-green-50 rounded-lg">
                          <div className="bg-green-500 text-white p-3 rounded-full mr-3">
                            ✓
                          </div>
                          <div>
                            <div className="font-bold text-lg">
                              {environmentalImpact.co2SavedAnnually}
                            </div>
                            <div className="text-xs text-gray-600">
                              Metric Tons CO2 Saved Annually
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="simulation" className="mt-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Simulation Results</h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Monte Carlo Simulation Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 mb-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-green-700">
                            87%
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            Probability of Success
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-sm">Target: 85%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
