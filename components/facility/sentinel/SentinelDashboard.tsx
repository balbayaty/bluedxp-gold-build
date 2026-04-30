"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  SentinelEngine,
  SentinelNode,
  SentinelEdge,
  NodeType,
  NodeStatus,
} from "@/lib/services/facility/sentinel/sentinelEngine";
import {
  InventoryImpactService,
  ImpactedBatch,
} from "@/lib/services/facility/sentinel/inventoryImpactService";
import { motion, AnimatePresence } from "framer-motion";
import Facility3DScene from "@/components/facility/3d/Facility3DScene";

// --- Custom Node Styles ---
const getNodeStyle = (status: NodeStatus, type: NodeType) => {
  let borderColor = "#0ea5e9"; // Default blue
  let glowColor = "rgba(14, 165, 233, 0.4)";

  switch (status) {
    case "OPERATIONAL":
      borderColor = "#10b981"; // Green
      glowColor = "rgba(16, 185, 129, 0.4)";
      break;
    case "WARNING":
      borderColor = "#f59e0b"; // Amber
      glowColor = "rgba(245, 158, 11, 0.4)";
      break;
    case "CRITICAL":
    case "FAILED":
      borderColor = "#ef4444"; // Red
      glowColor = "rgba(239, 68, 68, 0.6)";
      break;
    case "OFFLINE":
      borderColor = "#6b7280"; // Gray
      glowColor = "rgba(107, 114, 128, 0.2)";
      break;
  }

  return {
    background: "#1f2937",
    color: "#fff",
    border: `2px solid ${borderColor}`,
    borderRadius: "12px",
    padding: "10px",
    boxShadow: `0 0 15px ${glowColor}`,
    width: 150,
  };
};

const sentinelEngine = new SentinelEngine();

// --- Mock Data Setup ---
const initialNodesData: SentinelNode[] = [
  {
    id: "1",
    type: "INFRASTRUCTURE",
    label: "Main Power Grid",
    status: "OPERATIONAL",
    health: 100,
    degradationRate: 0.1,
    criticality: 10,
  },
  {
    id: "2",
    type: "INFRASTRUCTURE",
    label: "Backup Generator",
    status: "OPERATIONAL",
    health: 95,
    degradationRate: 5.0,
    criticality: 8,
  }, // High deg rate: will fail in ~19h
  {
    id: "3",
    type: "ASSET",
    label: "Cooling Chiller A",
    status: "OPERATIONAL",
    health: 98,
    degradationRate: 0.5,
    criticality: 9,
  },
  {
    id: "4",
    type: "ASSET",
    label: "Cooling Chiller B",
    status: "OPERATIONAL",
    health: 90,
    degradationRate: 0.8,
    criticality: 7,
  },
  {
    id: "5",
    type: "ZONE",
    label: "Chemical Storage 1",
    status: "OPERATIONAL",
    health: 100,
    degradationRate: 0,
    criticality: 10,
  },
  {
    id: "6",
    type: "PROCESS",
    label: "Temp Control Sys",
    status: "OPERATIONAL",
    health: 100,
    degradationRate: 0,
    criticality: 9,
  },
  {
    id: "7",
    type: "SENSOR",
    label: "Zone 1 Temp Sensor",
    status: "OPERATIONAL",
    health: 100,
    degradationRate: 0.1,
    criticality: 6,
  },
  {
    id: "8",
    type: "ASSET",
    label: "Ventilation Unit",
    status: "OPERATIONAL",
    health: 100,
    degradationRate: 0.3,
    criticality: 8,
  },
];

const initialEdgesData: SentinelEdge[] = [
  { id: "e1-3", source: "1", target: "3", type: "POWER", weight: 1.0 }, // Power -> Chiller A
  { id: "e1-8", source: "1", target: "8", type: "POWER", weight: 1.0 }, // Power -> Vent
  { id: "e2-3", source: "2", target: "3", type: "POWER", weight: 0.8 }, // Backup -> Chiller A
  { id: "e3-6", source: "3", target: "6", type: "Thermal", weight: 1.0 }, // Chiller A -> Process
  { id: "e4-6", source: "4", target: "6", type: "Thermal", weight: 0.6 }, // Chiller B -> Process
  { id: "e6-5", source: "6", target: "5", type: "DEPENDENCY", weight: 1.0 }, // Process -> Zone
  { id: "e8-5", source: "8", target: "5", type: "DEPENDENCY", weight: 0.9 }, // Vent -> Zone
  { id: "e5-7", source: "5", target: "7", type: "DATA", weight: 1.0 }, // Zone -> Sensor
];

export default function SentinelDashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [systemHealth, setSystemHealth] = useState(100);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactedBatch[]>([]);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [predictionHours, setPredictionHours] = useState(0);

  // Keep a clean set of SentinelNodes for the 3D view (ReactFlow nodes structure is different)
  const [rawNodes, setRawNodes] = useState<SentinelNode[]>(initialNodesData);

  // Initialize Graph
  useEffect(() => {
    sentinelEngine.resetGraph(initialNodesData, initialEdgesData);
    refreshGraphState(initialNodesData, initialEdgesData);
    addLog("System Initialized. All systems operational.");
  }, []);

  const refreshGraphState = (
    sNodes: SentinelNode[],
    sEdges: SentinelEdge[],
    failedIds: string[] = [],
  ) => {
    // Prepare ReactFlow Nodes
    const rfNodes: Node[] = sNodes.map((n, idx) => ({
      id: n.id,
      position: {
        x: 250 + (idx % 3) * 200,
        y: 100 + Math.floor(idx / 3) * 150,
      },
      data: { label: n.label, original: n },
      style: getNodeStyle(n.status, n.type),
      type: "default",
    }));

    // Prepare ReactFlow Edges
    const rfEdges: Edge[] = sEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: !failedIds.includes(e.source), // Stop animation if source failed
      style: {
        stroke: failedIds.includes(e.source) ? "#ef4444" : "#0ea5e9",
        strokeWidth: 2,
        opacity: failedIds.includes(e.source) ? 0.3 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: failedIds.includes(e.source) ? "#ef4444" : "#0ea5e9",
      },
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
    setRawNodes(sNodes);
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 50));
  };

  const handleSimulation = async (nodeId: string) => {
    if (!nodeId) return;

    // Simulate Failure
    const targetNode = rawNodes.find((n) => n.id === nodeId);
    addLog(
      `USER COMMAND: Simulate failure on ${targetNode?.label || nodeId}...`,
    );

    // Run Logic
    const result = sentinelEngine.simulateFailure(nodeId);

    // Update local state to reflect failure
    const updatedNodes = rawNodes.map((n) => {
      if (result.impactedNodes.includes(n.id)) {
        return { ...n, status: "FAILED" as NodeStatus, health: 0 };
      }
      return n;
    });

    // Refresh UI
    refreshGraphState(updatedNodes, initialEdgesData, result.impactedNodes);
    setSystemHealth(result.systemHealth);
    result.logs.forEach((l) => addLog(l));

    // Calculate Inventory Impact
    const impacts = await InventoryImpactService.getImpactedInventory(
      result.impactedNodes,
    );
    setImpactAnalysis(impacts);
    if (impacts.length > 0) {
      addLog(`CRITICAL: ${impacts.length} Inventory Batches at risk!`);

      // THE VOICE: Autonomous Alert
      addLog(`THE VOICE: Initiating WhatsApp Emergency Protocol...`);
      setTimeout(() => {
        addLog(
          `WHATSAPP SENT: "Alert! ${targetNode?.label} Failed. $${impacts.reduce((a, b) => a + b.projectedLoss, 0).toLocaleString()} loss imminent."`,
        );
      }, 1500);
    }
  };

  const handlePrediction = (hours: number) => {
    setPredictionHours(hours);
    if (hours === 0) {
      // Reset to Now
      sentinelEngine.resetGraph(initialNodesData, initialEdgesData);
      refreshGraphState(initialNodesData, initialEdgesData);
      addLog("ORACLE: Returned to Present Time.");
      return;
    }

    const { nodes, logs } = sentinelEngine.predictState(hours);
    const failedIds = nodes
      .filter((n) => n.status === "FAILED")
      .map((n) => n.id);
    refreshGraphState(nodes, initialEdgesData, failedIds);
    logs.forEach((l) => addLog(l));
  };

  const handleReset = () => {
    // Reload page or reset state
    window.location.reload();
  };

  return (
    <div className="flex bg-gray-900 text-white rounded-xl overflow-hidden border border-gray-800 shadow-2xl h-[90vh]">
      {/* Sidebar Controls */}
      <div className="w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            THE SENTINEL
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            Autonomous Facility Nervous System
          </p>

          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-gray-900 rounded-lg border border-gray-800">
              <button
                onClick={() => setViewMode("2D")}
                className={`flex-1 py-1.5 text-xs font-bold rounded ${viewMode === "2D" ? "bg-cyan-500 text-black" : "text-gray-400 hover:text-white"}`}
              >
                2D GRAPH
              </button>
              <button
                onClick={() => setViewMode("3D")}
                className={`flex-1 py-1.5 text-xs font-bold rounded ${viewMode === "3D" ? "bg-cyan-500 text-black" : "text-gray-400 hover:text-white"}`}
              >
                3D IMMERSIVE
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">System Resilience</span>
              <span
                className={`text-xl font-mono font-bold ${systemHealth > 80 ? "text-green-400" : "text-red-500"}`}
              >
                {Math.round(systemHealth)}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${systemHealth > 80 ? "bg-green-500" : "bg-red-500"}`}
                initial={{ width: "100%" }}
                animate={{ width: `${systemHealth}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700 rounded-lg transition-all"
          >
            Reset Simulation
          </button>

          {/* THE ORACLE CONTROLS */}
          <div className="mt-8 border-t border-gray-800 pt-6">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-pass-valid-line text-purple-400"></i>
              <h3 className="text-sm font-bold text-purple-400">THE ORACLE</h3>
            </div>
            <p className="text-[10px] text-gray-400 mb-4">
              Predictive Time-Travel Simulation
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>NOW</span>
              <span className="text-purple-400 font-mono">
                +{predictionHours}h
              </span>
              <span>+48h</span>
            </div>
            <input
              type="range"
              min="0"
              max="48"
              step="1"
              value={predictionHours}
              onChange={(e) => handlePrediction(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            {predictionHours > 0 && (
              <div className="mt-2 text-[10px] text-purple-300 animate-pulse text-center">
                PREDICTING FUTURE STATE
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          <div className="text-gray-500 uppercase tracking-wider mb-2">
            Event Log
          </div>
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded border-l-2 ${log.includes("FAILURE") || log.includes("impacted") || log.includes("CRITICAL") ? "border-red-500 bg-red-900/10 text-red-300" : "border-cyan-500 bg-gray-800 text-gray-300"}`}
              >
                <span className="opacity-50 mr-2">
                  [{new Date().toLocaleTimeString().split(" ")[0]}]
                </span>
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-black relative">
        {/* Visualization Area */}
        <div className="flex-1 relative border-b border-gray-800">
          {viewMode === "2D" ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => handleSimulation(node.id)}
              fitView
              className="bg-gray-950"
              maxZoom={1.5}
              minZoom={0.5}
            >
              <Background color="#333" gap={20} />
              <Controls className="bg-gray-800 border-gray-700 fill-white text-white" />
              <MiniMap
                nodeColor="#0ea5e9"
                maskColor="rgba(0, 0, 0, 0.7)"
                className="bg-gray-900 border border-gray-800"
              />
            </ReactFlow>
          ) : (
            <Facility3DScene nodes={rawNodes} onNodeClick={handleSimulation} />
          )}

          {/* Overlay Hint */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur border border-white/10 p-3 rounded-lg pointer-events-none">
            <p className="text-xs text-cyan-400 font-bold">MODE: {viewMode}</p>
            <p className="text-[10px] text-gray-400">
              Click objects to simulate failure
            </p>
          </div>
        </div>

        {/* Impact Analysis Panel (Bottom) */}
        <AnimatePresence>
          {impactAnalysis.length > 0 && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="bg-red-950/20 border-t border-red-900/50 backdrop-blur-sm"
            >
              <div className="p-4">
                <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                  <i className="ri-alert-line animate-pulse"></i>
                  INVENTORY IMPACT ASSESSMENT
                  <span className="text-xs font-normal text-red-300 ml-2 bg-red-900/50 px-2 py-0.5 rounded">
                    {impactAnalysis.length} Batches At Risk
                  </span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-red-900/30 text-red-200">
                      <tr>
                        <th className="p-2">Chemical Name</th>
                        <th className="p-2">Location</th>
                        <th className="p-2">SKU / Batch</th>
                        <th className="p-2">Risk Level</th>
                        <th className="p-2">Projected Loss</th>
                        <th className="p-2">Time To Spoilage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactAnalysis.map((item, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-red-900/20 hover:bg-red-900/10 transition-colors"
                        >
                          <td className="p-2 font-semibold text-white">
                            {item.chemicalName}
                          </td>
                          <td className="p-2">{item.location}</td>
                          <td className="p-2 font-mono">{item.sku}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${item.riskLevel === "CRITICAL" ? "bg-red-600 text-white" : "bg-amber-600 text-black"}`}
                            >
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="p-2 text-red-400 font-mono">
                            ${item.projectedLoss.toLocaleString()}
                          </td>
                          <td className="p-2">{item.timeToSpoilage} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
