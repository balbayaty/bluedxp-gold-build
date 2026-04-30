/**
 * AI Services
 * Advanced AI and machine learning services
 * Source: Adapted from chemcheck-analysis/lib/ai/ and chemcheck-analysis/lib/hazalyze/
 */

// Brain Gateway (already exists)
export {
  brainRoute,
  brainTranslateSegments,
  brainGateway,
} from "./brainGateway";

// Mirsad AI Brain (Federated Learning)
export { MirsadAIBrain, mirsadAIBrain } from "./mirsadAIBrain";
export type {
  AIBrainConfig,
  AICapability,
  AIPrediction,
  FederatedLearningSession,
  GlobalModel,
  AIInsight,
} from "./mirsadAIBrain";

// Personalized Learning Engine
export {
  PersonalizedLearningEngine,
  personalizedLearningEngine,
} from "./personalizedLearning";
export type {
  LearnerProfile,
  PersonalizedLearningPath,
  LearningPrediction,
  LearningAnalytics,
  AdaptiveContent,
  TutoringResponse,
} from "./personalizedLearning";

// AI Video Analyzer
export { AIVideoAnalyzer, aiVideoAnalyzer } from "./videoAnalyzer";
export type {
  SafetyViolation,
  AnalysisResult,
  VideoFrame,
} from "./videoAnalyzer";

// Edge AI Processor
export { EdgeAIProcessor, edgeProcessor } from "./edgeProcessor";
export type { EdgeNode, EdgeModel, EdgeTask } from "./edgeProcessor";

// Hazalyze Analysis Engine
export { HazalyzeAnalysisEngine, hazalyzeEngine } from "./hazalyzeAnalysis";
export type {
  Chemical,
  AnalysisReport,
  CompatibilityMatrix,
  SaudiCompliance,
  HealthHazard,
  EnvironmentalHazard,
  PhysicalHazard,
} from "./hazalyzeAnalysis";
