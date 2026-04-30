/**
 * RFI Intelligence Service
 * Provides intelligent recommendations, risk predictions, and insights
 * Enhanced with LLM-powered contextual recommendations
 */

import { rfiService } from "./RFIService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { callAI } from "@/utils/aiClient";
import type { RFI, RFIAnalysis } from "./RFIService";

export interface IntelligenceRecommendation {
  type: "field" | "section" | "action" | "warning";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  field?: string;
  suggestedValue?: any;
  impact: string;
  confidence: number;
}

export interface RiskPrediction {
  category: "pricing" | "completeness" | "timeline" | "compliance";
  level: "low" | "medium" | "high" | "critical";
  probability: number;
  description: string;
  mitigation: string[];
}

export interface IntelligenceInsights {
  recommendations: IntelligenceRecommendation[];
  riskPredictions: RiskPrediction[];
  estimatedValue: number;
  successProbability: number;
  similarRFIs: Array<{
    rfiId: string;
    similarity: number;
    outcome: string;
  }>;
  optimizationSuggestions: string[];
}

class RFIIntelligenceService {
  private static instance: RFIIntelligenceService;

  static getInstance(): RFIIntelligenceService {
    if (!RFIIntelligenceService.instance) {
      RFIIntelligenceService.instance = new RFIIntelligenceService();
    }
    return RFIIntelligenceService.instance;
  }

  async getIntelligence(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<IntelligenceInsights> {
    // Generate both rule-based and LLM-powered recommendations
    const [ruleBasedRecommendations, llmRecommendations] =
      await Promise.allSettled([
        this.generateRecommendations(rfi, analysis),
        this.generateLLMRecommendations(rfi, analysis),
      ]);

    // Combine recommendations (LLM takes priority, fallback to rules)
    const recommendations =
      llmRecommendations.status === "fulfilled" &&
      llmRecommendations.value.length > 0
        ? llmRecommendations.value
        : ruleBasedRecommendations.status === "fulfilled"
          ? ruleBasedRecommendations.value
          : [];

    const riskPredictions = await this.predictRisks(rfi, analysis);
    const estimatedValue = this.estimateValue(rfi);
    const successProbability = await this.predictSuccess(rfi, analysis);
    const similarRFIs = await this.findSimilarRFIs(rfi);
    const optimizationSuggestions = await this.generateOptimizationSuggestions(
      rfi,
      analysis,
    );

    return {
      recommendations,
      riskPredictions,
      estimatedValue,
      successProbability,
      similarRFIs,
      optimizationSuggestions,
    };
  }

  /**
   * Generate LLM-powered intelligent recommendations
   */
  private async generateLLMRecommendations(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<IntelligenceRecommendation[]> {
    try {
      const systemPrompt = `You are an expert RFI (Request for Information) advisor for logistics and warehousing services.
Your role is to analyze RFI data and provide intelligent, contextual recommendations to help users create complete, accurate RFIs that enable confident pricing.

Focus on:
- Identifying missing critical information that affects pricing accuracy
- Suggesting field values based on industry best practices
- Providing contextual explanations for why fields matter
- Recommending actions to improve pricing readiness
- Warning about potential risks or issues

Be specific, actionable, and prioritize recommendations by impact on pricing confidence.`;

      const userPrompt = `Analyze this RFI and provide intelligent recommendations:

RFI Data:
- Company: ${rfi.companyName || "Not provided"}
- Contact: ${rfi.contactPerson || "Not provided"}
- Storage: ${rfi.storage?.storageSqm ? `${rfi.storage.storageSqm} sqm` : "Not provided"} / ${rfi.storage?.storageCbm ? `${rfi.storage.storageCbm} CBM` : "Not provided"} / ${rfi.storage?.palletPositions ? `${rfi.storage.palletPositions} pallets` : "Not provided"}
- Daily Inbound: ${rfi.inbound?.inboundPalletsDaily || "Not provided"} pallets
- Daily Outbound: ${rfi.outbound?.outboundPalletsDaily || "Not provided"} pallets
- Daily Orders: ${rfi.outbound?.ordersDaily || "Not provided"}
- Outbound Type: ${rfi.outbound?.outboundType || "Not provided"}
- VAS Required: ${rfi.vas?.vasRequired || "Not specified"}
- WMS: ${rfi.systems?.wms || "Not specified"}

Current Analysis:
- Data Completeness: ${analysis.completeness}%
- Pricing Readiness: ${analysis.readiness}%
- Pricing Confidence: ${analysis.confidence}
- Readiness Badge: ${analysis.badge}
- Assumptions: ${analysis.assumptions.length} assumptions identified
- Key Drivers: ${JSON.stringify(analysis.keyDrivers)}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "type": "field|section|action|warning",
      "priority": "high|medium|low",
      "title": "Short, actionable title",
      "description": "Detailed explanation of why this matters and what to do",
      "field": "field.path.if.applicable",
      "suggestedValue": "suggested value if applicable",
      "impact": "Specific impact on pricing readiness/confidence (e.g., 'Will increase pricing readiness by 20%')",
      "confidence": 0.0-1.0
    }
  ]
}

Prioritize:
1. Missing critical fields that block pricing (storage size, volumes, orders)
2. Fields that significantly improve pricing accuracy
3. Industry best practices and optimizations
4. Risk mitigation recommendations

Return ONLY valid JSON, no markdown or extra text.`;

      const aiResponse = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.3, // Lower temperature for more consistent, factual recommendations
          maxTokens: 2000,
          provider: "auto",
        },
      );

      // Parse AI response
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return parsed.recommendations.map((rec: any) => ({
            type: rec.type || "field",
            priority: rec.priority || "medium",
            title: rec.title || "Recommendation",
            description: rec.description || "",
            field: rec.field,
            suggestedValue: rec.suggestedValue,
            impact: rec.impact || "Will improve RFI quality",
            confidence:
              typeof rec.confidence === "number" ? rec.confidence : 0.8,
          }));
        }
      }

      // Fallback if parsing fails
      return [];
    } catch (error) {
      console.error(
        "[RFI Intelligence] LLM recommendation generation failed:",
        error,
      );
      // Silently fallback to rule-based recommendations
      return [];
    }
  }

  private async generateRecommendations(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<IntelligenceRecommendation[]> {
    const recommendations: IntelligenceRecommendation[] = [];

    // High priority: Missing critical fields
    if (
      !rfi.storage?.storageSqm &&
      !rfi.storage?.storageCbm &&
      !rfi.storage?.palletPositions
    ) {
      recommendations.push({
        type: "field",
        priority: "high",
        title: "Add Storage Size",
        description:
          "Storage size is critical for accurate pricing. Provide at least one: sqm, cbm, or pallet positions.",
        field: "storage.storageSqm",
        impact: "Will increase pricing readiness by ~25%",
        confidence: 0.95,
      });
    }

    if (
      !rfi.inbound?.inboundPalletsDaily &&
      !rfi.outbound?.outboundPalletsDaily
    ) {
      recommendations.push({
        type: "field",
        priority: "high",
        title: "Add Daily Volumes",
        description:
          "Daily inbound/outbound volumes are essential for labor and equipment planning.",
        field: "inbound.inboundPalletsDaily",
        impact: "Will increase pricing readiness by ~25%",
        confidence: 0.9,
      });
    }

    if (!rfi.outbound?.ordersDaily) {
      recommendations.push({
        type: "field",
        priority: "high",
        title: "Add Order Volume",
        description: "Order volume drives pick strategy and WMS complexity.",
        field: "outbound.ordersDaily",
        impact: "Will increase pricing readiness by ~15%",
        confidence: 0.85,
      });
    }

    // Medium priority: Missing important fields
    if (!rfi.inbound?.inboundPackaging) {
      recommendations.push({
        type: "field",
        priority: "medium",
        title: "Specify Inbound Packaging",
        description:
          "Packaging type significantly affects receiving labor costs.",
        field: "inbound.inboundPackaging",
        impact: "Will improve pricing accuracy",
        confidence: 0.8,
      });
    }

    if (!rfi.outbound?.outboundType) {
      recommendations.push({
        type: "field",
        priority: "medium",
        title: "Specify Outbound Type",
        description:
          "Outbound pick profile (pallet/case/piece) drives labor costs.",
        field: "outbound.outboundType",
        impact: "Will improve pricing accuracy",
        confidence: 0.8,
      });
    }

    // Action recommendations
    if (analysis.readiness >= 82 && !rfi.autoGenerateProposal) {
      recommendations.push({
        type: "action",
        priority: "high",
        title: "Enable Auto-Proposal Generation",
        description:
          "Your RFI has high readiness. Enable auto-proposal to speed up the process.",
        impact: "Will automatically generate proposal upon submission",
        confidence: 0.9,
      });
    }

    if (
      analysis.readiness >= 60 &&
      analysis.readiness < 82 &&
      !rfi.autoGenerateRFQ
    ) {
      recommendations.push({
        type: "action",
        priority: "medium",
        title: "Enable Auto-RFQ Generation",
        description:
          "Your RFI has medium readiness. Enable auto-RFQ to start the process.",
        impact: "Will automatically generate RFQ upon submission",
        confidence: 0.85,
      });
    }

    // Warning recommendations
    if (analysis.assumptions.length > 5) {
      recommendations.push({
        type: "warning",
        priority: "high",
        title: "High Number of Assumptions",
        description: `You have ${analysis.assumptions.length} assumptions. Consider filling more fields to reduce pricing risk.`,
        impact: "May lead to inaccurate pricing or scope creep",
        confidence: 0.95,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async predictRisks(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<RiskPrediction[]> {
    const risks: RiskPrediction[] = [];

    // Pricing risk
    if (analysis.readiness < 60) {
      risks.push({
        category: "pricing",
        level: "high",
        probability: 0.85,
        description: "Low pricing readiness may result in inaccurate quotes",
        mitigation: [
          "Fill critical fields (storage size, daily volumes, orders)",
          "Provide packaging and outbound type information",
          "Review assumptions list",
        ],
      });
    } else if (analysis.readiness < 82) {
      risks.push({
        category: "pricing",
        level: "medium",
        probability: 0.6,
        description: "Medium pricing readiness may require assumptions",
        mitigation: [
          "Complete remaining fields",
          "Review and validate assumptions",
        ],
      });
    }

    // Completeness risk
    if (analysis.completeness < 50) {
      risks.push({
        category: "completeness",
        level: "high",
        probability: 0.8,
        description: "Low data completeness increases scope creep risk",
        mitigation: [
          "Complete all critical sections",
          "Provide detailed requirements",
        ],
      });
    }

    // Timeline risk
    const estimatedValue = this.estimateValue(rfi);
    if (estimatedValue > 5000000) {
      risks.push({
        category: "timeline",
        level: "medium",
        probability: 0.65,
        description: "High-value RFI may require extended review process",
        mitigation: [
          "Enable auto-processing if readiness is high",
          "Prepare for multi-level approvals",
        ],
      });
    }

    return risks;
  }

  private estimateValue(rfi: RFI): number {
    const sqm = Number(rfi.storage?.storageSqm) || 0;
    const pallets = Number(rfi.storage?.palletPositions) || 0;
    const inbound = Number(rfi.inbound?.inboundPalletsDaily) || 0;
    const outbound = Number(rfi.outbound?.outboundPalletsDaily) || 0;

    // Rough estimation
    const storageValue = sqm * 100 * 12; // 100 SAR per sqm per month
    const handlingValue = (inbound + outbound) * 30 * 12 * 50; // 50 SAR per pallet
    const palletValue = pallets * 20 * 12; // 20 SAR per pallet position

    return storageValue + handlingValue + palletValue;
  }

  private async predictSuccess(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<number> {
    let successProbability = 0.5; // Base probability

    // Readiness factor
    successProbability += (analysis.readiness / 100) * 0.3;

    // Completeness factor
    successProbability += (analysis.completeness / 100) * 0.2;

    // Historical pattern factor
    const similarRFIs = await this.findSimilarRFIs(rfi);
    if (similarRFIs.length > 0) {
      const avgOutcome =
        similarRFIs.reduce((sum, s) => {
          if (s.outcome === "won" || s.outcome === "accepted") return sum + 1;
          return sum;
        }, 0) / similarRFIs.length;
      successProbability += avgOutcome * 0.3;
    }

    // Confidence factor
    if (analysis.confidence === "High") successProbability += 0.1;
    else if (analysis.confidence === "Medium") successProbability += 0.05;

    return Math.min(1.0, Math.max(0.0, successProbability));
  }

  private async findSimilarRFIs(
    rfi: RFI,
  ): Promise<Array<{ rfiId: string; similarity: number; outcome: string }>> {
    try {
      const searchQuery = JSON.stringify({
        companyName: rfi.companyName,
        storage: {
          storageSqm: rfi.storage?.storageSqm,
          palletPositions: rfi.storage?.palletPositions,
        },
        inbound: {
          inboundPalletsDaily: rfi.inbound?.inboundPalletsDaily,
        },
      });

      const results = await knowledgeBaseService.search({
        query: searchQuery,
        category: "rfi",
        limit: 5,
      });

      return results.map((doc) => ({
        rfiId: doc.metadata?.rfiId || "",
        similarity: doc.score || 0,
        outcome: doc.metadata?.outcome || "unknown",
      }));
    } catch (error) {
      console.error("Error finding similar RFIs:", error);
      return [];
    }
  }

  private async generateOptimizationSuggestions(
    rfi: RFI,
    analysis: RFIAnalysis,
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Storage optimization
    if (rfi.storage?.storageSqm && rfi.storage?.palletPositions) {
      const ratio =
        Number(rfi.storage.palletPositions) /
        (Number(rfi.storage.storageSqm) / 1.2);
      if (ratio < 0.8) {
        suggestions.push(
          "Consider optimizing storage layout - pallet positions seem low for the space",
        );
      }
    }

    // Handling optimization
    const inbound = Number(rfi.inbound?.inboundPalletsDaily) || 0;
    const outbound = Number(rfi.outbound?.outboundPalletsDaily) || 0;
    const positions = Number(rfi.storage?.palletPositions) || 0;
    if (positions > 0) {
      const turnoverRatio = (inbound + outbound) / positions;
      if (turnoverRatio > 0.3) {
        suggestions.push(
          "High turnover ratio detected - consider dedicated receiving/picking areas",
        );
      } else if (turnoverRatio < 0.05) {
        suggestions.push(
          "Low turnover ratio - consider long-term storage optimization",
        );
      }
    }

    // VAS optimization
    if (rfi.vas?.vasRequired === "Yes" && !rfi.vas?.vasVolumes) {
      suggestions.push(
        "Specify VAS volumes to get accurate pricing for value-added services",
      );
    }

    // System integration
    if (!rfi.systems?.wms) {
      suggestions.push(
        "Consider specifying WMS requirements - affects integration complexity and pricing",
      );
    }

    return suggestions;
  }
}

export const rfiIntelligenceService = RFIIntelligenceService.getInstance();
