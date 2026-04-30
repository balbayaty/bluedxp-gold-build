/**
 * Warehouse Copilot Integration
 * AI assistant for warehouse operations
 * NO DUPLICATION - Uses existing copilotService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { copilotService } from "@/lib/services/copilot/copilotService";
import type {
  CopilotContext,
  CopilotResponse,
} from "@/lib/services/copilot/copilotService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base/knowledgeBaseService";
import { warehouseKnowledgeBaseIntegration } from "./knowledgeBaseIntegration";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE COPILOT TYPES
// ============================================================================

export interface WarehouseCopilotQuery {
  warehouseId: string;
  query: string;
  context?: {
    operation?: string;
    entityId?: string;
    entityType?: string;
  };
}

export interface WarehouseCopilotResponse extends CopilotResponse {
  warehouseContext?: {
    warehouseId: string;
    recommendations?: Array<{
      type: string;
      title: string;
      description: string;
      action?: string;
    }>;
    knowledge?: Array<{
      id: string;
      title: string;
      relevance: number;
    }>;
  };
}

// ============================================================================
// WAREHOUSE COPILOT INTEGRATION
// ============================================================================

class WarehouseCopilotIntegration {
  /**
   * Process warehouse copilot query
   */
  async processQuery(
    query: WarehouseCopilotQuery,
  ): Promise<WarehouseCopilotResponse> {
    // Build copilot context
    const copilotContext: CopilotContext = {
      module: "wms",
      page: "warehouse",
      entityId: query.warehouseId,
      entityType: "warehouse",
      warehouseId: query.warehouseId,
      ...query.context,
    };

    // Get knowledge base recommendations
    const knowledge =
      await warehouseKnowledgeBaseIntegration.getRecommendations(
        query.warehouseId,
        {
          operation: query.context?.operation,
          issue: query.query,
        },
      );

    // Send to copilot service
    const copilotResponse = await copilotService.sendMessage(
      query.query,
      copilotContext,
    );

    // Enhance with warehouse-specific context
    const enhancedResponse: WarehouseCopilotResponse = {
      ...copilotResponse,
      warehouseContext: {
        warehouseId: query.warehouseId,
        knowledge: knowledge.slice(0, 3).map((k) => ({
          id: k.id,
          title: k.title,
          relevance: k.effectiveness || 0,
        })),
        recommendations: this.generateRecommendations(query, knowledge),
      },
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-copilot-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.copilot.query",
      aggregateId: query.warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId: query.warehouseId,
        query: query.query,
        response: enhancedResponse,
      },
    });

    return enhancedResponse;
  }

  /**
   * Generate recommendations based on query and knowledge
   */
  private generateRecommendations(
    query: WarehouseCopilotQuery,
    knowledge: Array<{
      id: string;
      title: string;
      type: string;
      category: string;
    }>,
  ): Array<{
    type: string;
    title: string;
    description: string;
    action?: string;
  }> {
    const recommendations: Array<{
      type: string;
      title: string;
      description: string;
      action?: string;
    }> = [];

    // Analyze query intent
    const lowerQuery = query.query.toLowerCase();

    if (lowerQuery.includes("optimize") || lowerQuery.includes("improve")) {
      recommendations.push({
        type: "optimization",
        title: "Optimization Opportunities",
        description: "Consider running optimization analysis",
        action: "open-optimization",
      });
    }

    if (lowerQuery.includes("location") || lowerQuery.includes("where")) {
      recommendations.push({
        type: "location",
        title: "Location Management",
        description: "View location details and assignments",
        action: "open-locations",
      });
    }

    if (lowerQuery.includes("inventory") || lowerQuery.includes("stock")) {
      recommendations.push({
        type: "inventory",
        title: "Inventory Management",
        description: "Check inventory levels and movements",
        action: "open-inventory",
      });
    }

    // Add knowledge-based recommendations
    if (knowledge.length > 0) {
      recommendations.push({
        type: "knowledge",
        title: "Related Knowledge",
        description: `Found ${knowledge.length} relevant procedures`,
        action: "open-knowledge",
      });
    }

    return recommendations;
  }

  /**
   * Get copilot history for warehouse
   */
  getHistory(warehouseId: string): CopilotResponse[] {
    const history = copilotService.getHistory();
    return history.filter(
      (h) =>
        h.context?.warehouseId === warehouseId ||
        h.context?.entityId === warehouseId,
    );
  }

  /**
   * Clear warehouse-specific history
   */
  clearHistory(warehouseId: string): void {
    // Note: copilotService.clearHistory() clears all
    // In production, would filter by warehouseId
    copilotService.clearHistory();
  }
}

export const warehouseCopilotIntegration = new WarehouseCopilotIntegration();
