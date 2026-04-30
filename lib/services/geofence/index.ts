/**
 * Geofence Service - Main Export
 *
 * Central export for all geofence services and types
 */

// Core services
export { geofenceZoneService } from "./zone-service";
export * from "./types";

// AI/ML services
export { geofencePredictiveAnalyticsService } from "./ai/predictiveAnalyticsService";
export type {
  DwellTimePrediction,
  ZoneEntryPrediction,
  AnomalyDetection,
  RiskScore,
  PredictiveInsight,
} from "./ai/predictiveAnalyticsService";

// Analytics services
export { geofenceAnalyticsService } from "./analytics/geofenceAnalyticsService";
export type {
  GeofenceAnalytics,
  ZonePerformanceMetrics,
  EventAnalytics,
  DriverPerformance,
} from "./analytics/geofenceAnalyticsService";

// Real-time services
export { geofenceRealtimeService } from "./realtime/geofenceRealtimeService";
export type {
  RealtimeGeofenceUpdate,
  RealtimeSubscription,
} from "./realtime/geofenceRealtimeService";

// Learning services
export { patternLearningService } from "./learning/patternLearningService";
export type {
  LearnedPattern,
  PatternInsight,
} from "./learning/patternLearningService";

// Agent services
export * from "./agents/geofenceAgents";

// Workflow services
export { geofenceWorkflowService } from "./workflows/geofenceWorkflowService";

// Integrations
export * from "./integrations";

// WhatsApp integration
export * from "./whatsapp-integration";
