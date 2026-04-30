/**
 * Advanced Load Design Page
 *
 * Comprehensive load design interface with:
 * - 3D visualization
 * - Multimodal planning
 * - Compliance validation
 * - Optimization
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Load3DVisualizer from "@/components/load-design/Load3DVisualizer";
import LoadPlanCard from "@/components/load-design/LoadPlanCard";
import LoadDesignWithMap from "@/components/load-design/LoadDesignWithMap";
import ExportButton from "@/components/load-design/ExportButton";
import type {
  LoadPlan,
  LoadItem,
  LoadOptimizationRequest,
} from "@/types/load-design";

export default function LoadDesignPage() {
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<LoadPlan | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "visualization" | "both">(
    "both",
  );

  const handleOptimize = async () => {
    setIsOptimizing(true);

    try {
      // Example items for optimization
      const request: LoadOptimizationRequest = {
        items: [
          {
            id: "item-1",
            description: "Pallet of goods",
            type: "PALLET",
            dimensions: { length: 120, width: 100, height: 150 },
            weight: 500,
            volume: 1.8,
            quantity: 10,
            destination: {
              address: "123 Main St",
              city: "Riyadh",
              country: "Saudi Arabia",
            },
            priority: "HIGH",
          },
        ],
        strategy: "BALANCED",
        complianceRequired: true,
        useAI: true,
      };

      const response = await fetch("/api/load-design/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error("Optimization failed");

      const result = await response.json();
      setLoadPlans(result.loadPlans || []);
      if (result.loadPlans && result.loadPlans.length > 0) {
        setSelectedPlan(result.loadPlans[0]);
      }
    } catch (error) {
      console.error("Optimization error:", error);
      alert("Failed to optimize load. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <PageTemplate
      title="Advanced Load Design"
      description="Intelligent load design with 3D visualization, multimodal planning, and compliance validation"
      icon="ri-stack-line"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["list", "visualization", "both"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <i
              className={`ri-${isOptimizing ? "loader-4-line animate-spin" : "magic-line"}`}
            ></i>
            {isOptimizing ? "Optimizing..." : "Optimize Load"}
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Load Plans List */}
          {(viewMode === "list" || viewMode === "both") && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Load Plans</h3>
              {loadPlans.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                  <i className="ri-stack-line text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-400">No load plans yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Optimize Load" to create your first load plan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loadPlans.map((plan) => (
                    <LoadPlanCard
                      key={plan.id}
                      loadPlan={plan}
                      onClick={() => setSelectedPlan(plan)}
                      showDetails={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3D Visualization & Map */}
          {(viewMode === "visualization" || viewMode === "both") && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                3D Visualization & Route Map
              </h3>
              {selectedPlan ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <LoadDesignWithMap
                    loadPlan={selectedPlan}
                    showMap={true}
                    show3D={true}
                  />
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center h-[600px] flex items-center justify-center">
                  <div>
                    <i className="ri-eye-line text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-400">
                      Select a load plan to visualize
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Plan Details */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Load Plan Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Load Number</div>
                <div className="text-sm text-white font-mono">
                  {selectedPlan.loadNumber}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Vehicle</div>
                <div className="text-sm text-white">
                  {selectedPlan.vehicleSpec.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Items</div>
                <div className="text-sm text-white">
                  {selectedPlan.items.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Compliance</div>
                <div className="text-sm text-white">
                  {selectedPlan.compliance.status}
                </div>
              </div>
            </div>

            {/* Compliance Details */}
            {selectedPlan.compliance.checks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Compliance Checks
                </h4>
                <div className="space-y-2">
                  {selectedPlan.compliance.checks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-3 rounded-lg ${
                        check.status === "PASS"
                          ? "bg-green-500/10 border border-green-500/20"
                          : check.status === "FAIL"
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-yellow-500/10 border border-yellow-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">
                          {check.message}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            check.status === "PASS"
                              ? "bg-green-500/20 text-green-400"
                              : check.status === "FAIL"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageTemplate>
  );
}
