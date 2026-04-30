/**
 * Facility Management Integration Service
 *
 * Integrates Facility Management with:
 * - Knowledge Base (documentation, procedures, insights)
 * - Agent System (autonomous facility management agents)
 * - Event Bus (cross-module communication)
 * - Cross-module connectivity (WMS, QHSE, TMS, ISO-IMS)
 */

import { eventBus } from "@/lib/services/event-store";
import { warehouseIntegrationService } from "./warehouseIntegrationService";
import { initializeFacilityAgent } from "../agents/facilityAgent";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  KnowledgeEntry,
  KnowledgeType,
  KnowledgeCategory,
  KnowledgeCategoryType,
} from "@/types/knowledgeBase";
import type {
  Facility,
  FacilityAsset,
  MaintenanceRecord,
  WorkOrder,
  EnergyConsumption,
} from "@/types/facility";

export interface FacilityIntegrationConfig {
  enableKnowledgeBase?: boolean;
  enableAgentSystem?: boolean;
  enableCrossModuleIntegration?: boolean;
  enableWarehouseIntegration?: boolean;
  autoStoreInsights?: boolean;
}

export class FacilityIntegrationService {
  private config: FacilityIntegrationConfig;

  constructor(config: FacilityIntegrationConfig = {}) {
    this.config = {
      enableKnowledgeBase: true,
      enableAgentSystem: true,
      enableCrossModuleIntegration: true,
      enableWarehouseIntegration: true,
      autoStoreInsights: true,
      ...config,
    };

    // Subscribe to facility events
    this.setupEventSubscriptions();

    // Register Facility Management Agent
    if (this.config.enableAgentSystem) {
      try {
        initializeFacilityAgent();
      } catch (error) {
        console.warn("Failed to initialize Facility Agent:", error);
      }
    }
  }

  /**
   * Get warehouse integration service
   */
  getWarehouseIntegration() {
    return this.config.enableWarehouseIntegration
      ? warehouseIntegrationService
      : null;
  }

  /**
   * Store facility documentation in Knowledge Base
   */
  async storeFacilityDocumentation(
    facilityId: string,
    documentation: {
      title: string;
      content: string;
      type:
        | "manual"
        | "procedure"
        | "specification"
        | "compliance"
        | "maintenance"
        | "other";
      category?: string;
      relatedAssetId?: string;
      tags?: string[];
    },
  ): Promise<KnowledgeEntry> {
    if (!this.config.enableKnowledgeBase) {
      throw new Error("Knowledge Base integration is not enabled");
    }

    const knowledgeType: KnowledgeType =
      documentation.type === "manual"
        ? "fact"
        : documentation.type === "procedure"
          ? "procedure"
          : documentation.type === "specification"
            ? "fact"
            : documentation.type === "compliance"
              ? "rule"
              : documentation.type === "maintenance"
                ? "procedure"
                : "fact";

    return await knowledgeBaseService.create({
      agentId: "facility-management",
      tenantId: undefined, // Would come from context
      type: knowledgeType,
      category:
        (documentation.category as KnowledgeCategory | KnowledgeCategoryType) ||
        "warehouse_operations",
      content: documentation.content,
      summary: documentation.title,
      metadata: {
        facilityId,
        relatedAssetId: documentation.relatedAssetId,
        documentationType: documentation.type,
      },
      keywords: documentation.tags || [],
      searchableText: `${documentation.title} ${documentation.content} ${(documentation.tags || []).join(" ")}`,
      source: "ai_analysis",
      confidence: 100,
      verified: true,
      feedbackScore: 0,
      usageCount: 0,
      status: "active",
    });
  }

  /**
   * Store maintenance procedure in Knowledge Base
   */
  async storeMaintenanceProcedure(
    assetId: string,
    procedure: {
      title: string;
      steps: string[];
      frequency: string;
      estimatedDuration: number;
      requiredTools?: string[];
      safetyPrecautions?: string[];
    },
  ): Promise<KnowledgeEntry> {
    if (!this.config.enableKnowledgeBase) {
      throw new Error("Knowledge Base integration is not enabled");
    }

    const content = `
Title: ${procedure.title}
Frequency: ${procedure.frequency}
Estimated Duration: ${procedure.estimatedDuration} minutes

Steps:
${procedure.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

${procedure.requiredTools ? `Required Tools: ${procedure.requiredTools.join(", ")}` : ""}
${procedure.safetyPrecautions ? `Safety Precautions: ${procedure.safetyPrecautions.join(", ")}` : ""}
    `.trim();

    return await knowledgeBaseService.create({
      agentId: "facility-management",
      tenantId: undefined,
      type: "procedure",
      category: "warehouse_operations",
      content,
      summary: procedure.title,
      metadata: {
        assetId,
        frequency: procedure.frequency,
        estimatedDuration: procedure.estimatedDuration,
      },
      keywords: ["maintenance", "procedure", "asset", assetId],
      searchableText: `${procedure.title} ${procedure.steps.join(" ")} ${(procedure.requiredTools || []).join(" ")}`,
      source: "ai_analysis",
      confidence: 100,
      verified: true,
      feedbackScore: 0,
      usageCount: 0,
      status: "active",
    });
  }

  /**
   * Store facility insights in Knowledge Base
   */
  async storeFacilityInsight(
    facilityId: string,
    insight: {
      title: string;
      description: string;
      category:
        | "energy"
        | "maintenance"
        | "space"
        | "compliance"
        | "cost"
        | "other";
      impact: "high" | "medium" | "low";
      recommendations?: string[];
      data?: Record<string, any>;
    },
  ): Promise<KnowledgeEntry> {
    if (!this.config.enableKnowledgeBase || !this.config.autoStoreInsights) {
      return {} as KnowledgeEntry; // Skip if not enabled
    }

    const content = `
${insight.description}

${insight.recommendations ? `Recommendations:\n${insight.recommendations.map((r) => `- ${r}`).join("\n")}` : ""}

${insight.data ? `Data: ${JSON.stringify(insight.data, null, 2)}` : ""}
    `.trim();

    // Map facility categories to knowledge base categories
    const categoryMap: Record<
      string,
      KnowledgeCategory | KnowledgeCategoryType
    > = {
      energy: "warehouse_operations",
      maintenance: "warehouse_operations",
      space: "warehouse_operations",
      compliance: "regulatory_compliance",
      cost: "general",
      other: "general",
    };

    return await knowledgeBaseService.create({
      agentId: "facility-management",
      tenantId: undefined,
      type: "insight",
      category: categoryMap[insight.category] || "general",
      content,
      summary: insight.title,
      metadata: {
        facilityId,
        impact: insight.impact,
        category: insight.category,
        data: insight.data,
      },
      keywords: ["insight", insight.category, "facility", facilityId],
      searchableText: `${insight.title} ${insight.description} ${(insight.recommendations || []).join(" ")}`,
      source: "ai_analysis",
      confidence:
        insight.impact === "high" ? 90 : insight.impact === "medium" ? 75 : 60,
      verified: false,
      feedbackScore: 0,
      usageCount: 0,
      status: "active",
    });
  }

  /**
   * Search Knowledge Base for facility-related information
   */
  async searchFacilityKnowledge(
    query: string,
    filters?: {
      facilityId?: string;
      assetId?: string;
      category?: string;
      type?: KnowledgeType;
    },
  ): Promise<KnowledgeEntry[]> {
    if (!this.config.enableKnowledgeBase) {
      throw new Error("Knowledge Base integration is not enabled");
    }

    const results = await knowledgeBaseService.semanticSearch(query, {
      filters: {
        ...(filters?.category && {
          categories: [filters.category as KnowledgeCategory],
        }),
        ...(filters?.type && { types: [filters.type] }),
      },
      limit: 10,
    });

    // Filter by facility/asset if specified
    if (filters?.facilityId || filters?.assetId) {
      return results
        .map((r) => r.entry)
        .filter((entry) => {
          if (
            filters.facilityId &&
            entry.metadata?.facilityId !== filters.facilityId
          ) {
            return false;
          }
          if (filters.assetId && entry.metadata?.assetId !== filters.assetId) {
            return false;
          }
          return true;
        });
    }

    return results.map((r) => r.entry);
  }

  /**
   * Setup event subscriptions for cross-module integration
   */
  private setupEventSubscriptions(): void {
    if (!this.config.enableCrossModuleIntegration) {
      return;
    }

    // Subscribe to facility events
    eventBus.subscribe("facility.asset.created", async (event) => {
      // Store asset information in knowledge base
      if (this.config.enableKnowledgeBase && this.config.autoStoreInsights) {
        try {
          await this.storeFacilityDocumentation(event.data.facilityId, {
            title: `Asset: ${event.data.assetName}`,
            content: `New asset created: ${event.data.assetName} (Type: ${event.data.assetType})`,
            type: "specification",
            category: "assets",
            relatedAssetId: event.data.assetId,
            tags: ["asset", event.data.assetType],
          });
        } catch (error) {
          console.error("Failed to store asset in knowledge base:", error);
        }
      }
    });

    eventBus.subscribe("facility.maintenance.completed", async (event) => {
      // Store maintenance insights
      if (this.config.enableKnowledgeBase && this.config.autoStoreInsights) {
        try {
          await this.storeFacilityInsight(event.data.facilityId, {
            title: "Maintenance Completed",
            description: `Maintenance completed for asset ${event.data.assetId} with cost ${event.data.cost}`,
            category: "maintenance",
            impact: "medium",
            data: {
              assetId: event.data.assetId,
              cost: event.data.cost,
              completedDate: event.data.completedDate,
            },
          });
        } catch (error) {
          console.error("Failed to store maintenance insight:", error);
        }
      }
    });

    eventBus.subscribe(
      "facility.energy.consumption.recorded",
      async (event) => {
        // Store energy insights
        if (this.config.enableKnowledgeBase && this.config.autoStoreInsights) {
          try {
            await this.storeFacilityInsight(event.data.facilityId, {
              title: "Energy Consumption Recorded",
              description: `Energy consumption: ${event.data.consumption} kWh, Carbon: ${event.data.carbonEmissions} kg CO₂`,
              category: "energy",
              impact: "medium",
              data: {
                consumption: event.data.consumption,
                carbonEmissions: event.data.carbonEmissions,
              },
            });
          } catch (error) {
            console.error("Failed to store energy insight:", error);
          }
        }
      },
    );

    // Subscribe to cross-module events
    eventBus.subscribe("wms.warehouse.created", async (event) => {
      // Link warehouse to facility (if applicable)
      // This would create a facility asset for the warehouse
    });

    eventBus.subscribe("qhse.incident.created", async (event) => {
      // Create maintenance work order from QHSE incident if facility-related
      if (event.data.location && event.data.location.facilityId) {
        // Would trigger work order creation
      }
    });
  }

  /**
   * Get facility management agent configuration
   */
  async getFacilityAgentConfig(): Promise<{
    agentId: string;
    capabilities: string[];
    knowledgeBaseAccess: boolean;
    crossModuleAccess: boolean;
  }> {
    if (!this.config.enableAgentSystem) {
      throw new Error("Agent System integration is not enabled");
    }

    return {
      agentId: "facility-management-agent",
      capabilities: [
        "asset_management",
        "maintenance_scheduling",
        "energy_optimization",
        "space_optimization",
        "compliance_monitoring",
        "predictive_analytics",
        "anomaly_detection",
      ],
      knowledgeBaseAccess: this.config.enableKnowledgeBase || false,
      crossModuleAccess: this.config.enableCrossModuleIntegration || false,
    };
  }

  /**
   * Store predictive maintenance insight
   */
  async storePredictiveInsight(
    assetId: string,
    prediction: {
      predictedFailureDate: Date;
      confidence: number;
      riskLevel: string;
      recommendedActions: string[];
    },
  ): Promise<KnowledgeEntry> {
    if (!this.config.enableKnowledgeBase) {
      throw new Error("Knowledge Base integration is not enabled");
    }

    return await this.storeFacilityInsight("", {
      title: `Predictive Maintenance Alert: Asset ${assetId}`,
      description: `Predicted failure date: ${prediction.predictedFailureDate.toISOString()}, Risk: ${prediction.riskLevel}, Confidence: ${prediction.confidence}%`,
      category: "maintenance",
      impact: prediction.riskLevel === "critical" ? "high" : "medium",
      recommendations: prediction.recommendedActions,
      data: {
        assetId,
        predictedFailureDate: prediction.predictedFailureDate,
        confidence: prediction.confidence,
        riskLevel: prediction.riskLevel,
      },
    });
  }

  /**
   * Store energy optimization recommendation
   */
  async storeEnergyOptimization(
    facilityId: string,
    recommendation: {
      title: string;
      description: string;
      energySavings: number;
      costSavings: number;
      carbonReduction: number;
    },
  ): Promise<KnowledgeEntry> {
    if (!this.config.enableKnowledgeBase) {
      throw new Error("Knowledge Base integration is not enabled");
    }

    return await this.storeFacilityInsight(facilityId, {
      title: recommendation.title,
      description: recommendation.description,
      category: "energy",
      impact: recommendation.costSavings > 50000 ? "high" : "medium",
      recommendations: [
        `Energy Savings: ${recommendation.energySavings} kWh/year`,
        `Cost Savings: $${recommendation.costSavings.toLocaleString()}/year`,
        `Carbon Reduction: ${recommendation.carbonReduction} kg CO₂/year`,
      ],
      data: {
        energySavings: recommendation.energySavings,
        costSavings: recommendation.costSavings,
        carbonReduction: recommendation.carbonReduction,
      },
    });
  }
}

// Singleton instance
let facilityIntegrationServiceInstance: FacilityIntegrationService | null =
  null;

export function getFacilityIntegrationService(
  config?: FacilityIntegrationConfig,
): FacilityIntegrationService {
  if (!facilityIntegrationServiceInstance) {
    facilityIntegrationServiceInstance = new FacilityIntegrationService(config);
  }
  return facilityIntegrationServiceInstance;
}

// Export singleton instance
export const facilityIntegrationService = getFacilityIntegrationService();
