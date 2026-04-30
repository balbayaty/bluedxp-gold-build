/**
 * 🌐 NETWORK TOPOLOGY VISUALIZATION COMPONENT
 * Visual network graph for IoT devices
 * Full implementation with interactive visualization
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { advancedNetworkTopologyService } from "@/lib/services/iot/advancedNetworkTopologyService";
import { iotManager } from "@/lib/services/iot/iotManager";
import type {
  NetworkTopology,
  NetworkTopologyNode,
  NetworkTopologyEdge,
} from "@/lib/services/iot/advancedNetworkTopologyService";

export default function NetworkTopologyVisualization() {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkTopologyNode | null>(
    null,
  );
  const [optimizations, setOptimizations] = useState<any[]>([]);

  useEffect(() => {
    loadTopology();
  }, []);

  const loadTopology = async () => {
    try {
      setLoading(true);
      const devices = await iotManager.getDevices();
      const generatedTopology =
        await advancedNetworkTopologyService.generateTopology(devices, {
          optimizeLayout: true,
          analyzePaths: true,
        });
      setTopology(generatedTopology);

      // Get optimizations
      const optResults =
        await advancedNetworkTopologyService.analyzeNetworkOptimization(
          generatedTopology,
        );
      setOptimizations(optResults);
    } catch (error) {
      console.error("Error loading topology:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (node: NetworkTopologyNode): string => {
    if (node.type === "GATEWAY") return "#4364D8";
    if (node.status === "ONLINE") return "#2ECC71";
    if (node.status === "OFFLINE") return "#E74C3C";
    if (node.status === "DEGRADED") return "#F39C12";
    return "#95A5A6";
  };

  const getEdgeColor = (edge: NetworkTopologyEdge): string => {
    if (edge.reliability > 0.9) return "#2ECC71";
    if (edge.reliability > 0.7) return "#F39C12";
    return "#E74C3C";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading network topology...</div>
        </CardContent>
      </Card>
    );
  }

  if (!topology) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No network topology available
          </div>
        </CardContent>
      </Card>
    );
  }

  const graphData =
    advancedNetworkTopologyService.getTopologyGraphData(topology);

  return (
    <div className="space-y-6">
      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topology.metrics.totalNodes}
            </div>
            <p className="text-xs text-muted-foreground">
              {topology.metrics.onlineNodes} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Network Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topology.metrics.networkHealth}%
            </div>
            <p className="text-xs text-muted-foreground">
              {topology.metrics.averageReliability * 100}% reliability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topology.metrics.averageLatency}ms
            </div>
            <p className="text-xs text-muted-foreground">Network latency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topology.metrics.coverage}%
            </div>
            <p className="text-xs text-muted-foreground">Network coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Graph Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Network Topology</CardTitle>
            <Button onClick={loadTopology} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[600px] border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-auto">
            {/* SVG Network Graph */}
            <svg width="100%" height="100%" className="min-w-full min-h-full">
              {/* Render edges */}
              {graphData.edges.map((edge) => {
                const sourceNode = graphData.nodes.find(
                  (n) => n.id === edge.source,
                );
                const targetNode = graphData.nodes.find(
                  (n) => n.id === edge.target,
                );
                if (!sourceNode || !targetNode) return null;

                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={edge.color}
                    strokeWidth={edge.width}
                    opacity={0.6}
                    className="cursor-pointer hover:opacity-100"
                  />
                );
              })}

              {/* Render nodes */}
              {graphData.nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={node.color}
                    stroke="#fff"
                    strokeWidth={2}
                    className="cursor-pointer hover:r-8 transition-all"
                    onClick={() => {
                      const fullNode = topology.nodes.find(
                        (n) => n.id === node.id,
                      );
                      setSelectedNode(fullNode || null);
                    }}
                  />
                  <text
                    x={node.x}
                    y={node.y + node.size + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    className="pointer-events-none"
                  >
                    {node.label.length > 15
                      ? node.label.substring(0, 15) + "..."
                      : node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#4364D8]"></div>
              <span>Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#2ECC71]"></div>
              <span>Online Device</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#E74C3C]"></div>
              <span>Offline Device</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#F39C12]"></div>
              <span>Degraded</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedNode.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{selectedNode.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    selectedNode.status === "ONLINE" ? "default" : "destructive"
                  }
                >
                  {selectedNode.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocol</p>
                <p className="font-medium">
                  {selectedNode.protocol.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signal Strength</p>
                <p className="font-medium">
                  {selectedNode.metadata.signalStrength?.toFixed(0) || "N/A"}{" "}
                  dBm
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latency</p>
                <p className="font-medium">
                  {selectedNode.metadata.latency?.toFixed(0) || "N/A"} ms
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health</p>
                <p className="font-medium">
                  {selectedNode.metadata.health || "N/A"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Optimizations */}
      {optimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizations.map((opt, index) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            opt.priority === "CRITICAL"
                              ? "destructive"
                              : opt.priority === "HIGH"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {opt.priority}
                        </Badge>
                        <span className="font-medium">
                          {opt.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {opt.description}
                      </p>
                      <p className="text-sm mt-2">
                        Expected Improvement:{" "}
                        <span className="font-medium">
                          {opt.expectedImprovement}%
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Affected Devices: {opt.affectedNodes.length}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottlenecks */}
      {topology.bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topology.bottlenecks.map((bottleneck) => (
                <div
                  key={bottleneck.id}
                  className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          bottleneck.severity === "CRITICAL"
                            ? "destructive"
                            : bottleneck.severity === "HIGH"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {bottleneck.severity}
                      </Badge>
                      <span className="font-medium">{bottleneck.type}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {bottleneck.impact.toFixed(0)}% impact
                    </span>
                  </div>
                  <p className="text-sm">{bottleneck.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Recommendations:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {bottleneck.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
