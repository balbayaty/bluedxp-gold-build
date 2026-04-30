/**
 * Network Simulation View Component
 * Warehouse network what-if scenarios
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { networkSimulationService } from "@/lib/services/wms/networkSimulationService";
import type {
  NetworkSimulation,
  NetworkSimulationResults,
} from "@/lib/services/wms/networkSimulationService";

interface NetworkSimulationViewProps {
  warehouseId: string;
}

export default function NetworkSimulationView({
  warehouseId,
}: NetworkSimulationViewProps) {
  const [simulations, setSimulations] = useState<NetworkSimulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] =
    useState<NetworkSimulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    const sims = await networkSimulationService.getAllSimulations();
    setSimulations(sims);
  };

  const createAndRunSimulation = async (
    scenario: NetworkSimulation["scenario"],
  ) => {
    const simulation = await networkSimulationService.createSimulation({
      name: `${scenario} Simulation`,
      scenario,
      warehouses: [warehouseId],
      parameters: {},
    });

    setIsRunning(true);
    try {
      const results = await networkSimulationService.runSimulation(
        simulation.id,
      );
      setSelectedSimulation({ ...simulation, results, status: "COMPLETED" });
      await loadSimulations();
    } catch (error) {
      console.error("Error running simulation:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="ri-simulator-line mr-3 text-cyan-400"></i>
          Network Simulation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(
            [
              "CAPACITY_EXPANSION",
              "CONSOLIDATION",
              "ROUTING_OPTIMIZATION",
              "INVENTORY_REBALANCING",
            ] as const
          ).map((scenario) => (
            <button
              key={scenario}
              onClick={() => createAndRunSimulation(scenario)}
              disabled={isRunning}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors disabled:opacity-50"
            >
              <p className="text-white font-medium text-sm">
                {scenario.replace("_", " ")}
              </p>
            </button>
          ))}
        </div>

        {selectedSimulation?.results && (
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <h3 className="text-white font-medium mb-4">Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Cost Reduction</p>
                <p className="text-2xl font-bold text-green-400">
                  {selectedSimulation.results.improvements.costReduction.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Lead Time Reduction</p>
                <p className="text-2xl font-bold text-blue-400">
                  {selectedSimulation.results.improvements.leadTimeReduction.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Utilization Improvement</p>
                <p className="text-2xl font-bold text-purple-400">
                  {selectedSimulation.results.improvements.utilizationImprovement.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Inventory Optimization</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {selectedSimulation.results.improvements.inventoryOptimization.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
