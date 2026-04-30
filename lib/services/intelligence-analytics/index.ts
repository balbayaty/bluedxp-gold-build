/**
 * Intelligence & Analytics Unified Module
 *
 * Main exports for the unified intelligence and analytics module
 */

// Core services
export { unifiedIntelligenceService } from "./core/unifiedIntelligenceService";
export { eventCaptureService } from "./core/eventCaptureService";
export { intelligenceIntegrationService } from "./core/integrationService";

// Root Cause Analysis
export { rootCauseAnalysisEngine } from "./root-cause/rootCauseAnalysisEngine";
export { evidenceCollectionService } from "./root-cause/evidenceCollectionService";
export { correlationService } from "./root-cause/correlationService";

// Data Mining (will be created)
export { dataMiningEngine } from "./data-mining/dataMiningEngine";

// Process Mining (will be created)
export { processMiningEngine } from "./process-mining/processMiningEngine";

// Analytics
export { analyticsAggregationService } from "./analytics/analyticsAggregationService";

// Patterns
export { patternLibrary } from "./patterns/patternLibrary";

// Export
export { exportService } from "./export/exportService";

// Initialization
export {
  initializeIntelligenceAnalyticsModule,
  cleanupIntelligenceAnalyticsModule,
} from "./initialize";

// Types
export type * from "@/types/intelligence-analytics";
