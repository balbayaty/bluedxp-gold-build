/**
 * Truth Engine Database Adapter
 * Database persistence layer for Truth Engine
 * Replaces in-memory storage with database
 */

import { DatabaseClient } from "@/lib/database/client";
import {
  TruthEvent,
  TruthKPI,
  AdversarialReview,
  BoardBrief,
} from "@/types/truth-engine";

export class TruthEngineDatabaseAdapter {
  private db: DatabaseClient | null = null;

  setDatabaseClient(db: DatabaseClient): void {
    this.db = db;
  }

  // ============================================================================
  // TRUTH EVENTS
  // ============================================================================

  async saveTruthEvent(event: TruthEvent): Promise<void> {
    if (!this.db) {
      throw new Error("Database client not set");
    }

    const query = `
      INSERT INTO truth_events (
        id, tenant_id, event_type, happened_at, recorded_at,
        actor_type, actor_id, actor_name, actor_role,
        entity_refs, evidence_links, confidence_score, confidence_reason,
        derived_from, business_impact, metadata, tags, status,
        disputed_by, disputed_at, dispute_reason, corrected_event_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        disputed_by = EXCLUDED.disputed_by,
        disputed_at = EXCLUDED.disputed_at,
        dispute_reason = EXCLUDED.dispute_reason,
        corrected_event_id = EXCLUDED.corrected_event_id,
        updated_at = EXCLUDED.updated_at
    `;

    await this.db.execute(query, [
      event.id,
      event.tenantId,
      event.eventType,
      event.happenedAt,
      event.recordedAt,
      event.actor.type,
      event.actor.id,
      event.actor.name,
      event.actor.role,
      JSON.stringify(event.entityRefs),
      JSON.stringify(event.evidenceLinks),
      event.confidenceScore,
      event.confidenceReason,
      JSON.stringify(event.derivedFrom),
      JSON.stringify(event.businessImpact),
      JSON.stringify(event.metadata),
      JSON.stringify(event.tags || []),
      event.status,
      event.disputedBy,
      event.disputedAt,
      event.disputeReason,
      event.correctedEventId,
      event.createdAt,
      event.updatedAt || new Date().toISOString(),
    ]);
  }

  async getTruthEvent(id: string): Promise<TruthEvent | null> {
    if (!this.db) return null;

    const query = `SELECT * FROM truth_events WHERE id = $1`;
    const results = await this.db.query(query, [id]);

    if (results.length === 0) return null;
    return this.mapRowToTruthEvent(results[0]);
  }

  async getTruthEventsByEntity(
    entityType: string,
    entityId: string,
    filters?: {
      eventTypes?: string[];
      dateFrom?: string;
      dateTo?: string;
      minConfidence?: number;
    },
  ): Promise<TruthEvent[]> {
    if (!this.db) return [];

    let query = `
      SELECT * FROM truth_events
      WHERE entity_refs::jsonb->>$1 = $2
    `;
    const params: any[] = [`${entityType}Id`, entityId];

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      query += ` AND event_type = ANY($${params.length + 1})`;
      params.push(filters.eventTypes);
    }

    if (filters?.dateFrom) {
      query += ` AND happened_at >= $${params.length + 1}`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND happened_at <= $${params.length + 1}`;
      params.push(filters.dateTo);
    }

    if (filters?.minConfidence !== undefined) {
      query += ` AND confidence_score >= $${params.length + 1}`;
      params.push(filters.minConfidence);
    }

    query += ` ORDER BY happened_at ASC`;

    const results = await this.db.query(query, params);
    return results.map((row: any) => this.mapRowToTruthEvent(row));
  }

  async searchTruthEvents(filters: {
    tenantId?: string;
    eventTypes?: string[];
    entityRefs?: Record<string, string>;
    dateFrom?: string;
    dateTo?: string;
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ events: TruthEvent[]; totalCount: number }> {
    if (!this.db) return { events: [], totalCount: 0 };

    let query = `SELECT * FROM truth_events WHERE 1=1`;
    const params: any[] = [];

    if (filters.tenantId) {
      query += ` AND tenant_id = $${params.length + 1}`;
      params.push(filters.tenantId);
    }

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      query += ` AND event_type = ANY($${params.length + 1})`;
      params.push(filters.eventTypes);
    }

    if (filters.dateFrom) {
      query += ` AND happened_at >= $${params.length + 1}`;
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ` AND happened_at <= $${params.length + 1}`;
      params.push(filters.dateTo);
    }

    if (filters.minConfidence !== undefined) {
      query += ` AND confidence_score >= $${params.length + 1}`;
      params.push(filters.minConfidence);
    }

    // Get total count
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as count");
    const countResult = await this.db.query(countQuery, params);
    const totalCount = parseInt(countResult[0]?.count || "0");

    // Apply pagination
    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(filters.offset);
    }

    query += ` ORDER BY happened_at DESC`;

    const results = await this.db.query(query, params);
    return {
      events: results.map((row: any) => this.mapRowToTruthEvent(row)),
      totalCount,
    };
  }

  private mapRowToTruthEvent(row: any): TruthEvent {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      eventType: row.event_type,
      happenedAt: row.happened_at,
      recordedAt: row.recorded_at,
      actor: {
        type: row.actor_type,
        id: row.actor_id,
        name: row.actor_name,
        role: row.actor_role,
      },
      entityRefs:
        typeof row.entity_refs === "string"
          ? JSON.parse(row.entity_refs)
          : row.entity_refs,
      evidenceLinks:
        typeof row.evidence_links === "string"
          ? JSON.parse(row.evidence_links)
          : row.evidence_links,
      confidenceScore: row.confidence_score,
      confidenceReason: row.confidence_reason,
      derivedFrom:
        typeof row.derived_from === "string"
          ? JSON.parse(row.derived_from)
          : row.derived_from,
      businessImpact: row.business_impact
        ? typeof row.business_impact === "string"
          ? JSON.parse(row.business_impact)
          : row.business_impact
        : undefined,
      metadata: row.metadata
        ? typeof row.metadata === "string"
          ? JSON.parse(row.metadata)
          : row.metadata
        : undefined,
      tags: row.tags
        ? typeof row.tags === "string"
          ? JSON.parse(row.tags)
          : row.tags
        : [],
      status: row.status,
      disputedBy: row.disputed_by,
      disputedAt: row.disputed_at,
      disputeReason: row.dispute_reason,
      correctedEventId: row.corrected_event_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ============================================================================
  // TRUTH KPIs
  // ============================================================================

  async saveTruthKPI(kpi: TruthKPI): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT INTO truth_kpis (
        id, name, description, formula, required_event_types,
        minimum_evidence_requirements, value, unit, calculated_at,
        calculation_method, evidence_ids, breakdown, trend,
        previous_value, change_percentage, target, threshold,
        category, module, tags, validation_status, validation_issues,
        last_validated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      ON CONFLICT (id) DO UPDATE SET
        value = EXCLUDED.value,
        calculated_at = EXCLUDED.calculated_at,
        evidence_ids = EXCLUDED.evidence_ids,
        breakdown = EXCLUDED.breakdown,
        validation_status = EXCLUDED.validation_status,
        validation_issues = EXCLUDED.validation_issues,
        last_validated_at = EXCLUDED.last_validated_at
    `;

    await this.db.execute(query, [
      kpi.id,
      kpi.name,
      kpi.description,
      kpi.formula,
      JSON.stringify(kpi.requiredEventTypes),
      JSON.stringify(kpi.minimumEvidenceRequirements),
      kpi.value,
      kpi.unit,
      kpi.calculatedAt,
      kpi.calculationMethod,
      JSON.stringify(kpi.evidenceIds),
      JSON.stringify(kpi.breakdown),
      kpi.trend,
      kpi.previousValue,
      kpi.changePercentage,
      kpi.target,
      kpi.threshold ? JSON.stringify(kpi.threshold) : null,
      kpi.category,
      kpi.module,
      JSON.stringify(kpi.tags || []),
      kpi.validationStatus,
      kpi.validationIssues ? JSON.stringify(kpi.validationIssues) : null,
      kpi.lastValidatedAt,
    ]);
  }

  async getTruthKPI(id: string): Promise<TruthKPI | null> {
    if (!this.db) return null;

    const query = `SELECT * FROM truth_kpis WHERE id = $1`;
    const results = await this.db.query(query, [id]);

    if (results.length === 0) return null;
    return this.mapRowToTruthKPI(results[0]);
  }

  async getAllTruthKPIs(filters?: {
    tenantId?: string;
    category?: string;
    module?: string;
  }): Promise<TruthKPI[]> {
    if (!this.db) return [];

    let query = `SELECT * FROM truth_kpis WHERE 1=1`;
    const params: any[] = [];

    if (filters?.category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }

    if (filters?.module) {
      query += ` AND module = $${params.length + 1}`;
      params.push(filters.module);
    }

    const results = await this.db.query(query, params);
    return results.map((row: any) => this.mapRowToTruthKPI(row));
  }

  private mapRowToTruthKPI(row: any): TruthKPI {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      formula: row.formula,
      requiredEventTypes:
        typeof row.required_event_types === "string"
          ? JSON.parse(row.required_event_types)
          : row.required_event_types,
      minimumEvidenceRequirements:
        typeof row.minimum_evidence_requirements === "string"
          ? JSON.parse(row.minimum_evidence_requirements)
          : row.minimum_evidence_requirements,
      value: row.value,
      unit: row.unit,
      calculatedAt: row.calculated_at,
      calculationMethod: row.calculation_method,
      evidenceIds:
        typeof row.evidence_ids === "string"
          ? JSON.parse(row.evidence_ids)
          : row.evidence_ids,
      breakdown:
        typeof row.breakdown === "string"
          ? JSON.parse(row.breakdown)
          : row.breakdown,
      trend: row.trend,
      previousValue: row.previous_value,
      changePercentage: row.change_percentage,
      target: row.target,
      threshold: row.threshold
        ? typeof row.threshold === "string"
          ? JSON.parse(row.threshold)
          : row.threshold
        : undefined,
      category: row.category,
      module: row.module,
      tags: row.tags
        ? typeof row.tags === "string"
          ? JSON.parse(row.tags)
          : row.tags
        : [],
      validationStatus: row.validation_status,
      validationIssues: row.validation_issues
        ? typeof row.validation_issues === "string"
          ? JSON.parse(row.validation_issues)
          : row.validation_issues
        : undefined,
      lastValidatedAt: row.last_validated_at,
    };
  }

  // ============================================================================
  // ADVERSARIAL REVIEWS
  // ============================================================================

  async saveAdversarialReview(review: AdversarialReview): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT INTO adversarial_reviews (
        id, decision_id, decision_type, personas, overall_risk,
        overall_confidence, missing_evidence, required_controls,
        recommended_actions, blockers, reviewed_at, reviewed_by,
        review_method, model_version, prompt_hash, review_duration,
        related_truth_events, related_evidence, related_decisions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (id) DO UPDATE SET
        personas = EXCLUDED.personas,
        overall_risk = EXCLUDED.overall_risk,
        overall_confidence = EXCLUDED.overall_confidence,
        missing_evidence = EXCLUDED.missing_evidence,
        required_controls = EXCLUDED.required_controls,
        recommended_actions = EXCLUDED.recommended_actions,
        blockers = EXCLUDED.blockers
    `;

    await this.db.execute(query, [
      review.id,
      review.decisionId,
      review.decisionType,
      JSON.stringify(review.personas),
      review.overallRisk,
      review.overallConfidence,
      JSON.stringify(review.missingEvidence),
      JSON.stringify(review.requiredControls),
      JSON.stringify(review.recommendedActions),
      JSON.stringify(review.blockers),
      review.reviewedAt,
      review.reviewedBy,
      review.reviewMethod,
      review.modelVersion,
      review.promptHash,
      review.reviewDuration,
      JSON.stringify(review.relatedTruthEvents),
      JSON.stringify(review.relatedEvidence),
      JSON.stringify(review.relatedDecisions || []),
    ]);
  }

  async getAdversarialReview(id: string): Promise<AdversarialReview | null> {
    if (!this.db) return null;

    const query = `SELECT * FROM adversarial_reviews WHERE id = $1`;
    const results = await this.db.query(query, [id]);

    if (results.length === 0) return null;
    return this.mapRowToAdversarialReview(results[0]);
  }

  async getAdversarialReviewsByDecision(
    decisionId: string,
  ): Promise<AdversarialReview[]> {
    if (!this.db) return [];

    const query = `SELECT * FROM adversarial_reviews WHERE decision_id = $1 ORDER BY reviewed_at DESC`;
    const results = await this.db.query(query, [decisionId]);
    return results.map((row: any) => this.mapRowToAdversarialReview(row));
  }

  private mapRowToAdversarialReview(row: any): AdversarialReview {
    return {
      id: row.id,
      decisionId: row.decision_id,
      decisionType: row.decision_type,
      personas:
        typeof row.personas === "string"
          ? JSON.parse(row.personas)
          : row.personas,
      overallRisk: row.overall_risk,
      overallConfidence: row.overall_confidence,
      missingEvidence:
        typeof row.missing_evidence === "string"
          ? JSON.parse(row.missing_evidence)
          : row.missing_evidence,
      requiredControls:
        typeof row.required_controls === "string"
          ? JSON.parse(row.required_controls)
          : row.required_controls,
      recommendedActions:
        typeof row.recommended_actions === "string"
          ? JSON.parse(row.recommended_actions)
          : row.recommended_actions,
      blockers:
        typeof row.blockers === "string"
          ? JSON.parse(row.blockers)
          : row.blockers,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
      reviewMethod: row.review_method,
      modelVersion: row.model_version,
      promptHash: row.prompt_hash,
      reviewDuration: row.review_duration,
      relatedTruthEvents:
        typeof row.related_truth_events === "string"
          ? JSON.parse(row.related_truth_events)
          : row.related_truth_events,
      relatedEvidence:
        typeof row.related_evidence === "string"
          ? JSON.parse(row.related_evidence)
          : row.related_evidence,
      relatedDecisions: row.related_decisions
        ? typeof row.related_decisions === "string"
          ? JSON.parse(row.related_decisions)
          : row.related_decisions
        : undefined,
    };
  }

  // ============================================================================
  // BOARD BRIEFS
  // ============================================================================

  async saveBoardBrief(brief: BoardBrief): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT INTO board_briefs (
        id, tenant_id, generated_at, period_start, period_end,
        signals, adversarial_insights, total_evidence_items,
        evidence_gaps, low_confidence_events, recommendations
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (id) DO UPDATE SET
        signals = EXCLUDED.signals,
        adversarial_insights = EXCLUDED.adversarial_insights,
        recommendations = EXCLUDED.recommendations
    `;

    await this.db.execute(query, [
      brief.id,
      brief.tenantId,
      brief.generatedAt,
      brief.period.start,
      brief.period.end,
      JSON.stringify(brief.signals),
      JSON.stringify(brief.adversarialInsights),
      brief.totalEvidenceItems,
      brief.evidenceGaps,
      brief.lowConfidenceEvents,
      JSON.stringify(brief.recommendations),
    ]);
  }

  async getBoardBrief(id: string): Promise<BoardBrief | null> {
    if (!this.db) return null;

    const query = `SELECT * FROM board_briefs WHERE id = $1`;
    const results = await this.db.query(query, [id]);

    if (results.length === 0) return null;
    return this.mapRowToBoardBrief(results[0]);
  }

  private mapRowToBoardBrief(row: any): BoardBrief {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      generatedAt: row.generated_at,
      period: {
        start: row.period_start,
        end: row.period_end,
      },
      signals:
        typeof row.signals === "string" ? JSON.parse(row.signals) : row.signals,
      adversarialInsights:
        typeof row.adversarial_insights === "string"
          ? JSON.parse(row.adversarial_insights)
          : row.adversarial_insights,
      totalEvidenceItems: row.total_evidence_items,
      evidenceGaps: row.evidence_gaps,
      lowConfidenceEvents: row.low_confidence_events,
      recommendations:
        typeof row.recommendations === "string"
          ? JSON.parse(row.recommendations)
          : row.recommendations,
    };
  }
}

export const truthEngineDatabaseAdapter = new TruthEngineDatabaseAdapter();
