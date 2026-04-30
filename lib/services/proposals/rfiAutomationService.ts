/**
 * RFI Intelligent Automation Service
 * Enhanced automation with ML predictions, pattern recognition, and risk-based rules
 */

import { rfiService } from "./RFIService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { RFI, RFIAnalysis } from "./RFIService";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority: number;
  enabled: boolean;
  confidenceThreshold: number;
}

export interface AutomationCondition {
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains" | "in_range";
  value: any;
}

export interface AutomationAction {
  type: "generate_rfq" | "generate_proposal" | "notify" | "escalate" | "flag";
  params?: Record<string, any>;
}

export interface AutomationDecision {
  ruleId: string;
  ruleName: string;
  confidence: number;
  actions: AutomationAction[];
  reasoning: string[];
}

class RFIAutomationService {
  private static instance: RFIAutomationService;
  private rules: AutomationRule[] = [];

  static getInstance(): RFIAutomationService {
    if (!RFIAutomationService.instance) {
      RFIAutomationService.instance = new RFIAutomationService();
      RFIAutomationService.instance.initializeDefaultRules();
    }
    return RFIAutomationService.instance;
  }

  private initializeDefaultRules(): void {
    // Rule 1: High Readiness Auto-Proposal
    this.rules.push({
      id: "rule-1",
      name: "High Readiness Auto-Proposal",
      description:
        "Automatically generate proposal for RFIs with readiness ≥ 82%",
      conditions: [
        { field: "pricingReadiness", operator: "greater_than", value: 82 },
        { field: "dataCompleteness", operator: "greater_than", value: 80 },
      ],
      actions: [
        { type: "generate_proposal", params: { useRAG: true } },
        { type: "notify", params: { recipients: ["sales-team"] } },
      ],
      priority: 1,
      enabled: true,
      confidenceThreshold: 0.85,
    });

    // Rule 2: Medium Readiness Auto-RFQ
    this.rules.push({
      id: "rule-2",
      name: "Medium Readiness Auto-RFQ",
      description: "Generate RFQ for RFIs with readiness ≥ 60% but < 82%",
      conditions: [
        { field: "pricingReadiness", operator: "greater_than", value: 60 },
        { field: "pricingReadiness", operator: "less_than", value: 82 },
      ],
      actions: [
        { type: "generate_rfq" },
        { type: "notify", params: { recipients: ["procurement-team"] } },
      ],
      priority: 2,
      enabled: true,
      confidenceThreshold: 0.7,
    });

    // Rule 3: Pattern-Based Prediction
    this.rules.push({
      id: "rule-3",
      name: "Pattern-Based Prediction",
      description:
        "Use historical patterns to predict success and auto-process",
      conditions: [
        { field: "patternMatch", operator: "greater_than", value: 0.8 },
      ],
      actions: [{ type: "generate_proposal", params: { usePatterns: true } }],
      priority: 1,
      enabled: true,
      confidenceThreshold: 0.8,
    });

    // Rule 4: Risk-Based Escalation
    this.rules.push({
      id: "rule-4",
      name: "Risk-Based Escalation",
      description: "Flag high-value or high-risk RFIs for manual review",
      conditions: [
        { field: "estimatedValue", operator: "greater_than", value: 1000000 },
        { field: "riskScore", operator: "greater_than", value: 0.7 },
      ],
      actions: [
        { type: "escalate", params: { level: "senior-management" } },
        { type: "flag", params: { reason: "high-value-high-risk" } },
      ],
      priority: 0,
      enabled: true,
      confidenceThreshold: 0.9,
    });
  }

  async evaluateAutomation(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<AutomationDecision[]> {
    const decisions: AutomationDecision[] = [];

    for (const rule of this.rules.filter((r) => r.enabled)) {
      const match = await this.evaluateRule(rule, rfi, analysis);
      if (match.matches && match.confidence >= rule.confidenceThreshold) {
        decisions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          confidence: match.confidence,
          actions: rule.actions,
          reasoning: match.reasoning,
        });
      }
    }

    // Sort by priority and confidence
    return decisions.sort((a, b) => {
      const ruleA = this.rules.find((r) => r.id === a.ruleId)!;
      const ruleB = this.rules.find((r) => r.id === b.ruleId)!;
      if (ruleA.priority !== ruleB.priority) {
        return ruleA.priority - ruleB.priority;
      }
      return b.confidence - a.confidence;
    });
  }

  private async evaluateRule(
    rule: AutomationRule,
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<{ matches: boolean; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    let matches = true;
    let confidence = 1.0;

    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(rfi, analysis, condition.field);
      const conditionResult = this.evaluateCondition(condition, fieldValue);

      if (!conditionResult.matches) {
        matches = false;
        break;
      }

      confidence *= conditionResult.confidence;
      reasoning.push(conditionResult.reasoning);
    }

    // Pattern matching for rule-3
    if (rule.id === "rule-3") {
      const patternMatch = await this.findPatternMatch(rfi);
      if (patternMatch.score > 0.8) {
        confidence = patternMatch.score;
        reasoning.push(`Pattern match found: ${patternMatch.reasoning}`);
      } else {
        matches = false;
      }
    }

    // Risk calculation for rule-4
    if (rule.id === "rule-4") {
      const riskScore = await this.calculateRiskScore(rfi, analysis);
      if (riskScore > 0.7) {
        reasoning.push(
          `High risk score detected: ${(riskScore * 100).toFixed(0)}%`,
        );
      }
    }

    return { matches, confidence, reasoning };
  }

  private getFieldValue(rfi: RFI, analysis: RFIAnalysis, field: string): any {
    switch (field) {
      case "pricingReadiness":
        return analysis.readiness;
      case "dataCompleteness":
        return analysis.completeness;
      case "pricingConfidence":
        return analysis.confidence;
      case "estimatedValue":
        return this.estimateValue(rfi);
      case "riskScore":
        return this.calculateRiskScore(rfi, analysis);
      default:
        return (rfi as any)[field] || (analysis as any)[field];
    }
  }

  private evaluateCondition(
    condition: AutomationCondition,
    value: any,
  ): { matches: boolean; confidence: number; reasoning: string } {
    let matches = false;
    let confidence = 1.0;
    let reasoning = "";

    switch (condition.operator) {
      case "equals":
        matches = value === condition.value;
        reasoning = `${condition.field} ${matches ? "equals" : "does not equal"} ${condition.value}`;
        break;
      case "greater_than":
        matches = Number(value) > Number(condition.value);
        confidence = matches
          ? Math.min(1.0, Number(value) / Number(condition.value))
          : 0;
        reasoning = `${condition.field} is ${matches ? "above" : "below"} threshold of ${condition.value}`;
        break;
      case "less_than":
        matches = Number(value) < Number(condition.value);
        confidence = matches
          ? Math.min(1.0, Number(condition.value) / Number(value))
          : 0;
        reasoning = `${condition.field} is ${matches ? "below" : "above"} threshold of ${condition.value}`;
        break;
      case "contains":
        matches = String(value)
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());
        reasoning = `${condition.field} ${matches ? "contains" : "does not contain"} ${condition.value}`;
        break;
      case "in_range":
        const [min, max] = condition.value;
        matches = Number(value) >= min && Number(value) <= max;
        reasoning = `${condition.field} is ${matches ? "within" : "outside"} range [${min}, ${max}]`;
        break;
    }

    return { matches, confidence, reasoning };
  }

  private async findPatternMatch(
    rfi: RFI,
  ): Promise<{ score: number; reasoning: string }> {
    // Search Knowledge Base for similar RFIs
    try {
      const similarRFIs = await knowledgeBaseService.search({
        query: JSON.stringify({
          companyName: rfi.companyName,
          storage: rfi.storage,
          inbound: rfi.inbound,
        }),
        limit: 5,
      });

      if (similarRFIs.length > 0) {
        // Calculate similarity score
        const avgScore =
          similarRFIs.reduce((sum, doc) => sum + (doc.score || 0), 0) /
          similarRFIs.length;
        return {
          score: avgScore,
          reasoning: `Found ${similarRFIs.length} similar RFIs with average similarity of ${(avgScore * 100).toFixed(0)}%`,
        };
      }
    } catch (error) {
      console.error("Error finding pattern match:", error);
    }

    return { score: 0, reasoning: "No similar patterns found" };
  }

  private async calculateRiskScore(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<number> {
    let riskScore = 0;

    // Low completeness increases risk
    if (analysis.completeness < 60) {
      riskScore += 0.3;
    }

    // Low readiness increases risk
    if (analysis.readiness < 60) {
      riskScore += 0.3;
    }

    // High value increases risk
    const estimatedValue = this.estimateValue(rfi);
    if (estimatedValue > 1000000) {
      riskScore += 0.2;
    }

    // Many assumptions increase risk
    if (analysis.assumptions.length > 5) {
      riskScore += 0.2;
    }

    return Math.min(1.0, riskScore);
  }

  private estimateValue(rfi: RFI): number {
    // Simple estimation based on storage and volumes
    const sqm = rfi.storage?.storageSqm || 0;
    const pallets = rfi.storage?.palletPositions || 0;
    const inbound = rfi.inbound?.inboundPalletsDaily || 0;
    const outbound = rfi.outbound?.outboundPalletsDaily || 0;

    // Rough estimation: 100 SAR per sqm per month + handling costs
    const storageValue = sqm * 100 * 12;
    const handlingValue = (inbound + outbound) * 30 * 12 * 50; // 50 SAR per pallet handling
    const palletValue = pallets * 20 * 12; // 20 SAR per pallet position per month

    return storageValue + handlingValue + palletValue;
  }

  async addRule(rule: Omit<AutomationRule, "id">): Promise<AutomationRule> {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    this.rules.push(newRule);
    return newRule;
  }

  async getRules(): Promise<AutomationRule[]> {
    return [...this.rules];
  }

  async updateRule(
    ruleId: string,
    updates: Partial<AutomationRule>,
  ): Promise<AutomationRule | null> {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index === -1) return null;

    this.rules[index] = { ...this.rules[index], ...updates };
    return this.rules[index];
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index === -1) return false;

    this.rules.splice(index, 1);
    return true;
  }
}

export const rfiAutomationService = RFIAutomationService.getInstance();
