/**
 * Monte Carlo Simulation Component
 *
 * Probabilistic analysis of journey time optimization
 * 10,000 iteration Monte Carlo simulation with statistical distributions
 *
 * Migrated from: flex-logistics-dashboard/src/MonteCarloSimulation.jsx
 * Integrated with: Transportation Module, Analytics Module
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
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { monteCarloSimulationService } from "@/lib/services/analytics";
import type {
  MonteCarloResults,
  JourneyTimeDistribution,
  SuccessProbability,
  ConfidenceInterval,
  SensitivityAnalysis,
  CumulativeProbability,
} from "@/types/analytics";

interface MonteCarloSimulationProps {
  touchpoints: Array<{
    name: string;
    baseline: number;
    best: number;
    worst: number;
    distribution?: "NORMAL" | "LOGNORMAL" | "TRIANGULAR" | "UNIFORM";
  }>;
  phases?: Array<{
    name: string;
    improvements: Record<string, number>;
  }>;
  title?: string;
}

const COLORS = {
  current: "#e74c3c",
  phase1: "#f39c12",
  phase2: "#3498db",
  phase3: "#2ecc71",
};

export default function MonteCarloSimulation({
  touchpoints,
  phases,
  title = "Monte Carlo Simulation Analysis",
}: MonteCarloSimulationProps) {
  const [activeTab, setActiveTab] = useState("journey");
  const [results, setResults] = useState<MonteCarloResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSimulation();
  }, [touchpoints, phases]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const simulationResults = await monteCarloSimulationService.runSimulation(
        touchpoints,
        phases,
      );
      setResults(simulationResults);
    } catch (error) {
      console.error("Monte Carlo simulation error:", error);
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
            <p className="mt-4 text-gray-600">Running simulation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">No simulation results available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Probabilistic analysis of journey time optimization across
            implementation phases, based on{" "}
            {results.metadata.iterations.toLocaleString()} simulation
            iterations.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="journey">Journey Distribution</TabsTrigger>
              <TabsTrigger value="success">Success Probability</TabsTrigger>
              <TabsTrigger value="confidence">Confidence Intervals</TabsTrigger>
              <TabsTrigger value="sensitivity">
                Sensitivity Analysis
              </TabsTrigger>
              <TabsTrigger value="cumulative">
                Cumulative Probability
              </TabsTrigger>
            </TabsList>

            <TabsContent value="journey" className="mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Journey Time Distribution by Implementation Phase
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.journeyTimeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="range"
                        label={{
                          value: "Journey Time (hours)",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        label={{
                          value: "Probability (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="current"
                        name="Current State"
                        fill={COLORS.current}
                      />
                      <Bar
                        dataKey="phase1"
                        name="After Phase 1"
                        fill={COLORS.phase1}
                      />
                      <Bar
                        dataKey="phase2"
                        name="After Phase 2"
                        fill={COLORS.phase2}
                      />
                      <Bar
                        dataKey="phase3"
                        name="After Phase 3"
                        fill={COLORS.phase3}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-500 italic mt-2">
                  *Probability distributions show the likelihood of different
                  journey time outcomes at each implementation phase.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="success" className="mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Success Probability by Key Metrics
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results.successProbabilities}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="metric" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="probability"
                        name="Probability of Success"
                        fill="#ff9e00"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-500 italic mt-2">
                  *Success probabilities calculated from{" "}
                  {results.metadata.iterations.toLocaleString()} Monte Carlo
                  simulations with full implementation of all phases.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="confidence" className="mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Confidence Intervals by Phase
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.confidenceIntervals}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="phase" />
                      <YAxis
                        domain={[0, 160]}
                        label={{
                          value: "Journey Time (hours)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="p10"
                        name="10th Percentile"
                        stackId="a"
                        fill="#2ecc71"
                      />
                      <Bar
                        dataKey="median"
                        name="Median (50th)"
                        stackId="a"
                        fill="#3498db"
                      />
                      <Bar
                        dataKey="p90"
                        name="90th Percentile"
                        stackId="a"
                        fill="#e74c3c"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This chart shows the range of probable outcomes for each
                  implementation phase. The 10th percentile represents best-case
                  outcomes, the 90th percentile represents worst-case outcomes,
                  and the median represents the most likely outcome.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="sensitivity" className="mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Bottleneck Sensitivity Analysis
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.sensitivityAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: "Time (hours)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="worst" name="Worst Case" fill="#e74c3c" />
                      <Bar dataKey="baseline" name="Baseline" fill="#f39c12" />
                      <Bar dataKey="best" name="Best Observed" fill="#3498db" />
                      <Bar dataKey="target" name="Target" fill="#2ecc71" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This analysis shows the range of variation for each major
                  bottleneck, comparing worst cases, baseline measurements, best
                  observed cases, and target states after all improvement
                  phases.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="cumulative" className="mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Probability of Success by Journey Time Target
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.cumulativeProbability}>
                      <defs>
                        <linearGradient
                          id="colorProb"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ff9e00"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ff9e00"
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hours"
                        type="number"
                        domain={[65, 100]}
                        label={{
                          value: "Journey Time (hours)",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        label={{
                          value: "Probability (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine
                        x={76.08}
                        stroke="#e74c3c"
                        strokeDasharray="3 3"
                        label={{
                          value: "Target: 76.08 hrs",
                          position: "top",
                          fill: "#e74c3c",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="probability"
                        name="Probability of Success"
                        stroke="#ff9e00"
                        fillOpacity={1}
                        fill="url(#colorProb)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 border-l-4 border-green-500">
                      <h3 className="font-semibold text-gray-800">83%</h3>
                      <p className="text-sm text-gray-600">
                        Probability of journey time below 80 hours
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 border-l-4 border-blue-500">
                      <h3 className="font-semibold text-gray-800">52%</h3>
                      <p className="text-sm text-gray-600">
                        Probability of achieving target (76.08 hours)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 border-l-4 border-orange-500">
                      <h3 className="font-semibold text-gray-800">90%</h3>
                      <p className="text-sm text-gray-600">
                        Recommended target for planning purposes
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-gray-50 p-4 rounded-lg mt-6 border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold mb-2">
              Simulation Methodology
            </h3>
            <p className="text-sm text-gray-600">
              This Monte Carlo simulation runs{" "}
              {results.metadata.iterations.toLocaleString()} iterations with
              probability distributions derived from historical data. Each
              touchpoint's variability follows either normal, lognormal, or
              triangular distributions based on best fit to observed patterns.
              Correlations between interdependent touchpoints are modeled using
              Cholesky decomposition. Results are presented with 90% confidence
              intervals. Phase implementations assume gradual adoption rates
              based on similar historical initiatives.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-semibold">Limitations:</span> The simulation
              assumes future variability will follow historical patterns and
              doesn't account for disruptive external events. Implementation
              success probabilities are based on industry benchmarks for similar
              initiatives.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
