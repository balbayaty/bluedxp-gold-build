/**
 * Transportation Psychology
 *
 * Cargo Psychology - Behavioral intelligence and psychology analysis
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { PsychologyStateIndicator } from "@/components/cargo-psychology/PsychologyStateIndicator";
import { apiFetch } from "@/utils/apiFetch";
import { RiUserHeartLine, RiBrainLine, RiAlertLine } from "react-icons/ri";

interface PsychologyState {
  id: string;
  shipmentId: string;
  currentState: "COMMITTED" | "CONTINGENT" | "PHANTOM";
  currentScore: {
    score: number;
    state: string;
    riskFactors: string[];
    positiveSignals: string[];
  };
  signalHistory: any[];
  interventionHistory: any[];
  createdAt: string;
  updatedAt: string;
}

function TransportationPsychologyPageContent() {
  const [loading, setLoading] = useState(false);
  const [psychologyState, setPsychologyState] =
    useState<PsychologyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState("");

  const getPsychologyState = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/shipments/${shipmentId}/psychology`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get psychology state: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setPsychologyState(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get psychology state",
      );
      console.error("Error getting psychology state:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeShipment = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/shipments/${shipmentId}/psychology`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze" }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to analyze shipment: ${response.statusText}`);
      }

      const data = await response.json();
      setPsychologyState(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze shipment",
      );
      console.error("Error analyzing shipment:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !psychologyState) {
    return (
      <PageTemplate
        title="Transportation Psychology"
        description="Cargo Psychology - Behavioral intelligence and psychology analysis"
        icon="ri-user-heart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Analyzing psychology..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Transportation Psychology"
      description="Cargo Psychology - Behavioral intelligence and psychology analysis"
      icon="ri-user-heart-line"
    >
      <div className="space-y-6">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RiBrainLine className="w-5 h-5" />
            Psychology Analysis
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
              onClick={getPsychologyState}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Get State
            </button>
            <button
              onClick={analyzeShipment}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Analyze
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Psychology State Details */}
        {psychologyState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Psychology State Details
              </h3>
              <PsychologyStateIndicator
                shipmentId={psychologyState.shipmentId}
                showDetails
                size="large"
              />
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Psychology Score</p>
                  <p className="text-3xl font-bold mt-1">
                    {(psychologyState.currentScore.score * 100).toFixed(0)}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">
                    State: {psychologyState.currentState}
                  </p>
                </div>
                <RiUserHeartLine className="w-12 h-12 opacity-50" />
              </div>
            </div>

            {/* Risk Factors */}
            {psychologyState.currentScore.riskFactors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-800 dark:text-red-200">
                  <RiAlertLine className="w-5 h-5" />
                  Risk Factors
                </h4>
                <ul className="space-y-1">
                  {psychologyState.currentScore.riskFactors.map(
                    (factor, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-700 dark:text-red-300"
                      >
                        • {factor}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Positive Signals */}
            {psychologyState.currentScore.positiveSignals.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">
                  Positive Signals
                </h4>
                <ul className="space-y-1">
                  {psychologyState.currentScore.positiveSignals.map(
                    (signal, index) => (
                      <li
                        key={index}
                        className="text-sm text-green-700 dark:text-green-300"
                      >
                        • {signal}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Signal History */}
            {psychologyState.signalHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Signal History</h4>
                <div className="space-y-2">
                  {psychologyState.signalHistory
                    .slice(0, 5)
                    .map((signal, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm"
                      >
                        <p className="font-medium">
                          {signal.signalType || "Unknown Signal"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                          {signal.analysis || "No analysis available"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Intervention History */}
            {psychologyState.interventionHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Intervention History</h4>
                <div className="space-y-2">
                  {psychologyState.interventionHistory
                    .slice(0, 5)
                    .map((intervention, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm"
                      >
                        <p className="font-medium">
                          {intervention.action || "Unknown Action"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                          {new Date(
                            intervention.timestamp || intervention.createdAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!psychologyState && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiUserHeartLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Enter a shipment ID to view or analyze psychology state
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationPsychologyPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Transportation Psychology"
          description="Cargo Psychology - Behavioral intelligence and psychology analysis"
          icon="ri-user-heart-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationPsychologyPageContent />
    </ErrorBoundary>
  );
}
