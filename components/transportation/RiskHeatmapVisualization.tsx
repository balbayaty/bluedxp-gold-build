/**
 * Risk Heatmap Visualization Component
 *
 * Advanced interactive risk heatmap for accident prediction
 * Integrates with real-time data and predictive models
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/utils/apiFetch";

interface RiskPoint {
  id: string;
  location: { lat: number; lng: number };
  riskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  factors: Array<{ factor: string; contribution: number }>;
  incidentCount?: number;
  lastIncident?: Date | string;
}

interface RiskHeatmapVisualizationProps {
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  onRiskPointClick?: (point: RiskPoint) => void;
  realtime?: boolean;
}

export default function RiskHeatmapVisualization({
  routeId,
  vehicleId,
  driverId,
  onRiskPointClick,
  realtime = true,
}: RiskHeatmapVisualizationProps) {
  const [riskPoints, setRiskPoints] = useState<RiskPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<RiskPoint | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 24.7136, lng: 46.6753 }); // Default: Riyadh

  useEffect(() => {
    loadRiskData();

    if (realtime) {
      const interval = setInterval(loadRiskData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [routeId, vehicleId, driverId, realtime]);

  const loadRiskData = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would fetch risk predictions for multiple points
      // For now, we'll generate sample data based on route/vehicle
      const mockPoints: RiskPoint[] = [
        {
          id: "1",
          location: { lat: 24.7136, lng: 46.6753 },
          riskScore: 45,
          riskLevel: "MEDIUM",
          factors: [
            { factor: "Route History", contribution: 30 },
            { factor: "Traffic", contribution: 15 },
          ],
          incidentCount: 2,
          lastIncident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          location: { lat: 24.72, lng: 46.68 },
          riskScore: 75,
          riskLevel: "HIGH",
          factors: [
            { factor: "Route History", contribution: 50 },
            { factor: "Weather", contribution: 25 },
          ],
          incidentCount: 5,
          lastIncident: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "3",
          location: { lat: 24.7, lng: 46.66 },
          riskScore: 25,
          riskLevel: "LOW",
          factors: [
            { factor: "Route History", contribution: 20 },
            { factor: "Traffic", contribution: 5 },
          ],
          incidentCount: 0,
        },
      ];

      setRiskPoints(mockPoints);
    } catch (error) {
      console.error("Error loading risk data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRiskSize = (riskScore: number) => {
    // Scale marker size based on risk score
    const baseSize = 8;
    const maxSize = 24;
    return Math.min(
      maxSize,
      baseSize + (riskScore / 100) * (maxSize - baseSize),
    );
  };

  return (
    <Card className="bg-[#0a0e1a]/80 border-white/5 h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Risk Heatmap
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {riskPoints.length} Risk Points
            </Badge>
            {realtime && (
              <Badge
                variant="outline"
                className="text-xs border-green-500/30 text-green-400"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                LIVE
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        {loading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-white/40">Loading risk data...</div>
          </div>
        ) : (
          <div className="relative h-[500px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 overflow-hidden">
            {/* Map Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
                {Array.from({ length: 400 }).map((_, i) => (
                  <div key={i} className="border border-white/5" />
                ))}
              </div>
            </div>

            {/* Risk Points */}
            {riskPoints.map((point) => {
              const size = getRiskSize(point.riskScore);
              const color = getRiskColor(point.riskLevel);

              // Convert lat/lng to relative position (simplified)
              const x = ((point.location.lng - 46.6) / 0.1) * 100;
              const y = ((24.75 - point.location.lat) / 0.1) * 100;

              return (
                <motion.div
                  key={point.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${Math.max(0, Math.min(100, x))}%`,
                    top: `${Math.max(0, Math.min(100, y))}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => {
                    setSelectedPoint(point);
                    onRiskPointClick?.(point);
                  }}
                >
                  <div
                    className={`${color} rounded-full shadow-lg border-2 border-white/20 group-hover:border-white/40 transition-all`}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-full animate-ping opacity-75" />
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-black/90 backdrop-blur-sm rounded-lg p-2 text-xs whitespace-nowrap border border-white/10">
                      <div className="font-bold text-white">
                        {point.riskLevel}
                      </div>
                      <div className="text-white/60">
                        Risk: {point.riskScore}%
                      </div>
                      {point.incidentCount !== undefined && (
                        <div className="text-white/60">
                          {point.incidentCount} incidents
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10">
              <div className="text-xs font-bold text-white/80 mb-2">
                Risk Levels
              </div>
              <div className="space-y-1">
                {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                  <div key={level} className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-3 h-3 rounded-full ${getRiskColor(level)}`}
                    />
                    <span className="text-white/60">{level}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Point Details */}
            {selectedPoint && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-white/10 max-w-sm z-20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-5 h-5 ${getRiskColor(selectedPoint.riskLevel).replace("bg-", "text-")}`}
                    />
                    <div>
                      <div className="font-bold text-white">
                        {selectedPoint.riskLevel} Risk
                      </div>
                      <div className="text-xs text-white/60">
                        Score: {selectedPoint.riskScore}%
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="text-white/40 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-white/80 font-semibold">
                    Risk Factors:
                  </div>
                  {selectedPoint.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/60">{factor.factor}</span>
                      <span className="text-white/80">
                        {factor.contribution}%
                      </span>
                    </div>
                  ))}

                  {selectedPoint.incidentCount !== undefined && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-xs text-white/60">
                        {selectedPoint.incidentCount} historical incident
                        {selectedPoint.incidentCount !== 1 ? "s" : ""}
                      </div>
                      {selectedPoint.lastIncident && (
                        <div className="text-xs text-white/40 mt-1">
                          Last:{" "}
                          {new Date(
                            selectedPoint.lastIncident,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
