/**
 * Truth Engine Service
 * Core service for evidence-based, audit-ready, adversarially reviewed platform layer
 *
 * This service integrates with:
 * - Evidence Service (for evidence management)
 * - Event Store (for event storage)
 * - Event Bus (for event publishing)
 * - Audit Service (for audit trails)
 *
 * @module lib/services/truth-engine/truthEngineService
 */

import { evidenceService } from "@/lib/services/evidence/evidenceService";
import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { auditService } from "@/lib/services/audit/auditService";
import { truthEngineDatabaseAdapter } from "./storage/databaseAdapter";
import { truthEngineCache } from "./cache/truthEngineCache";
import { truthEngineMetrics } from "./monitoring/metrics";
import { validateTruthEvent, sanitizeTruthEvent } from "./security/validation";
import { evaluateFormula } from "./kpi/formulaEngine";
import { detectTimelineGapsEnhanced } from "./analytics/gapDetectionService";
import { generatePersonaReviewWithLLM } from "./adversarial/llmReviewService";
import crypto from "crypto";
import {
  TruthEvent,
  TruthEvidenceItem,
  TruthEventType,
  AdversarialReview,
  TruthKPI,
  TruthTimeline,
  TruthEngineService,
  DecisionObject,
  ReviewContext,
  KPIFilters,
  TimelineFilters,
  TruthEventSearchQuery,
  TruthEventSearchResult,
  TimelineValidationResult,
  BoardBrief,
  BoardSignal,
  AdversarialInsight,
  BoardRecommendation,
  PersonaReview,
  Risk,
  Control,
  Action,
  Blocker,
  KPIBreakdown,
  TimelineGap,
  EvidenceSourceSystem,
} from "@/types/truth-engine";
import { Evidence } from "@/types/evidence";
import { DomainEvent } from "@/types/cqrs";

// ============================================================================
// IN-MEMORY STORAGE (Fallback when database not available)
// ============================================================================

class TruthEngineStore {
  private truthEvents: Map<string, TruthEvent> = new Map();
  private truthKPIs: Map<string, TruthKPI> = new Map();
  private adversarialReviews: Map<string, AdversarialReview> = new Map();
  private boardBriefs: Map<string, BoardBrief> = new Map();
  private kpiRegistry: Map<
    string,
    Omit<
      TruthKPI,
      "id" | "value" | "calculatedAt" | "evidenceIds" | "breakdown"
    >
  > = new Map();

  // Truth Events
  getTruthEvent(id: string): TruthEvent | undefined {
    return this.truthEvents.get(id);
  }

  setTruthEvent(event: TruthEvent): void {
    this.truthEvents.set(event.id, event);
  }

  getAllTruthEvents(): TruthEvent[] {
    return Array.from(this.truthEvents.values());
  }

  // Truth KPIs
  getTruthKPI(id: string): TruthKPI | undefined {
    return this.truthKPIs.get(id);
  }

  setTruthKPI(kpi: TruthKPI): void {
    this.truthKPIs.set(kpi.id, kpi);
  }

  getAllTruthKPIs(): TruthKPI[] {
    return Array.from(this.truthKPIs.values());
  }

  // KPI Registry
  registerKPIDefinition(
    name: string,
    definition: Omit<
      TruthKPI,
      "id" | "value" | "calculatedAt" | "evidenceIds" | "breakdown"
    >,
  ): void {
    this.kpiRegistry.set(name, definition);
  }

  getKPIDefinition(
    name: string,
  ):
    | Omit<
        TruthKPI,
        "id" | "value" | "calculatedAt" | "evidenceIds" | "breakdown"
      >
    | undefined {
    return this.kpiRegistry.get(name);
  }

  // Adversarial Reviews
  getAdversarialReview(id: string): AdversarialReview | undefined {
    return this.adversarialReviews.get(id);
  }

  setAdversarialReview(review: AdversarialReview): void {
    this.adversarialReviews.set(review.id, review);
  }

  getAllAdversarialReviews(): AdversarialReview[] {
    return Array.from(this.adversarialReviews.values());
  }

  // Board Briefs
  getBoardBrief(id: string): BoardBrief | undefined {
    return this.boardBriefs.get(id);
  }

  setBoardBrief(brief: BoardBrief): void {
    this.boardBriefs.set(brief.id, brief);
  }
}

const store = new TruthEngineStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// ============================================================================
// EVIDENCE OPERATIONS
// ============================================================================

async function recordEvidence(
  evidence: Omit<
    TruthEvidenceItem,
    "id" | "createdAt" | "updatedAt" | "lineage" | "hash"
  > & { content?: string | Buffer },
): Promise<TruthEvidenceItem> {
  // Use existing evidence service, extend with Truth-specific fields
  const created = await evidenceService.create({
    ...evidence,
    metadata: {
      ...evidence.metadata,
      sourceSystem: evidence.sourceSystem,
      truthEngine: true,
    },
  });

  // Create TruthEvidenceItem with enhanced chain of custody
  const truthEvidence: TruthEvidenceItem = {
    ...created,
    sourceSystem: evidence.sourceSystem,
    chainOfCustody: evidence.chainOfCustody || [],
    truthMetadata: {
      automaticallyCaptured:
        evidence.truthMetadata?.automaticallyCaptured || false,
      requiresValidation: evidence.truthMetadata?.requiresValidation || false,
      validationDeadline: evidence.truthMetadata?.validationDeadline,
      relatedTruthEventIds: evidence.truthMetadata?.relatedTruthEventIds || [],
    },
  };

  // Log to audit
  await auditService.log({
    entityType: "evidence",
    entityId: truthEvidence.id,
    action: "create",
    userId: truthEvidence.createdBy || "system",
    userName: "Truth Engine",
    changes: [
      {
        field: "sourceSystem",
        oldValue: undefined,
        newValue: truthEvidence.sourceSystem,
      },
      { field: "type", oldValue: undefined, newValue: truthEvidence.type },
    ],
    metadata: {
      truthEngine: "true",
    },
    compliance: {
      requiresAudit: true,
    },
  });

  return truthEvidence;
}

// ============================================================================
// TRUTH EVENT OPERATIONS
// ============================================================================

async function recordTruthEvent(
  event: Omit<TruthEvent, "id" | "createdAt">,
): Promise<TruthEvent> {
  try {
    // 1. Validate input
    const validation = validateTruthEvent(event);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // 2. Sanitize input
    const sanitized = sanitizeTruthEvent(event);

    const truthEvent: TruthEvent = {
      ...sanitized,
      id: generateId("truth"),
      createdAt: new Date().toISOString(),
      status: sanitized.status || "active",
    } as TruthEvent;

    // Validate evidence links exist
    if (truthEvent.evidenceLinks.length === 0) {
      console.warn(
        `TruthEvent ${truthEvent.id} has no evidence links - this violates Truth Engine principles`,
      );
      truthEngineMetrics.recordError();
    }

    // 3. Store in database (with fallback to memory)
    try {
      await truthEngineDatabaseAdapter.saveTruthEvent(truthEvent);
    } catch (dbError) {
      console.warn("Database save failed, using memory store:", dbError);
      store.setTruthEvent(truthEvent);
    }

    // 4. Cache event
    await truthEngineCache.cacheEvent(truthEvent);

    // 5. Record metrics
    truthEngineMetrics.recordEvent(
      truthEvent.confidenceScore,
      truthEvent.evidenceLinks.length > 0,
    );

    // Store in event store as DomainEvent
    const domainEvent: DomainEvent = createEvent(
      `truth.${truthEvent.eventType}`,
      truthEvent.entityRefs.shipmentId ||
        truthEvent.entityRefs.customerId ||
        truthEvent.entityRefs.orderId ||
        "unknown",
      "truth_event",
      truthEvent,
      1,
      {
        correlationId: `truth-${truthEvent.id}`,
        tenantId: truthEvent.tenantId,
        userId: event.actor.id,
        schemaVersion: 1,
        tags: {
          truthEngine: "true",
          eventType: truthEvent.eventType,
          confidence: truthEvent.confidenceScore.toString(),
        },
      },
    );

    await eventStore.append([domainEvent]);
    await eventBus.publish(domainEvent);

    // 6. Log to audit
    await auditService.log({
      entityType: "truth_event",
      entityId: truthEvent.id,
      action: "create",
      userId: event.actor.id || "system",
      userName: event.actor.name || "System",
      changes: [
        {
          field: "eventType",
          oldValue: undefined,
          newValue: truthEvent.eventType,
        },
        {
          field: "confidenceScore",
          oldValue: undefined,
          newValue: truthEvent.confidenceScore,
        },
        {
          field: "evidenceCount",
          oldValue: undefined,
          newValue: truthEvent.evidenceLinks.length,
        },
      ],
      metadata: {
        truthEngine: "true",
      },
      compliance: {
        requiresAudit: true,
      },
    });

    return truthEvent;
  } catch (error) {
    truthEngineMetrics.recordError();
    throw error;
  }
}

async function linkEvidenceToEvent(
  eventId: string,
  evidenceIds: string[],
): Promise<TruthEvent> {
  const event = store.getTruthEvent(eventId);
  if (!event) {
    throw new Error(`TruthEvent ${eventId} not found`);
  }

  // Verify evidence exists
  for (const evidenceId of evidenceIds) {
    const evidence = await evidenceService.get(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }
  }

  // Update event
  const updated: TruthEvent = {
    ...event,
    evidenceLinks: [...new Set([...event.evidenceLinks, ...evidenceIds])],
    updatedAt: new Date().toISOString(),
  };

  store.setTruthEvent(updated);

  // Log to audit
  await auditService.log({
    entityType: "truth_event",
    entityId: eventId,
    action: "update",
    userId: "system",
    userName: "Truth Engine",
    changes: [
      {
        field: "evidenceLinks",
        oldValue: event.evidenceLinks.length,
        newValue: updated.evidenceLinks.length,
      },
    ],
    metadata: {},
    compliance: {
      requiresAudit: true,
    },
  });

  return updated;
}

async function getTruthTimeline(
  entityType: string,
  entityId: string,
  filters?: TimelineFilters,
): Promise<TruthTimeline> {
  // Check cache first
  const cached = await truthEngineCache.getCachedTimeline(entityType, entityId);
  if (cached) {
    return cached;
  }

  // Get events from database (with fallback to memory)
  let events: TruthEvent[];
  try {
    const dbResult = await truthEngineDatabaseAdapter.getTruthEventsByEntity(
      entityType,
      entityId,
      {
        eventTypes: filters?.eventTypes,
        dateFrom: filters?.dateFrom
          ? typeof filters.dateFrom === "string"
            ? filters.dateFrom
            : filters.dateFrom.toISOString()
          : undefined,
        dateTo: filters?.dateTo
          ? typeof filters.dateTo === "string"
            ? filters.dateTo
            : filters.dateTo.toISOString()
          : undefined,
        minConfidence: filters?.minConfidence,
      },
    );
    // If database is not set, dbResult will be empty array, fall back to memory
    if (dbResult.length === 0) {
      throw new Error("Database not available, using memory store");
    }
    events = dbResult;
  } catch (dbError) {
    // Fallback to memory store
    const allEvents = store.getAllTruthEvents();
    events = allEvents.filter((e) => {
      const entityRef = (e.entityRefs as any)[`${entityType}Id`];
      return entityRef === entityId;
    });
  }

  // Apply filters
  if (filters?.eventTypes) {
    events = events.filter((e) => filters.eventTypes!.includes(e.eventType));
  }
  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    events = events.filter((e) => new Date(e.happenedAt).getTime() >= from);
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    events = events.filter((e) => new Date(e.happenedAt).getTime() <= to);
  }
  if (filters?.minConfidence !== undefined) {
    events = events.filter((e) => e.confidenceScore >= filters.minConfidence!);
  }
  if (filters?.includeDisputed === false) {
    events = events.filter((e) => e.status !== "disputed");
  }

  // Sort by happenedAt
  events.sort(
    (a, b) =>
      new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
  );

  // Get all evidence
  const evidenceIds = new Set<string>();
  events.forEach((e) => e.evidenceLinks.forEach((id) => evidenceIds.add(id)));

  const evidence = await Promise.all(
    Array.from(evidenceIds).map((id) => evidenceService.get(id)),
  );
  const truthEvidence = evidence.filter(Boolean) as TruthEvidenceItem[];

  // Calculate overall confidence
  const confidenceScore =
    events.length > 0
      ? events.reduce((sum, e) => sum + e.confidenceScore, 0) / events.length
      : 0;

  // Detect gaps using enhanced gap detection
  const gaps = detectTimelineGapsEnhanced(events, entityType, {
    enableMLPrediction: true,
    timeWindowHours: 24,
  });

  const timeline: TruthTimeline = {
    entityType,
    entityId,
    events,
    evidence: truthEvidence,
    confidenceScore,
    gaps,
  };

  // Cache timeline
  await truthEngineCache.cacheTimeline(entityType, entityId, timeline);

  return timeline;
}

function detectTimelineGaps(
  events: TruthEvent[],
  entityType: string,
  entityId: string,
): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  // Sort events by happenedAt
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
  );

  // Check for time gaps (more than 24 hours between events)
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];
    const gapHours =
      (new Date(next.happenedAt).getTime() -
        new Date(current.happenedAt).getTime()) /
      (1000 * 60 * 60);

    if (gapHours > 24) {
      gaps.push({
        id: generateId("gap"),
        type: "time_gap",
        description: `Gap of ${Math.round(gapHours)} hours between events`,
        startTime: current.happenedAt,
        endTime: next.happenedAt,
        severity: gapHours > 72 ? "HIGH" : gapHours > 48 ? "MEDIUM" : "LOW",
        suggestedActions: [
          "Review events in this period",
          "Check for missing evidence",
        ],
      });
    }
  }

  // Check for events with no evidence
  events.forEach((event) => {
    if (event.evidenceLinks.length === 0) {
      gaps.push({
        id: generateId("gap"),
        type: "missing_evidence",
        description: `Event ${event.eventType} has no evidence`,
        severity: "MEDIUM",
        suggestedActions: [
          "Add evidence to this event",
          "Review event validity",
        ],
      });
    }
  });

  return gaps;
}

async function disputeEvent(
  eventId: string,
  disputedBy: string,
  reason: string,
): Promise<TruthEvent> {
  const event = store.getTruthEvent(eventId);
  if (!event) {
    throw new Error(`TruthEvent ${eventId} not found`);
  }

  const updated: TruthEvent = {
    ...event,
    status: "disputed",
    disputedBy,
    disputedAt: new Date().toISOString(),
    disputeReason: reason,
    updatedAt: new Date().toISOString(),
  };

  store.setTruthEvent(updated);

  // Log to audit
  await auditService.log({
    entityType: "truth_event",
    entityId: eventId,
    action: "dispute",
    userId: disputedBy,
    userName: "User",
    changes: [
      { field: "status", oldValue: event.status, newValue: "disputed" },
      { field: "disputeReason", oldValue: undefined, newValue: reason },
    ],
    metadata: {},
    compliance: {
      requiresAudit: true,
    },
  });

  return updated;
}

async function correctEvent(
  eventId: string,
  correctedEvent: Omit<TruthEvent, "id" | "createdAt">,
): Promise<TruthEvent> {
  const original = store.getTruthEvent(eventId);
  if (!original) {
    throw new Error(`TruthEvent ${eventId} not found`);
  }

  // Create corrected event
  const corrected = await recordTruthEvent({
    ...correctedEvent,
    entityRefs: {
      ...original.entityRefs,
      ...correctedEvent.entityRefs,
    },
    evidenceLinks: [...original.evidenceLinks, ...correctedEvent.evidenceLinks],
  });

  // Mark original as corrected
  const updatedOriginal: TruthEvent = {
    ...original,
    status: "corrected",
    correctedEventId: corrected.id,
    updatedAt: new Date().toISOString(),
  };
  store.setTruthEvent(updatedOriginal);

  return corrected;
}

// ============================================================================
// ADVERSARIAL REVIEW OPERATIONS
// ============================================================================

async function reviewDecision(
  decision: DecisionObject,
  context: ReviewContext,
): Promise<AdversarialReview> {
  const startTime = Date.now();

  // Generate persona reviews
  const regulatorReview = await reviewAsRegulator(decision, context);
  const cfoReview = await reviewAsCFO(decision, context);
  const competitorReview = await reviewAsCompetitor(decision, context);
  const litigatorReview = await reviewAsLitigator(decision, context);

  // Aggregate findings
  const allRisks = [
    ...regulatorReview.risks,
    ...cfoReview.risks,
    ...competitorReview.risks,
    ...litigatorReview.risks,
  ];

  const allMissingEvidence = new Set([
    ...regulatorReview.missingEvidence,
    ...cfoReview.missingEvidence,
    ...competitorReview.missingEvidence,
    ...litigatorReview.missingEvidence,
  ]);

  const allRequiredControls = [
    ...regulatorReview.requiredControls,
    ...cfoReview.requiredControls,
    ...competitorReview.requiredControls,
    ...litigatorReview.requiredControls,
  ];

  const allRecommendedActions = [
    ...regulatorReview.recommendedActions,
    ...cfoReview.recommendedActions,
    ...competitorReview.recommendedActions,
    ...litigatorReview.recommendedActions,
  ];

  // Determine overall risk
  const severities = [
    regulatorReview.severity,
    cfoReview.severity,
    competitorReview.severity,
    litigatorReview.severity,
  ];
  const overallRisk = determineOverallRisk(severities);

  // Identify blockers
  const blockers = identifyBlockers(
    allRisks,
    Array.from(allMissingEvidence),
    allRequiredControls,
  );

  // Generate prompt hash for audit determinism
  const promptContent = JSON.stringify({
    decision,
    context,
    timestamp: new Date().toISOString(),
  });
  const promptHash = generateHash(promptContent);

  const review: AdversarialReview = {
    id: generateId("review"),
    decisionId: decision.id,
    decisionType: decision.type,
    personas: {
      regulator: regulatorReview,
      cfo: cfoReview,
      competitor: competitorReview,
      litigator: litigatorReview,
    },
    overallRisk,
    overallConfidence: calculateOverallConfidence([
      regulatorReview.confidence,
      cfoReview.confidence,
      competitorReview.confidence,
      litigatorReview.confidence,
    ]),
    missingEvidence: Array.from(allMissingEvidence),
    requiredControls: deduplicateControls(allRequiredControls),
    recommendedActions: deduplicateActions(allRecommendedActions),
    blockers,
    reviewedAt: new Date().toISOString(),
    reviewedBy: context.userId,
    reviewMethod: "rules_engine", // Can be enhanced with LLM
    promptHash,
    reviewDuration: Date.now() - startTime,
    relatedTruthEvents: context.relatedTruthEvents,
    relatedEvidence: context.relatedEvidence,
  };

  store.setAdversarialReview(review);

  // Log to audit
  await auditService.log({
    entityType: "adversarial_review",
    entityId: review.id,
    action: "create",
    userId: context.userId || "system",
    userName: "Truth Engine",
    changes: [
      { field: "decisionId", oldValue: undefined, newValue: decision.id },
      { field: "overallRisk", oldValue: undefined, newValue: overallRisk },
      { field: "blockerCount", oldValue: undefined, newValue: blockers.length },
    ],
    metadata: {
      promptHash,
    },
    compliance: {
      requiresAudit: true,
    },
  });

  return review;
}

async function reviewAsRegulator(
  decision: DecisionObject,
  context: ReviewContext,
): Promise<PersonaReview> {
  // Rules-based regulator review
  const risks: Risk[] = [];
  const missingEvidence: string[] = [];
  const requiredControls: Control[] = [];
  const recommendedActions: Action[] = [];

  // Check for compliance evidence
  if (
    decision.type === "compliance_override" ||
    decision.type === "regulatory_waiver"
  ) {
    risks.push({
      id: generateId("risk"),
      description: "Regulatory override requires additional documentation",
      severity: "HIGH",
      likelihood: 0.8,
      impact: "Potential regulatory violation",
      evidenceRefs: [],
    });
    missingEvidence.push("regulatory_approval", "compliance_justification");
    requiredControls.push({
      id: generateId("control"),
      description: "Regulatory approval document required",
      type: "preventive",
      required: true,
    });
  }

  // Check for customer onboarding compliance
  if (decision.type === "customer_onboarding") {
    requiredControls.push({
      id: generateId("control"),
      description: "KYC documentation required",
      type: "preventive",
      required: true,
    });
    missingEvidence.push("kyc_documentation", "regulatory_clearance");
  }

  const severity =
    risks.length > 0 &&
    risks.some((r) => r.severity === "HIGH" || r.severity === "CRITICAL")
      ? "HIGH"
      : risks.length > 0
        ? "MEDIUM"
        : "LOW";

  return {
    persona: "regulator",
    risks,
    missingEvidence,
    requiredControls,
    recommendedActions,
    severity,
    confidence: 0.75,
    evidenceRefs: context.relatedEvidence,
    reasoning:
      "Regulator persona focuses on compliance, documentation, and regulatory adherence",
    quotedRegulations: ["Saudi Customs Regulations", "SFDA Requirements"],
  };
}

async function reviewAsCFO(
  decision: DecisionObject,
  context: ReviewContext,
): Promise<PersonaReview> {
  const risks: Risk[] = [];
  const missingEvidence: string[] = [];
  const requiredControls: Control[] = [];
  const recommendedActions: Action[] = [];

  // Financial impact analysis
  const financialImpact = decision.impact?.financial || 0;

  if (financialImpact > 100000) {
    risks.push({
      id: generateId("risk"),
      description: "High financial impact requires additional approval",
      severity: "HIGH",
      likelihood: 0.7,
      impact: `Financial impact of ${financialImpact}`,
      evidenceRefs: [],
    });
    missingEvidence.push("financial_approval", "cost_benefit_analysis");
    requiredControls.push({
      id: generateId("control"),
      description: "CFO approval required for high-value decisions",
      type: "preventive",
      required: true,
    });
  }

  // Check for margin leakage
  if (decision.type === "pricing_change") {
    risks.push({
      id: generateId("risk"),
      description: "Pricing changes may impact margin",
      severity: "MEDIUM",
      likelihood: 0.6,
      impact: "Potential margin erosion",
      evidenceRefs: [],
    });
    missingEvidence.push("margin_analysis", "competitive_analysis");
  }

  const severity =
    financialImpact > 100000
      ? "HIGH"
      : financialImpact > 50000
        ? "MEDIUM"
        : "LOW";

  return {
    persona: "cfo",
    risks,
    missingEvidence,
    requiredControls,
    recommendedActions,
    severity,
    confidence: 0.8,
    evidenceRefs: context.relatedEvidence,
    reasoning:
      "CFO persona focuses on financial impact, margin protection, and cash flow",
    financialImpact,
  };
}

async function reviewAsCompetitor(
  decision: DecisionObject,
  context: ReviewContext,
): Promise<PersonaReview> {
  const risks: Risk[] = [];
  const missingEvidence: string[] = [];
  const requiredControls: Control[] = [];
  const recommendedActions: Action[] = [];

  // Competitive risk analysis
  if (
    decision.type === "customer_onboarding" ||
    decision.type === "pricing_change"
  ) {
    risks.push({
      id: generateId("risk"),
      description: "Competitive intelligence may reveal strategic moves",
      severity: "MEDIUM",
      likelihood: 0.5,
      impact: "Competitive disadvantage",
      evidenceRefs: [],
    });
    missingEvidence.push("competitive_analysis", "market_intelligence");
  }

  return {
    persona: "competitor",
    risks,
    missingEvidence,
    requiredControls,
    recommendedActions,
    severity: "LOW",
    confidence: 0.65,
    evidenceRefs: context.relatedEvidence,
    reasoning:
      "Competitor persona focuses on market position and competitive advantage",
    competitiveRisk: "Moderate - decision may be visible to competitors",
  };
}

async function reviewAsLitigator(
  decision: DecisionObject,
  context: ReviewContext,
): Promise<PersonaReview> {
  const risks: Risk[] = [];
  const missingEvidence: string[] = [];
  const requiredControls: Control[] = [];
  const recommendedActions: Action[] = [];

  // Legal exposure analysis
  if (
    decision.type === "compliance_override" ||
    decision.type === "regulatory_waiver"
  ) {
    risks.push({
      id: generateId("risk"),
      description: "Regulatory override may create legal exposure",
      severity: "HIGH",
      likelihood: 0.6,
      impact: "Potential legal liability",
      evidenceRefs: [],
    });
    missingEvidence.push("legal_opinion", "risk_waiver");
    requiredControls.push({
      id: generateId("control"),
      description: "Legal review required",
      type: "preventive",
      required: true,
    });
  }

  // Check for contract compliance
  if (
    decision.type === "contract_amendment" ||
    decision.type === "sla_proposal"
  ) {
    risks.push({
      id: generateId("risk"),
      description: "Contract changes may create liability",
      severity: "MEDIUM",
      likelihood: 0.5,
      impact: "Contractual disputes",
      evidenceRefs: [],
    });
    missingEvidence.push("contract_review", "legal_approval");
  }

  const severity = risks.some((r) => r.severity === "HIGH")
    ? "HIGH"
    : risks.length > 0
      ? "MEDIUM"
      : "LOW";

  return {
    persona: "litigator",
    risks,
    missingEvidence,
    requiredControls,
    recommendedActions,
    severity,
    confidence: 0.7,
    evidenceRefs: context.relatedEvidence,
    reasoning:
      "Litigator persona focuses on legal exposure, contract compliance, and liability",
    legalExposure: "Moderate - ensure all legal requirements are met",
  };
}

function determineOverallRisk(
  severities: ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")[],
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (severities.some((s) => s === "CRITICAL")) return "CRITICAL";
  if (severities.some((s) => s === "HIGH")) return "HIGH";
  if (severities.some((s) => s === "MEDIUM")) return "MEDIUM";
  return "LOW";
}

function calculateOverallConfidence(confidences: number[]): number {
  return confidences.length > 0
    ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    : 0;
}

function identifyBlockers(
  risks: Risk[],
  missingEvidence: string[],
  requiredControls: Control[],
): Blocker[] {
  const blockers: Blocker[] = [];

  // Critical risks are blockers
  risks
    .filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH")
    .forEach((risk) => {
      blockers.push({
        id: generateId("blocker"),
        description: risk.description,
        severity: risk.severity,
        requiredEvidence: [],
        requiredControls: [],
      });
    });

  // Required controls that are missing
  requiredControls
    .filter((c) => c.required)
    .forEach((control) => {
      blockers.push({
        id: generateId("blocker"),
        description: `Required control missing: ${control.description}`,
        severity: "HIGH",
        requiredControls: [control.id],
      });
    });

  return blockers;
}

function deduplicateControls(controls: Control[]): Control[] {
  const seen = new Set<string>();
  return controls.filter((control) => {
    const key = `${control.type}-${control.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateActions(actions: Action[]): Action[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = action.description;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getReview(reviewId: string): Promise<AdversarialReview | null> {
  return store.getAdversarialReview(reviewId) || null;
}

async function getReviewsForDecision(
  decisionId: string,
): Promise<AdversarialReview[]> {
  return store
    .getAllAdversarialReviews()
    .filter((r) => r.decisionId === decisionId);
}

// ============================================================================
// TRUTH KPI OPERATIONS
// ============================================================================

async function registerKPI(
  kpi: Omit<
    TruthKPI,
    "id" | "value" | "calculatedAt" | "evidenceIds" | "breakdown"
  >,
): Promise<TruthKPI> {
  const registered: TruthKPI = {
    ...kpi,
    id: generateId("kpi"),
    value: 0,
    calculatedAt: new Date().toISOString(),
    evidenceIds: [],
    breakdown: [],
    validationStatus: "pending",
  };

  store.setTruthKPI(registered);
  store.registerKPIDefinition(kpi.name, kpi);

  // Persist KPI snapshot to DB (best-effort). Definitions are still kept in-memory for now.
  try {
    await truthEngineDatabaseAdapter.saveTruthKPI(registered);
  } catch (error) {
    // Non-fatal: Truth Engine can run without DB
    console.warn("Truth KPI persistence skipped/failed (register):", error);
  }

  return registered;
}

async function calculateKPI(
  kpiId: string,
  filters?: KPIFilters,
): Promise<TruthKPI> {
  let kpi = store.getTruthKPI(kpiId);
  if (!kpi) {
    // Attempt DB fallback
    try {
      const dbKpi = await truthEngineDatabaseAdapter.getTruthKPI(kpiId);
      if (dbKpi) {
        store.setTruthKPI(dbKpi);
        kpi = dbKpi;
      }
    } catch (error) {
      console.warn("Truth KPI DB fallback failed (calculate):", error);
    }
  }
  if (!kpi) throw new Error(`TruthKPI ${kpiId} not found`);

  // Get relevant truth events
  const allEvents = store.getAllTruthEvents();
  let relevantEvents = allEvents.filter((e) =>
    kpi.requiredEventTypes.includes(e.eventType),
  );

  // Apply filters
  if (filters?.tenantId) {
    relevantEvents = relevantEvents.filter(
      (e) => e.tenantId === filters.tenantId,
    );
  }
  if (filters?.customerId) {
    relevantEvents = relevantEvents.filter(
      (e) => e.entityRefs.customerId === filters.customerId,
    );
  }
  // Activity-based attribution: allow filtering KPIs by employee when events include `entityRefs.employeeId`
  if ((filters as any)?.employeeId) {
    relevantEvents = relevantEvents.filter(
      (e) => (e.entityRefs as any).employeeId === (filters as any).employeeId,
    );
  }
  if (filters?.warehouseId) {
    relevantEvents = relevantEvents.filter(
      (e) => e.entityRefs.warehouseId === filters.warehouseId,
    );
  }
  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    relevantEvents = relevantEvents.filter(
      (e) => new Date(e.happenedAt).getTime() >= from,
    );
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    relevantEvents = relevantEvents.filter(
      (e) => new Date(e.happenedAt).getTime() <= to,
    );
  }

  // Verify evidence requirements
  const evidenceIds = new Set<string>();
  const validationIssues: string[] = [];

  for (const req of kpi.minimumEvidenceRequirements) {
    const eventsOfType = relevantEvents.filter(
      (e) => e.eventType === req.eventType,
    );
    for (const event of eventsOfType) {
      if (event.evidenceLinks.length < req.minEvidenceCount) {
        validationIssues.push(
          `Event ${event.eventType} has ${event.evidenceLinks.length} evidence, requires ${req.minEvidenceCount}`,
        );
      }
      event.evidenceLinks.forEach((id) => evidenceIds.add(id));
    }
  }

  // Calculate value based on method
  let value = 0;
  const breakdown: KPIBreakdown[] = [];

  switch (kpi.calculationMethod || "count") {
    case "count":
      value = relevantEvents.length;
      break;
    case "sum":
      // Would need to extract numeric values from events
      value = relevantEvents.length; // Placeholder
      break;
    case "average":
      value = relevantEvents.length > 0 ? relevantEvents.length : 0; // Placeholder
      break;
    case "formula":
      // Would evaluate formula
      value = relevantEvents.length; // Placeholder
      break;
    default:
      value = relevantEvents.length;
  }

  // Create breakdown by dimension (simplified)
  if (filters?.customerId) {
    breakdown.push({
      dimension: "by_customer",
      values: { [filters.customerId]: value },
      evidenceIds: { [filters.customerId]: Array.from(evidenceIds) },
    });
  }

  const updated: TruthKPI = {
    ...kpi,
    value,
    calculatedAt: new Date().toISOString(),
    evidenceIds: Array.from(evidenceIds),
    breakdown,
    validationStatus: validationIssues.length > 0 ? "warning" : "valid",
    validationIssues:
      validationIssues.length > 0 ? validationIssues : undefined,
    lastValidatedAt: new Date().toISOString(),
  };

  store.setTruthKPI(updated);

  // Persist KPI snapshot to DB (best-effort)
  try {
    await truthEngineDatabaseAdapter.saveTruthKPI(updated);
  } catch (error) {
    console.warn("Truth KPI persistence skipped/failed (calculate):", error);
  }
  return updated;
}

async function getKPIEvidence(kpiId: string): Promise<TruthEvidenceItem[]> {
  let kpi = store.getTruthKPI(kpiId);
  if (!kpi) {
    // DB fallback
    try {
      const dbKpi = await truthEngineDatabaseAdapter.getTruthKPI(kpiId);
      if (dbKpi) {
        store.setTruthKPI(dbKpi);
        kpi = dbKpi;
      }
    } catch (error) {
      console.warn("Truth KPI DB fallback failed (evidence):", error);
    }
  }
  if (!kpi) throw new Error(`TruthKPI ${kpiId} not found`);

  const evidence = await Promise.all(
    kpi.evidenceIds.map((id) => evidenceService.get(id)),
  );

  return evidence.filter(Boolean) as TruthEvidenceItem[];
}

async function getAllKPIs(filters?: KPIFilters): Promise<TruthKPI[]> {
  // Prefer DB if available; fallback to memory store.
  let kpis: TruthKPI[] = [];
  try {
    const dbKpis = await truthEngineDatabaseAdapter.getAllTruthKPIs({
      tenantId: filters?.tenantId,
      category: filters?.category,
      module: filters?.module,
    });
    if (dbKpis.length > 0) {
      kpis = dbKpis;
      // Keep cache warm for other operations
      dbKpis.forEach((k) => store.setTruthKPI(k));
    } else {
      kpis = store.getAllTruthKPIs();
    }
  } catch {
    kpis = store.getAllTruthKPIs();
  }

  if (filters?.tenantId) {
    // TruthKPI does not currently have tenantId; best-effort tenant scoping via tags.
    // Convention: tags may include `tenant:<tenantId>`.
    const tag = `tenant:${filters.tenantId}`;
    kpis = kpis.filter((k) => (k.tags || []).includes(tag));
  }
  if (filters?.category) {
    kpis = kpis.filter((k) => k.category === filters.category);
  }
  if (filters?.module) {
    kpis = kpis.filter((k) => k.module === filters.module);
  }

  return kpis;
}

// ============================================================================
// BOARD BRIEF OPERATIONS
// ============================================================================

async function generateBoardBrief(
  tenantId: string,
  period?: { start: Date | string; end: Date | string },
): Promise<BoardBrief> {
  const start = period?.start
    ? new Date(period.start)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = period?.end ? new Date(period.end) : new Date();

  // Get all truth events in period
  const allEvents = store.getAllTruthEvents();
  const periodEvents = allEvents.filter((e) => {
    const eventDate = new Date(e.happenedAt);
    return e.tenantId === tenantId && eventDate >= start && eventDate <= end;
  });

  // Generate signals
  const signals = await generateBoardSignals(periodEvents, tenantId);

  // Generate adversarial insights
  const adversarialInsights = await generateAdversarialInsights(
    periodEvents,
    tenantId,
  );

  // Calculate evidence metrics
  const allEvidenceIds = new Set<string>();
  periodEvents.forEach((e) =>
    e.evidenceLinks.forEach((id) => allEvidenceIds.add(id)),
  );
  const totalEvidenceItems = allEvidenceIds.size;

  // Detect gaps
  const lowConfidenceEvents = periodEvents.filter(
    (e) => e.confidenceScore < 0.7,
  ).length;
  const evidenceGaps = periodEvents.filter(
    (e) => e.evidenceLinks.length === 0,
  ).length;

  // Generate recommendations
  const recommendations = generateBoardRecommendations(
    signals,
    adversarialInsights,
  );

  const brief: BoardBrief = {
    id: generateId("brief"),
    tenantId,
    generatedAt: new Date().toISOString(),
    period: { start: start.toISOString(), end: end.toISOString() },
    signals,
    adversarialInsights,
    totalEvidenceItems,
    evidenceGaps,
    lowConfidenceEvents,
    recommendations,
  };

  store.setBoardBrief(brief);
  return brief;
}

async function generateBoardSignals(
  events: TruthEvent[],
  tenantId: string,
): Promise<BoardSignal[]> {
  const signals: BoardSignal[] = [];

  // Margin Mirage detection
  const marginEvents = events.filter(
    (e) =>
      e.eventType === "margin_calculated" ||
      e.eventType === "margin_bridge_updated",
  );
  if (marginEvents.length > 0) {
    signals.push({
      id: generateId("signal"),
      type: "margin_mirage",
      title: "Margin Variance Detected",
      description: `${marginEvents.length} margin calculations show variance from quoted`,
      severity: "MEDIUM",
      impact: {
        financial: marginEvents.length * 1000, // Placeholder
      },
      evidenceIds: marginEvents.flatMap((e) => e.evidenceLinks),
      relatedTruthEvents: marginEvents.map((e) => e.id),
      trend: "worsening",
    });
  }

  // Detention Drift detection
  const detentionEvents = events.filter(
    (e) =>
      e.eventType === "detention_started" ||
      e.eventType === "detention_ended" ||
      e.eventType === "detention_extended",
  );
  if (detentionEvents.length > 10) {
    signals.push({
      id: generateId("signal"),
      type: "detention_drift",
      title: "High Detention Frequency",
      description: `${detentionEvents.length} detention events detected`,
      severity: "HIGH",
      impact: {
        operational: "Increased costs and delays",
        financial: detentionEvents.length * 500, // Placeholder
      },
      evidenceIds: detentionEvents.flatMap((e) => e.evidenceLinks),
      relatedTruthEvents: detentionEvents.map((e) => e.id),
      trend: "worsening",
    });
  }

  // Compliance Debt detection
  const complianceEvents = events.filter(
    (e) =>
      e.eventType === "compliance_debt_incurred" ||
      e.eventType === "violation_detected",
  );
  if (complianceEvents.length > 0) {
    signals.push({
      id: generateId("signal"),
      type: "compliance_debt",
      title: "Compliance Issues Detected",
      description: `${complianceEvents.length} compliance violations or debt events`,
      severity: "HIGH",
      impact: {
        compliance: "Regulatory risk",
      },
      evidenceIds: complianceEvents.flatMap((e) => e.evidenceLinks),
      relatedTruthEvents: complianceEvents.map((e) => e.id),
      trend: "worsening",
    });
  }

  return signals;
}

async function generateAdversarialInsights(
  events: TruthEvent[],
  tenantId: string,
): Promise<AdversarialInsight[]> {
  const insights: AdversarialInsight[] = [];

  // Get recent adversarial reviews
  const recentReviews = store.getAllAdversarialReviews().filter((r) => {
    const reviewDate = new Date(r.reviewedAt);
    return reviewDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  });

  recentReviews.forEach((review) => {
    if (review.overallRisk === "HIGH" || review.overallRisk === "CRITICAL") {
      Object.values(review.personas).forEach((persona) => {
        if (persona.severity === "HIGH" || persona.severity === "CRITICAL") {
          insights.push({
            id: generateId("insight"),
            persona: persona.persona,
            insight: `High-risk findings from ${persona.persona} review`,
            severity: persona.severity,
            evidenceRefs: persona.evidenceRefs,
            relatedDecisions: [review.decisionId],
          });
        }
      });
    }
  });

  return insights;
}

function generateBoardRecommendations(
  signals: BoardSignal[],
  insights: AdversarialInsight[],
): BoardRecommendation[] {
  const recommendations: BoardRecommendation[] = [];

  // Generate recommendations from signals
  signals.forEach((signal) => {
    if (signal.severity === "HIGH" || signal.severity === "CRITICAL") {
      recommendations.push({
        id: generateId("rec"),
        title: `Address ${signal.title}`,
        description: signal.description,
        priority: signal.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        impact: "High impact on operations",
        effort: "MEDIUM",
        evidenceRefs: signal.evidenceIds,
        relatedSignals: [signal.id],
      });
    }
  });

  return recommendations;
}

// ============================================================================
// SEARCH & ANALYTICS
// ============================================================================

async function searchTruthEvents(
  query: TruthEventSearchQuery,
): Promise<TruthEventSearchResult> {
  let events = store.getAllTruthEvents();

  // Apply filters
  if (query.tenantId) {
    events = events.filter((e) => e.tenantId === query.tenantId);
  }
  if (query.eventTypes && query.eventTypes.length > 0) {
    events = events.filter((e) => query.eventTypes!.includes(e.eventType));
  }
  if (query.entityRefs) {
    events = events.filter((e) => {
      return Object.entries(query.entityRefs!).some(([key, value]) => {
        const refKey = `${key}Id`;
        return (e.entityRefs as any)[refKey] === value;
      });
    });
  }
  if (query.dateFrom) {
    const from = new Date(query.dateFrom).getTime();
    events = events.filter((e) => new Date(e.happenedAt).getTime() >= from);
  }
  if (query.dateTo) {
    const to = new Date(query.dateTo).getTime();
    events = events.filter((e) => new Date(e.happenedAt).getTime() <= to);
  }
  if (query.minConfidence !== undefined) {
    events = events.filter((e) => e.confidenceScore >= query.minConfidence!);
  }
  if (query.tags && query.tags.length > 0) {
    events = events.filter(
      (e) => e.tags && query.tags!.some((tag) => e.tags!.includes(tag)),
    );
  }
  if (query.actorType) {
    events = events.filter((e) => e.actor.type === query.actorType);
  }

  const totalCount = events.length;

  // Apply pagination
  if (query.offset) {
    events = events.slice(query.offset);
  }
  if (query.limit) {
    events = events.slice(0, query.limit);
  }

  return {
    events,
    totalCount,
    hasMore:
      query.offset !== undefined && query.limit !== undefined
        ? query.offset + query.limit < totalCount
        : false,
  };
}

async function getEvidenceChain(
  evidenceId: string,
): Promise<TruthEvidenceItem[]> {
  const evidence = await evidenceService.get(evidenceId);
  if (!evidence) {
    return [];
  }

  const chain: TruthEvidenceItem[] = [evidence as TruthEvidenceItem];

  // Get lineage
  const lineage = await evidenceService.getLineage(evidenceId);
  chain.push(...(lineage as TruthEvidenceItem[]));

  return chain;
}

async function validateTimeline(
  entityType: string,
  entityId: string,
): Promise<TimelineValidationResult> {
  const timeline = await getTruthTimeline(entityType, entityId);

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for low confidence events
  const lowConfidenceEvents = timeline.events.filter(
    (e) => e.confidenceScore < 0.7,
  );
  if (lowConfidenceEvents.length > 0) {
    issues.push(
      `${lowConfidenceEvents.length} events have low confidence scores`,
    );
    recommendations.push("Review and add evidence to low confidence events");
  }

  // Check for events without evidence
  const eventsWithoutEvidence = timeline.events.filter(
    (e) => e.evidenceLinks.length === 0,
  );
  if (eventsWithoutEvidence.length > 0) {
    issues.push(`${eventsWithoutEvidence.length} events have no evidence`);
    recommendations.push("Add evidence to all events for audit compliance");
  }

  // Check for gaps
  if (timeline.gaps && timeline.gaps.length > 0) {
    issues.push(`${timeline.gaps.length} timeline gaps detected`);
    recommendations.push("Investigate and fill timeline gaps");
  }

  const valid = issues.length === 0 && timeline.confidenceScore >= 0.7;

  return {
    valid,
    confidence: timeline.confidenceScore,
    gaps: timeline.gaps || [],
    issues,
    recommendations,
  };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const truthEngineService: TruthEngineService = {
  // Evidence
  recordEvidence,

  // Truth Events
  recordTruthEvent,
  linkEvidenceToEvent,
  getTruthTimeline,
  disputeEvent,
  correctEvent,

  // Adversarial Review
  reviewDecision,
  getReview,
  getReviewsForDecision,

  // Truth KPIs
  registerKPI,
  calculateKPI,
  getKPIEvidence,
  getAllKPIs,

  // Board Brief
  generateBoardBrief,

  // Search & Analytics
  searchTruthEvents,
  getEvidenceChain,
  validateTimeline,
};

export default truthEngineService;
