/**
 * Decision Service
 * Core service for managing decision records across the ecosystem
 * Provides lifecycle management, validation, and integration with existing services
 */

import type {
  DecisionRecord,
  DecisionStatus,
  DecisionPrimitive,
  DecisionContext,
  DecisionQuery,
  DecisionStatistics,
  ControlReference,
  ComplianceCheck,
} from "./types";
import { DECISION_STATUS_TRANSITIONS } from "./types";
import { controlsRegistry } from "./controlsRegistry";
import { evidenceService } from "@/lib/services/evidence";
import { auditService } from "@/lib/services/audit";
import { eventBus } from "@/lib/services/event-bus";

/**
 * Decision Store
 * Hybrid: Uses database when available, falls back to in-memory for development
 */
class DecisionStore {
  private decisions: Map<string, DecisionRecord> = new Map();
  private byEntity: Map<string, Set<string>> = new Map();
  private byCorrelation: Map<string, Set<string>> = new Map();
  private dbModel: any = null; // DecisionModel instance
  private useDatabase: boolean = false;

  /**
   * Initialize with database model if available
   */
  async initialize(dbModel?: any): Promise<void> {
    if (dbModel) {
      this.dbModel = dbModel;
      this.useDatabase = true;
    }
  }

  async set(decision: DecisionRecord): Promise<void> {
    if (this.useDatabase && this.dbModel) {
      await this.dbModel.create(decision);
    } else {
      // Fallback to in-memory
      this.decisions.set(decision.id, decision);

      const entityKey = `${decision.entityType}:${decision.entityId}`;
      if (!this.byEntity.has(entityKey)) {
        this.byEntity.set(entityKey, new Set());
      }
      this.byEntity.get(entityKey)!.add(decision.id);

      if (!this.byCorrelation.has(decision.correlationId)) {
        this.byCorrelation.set(decision.correlationId, new Set());
      }
      this.byCorrelation.get(decision.correlationId)!.add(decision.id);
    }
  }

  async get(id: string): Promise<DecisionRecord | undefined> {
    if (this.useDatabase && this.dbModel) {
      return await this.dbModel.getById(id);
    }
    return this.decisions.get(id);
  }

  async getByEntity(
    entityType: string,
    entityId: string,
  ): Promise<DecisionRecord[]> {
    if (this.useDatabase && this.dbModel) {
      const result = await this.dbModel.query({ entityType, entityId });
      return result.decisions;
    }

    const entityKey = `${entityType}:${entityId}`;
    const decisionIds = this.byEntity.get(entityKey);
    if (!decisionIds) return [];

    return Array.from(decisionIds)
      .map((id) => this.decisions.get(id))
      .filter((d): d is DecisionRecord => d !== undefined);
  }

  async getByCorrelation(correlationId: string): Promise<DecisionRecord[]> {
    if (this.useDatabase && this.dbModel) {
      const result = await this.dbModel.query({ correlationId });
      return result.decisions;
    }

    const decisionIds = this.byCorrelation.get(correlationId);
    if (!decisionIds) return [];

    return Array.from(decisionIds)
      .map((id) => this.decisions.get(id))
      .filter((d): d is DecisionRecord => d !== undefined);
  }

  async getAll(): Promise<DecisionRecord[]> {
    if (this.useDatabase && this.dbModel) {
      const result = await this.dbModel.query({ limit: 10000 });
      return result.decisions;
    }
    return Array.from(this.decisions.values());
  }

  async delete(id: string): Promise<boolean> {
    if (this.useDatabase && this.dbModel) {
      return await this.dbModel.delete(id);
    }

    const decision = this.decisions.get(id);
    if (!decision) return false;

    const entityKey = `${decision.entityType}:${decision.entityId}`;
    this.byEntity.get(entityKey)?.delete(id);
    this.byCorrelation.get(decision.correlationId)?.delete(id);

    return this.decisions.delete(id);
  }

  async update(
    id: string,
    updates: Partial<DecisionRecord>,
  ): Promise<DecisionRecord | null> {
    if (this.useDatabase && this.dbModel) {
      return await this.dbModel.update(id, updates);
    }

    const existing = this.decisions.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, id };
    this.decisions.set(id, updated);
    return updated;
  }
}

const store = new DecisionStore();

// Initialize with database if available
if (typeof window === "undefined") {
  // Server-side: Try to initialize with database
  import("@/lib/database/models/decisionModel")
    .then(({ DecisionModel }) => {
      import("@/lib/database/client")
        .then(({ DatabaseClient }) => {
          try {
            const db = new DatabaseClient({ type: "postgresql" } as any);
            const model = new DecisionModel(db);
            store.initialize(model).catch(console.error);
          } catch (error) {
            console.warn(
              "Database not available, using in-memory store:",
              error,
            );
          }
        })
        .catch(() => {
          // Database not available, use in-memory
        });
    })
    .catch(() => {
      // Database model not available, use in-memory
    });
}

/**
 * Decision Service
 */
class DecisionService {
  private readonly SCHEMA_VERSION = 1;

  /**
   * Create a new decision record
   */
  async createDecision(
    context: DecisionContext,
    primitive: DecisionPrimitive,
    status: DecisionStatus,
    options?: {
      reason?: string;
      conditions?: string[];
      evidenceIds?: string[];
      decidedBy?: string;
      parentDecisionId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<DecisionRecord> {
    const id = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const correlationId = this.generateCorrelationId();
    const traceId = this.generateTraceId();

    // Apply controls
    const controlsApplied = await this.applyControls(context);

    // Link evidence
    const evidenceIds = options?.evidenceIds || [];
    const evidenceHashes = await this.getEvidenceHashes(evidenceIds);

    // Check compliance
    const complianceChecks = await this.checkCompliance(context);

    // Create decision record
    const decision: DecisionRecord = {
      id,
      version: this.SCHEMA_VERSION,
      tenantId: context.tenantId,
      module: context.module,
      entityType: context.entityType,
      entityId: context.entityId,
      status,
      primitive,
      reason: options?.reason,
      conditions: options?.conditions,
      controlsApplied,
      complianceChecks,
      evidenceIds,
      evidenceHashes,
      decidedBy: options?.decidedBy || context.userId,
      decidedAt: new Date().toISOString(),
      metadata: {
        ...context.data,
        ...options?.metadata,
      },
      tags: [],
      correlationId,
      traceId,
      relatedDecisionIds: [],
      parentDecisionId: options?.parentDecisionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: options?.decidedBy || context.userId,
    };

    // Set status-specific fields
    if (status === "APPROVED" || status === "APPROVED_WITH_CONDITIONS") {
      decision.approvedBy = options?.decidedBy || context.userId;
      decision.approvedAt = new Date().toISOString();
    } else if (status === "REJECTED") {
      decision.rejectedBy = options?.decidedBy || context.userId;
      decision.rejectedAt = new Date().toISOString();
    }

    await store.set(decision);

    // Audit log
    await this.auditDecision(decision, "create");

    // Publish event
    await this.publishEvent("decision.created", decision);

    return decision;
  }

  /**
   * Update decision status
   */
  async updateDecisionStatus(
    decisionId: string,
    newStatus: DecisionStatus,
    options?: {
      reason?: string;
      updatedBy?: string;
      override?: {
        appliedBy: string;
        reason: string;
        authority: string;
        originalDecisionId?: string;
      };
      escalation?: {
        escalatedTo: string;
        reason: string;
      };
      hold?: {
        reason: string;
        holdUntil?: Date | string;
      };
    },
  ): Promise<DecisionRecord> {
    const decision = await store.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    // Validate status transition
    const validTransitions = DECISION_STATUS_TRANSITIONS[decision.status];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${decision.status} to ${newStatus}. ` +
          `Valid transitions: ${validTransitions.join(", ")}`,
      );
    }

    const previousStatus = decision.status;
    const updated: DecisionRecord = {
      ...decision,
      status: newStatus,
      reason: options?.reason || decision.reason,
      updatedAt: new Date().toISOString(),
      updatedBy: options?.updatedBy,
    };

    // Handle status-specific fields
    if (newStatus === "APPROVED" || newStatus === "APPROVED_WITH_CONDITIONS") {
      updated.approvedBy = options?.updatedBy || decision.approvedBy;
      updated.approvedAt = new Date().toISOString();
    } else if (newStatus === "REJECTED") {
      updated.rejectedBy = options?.updatedBy || decision.rejectedBy;
      updated.rejectedAt = new Date().toISOString();
    } else if (newStatus === "OVERRIDE_APPLIED" && options?.override) {
      updated.override = {
        ...options.override,
        appliedAt: new Date().toISOString(),
      };
    } else if (newStatus === "ESCALATED" && options?.escalation) {
      updated.escalatedTo = options.escalation.escalatedTo;
      updated.escalationReason = options.escalation.reason;
      updated.escalatedAt = new Date().toISOString();
      updated.escalationPath = [
        ...(decision.escalationPath || []),
        options.escalation.escalatedTo,
      ];
    } else if (newStatus === "ON_HOLD" && options?.hold) {
      updated.holdReason = options.hold.reason;
      updated.holdUntil = options.hold.holdUntil
        ? typeof options.hold.holdUntil === "string"
          ? options.hold.holdUntil
          : options.hold.holdUntil.toISOString()
        : undefined;
      updated.holdAppliedBy = options?.updatedBy;
      updated.holdAppliedAt = new Date().toISOString();
    } else if (newStatus === "CLOSED") {
      updated.closedAt = new Date().toISOString();
      updated.closedBy = options?.updatedBy;
    }

    await store.set(updated);

    // Audit log
    await this.auditDecision(updated, "update", {
      previousStatus,
      newStatus,
    });

    // Publish event
    await this.publishEvent("decision.updated", updated, {
      previousStatus,
    });

    return updated;
  }

  /**
   * Get decision by ID
   */
  async getDecision(id: string): Promise<DecisionRecord | null> {
    return (await store.get(id)) || null;
  }

  /**
   * Get decisions for entity
   */
  async getDecisionsForEntity(
    entityType: string,
    entityId: string,
    tenantId?: string,
  ): Promise<DecisionRecord[]> {
    let decisions = await store.getByEntity(entityType, entityId);

    if (tenantId) {
      decisions = decisions.filter((d) => d.tenantId === tenantId);
    }

    return decisions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Query decisions
   */
  async queryDecisions(query: DecisionQuery): Promise<{
    decisions: DecisionRecord[];
    total: number;
  }> {
    // If using database, use model query
    if (store["useDatabase"] && store["dbModel"]) {
      return await store["dbModel"].query({
        tenantId: query.tenantId,
        module: query.module,
        entityType: query.entityType,
        entityId: query.entityId,
        status: query.status,
        primitive: query.primitive,
        decidedBy: query.decidedBy,
        dateRange: query.dateRange,
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
    }

    let decisions = await store.getAll();

    // Apply filters
    if (query.tenantId) {
      decisions = decisions.filter((d) => d.tenantId === query.tenantId);
    }
    if (query.module) {
      decisions = decisions.filter((d) => d.module === query.module);
    }
    if (query.entityType) {
      decisions = decisions.filter((d) => d.entityType === query.entityType);
    }
    if (query.entityId) {
      decisions = decisions.filter((d) => d.entityId === query.entityId);
    }
    if (query.status && query.status.length > 0) {
      decisions = decisions.filter((d) => query.status!.includes(d.status));
    }
    if (query.primitive && query.primitive.length > 0) {
      decisions = decisions.filter((d) =>
        query.primitive!.includes(d.primitive),
      );
    }
    if (query.decidedBy) {
      decisions = decisions.filter((d) => d.decidedBy === query.decidedBy);
    }
    if (query.dateRange) {
      const from = new Date(query.dateRange.from).getTime();
      const to = new Date(query.dateRange.to).getTime();
      decisions = decisions.filter((d) => {
        const created = new Date(d.createdAt).getTime();
        return created >= from && created <= to;
      });
    }
    if (query.tags && query.tags.length > 0) {
      decisions = decisions.filter((d) =>
        query.tags!.some((tag) => d.tags.includes(tag)),
      );
    }
    if (query.correlationId) {
      decisions = await store.getByCorrelation(query.correlationId);
    }
    if (query.traceId) {
      decisions = decisions.filter((d) => d.traceId === query.traceId);
    }

    const total = decisions.length;

    // Sort
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";
    decisions.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Paginate
    if (query.offset) {
      decisions = decisions.slice(query.offset);
    }
    if (query.limit) {
      decisions = decisions.slice(0, query.limit);
    }

    return { decisions, total };
  }

  /**
   * Get decision statistics
   */
  async getStatistics(tenantId?: string): Promise<DecisionStatistics> {
    // If using database, use model statistics
    if (store["useDatabase"] && store["dbModel"]) {
      const dbStats = await store["dbModel"].getStatistics(tenantId);
      // Convert to DecisionStatistics format
      return {
        total: dbStats.total,
        byStatus: dbStats.byStatus as any,
        byPrimitive: dbStats.byPrimitive as any,
        byModule: dbStats.byModule,
        byEntityType: dbStats.byEntityType,
        averageDecisionTime: 0, // Would need to calculate from DB
        escalationRate: 0,
        overrideRate: 0,
        complianceRate: 0,
        recentDecisions: [],
        pendingDecisions: [],
        escalatedDecisions: [],
      };
    }

    let decisions = await store.getAll();

    if (tenantId) {
      decisions = decisions.filter((d) => d.tenantId === tenantId);
    }

    const stats: DecisionStatistics = {
      total: decisions.length,
      byStatus: {} as Record<DecisionStatus, number>,
      byPrimitive: {} as Record<DecisionPrimitive, number>,
      byModule: {},
      byEntityType: {},
      averageDecisionTime: 0,
      escalationRate: 0,
      overrideRate: 0,
      complianceRate: 0,
      recentDecisions: [],
      pendingDecisions: [],
      escalatedDecisions: [],
    };

    // Initialize counters
    const statuses: DecisionStatus[] = [
      "DRAFT",
      "PENDING",
      "APPROVED",
      "APPROVED_WITH_CONDITIONS",
      "REJECTED",
      "ESCALATED",
      "CLOSED",
      "ON_HOLD",
      "OVERRIDE_APPLIED",
    ];
    statuses.forEach((status) => {
      stats.byStatus[status] = 0;
    });

    const primitives: DecisionPrimitive[] = [
      "ALLOW",
      "ALLOW_WITH_CONDITIONS",
      "BLOCK",
      "HOLD_UNTIL",
      "ESCALATE_TO",
      "OPEN_NCR",
      "OPEN_CAPA",
      "REQUEST_EVIDENCE",
      "REROUTE",
      "RESCHEDULE",
      "ASSIGN_RESOURCE",
      "APPROVE_SPEND",
      "FLAG_FOR_PAYMENT_HOLD",
      "OVERRIDE",
    ];
    primitives.forEach((primitive) => {
      stats.byPrimitive[primitive] = 0;
    });

    // Calculate statistics
    let totalDecisionTime = 0;
    let decisionsWithTime = 0;
    let escalatedCount = 0;
    let overriddenCount = 0;
    let compliantCount = 0;

    decisions.forEach((decision) => {
      // Count by status
      stats.byStatus[decision.status] =
        (stats.byStatus[decision.status] || 0) + 1;

      // Count by primitive
      stats.byPrimitive[decision.primitive] =
        (stats.byPrimitive[decision.primitive] || 0) + 1;

      // Count by module
      stats.byModule[decision.module] =
        (stats.byModule[decision.module] || 0) + 1;

      // Count by entity type
      stats.byEntityType[decision.entityType] =
        (stats.byEntityType[decision.entityType] || 0) + 1;

      // Calculate decision time
      if (decision.decidedAt) {
        const created = new Date(decision.createdAt).getTime();
        const decided = new Date(decision.decidedAt).getTime();
        totalDecisionTime += decided - created;
        decisionsWithTime++;
      }

      // Count escalations
      if (decision.status === "ESCALATED") {
        escalatedCount++;
      }

      // Count overrides
      if (decision.status === "OVERRIDE_APPLIED" || decision.override) {
        overriddenCount++;
      }

      // Count compliant (all controls passed)
      const allControlsPassed = decision.controlsApplied.every(
        (c) => c.result === "PASS",
      );
      if (allControlsPassed) {
        compliantCount++;
      }
    });

    stats.averageDecisionTime =
      decisionsWithTime > 0 ? totalDecisionTime / decisionsWithTime : 0;

    stats.escalationRate =
      decisions.length > 0 ? (escalatedCount / decisions.length) * 100 : 0;

    stats.overrideRate =
      decisions.length > 0 ? (overriddenCount / decisions.length) * 100 : 0;

    stats.complianceRate =
      decisions.length > 0 ? (compliantCount / decisions.length) * 100 : 0;

    // Get recent decisions (last 10)
    stats.recentDecisions = decisions
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    // Get pending decisions
    stats.pendingDecisions = decisions
      .filter((d) => d.status === "PENDING")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    // Get escalated decisions
    stats.escalatedDecisions = decisions
      .filter((d) => d.status === "ESCALATED")
      .sort(
        (a, b) =>
          new Date(a.escalatedAt || a.createdAt).getTime() -
          new Date(b.escalatedAt || b.createdAt).getTime(),
      );

    return stats;
  }

  /**
   * Apply controls from registry
   */
  private async applyControls(
    context: DecisionContext,
  ): Promise<ControlReference[]> {
    // Get applicable controls
    const applicableControls = await controlsRegistry.getApplicableControls(
      context.module,
      context.entityType,
      context.tenantId,
    );

    // Validate controls
    const results: ControlReference[] = [];

    for (const control of applicableControls) {
      // Skip if control is in override list
      if (
        context.controlOverrides &&
        context.controlOverrides[control.id] === "skip"
      ) {
        continue;
      }

      const validation = await controlsRegistry.validateControl(control, {
        ...context.data,
        module: context.module,
        entityType: context.entityType,
        tenantId: context.tenantId,
      });

      results.push({
        controlId: control.id,
        controlType: control.type,
        reference: control.reference,
        category: control.category,
        version: control.version,
        appliedAt: new Date().toISOString(),
        result: validation.passed ? "PASS" : "FAIL",
        notes: validation.notes,
        severity: control.severity,
        evidenceIds: validation.evidenceIds,
      });
    }

    return results;
  }

  /**
   * Check compliance
   */
  private async checkCompliance(
    context: DecisionContext,
  ): Promise<ComplianceCheck[]> {
    try {
      // Import compliance service dynamically to avoid circular dependencies
      const { performComplianceCheck, getComplianceRecord } =
        await import("@/lib/services/compliance/complianceService");

      // Check if there's an existing compliance record for this entity
      // If not, we'll create a basic compliance check based on controls
      const checks: ComplianceCheck[] = [];

      // For now, derive compliance from controls applied
      // In a full implementation, we would:
      // 1. Check for existing compliance records
      // 2. Create compliance record if needed
      // 3. Perform compliance check
      // 4. Map results to ComplianceCheck format

      // Basic compliance check based on context
      if (context.data?.complianceStatus) {
        checks.push({
          status:
            context.data.complianceStatus === "COMPLIANT"
              ? "COMPLIANT"
              : context.data.complianceStatus === "NON_COMPLIANT"
                ? "NON_COMPLIANT"
                : "PENDING_REVIEW",
          checkedAt: new Date().toISOString(),
          checkedBy: context.userId,
          notes: `Compliance status: ${context.data.complianceStatus}`,
          score:
            context.data.complianceStatus === "COMPLIANT"
              ? 100
              : context.data.complianceStatus === "NON_COMPLIANT"
                ? 0
                : 50,
        });
      }

      return checks;
    } catch (error) {
      console.error("Failed to check compliance:", error);
      // Return empty array on error to not block decision creation
      return [];
    }
  }

  /**
   * Get evidence hashes
   */
  private async getEvidenceHashes(evidenceIds: string[]): Promise<string[]> {
    const hashes: string[] = [];
    for (const id of evidenceIds) {
      try {
        const evidence = await evidenceService.get(id);
        if (evidence) {
          hashes.push(evidence.hash);
        }
      } catch (error) {
        console.warn(`Failed to get evidence ${id}:`, error);
      }
    }
    return hashes;
  }

  /**
   * Audit decision
   */
  private async auditDecision(
    decision: DecisionRecord,
    action: "create" | "update" | "delete",
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await auditService.log({
        entityType: decision.entityType as any,
        entityId: decision.entityId,
        action: action as any,
        userId: decision.updatedBy || decision.createdBy || "system",
        changes: metadata
          ? [
              {
                field: "status",
                oldValue: (metadata as any).previousStatus,
                newValue: (metadata as any).newStatus || decision.status,
              },
            ]
          : undefined,
        metadata: {
          decisionId: decision.id,
          correlationId: decision.correlationId,
          traceId: decision.traceId,
          module: decision.module,
          primitive: decision.primitive,
          ...metadata,
        },
        compliance: {
          requiresAudit: true,
          complianceType: "DECISION",
        },
      });
    } catch (error) {
      console.error("Failed to audit decision:", error);
    }
  }

  /**
   * Publish event
   */
  private async publishEvent(
    eventType: string,
    decision: DecisionRecord,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      eventBus.publish(eventType, {
        decisionId: decision.id,
        module: decision.module,
        entityType: decision.entityType,
        entityId: decision.entityId,
        status: decision.status,
        primitive: decision.primitive,
        correlationId: decision.correlationId,
        traceId: decision.traceId,
        ...metadata,
      });
    } catch (error) {
      console.error("Failed to publish decision event:", error);
    }
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const decisionService = new DecisionService();
