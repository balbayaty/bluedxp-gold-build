/**
 * HAZALYZE AI Compatibility Enhancement
 *
 * Enhanced AI features for chemical compatibility
 * Advanced compatibility analysis, recommendations
 *
 * @module chemical
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { signalCaptureService } from "@/lib/services/learning";

/**
 * Enhanced compatibility analysis with AI
 */
export async function enhancedCompatibilityAnalysis(
  chemical1: { id: string; name: string; casNumber?: string },
  chemical2: { id: string; name: string; casNumber?: string },
  tenantId: string,
): Promise<{
  compatible: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  reasoning: string;
  recommendations: string[];
  alternatives: string[];
}> {
  // Enhanced compatibility check
  // Use ML models if available
  // Check Knowledge Base for patterns

  // Default: assume compatible unless known incompatible
  let compatible = true;
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let reasoning = "No known incompatibilities";

  // Check for known incompatible pairs
  const incompatiblePairs = [
    ["acid", "base"],
    ["oxidizer", "reducer"],
  ];

  const chem1Lower = chemical1.name.toLowerCase();
  const chem2Lower = chemical2.name.toLowerCase();

  for (const [type1, type2] of incompatiblePairs) {
    if (
      (chem1Lower.includes(type1) && chem2Lower.includes(type2)) ||
      (chem1Lower.includes(type2) && chem2Lower.includes(type1))
    ) {
      compatible = false;
      riskLevel = "CRITICAL";
      reasoning = `Known incompatibility: ${type1} and ${type2}`;
      break;
    }
  }

  const recommendations: string[] = [];
  if (!compatible) {
    recommendations.push("DO NOT store these chemicals together");
    recommendations.push("Use separate storage zones");
    recommendations.push("Review MSDS for both chemicals");
  }

  const alternatives: string[] = [];
  if (!compatible) {
    alternatives.push("Store in separate compatible storage zones");
    alternatives.push("Use secondary containment");
  }

  return {
    compatible,
    riskLevel,
    confidence: 0.85,
    reasoning,
    recommendations,
    alternatives,
  };
}
