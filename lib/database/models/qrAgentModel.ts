/**
 * QR Agent Database Model
 * Production-ready data access layer for QR AI agents
 */

import { DatabaseClient } from '../client'

export interface QRAgentDB {
  id: string
  name: string
  type: string
  status: string
  capabilities: any
  config: any
  performance: any
  current_task?: string
  metadata: any
  created_at: Date
  updated_at: Date
}

export interface QRAgentTaskDB {
  id: string
  agent_id: string
  task_type: string
  target: string
  parameters: any
  status: string
  result?: any
  error?: string
  started_at?: Date
  completed_at?: Date
  created_at: Date
}

export interface QRAgentInsightDB {
  id: string
  agent_id: string
  qr_id?: string
  insight_type: string
  severity: string
  title: string
  description: string
  recommendation?: string
  confidence: number
  actionable: boolean
  estimated_impact: any
  created_at: Date
}

export class QRAgentModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create agent
   */
  async create(agent: {
    id?: string
    name: string
    type: string
    capabilities: string[]
    config: any
  }): Promise<QRAgentDB> {
    const id = agent.id || `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_agents (id, name, type, status, capabilities, config, performance, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const result = await this.db.query<QRAgentDB>(query, [
      id,
      agent.name,
      agent.type,
      'idle',
      JSON.stringify(agent.capabilities),
      JSON.stringify(agent.config),
      JSON.stringify({ tasksCompleted: 0, successRate: 1.0, avgResponseTime: 0 }),
      JSON.stringify({}),
      now,
      now
    ])

    return result[0]
  }

  /**
   * Get agent by ID
   */
  async getById(id: string): Promise<QRAgentDB | null> {
    const query = 'SELECT * FROM qr_agents WHERE id = $1'
    const result = await this.db.query<QRAgentDB>(query, [id])
    return result[0] || null
  }

  /**
   * Get all agents
   */
  async getAll(filters?: { type?: string; status?: string }): Promise<QRAgentDB[]> {
    let query = 'SELECT * FROM qr_agents WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters?.type) {
      query += ` AND type = $${paramIndex}`
      params.push(filters.type)
      paramIndex++
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`
      params.push(filters.status)
      paramIndex++
    }

    query += ' ORDER BY created_at DESC'
    return await this.db.query<QRAgentDB>(query, params)
  }

  /**
   * Update agent
   */
  async update(id: string, updates: Partial<QRAgentDB>): Promise<QRAgentDB | null> {
    const existing = await this.getById(id)
    if (!existing) return null

    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.status) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.performance) {
      fields.push(`performance = $${paramIndex++}`)
      values.push(JSON.stringify(updates.performance))
    }
    if (updates.current_task !== undefined) {
      fields.push(`current_task = $${paramIndex++}`)
      values.push(updates.current_task)
    }
    if (updates.metadata) {
      fields.push(`metadata = $${paramIndex++}`)
      values.push(JSON.stringify(updates.metadata))
    }

    fields.push(`updated_at = $${paramIndex++}`)
    values.push(new Date())

    if (fields.length === 1) return existing // Only updated_at

    values.push(id)
    const query = `UPDATE qr_agents SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
    const result = await this.db.query<QRAgentDB>(query, values)
    return result[0] || null
  }

  /**
   * Create task
   */
  async createTask(task: {
    id?: string
    agentId: string
    type: string
    target: string
    parameters: any
    priority?: string
  }): Promise<QRAgentTaskDB> {
    const id = task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_agent_tasks (id, agent_id, task_type, target, parameters, status, started_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const result = await this.db.query<QRAgentTaskDB>(query, [
      id,
      task.agentId,
      task.type,
      task.target,
      JSON.stringify(task.parameters),
      'pending',
      now,
      now
    ])

    return result[0]
  }

  /**
   * Update task
   */
  async updateTask(id: string, updates: {
    status?: string
    result?: any
    error?: string
    completedAt?: Date
  }): Promise<QRAgentTaskDB | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.status) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.result !== undefined) {
      fields.push(`result = $${paramIndex++}`)
      values.push(JSON.stringify(updates.result))
    }
    if (updates.error) {
      fields.push(`error = $${paramIndex++}`)
      values.push(updates.error)
    }
    if (updates.completedAt) {
      fields.push(`completed_at = $${paramIndex++}`)
      values.push(updates.completedAt)
    }

    if (fields.length === 0) return null

    values.push(id)
    const query = `UPDATE qr_agent_tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
    const result = await this.db.query<QRAgentTaskDB>(query, values)
    return result[0] || null
  }

  /**
   * Get tasks
   */
  async getTasks(filters?: { agentId?: string; status?: string }): Promise<QRAgentTaskDB[]> {
    let query = 'SELECT * FROM qr_agent_tasks WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters?.agentId) {
      query += ` AND agent_id = $${paramIndex++}`
      params.push(filters.agentId)
    }
    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`
      params.push(filters.status)
    }

    query += ' ORDER BY created_at DESC'
    return await this.db.query<QRAgentTaskDB>(query, params)
  }

  /**
   * Create insight
   */
  async createInsight(insight: {
    id?: string
    agentId: string
    qrId?: string
    type: string
    severity: string
    title: string
    description: string
    recommendation?: string
    confidence: number
    actionable: boolean
    estimatedImpact: any
  }): Promise<QRAgentInsightDB> {
    const id = insight.id || `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_agent_insights (
        id, agent_id, qr_id, insight_type, severity, title, description,
        recommendation, confidence, actionable, estimated_impact, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const result = await this.db.query<QRAgentInsightDB>(query, [
      id,
      insight.agentId,
      insight.qrId || null,
      insight.type,
      insight.severity,
      insight.title,
      insight.description,
      insight.recommendation || null,
      insight.confidence,
      insight.actionable,
      JSON.stringify(insight.estimatedImpact),
      now
    ])

    return result[0]
  }

  /**
   * Get insights
   */
  async getInsights(filters?: { agentId?: string; qrId?: string; severity?: string }): Promise<QRAgentInsightDB[]> {
    let query = 'SELECT * FROM qr_agent_insights WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters?.agentId) {
      query += ` AND agent_id = $${paramIndex++}`
      params.push(filters.agentId)
    }
    if (filters?.qrId) {
      query += ` AND qr_id = $${paramIndex++}`
      params.push(filters.qrId)
    }
    if (filters?.severity) {
      query += ` AND severity = $${paramIndex++}`
      params.push(filters.severity)
    }

    query += ' ORDER BY created_at DESC LIMIT 100'
    return await this.db.query<QRAgentInsightDB>(query, params)
  }
}







