/**
 * Journey Analysis Page
 *
 * Dynamic journey analysis based on loading points, destinations, and touchpoints
 * Multi-modal support (Europe to Middle East)
 * Integrated with Journey Workflow and Root Cause Analysis
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Navigation,
  MapPin,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
} from "lucide-react";
import PageTemplate from "@/components/PageTemplate";
import JourneyAnalysisVisualization from "@/components/transportation/JourneyAnalysisVisualization";
import type { JourneyAnalysis, Shipment } from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";

export default function JourneyAnalysisPage() {
  const [shipmentId, setShipmentId] = useState<string>("SHIP-000001");
  const [journey, setJourney] = useState<JourneyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get shipment ID from URL params or use default demo ID
    const params = new URLSearchParams(window.location.search);
    const id = params.get("shipmentId") || "SHIP-000001";
    setShipmentId(id);
    // Auto-load demo data on mount
    loadJourney(id);
  }, []);

  const loadJourney = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/transportation/journey-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-by-shipment",
          shipmentId: id,
        }),
      });

      if (!response.ok) {
        // If not found, create new analysis
        await createJourney(id);
        return;
      }

      const data = await response.json();
      setJourney(data.analysis);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Error loading journey", error, {
        module: "transportation",
        service: "journey-analysis",
      });
      errorTrackingService.captureException(error, {
        module: "transportation",
        service: "journey-analysis",
      });
      setError(error.message || "Failed to load journey");
    } finally {
      setLoading(false);
    }
  };

  const createJourney = async (id: string) => {
    try {
      const response = await apiFetch("/api/transportation/journey-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          shipmentId: id,
          includeRootCauseAnalysis: true,
          includeOptimization: true,
          includePredictions: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create journey analysis");
      }

      const data = await response.json();
      setJourney(data.analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create journey analysis",
      );
    }
  };

  const handleAnalyze = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }
    await createJourney(shipmentId);
  };

  if (loading) {
    return (
      <PageTemplate
        title="Journey Analysis"
        description="Loading..."
        icon="ri-route-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Analyzing journey data..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Journey Analysis"
      description="Dynamic journey analysis with touchpoints, transport legs, and root cause analysis"
      icon="ri-route-line"
      actions={
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Shipment ID"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          />
          <button
            onClick={handleAnalyze}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Journey
          </button>
          {journey && (
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {journey ? (
        <JourneyAnalysisVisualization journey={journey} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">No Journey Analysis</h3>
          <p className="text-gray-500 mb-6">
            Enter a shipment ID and click "Analyze Journey" to generate a
            dynamic journey analysis
          </p>
          <div className="flex items-center justify-center gap-4">
            <input
              type="text"
              placeholder="Shipment ID"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <button
              onClick={handleAnalyze}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Analyze
            </button>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
