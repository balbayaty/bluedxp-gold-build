/**
 * Intelligent Chemical Service
 * AI-powered insights, recommendations, and predictive analytics
 */

import { Chemical } from "@/types/chemical";
import { callAI, isAIAvailable } from "@/utils/aiClient";
import { openDataService } from "../open-data/openDataService";

export interface ChemicalInsight {
  id: string;
  type:
    | "risk"
    | "optimization"
    | "compliance"
    | "safety"
    | "cost"
    | "sustainability";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendations: string[];
  confidence: number;
  actionable: boolean;
  impact?: {
    estimatedSavings?: number;
    riskReduction?: number;
    complianceImprovement?: number;
  };
}

export interface ChemicalRecommendation {
  id: string;
  type:
    | "substitution"
    | "storage"
    | "handling"
    | "disposal"
    | "compliance"
    | "cost";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  chemicalId: string;
  alternativeChemicalId?: string;
  reasoning: string;
  benefits: string[];
  risks?: string[];
  implementationSteps: string[];
  estimatedCost?: number;
  estimatedSavings?: number;
  confidence: number;
}

export interface ChemicalPrediction {
  id: string;
  type:
    | "expiry"
    | "stockout"
    | "compliance_risk"
    | "incident_risk"
    | "cost_trend";
  chemicalId: string;
  prediction: string;
  likelihood: number; // 0-100
  timeframe: string;
  confidence: number;
  factors: string[];
  mitigation?: string[];
}

export class IntelligentChemicalService {
  /**
   * Generate AI-powered insights for a chemical
   */
  async generateInsights(chemical: Chemical): Promise<ChemicalInsight[]> {
    try {
      // Get open data for chemical
      const openData = chemical.casNumber
        ? await openDataService.getChemicalProperties(chemical.casNumber)
        : null;

      // Build AI prompt
      const systemPrompt = `You are an expert chemical safety and compliance advisor. Analyze chemical data and provide intelligent insights.`;

      const userPrompt = `Analyze this chemical and provide insights:

Chemical: ${chemical.name}
CAS: ${chemical.casNumber || "N/A"}
Hazard Level: ${chemical.hazards.nfpa?.health || "N/A"}
Compliance: ${chemical.compliance.ghsCompliant ? "Compliant" : "Non-compliant"}
${openData ? `Open Data Properties: ${JSON.stringify(openData.properties)}` : ""}

Provide insights in JSON format:
{
  "insights": [
    {
      "type": "risk|optimization|compliance|safety|cost|sustainability",
      "severity": "low|medium|high|critical",
      "title": "Short title",
      "description": "Detailed description",
      "recommendations": ["rec1", "rec2"],
      "confidence": 0-100,
      "actionable": true/false,
      "impact": {
        "estimatedSavings": number (optional),
        "riskReduction": number (optional),
        "complianceImprovement": number (optional)
      }
    }
  ]
}`;

      const aiResponse = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 2000,
        },
      );

      // Parse AI response
      let insights: ChemicalInsight[] = [];
      try {
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.insights && Array.isArray(parsed.insights)) {
            insights = parsed.insights.map((insight: any, idx: number) => ({
              id: `insight-${chemical.id}-${Date.now()}-${idx}`,
              type: insight.type || "safety",
              severity: insight.severity || "medium",
              title: insight.title || "Insight",
              description: insight.description || "",
              recommendations: Array.isArray(insight.recommendations)
                ? insight.recommendations
                : [],
              confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
              actionable: insight.actionable !== false,
              impact: insight.impact,
            }));
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI insights:", parseError);
      }

      // Add rule-based insights
      insights.push(...this.generateRuleBasedInsights(chemical, openData));

      return insights.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  }

  /**
   * Generate intelligent recommendations
   */
  async generateRecommendations(
    chemical: Chemical,
  ): Promise<ChemicalRecommendation[]> {
    try {
      const recommendations: ChemicalRecommendation[] = [];

      // Substitution recommendations
      if (
        chemical.hazards.nfpa?.health &&
        parseInt(chemical.hazards.nfpa.health) >= 3
      ) {
        recommendations.push({
          id: `rec-${chemical.id}-substitution-${Date.now()}`,
          type: "substitution",
          priority: "high",
          title: "Consider Safer Alternative",
          description: `This chemical has a high health hazard rating (${chemical.hazards.nfpa.health}). Consider finding a safer alternative.`,
          chemicalId: chemical.id,
          reasoning: "High health hazard rating indicates significant risk",
          benefits: [
            "Reduced health risk",
            "Lower PPE requirements",
            "Improved workplace safety",
          ],
          implementationSteps: [
            "Research alternative chemicals",
            "Evaluate compatibility with processes",
            "Test alternative in controlled environment",
            "Update procedures and training",
          ],
          confidence: 85,
        });
      }

      // Storage recommendations
      if (chemical.storage.temperatureRange) {
        const tempRange = chemical.storage.temperatureRange;
        if (tempRange.min < 0 || tempRange.max > 40) {
          recommendations.push({
            id: `rec-${chemical.id}-storage-${Date.now()}`,
            type: "storage",
            priority: "medium",
            title: "Special Temperature Control Required",
            description: `This chemical requires temperature control (${tempRange.min}°${tempRange.unit} - ${tempRange.max}°${tempRange.unit}). Ensure proper climate control.`,
            chemicalId: chemical.id,
            reasoning:
              "Temperature-sensitive chemical requires controlled storage",
            benefits: [
              "Prevents degradation",
              "Maintains chemical stability",
              "Reduces safety risks",
            ],
            implementationSteps: [
              "Install temperature monitoring",
              "Set up alerts for temperature deviations",
              "Regular calibration of monitoring equipment",
            ],
            confidence: 90,
          });
        }
      }

      // Compliance recommendations
      if (!chemical.compliance.ghsCompliant) {
        recommendations.push({
          id: `rec-${chemical.id}-compliance-${Date.now()}`,
          type: "compliance",
          priority: "critical",
          title: "GHS Compliance Required",
          description:
            "This chemical is not GHS compliant. Update documentation and labels.",
          chemicalId: chemical.id,
          reasoning: "GHS compliance is mandatory for chemical handling",
          benefits: [
            "Regulatory compliance",
            "Improved safety communication",
            "Reduced liability",
          ],
          implementationSteps: [
            "Update MSDS to GHS format",
            "Generate GHS-compliant labels",
            "Update training materials",
            "Review and approve changes",
          ],
          confidence: 100,
        });
      }

      // AI-powered recommendations
      const aiRecommendations = await this.generateAIRecommendations(chemical);
      recommendations.push(...aiRecommendations);

      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(
    chemical: Chemical,
  ): Promise<ChemicalRecommendation[]> {
    try {
      const systemPrompt = `You are an expert chemical management advisor. Provide intelligent recommendations for chemical optimization, safety, and compliance.`;

      const userPrompt = `Analyze this chemical and provide recommendations:

${JSON.stringify(
  {
    name: chemical.name,
    casNumber: chemical.casNumber,
    hazards: chemical.hazards,
    storage: chemical.storage,
    compliance: chemical.compliance,
  },
  null,
  2,
)}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "type": "substitution|storage|handling|disposal|compliance|cost",
      "priority": "low|medium|high|critical",
      "title": "Recommendation title",
      "description": "Detailed description",
      "reasoning": "Why this recommendation",
      "benefits": ["benefit1", "benefit2"],
      "implementationSteps": ["step1", "step2"],
      "confidence": 0-100
    }
  ]
}`;

      const aiResponse = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 2000,
        },
      );

      let recommendations: ChemicalRecommendation[] = [];
      try {
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
            recommendations = parsed.recommendations.map(
              (rec: any, idx: number) => ({
                id: `rec-ai-${chemical.id}-${Date.now()}-${idx}`,
                type: rec.type || "safety",
                priority: rec.priority || "medium",
                title: rec.title || "Recommendation",
                description: rec.description || "",
                chemicalId: chemical.id,
                reasoning: rec.reasoning || "",
                benefits: Array.isArray(rec.benefits) ? rec.benefits : [],
                risks: Array.isArray(rec.risks) ? rec.risks : undefined,
                implementationSteps: Array.isArray(rec.implementationSteps)
                  ? rec.implementationSteps
                  : [],
                confidence: Math.min(100, Math.max(0, rec.confidence || 75)),
              }),
            );
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI recommendations:", parseError);
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      return [];
    }
  }

  /**
   * Generate rule-based insights
   */
  private generateRuleBasedInsights(
    chemical: Chemical,
    openData: any,
  ): ChemicalInsight[] {
    const insights: ChemicalInsight[] = [];

    // High hazard insight
    if (
      chemical.hazards.nfpa?.health &&
      parseInt(chemical.hazards.nfpa.health) >= 3
    ) {
      insights.push({
        id: `insight-rule-${chemical.id}-high-hazard`,
        type: "risk",
        severity: "high",
        title: "High Health Hazard Detected",
        description: `This chemical has a health hazard rating of ${chemical.hazards.nfpa.health}, indicating significant health risks.`,
        recommendations: [
          "Ensure proper PPE is always used",
          "Implement strict handling procedures",
          "Consider engineering controls",
          "Regular health monitoring for exposed personnel",
        ],
        confidence: 95,
        actionable: true,
        impact: {
          riskReduction: 30,
        },
      });
    }

    // Non-compliance insight
    if (!chemical.compliance.ghsCompliant) {
      insights.push({
        id: `insight-rule-${chemical.id}-non-compliant`,
        type: "compliance",
        severity: "critical",
        title: "GHS Non-Compliance",
        description:
          "This chemical is not GHS compliant, which may result in regulatory violations.",
        recommendations: [
          "Update MSDS to GHS format",
          "Generate GHS-compliant labels",
          "Review regulatory requirements",
        ],
        confidence: 100,
        actionable: true,
        impact: {
          complianceImprovement: 50,
        },
      });
    }

    return insights;
  }

  /**
   * Predict future events
   */
  async predictEvents(
    chemical: Chemical,
    historicalData?: any[],
  ): Promise<ChemicalPrediction[]> {
    const predictions: ChemicalPrediction[] = [];

    // Expiry prediction
    if (chemical.metadata.updatedAt) {
      const updatedDate = new Date(chemical.metadata.updatedAt);
      const daysSinceUpdate = Math.floor(
        (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceUpdate > 365) {
        predictions.push({
          id: `pred-${chemical.id}-expiry`,
          type: "expiry",
          chemicalId: chemical.id,
          prediction: "MSDS may need updating",
          likelihood: Math.min(100, (daysSinceUpdate - 365) / 10),
          timeframe: "Within 30 days",
          confidence: 80,
          factors: [
            "MSDS is over 1 year old",
            "Regulatory requirements may have changed",
          ],
          mitigation: [
            "Review current MSDS",
            "Check for regulatory updates",
            "Update if necessary",
          ],
        });
      }
    }

    return predictions;
  }

  /**
   * Find safer alternatives
   */
  async findAlternatives(chemical: Chemical): Promise<
    Array<{
      chemicalId: string;
      name: string;
      casNumber?: string;
      similarity: number;
      benefits: string[];
      risks?: string[];
    }>
  > {
    try {
      // Search for alternatives using open data
      if (chemical.casNumber) {
        const openData = await openDataService.searchChemical(
          chemical.casNumber,
          { byCAS: true },
        );

        // Use AI to find similar but safer chemicals
        if (isAIAvailable()) {
          try {
            const aiResponse = await callAI({
              prompt: `Find safer alternative chemicals for: ${chemical.name} (CAS: ${chemical.casNumber})
              
Current Chemical Hazards:
- Hazard Level: ${chemical.hazardLevel}
- Hazard Statements: ${chemical.hazardStatements?.join(", ") || "Unknown"}
- GHS Classification: ${chemical.ghsClassification?.join(", ") || "Unknown"}

Requirements:
1. Must have similar chemical properties and functionality
2. Must have lower hazard level
3. Provide up to 5 alternatives
4. Include CAS number, hazard level comparison, and reason for recommendation

Format as JSON array with: name, casNumber, hazardLevel, hazardComparison, reason`,
              systemPrompt:
                "You are a chemical safety expert. Recommend safer alternatives based on hazard profiles while maintaining functionality.",
              model: "gpt-4",
              temperature: 0.5,
            });

            const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const alternatives = JSON.parse(jsonMatch[0]);
              if (Array.isArray(alternatives)) {
                return alternatives.slice(0, 5);
              }
            }
          } catch (error) {
            console.log("[Intelligent Chemical] AI alternatives not available");
          }
        }
      }

      // Fallback: return empty array if no alternatives found
      return [];
    } catch (error) {
      console.error("Error finding alternatives:", error);
      return [];
    }
  }
}

export const intelligentChemicalService = new IntelligentChemicalService();
