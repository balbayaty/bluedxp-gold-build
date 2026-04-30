/**
 * Emotional Intelligence Dashboard
 *
 * Revolutionary comprehensive emotional intelligence dashboard
 * Integrates all modules, shows predictions, relationships, and insights
 *
 * @module app/emotional-intelligence
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ErrorBoundary from "@/components/ErrorBoundary";
import EmotionHeatMap from "@/components/emotional-intelligence/EmotionHeatMap";
import SentimentFlow from "@/components/emotional-intelligence/SentimentFlow";
import RelationshipHealthDashboard from "@/components/emotional-intelligence/RelationshipHealthDashboard";
import BehavioralPredictionCard from "@/components/emotional-intelligence/BehavioralPredictionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/utils/apiFetch";
import type {
  SentimentAnalysis,
  BehavioralPrediction,
  RelationshipHealth,
  EmotionalInsight,
  EntityType,
} from "@/lib/services/emotional-intelligence/unifiedEmotionalIntelligenceService";

interface EmotionalIntelligenceData {
  heatMapData: Array<{
    entityId: string;
    entityType: EntityType;
    state: string;
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    intensity: number;
    timestamp: Date;
    x: number;
    y: number;
  }>;
  sentimentFlowData: Array<{
    timestamp: Date;
    sentiment: number;
    emotionalState: string;
    intensity: number;
    touchpoint?: string;
  }>;
  relationships: RelationshipHealth[];
  predictions: BehavioralPrediction[];
  insights: EmotionalInsight[];
}

function EmotionalIntelligencePage() {
  const [data, setData] = useState<EmotionalIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{
    entityId: string;
    entityType: EntityType;
  } | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">(
    "7d",
  );
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange, entityTypeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      params.set("timeRange", timeRange);
      if (entityTypeFilter.length > 0) {
        params.set("entityType", entityTypeFilter.join(","));
      }

      // Fetch real data from API
      const response = await apiFetch(
        `/api/emotional-intelligence/dashboard?${params.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: Failed to load data`,
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      // Transform data to match component expectations
      const transformedData: EmotionalIntelligenceData = {
        heatMapData: result.data.heatMapData || [],
        sentimentFlowData: result.data.sentimentFlowData || [],
        relationships: result.data.relationships || [],
        predictions: result.data.predictions || [],
        insights: result.data.insights || [],
      };

      setData(transformedData);
    } catch (err: any) {
      console.error(
        "[Emotional Intelligence Dashboard] Error loading data:",
        err,
      );
      setError(err.message || "Failed to load emotional intelligence data");
      // Set empty data on error to prevent crashes
      setData({
        heatMapData: [],
        sentimentFlowData: [],
        relationships: [],
        predictions: [],
        insights: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <PageTemplate
        title="Emotional Intelligence"
        description="Comprehensive emotional intelligence across all modules"
        icon="ri-heart-pulse-line"
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">
              Loading emotional intelligence data...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Emotional Intelligence"
        description="Comprehensive emotional intelligence across all modules"
        icon="ri-heart-pulse-line"
      >
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </PageTemplate>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <PageTemplate
      title="Emotional Intelligence Dashboard"
      description="Revolutionary emotional intelligence across all modules - Predict human behavior, track relationships, and generate insights"
      icon="ri-heart-pulse-line"
      className="space-y-6"
    >
      {/* Time Range Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-400">Time Range:</span>
        {(["24h", "7d", "30d", "all"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? "bg-blue-500/30 text-blue-400 border border-blue-500/50"
                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            {range === "all" ? "All Time" : range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-sm text-blue-300 mb-1">Total Entities</div>
              <div className="text-2xl font-bold text-blue-400">
                {data.heatMapData.length}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-sm text-green-300 mb-1">
                Active Relationships
              </div>
              <div className="text-2xl font-bold text-green-400">
                {data.relationships.length}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-purple-300 mb-1">
                Active Predictions
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {data.predictions.length}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-xl p-4 border border-amber-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-amber-300 mb-1">
                Insights Generated
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {data.insights.length}
              </div>
            </motion.div>
          </div>

          {/* Sentiment Flow */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Sentiment Flow
            </h3>
            <SentimentFlow
              data={data.sentimentFlowData}
              showPredictions={true}
              realTime={true}
            />
          </div>

          {/* Top Predictions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Predictions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.predictions.slice(0, 4).map((prediction, idx) => (
                <BehavioralPredictionCard
                  key={idx}
                  prediction={prediction}
                  onActionClick={(action) => {
                    console.log("Action clicked:", action);
                  }}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Heat Map Tab */}
        <TabsContent value="heatmap">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <EmotionHeatMap
              data={data.heatMapData}
              timeRange={timeRange}
              entityTypeFilter={entityTypeFilter}
              onEntityClick={(entityId, entityType) => {
                setSelectedEntity({ entityId, entityType });
              }}
            />
          </div>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <RelationshipHealthDashboard
              relationships={data.relationships}
              onRelationshipClick={(relationship) => {
                console.log("Relationship clicked:", relationship);
              }}
            />
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Behavioral Predictions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.predictions.map((prediction, idx) => (
                <BehavioralPredictionCard
                  key={idx}
                  prediction={prediction}
                  onActionClick={(action) => {
                    console.log("Action clicked:", action);
                  }}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Emotional Insights
            </h3>
            <div className="space-y-4">
              {data.insights.map((insight) => (
                <motion.div
                  key={insight.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white mb-1">
                        {insight.insight}
                      </div>
                      <div className="text-xs text-gray-400">
                        {insight.entityType} {insight.entityId.substring(0, 8)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          insight.type === "RISK"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : insight.type === "TREND"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {insight.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {insight.recommendedAction && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-1">
                        Recommended Action:
                      </div>
                      <div className="text-sm text-blue-400">
                        {insight.recommendedAction}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}

function EmotionalIntelligencePageWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Emotional Intelligence"
          description="Comprehensive emotional intelligence across all modules"
          icon="ri-heart-pulse-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <EmotionalIntelligencePage />
    </ErrorBoundary>
  );
}

export default EmotionalIntelligencePageWithErrorBoundary;
