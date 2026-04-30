/**
 * Performance Attribution Service
 *
 * - Listens to operational events (WMS lifecycle transitions + assignments)
 * - Creates attribution decisions (who gets credit) using a flexible policy
 * - Emits events + notifications for mismatches to discourage “cheating”
 *
 * Note: In-memory store for now; can be persisted later (Prisma/EventStore).
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  AttributionDecision,
  AttributionPolicy,
  AttributionSignals,
  AttributionContext,
  AttributionMethod,
  AttributionConfidence,
  AttributionDecisionStatus,
} from "@/types/performance-attribution";
import { employeeUserIntegrationService } from "@/lib/services/hr/integration/employeeUserIntegrationService";
import { notificationService } from "@/lib/services/notifications/notificationService";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

type Assignment = {
  entityType: string;
  entityId: string;
  tenantId: string;
  assignedEmployeeId?: string;
  assignedUserId?: string;
  assignedAt: string;
  customerId?: string;
  warehouseId?: string;
  orderId?: string;
  asnId?: string;
};

class AttributionStore {
  assignments = new Map<string, Assignment>(); // key: `${entityType}:${entityId}`
  decisions = new Map<string, AttributionDecision>(); // decisionId -> decision
  decisionsByEntity = new Map<string, string[]>(); // `${entityType}:${entityId}` -> decisionIds
}

const store = new AttributionStore();

const DEFAULT_POLICY: AttributionPolicy = {
  id: "policy-default",
  name: "Default Flexible Attribution Policy",
  version: "1.0.0",
  enabled: true,
  defaultMethod: "hybrid",
  // By default, we credit on “completed/verified/closed” stages (safer). If stage unknown, still allow but lower confidence.
  creditOnlyOnStages: [
    "PICKING_COMPLETED",
    "PICK_VERIFIED",
    "PUTAWAY_COMPLETED",
    "TASK_COMPLETED",
    "TASK_VERIFIED",
    "TASK_CLOSED",
  ],
  notifyOnMismatch: true,
  requireReviewOnMismatch: false,
};

export class PerformanceAttributionService {
  private policy: AttributionPolicy = DEFAULT_POLICY;

  setPolicy(policy: AttributionPolicy) {
    this.policy = policy;
  }

  getPolicy() {
    return this.policy;
  }

  getAssignments() {
    return Array.from(store.assignments.values());
  }

  getDecisionsForEntity(entityType: string, entityId: string) {
    const key = `${entityType}:${entityId}`;
    const ids = store.decisionsByEntity.get(key) || [];
    return ids
      .map((d) => store.decisions.get(d))
      .filter(Boolean) as AttributionDecision[];
  }

  upsertAssignment(assignment: Assignment) {
    const key = `${assignment.entityType}:${assignment.entityId}`;
    store.assignments.set(key, assignment);
  }

  /**
   * Core decision engine: choose credited employee with confidence + mismatch detection.
   */
  async decide(
    signals: AttributionSignals,
    context: AttributionContext,
  ): Promise<AttributionDecision> {
    const mismatchReasons: string[] = [];

    const assigned = signals.assignedEmployeeId;
    const actor = signals.actorEmployeeId;
    const verifier = signals.verifierEmployeeId;

    if (assigned && actor && assigned !== actor)
      mismatchReasons.push("Assigned employee differs from actor employee");
    if (verifier && actor && verifier !== actor)
      mismatchReasons.push("Verifier employee differs from actor employee");
    if (verifier && assigned && verifier !== assigned)
      mismatchReasons.push("Verifier employee differs from assigned employee");

    // Determine method
    let methodUsed: AttributionMethod = this.policy.defaultMethod;

    // Default “best practice” ranking: verifier > actor > assignment
    let attributedEmployeeId: string | undefined;
    if (verifier) {
      attributedEmployeeId = verifier;
      methodUsed = "verification";
    } else if (actor) {
      attributedEmployeeId = actor;
      methodUsed = "actor";
    } else if (assigned) {
      attributedEmployeeId = assigned;
      methodUsed = "assignment";
    } else {
      attributedEmployeeId = undefined;
      methodUsed = "hybrid";
    }

    const stageId = (context as any).stageId as string | undefined;
    const stageAllowed =
      !this.policy.creditOnlyOnStages?.length || !stageId
        ? true
        : this.policy.creditOnlyOnStages.includes(stageId);

    let confidence: AttributionConfidence = "medium";
    if (methodUsed === "verification") confidence = "high";
    if (!attributedEmployeeId) confidence = "low";
    if (!stageAllowed) confidence = "low";

    let status: AttributionDecisionStatus = "accepted";
    if (mismatchReasons.length > 0) {
      status = this.policy.requireReviewOnMismatch
        ? "pending_review"
        : "flagged";
    }
    if (!attributedEmployeeId) status = "pending_review";

    const decision: AttributionDecision = {
      id: id("attr"),
      tenantId: context.tenantId,
      policyId: this.policy.id,
      methodUsed,
      status,
      confidence,
      attributedEmployeeId,
      attributedUserId: attributedEmployeeId
        ? (await employeeUserIntegrationService.getUserIdForEmployee(
            attributedEmployeeId,
          )) || undefined
        : undefined,
      signals,
      context,
      mismatchReasons: mismatchReasons.length ? mismatchReasons : undefined,
      createdAt: new Date().toISOString(),
    };

    // Save decision
    store.decisions.set(decision.id, decision);
    const key = `${context.entityType}:${context.entityId}`;
    store.decisionsByEntity.set(key, [
      ...(store.decisionsByEntity.get(key) || []),
      decision.id,
    ]);

    // Emit decision event
    await eventBus.publish({
      id: id("evt"),
      type: "performance.attribution.decision.created",
      aggregateId: context.entityId,
      aggregateType: context.entityType,
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        tenantId: context.tenantId,
        sourceEventId: context.sourceEventId,
      },
      payload: { decision },
    } as DomainEvent);

    // Notify on mismatch (best-effort)
    if (mismatchReasons.length > 0 && this.policy.notifyOnMismatch) {
      await notificationService.send({
        type: "warning",
        priority: "high",
        channel: "in-app",
        tenantId: context.tenantId,
        title: "Attribution mismatch detected",
        message: `${context.activityType} for ${context.entityType} ${context.entityId} has conflicting attribution signals.`,
        category: "performance",
        source: "performance-attribution",
        entityId: context.entityId,
        entityType: context.entityType,
        details: mismatchReasons.join(" | "),
        data: { decisionId: decision.id, mismatchReasons, signals, context },
        actionUrl: "/performance-center",
        actionLabel: "Review",
        status: "sent",
      });
    }

    return decision;
  }
}

export const performanceAttributionService =
  new PerformanceAttributionService();

// ----------------------------------------------------------------------------
// Event wiring (server-side)
// ----------------------------------------------------------------------------

export function setupPerformanceAttributionSubscriptions(): void {
  // Capture explicit assignment events (today: warehouse.task.assigned)
  eventBus.subscribe("warehouse.task.assigned", async (event: DomainEvent) => {
    const payload = (event.payload || {}) as any;
    const assignment = payload.assignment as any;
    if (!assignment) return;

    performanceAttributionService.upsertAssignment({
      entityType: "TASK",
      entityId: assignment.taskId,
      tenantId:
        (event.metadata as any)?.tenantId || assignment.tenantId || "default",
      assignedEmployeeId: assignment.assignedEmployeeId,
      assignedAt: assignment.assignedAt
        ? new Date(assignment.assignedAt).toISOString()
        : new Date().toISOString(),
      warehouseId: assignment.warehouseId,
    });
  });

  // Derive activity-based attribution from lifecycle transitions (canonical operational stream)
  eventBus.subscribe(
    "wms.lifecycle.stage_transitioned",
    async (event: DomainEvent) => {
      const p = (event.payload || {}) as any;
      const entityType = p.entityType as string | undefined;
      const entityId = p.entityId as string | undefined;
      const toStageId = p.toStageId as string | undefined;
      const context = (p.context || {}) as Record<string, any>;

      if (!entityType || !entityId) return;

      // Only act on relevant “creditable” stages (policy can change later)
      const activityType =
        entityType === "PICKING" &&
        (toStageId === "PICKING_COMPLETED" || toStageId === "PICK_VERIFIED")
          ? "picking_completed"
          : entityType === "PUTAWAY" && toStageId === "PUTAWAY_COMPLETED"
            ? "putaway_completed"
            : entityType === "TASK" &&
                (toStageId === "TASK_COMPLETED" ||
                  toStageId === "TASK_VERIFIED" ||
                  toStageId === "TASK_CLOSED")
              ? "task_completed"
              : null;

      if (!activityType) return;

      const tenantId =
        (event.metadata as any)?.tenantId || context.tenantId || "default";
      const userId =
        (context.userId as string | undefined) ||
        (context.user?.id as string | undefined) ||
        ((event.metadata as any)?.userId as string | undefined);

      const actorEmployeeId =
        (context.employeeId as string | undefined) ||
        (context.assignedEmployeeId as string | undefined) ||
        (userId
          ? (await employeeUserIntegrationService.getEmployeeIdForUser(
              userId,
            )) || undefined
          : undefined);

      // Pull assignment if we have it
      const aKey = `${entityType}:${entityId}`;
      const assignment = store.assignments.get(aKey);

      const signals: AttributionSignals = {
        assignedEmployeeId: assignment?.assignedEmployeeId,
        assignedUserId: assignment?.assignedUserId,
        actorEmployeeId,
        actorUserId: userId,
        // verifier signals can be added later when supervisor approval events exist
      };

      const ctx: AttributionContext = {
        tenantId,
        module: "wms",
        activityType,
        entityType,
        entityId,
        customerId:
          (context.customerId as string | undefined) || assignment?.customerId,
        warehouseId:
          (context.warehouseId as string | undefined) ||
          assignment?.warehouseId,
        orderId: context.orderId as string | undefined,
        asnId: context.asnId as string | undefined,
        happenedAt: new Date(event.timestamp).toISOString(),
        sourceEventId: event.id,
        sourceEventType: event.type,
        evidenceIds: [], // Truth Engine evidence is handled in the WMS→Truth integration
      };

      // Include stageId in context for policy checks
      (ctx as any).stageId = toStageId;

      await performanceAttributionService.decide(signals, ctx);
    },
  );
}

// Auto-setup on server
if (typeof window === "undefined") {
  setupPerformanceAttributionSubscriptions();
}
