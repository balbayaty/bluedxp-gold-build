/**
 * Decision Primitives API
 * Atomic decision actions that can be composed
 * These are the building blocks of all decisions in the system
 */

import type { DecisionContext, DecisionRecord } from "./types";
import { decisionService } from "./decisionService";
import { eventBus } from "@/lib/services/event-bus";
import { auditService } from "@/lib/services/audit";

/**
 * Decision Primitives
 * Static class providing all decision primitive operations
 */
export class DecisionPrimitives {
  /**
   * ALLOW - Permit the action
   * Use when the action should be allowed without conditions
   */
  static async ALLOW(
    context: DecisionContext,
    options?: {
      reason?: string;
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    return decisionService.createDecision(context, "ALLOW", "APPROVED", {
      reason: options?.reason || "Action allowed",
      evidenceIds: options?.evidenceIds,
      decidedBy: context.userId,
      metadata: options?.metadata,
    });
  }

  /**
   * ALLOW_WITH_CONDITIONS - Permit with conditions
   * Use when the action can be allowed but requires follow-up actions
   */
  static async ALLOW_WITH_CONDITIONS(
    context: DecisionContext,
    conditions: string[],
    options?: {
      reason?: string;
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!conditions || conditions.length === 0) {
      throw new Error("Conditions are required for ALLOW_WITH_CONDITIONS");
    }

    return decisionService.createDecision(
      context,
      "ALLOW_WITH_CONDITIONS",
      "APPROVED_WITH_CONDITIONS",
      {
        reason: options?.reason || "Action allowed with conditions",
        conditions,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: options?.metadata,
      },
    );
  }

  /**
   * BLOCK - Prevent the action
   * Use when the action must be prevented
   */
  static async BLOCK(
    context: DecisionContext,
    reason: string,
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!reason) {
      throw new Error("Reason is required for BLOCK");
    }

    const decision = await decisionService.createDecision(
      context,
      "BLOCK",
      "REJECTED",
      {
        reason,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: options?.metadata,
      },
    );

    // Publish block event
    eventBus.publish("decision.blocked", {
      decisionId: decision.id,
      entityType: context.entityType,
      entityId: context.entityId,
      reason,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * HOLD_UNTIL - Temporarily hold until condition met
   * Use when the action should be paused until a specific condition is met
   */
  static async HOLD_UNTIL(
    context: DecisionContext,
    holdUntil: Date | string,
    reason: string,
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!reason) {
      throw new Error("Reason is required for HOLD_UNTIL");
    }

    const decision = await decisionService.createDecision(
      context,
      "HOLD_UNTIL",
      "ON_HOLD",
      {
        reason,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: options?.metadata,
      },
    );

    // Update with hold details
    const updated = await decisionService.updateDecisionStatus(
      decision.id,
      "ON_HOLD",
      {
        reason,
        updatedBy: context.userId,
        hold: {
          reason,
          holdUntil,
        },
      },
    );

    // Publish hold event
    eventBus.publish("decision.held", {
      decisionId: decision.id,
      entityType: context.entityType,
      entityId: context.entityId,
      reason,
      holdUntil:
        typeof holdUntil === "string" ? holdUntil : holdUntil.toISOString(),
      correlationId: decision.correlationId,
    });

    return updated;
  }

  /**
   * ESCALATE_TO - Escalate to higher authority
   * Use when the decision requires higher-level approval
   */
  static async ESCALATE_TO(
    context: DecisionContext,
    escalateTo: string,
    reason: string,
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!escalateTo || !reason) {
      throw new Error("EscalateTo and reason are required for ESCALATE_TO");
    }

    const decision = await decisionService.createDecision(
      context,
      "ESCALATE_TO",
      "ESCALATED",
      {
        reason,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: options?.metadata,
      },
    );

    // Update with escalation details
    const updated = await decisionService.updateDecisionStatus(
      decision.id,
      "ESCALATED",
      {
        reason,
        updatedBy: context.userId,
        escalation: {
          escalatedTo,
          reason,
        },
      },
    );

    // Publish escalation event
    eventBus.publish("decision.escalated", {
      decisionId: decision.id,
      entityType: context.entityType,
      entityId: context.entityId,
      escalatedTo,
      reason,
      correlationId: decision.correlationId,
    });

    return updated;
  }

  /**
   * OPEN_NCR - Open Non-Conformance Report
   * Use when a non-conformance is detected
   */
  static async OPEN_NCR(
    context: DecisionContext,
    ncrData: {
      title: string;
      description: string;
      severity: "low" | "medium" | "high" | "critical";
      category?: string;
    },
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!ncrData.title || !ncrData.description) {
      throw new Error("NCR title and description are required");
    }

    const decision = await decisionService.createDecision(
      context,
      "OPEN_NCR",
      "PENDING",
      {
        reason: `NCR opened: ${ncrData.title}`,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          ncrData,
        },
      },
    );

    // Trigger NCR creation (would integrate with QHSE module)
    eventBus.publish("ncr.opened", {
      decisionId: decision.id,
      ncrData,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * OPEN_CAPA - Open Corrective Action Preventive Action
   * Use when corrective or preventive action is required
   */
  static async OPEN_CAPA(
    context: DecisionContext,
    capaData: {
      title: string;
      description: string;
      type: "CORRECTIVE" | "PREVENTIVE";
      priority?: "low" | "medium" | "high" | "critical";
    },
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!capaData.title || !capaData.description) {
      throw new Error("CAPA title and description are required");
    }

    const decision = await decisionService.createDecision(
      context,
      "OPEN_CAPA",
      "PENDING",
      {
        reason: `CAPA opened: ${capaData.title}`,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          capaData,
        },
      },
    );

    // Trigger CAPA creation (would integrate with ISO-IMS module)
    eventBus.publish("capa.opened", {
      decisionId: decision.id,
      capaData,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * REQUEST_EVIDENCE - Request additional evidence
   * Use when additional evidence is needed to make a decision
   */
  static async REQUEST_EVIDENCE(
    context: DecisionContext,
    evidenceRequest: {
      type: string;
      description: string;
      dueDate?: Date | string;
      priority?: "low" | "medium" | "high" | "critical";
    },
    options?: {
      reason?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!evidenceRequest.type || !evidenceRequest.description) {
      throw new Error("Evidence type and description are required");
    }

    const decision = await decisionService.createDecision(
      context,
      "REQUEST_EVIDENCE",
      "PENDING",
      {
        reason:
          options?.reason || `Evidence requested: ${evidenceRequest.type}`,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          evidenceRequest,
        },
      },
    );

    // Trigger evidence request notification
    eventBus.publish("evidence.requested", {
      decisionId: decision.id,
      evidenceRequest,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * REROUTE - Reroute shipment/transport
   * Use when a route needs to be changed
   */
  static async REROUTE(
    context: DecisionContext,
    rerouteData: {
      newRoute: string;
      reason: string;
      estimatedArrival?: Date | string;
    },
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!rerouteData.newRoute || !rerouteData.reason) {
      throw new Error("New route and reason are required for REROUTE");
    }

    const decision = await decisionService.createDecision(
      context,
      "REROUTE",
      "APPROVED",
      {
        reason: rerouteData.reason,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          rerouteData,
        },
      },
    );

    // Trigger reroute action (would integrate with TMS module)
    eventBus.publish("route.rerouted", {
      decisionId: decision.id,
      rerouteData,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * RESCHEDULE - Reschedule operation
   * Use when an operation needs to be rescheduled
   */
  static async RESCHEDULE(
    context: DecisionContext,
    rescheduleData: {
      newDate: Date | string;
      reason: string;
      originalDate?: Date | string;
    },
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!rescheduleData.newDate || !rescheduleData.reason) {
      throw new Error("New date and reason are required for RESCHEDULE");
    }

    return decisionService.createDecision(context, "RESCHEDULE", "APPROVED", {
      reason: rescheduleData.reason,
      evidenceIds: options?.evidenceIds,
      decidedBy: context.userId,
      metadata: {
        ...options?.metadata,
        rescheduleData,
      },
    });
  }

  /**
   * ASSIGN_RESOURCE - Assign resource to task
   * Use when a resource needs to be assigned
   */
  static async ASSIGN_RESOURCE(
    context: DecisionContext,
    assignment: {
      resourceId: string;
      resourceType: string;
      reason?: string;
      startDate?: Date | string;
      endDate?: Date | string;
    },
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!assignment.resourceId || !assignment.resourceType) {
      throw new Error("Resource ID and type are required for ASSIGN_RESOURCE");
    }

    const decision = await decisionService.createDecision(
      context,
      "ASSIGN_RESOURCE",
      "APPROVED",
      {
        reason:
          assignment.reason || `Resource assigned: ${assignment.resourceId}`,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          assignment,
        },
      },
    );

    // Trigger resource assignment (would integrate with resource management)
    eventBus.publish("resource.assigned", {
      decisionId: decision.id,
      assignment,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * APPROVE_SPEND - Approve financial spend
   * Use when financial spend needs approval
   */
  static async APPROVE_SPEND(
    context: DecisionContext,
    spendData: {
      amount: number;
      currency: string;
      reason?: string;
      budgetCode?: string;
    },
    options?: {
      conditions?: string[];
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!spendData.amount || !spendData.currency) {
      throw new Error("Amount and currency are required for APPROVE_SPEND");
    }

    const status =
      options?.conditions && options.conditions.length > 0
        ? "APPROVED_WITH_CONDITIONS"
        : "APPROVED";

    const decision = await decisionService.createDecision(
      context,
      "APPROVE_SPEND",
      status,
      {
        reason:
          spendData.reason ||
          `Spend approved: ${spendData.amount} ${spendData.currency}`,
        conditions: options?.conditions,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          spendData,
        },
      },
    );

    // Trigger spend approval (would integrate with finance module)
    eventBus.publish("spend.approved", {
      decisionId: decision.id,
      spendData,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return decision;
  }

  /**
   * FLAG_FOR_PAYMENT_HOLD - Flag for payment hold
   * Use when payment should be held
   */
  static async FLAG_FOR_PAYMENT_HOLD(
    context: DecisionContext,
    reason: string,
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
      holdUntil?: Date | string;
    },
  ): Promise<DecisionRecord> {
    if (!reason) {
      throw new Error("Reason is required for FLAG_FOR_PAYMENT_HOLD");
    }

    const decision = await decisionService.createDecision(
      context,
      "FLAG_FOR_PAYMENT_HOLD",
      "ON_HOLD",
      {
        reason,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        metadata: {
          ...options?.metadata,
          paymentHold: {
            reason,
            holdUntil: options?.holdUntil,
          },
        },
      },
    );

    // Update with hold details
    const updated = await decisionService.updateDecisionStatus(
      decision.id,
      "ON_HOLD",
      {
        reason,
        updatedBy: context.userId,
        hold: {
          reason,
          holdUntil: options?.holdUntil,
        },
      },
    );

    // Trigger payment hold (would integrate with finance module)
    eventBus.publish("payment.hold.flagged", {
      decisionId: decision.id,
      reason,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return updated;
  }

  /**
   * OVERRIDE - Override decision with authority
   * Use when a decision needs to be overridden with proper authority
   */
  static async OVERRIDE(
    context: DecisionContext,
    overrideData: {
      reason: string;
      authority: string;
      originalDecisionId?: string;
    },
    options?: {
      evidenceIds?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    if (!overrideData.reason || !overrideData.authority) {
      throw new Error("Reason and authority are required for OVERRIDE");
    }

    const decision = await decisionService.createDecision(
      context,
      "OVERRIDE",
      "OVERRIDE_APPLIED",
      {
        reason: overrideData.reason,
        evidenceIds: options?.evidenceIds,
        decidedBy: context.userId,
        parentDecisionId: overrideData.originalDecisionId,
        metadata: {
          ...options?.metadata,
          overrideData,
        },
      },
    );

    const updated = await decisionService.updateDecisionStatus(
      decision.id,
      "OVERRIDE_APPLIED",
      {
        reason: overrideData.reason,
        updatedBy: context.userId,
        override: {
          appliedBy: context.userId || "system",
          reason: overrideData.reason,
          authority: overrideData.authority,
          originalDecisionId: overrideData.originalDecisionId,
        },
      },
    );

    // Audit override with enhanced logging
    await auditService.log({
      entityType: context.entityType as any,
      entityId: context.entityId,
      action: "override",
      userId: context.userId || "system",
      metadata: {
        decisionId: decision.id,
        overrideReason: overrideData.reason,
        authority: overrideData.authority,
        originalDecisionId: overrideData.originalDecisionId,
        correlationId: decision.correlationId,
      },
      compliance: {
        requiresAudit: true,
        complianceType: "OVERRIDE",
        regulatoryRequirement: "OVERRIDE_AUDIT_TRAIL",
      },
    });

    // Publish override event
    eventBus.publish("decision.overridden", {
      decisionId: decision.id,
      overrideData,
      entityType: context.entityType,
      entityId: context.entityId,
      correlationId: decision.correlationId,
    });

    return updated;
  }
}
