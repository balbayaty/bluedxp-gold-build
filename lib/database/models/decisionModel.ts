/**
 * Decision Database Model
 * Database operations for Decision Infrastructure
 */

import { DatabaseClient } from '../client'
import type { DecisionRecord, ControlReference, ComplianceCheck } from '@/lib/services/decision-core/types'

export class DecisionModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create a decision record
   */
  async create(decision: DecisionRecord): Promise<DecisionRecord> {
    const query = `
      INSERT INTO decisions (
        id, version, tenant_id, module, entity_type, entity_id,
        status, primitive, reason, conditions,
        decided_by, decided_at, approved_by, approved_at,
        rejected_by, rejected_at, override, escalated_to,
        escalated_at, escalation_reason, escalation_path,
        hold_reason, hold_until, hold_applied_by, hold_applied_at,
        hold_released_by, hold_released_at, related_decision_ids,
        parent_decision_id, metadata, tags, correlation_id,
        trace_id, request_id, created_at, updated_at, created_by, updated_by,
        closed_at, closed_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
      )
    `

    const params = [
      decision.id,
      decision.version,
      decision.tenantId,
      decision.module,
      decision.entityType,
      decision.entityId,
      decision.status,
      decision.primitive,
      decision.reason || null,
      JSON.stringify(decision.conditions || []),
      decision.decidedBy || null,
      decision.decidedAt ? new Date(decision.decidedAt).toISOString() : null,
      decision.approvedBy || null,
      decision.approvedAt ? new Date(decision.approvedAt).toISOString() : null,
      decision.rejectedBy || null,
      decision.rejectedAt ? new Date(decision.rejectedAt).toISOString() : null,
      decision.override ? JSON.stringify(decision.override) : null,
      decision.escalatedTo || null,
      decision.escalatedAt ? new Date(decision.escalatedAt).toISOString() : null,
      decision.escalationReason || null,
      JSON.stringify(decision.escalationPath || []),
      decision.holdReason || null,
      decision.holdUntil ? new Date(decision.holdUntil).toISOString() : null,
      decision.holdAppliedBy || null,
      decision.holdAppliedAt ? new Date(decision.holdAppliedAt).toISOString() : null,
      decision.holdReleasedBy || null,
      decision.holdReleasedAt ? new Date(decision.holdReleasedAt).toISOString() : null,
      JSON.stringify(decision.relatedDecisionIds || []),
      decision.parentDecisionId || null,
      JSON.stringify(decision.metadata || {}),
      JSON.stringify(decision.tags || []),
      decision.correlationId,
      decision.traceId || null,
      decision.requestId || null,
      new Date(decision.createdAt).toISOString(),
      new Date(decision.updatedAt).toISOString(),
      decision.createdBy || null,
      decision.updatedBy || null,
      decision.closedAt ? new Date(decision.closedAt).toISOString() : null,
      decision.closedBy || null,
    ]

    await this.db.query(query, params)

    // Insert controls
    if (decision.controlsApplied.length > 0) {
      await this.insertControls(decision.id, decision.controlsApplied)
    }

    // Insert evidence links
    if (decision.evidenceIds.length > 0) {
      await this.insertEvidence(decision.id, decision.evidenceIds, decision.evidenceHashes)
    }

    // Insert compliance checks
    if (decision.complianceChecks.length > 0) {
      await this.insertComplianceChecks(decision.id, decision.complianceChecks)
    }

    return decision
  }

  /**
   * Get decision by ID
   */
  async getById(id: string): Promise<DecisionRecord | null> {
    const query = 'SELECT * FROM decisions WHERE id = $1'
    const results = await this.db.query<any>(query, [id])

    if (results.length === 0) return null

    const row = results[0]
    const decision = this.mapRowToDecision(row)

    // Load related data
    decision.controlsApplied = await this.getControls(id)
    decision.evidenceIds = await this.getEvidenceIds(id)
    decision.evidenceHashes = await this.getEvidenceHashes(id)
    decision.complianceChecks = await this.getComplianceChecks(id)

    return decision
  }

  /**
   * Update decision
   */
  async update(id: string, updates: Partial<DecisionRecord>): Promise<DecisionRecord> {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error(`Decision ${id} not found`)
    }

    const updated: DecisionRecord = {
      ...existing,
      ...updates,
      id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    }

    // Build update query dynamically
    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1

    const fieldMap: Record<string, string> = {
      status: 'status',
      reason: 'reason',
      conditions: 'conditions',
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      rejectedBy: 'rejected_by',
      rejectedAt: 'rejected_at',
      override: 'override',
      escalatedTo: 'escalated_to',
      escalatedAt: 'escalated_at',
      escalationReason: 'escalation_reason',
      escalationPath: 'escalation_path',
      holdReason: 'hold_reason',
      holdUntil: 'hold_until',
      holdAppliedBy: 'hold_applied_by',
      holdAppliedAt: 'hold_applied_at',
      holdReleasedBy: 'hold_released_by',
      holdReleasedAt: 'hold_released_at',
      closedAt: 'closed_at',
      closedBy: 'closed_by',
      updatedBy: 'updated_by',
      metadata: 'metadata',
      tags: 'tags',
    }

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in updates) {
        const value = (updates as any)[key]
        if (value !== undefined) {
          if (['conditions', 'escalationPath', 'override', 'metadata', 'tags'].includes(key)) {
            updateFields.push(`${dbField} = $${paramIndex}`)
            params.push(JSON.stringify(value))
          } else if (key.includes('At') && value) {
            updateFields.push(`${dbField} = $${paramIndex}`)
            params.push(new Date(value).toISOString())
          } else {
            updateFields.push(`${dbField} = $${paramIndex}`)
            params.push(value)
          }
          paramIndex++
        }
      }
    }

    if (updateFields.length === 0) {
      return existing
    }

    updateFields.push(`updated_at = $${paramIndex}`)
    params.push(new Date().toISOString())
    paramIndex++

    params.push(id)

    const query = `UPDATE decisions SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`
    await this.db.query(query, params)

    return updated
  }

  /**
   * Query decisions
   */
  async query(filters: {
    tenantId?: string
    module?: string
    entityType?: string
    entityId?: string
    status?: string[]
    primitive?: string[]
    decidedBy?: string
    dateRange?: { from: Date; to: Date }
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ decisions: DecisionRecord[]; total: number }> {
    let query = 'SELECT * FROM decisions WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters.tenantId) {
      query += ` AND tenant_id = $${paramIndex}`
      params.push(filters.tenantId)
      paramIndex++
    }

    if (filters.module) {
      query += ` AND module = $${paramIndex}`
      params.push(filters.module)
      paramIndex++
    }

    if (filters.entityType) {
      query += ` AND entity_type = $${paramIndex}`
      params.push(filters.entityType)
      paramIndex++
    }

    if (filters.entityId) {
      query += ` AND entity_id = $${paramIndex}`
      params.push(filters.entityId)
      paramIndex++
    }

    if (filters.status && filters.status.length > 0) {
      query += ` AND status = ANY($${paramIndex})`
      params.push(filters.status)
      paramIndex++
    }

    if (filters.primitive && filters.primitive.length > 0) {
      query += ` AND primitive = ANY($${paramIndex})`
      params.push(filters.primitive)
      paramIndex++
    }

    if (filters.decidedBy) {
      query += ` AND decided_by = $${paramIndex}`
      params.push(filters.decidedBy)
      paramIndex++
    }

    if (filters.dateRange) {
      query += ` AND created_at >= $${paramIndex}`
      params.push(filters.dateRange.from.toISOString())
      paramIndex++
      query += ` AND created_at <= $${paramIndex}`
      params.push(filters.dateRange.to.toISOString())
      paramIndex++
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
    const countResult = await this.db.query<{ total: number }>(countQuery, params)
    const total = parseInt(countResult[0]?.total?.toString() || '0')

    // Add sorting
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`

    // Add pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`
      params.push(filters.limit)
      paramIndex++
      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`
        params.push(filters.offset)
      }
    }

    const results = await this.db.query<any>(query, params)
    const decisions = await Promise.all(
      results.map(async (row) => {
        const decision = this.mapRowToDecision(row)
        decision.controlsApplied = await this.getControls(decision.id)
        decision.evidenceIds = await this.getEvidenceIds(decision.id)
        decision.evidenceHashes = await this.getEvidenceHashes(decision.id)
        decision.complianceChecks = await this.getComplianceChecks(decision.id)
        return decision
      })
    )

    return { decisions, total }
  }

  /**
   * Insert controls
   */
  private async insertControls(decisionId: string, controls: ControlReference[]): Promise<void> {
    if (controls.length === 0) return

    const values = controls.map((control, index) => {
      const baseIndex = index * 11
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11})`
    }).join(', ')

    const query = `
      INSERT INTO decision_controls (
        id, decision_id, control_id, control_type, reference,
        category, version, applied_at, result, notes, severity, evidence_ids
      ) VALUES ${values}
    `

    const params: any[] = []
    controls.forEach(control => {
      params.push(
        `ctrl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        decisionId,
        control.controlId,
        control.controlType,
        control.reference,
        control.category || null,
        control.version || null,
        new Date(control.appliedAt).toISOString(),
        control.result,
        control.notes || null,
        control.severity || null,
        JSON.stringify(control.evidenceIds || [])
      )
    })

    await this.db.query(query, params)
  }

  /**
   * Insert evidence
   */
  private async insertEvidence(decisionId: string, evidenceIds: string[], evidenceHashes: string[]): Promise<void> {
    if (evidenceIds.length === 0) return

    const values = evidenceIds.map((evidenceId, index) => {
      const baseIndex = index * 4
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`
    }).join(', ')

    const query = `
      INSERT INTO decision_evidence (id, decision_id, evidence_id, evidence_hash)
      VALUES ${values}
    `

    const params: any[] = []
    evidenceIds.forEach((evidenceId, index) => {
      params.push(
        `evd-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        decisionId,
        evidenceId,
        evidenceHashes[index] || ''
      )
    })

    await this.db.query(query, params)
  }

  /**
   * Insert compliance checks
   */
  private async insertComplianceChecks(decisionId: string, checks: ComplianceCheck[]): Promise<void> {
    if (checks.length === 0) return

    const values = checks.map((check, index) => {
      const baseIndex = index * 10
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`
    }).join(', ')

    const query = `
      INSERT INTO decision_compliance_checks (
        id, decision_id, requirement_id, authority, region,
        status, checked_at, checked_by, notes, score, violations
      ) VALUES ${values}
    `

    const params: any[] = []
    checks.forEach(check => {
      params.push(
        `chk-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        decisionId,
        check.requirementId || null,
        check.authority || null,
        check.region || null,
        check.status,
        new Date(check.checkedAt).toISOString(),
        check.checkedBy || null,
        check.notes || null,
        check.score || null,
        JSON.stringify(check.violations || [])
      )
    })

    await this.db.query(query, params)
  }

  /**
   * Get controls for decision
   */
  private async getControls(decisionId: string): Promise<ControlReference[]> {
    const query = 'SELECT * FROM decision_controls WHERE decision_id = $1 ORDER BY applied_at'
    const results = await this.db.query<any>(query, [decisionId])

    return results.map((row: any) => ({
      controlId: row.control_id,
      controlType: row.control_type as any,
      reference: row.reference,
      category: row.category,
      version: row.version,
      appliedAt: row.applied_at,
      result: row.result as any,
      notes: row.notes,
      severity: row.severity as any,
      evidenceIds: JSON.parse(row.evidence_ids || '[]'),
    }))
  }

  /**
   * Get evidence IDs for decision
   */
  private async getEvidenceIds(decisionId: string): Promise<string[]> {
    const query = 'SELECT evidence_id FROM decision_evidence WHERE decision_id = $1'
    const results = await this.db.query<{ evidence_id: string }>(query, [decisionId])
    return results.map(r => r.evidence_id)
  }

  /**
   * Get evidence hashes for decision
   */
  private async getEvidenceHashes(decisionId: string): Promise<string[]> {
    const query = 'SELECT evidence_hash FROM decision_evidence WHERE decision_id = $1'
    const results = await this.db.query<{ evidence_hash: string }>(query, [decisionId])
    return results.map(r => r.evidence_hash)
  }

  /**
   * Get compliance checks for decision
   */
  private async getComplianceChecks(decisionId: string): Promise<ComplianceCheck[]> {
    const query = 'SELECT * FROM decision_compliance_checks WHERE decision_id = $1'
    const results = await this.db.query<any>(query, [decisionId])

    return results.map((row: any) => ({
      requirementId: row.requirement_id,
      authority: row.authority,
      region: row.region,
      status: row.status as any,
      checkedAt: row.checked_at,
      checkedBy: row.checked_by,
      notes: row.notes,
      score: row.score,
      violations: JSON.parse(row.violations || '[]'),
    }))
  }

  /**
   * Map database row to DecisionRecord
   */
  private mapRowToDecision(row: any): DecisionRecord {
    return {
      id: row.id,
      version: row.version,
      tenantId: row.tenant_id,
      module: row.module,
      entityType: row.entity_type,
      entityId: row.entity_id,
      status: row.status as any,
      primitive: row.primitive as any,
      reason: row.reason,
      conditions: JSON.parse(row.conditions || '[]'),
      controlsApplied: [], // Loaded separately
      complianceChecks: [], // Loaded separately
      evidenceIds: [], // Loaded separately
      evidenceHashes: [], // Loaded separately
      decidedBy: row.decided_by,
      decidedAt: row.decided_at,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      override: row.override ? JSON.parse(row.override) : undefined,
      escalatedTo: row.escalated_to,
      escalatedAt: row.escalated_at,
      escalationReason: row.escalation_reason,
      escalationPath: JSON.parse(row.escalation_path || '[]'),
      holdReason: row.hold_reason,
      holdUntil: row.hold_until,
      holdAppliedBy: row.hold_applied_by,
      holdAppliedAt: row.hold_applied_at,
      holdReleasedBy: row.hold_released_by,
      holdReleasedAt: row.hold_released_at,
      relatedDecisionIds: JSON.parse(row.related_decision_ids || '[]'),
      parentDecisionId: row.parent_decision_id,
      metadata: JSON.parse(row.metadata || '{}'),
      tags: JSON.parse(row.tags || '[]'),
      correlationId: row.correlation_id,
      traceId: row.trace_id,
      requestId: row.request_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      closedAt: row.closed_at,
      closedBy: row.closed_by,
    }
  }

  /**
   * Delete decision (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    const query = 'UPDATE decisions SET status = $1, closed_at = CURRENT_TIMESTAMP WHERE id = $2'
    const result = await this.db.query(query, ['CLOSED', id])
    return result.length > 0
  }

  /**
   * Get statistics
   */
  async getStatistics(tenantId?: string): Promise<{
    total: number
    byStatus: Record<string, number>
    byPrimitive: Record<string, number>
    byModule: Record<string, number>
    byEntityType: Record<string, number>
  }> {
    let query = 'SELECT status, primitive, module, entity_type, COUNT(*) as count FROM decisions'
    const params: any[] = []
    
    if (tenantId) {
      query += ' WHERE tenant_id = $1'
      params.push(tenantId)
    }
    
    query += ' GROUP BY status, primitive, module, entity_type'
    
    const results = await this.db.query<any>(query, params)
    
    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byPrimitive: {} as Record<string, number>,
      byModule: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
    }
    
    results.forEach((row: any) => {
      stats.total += parseInt(row.count)
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + parseInt(row.count)
      stats.byPrimitive[row.primitive] = (stats.byPrimitive[row.primitive] || 0) + parseInt(row.count)
      stats.byModule[row.module] = (stats.byModule[row.module] || 0) + parseInt(row.count)
      stats.byEntityType[row.entity_type] = (stats.byEntityType[row.entity_type] || 0) + parseInt(row.count)
    })
    
    return stats
  }
}









