/**
 * Psychology Engine
 *
 * Calculates psychology score from behavioral signals
 * Applies temporal modifiers
 * Determines psychological state
 *
 * @module cargo-psychology
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { temporalModifierService } from "./temporal-modifiers";
import { signalAnalyzer } from "./signal-analyzer";
import type {
  SignalValues,
  SignalAnalysis,
  PsychologyScore,
  PsychologyState,
  PSYCHOLOGY_STATE_DEFINITIONS,
  BEHAVIORAL_SIGNALS,
  TemporalContext,
} from "./types";

// ============================================================================
// PSYCHOLOGY ENGINE
// ============================================================================

export class PsychologyEngine {
  /**
   * Calculate psychology score from signals
   */
  async calculatePsychologyScore(
    signals: SignalValues,
    temporalContext?: TemporalContext,
  ): Promise<PsychologyScore> {
    // Get temporal context if not provided
    if (!temporalContext) {
      temporalContext = temporalModifierService.getTemporalContext(new Date());
    }

    // Analyze each signal
    const signalAnalyses: SignalAnalysis[] = [];
    let baseScore = 0;

    for (const signalDef of BEHAVIORAL_SIGNALS) {
      const signalValue = signals[signalDef.signal];
      if (!signalValue) {
        continue; // Skip missing signals
      }

      // Get risk score for this signal value
      const riskScore = signalDef.riskMapping[signalValue] || 0.5;
      const weightedRisk = riskScore * signalDef.weight;
      baseScore += weightedRisk;

      // Create signal analysis
      const analysis = await signalAnalyzer.analyzeSignal(
        signalDef.signal,
        signalValue,
        "", // shipmentId would be passed in real usage
      );
      signalAnalyses.push(analysis);
    }

    // Normalize base score (in case some signals are missing)
    const totalWeight = signalAnalyses.reduce((sum, a) => sum + a.weight, 0);
    const normalizedBaseScore =
      totalWeight > 0 ? baseScore / totalWeight : baseScore;

    // Apply temporal multiplier
    const adjustedScore =
      normalizedBaseScore * temporalContext.temporalMultiplier;

    // Determine state
    const state = this.determineState(adjustedScore);

    // Calculate confidence
    const confidence = this.calculateConfidence(signalAnalyses, signals);

    // Get risk factors and positive signals
    const riskFactors = signalAnalyses
      .filter((a) => a.riskScore >= 0.7)
      .map((a) => a.signal);
    const positiveSignals = signalAnalyses
      .filter((a) => a.riskScore <= 0.3)
      .map((a) => a.signal);

    // Get recommended intervention
    const recommendedIntervention = this.getRecommendedIntervention(state);

    return {
      score: Math.min(1.0, adjustedScore), // Cap at 1.0
      state,
      confidence,
      baseScore: normalizedBaseScore,
      temporalMultiplier: temporalContext.temporalMultiplier,
      signalAnalyses,
      recommendedIntervention,
      riskFactors,
      positiveSignals,
    };
  }

  /**
   * Determine psychological state from score
   */
  determineState(score: number): PsychologyState {
    if (score < 0.35) {
      return "COMMITTED";
    } else if (score < 0.65) {
      return "CONTINGENT";
    } else {
      return "PHANTOM";
    }
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(
    signalAnalyses: SignalAnalysis[],
    signals: SignalValues,
  ): number {
    if (signalAnalyses.length === 0) {
      return 0.1; // Very low confidence with no signals
    }

    // Base confidence on signal completeness
    const signalCompleteness =
      Object.keys(signals).length / BEHAVIORAL_SIGNALS.length;
    let confidence = signalCompleteness * 0.6; // Up to 60% from completeness

    // Add confidence from individual signal confidences
    const avgSignalConfidence =
      signalAnalyses.reduce((sum, a) => sum + a.confidence, 0) /
      signalAnalyses.length;
    confidence += avgSignalConfidence * 0.4; // Up to 40% from signal quality

    return Math.min(1.0, confidence);
  }

  /**
   * Get recommended intervention for state
   */
  getRecommendedIntervention(state: PsychologyState) {
    const playbook = {
      COMMITTED: {
        action: "STANDARD_CONFIRMATION" as const,
        priority: "LOW" as const,
        timing: "Day before shipment",
      },
      CONTINGENT: {
        action: "PERSONALIZED_CALL" as const,
        priority: "MEDIUM" as const,
        timing: "48-72 hours before shipment",
      },
      PHANTOM: {
        action: "MANAGER_ESCALATION" as const,
        priority: "HIGH" as const,
        timing: "72+ hours before shipment",
      },
    };

    return playbook[state];
  }

  /**
   * Update score based on new signal
   */
  async updateScoreWithNewSignal(
    currentScore: PsychologyScore,
    newSignal: SignalAnalysis,
  ): Promise<PsychologyScore> {
    // Remove old signal analysis if exists
    const updatedAnalyses = currentScore.signalAnalyses.filter(
      (a) => a.signal !== newSignal.signal,
    );
    updatedAnalyses.push(newSignal);

    // Recalculate base score
    let baseScore = 0;
    for (const analysis of updatedAnalyses) {
      baseScore += analysis.weightedRisk;
    }

    // Normalize
    const totalWeight = updatedAnalyses.reduce((sum, a) => sum + a.weight, 0);
    const normalizedBaseScore =
      totalWeight > 0 ? baseScore / totalWeight : baseScore;

    // Apply temporal multiplier (keep existing)
    const adjustedScore = normalizedBaseScore * currentScore.temporalMultiplier;

    // Determine new state
    const newState = this.determineState(adjustedScore);

    // Update risk factors and positive signals
    const riskFactors = updatedAnalyses
      .filter((a) => a.riskScore >= 0.7)
      .map((a) => a.signal);
    const positiveSignals = updatedAnalyses
      .filter((a) => a.riskScore <= 0.3)
      .map((a) => a.signal);

    return {
      ...currentScore,
      score: Math.min(1.0, adjustedScore),
      state: newState,
      baseScore: normalizedBaseScore,
      signalAnalyses: updatedAnalyses,
      recommendedIntervention: this.getRecommendedIntervention(newState),
      riskFactors,
      positiveSignals,
      confidence: this.calculateConfidence(updatedAnalyses, {}), // Would pass actual signals
    };
  }

  /**
   * Learn from outcome (update signal weights based on accuracy)
   */
  async learnFromOutcome(
    shipmentId: string,
    predictedState: PsychologyState,
    actualOutcome: "COMPLETED" | "NO_SHOW" | "DELAYED",
    psychologyScore: PsychologyScore,
  ): Promise<void> {
    // Determine if prediction was accurate
    const wasAccurate = this.wasPredictionAccurate(
      predictedState,
      actualOutcome,
    );

    // Store learning signal in Knowledge Base
    try {
      await knowledgeBaseService.learn({
        tenantId: "", // Would get from shipment
        agentId: "cargo-psychology",
        type: "prediction_outcome",
        trigger: `Psychology prediction for shipment ${shipmentId}`,
        input: {
          predictedState,
          psychologyScore: psychologyScore.score,
          signals: psychologyScore.signalAnalyses.map((a) => ({
            signal: a.signal,
            riskScore: a.riskScore,
          })),
        },
        output: {
          actualOutcome,
          wasAccurate,
        },
        confidence: psychologyScore.confidence,
        success: wasAccurate,
      });
    } catch (error) {
      console.warn("Error storing learning signal:", error);
    }

    // Publish learning event
    await eventBus.publish(
      createEvent(
        "CargoPsychologyLearning",
        shipmentId,
        "Shipment",
        {
          predictedState,
          actualOutcome,
          wasAccurate,
          psychologyScore: psychologyScore.score,
        },
        1,
        {
          correlationId: `learn-${Date.now()}`,
          userId: "cargo-psychology-service",
        },
      ),
    );
  }

  /**
   * Check if prediction was accurate
   */
  private wasPredictionAccurate(
    predictedState: PsychologyState,
    actualOutcome: "COMPLETED" | "NO_SHOW" | "DELAYED",
  ): boolean {
    if (predictedState === "COMMITTED" && actualOutcome === "COMPLETED") {
      return true;
    }
    if (predictedState === "PHANTOM" && actualOutcome === "NO_SHOW") {
      return true;
    }
    if (predictedState === "CONTINGENT") {
      // CONTINGENT can be accurate for any outcome
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const psychologyEngine = new PsychologyEngine();
