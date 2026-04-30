/**
 * Quantum Transportation
 *
 * Schrödinger's Truck - Quantum state management and probability tracking
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { QuantumStateIndicator } from "@/components/quantum-state/QuantumStateIndicator";
import { apiFetch } from "@/utils/apiFetch";
import { RiAtomLine, RiEyeLine, RiTimeLine } from "react-icons/ri";

interface QuantumState {
  id: string;
  shipmentId: string;
  currentState: "COMMITTED" | "CONTINGENT" | "PHANTOM";
  probabilities: {
    onTime: number;
    delayed: number;
    noShow: number;
  };
  overallConfidence: number;
  observationCount: number;
  lastUpdated: string;
}

function TransportationQuantumPageContent() {
  const [loading, setLoading] = useState(false);
  const [quantumStates, setQuantumStates] = useState<QuantumState[]>([]);
  const [selectedState, setSelectedState] = useState<QuantumState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState("");

  useEffect(() => {
    loadQuantumStates();
  }, []);

  const loadQuantumStates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/quantum");

      if (!response.ok) {
        throw new Error(
          `Failed to load quantum states: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setQuantumStates(Array.isArray(data.states) ? data.states : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load quantum states",
      );
      console.error("Error loading quantum states:", err);
    } finally {
      setLoading(false);
    }
  };

  const getQuantumState = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/transportation/quantum?shipmentId=${shipmentId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to get quantum state: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedState(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get quantum state",
      );
      console.error("Error getting quantum state:", err);
    } finally {
      setLoading(false);
    }
  };

  const collapseState = async (trigger: string) => {
    if (!selectedState) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/quantum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "collapse",
          shipmentId: selectedState.shipmentId,
          trigger,
          data: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to collapse state: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedState(data);
      await loadQuantumStates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collapse state");
      console.error("Error collapsing state:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && quantumStates.length === 0 && !selectedState) {
    return (
      <PageTemplate
        title="Quantum Transportation"
        description="Schrödinger's Truck - Quantum state management and probability tracking"
        icon="ri-atom-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading quantum states..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Quantum Transportation"
      description="Schrödinger's Truck - Quantum state management and probability tracking"
      icon="ri-atom-line"
    >
      <div className="space-y-6">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiAtomLine className="w-5 h-5" />
            Quantum State Lookup
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              placeholder="Enter shipment ID"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <button
              onClick={getQuantumState}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Loading..." : "Get State"}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Selected State Details */}
        {selectedState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quantum State Details</h3>
              <QuantumStateIndicator
                shipmentId={selectedState.shipmentId}
                showDetails
                size="large"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  On-Time Probability
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {(selectedState.probabilities.onTime * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Delayed Probability
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(selectedState.probabilities.delayed * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  No-Show Probability
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {(selectedState.probabilities.noShow * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Confidence: {(selectedState.overallConfidence * 100).toFixed(0)}
                % | Observations: {selectedState.observationCount}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => collapseState("GPS_UPDATE")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                >
                  <RiEyeLine className="w-4 h-4 inline mr-1" />
                  Collapse (GPS)
                </button>
                <button
                  onClick={() => collapseState("GEOFENCE_ENTRY")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                >
                  <RiTimeLine className="w-4 h-4 inline mr-1" />
                  Collapse (Geofence)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Quantum States */}
        {quantumStates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4">All Quantum States</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">
                      Shipment ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">State</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      On-Time
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Delayed
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      No-Show
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quantumStates.map((state) => (
                    <tr
                      key={state.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedState(state)}
                    >
                      <td className="py-3 px-4 font-mono text-sm">
                        {state.shipmentId}
                      </td>
                      <td className="py-3 px-4">
                        <QuantumStateIndicator
                          shipmentId={state.shipmentId}
                          size="small"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {(state.probabilities.onTime * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        {(state.probabilities.delayed * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        {(state.probabilities.noShow * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        {(state.overallConfidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!selectedState && quantumStates.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiAtomLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter a shipment ID to view quantum state or wait for quantum
              states to be initialized
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationQuantumPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Quantum Transportation"
          description="Schrödinger's Truck - Quantum state management and probability tracking"
          icon="ri-atom-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationQuantumPageContent />
    </ErrorBoundary>
  );
}
