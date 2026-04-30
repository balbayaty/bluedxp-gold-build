/**
 * QR Supply Chain Database Model
 * Production-ready data access layer for QR supply chain optimization
 */

import { DatabaseClient } from '../client'

export interface QRSupplyChainPathDB {
  id: string
  path_id: string
  start_qr_id: string
  end_qr_id: string
  total_time?: number
  total_cost?: number
  efficiency?: number
  metadata: any
  created_at: Date
  updated_at: Date
}

export interface QRSupplyChainNodeDB {
  id: string
  path_id: string
  qr_id: string
  node_type: string
  position: number
  metadata: any
  created_at: Date
}

export class QRSupplyChainModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create supply chain path
   */
  async createPath(path: {
    id?: string
    pathId: string
    startQR: string
    endQR: string
    totalTime?: number
    totalCost?: number
    efficiency?: number
    metadata?: any
  }): Promise<QRSupplyChainPathDB> {
    const id = path.id || `path-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_supply_chain_paths (
        id, path_id, start_qr_id, end_qr_id, total_time, total_cost, efficiency, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const result = await this.db.query<QRSupplyChainPathDB>(query, [
      id,
      path.pathId,
      path.startQR,
      path.endQR,
      path.totalTime || null,
      path.totalCost || null,
      path.efficiency || null,
      JSON.stringify(path.metadata || {}),
      now,
      now
    ])

    return result[0]
  }

  /**
   * Get path by ID
   */
  async getPathById(pathId: string): Promise<QRSupplyChainPathDB | null> {
    const query = 'SELECT * FROM qr_supply_chain_paths WHERE path_id = $1 OR id = $1'
    const result = await this.db.query<QRSupplyChainPathDB>(query, [pathId])
    return result[0] || null
  }

  /**
   * Add node to path
   */
  async addNode(pathId: string, node: {
    qrId: string
    nodeType: string
    position: number
    metadata?: any
  }): Promise<QRSupplyChainNodeDB> {
    const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const path = await this.getPathById(pathId)
    if (!path) throw new Error(`Path ${pathId} not found`)

    const query = `
      INSERT INTO qr_supply_chain_path_nodes (id, path_id, qr_id, node_type, position, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const result = await this.db.query<QRSupplyChainNodeDB>(query, [
      id,
      path.id,
      node.qrId,
      node.nodeType,
      node.position,
      JSON.stringify(node.metadata || {}),
      new Date()
    ])

    return result[0]
  }

  /**
   * Get path nodes
   */
  async getPathNodes(pathId: string): Promise<QRSupplyChainNodeDB[]> {
    const path = await this.getPathById(pathId)
    if (!path) return []

    const query = `
      SELECT * FROM qr_supply_chain_path_nodes
      WHERE path_id = $1
      ORDER BY position ASC
    `
    return await this.db.query<QRSupplyChainNodeDB>(query, [path.id])
  }

  /**
   * Add risk
   */
  async addRisk(pathId: string, risk: {
    node: string
    riskType: string
    severity: string
    probability: number
    description?: string
  }): Promise<string> {
    const id = `risk-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const path = await this.getPathById(pathId)
    if (!path) throw new Error(`Path ${pathId} not found`)

    const query = `
      INSERT INTO qr_supply_chain_risks (id, path_id, node, risk_type, severity, probability, description, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `

    const result = await this.db.query<{ id: string }>(query, [
      id,
      path.id,
      risk.node,
      risk.riskType,
      risk.severity,
      risk.probability,
      risk.description || null,
      new Date()
    ])

    return result[0].id
  }

  /**
   * Get path risks
   */
  async getPathRisks(pathId: string): Promise<Array<{
    id: string
    node: string
    riskType: string
    severity: string
    probability: number
    description?: string
    createdAt: Date
  }>> {
    const path = await this.getPathById(pathId)
    if (!path) return []

    const query = `
      SELECT * FROM qr_supply_chain_risks
      WHERE path_id = $1
      ORDER BY created_at DESC
    `
    const result = await this.db.query<any>(query, [path.id])
    return result.map(r => ({
      id: r.id,
      node: r.node,
      riskType: r.risk_type,
      severity: r.severity,
      probability: r.probability,
      description: r.description,
      createdAt: r.created_at
    }))
  }

  /**
   * Add optimization
   */
  async addOptimization(pathId: string, optimization: {
    type: string
    description: string
    impact: any
  }): Promise<string> {
    const id = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const path = await this.getPathById(pathId)
    if (!path) throw new Error(`Path ${pathId} not found`)

    const query = `
      INSERT INTO qr_supply_chain_optimizations (id, path_id, optimization_type, description, impact, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `

    const result = await this.db.query<{ id: string }>(query, [
      id,
      path.id,
      optimization.type,
      optimization.description,
      JSON.stringify(optimization.impact),
      new Date()
    ])

    return result[0].id
  }

  /**
   * Get path optimizations
   */
  async getPathOptimizations(pathId: string): Promise<Array<{
    id: string
    type: string
    description: string
    impact: any
    createdAt: Date
  }>> {
    const path = await this.getPathById(pathId)
    if (!path) return []

    const query = `
      SELECT * FROM qr_supply_chain_optimizations
      WHERE path_id = $1
      ORDER BY created_at DESC
    `
    const result = await this.db.query<any>(query, [path.id])
    return result.map(r => ({
      id: r.id,
      type: r.optimization_type,
      description: r.description,
      impact: typeof r.impact === 'string' ? JSON.parse(r.impact) : r.impact,
      createdAt: r.created_at
    }))
  }
}







