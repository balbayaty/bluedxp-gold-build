/**
 * Touchpoint Explorer Component
 *
 * Deep-dive touchpoint analysis
 * Efficiency metrics, shipment-by-shipment comparison, offloading breakdown
 *
 * Migrated from: sustainability-dashboard/src/components/touchpointExplorer/TouchpointExplorer.tsx
 * Integrated with: Transportation Module, Analytics Module
 */

"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { touchpointExplorerService } from "@/lib/services/analytics";
import type {
  TouchpointAnalysis,
  TouchpointEfficiency,
  ShipmentComparison,
  ShipmentData,
  OffloadingProcess,
} from "@/types/analytics";

interface TouchpointExplorerProps {
  touchpoints: TouchpointAnalysis[];
  shipments?: ShipmentData[];
  offloadingData?: OffloadingProcess[];
}

export default function TouchpointExplorer({
  touchpoints,
  shipments,
  offloadingData,
}: TouchpointExplorerProps) {
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<number | null>(
    null,
  );
  const [efficiency, setEfficiency] = useState<TouchpointEfficiency | null>(
    null,
  );
  const [shipmentComparison, setShipmentComparison] = useState<
    ShipmentComparison[]
  >([]);
  const [offloadingBreakdown, setOffloadingBreakdown] = useState<any>(null);

  useEffect(() => {
    if (selectedTouchpoint !== null) {
      const selected = touchpoints.find((tp) => tp.id === selectedTouchpoint);
      if (selected) {
        const eff = touchpointExplorerService.getTouchpointEfficiency(selected);
        setEfficiency(eff);

        if (shipments) {
          const comparison = touchpointExplorerService.getShipmentComparison(
            selectedTouchpoint,
            shipments,
          );
          setShipmentComparison(comparison);
        }

        if (offloadingData && selectedTouchpoint === 8) {
          const breakdown =
            touchpointExplorerService.getOffloadingBreakdown(offloadingData);
          setOffloadingBreakdown(breakdown);
        }

        // Publish exploration event
        touchpointExplorerService.publishExplorationEvent(
          selectedTouchpoint,
          selected.name,
        );
      }
    }
  }, [selectedTouchpoint, touchpoints, shipments, offloadingData]);

  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

  const selectedTouchpointData = touchpoints.find(
    (tp) => tp.id === selectedTouchpoint,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deep-Dive Touchpoint Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main touchpoint bar chart */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Touchpoint Analysis</h2>
            <p className="text-sm text-gray-600 mb-6">
              Click on any touchpoint to explore detailed metrics, shipment
              comparisons, and optimization opportunities.
            </p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={touchpoints.map((tp) => ({
                    name: tp.name,
                    hours: tp.hours,
                    potentialSaving: tp.potentialSaving,
                    id: tp.id,
                  }))}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      setSelectedTouchpoint(data.activePayload[0].payload.id);
                    }
                  }}
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
                  <Bar dataKey="hours" name="Current Time" fill="#4364D8" />
                  <Bar
                    dataKey="potentialSaving"
                    name="Potential Saving"
                    fill="#ff9e00"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Selected touchpoint details */}
          {selectedTouchpoint !== null && selectedTouchpointData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTouchpointData.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Phase: {selectedTouchpointData.phase}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTouchpoint(null);
                      setEfficiency(null);
                      setShipmentComparison([]);
                      setOffloadingBreakdown(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Efficiency Metrics */}
                {efficiency && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Current Duration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-700">
                          {formatHours(efficiency.currentDuration)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {selectedTouchpointData.percentOfJourney.toFixed(1)}%
                          of journey
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Best Observed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                          {formatHours(efficiency.bestObserved)}
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          {efficiency.efficiency.toFixed(0)}% efficiency
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-secondary/10">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Potential Saving
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-secondary">
                          {formatHours(efficiency.potentialSaving)}
                        </div>
                        <div className="text-sm text-secondary/80 mt-1">
                          {efficiency.improvementPotential.toFixed(0)}%
                          improvement
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Offloading Process Breakdown */}
                {offloadingBreakdown && selectedTouchpoint === 8 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Offloading Process Breakdown
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={offloadingBreakdown.timeBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="component" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="hours" fill="#4364D8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={offloadingBreakdown.percentageBreakdown}
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
                              {offloadingBreakdown.percentageBreakdown.map(
                                (entry: any, index: number) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={["#FF6B45", "#FFB11F"][index % 2]}
                                  />
                                ),
                              )}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipment Comparison */}
                {shipmentComparison.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Shipment-by-Shipment Analysis
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={shipmentComparison}>
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
                          <Bar dataKey="hours" fill="#4364D8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
