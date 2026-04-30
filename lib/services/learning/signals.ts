/**
 * Learning Signal Types
 *
 * Defines all learning signal types for self-learning architecture
 *
 * @module learning
 */

// ============================================================================
// LEARNING SIGNAL TYPES
// ============================================================================

/**
 * Prediction type
 */
export type PredictionType =
  | "shipment_eta"
  | "vendor_reliability"
  | "quantum_state"
  | "psychology_state"
  | "intent_detection"
  | "sentiment_analysis"
  | "compliance_status"
  | "risk_assessment"
  | "demand_forecast"
  | "route_optimization"
  | "chemical_compatibility"
  | "custom";

/**
 * Learning signal
 */
export interface LearningSignal {
  id: string;
  tenantId: string;
  timestamp: Date;

  // What was predicted
  prediction: {
    type: PredictionType;
    value: any; // The prediction
    confidence: number; // 0-1
    model: string; // Which model made it
    context: string[]; // What info was used
    metadata?: Record<string, any>;
  };

  // What actually happened
  outcome: {
    value: any; // The reality
    observedAt: Date;
    source: string; // How we know (event, user_feedback, external, manual)
    metadata?: Record<string, any>;
  };

  // The learning
  signal: {
    accuracy: number; // -1 (wrong) to +1 (correct)
    errorMagnitude?: number;
    errorDirection?: "over" | "under" | "none";
    errorPercentage?: number;

    // What should we update?
    knowledgeUpdates: {
      graphEdges?: GraphEdgeUpdate[];
      vectorWeights?: VectorWeightUpdate[];
      ruleUpdates?: RuleUpdate[];
      modelWeights?: ModelWeightUpdate[];
    };
  };

  // Processing status
  processed: boolean;
  processedAt?: Date;
  applied: boolean;
  appliedAt?: Date;
}

/**
 * Graph edge update
 */
export interface GraphEdgeUpdate {
  fromNode: string;
  toNode: string;
  edgeType: string;
  confidenceAdjustment: number; // -1 to +1
  reason: string;
}

/**
 * Vector weight update
 */
export interface VectorWeightUpdate {
  vectorId: string;
  weightAdjustment: number; // -1 to +1
  reason: string;
}

/**
 * Rule update
 */
export interface RuleUpdate {
  ruleId: string;
  ruleType: "threshold" | "weight" | "condition" | "action";
  update: {
    field: string;
    oldValue: any;
    newValue: any;
  };
  reason: string;
}

/**
 * Model weight update
 */
export interface ModelWeightUpdate {
  modelId: string;
  weightAdjustment: number; // -1 to +1
  reason: string;
}

/**
 * Learning signal metadata
 */
export interface LearningSignalMetadata {
  sourceService: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Learning signal filter
 */
export interface LearningSignalFilter {
  tenantId?: string;
  predictionType?: PredictionType;
  dateRange?: {
    from: Date;
    to: Date;
  };
  processed?: boolean;
  applied?: boolean;
  minAccuracy?: number;
  maxAccuracy?: number;
  sourceService?: string;
}

/**
 * Learning signal statistics
 */
export interface LearningSignalStats {
  totalSignals: number;
  byType: Record<PredictionType, number>;
  averageAccuracy: number;
  processedCount: number;
  appliedCount: number;
  bySource: Record<string, number>;
  accuracyDistribution: {
    excellent: number; // > 0.8
    good: number; // 0.5 to 0.8
    poor: number; // 0 to 0.5
    wrong: number; // < 0
  };
}
