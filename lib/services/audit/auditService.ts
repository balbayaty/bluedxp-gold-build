/**
 * Comprehensive Audit Trail Service
 * Production-ready audit logging for compliance and security
 */

import { DatabaseClient } from '@/lib/database/client'
import { AuditLogSchema } from '@/lib/database/schema'

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'export' | 'import' | 'login' | 'logout' | 'access_denied' | 'dispute'
export type EntityType = 'chemical' | 'container' | 'msds' | 'qr_code' | 'notification' | 'user' | 'tenant' | 'compliance' | 'incident' | 'training' | 'evidence' | 'truth_event' | 'adversarial_review'

export interface AuditLog {
  id: string
  entityType: EntityType
  entityId: string
  action: AuditAction
  userId: string
  userName?: string
  timestamp: Date
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  metadata: {
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    requestId?: string
    tenantId?: string
    location?: string
    [key: string]: any // Allow additional metadata properties
  }
  compliance: {
    requiresAudit: boolean
    complianceType?: string
    regulatoryRequirement?: string
  }
}

export interface AuditLogFilter {
  entityType?: EntityType
  entityId?: string
  action?: AuditAction
  userId?: string
  tenantId?: string
  startDate?: Date
  endDate?: Date
  complianceType?: string
  limit?: number
  offset?: number
}

export interface AuditStatistics {
  totalLogs: number
  byAction: Record<AuditAction, number>
  byEntityType: Record<EntityType, number>
  byUser: Record<string, number>
  complianceLogs: number
  recentActivity: AuditLog[]
}

export class AuditService {
  private db: DatabaseClient
  private memoryBuffer: AuditLog[] = []
  private bufferSize: number = 100
  private flushInterval: NodeJS.Timeout | null = null
  private schemaReady = false
  private schemaPromise: Promise<void> | null = null

  constructor(db?: DatabaseClient) {
    this.db = db as any
    this.startFlushInterval()
  }

  /**
   * Set database client
   */
  setDatabaseClient(db: DatabaseClient): void {
    this.db = db
    // Best-effort schema check on startup (non-blocking)
    void this.ensureSchema()
  }

  private normalizeAction(value: unknown): AuditAction {
    const v = String(value || '').trim() as AuditAction
    const allowed: Set<AuditAction> = new Set([
      'create',
      'update',
      'delete',
      'view',
      'approve',
      'reject',
      'export',
      'import',
      'login',
      'logout',
      'access_denied',
      'dispute',
    ])
    if (allowed.has(v)) return v
    return 'update'
  }

  private normalizeEntityType(value: unknown): EntityType {
    const v = String(value || '').trim() as EntityType
    const allowed: Set<EntityType> = new Set([
      'chemical',
      'container',
      'msds',
      'qr_code',
      'notification',
      'user',
      'tenant',
      'compliance',
      'incident',
      'training',
      'evidence',
      'truth_event',
      'adversarial_review',
    ])
    if (allowed.has(v)) return v
    return 'compliance'
  }

  private coerceJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'object') return value as T
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return fallback
      try {
        return JSON.parse(trimmed) as T
      } catch {
        return fallback
      }
    }
    return fallback
  }

  private normalizeCompliance(value: unknown): AuditLog['compliance'] {
    const raw = this.coerceJson<Partial<AuditLog['compliance']>>(value, {})
    return {
      requiresAudit: Boolean(raw.requiresAudit ?? false),
      complianceType: raw.complianceType,
      regulatoryRequirement: raw.regulatoryRequirement,
    }
  }

  private normalizeMetadata(value: unknown): AuditLog['metadata'] {
    const raw = this.coerceJson<Record<string, unknown>>(value, {})
    return raw as AuditLog['metadata']
  }

  private normalizeChanges(value: unknown): AuditLog['changes'] {
    return this.coerceJson<AuditLog['changes']>(value, [])
  }

  private async ensureSchema(): Promise<void> {
    if (!this.db) return
    if (this.schemaReady) return
    if (this.schemaPromise) return this.schemaPromise

    this.schemaPromise = (async () => {
      try {
        const dbType = process.env.DATABASE_TYPE || 'postgresql'

        if (dbType === 'postgresql') {
          await this.db.query(`
            -- NOTE: This service stores "entity audit logs" (entityType/entityId/changes).
            -- The Prisma model AuditLog also maps to the physical table name "audit_logs"
            -- but uses a different schema (eventType/resource/status/...).
            -- To avoid collisions, use a dedicated table here.
            CREATE TABLE IF NOT EXISTS entity_audit_logs (
              id VARCHAR(255) PRIMARY KEY,
              entity_type VARCHAR(100) NOT NULL,
              entity_id VARCHAR(255) NOT NULL,
              action VARCHAR(50) NOT NULL,
              user_id VARCHAR(255) NOT NULL,
              user_name VARCHAR(255),
              timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              changes JSONB NOT NULL DEFAULT '[]'::jsonb,
              metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
              compliance JSONB NOT NULL DEFAULT '{}'::jsonb
            );
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_ts ON entity_audit_logs(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_entity ON entity_audit_logs(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_action ON entity_audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_user ON entity_audit_logs(user_id);
          `)
        } else if (dbType === 'sqlite') {
          await this.db.query(`
            CREATE TABLE IF NOT EXISTS entity_audit_logs (
              id TEXT PRIMARY KEY,
              entity_type TEXT NOT NULL,
              entity_id TEXT NOT NULL,
              action TEXT NOT NULL,
              user_id TEXT NOT NULL,
              user_name TEXT,
              timestamp TEXT NOT NULL,
              changes TEXT NOT NULL,
              metadata TEXT NOT NULL,
              compliance TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_ts ON entity_audit_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_entity ON entity_audit_logs(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_action ON entity_audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_entity_audit_logs_user ON entity_audit_logs(user_id);
          `)
        }

        this.schemaReady = true
      } finally {
        this.schemaPromise = null
      }
    })()

    return this.schemaPromise
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval(): void {
    // Flush buffer every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer()
    }, 30000)
  }

  /**
   * Stop flush interval
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flushBuffer() // Flush remaining logs
  }

  /**
   * Log an audit event
   */
  async log(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const timestamp = new Date()

    const fullLog: AuditLog = {
      id,
      timestamp,
      ...auditLog,
      // Normalize critical fields to guarantee DB constraints
      entityType: this.normalizeEntityType((auditLog as any).entityType),
      entityId: String((auditLog as any).entityId || ''),
      action: this.normalizeAction((auditLog as any).action),
      userId: String((auditLog as any).userId || 'system'),
      metadata: (auditLog as any).metadata && typeof (auditLog as any).metadata === 'object' ? (auditLog as any).metadata : {},
      compliance:
        (auditLog as any).compliance && typeof (auditLog as any).compliance === 'object'
          ? {
              requiresAudit: Boolean((auditLog as any).compliance.requiresAudit ?? true),
              complianceType: (auditLog as any).compliance.complianceType,
              regulatoryRequirement: (auditLog as any).compliance.regulatoryRequirement,
            }
          : { requiresAudit: true },
    }

    // Add to memory buffer for batch processing
    this.memoryBuffer.push(fullLog)

    // Flush if buffer is full
    if (this.memoryBuffer.length >= this.bufferSize) {
      await this.flushBuffer()
    }

    return fullLog
  }

  /**
   * Flush memory buffer to database
   */
  private async flushBuffer(): Promise<void> {
    if (this.memoryBuffer.length === 0 || !this.db) return
    await this.ensureSchema()

    const logsToFlush = [...this.memoryBuffer]
    this.memoryBuffer = []

    try {
      const query = `
        INSERT INTO entity_audit_logs (
          id, entity_type, entity_id, action, user_id, user_name,
          timestamp, changes, metadata, compliance
        ) VALUES ${logsToFlush.map((_, i) => 
          `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
        ).join(', ')}
      `

      const params: any[] = []
      logsToFlush.forEach(log => {
        params.push(
          log.id,
          log.entityType,
          log.entityId,
          log.action,
          log.userId,
          log.userName,
          log.timestamp,
          JSON.stringify(log.changes || []),
          JSON.stringify(log.metadata),
          JSON.stringify(log.compliance)
        )
      })

      await this.db.query(query, params)
    } catch (error) {
      console.error('Error flushing audit logs:', error)
      // If schema is missing, try to create it once then retry.
      const msg = error instanceof Error ? error.message : String(error)
      if (
        msg.includes('relation \"entity_audit_logs\" does not exist') ||
        msg.includes('no such table: entity_audit_logs') ||
        msg.includes('relation \"audit_logs\" does not exist') ||
        msg.includes('no such table: audit_logs')
      ) {
        try {
          await this.ensureSchema()
          // Re-add then try again once
          this.memoryBuffer.unshift(...logsToFlush)
          const retry = [...this.memoryBuffer]
          this.memoryBuffer = []
          // Recursively flush once (guarded by schemaReady)
          await this.flushBuffer()
          return
        } catch (e) {
          console.warn('ΓÜá∩╕Å Audit schema creation failed; keeping logs in memory buffer:', e)
        }
      }
      // Re-add to buffer if flush failed
      this.memoryBuffer.unshift(...logsToFlush)
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(filter: AuditLogFilter = {}): Promise<{ logs: AuditLog[]; total: number }> {
    if (!this.db) {
      return { logs: [], total: 0 }
    }

    try {
      let query = 'SELECT * FROM entity_audit_logs WHERE 1=1'
      const params: any[] = []
      let paramIndex = 1

      if (filter.entityType) {
        query += ` AND entity_type = $${paramIndex}`
        params.push(filter.entityType)
        paramIndex++
      }

      if (filter.entityId) {
        query += ` AND entity_id = $${paramIndex}`
        params.push(filter.entityId)
        paramIndex++
      }

      if (filter.action) {
        query += ` AND action = $${paramIndex}`
        params.push(filter.action)
        paramIndex++
      }

      if (filter.userId) {
        query += ` AND user_id = $${paramIndex}`
        params.push(filter.userId)
        paramIndex++
      }

      if (filter.tenantId) {
        query += ` AND metadata->>'tenantId' = $${paramIndex}`
        params.push(filter.tenantId)
        paramIndex++
      }

      if (filter.startDate) {
        query += ` AND timestamp >= $${paramIndex}`
        params.push(filter.startDate)
        paramIndex++
      }

      if (filter.endDate) {
        query += ` AND timestamp <= $${paramIndex}`
        params.push(filter.endDate)
        paramIndex++
      }

      if (filter.complianceType) {
        query += ` AND compliance->>'complianceType' = $${paramIndex}`
        params.push(filter.complianceType)
        paramIndex++
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
      const countResult = await this.db.query<{ total: number }>(countQuery, params)
      const total = countResult[0]?.total || 0

      // Get results with pagination
      query += ' ORDER BY timestamp DESC'
      if (filter.limit) {
        query += ` LIMIT $${paramIndex}`
        params.push(filter.limit)
        paramIndex++
        if (filter.offset) {
          query += ` OFFSET $${paramIndex}`
          params.push(filter.offset)
        }
      }

      const logs = await this.db.query<AuditLogSchema>(query, params)

      return {
        logs: logs.map(log => ({
          id: log.id,
          entityType: log.entityType as EntityType,
          entityId: log.entityId,
          action: log.action as AuditAction,
          userId: log.userId,
          userName: log.userName,
          timestamp: new Date(log.timestamp),
          changes: this.normalizeChanges((log as any).changes),
          metadata: this.normalizeMetadata((log as any).metadata),
          compliance: this.normalizeCompliance((log as any).compliance),
        })),
        total,
      }
    } catch (error) {
      console.error('Error getting audit logs:', error)
      return { logs: [], total: 0 }
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filter?: AuditLogFilter): Promise<AuditStatistics> {
    const { logs } = await this.getLogs({ ...filter, limit: 10000 })

    const statistics: AuditStatistics = {
      totalLogs: logs.length,
      byAction: {} as Record<AuditAction, number>,
      byEntityType: {} as Record<EntityType, number>,
      byUser: {},
      complianceLogs: 0,
      recentActivity: logs.slice(0, 10),
    }

    logs.forEach(log => {
      // Count by action
      statistics.byAction[log.action] = (statistics.byAction[log.action] || 0) + 1

      // Count by entity type
      statistics.byEntityType[log.entityType] = (statistics.byEntityType[log.entityType] || 0) + 1

      // Count by user
      statistics.byUser[log.userId] = (statistics.byUser[log.userId] || 0) + 1

      // Count compliance logs
      if (log.compliance.requiresAudit) {
        statistics.complianceLogs++
      }
    })

    return statistics
  }

  /**
   * Get audit log by ID
   */
  async getLogById(id: string): Promise<AuditLog | null> {
    if (!this.db) return null

    try {
      const query = 'SELECT * FROM entity_audit_logs WHERE id = $1'
      const result = await this.db.query<AuditLogSchema>(query, [id])

      if (result.length === 0) return null

      const log = result[0]
      return {
        id: log.id,
        entityType: log.entityType as EntityType,
        entityId: log.entityId,
        action: log.action as AuditAction,
        userId: log.userId,
        userName: log.userName,
        timestamp: new Date(log.timestamp),
        changes: this.normalizeChanges((log as any).changes),
        metadata: this.normalizeMetadata((log as any).metadata),
        compliance: this.normalizeCompliance((log as any).compliance),
      }
    } catch (error) {
      console.error('Error getting audit log:', error)
      return null
    }
  }

  /**
   * Export audit logs
   */
  /**
   * Log user action
   */
  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    metadata?: any
  ): Promise<void> {
    try {
      await this.log({
        entityType: 'user',
        entityId: userId,
        action: action as AuditAction,
        userId,
        changes: [],
        metadata: {
          resource,
          ...metadata,
        },
        compliance: {
          requiresAudit: true,
        },
      })
    } catch (error) {
      console.error('[AuditService] Error logging user action:', error)
    }
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    change: {
      type: 'granted' | 'revoked' | 'updated'
      permission: any
      reason?: string
    }
  ): Promise<void> {
    try {
      await this.log({
        entityType: 'user',
        entityId: targetUserId,
        action: 'update',
        userId,
        changes: [
          {
            field: 'permissions',
            oldValue: null,
            newValue: change.permission,
          },
        ],
        metadata: {
          changeType: change.type,
          reason: change.reason,
        },
        compliance: {
          requiresAudit: true,
          complianceType: 'permission_change',
        },
      })
    } catch (error) {
      console.error('[AuditService] Error logging permission change:', error)
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: {
    type: 'failed_login' | 'permission_denied' | 'suspicious_activity' | 'account_locked' | 'password_reset' | 'api_key_revoked'
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: any
  }): Promise<void> {
    try {
      await this.log({
        entityType: 'user',
        entityId: event.userId || 'system',
        action: 'access_denied',
        userId: event.userId || 'system',
        changes: [],
        metadata: {
          eventType: event.type,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: event.details,
        },
        compliance: {
          requiresAudit: true,
          complianceType: 'security_event',
        },
      })
    } catch (error) {
      console.error('[AuditService] Error logging security event:', error)
    }
  }

  /**
   * Get audit logs with enhanced query
   */
  async getAuditLog(query: {
    userId?: string
    tenantId?: string
    resource?: string
    action?: string
    startDate?: Date | string
    endDate?: Date | string
    limit?: number
    offset?: number
  }): Promise<any[]> {
    try {
      return await this.getLogs({
        userId: query.userId,
        tenantId: query.tenantId,
        action: query.action as AuditAction,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: query.limit,
        offset: query.offset,
      }).then(result => result.logs)
    } catch (error) {
      console.error('[AuditService] Error getting audit logs:', error)
      return []
    }
  }

  /**
   * Export audit log for compliance
   */
  async exportAuditLog(
    query: {
      userId?: string
      tenantId?: string
      startDate?: Date | string
      endDate?: Date | string
    },
    format: 'csv' | 'json' = 'json'
  ): Promise<string> {
    try {
      return await this.exportLogs(
        {
          userId: query.userId,
          tenantId: query.tenantId,
          startDate: query.startDate,
          endDate: query.endDate,
        },
        format
      )
    } catch (error) {
      console.error('[AuditService] Error exporting audit log:', error)
      throw error
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(
    tenantId: string,
    complianceType: 'GDPR' | 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI_DSS'
  ): Promise<{
    complianceType: string
    period: { start: Date; end: Date }
    totalEvents: number
    securityEvents: number
    permissionChanges: number
    dataAccess: number
    violations: any[]
    recommendations: string[]
  }> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1) // Last 30 days

      const logs = await this.getLogs({
        tenantId,
        startDate,
        endDate,
        limit: 10000,
      })

      const securityEvents = logs.logs.filter(
        l => l.metadata?.eventType || l.action === 'access_denied'
      ).length

      const permissionChanges = logs.logs.filter(
        l => l.metadata?.changeType === 'permission_change'
      ).length

      const dataAccess = logs.logs.filter(
        l => l.action === 'view' || l.action === 'export'
      ).length

      // Check for violations based on compliance type
      const violations: any[] = []
      if (complianceType === 'GDPR') {
        // Check for data access without proper logging
        // Check for missing consent
      }
      if (complianceType === 'SOC2') {
        // Check for security events
        // Check for access control violations
      }

      const recommendations: string[] = []
      if (securityEvents > 100) {
        recommendations.push('High number of security events detected. Review access controls.')
      }
      if (permissionChanges > 50) {
        recommendations.push('Frequent permission changes. Consider implementing approval workflows.')
      }

      return {
        complianceType,
        period: { start: startDate, end: endDate },
        totalEvents: logs.total,
        securityEvents,
        permissionChanges,
        dataAccess,
        violations,
        recommendations,
      }
    } catch (error) {
      console.error('[AuditService] Error getting compliance report:', error)
      throw error
    }
  }

  async exportLogs(filter: AuditLogFilter, format: 'json' | 'csv' = 'json'): Promise<string> {
    const { logs } = await this.getLogs({ ...filter, limit: 100000 })

    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Entity Type', 'Entity ID', 'Action', 'User ID', 'User Name', 'Changes', 'IP Address', 'Compliance']
      const rows = logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.entityType,
        log.entityId,
        log.action,
        log.userId,
        log.userName || '',
        JSON.stringify(log.changes || []),
        log.metadata.ipAddress || '',
        log.compliance.complianceType || '',
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(logs, null, 2)
  }

  /**
   * Create compliance audit report
   */
  async createComplianceReport(complianceType: string, startDate: Date, endDate: Date): Promise<{
    totalLogs: number
    compliantActions: number
    nonCompliantActions: number
    details: AuditLog[]
  }> {
    const { logs } = await this.getLogs({
      complianceType,
      startDate,
      endDate,
      limit: 10000,
    })

    const compliantActions = logs.filter(log => 
      log.compliance.requiresAudit && log.compliance.complianceType === complianceType
    ).length

    return {
      totalLogs: logs.length,
      compliantActions,
      nonCompliantActions: logs.length - compliantActions,
      details: logs,
    }
  }
}

export const auditService = new AuditService()










