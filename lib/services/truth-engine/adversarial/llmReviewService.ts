/**
 * LLM-Based Adversarial Review Service
 * Enhances adversarial review with AI/LLM capabilities
 */

import {
  DecisionObject,
  ReviewContext,
  PersonaReview,
  AdversarialReview,
} from "@/types/truth-engine";
import crypto from "crypto";

export interface LLMReviewConfig {
  enabled: boolean;
  provider: "openai" | "anthropic" | "custom";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

const defaultConfig: LLMReviewConfig = {
  enabled: false, // Disabled by default, enable when API keys are configured
  provider: "openai",
  model: "gpt-4",
  temperature: 0.3, // Lower temperature for more deterministic, audit-ready outputs
  maxTokens: 2000,
};

/**
 * Generate persona review using LLM
 */
export async function generatePersonaReviewWithLLM(
  persona: "regulator" | "cfo" | "competitor" | "litigator",
  decision: DecisionObject,
  context: ReviewContext,
  config: Partial<LLMReviewConfig> = {},
): Promise<PersonaReview> {
  const mergedConfig = { ...defaultConfig, ...config };

  if (!mergedConfig.enabled || !mergedConfig.apiKey) {
    // Fallback to rules-based review
    return generatePersonaReviewRulesBased(persona, decision, context);
  }

  try {
    const prompt = generatePersonaPrompt(persona, decision, context);
    const promptHash = generatePromptHash(prompt);

    // Call LLM (placeholder - would integrate with actual LLM provider)
    const response = await callLLM(prompt, mergedConfig);

    // Parse LLM response
    const review = parseLLMResponse(response, persona);

    // Add audit metadata
    review.evidenceRefs = context.relatedEvidence;
    review.reasoning = `LLM-generated review (${mergedConfig.provider}:${mergedConfig.model})`;

    return {
      ...review,
      // Store prompt hash for audit determinism
      // This would be added to the review metadata
    };
  } catch (error) {
    console.error(
      `LLM review failed for ${persona}, falling back to rules-based:`,
      error,
    );
    return generatePersonaReviewRulesBased(persona, decision, context);
  }
}

/**
 * Generate persona-specific prompt
 */
function generatePersonaPrompt(
  persona: "regulator" | "cfo" | "competitor" | "litigator",
  decision: DecisionObject,
  context: ReviewContext,
): string {
  const basePrompt = `You are a ${persona} reviewing a business decision. Analyze the decision from your perspective and identify risks, missing evidence, required controls, and recommended actions.

Decision Type: ${decision.type}
Decision ID: ${decision.id}
Decision Data: ${JSON.stringify(decision.data, null, 2)}

Related Evidence IDs: ${context.relatedEvidence.join(", ")}

Provide your analysis in the following JSON format:
{
  "risks": [
    {
      "description": "Risk description",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "likelihood": 0.0-1.0,
      "impact": "Impact description"
    }
  ],
  "missingEvidence": ["evidence_type_1", "evidence_type_2"],
  "requiredControls": [
    {
      "description": "Control description",
      "type": "preventive|detective|corrective",
      "required": true
    }
  ],
  "recommendedActions": [
    {
      "description": "Action description",
      "priority": "LOW|MEDIUM|HIGH|CRITICAL"
    }
  ],
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 0.0-1.0,
  "reasoning": "Your reasoning"
}`;

  // Add persona-specific context
  switch (persona) {
    case "regulator":
      return `${basePrompt}

As a REGULATOR, focus on:
- Regulatory compliance and documentation requirements
- Missing regulatory approvals or licenses
- Potential violations of regulations
- Required controls for regulatory adherence
- Evidence needed for regulatory audits`;
    case "cfo":
      return `${basePrompt}

As a CFO, focus on:
- Financial impact and cash flow implications
- Margin protection and revenue risks
- Cost-benefit analysis
- Financial controls and approvals required
- Evidence needed for financial audits`;
    case "competitor":
      return `${basePrompt}

As a COMPETITOR, focus on:
- Competitive positioning and market risks
- Strategic information leakage
- Competitive intelligence concerns
- Market share implications
- Evidence that might reveal strategy`;
    case "litigator":
      return `${basePrompt}

As a LITIGATOR, focus on:
- Legal exposure and liability risks
- Contract compliance and breach risks
- Evidence needed for legal defense
- Required legal controls and approvals
- Documentation for potential litigation`;
    default:
      return basePrompt;
  }
}

/**
 * Call LLM provider
 */
async function callLLM(
  prompt: string,
  config: LLMReviewConfig,
): Promise<string> {
  // Placeholder - would integrate with actual LLM provider
  // This would use OpenAI, Anthropic, or custom provider based on config

  if (config.provider === "openai") {
    // Would use OpenAI API
    // const response = await openai.chat.completions.create({...})
    throw new Error("OpenAI integration not yet implemented");
  } else if (config.provider === "anthropic") {
    // Would use Anthropic API
    // const response = await anthropic.messages.create({...})
    throw new Error("Anthropic integration not yet implemented");
  }

  throw new Error(`LLM provider ${config.provider} not supported`);
}

/**
 * Parse LLM response
 */
function parseLLMResponse(response: string, persona: string): PersonaReview {
  try {
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch =
      response.match(/```json\s*([\s\S]*?)\s*```/) ||
      response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
    const parsed = JSON.parse(jsonStr);

    return {
      persona: persona as any,
      risks: parsed.risks || [],
      missingEvidence: parsed.missingEvidence || [],
      requiredControls: parsed.requiredControls || [],
      recommendedActions: parsed.recommendedActions || [],
      severity: parsed.severity || "LOW",
      confidence: parsed.confidence || 0.7,
      reasoning: parsed.reasoning,
      evidenceRefs: [],
    };
  } catch (error) {
    console.error("Failed to parse LLM response:", error);
    // Fallback to empty review
    return {
      persona: persona as any,
      risks: [],
      missingEvidence: [],
      requiredControls: [],
      recommendedActions: [],
      severity: "LOW",
      confidence: 0.5,
      evidenceRefs: [],
    };
  }
}

/**
 * Generate prompt hash for audit determinism
 */
function generatePromptHash(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex");
}

/**
 * Fallback rules-based review (used when LLM is disabled or fails)
 */
function generatePersonaReviewRulesBased(
  persona: "regulator" | "cfo" | "competitor" | "litigator",
  decision: DecisionObject,
  context: ReviewContext,
): PersonaReview {
  // This would call the existing rules-based review logic
  // For now, return a basic review
  return {
    persona,
    risks: [],
    missingEvidence: [],
    requiredControls: [],
    recommendedActions: [],
    severity: "LOW",
    confidence: 0.7,
    evidenceRefs: context.relatedEvidence,
    reasoning: "Rules-based review (LLM not available)",
  };
}

/**
 * Check if LLM is available and configured
 */
export function isLLMAvailable(config: Partial<LLMReviewConfig> = {}): boolean {
  const mergedConfig = { ...defaultConfig, ...config };
  return mergedConfig.enabled && !!mergedConfig.apiKey;
}
