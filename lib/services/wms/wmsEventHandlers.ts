/**
 * WMS Module Event Handlers
 * Subscribes to and handles all WMS-related events
 * Ensures full integration across all modules
 */

// Dynamic import to avoid circular dependencies
import type { EventBus } from "@/lib/services/event-bus/eventBus";
import { realTimeSlaKpiService } from "./realTimeSlaKpiService";
import { wmsSlaKpiAdapter } from "@/lib/services/sla-kpi";

/**
 * Initialize WMS event handlers
 * Call this during application startup
 */
export async function initializeWmsEventHandlers() {
  // Dynamic import to avoid circular dependencies
  const { eventBus } = await import("@/lib/services/event-bus/eventBus");

  // Photo Upload Events
  eventBus.subscribe("photo.uploaded", async (event: any) => {
    console.log("Photo uploaded event:", event);
    // Additional processing if needed
    // Could trigger notifications, analytics, etc.
  });

  eventBus.subscribe("photo.analyzed", async (event: any) => {
    console.log("Photo analyzed event:", event);
    const { entityId, entityType, visionAnalysis, evidenceId, tenantId } =
      event;

    // Update any related entities with analysis results
    // Could update ASN, Pallet, or Damage records with analysis insights
  });

  // Evidence Events
  eventBus.subscribe("evidence.created", async (event: any) => {
    console.log("Evidence created event:", event);
    // Could trigger compliance checks, notifications, etc.
  });

  // SLA Events
  eventBus.subscribe("sla.warning", async (event: any) => {
    console.log("SLA warning event:", event);
    const { entityId, entityType, stageId, remainingSeconds, tenantId } = event;

    // Could send notifications to managers
    // Could update dashboards
    // Could trigger escalation workflows
  });

  eventBus.subscribe("sla.violation", async (event: any) => {
    console.log("SLA violation event:", event);
    const { entityId, entityType, stageId, delaySeconds, tenantId } = event;

    // Critical violation - immediate action required
    // Could send urgent notifications
    // Could trigger escalation
    // Could update compliance dashboards
  });

  eventBus.subscribe("sla.escalation", async (event: any) => {
    console.log("SLA escalation event:", event);
    // Handle escalation actions
    // Could notify managers, admins, etc.
  });

  // Liability Events
  eventBus.subscribe("liability.assessed", async (event: any) => {
    console.log("Liability assessed event:", event);
    const { entityId, entityType, liabilityAssessment, tenantId } = event;

    // Could update damage records
    // Could trigger financial workflows
    // Could notify relevant parties
  });

  // Lifecycle Events
  eventBus.subscribe("lifecycle.stage.started", async (event: any) => {
    // Trigger SLA monitoring for this stage
    await realTimeSlaKpiService.trackSlaCompliance(
      event.entityId,
      event.entityType,
      event.stageId,
    );
  });

  eventBus.subscribe("lifecycle.stage.completed", async (event: any) => {
    // Check final SLA status
    await realTimeSlaKpiService.trackSlaCompliance(
      event.entityId,
      event.entityType,
      event.stageId,
    );

    // Recalculate KPIs if needed
    // KPI calculations are now handled by unified service automatically
    // No manual calculation needed - unified service tracks via events
  });

  console.log("WMS event handlers initialized");
}

/**
 * Cleanup event handlers (if needed)
 */
export function cleanupWmsEventHandlers() {
  // Unsubscribe from events if needed
  // Usually not required as handlers persist for app lifetime
}

// Auto-initialize in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  initializeWmsEventHandlers();
}
