/**
 * Warehouse Decision Core Integration
 * Decision support for warehouse operations
 * NO DUPLICATION - Uses existing decisionService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { decisionService } from "@/lib/services/decision-core/decisionService";
import type {
  DecisionRecord,
  DecisionContext,
  DecisionPrimitive,
} from "@/lib/services/decision-core/types";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE DECISION TYPES
// ============================================================================

export interface WarehouseDecision {
  id: string;
  warehouseId: string;
  entityType: "LOCATION" | "INVENTORY" | "ORDER" | "TASK" | "RESOURCE";
  entityId: string;
  decisionType:
    | "PUTAWAY_LOCATION"
    | "PICK_PATH"
    | "RESOURCE_ALLOCATION"
    | "INVENTORY_ADJUSTMENT"
    | "APPROVAL";
  primitive: DecisionPrimitive;
  status: DecisionRecord["status"];
  reasoning: string;
  confidence: number;
  createdAt: Date;
}

export interface WarehouseDecisionRequest {
  warehouseId: string;
  entityType: WarehouseDecision["entityType"];
  entityId: string;
  decisionType: WarehouseDecision["decisionType"];
  context: Record<string, any>;
  options?: {
    allowOverride?: boolean;
    requireEvidence?: boolean;
    autoApprove?: boolean;
  };
}

// ============================================================================
// WAREHOUSE DECISION INTEGRATION
// ============================================================================

class WarehouseDecisionIntegration {
  /**
   * Make warehouse decision
   */
  async makeDecision(
    request: WarehouseDecisionRequest,
  ): Promise<WarehouseDecision> {
    // Build decision context
    const decisionContext: DecisionContext = {
      module: "wms",
      entityType: request.entityType.toLowerCase(),
      entityId: request.entityId,
      tenantId: undefined, // Would get from context
      data: {
        warehouseId: request.warehouseId,
        decisionType: request.decisionType,
        ...request.context,
      },
      options: {
        allowOverride: request.options?.allowOverride,
        requireEvidence: request.options?.requireEvidence,
        autoApprove: request.options?.autoApprove,
      },
    };

    // Determine primitive based on decision type
    const primitive = this.determinePrimitive(
      request.decisionType,
      request.context,
    );

    // Create decision record
    const decisionRecord = await decisionService.create({
      entityType: request.entityType.toLowerCase(),
      entityId: request.entityId,
      tenantId: undefined,
      primitive,
      context: decisionContext,
      correlationId: `warehouse-${request.warehouseId}-${Date.now()}`,
    });

    // Map to warehouse decision
    const warehouseDecision: WarehouseDecision = {
      id: decisionRecord.id,
      warehouseId: request.warehouseId,
      entityType: request.entityType,
      entityId: request.entityId,
      decisionType: request.decisionType,
      primitive,
      status: decisionRecord.status,
      reasoning: decisionRecord.reasoning || "",
      confidence: decisionRecord.confidence || 0,
      createdAt: new Date(decisionRecord.createdAt),
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-decision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.decision.made",
      aggregateId: request.warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId: request.warehouseId,
        decisionId: decisionRecord.id,
        decisionType: request.decisionType,
      },
    });

    return warehouseDecision;
  }

  /**
   * Get decisions for warehouse entity
   */
  async getDecisions(
    warehouseId: string,
    entityType: WarehouseDecision["entityType"],
    entityId: string,
  ): Promise<WarehouseDecision[]> {
    const decisions = await decisionService.getByEntity(
      entityType.toLowerCase(),
      entityId,
    );

    return decisions
      .filter((d) => d.context.data?.warehouseId === warehouseId)
      .map((d) => this.mapToWarehouseDecision(d, warehouseId));
  }

  /**
   * Determine primitive based on decision type
   */
  private determinePrimitive(
    decisionType: WarehouseDecision["decisionType"],
    context: Record<string, any>,
  ): DecisionPrimitive {
    switch (decisionType) {
      case "PUTAWAY_LOCATION":
        return "ASSIGN_RESOURCE";
      case "PICK_PATH":
        return "REROUTE";
      case "RESOURCE_ALLOCATION":
        return "ASSIGN_RESOURCE";
      case "INVENTORY_ADJUSTMENT":
        if (context.requiresApproval) {
          return "ALLOW_WITH_CONDITIONS";
        }
        return "ALLOW";
      case "APPROVAL":
        if (context.riskLevel === "high") {
          return "ESCALATE_TO";
        }
        return "ALLOW";
      default:
        return "ALLOW";
    }
  }

  /**
   * Map decision record to warehouse decision
   */
  private mapToWarehouseDecision(
    record: DecisionRecord,
    warehouseId: string,
  ): WarehouseDecision {
    return {
      id: record.id,
      warehouseId,
      entityType:
        record.entityType.toUpperCase() as WarehouseDecision["entityType"],
      entityId: record.entityId,
      decisionType: record.context.data?.decisionType || "APPROVAL",
      primitive: record.primitive,
      status: record.status,
      reasoning: record.reasoning || "",
      confidence: record.confidence || 0,
      createdAt: new Date(record.createdAt),
    };
  }

  /**
   * Get decision statistics for warehouse
   */
  async getDecisionStatistics(warehouseId: string): Promise<{
    totalDecisions: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageConfidence: number;
  }> {
    // In production, would query by warehouseId
    const stats = await decisionService.getStatistics({
      tenantId: undefined,
      module: "wms",
    });

    return {
      totalDecisions: stats.totalDecisions,
      byType: stats.byPrimitive,
      byStatus: stats.byStatus,
      averageConfidence: stats.averageConfidence,
    };
  }
}

export const warehouseDecisionIntegration = new WarehouseDecisionIntegration();
