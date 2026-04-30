/**
 * Warehouse Digital Twin View Component
 * 3D visualization and simulation for warehouse
 * Uses existing warehouseDigitalTwinService - NO DUPLICATION
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseDigitalTwinService } from "@/lib/services/wms/warehouseDigitalTwinService";
import type {
  WarehouseDigitalTwin,
  WarehouseSimulation,
} from "@/lib/services/wms/warehouseDigitalTwinService";

interface WarehouseDigitalTwinViewProps {
  warehouseId: string;
}

export default function WarehouseDigitalTwinView({
  warehouseId,
}: WarehouseDigitalTwinViewProps) {
  const [digitalTwin, setDigitalTwin] = useState<WarehouseDigitalTwin | null>(
    null,
  );
  const [simulations, setSimulations] = useState<WarehouseSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<
    | "capacity_planning"
    | "layout_optimization"
    | "process_optimization"
    | "what_if"
  >("capacity_planning");

  useEffect(() => {
    loadDigitalTwin();
  }, [warehouseId]);

  const loadDigitalTwin = async () => {
    setIsLoading(true);
    try {
      let twin =
        await warehouseDigitalTwinService.getWarehouseDigitalTwin(warehouseId);

      // Create if doesn't exist
      if (!twin) {
        twin = await warehouseDigitalTwinService.createWarehouseDigitalTwin(
          warehouseId,
          {
            name: `Warehouse ${warehouseId} Digital Twin`,
            dataSources: [
              { type: "wms", sourceId: warehouseId },
              { type: "iot", sourceId: warehouseId },
              { type: "inventory", sourceId: warehouseId },
              { type: "operations", sourceId: warehouseId },
            ],
          },
        );
      }

      setDigitalTwin(twin);
    } catch (error) {
      console.error("Error loading digital twin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSimulation = async () => {
    setSimulationRunning(true);
    try {
      const simulation =
        await warehouseDigitalTwinService.runWarehouseSimulation(warehouseId, {
          name: `${selectedScenario.replace("_", " ")} Simulation`,
          type: selectedScenario,
          parameters: {
            warehouseId,
            scenario: selectedScenario,
          },
        });
      setSimulations((prev) => [simulation, ...prev.slice(0, 4)]); // Keep last 5
    } catch (error) {
      console.error("Error running simulation:", error);
    } finally {
      setSimulationRunning(false);
    }
  };

  const synchronizeTwin = async () => {
    try {
      await warehouseDigitalTwinService.synchronizeWarehouseTwin(warehouseId);
      await loadDigitalTwin();
    } catch (error) {
      console.error("Error synchronizing twin:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
          <p className="text-white text-lg">Loading digital twin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Digital Twin Status */}
      {digitalTwin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                {digitalTwin.name}
              </h3>
              <p className="text-sm text-[#9ca3af]">
                Status: {digitalTwin.status}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={synchronizeTwin}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
              >
                <i className="ri-refresh-line"></i>
                Sync Now
              </button>
            </div>
          </div>

          {/* Warehouse Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-[#9ca3af] mb-1">Capacity</div>
              <div className="text-lg font-bold text-white">
                {digitalTwin.warehouseMetrics.capacity.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-[#9ca3af] mb-1">Utilization</div>
              <div className="text-lg font-bold text-white">
                {digitalTwin.warehouseMetrics.utilization.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-[#9ca3af] mb-1">Efficiency</div>
              <div className="text-lg font-bold text-white">
                {digitalTwin.warehouseMetrics.efficiency.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-[#9ca3af] mb-1">Throughput</div>
              <div className="text-lg font-bold text-white">
                {digitalTwin.warehouseMetrics.throughput.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Simulation Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Run Simulation
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#9ca3af] mb-2 block">
              Scenario Type
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as any)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="capacity_planning">Capacity Planning</option>
              <option value="layout_optimization">Layout Optimization</option>
              <option value="process_optimization">Process Optimization</option>
              <option value="what_if">What-If Analysis</option>
            </select>
          </div>

          <button
            onClick={runSimulation}
            disabled={simulationRunning}
            className="w-full px-4 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {simulationRunning ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                <span>Running Simulation...</span>
              </>
            ) : (
              <>
                <i className="ri-play-line"></i>
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Simulation Results */}
      {simulations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Simulations
          </h3>
          <div className="space-y-3">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{sim.scenario}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      sim.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : sim.status === "running"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {sim.status}
                  </span>
                </div>
                {sim.results && (
                  <div className="text-sm text-[#9ca3af] mt-2">
                    Results available - {Object.keys(sim.results).length}{" "}
                    metrics calculated
                  </div>
                )}
                <div className="text-xs text-[#9ca3af] mt-2">
                  Started: {new Date(sim.startedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3D Visualization Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 aspect-video flex items-center justify-center"
      >
        <div className="text-center text-white">
          <i className="ri-3d-view text-6xl mb-4 opacity-60"></i>
          <p className="text-lg font-medium mb-2">3D Warehouse Digital Twin</p>
          <p className="text-sm text-[#9ca3af]">
            Interactive 3D visualization will be rendered here
          </p>
          <p className="text-xs text-[#9ca3af] mt-2">
            (Integration with Three.js or similar 3D library)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
