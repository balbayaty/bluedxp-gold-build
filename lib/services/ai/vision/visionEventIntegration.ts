/**
 * Vision Event Integration Service
 * Comprehensive event bus integration for AI Vision Module
 * Publishes and subscribes to vision-related events across the platform
 */

import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

// ============================================================================
// EVENT TYPES
// ============================================================================

export const VISION_EVENTS = {
  // Analysis Events
  ANALYSIS_CREATED: "ai.vision.analysis.created",
  ANALYSIS_UPDATED: "ai.vision.analysis.updated",
  ANALYSIS_DELETED: "ai.vision.analysis.deleted",
  ANALYSIS_COMPLETED: "ai.vision.analysis.completed",

  // Pattern Events
  PATTERN_LEARNED: "ai.vision.pattern.learned",
  PATTERN_UPDATED: "ai.vision.pattern.updated",
  PATTERN_MATCHED: "ai.vision.pattern.matched",

  // Feedback Events
  FEEDBACK_CREATED: "ai.vision.feedback.created",
  FEEDBACK_VALIDATED: "ai.vision.feedback.validated",

  // Integration Events
  DAMAGE_DETECTED: "ai.vision.damage.detected",
  COMPLIANCE_VIOLATION: "ai.vision.compliance.violation",
  SAFETY_ISSUE_DETECTED: "ai.vision.safety.issue.detected",
  QUALITY_ISSUE_DETECTED: "ai.vision.quality.issue.detected",

  // Workflow Events
  WORKFLOW_TRIGGERED: "ai.vision.workflow.triggered",
  AUTO_NCR_CREATED: "ai.vision.auto.ncr.created",
  AUTO_CAPA_CREATED: "ai.vision.auto.capa.created",
} as const;

// ============================================================================
// VISION EVENT INTEGRATION SERVICE
// ============================================================================

class VisionEventIntegrationService {
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  /**
   * Initialize event subscriptions
   */
  initialize() {
    console.log("🔗 Initializing Vision Event Integration...");

    // Subscribe to cross-module events that might trigger vision analysis
    this.subscribeToCrossModuleEvents();

    // Subscribe to vision workflow triggers
    this.subscribeToWorkflowEvents();

    console.log("✅ Vision Event Integration initialized");
  }

  /**
   * Subscribe to cross-module events
   */
  private subscribeToCrossModuleEvents() {
    // WMS Events - trigger vision analysis for damage/quality checks
    this.subscriptions.push(
      eventBus.subscribe("wms.damage.created", async (event: DomainEvent) => {
        await this.handleDamageCreated(event);
      }),
    );

    this.subscriptions.push(
      eventBus.subscribe(
        "wms.goods.receipt.created",
        async (event: DomainEvent) => {
          await this.handleGoodsReceiptCreated(event);
        },
      ),
    );

    // QHSE Events - trigger vision analysis for safety/compliance
    this.subscriptions.push(
      eventBus.subscribe(
        "qhse.incident.created",
        async (event: DomainEvent) => {
          await this.handleIncidentCreated(event);
        },
      ),
    );

    // ISO-IMS Events - trigger vision analysis for quality control
    this.subscriptions.push(
      eventBus.subscribe("iso-ims.ncr.created", async (event: DomainEvent) => {
        await this.handleNCRCreated(event);
      }),
    );

    // TMS Events - trigger vision analysis for POD verification
    this.subscriptions.push(
      eventBus.subscribe("tms.pod.created", async (event: DomainEvent) => {
        await this.handlePODCreated(event);
      }),
    );
  }

  /**
   * Subscribe to workflow events
   */
  private subscribeToWorkflowEvents() {
    // Subscribe to vision workflow triggers
    this.subscriptions.push(
      eventBus.subscribe("workflow:trigger", async (event: DomainEvent) => {
        if (event.payload?.source === "vision_analysis") {
          await this.handleWorkflowTriggered(event);
        }
      }),
    );
  }

  /**
   * Handle damage created event
   */
  private async handleDamageCreated(event: DomainEvent) {
    try {
      const { damageId, photoUrl, tenantId } = event.payload || {};

      if (photoUrl) {
        // Emit event for potential auto-vision analysis
        await eventBus.publish({
          type: VISION_EVENTS.DAMAGE_DETECTED,
          aggregateId: damageId,
          aggregateType: "Damage",
          payload: {
            damageId,
            photoUrl,
            tenantId,
            source: "wms",
          },
          metadata: {
            triggeredBy: event.type,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling damage created event:", error);
    }
  }

  /**
   * Handle goods receipt created event
   */
  private async handleGoodsReceiptCreated(event: DomainEvent) {
    try {
      const { goodsReceiptId, photoUrl, tenantId } = event.payload || {};

      if (photoUrl) {
        // Could trigger automatic quality check vision analysis
        await eventBus.publish({
          type: "ai.vision.goods.receipt.analysis.requested",
          aggregateId: goodsReceiptId,
          aggregateType: "GoodsReceipt",
          payload: {
            goodsReceiptId,
            photoUrl,
            tenantId,
            source: "wms",
          },
          metadata: {
            triggeredBy: event.type,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling goods receipt created event:", error);
    }
  }

  /**
   * Handle incident created event
   */
  private async handleIncidentCreated(event: DomainEvent) {
    try {
      const { incidentId, photoUrl, tenantId } = event.payload || {};

      if (photoUrl) {
        await eventBus.publish({
          type: VISION_EVENTS.SAFETY_ISSUE_DETECTED,
          aggregateId: incidentId,
          aggregateType: "Incident",
          payload: {
            incidentId,
            photoUrl,
            tenantId,
            source: "qhse",
          },
          metadata: {
            triggeredBy: event.type,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling incident created event:", error);
    }
  }

  /**
   * Handle NCR created event
   */
  private async handleNCRCreated(event: DomainEvent) {
    try {
      const { ncrId, photoUrl, tenantId } = event.payload || {};

      if (photoUrl) {
        await eventBus.publish({
          type: VISION_EVENTS.QUALITY_ISSUE_DETECTED,
          aggregateId: ncrId,
          aggregateType: "NCR",
          payload: {
            ncrId,
            photoUrl,
            tenantId,
            source: "iso-ims",
          },
          metadata: {
            triggeredBy: event.type,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling NCR created event:", error);
    }
  }

  /**
   * Handle POD created event
   */
  private async handlePODCreated(event: DomainEvent) {
    try {
      const { podId, photoUrl, tenantId } = event.payload || {};

      if (photoUrl) {
        await eventBus.publish({
          type: "ai.vision.pod.verification.requested",
          aggregateId: podId,
          aggregateType: "POD",
          payload: {
            podId,
            photoUrl,
            tenantId,
            source: "tms",
          },
          metadata: {
            triggeredBy: event.type,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling POD created event:", error);
    }
  }

  /**
   * Handle workflow triggered event
   */
  private async handleWorkflowTriggered(event: DomainEvent) {
    try {
      const { workflowId, data, visionAnalysisId } = event.payload || {};

      await eventBus.publish({
        type: VISION_EVENTS.WORKFLOW_TRIGGERED,
        aggregateId: visionAnalysisId,
        aggregateType: "VisionAnalysis",
        payload: {
          workflowId,
          visionAnalysisId,
          data,
        },
        metadata: {
          triggeredBy: event.type,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error handling workflow triggered event:", error);
    }
  }

  /**
   * Publish analysis completed event
   */
  async publishAnalysisCompleted(
    analysisId: string,
    tenantId: string,
    result: any,
  ) {
    await eventBus.publish({
      type: VISION_EVENTS.ANALYSIS_COMPLETED,
      aggregateId: analysisId,
      aggregateType: "VisionAnalysis",
      payload: {
        analysisId,
        tenantId,
        totalIssues: result.totalIssues || 0,
        criticalIssues: result.criticalIssues || 0,
        isCompliant: result.isCompliant,
        module: result.module,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish compliance violation event
   */
  async publishComplianceViolation(
    analysisId: string,
    tenantId: string,
    violations: any[],
  ) {
    await eventBus.publish({
      type: VISION_EVENTS.COMPLIANCE_VIOLATION,
      aggregateId: analysisId,
      aggregateType: "VisionAnalysis",
      payload: {
        analysisId,
        tenantId,
        violations,
        count: violations.length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Cleanup subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }
}

// Export singleton
export const visionEventIntegration = new VisionEventIntegrationService();

// Auto-initialize on import (in production, initialize explicitly)
if (typeof window === "undefined") {
  visionEventIntegration.initialize();
}
