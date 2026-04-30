/**
 * Warehouse Entity Graph Integration
 * Relationship tracking and impact analysis
 * NO DUPLICATION - Uses existing entityGraphService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { entityGraphService } from "@/lib/services/graph/entityGraphService";
import type {
  CanonicalEntity,
  EntityRelationship,
  EntityType,
  RelationshipType,
} from "@/types/entityGraph";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE GRAPH TYPES
// ============================================================================

export interface WarehouseEntityGraph {
  warehouseId: string;
  entities: CanonicalEntity[];
  relationships: EntityRelationship[];
  analytics: {
    totalEntities: number;
    totalRelationships: number;
    entityTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  };
}

export interface WarehouseImpactAnalysis {
  warehouseId: string;
  changeType: "delete" | "update" | "disable";
  impactedEntities: Array<{
    entityId: string;
    entityType: string;
    impact: "high" | "medium" | "low";
    reason: string;
  }>;
  recommendations: string[];
}

// ============================================================================
// WAREHOUSE GRAPH INTEGRATION
// ============================================================================

class WarehouseGraphIntegration {
  /**
   * Register warehouse entity
   */
  async registerWarehouse(
    warehouseId: string,
    warehouse: { name: string; location?: string; type?: string },
  ): Promise<CanonicalEntity> {
    const entity = await entityGraphService.createEntity({
      type: "warehouse",
      name: warehouse.name,
      metadata: {
        warehouseId,
        location: warehouse.location,
        type: warehouse.type,
      },
      tenantId: undefined, // Would get from context
      isActive: true,
      version: 1,
    });

    // Publish event
    await eventBus.publish({
      id: `warehouse-graph-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.entity.registered",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        entityId: entity.id,
      },
    });

    return entity;
  }

  /**
   * Create relationship between warehouse and other entity
   */
  async createRelationship(
    warehouseId: string,
    targetEntityId: string,
    targetEntityType: EntityType,
    relationshipType: RelationshipType,
    metadata?: Record<string, any>,
  ): Promise<EntityRelationship> {
    // Get warehouse entity
    const warehouseEntity = await this.findWarehouseEntity(warehouseId);
    if (!warehouseEntity) {
      throw new Error(`Warehouse entity not found: ${warehouseId}`);
    }

    const relationship = await entityGraphService.createRelationship({
      sourceEntityId: warehouseEntity.id,
      sourceEntityType: "warehouse",
      targetEntityId,
      targetEntityType,
      type: relationshipType,
      direction: "forward",
      strength: 1.0,
      metadata: {
        warehouseId,
        ...metadata,
      },
      isActive: true,
    });

    // Publish event
    await eventBus.publish({
      id: `warehouse-relationship-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.relationship.created",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        relationshipId: relationship.id,
        targetEntityId,
        targetEntityType,
        relationshipType,
      },
    });

    return relationship;
  }

  /**
   * Get warehouse entity graph
   */
  async getWarehouseGraph(warehouseId: string): Promise<WarehouseEntityGraph> {
    const warehouseEntity = await this.findWarehouseEntity(warehouseId);
    if (!warehouseEntity) {
      throw new Error(`Warehouse entity not found: ${warehouseId}`);
    }

    // Find all related entities
    const relatedEntities = await entityGraphService.findRelated(
      warehouseEntity.id,
      {
        maxDepth: 2,
        relationshipTypes: undefined,
        entityTypes: undefined,
      },
    );

    // Get all relationships
    const queryResult = await entityGraphService.query({
      startEntityId: warehouseEntity.id,
      maxDepth: 2,
    });

    // Calculate analytics
    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    relatedEntities.forEach((e) => {
      entityTypes[e.type] = (entityTypes[e.type] || 0) + 1;
    });

    queryResult.relationships.forEach((r) => {
      relationshipTypes[r.type] = (relationshipTypes[r.type] || 0) + 1;
    });

    return {
      warehouseId,
      entities: [warehouseEntity, ...relatedEntities],
      relationships: queryResult.relationships,
      analytics: {
        totalEntities: relatedEntities.length + 1,
        totalRelationships: queryResult.relationships.length,
        entityTypes,
        relationshipTypes,
      },
    };
  }

  /**
   * Analyze impact of warehouse change
   */
  async analyzeImpact(
    warehouseId: string,
    changeType: "delete" | "update" | "disable",
  ): Promise<WarehouseImpactAnalysis> {
    const warehouseEntity = await this.findWarehouseEntity(warehouseId);
    if (!warehouseEntity) {
      throw new Error(`Warehouse entity not found: ${warehouseId}`);
    }

    const impactAnalysis = await entityGraphService.analyzeImpact(
      warehouseEntity.id,
      changeType,
    );

    // Map to warehouse impact analysis
    const warehouseImpact: WarehouseImpactAnalysis = {
      warehouseId,
      changeType,
      impactedEntities: impactAnalysis.impactedEntities.map((e) => ({
        entityId: e.entityId,
        entityType: e.entityType,
        impact: e.impact as "high" | "medium" | "low",
        reason: e.reason,
      })),
      recommendations: impactAnalysis.recommendations,
    };

    return warehouseImpact;
  }

  /**
   * Find warehouse entity
   */
  private async findWarehouseEntity(
    warehouseId: string,
  ): Promise<CanonicalEntity | null> {
    // Search for warehouse entity
    const entities = await entityGraphService.searchEntities(warehouseId, {
      types: ["warehouse"],
    });

    // Find by metadata
    const warehouseEntity = entities.find(
      (e) => e.metadata?.warehouseId === warehouseId,
    );

    return warehouseEntity || null;
  }

  /**
   * Link inventory to warehouse
   */
  async linkInventory(
    warehouseId: string,
    inventoryId: string,
  ): Promise<EntityRelationship> {
    return await this.createRelationship(
      warehouseId,
      inventoryId,
      "inventory",
      "contains",
      { relationship: "inventory_location" },
    );
  }

  /**
   * Link order to warehouse
   */
  async linkOrder(
    warehouseId: string,
    orderId: string,
  ): Promise<EntityRelationship> {
    return await this.createRelationship(
      warehouseId,
      orderId,
      "order",
      "fulfills",
      { relationship: "order_fulfillment" },
    );
  }

  /**
   * Link customer to warehouse
   */
  async linkCustomer(
    warehouseId: string,
    customerId: string,
  ): Promise<EntityRelationship> {
    return await this.createRelationship(
      warehouseId,
      customerId,
      "customer",
      "serves",
      { relationship: "customer_service" },
    );
  }
}

export const warehouseGraphIntegration = new WarehouseGraphIntegration();
