/**
 * Warehouse Knowledge Base Integration
 * Self-learning warehouse knowledge with vector embeddings
 * NO DUPLICATION - Uses existing knowledgeBaseService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base/knowledgeBaseService";
import type { KnowledgeEntry, KnowledgeCategory } from "@/types/knowledgeBase";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE KNOWLEDGE TYPES
// ============================================================================

export interface WarehouseKnowledge {
  id: string;
  warehouseId?: string;
  type:
    | "PROCEDURE"
    | "BEST_PRACTICE"
    | "TROUBLESHOOTING"
    | "TRAINING"
    | "DECISION_PATTERN"
    | "OPTIMIZATION";
  category:
    | "RECEIVING"
    | "PUTAWAY"
    | "PICKING"
    | "SHIPPING"
    | "INVENTORY"
    | "SAFETY"
    | "OPTIMIZATION"
    | "GENERAL";
  title: string;
  content: string;
  tags: string[];
  effectiveness?: number; // 0-100, how effective this knowledge is
  usageCount: number;
  lastUsed?: Date;
}

export interface WarehouseKnowledgeQuery {
  warehouseId?: string;
  type?: WarehouseKnowledge["type"];
  category?: WarehouseKnowledge["category"];
  query: string;
  limit?: number;
}

// ============================================================================
// WAREHOUSE KNOWLEDGE BASE INTEGRATION
// ============================================================================

class WarehouseKnowledgeBaseIntegration {
  /**
   * Store warehouse procedure
   */
  async storeProcedure(
    warehouseId: string,
    procedure: Omit<WarehouseKnowledge, "id" | "usageCount" | "lastUsed">,
  ): Promise<WarehouseKnowledge> {
    const knowledgeEntry = await knowledgeBaseService.create({
      tenantId: undefined, // Would get from context
      type: "procedure",
      category: this.mapCategory(procedure.category),
      content: procedure.content,
      summary: procedure.title,
      metadata: {
        warehouseId,
        knowledgeType: procedure.type,
        category: procedure.category,
        tags: procedure.tags,
        effectiveness: procedure.effectiveness || 0,
      },
      keywords: procedure.tags,
      searchableText: `${procedure.title} ${procedure.content} ${procedure.tags.join(" ")}`,
      source: "warehouse_operations",
      confidence: procedure.effectiveness || 50,
      verified: false,
      feedbackScore: 0,
      usageCount: 0,
      status: "active",
      version: 1,
    });

    // Publish event
    await eventBus.publish({
      id: `warehouse-knowledge-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.knowledge.stored",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        knowledgeId: knowledgeEntry.id,
        type: procedure.type,
      },
    });

    return this.mapToWarehouseKnowledge(knowledgeEntry, warehouseId);
  }

  /**
   * Search warehouse knowledge
   */
  async searchKnowledge(
    query: WarehouseKnowledgeQuery,
  ): Promise<WarehouseKnowledge[]> {
    const searchResults = await knowledgeBaseService.semanticSearch(
      query.query,
      {
        filters: {
          category: query.category
            ? this.mapCategory(query.category)
            : undefined,
          tenantId: undefined,
        },
        limit: query.limit || 10,
      },
    );

    // Filter by warehouse if specified
    let filtered = searchResults;
    if (query.warehouseId) {
      filtered = searchResults.filter(
        (r) =>
          r.entry.metadata?.warehouseId === query.warehouseId ||
          !r.entry.metadata?.warehouseId, // Include global knowledge
      );
    }

    // Filter by type if specified
    if (query.type) {
      filtered = filtered.filter(
        (r) => r.entry.metadata?.knowledgeType === query.type,
      );
    }

    return filtered.map((r) =>
      this.mapToWarehouseKnowledge(r.entry, query.warehouseId),
    );
  }

  /**
   * Get recommendations based on context
   */
  async getRecommendations(
    warehouseId: string,
    context: {
      operation?: string;
      issue?: string;
      category?: WarehouseKnowledge["category"];
    },
  ): Promise<WarehouseKnowledge[]> {
    const query = context.issue || context.operation || "warehouse operations";
    return await this.searchKnowledge({
      warehouseId,
      category: context.category,
      query,
      limit: 5,
    });
  }

  /**
   * Learn from successful operation
   */
  async learnFromSuccess(
    warehouseId: string,
    operation: {
      type: WarehouseKnowledge["type"];
      category: WarehouseKnowledge["category"];
      description: string;
      outcome: string;
      metrics?: Record<string, number>;
    },
  ): Promise<void> {
    const knowledge: Omit<
      WarehouseKnowledge,
      "id" | "usageCount" | "lastUsed"
    > = {
      warehouseId,
      type: operation.type,
      category: operation.category,
      title: `Successful ${operation.type}: ${operation.category}`,
      content: `${operation.description}\n\nOutcome: ${operation.outcome}\n\nMetrics: ${JSON.stringify(operation.metrics || {})}`,
      tags: [operation.type, operation.category, "success"],
      effectiveness: 90, // High effectiveness for successful operations
    };

    await this.storeProcedure(warehouseId, knowledge);

    // Process learning event
    await knowledgeBaseService.learn({
      type: "success",
      entityType: "warehouse_operation",
      entityId: warehouseId,
      context: {
        operation: operation.type,
        category: operation.category,
      },
      outcome: "success",
      feedback: "positive",
    });
  }

  /**
   * Map warehouse category to knowledge base category
   */
  private mapCategory(
    category: WarehouseKnowledge["category"],
  ): KnowledgeCategory {
    const categoryMap: Record<
      WarehouseKnowledge["category"],
      KnowledgeCategory
    > = {
      RECEIVING: "warehouse_operations",
      PUTAWAY: "warehouse_operations",
      PICKING: "warehouse_operations",
      SHIPPING: "warehouse_operations",
      INVENTORY: "warehouse_operations",
      SAFETY: "regulatory_compliance",
      OPTIMIZATION: "general",
      GENERAL: "general",
    };
    return categoryMap[category] || "general";
  }

  /**
   * Map knowledge entry to warehouse knowledge
   */
  private mapToWarehouseKnowledge(
    entry: KnowledgeEntry,
    warehouseId?: string,
  ): WarehouseKnowledge {
    return {
      id: entry.id,
      warehouseId: entry.metadata?.warehouseId || warehouseId,
      type: entry.metadata?.knowledgeType || "PROCEDURE",
      category: entry.metadata?.category || "GENERAL",
      title: entry.summary || entry.content.substring(0, 100),
      content: entry.content,
      tags: entry.keywords,
      effectiveness: entry.metadata?.effectiveness || entry.confidence,
      usageCount: entry.usageCount,
      lastUsed: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
    };
  }
}

export const warehouseKnowledgeBaseIntegration =
  new WarehouseKnowledgeBaseIntegration();
