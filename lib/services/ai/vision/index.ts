/**
 * AI Vision Module - Central Export
 * Exports all vision services for easy importing
 * Ensures proper initialization and error handling
 */

// Core Services
export {
  visionService,
  default as visionServiceDefault,
} from "../visionService";
export { enhancedVisionService } from "../enhancedVisionService";
export { unifiedVisionService } from "../unifiedVisionService";

// Database & Persistence
export { visionDatabaseService } from "./visionDatabaseService";

// Event Integration
export { visionEventIntegration } from "./visionEventIntegration";

// Agent Integration
export { visionAgentIntegration } from "./visionAgentIntegration";

// Human-in-the-Loop
export { humanInTheLoopService } from "./humanInTheLoopService";

// Intelligent Automation
export { intelligentAutomationService } from "./intelligentAutomationService";

// Self-Learning
export { selfLearningVisionService } from "./v2/selfLearningVisionService";

// Database Adapter
export { visionLearningDatabaseAdapter } from "./v2/visionLearningDatabaseAdapter";

// Advanced Features
export { privacyPreservingVisionService } from "./privacyPreservingVisionService";
export { explainableVisionService } from "./explainableVisionService";
export { predictiveAnalyticsService } from "./predictiveAnalyticsService";

// Types
export type {
  VisionAnalysisResult,
  VisionServiceConfig,
} from "../visionService";
export type {
  EnhancedVisionAnalysis,
  EnhancedVisionConfig,
} from "../enhancedVisionService";
export type {
  UnifiedVisionAnalysis,
  UnifiedVisionConfig,
} from "../unifiedVisionService";

/**
 * Initialize Vision Module
 * Call this on application startup
 */
export async function initializeVisionModule(tenantId?: string): Promise<void> {
  try {
    console.log("🚀 Initializing AI Vision Module...");

    // Initialize event integration
    visionEventIntegration.initialize();

    // Initialize automation service
    await intelligentAutomationService.initialize();

    // Initialize self-learning service (if needed)
    // selfLearningVisionService is already initialized on import

    console.log("✅ AI Vision Module initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing AI Vision Module:", error);
    // Don't throw - allow app to continue
  }
}
