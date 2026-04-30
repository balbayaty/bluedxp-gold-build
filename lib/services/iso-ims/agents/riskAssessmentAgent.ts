/**
 * Risk Assessment Agent
 *
 * Autonomous agent that continuously assesses risks:
 * - Real-time risk monitoring
 * - Predictive risk analysis
 * - Auto-risk creation
 * - Risk treatment suggestions
 * - Risk trend analysis
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { riskService } from "../riskService";
import { intelligenceService } from "../intelligenceService";
import { complianceEngine } from "../complianceEngine";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export class RiskAssessmentAgent {
  private agentId = "risk-assessment-agent";
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  async initialize(): Promise<void> {
    await agentOrchestrator.registerAgent({
      id: this.agentId,
      type: "risk-assessment",
      name: "Risk Assessment Agent",
      description: "Continuously assesses risks and suggests treatments",
      capabilities: [
        {
          id: "monitor-risks",
          name: "Monitor Risks",
          description: "Continuously monitor risk levels",
          categories: ["risk", "monitoring"],
          confidenceThreshold: 0.85,
          priority: 10,
        },
        {
          id: "auto-create-risk",
          name: "Auto-Create Risk",
          description: "Automatically create risks from various sources",
          categories: ["risk", "automation"],
          confidenceThreshold: 0.9,
          priority: 9,
        },
        {
          id: "predict-risks",
          name: "Predict Risks",
          description: "Predict future risks using AI",
          categories: ["risk", "prediction"],
          confidenceThreshold: 0.8,
          priority: 8,
        },
        {
          id: "suggest-treatment",
          name: "Suggest Risk Treatment",
          description: "Suggest risk treatment plans",
          categories: ["risk", "treatment"],
          confidenceThreshold: 0.85,
          priority: 7,
        },
      ],
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Start monitoring
    this.startMonitoring();

    // Subscribe to events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to risk-related events
   */
  private subscribeToEvents(): void {
    // Subscribe to compliance updates
    eventBus.subscribe("iso-ims.compliance.updated", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { tenantId } = event.metadata;
        await this.monitorTenantRisks(tenantId);
      }
    });

    // Subscribe to new NCRs (could indicate risks)
    eventBus.subscribe("iso-ims.ncr.created", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { tenantId } = event.metadata;
        // Could analyze NCR for risk patterns
      }
    });

    console.log("✅ Risk Assessment Agent event subscriptions registered");
  }

  /**
   * Start continuous risk monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor every 10 minutes
    this.monitoringInterval = setInterval(
      async () => {
        try {
          // Would monitor all tenants
          // For now, just log
        } catch (error) {
          console.error("Error in risk monitoring:", error);
        }
      },
      10 * 60 * 1000,
    ); // 10 minutes
  }

  /**
   * Monitor risks for a tenant
   */
  async monitorTenantRisks(tenantId: string): Promise<{
    risksIdentified: number;
    risksCreated: number;
    treatmentsSuggested: number;
    predictionsGenerated: number;
  }> {
    try {
      let risksIdentified = 0;
      let risksCreated = 0;
      let treatmentsSuggested = 0;
      let predictionsGenerated = 0;

      // Get compliance dashboard
      const dashboard = await complianceEngine.getComplianceDashboard(tenantId);

      // Identify risks from compliance gaps
      if (dashboard.overallScore < 70) {
        const risk = await this.autoCreateRisk(tenantId, {
          title: "Low Compliance Score",
          description: `Overall compliance score is ${dashboard.overallScore}%`,
          category: "COMPLIANCE",
          riskLevel: "HIGH",
          likelihood: 0.8,
          impact: 0.9,
        });
        if (risk) {
          risksIdentified++;
          risksCreated++;
        }
      }

      // Check for non-compliant standards
      for (const metric of dashboard.byStandard) {
        if (metric.status === "NON_COMPLIANT") {
          const risk = await this.autoCreateRisk(tenantId, {
            title: `Non-Compliance: ${metric.standard}`,
            description: `${metric.standard} is non-compliant with score ${metric.score}%`,
            category: "COMPLIANCE",
            riskLevel: "MEDIUM",
            likelihood: 0.7,
            impact: 0.6,
            relatedStandard: metric.standard,
          });
          if (risk) {
            risksIdentified++;
            risksCreated++;
          }
        }
      }

      // Generate risk predictions
      const predictions = await intelligenceService.predictRisks(tenantId);
      predictionsGenerated = predictions.length;

      // Suggest treatments for high risks
      const { risks } = await riskService.getRisks({
        tenantId,
        filters: {
          riskLevel: "HIGH",
        },
        pagination: { page: 1, pageSize: 10 },
      });

      for (const risk of risks) {
        const treatment = await this.suggestRiskTreatment(tenantId, risk.id);
        if (treatment) {
          treatmentsSuggested++;
        }
      }

      return {
        risksIdentified,
        risksCreated,
        treatmentsSuggested,
        predictionsGenerated,
      };
    } catch (error) {
      console.error("Error monitoring tenant risks:", error);
      return {
        risksIdentified: 0,
        risksCreated: 0,
        treatmentsSuggested: 0,
        predictionsGenerated: 0,
      };
    }
  }

  /**
   * Auto-create risk
   */
  private async autoCreateRisk(
    tenantId: string,
    riskData: {
      title: string;
      description: string;
      category: string;
      riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      likelihood: number;
      impact: number;
      relatedStandard?: string;
    },
  ): Promise<string | null> {
    try {
      const risk = await riskService.createRisk({
        tenantId,
        title: riskData.title,
        description: riskData.description,
        category: riskData.category as any,
        riskLevel: riskData.riskLevel,
        likelihood: riskData.likelihood,
        impact: riskData.impact,
        status: "IDENTIFIED",
        source: "AUTO_RISK_AGENT",
        relatedStandard: riskData.relatedStandard,
      });

      await eventBus.publish(
        createEvent(
          "iso-ims.agent.risk.created",
          risk.id,
          "RISK",
          {
            riskId: risk.id,
            agentId: this.agentId,
            tenantId,
            riskLevel: riskData.riskLevel,
          },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return risk.id;
    } catch (error) {
      console.error("Error auto-creating risk:", error);
      return null;
    }
  }

  /**
   * Suggest risk treatment
   */
  private async suggestRiskTreatment(
    tenantId: string,
    riskId: string,
  ): Promise<{
    treatment: string;
    actions: string[];
    priority: string;
  } | null> {
    try {
      const risk = await riskService.getRisk(riskId, tenantId);
      if (!risk) {
        return null;
      }

      // Use intelligence to suggest treatment
      const recommendations = await intelligenceService.generateRecommendations(
        tenantId,
        {
          risks: [risk],
        },
      );

      if (recommendations.length > 0) {
        const recommendation = recommendations[0];

        return {
          treatment: recommendation.title,
          actions: [recommendation.description],
          priority: recommendation.priority,
        };
      }

      return null;
    } catch (error) {
      console.error("Error suggesting risk treatment:", error);
      return null;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }
}

export const riskAssessmentAgent = new RiskAssessmentAgent();
