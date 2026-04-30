/**
 * IoT Network Topology Page
 * Visualize IoT network topology and connections
 * Much more comprehensive than source apps
 */

"use client";

import { useEffect, useState } from "react";
import {
  iotRealTimeService,
  type NetworkTopology,
} from "@/lib/services/iot/iotRealTimeService";

export default function IoTNetworkTopologyPage() {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    fetchTopology();
  }, []);

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const data = await iotRealTimeService.getNetworkTopology();
      setTopology(data);
    } catch (error) {
      console.error("Error fetching network topology:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading network topology...</p>
        </div>
      </div>
    );
  }

  if (!topology) {
    return (
      <div className="p-6 text-center text-gray-500">
        No network topology available
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Network Topology</h1>
          <p className="text-gray-600 mt-1">
            Visualize IoT network structure and connections
          </p>
        </div>
        <button
          onClick={fetchTopology}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Network Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative" style={{ height: "600px", overflow: "auto" }}>
          <svg
            width="100%"
            height="100%"
            className="border border-gray-200 rounded"
          >
            {/* Draw edges */}
            {topology.edges.map((edge) => {
              const sourceNode = topology.nodes.find(
                (n) => n.id === edge.source,
              );
              const targetNode = topology.nodes.find(
                (n) => n.id === edge.target,
              );
              if (!sourceNode || !targetNode) return null;

              return (
                <line
                  key={edge.id}
                  x1={sourceNode.position.x + 50}
                  y1={sourceNode.position.y + 50}
                  x2={targetNode.position.x + 50}
                  y2={targetNode.position.y + 50}
                  stroke={edge.type === "WIRELESS" ? "#3b82f6" : "#10b981"}
                  strokeWidth={2}
                  strokeDasharray={edge.type === "WIRELESS" ? "5,5" : "0"}
                />
              );
            })}

            {/* Draw nodes */}
            {topology.nodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const nodeColor =
                node.type === "GATEWAY"
                  ? "#ef4444"
                  : node.status === "ONLINE"
                    ? "#10b981"
                    : node.status === "OFFLINE"
                      ? "#6b7280"
                      : "#f59e0b";

              return (
                <g key={node.id}>
                  <circle
                    cx={node.position.x + 50}
                    cy={node.position.y + 50}
                    r={isSelected ? 35 : 30}
                    fill={nodeColor}
                    stroke={isSelected ? "#3b82f6" : "#fff"}
                    strokeWidth={isSelected ? 3 : 2}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  />
                  <text
                    x={node.position.x + 50}
                    y={node.position.y + 50}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {node.type === "GATEWAY"
                      ? "GW"
                      : node.name.charAt(0).toUpperCase()}
                  </text>
                  <text
                    x={node.position.x + 50}
                    y={node.position.y + 90}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Node Details</h2>
          {(() => {
            const node = topology.nodes.find((n) => n.id === selectedNode);
            if (!node) return null;

            return (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="text-gray-900 font-semibold">
                    {node.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900">{node.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      node.status === "ONLINE"
                        ? "bg-green-100 text-green-800"
                        : node.status === "OFFLINE"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Connections:</span>
                  <span className="text-gray-900">
                    {node.connections.length}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Nodes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {topology.nodes.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Gateways</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {topology.nodes.filter((n) => n.type === "GATEWAY").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Devices</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {topology.nodes.filter((n) => n.type === "DEVICE").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Connections</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {topology.edges.length}
          </p>
        </div>
      </div>
    </div>
  );
}
