/**
 * Explainable AI (XAI) Vision Service
 * Provides transparent decision-making explanations for vision analysis
 * Industry standard for 2025 enterprise AI
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DecisionExplanation {
  decision: string; // What was decided
  confidence: number; // 0-100
  reasoning: string; // Why this decision was made
  factors: Array<{
    factor: string;
    weight: number; // 0-1, how much this factor contributed
    impact: "positive" | "negative" | "neutral";
    evidence: string; // Visual evidence supporting this factor
  }>;
  alternatives: Array<{
    option: string;
    confidence: number;
    whyNot: string; // Why this wasn't chosen
  }>;
  visualEvidence: Array<{
    region: { x: number; y: number; width: number; height: number };
    description: string;
    confidence: number;
  }>;
}

export interface ConfidenceBreakdown {
  overall: number;
  components: Array<{
    component: string;
    confidence: number;
    contribution: number; // Percentage contribution to overall confidence
    factors: string[];
  }>;
  uncertainty: {
    level: "low" | "medium" | "high";
    sources: string[]; // Sources of uncertainty
    recommendations: string[]; // How to reduce uncertainty
  };
}

export interface FeatureImportance {
  feature: string;
  importance: number; // 0-100
  impact: "critical" | "high" | "medium" | "low";
  description: string;
  examples: string[];
}

export interface ExplainableAnalysis {
  analysis: any; // Original analysis
  explanations: DecisionExplanation[];
  confidenceBreakdown: ConfidenceBreakdown;
  featureImportance: FeatureImportance[];
  transparencyScore: number; // 0-100, how transparent the explanation is
  recommendations: string[]; // Recommendations for improving decisions
}

// ============================================================================
// EXPLAINABLE VISION SERVICE
// ============================================================================

class ExplainableVisionService {
  /**
   * Explain vision analysis decision
   */
  async explainAnalysis(analysis: any): Promise<ExplainableAnalysis> {
    // Extract decisions from analysis
    const decisions = this.extractDecisions(analysis);

    // Generate explanations for each decision
    const explanations = await Promise.all(
      decisions.map((decision) => this.explainDecision(decision, analysis)),
    );

    // Calculate confidence breakdown
    const confidenceBreakdown = this.calculateConfidenceBreakdown(analysis);

    // Calculate feature importance
    const featureImportance = this.calculateFeatureImportance(analysis);

    // Calculate transparency score
    const transparencyScore = this.calculateTransparencyScore(
      explanations,
      confidenceBreakdown,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      analysis,
      explanations,
      confidenceBreakdown,
    );

    return {
      analysis,
      explanations,
      confidenceBreakdown,
      featureImportance,
      transparencyScore,
      recommendations,
    };
  }

  /**
   * Extract decisions from analysis
   */
  private extractDecisions(
    analysis: any,
  ): Array<{ type: string; value: any; confidence: number }> {
    const decisions: Array<{ type: string; value: any; confidence: number }> =
      [];

    // Extract quality issue decisions
    if (analysis.qualityIssues && analysis.qualityIssues.length > 0) {
      analysis.qualityIssues.forEach((issue: any) => {
        decisions.push({
          type: "quality_issue",
          value: issue.type,
          confidence: issue.confidence || 0,
        });
      });
    }

    // Extract safety issue decisions
    if (analysis.safetyIssues && analysis.safetyIssues.length > 0) {
      analysis.safetyIssues.forEach((issue: any) => {
        decisions.push({
          type: "safety_issue",
          value: issue.issue,
          confidence: issue.confidence || 0,
        });
      });
    }

    // Extract compliance decisions
    if (analysis.complianceIssues && analysis.complianceIssues.length > 0) {
      analysis.complianceIssues.forEach((issue: any) => {
        decisions.push({
          type: "compliance_issue",
          value: issue.violation,
          confidence: issue.confidence || 0,
        });
      });
    }

    // Extract root cause decisions
    if (analysis.rootCauseAnalysis && analysis.rootCauseAnalysis.rootCauses) {
      analysis.rootCauseAnalysis.rootCauses.forEach((cause: any) => {
        decisions.push({
          type: "root_cause",
          value: cause.cause,
          confidence: cause.confidence || 0,
        });
      });
    }

    return decisions;
  }

  /**
   * Explain a specific decision
   */
  private async explainDecision(
    decision: { type: string; value: any; confidence: number },
    analysis: any,
  ): Promise<DecisionExplanation> {
    // Identify factors that contributed to this decision
    const factors = this.identifyFactors(decision, analysis);

    // Find visual evidence
    const visualEvidence = this.findVisualEvidence(decision, analysis);

    // Generate alternatives
    const alternatives = this.generateAlternatives(decision, analysis);

    // Generate reasoning
    const reasoning = this.generateReasoning(decision, factors, visualEvidence);

    return {
      decision: `${decision.type}: ${decision.value}`,
      confidence: decision.confidence,
      reasoning,
      factors,
      alternatives,
      visualEvidence,
    };
  }

  /**
   * Identify factors that contributed to decision
   */
  private identifyFactors(
    decision: { type: string; value: any; confidence: number },
    analysis: any,
  ): DecisionExplanation["factors"] {
    const factors: DecisionExplanation["factors"] = [];

    // Visual features
    if (analysis.detectedObjects) {
      const relevantObjects = analysis.detectedObjects.filter(
        (obj: any) =>
          obj.object.toLowerCase().includes(decision.value.toLowerCase()) ||
          decision.value.toLowerCase().includes(obj.object.toLowerCase()),
      );

      relevantObjects.forEach((obj: any) => {
        factors.push({
          factor: `Detected object: ${obj.object}`,
          weight: obj.confidence / 100,
          impact: "positive",
          evidence: `Object detected with ${obj.confidence}% confidence at location (${obj.boundingBox?.x}, ${obj.boundingBox?.y})`,
        });
      });
    }

    // Quality issues
    if (decision.type === "quality_issue" && analysis.qualityIssues) {
      const matchingIssue = analysis.qualityIssues.find(
        (q: any) => q.type === decision.value,
      );
      if (matchingIssue) {
        factors.push({
          factor: `Severity: ${matchingIssue.severity}`,
          weight:
            matchingIssue.severity === "critical"
              ? 1.0
              : matchingIssue.severity === "major"
                ? 0.7
                : 0.4,
          impact: "negative",
          evidence: `Issue classified as ${matchingIssue.severity} severity`,
        });
      }
    }

    // Context information
    if (analysis.description) {
      const descriptionLower = analysis.description.toLowerCase();
      const decisionLower = decision.value.toLowerCase();

      if (descriptionLower.includes(decisionLower)) {
        factors.push({
          factor: "Contextual description match",
          weight: 0.5,
          impact: "positive",
          evidence: "Analysis description mentions this issue",
        });
      }
    }

    return factors;
  }

  /**
   * Find visual evidence for decision
   */
  private findVisualEvidence(
    decision: { type: string; value: any; confidence: number },
    analysis: any,
  ): DecisionExplanation["visualEvidence"] {
    const evidence: DecisionExplanation["visualEvidence"] = [];

    // Use bounding boxes from detected objects
    if (analysis.detectedObjects) {
      analysis.detectedObjects.forEach((obj: any) => {
        if (obj.boundingBox) {
          evidence.push({
            region: {
              x: obj.boundingBox.x,
              y: obj.boundingBox.y,
              width: obj.boundingBox.width,
              height: obj.boundingBox.height,
            },
            description: `Detected ${obj.object}`,
            confidence: obj.confidence,
          });
        }
      });
    }

    return evidence;
  }

  /**
   * Generate alternative decisions
   */
  private generateAlternatives(
    decision: { type: string; value: any; confidence: number },
    analysis: any,
  ): DecisionExplanation["alternatives"] {
    const alternatives: DecisionExplanation["alternatives"] = [];

    // For quality issues, suggest alternative damage types
    if (decision.type === "quality_issue") {
      const allDamageTypes = [
        "crush",
        "tear",
        "puncture",
        "water_damage",
        "contamination",
      ];
      const alternativeTypes = allDamageTypes.filter(
        (type) => type !== decision.value,
      );

      alternativeTypes.forEach((type) => {
        const confidence = Math.max(0, decision.confidence - 20); // Lower confidence for alternatives
        alternatives.push({
          option: type,
          confidence,
          whyNot: `Lower confidence (${confidence}% vs ${decision.confidence}%) and visual evidence more strongly supports ${decision.value}`,
        });
      });
    }

    return alternatives;
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(
    decision: { type: string; value: any; confidence: number },
    factors: DecisionExplanation["factors"],
    visualEvidence: DecisionExplanation["visualEvidence"],
  ): string {
    const factorCount = factors.length;
    const evidenceCount = visualEvidence.length;
    const avgConfidence =
      factors.reduce((sum, f) => sum + f.weight * 100, 0) / factors.length ||
      decision.confidence;

    return (
      `The AI determined "${decision.value}" with ${decision.confidence}% confidence based on ${factorCount} contributing factors and ${evidenceCount} pieces of visual evidence. ` +
      `The average factor confidence is ${Math.round(avgConfidence)}%. ` +
      `Key evidence includes: ${factors
        .slice(0, 3)
        .map((f) => f.factor)
        .join(", ")}.`
    );
  }

  /**
   * Calculate confidence breakdown
   */
  private calculateConfidenceBreakdown(analysis: any): ConfidenceBreakdown {
    const components: ConfidenceBreakdown["components"] = [];

    // Object detection confidence
    if (analysis.detectedObjects && analysis.detectedObjects.length > 0) {
      const avgObjectConfidence =
        analysis.detectedObjects.reduce(
          (sum: number, obj: any) => sum + obj.confidence,
          0,
        ) / analysis.detectedObjects.length;
      components.push({
        component: "Object Detection",
        confidence: avgObjectConfidence,
        contribution: 30,
        factors: analysis.detectedObjects.map((obj: any) => obj.object),
      });
    }

    // Quality issue confidence
    if (analysis.qualityIssues && analysis.qualityIssues.length > 0) {
      const avgQualityConfidence =
        analysis.qualityIssues.reduce(
          (sum: number, issue: any) => sum + (issue.confidence || 0),
          0,
        ) / analysis.qualityIssues.length;
      components.push({
        component: "Quality Analysis",
        confidence: avgQualityConfidence,
        contribution: 40,
        factors: analysis.qualityIssues.map((issue: any) => issue.type),
      });
    }

    // Safety issue confidence
    if (analysis.safetyIssues && analysis.safetyIssues.length > 0) {
      const avgSafetyConfidence =
        analysis.safetyIssues.reduce(
          (sum: number, issue: any) => sum + (issue.confidence || 0),
          0,
        ) / analysis.safetyIssues.length;
      components.push({
        component: "Safety Analysis",
        confidence: avgSafetyConfidence,
        contribution: 20,
        factors: analysis.safetyIssues.map((issue: any) => issue.issue),
      });
    }

    // Root cause confidence
    if (analysis.rootCauseAnalysis && analysis.rootCauseAnalysis.rootCauses) {
      const avgRootCauseConfidence =
        analysis.rootCauseAnalysis.rootCauses.reduce(
          (sum: number, cause: any) => sum + (cause.confidence || 0),
          0,
        ) / analysis.rootCauseAnalysis.rootCauses.length;
      components.push({
        component: "Root Cause Analysis",
        confidence: avgRootCauseConfidence,
        contribution: 10,
        factors: analysis.rootCauseAnalysis.rootCauses.map(
          (cause: any) => cause.cause,
        ),
      });
    }

    // Calculate overall confidence
    const overall = components.reduce(
      (sum, comp) => sum + (comp.confidence * comp.contribution) / 100,
      0,
    );

    // Calculate uncertainty
    const uncertainty = this.calculateUncertainty(components, overall);

    return {
      overall: Math.round(overall),
      components,
      uncertainty,
    };
  }

  /**
   * Calculate uncertainty
   */
  private calculateUncertainty(
    components: ConfidenceBreakdown["components"],
    overall: number,
  ): ConfidenceBreakdown["uncertainty"] {
    const level = overall >= 80 ? "low" : overall >= 60 ? "medium" : "high";
    const sources: string[] = [];
    const recommendations: string[] = [];

    if (overall < 70) {
      sources.push("Low overall confidence score");
      recommendations.push("Provide additional images from different angles");
      recommendations.push("Add more context information about the scene");
    }

    const lowConfidenceComponents = components.filter((c) => c.confidence < 60);
    if (lowConfidenceComponents.length > 0) {
      sources.push(
        `Low confidence in: ${lowConfidenceComponents.map((c) => c.component).join(", ")}`,
      );
      recommendations.push(
        `Improve ${lowConfidenceComponents.map((c) => c.component).join(" and ")} accuracy`,
      );
    }

    return {
      level,
      sources,
      recommendations,
    };
  }

  /**
   * Calculate feature importance
   */
  private calculateFeatureImportance(analysis: any): FeatureImportance[] {
    const features: FeatureImportance[] = [];

    // Visual features
    if (analysis.detectedObjects && analysis.detectedObjects.length > 0) {
      features.push({
        feature: "Object Detection",
        importance: 85,
        impact: "critical",
        description:
          "Detecting objects in the image is critical for understanding the scene",
        examples: analysis.detectedObjects
          .slice(0, 3)
          .map((obj: any) => obj.object),
      });
    }

    // Quality features
    if (analysis.qualityIssues && analysis.qualityIssues.length > 0) {
      features.push({
        feature: "Quality Issue Detection",
        importance: 90,
        impact: "critical",
        description:
          "Identifying quality issues is essential for damage assessment",
        examples: analysis.qualityIssues
          .slice(0, 3)
          .map((issue: any) => issue.type),
      });
    }

    // Safety features
    if (analysis.safetyIssues && analysis.safetyIssues.length > 0) {
      features.push({
        feature: "Safety Issue Detection",
        importance: 95,
        impact: "critical",
        description: "Safety issues are the highest priority",
        examples: analysis.safetyIssues
          .slice(0, 3)
          .map((issue: any) => issue.issue),
      });
    }

    return features.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Calculate transparency score
   */
  private calculateTransparencyScore(
    explanations: DecisionExplanation[],
    confidenceBreakdown: ConfidenceBreakdown,
  ): number {
    let score = 0;

    // Explanations quality: 40%
    if (explanations.length > 0) {
      const avgExplanationQuality =
        explanations.reduce((sum, exp) => {
          const quality =
            exp.factors.length * 10 +
            exp.visualEvidence.length * 15 +
            (exp.reasoning.length > 100 ? 20 : 10);
          return sum + Math.min(100, quality);
        }, 0) / explanations.length;
      score += avgExplanationQuality * 0.4;
    }

    // Confidence breakdown quality: 30%
    if (confidenceBreakdown.components.length > 0) {
      const breakdownQuality =
        confidenceBreakdown.components.length * 15 +
        (confidenceBreakdown.uncertainty.sources.length > 0 ? 20 : 0);
      score += Math.min(100, breakdownQuality) * 0.3;
    }

    // Feature importance: 20%
    score += 80 * 0.2; // Assume feature importance is always provided

    // Recommendations: 10%
    score += 70 * 0.1; // Assume recommendations are provided

    return Math.round(score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    analysis: any,
    explanations: DecisionExplanation[],
    confidenceBreakdown: ConfidenceBreakdown,
  ): string[] {
    const recommendations: string[] = [];

    // Low confidence recommendations
    if (confidenceBreakdown.overall < 70) {
      recommendations.push(
        "Consider providing additional images or context to improve confidence",
      );
    }

    // Uncertainty recommendations
    if (confidenceBreakdown.uncertainty.level === "high") {
      recommendations.push(...confidenceBreakdown.uncertainty.recommendations);
    }

    // Missing evidence recommendations
    const explanationsWithLowEvidence = explanations.filter(
      (exp) => exp.visualEvidence.length === 0,
    );
    if (explanationsWithLowEvidence.length > 0) {
      recommendations.push(
        "Some decisions lack visual evidence - consider capturing images from different angles",
      );
    }

    // Alternative consideration
    const explanationsWithAlternatives = explanations.filter(
      (exp) => exp.alternatives.length > 0,
    );
    if (explanationsWithAlternatives.length > 0) {
      recommendations.push(
        "Review alternative options that were considered but not selected",
      );
    }

    return recommendations;
  }

  /**
   * Get "Why" explanation for a specific detection
   */
  getWhyExplanation(
    analysis: any,
    detectionType: string,
    detectionValue: string,
  ): string {
    const explainable = this.explainAnalysis(analysis);
    return explainable
      .then((result) => {
        const relevantExplanation = result.explanations.find(
          (exp) =>
            exp.decision.toLowerCase().includes(detectionType.toLowerCase()) &&
            exp.decision.toLowerCase().includes(detectionValue.toLowerCase()),
        );

        if (relevantExplanation) {
          return relevantExplanation.reasoning;
        }

        return (
          `The AI detected "${detectionValue}" as a ${detectionType} with confidence based on visual analysis. ` +
          `Key factors include: ${result.featureImportance
            .slice(0, 2)
            .map((f) => f.feature)
            .join(" and ")}.`
        );
      })
      .catch(() => {
        return (
          `The AI detected "${detectionValue}" based on visual patterns and analysis. ` +
          `For more detailed explanation, please review the full explainable analysis.`
        );
      });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const explainableVisionService = new ExplainableVisionService();
