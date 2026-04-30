/**
 * QR Network Database Model
 * Production-ready data access layer for QR networks
 */

import { DatabaseClient } from '../client'

export interface QRNetworkDB {
  id: string
  name: string
  description?: string
  network_type: string
  visibility: string
  metadata: any
  created_at: Date
  updated_at: Date
}

export interface QRRelationshipDB {
  id: string
  from_qr_id: string
  to_qr_id: string
  relationship_type: string
  strength: number
  bidirectional: boolean
  metadata: any
  created_at: Date
}

export interface CollaborativeQRDB {
  id: string
  qr_id: string
  metadata: any
  created_at: Date
  updated_at: Date
}

export class QRNetworkModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create network
   */
  async create(network: {
    id?: string
    name: string
    description?: string
    networkType: string
    visibility?: string
    metadata?: any
  }): Promise<QRNetworkDB> {
    const id = network.id || `network-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_networks (id, name, description, network_type, visibility, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const result = await this.db.query<QRNetworkDB>(query, [
      id,
      network.name,
      network.description || null,
      network.networkType,
      network.visibility || 'private',
      JSON.stringify(network.metadata || {}),
      now,
      now
    ])

    return result[0]
  }

  /**
   * Get network by ID
   */
  async getById(id: string): Promise<QRNetworkDB | null> {
    const query = 'SELECT * FROM qr_networks WHERE id = $1'
    const result = await this.db.query<QRNetworkDB>(query, [id])
    return result[0] || null
  }

  /**
   * Get all networks
   */
  async getAll(limit?: number): Promise<QRNetworkDB[]> {
    let query = 'SELECT * FROM qr_networks ORDER BY created_at DESC'
    const params: any[] = []
    
    if (limit) {
      query += ' LIMIT $1'
      params.push(limit)
    }

    return await this.db.query<QRNetworkDB>(query, params)
  }

  /**
   * Add QR code to network
   */
  async addQRToNetwork(networkId: string, qrId: string): Promise<void> {
    const query = `
      INSERT INTO qr_network_qr_codes (network_id, qr_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `
    await this.db.query(query, [networkId, qrId])
  }

  /**
   * Get QR codes in network
   */
  async getNetworkQRCodes(networkId: string): Promise<string[]> {
    const query = 'SELECT qr_id FROM qr_network_qr_codes WHERE network_id = $1'
    const result = await this.db.query<{ qr_id: string }>(query, [networkId])
    return result.map(r => r.qr_id)
  }

  /**
   * Create relationship
   */
  async createRelationship(relationship: {
    id?: string
    from: string
    to: string
    type: string
    strength?: number
    bidirectional?: boolean
    metadata?: any
  }): Promise<QRRelationshipDB> {
    const id = relationship.id || `rel-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO qr_relationships (id, from_qr_id, to_qr_id, relationship_type, strength, bidirectional, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (from_qr_id, to_qr_id, relationship_type) DO UPDATE SET
        strength = EXCLUDED.strength,
        bidirectional = EXCLUDED.bidirectional,
        metadata = EXCLUDED.metadata
      RETURNING *
    `

    const result = await this.db.query<QRRelationshipDB>(query, [
      id,
      relationship.from,
      relationship.to,
      relationship.type,
      relationship.strength || 1.0,
      relationship.bidirectional || false,
      JSON.stringify(relationship.metadata || {}),
      now
    ])

    return result[0]
  }

  /**
   * Get relationships for QR code
   */
  async getRelationships(qrId: string): Promise<QRRelationshipDB[]> {
    const query = `
      SELECT * FROM qr_relationships
      WHERE from_qr_id = $1 OR to_qr_id = $1
      ORDER BY created_at DESC
    `
    return await this.db.query<QRRelationshipDB>(query, [qrId])
  }

  /**
   * Create collaborative QR
   */
  async createCollaborativeQR(qrId: string, metadata?: any): Promise<CollaborativeQRDB> {
    const id = `collab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const query = `
      INSERT INTO collaborative_qr_codes (id, qr_id, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await this.db.query<CollaborativeQRDB>(query, [
      id,
      qrId,
      JSON.stringify(metadata || {}),
      now,
      now
    ])

    return result[0]
  }

  /**
   * Get collaborative QR
   */
  async getCollaborativeQR(qrId: string): Promise<CollaborativeQRDB | null> {
    const query = 'SELECT * FROM collaborative_qr_codes WHERE qr_id = $1'
    const result = await this.db.query<CollaborativeQRDB>(query, [qrId])
    return result[0] || null
  }

  /**
   * Add collaborator
   */
  async addCollaborator(collaborativeQrId: string, userId: string, role: string, permissions: string[]): Promise<void> {
    const id = `collab-user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const query = `
      INSERT INTO collaborative_qr_collaborators (id, collaborative_qr_id, user_id, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (collaborative_qr_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions
    `
    await this.db.query(query, [id, collaborativeQrId, userId, role, JSON.stringify(permissions)])
  }

  /**
   * Get collaborators
   */
  async getCollaborators(collaborativeQrId: string): Promise<Array<{ userId: string; role: string; permissions: string[] }>> {
    const query = 'SELECT user_id, role, permissions FROM collaborative_qr_collaborators WHERE collaborative_qr_id = $1'
    const result = await this.db.query<{ user_id: string; role: string; permissions: any }>(query, [collaborativeQrId])
    return result.map(r => ({
      userId: r.user_id,
      role: r.role,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions
    }))
  }

  /**
   * Add comment
   */
  async addComment(collaborativeQrId: string, userId: string, comment: string, parentCommentId?: string): Promise<string> {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const query = `
      INSERT INTO collaborative_qr_comments (id, collaborative_qr_id, user_id, comment, parent_comment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `
    const result = await this.db.query<{ id: string }>(query, [
      id,
      collaborativeQrId,
      userId,
      comment,
      parentCommentId || null
    ])
    return result[0].id
  }

  /**
   * Get comments
   */
  async getComments(collaborativeQrId: string): Promise<Array<{
    id: string
    userId: string
    comment: string
    parentCommentId?: string
    createdAt: Date
  }>> {
    const query = `
      SELECT id, user_id, comment, parent_comment_id, created_at
      FROM collaborative_qr_comments
      WHERE collaborative_qr_id = $1
      ORDER BY created_at ASC
    `
    const result = await this.db.query<{
      id: string
      user_id: string
      comment: string
      parent_comment_id?: string
      created_at: Date
    }>(query, [collaborativeQrId])
    
    return result.map(r => ({
      id: r.id,
      userId: r.user_id,
      comment: r.comment,
      parentCommentId: r.parent_comment_id,
      createdAt: r.created_at
    }))
  }
}







