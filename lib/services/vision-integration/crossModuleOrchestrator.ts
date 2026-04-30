/**
 * Cross-Module Vision Integration Orchestrator
 * Coordinates vision analysis across all modules
 * Non-breaking: Works alongside existing integrations
 */

import { selfLearningVisionService } from "../ai/vision/v2/selfLearningVisionService";
import { liabilityEngine } from "../liability/liabilityEngine";
import { eventBus } from "../event-bus";

// ============================================================================
// TYPES
// ============================================================================

export interface VisionIntegrationContext {
  module: "wms" | "qhse" | "iso-ims" | "tms" | "hr" | "facility";
  entityType: string; // 'damage', 'incident', 'audit', 'shipment', etc.
  entityId: string;
  photo?: File | string;
  metadata?: Record<string, any>;
  tenantId?: string;
  userId?: string;
}

export interface IntegrationAction {
  type:
    | "create_ncr"
    | "create_incident"
    | "create_capa"
    | "update_inventory"
    | "notify_customer"
    | "calculate_liability"
    | "generate_claim"
    | "update_carrier_score"
    | "update_supplier_score"
    | "store_knowledge";
  module: string;
  entityType: string;
  parameters: Record<string, any>;
  priority: "low" | "medium" | "high" | "urgent";
  autoExecute: boolean;
}

export interface IntegrationResult {
  integrationId: string;
  context: VisionIntegrationContext;
  actions: IntegrationAction[];
  executedActions: Array<{
    action: IntegrationAction;
    status: "success" | "failed" | "pending" | "skipped";
    result?: any;
    error?: string;
  }>;
  recommendations: string[];
  createdAt: Date | string;
}

// ============================================================================
// CROSS-MODULE ORCHESTRATOR
// ============================================================================

class CrossModuleOrchestrator {
  /**
   * Process vision analysis and trigger cross-module actions
   */
  async processVisionIntegration(
    context: VisionIntegrationContext,
  ): Promise<IntegrationResult> {
    const integrationId = `integration-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Step 1: Analyze photo (if provided)
    let visionAnalysis = null;
    if (context.photo) {
      visionAnalysis = await selfLearningVisionService.analyzeDamagePhoto(
        context.photo,
        {
          damageRecordId: context.entityId,
          area: context.metadata?.area,
          equipment: context.metadata?.equipment,
          carrier: context.metadata?.carrier,
          tenantId: context.tenantId,
        },
      );
    }

    // Step 2: Determine actions based on module and analysis
    const actions = this.determineActions(context, visionAnalysis);

    // Step 3: Execute actions (if auto-execute enabled)
    const executedActions = await this.executeActions(
      actions,
      context,
      visionAnalysis,
    );

    // Step 4: Generate recommendations
    const recommendations = this.generateRecommendations(
      context,
      visionAnalysis,
      executedActions,
    );

    // Step 5: Publish integration event
    await eventBus.publish("vision.integration.completed", {
      integrationId,
      module: context.module,
      entityType: context.entityType,
      actionsExecuted: executedActions.filter((a) => a.status === "success")
        .length,
    });

    return {
      integrationId,
      context,
      actions,
      executedActions,
      recommendations,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Determine actions based on context and analysis
   */
  private determineActions(
    context: VisionIntegrationContext,
    visionAnalysis: any,
  ): IntegrationAction[] {
    const actions: IntegrationAction[] = [];

    // WMS Module Actions
    if (context.module === "wms") {
      if (context.entityType === "damage") {
        // Critical damage → Auto-create NCR
        if (
          visionAnalysis?.analysis?.analysis?.qualityIssues?.some(
            (q: any) => q.severity === "critical" || q.severity === "major",
          )
        ) {
          actions.push({
            type: "create_ncr",
            module: "iso-ims",
            entityType: "ncr",
            parameters: {
              source: "wms_damage",
              sourceId: context.entityId,
              severity: "high",
              description:
                visionAnalysis?.analysis?.analysis?.description ||
                "Damage detected",
            },
            priority: "high",
            autoExecute: true,
          });
        }

        // Calculate liability
        actions.push({
          type: "calculate_liability",
          module: "liability",
          entityType: "assessment",
          parameters: {
            damageRecordId: context.entityId,
            damageType: context.metadata?.damageType,
            severity: context.metadata?.severity,
            totalValue: context.metadata?.totalValue || 0,
          },
          priority: "medium",
          autoExecute: true,
        });

        // Update inventory if needed
        if (context.metadata?.updateInventory) {
          actions.push({
            type: "update_inventory",
            module: "wms",
            entityType: "inventory",
            parameters: {
              materialId: context.metadata?.materialId,
              quantity: context.metadata?.quantity,
              reason: "damage",
            },
            priority: "medium",
            autoExecute: true,
          });
        }

        // Notify customer if critical
        if (
          visionAnalysis?.analysis?.analysis?.qualityIssues?.some(
            (q: any) => q.severity === "critical",
          )
        ) {
          actions.push({
            type: "notify_customer",
            module: "customer-portal",
            entityType: "notification",
            parameters: {
              customerId: context.metadata?.customerId,
              message: "Critical damage detected in your shipment",
              damageRecordId: context.entityId,
            },
            priority: "urgent",
            autoExecute: true,
          });
        }
      }
    }

    // QHSE Module Actions
    if (context.module === "qhse") {
      if (context.entityType === "incident") {
        // Safety violation → Auto-create NCR and CAPA
        if (visionAnalysis?.analysis?.analysis?.safetyIssues?.length > 0) {
          actions.push({
            type: "create_ncr",
            module: "iso-ims",
            entityType: "ncr",
            parameters: {
              source: "qhse_incident",
              sourceId: context.entityId,
              severity: "high",
              description: "Safety violation detected",
            },
            priority: "urgent",
            autoExecute: true,
          });

          actions.push({
            type: "create_capa",
            module: "iso-ims",
            entityType: "capa",
            parameters: {
              source: "qhse_incident",
              sourceId: context.entityId,
              type: "corrective",
            },
            priority: "high",
            autoExecute: true,
          });
        }
      }
    }

    // TMS Module Actions
    if (context.module === "tms") {
      if (context.entityType === "shipment") {
        // Damage in shipment → Update carrier score
        if (visionAnalysis?.analysis?.analysis?.qualityIssues?.length > 0) {
          actions.push({
            type: "update_carrier_score",
            module: "tms",
            entityType: "carrier",
            parameters: {
              carrierId: context.metadata?.carrierId,
              scoreChange: -10, // Negative for damage
              reason: "Damage detected in shipment",
            },
            priority: "medium",
            autoExecute: true,
          });
        }
      }
    }

    // Store in knowledge base (always)
    actions.push({
      type: "store_knowledge",
      module: "knowledge-base",
      entityType: "knowledge",
      parameters: {
        analysis: visionAnalysis,
        context: context,
      },
      priority: "low",
      autoExecute: true,
    });

    return actions;
  }

  /**
   * Execute actions
   */
  private async executeActions(
    actions: IntegrationAction[],
    context: VisionIntegrationContext,
    visionAnalysis: any,
  ): Promise<IntegrationResult["executedActions"]> {
    const executedActions: IntegrationResult["executedActions"] = [];

    for (const action of actions) {
      if (!action.autoExecute) {
        executedActions.push({
          action,
          status: "skipped",
        });
        continue;
      }

      try {
        const result = await this.executeAction(
          action,
          context,
          visionAnalysis,
        );
        executedActions.push({
          action,
          status: "success",
          result,
        });
      } catch (error) {
        executedActions.push({
          action,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return executedActions;
  }

  /**
   * Execute single action
   */
  private async executeAction(
    action: IntegrationAction,
    context: VisionIntegrationContext,
    visionAnalysis: any,
  ): Promise<any> {
    switch (action.type) {
      case "create_ncr":
        // Publish event to create NCR
        await eventBus.publish("iso-ims.ncr.create", {
          ...action.parameters,
          sourceModule: context.module,
          sourceEntityId: context.entityId,
        });
        return { ncrCreated: true };

      case "create_incident":
        await eventBus.publish("qhse.incident.create", {
          ...action.parameters,
          sourceModule: context.module,
          sourceEntityId: context.entityId,
        });
        return { incidentCreated: true };

      case "create_capa":
        await eventBus.publish("iso-ims.capa.create", {
          ...action.parameters,
          sourceModule: context.module,
          sourceEntityId: context.entityId,
        });
        return { capaCreated: true };

      case "calculate_liability":
        const assessment = await liabilityEngine.assessLiability(
          action.parameters.damageRecordId,
          {
            damagePhoto: context.photo,
            damageType: action.parameters.damageType,
            severity: action.parameters.severity,
            totalValue: action.parameters.totalValue,
            tenantId: context.tenantId,
          },
        );
        return { assessmentId: assessment.id };

      case "update_inventory":
        await eventBus.publish("wms.inventory.update", {
          ...action.parameters,
          reason: "vision_analysis",
        });
        return { inventoryUpdated: true };

      case "notify_customer":
        await eventBus.publish("customer.notification.send", {
          ...action.parameters,
          type: "damage_alert",
        });
        return { notificationSent: true };

      case "update_carrier_score":
        await eventBus.publish("tms.carrier.score.update", {
          ...action.parameters,
        });
        return { scoreUpdated: true };

      case "update_supplier_score":
        await eventBus.publish("vendor.supplier.score.update", {
          ...action.parameters,
        });
        return { scoreUpdated: true };

      case "store_knowledge":
        // Already stored in self-learning service
        return { stored: true };

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    context: VisionIntegrationContext,
    visionAnalysis: any,
    executedActions: IntegrationResult["executedActions"],
  ): string[] {
    const recommendations: string[] = [];

    // Add vision analysis recommendations
    if (visionAnalysis?.preventionSuggestions?.length > 0) {
      recommendations.push(...visionAnalysis.preventionSuggestions);
    }

    // Add action-based recommendations
    const failedActions = executedActions.filter((a) => a.status === "failed");
    if (failedActions.length > 0) {
      recommendations.push(
        `Review ${failedActions.length} failed integration action(s)`,
      );
    }

    // Add module-specific recommendations
    if (context.module === "wms" && context.entityType === "damage") {
      recommendations.push("Review damage prevention procedures");
      recommendations.push("Consider additional training for handling staff");
    }

    return recommendations;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const crossModuleOrchestrator = new CrossModuleOrchestrator();
export default crossModuleOrchestrator;
