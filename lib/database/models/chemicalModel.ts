/**
 * Chemical Database Model
 * Production-ready data access layer for chemicals
 */

import { DatabaseClient } from '../client'
import { ChemicalSchema } from '../schema'
import { Chemical } from '@/types/chemical'

export class ChemicalModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create a new chemical
   */
  async create(chemical: Omit<ChemicalSchema, 'id' | 'metadata'> & { id?: string }): Promise<ChemicalSchema> {
    const id = chemical.id || `chem-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()
    
    const chemicalData: ChemicalSchema = {
      id,
      ...chemical,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: chemical.metadata?.createdBy || 'system',
        version: 1,
        tags: chemical.metadata?.tags || [],
      }
    }

    // Insert into database
    const query = `
      INSERT INTO chemicals (
        id, name, cas_number, un_number, formula, molecular_weight,
        category, subcategory, manufacturer, supplier,
        hazards, storage, transport, compliance, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `

    const result = await this.db.query<ChemicalSchema>(query, [
      chemicalData.id,
      chemicalData.name,
      chemicalData.casNumber,
      chemicalData.unNumber,
      chemicalData.formula,
      chemicalData.molecularWeight,
      chemicalData.category,
      chemicalData.subcategory,
      chemicalData.manufacturer,
      chemicalData.supplier,
      JSON.stringify(chemicalData.hazards),
      JSON.stringify(chemicalData.storage),
      JSON.stringify(chemicalData.transport),
      JSON.stringify(chemicalData.compliance),
      JSON.stringify(chemicalData.metadata),
    ])

    return result[0]
  }

  /**
   * Get chemical by ID
   */
  async getById(id: string): Promise<ChemicalSchema | null> {
    const query = 'SELECT * FROM chemicals WHERE id = $1'
    const result = await this.db.query<ChemicalSchema>(query, [id])
    return result[0] || null
  }

  /**
   * Get chemical by CAS number
   */
  async getByCAS(casNumber: string): Promise<ChemicalSchema | null> {
    const query = 'SELECT * FROM chemicals WHERE cas_number = $1'
    const result = await this.db.query<ChemicalSchema>(query, [casNumber])
    return result[0] || null
  }

  /**
   * Search chemicals
   */
  async search(filters: {
    query?: string
    category?: string
    casNumber?: string
    limit?: number
    offset?: number
  }): Promise<{ chemicals: ChemicalSchema[]; total: number }> {
    let query = 'SELECT * FROM chemicals WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters.query) {
      query += ` AND (name ILIKE $${paramIndex} OR cas_number ILIKE $${paramIndex})`
      params.push(`%${filters.query}%`)
      paramIndex++
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`
      params.push(filters.category)
      paramIndex++
    }

    if (filters.casNumber) {
      query += ` AND cas_number = $${paramIndex}`
      params.push(filters.casNumber)
      paramIndex++
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
    const countResult = await this.db.query<{ total: number }>(countQuery, params)
    const total = countResult[0]?.total || 0

    // Get results with pagination
    query += ` ORDER BY metadata->>'createdAt' DESC`
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`
      params.push(filters.limit)
      paramIndex++
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }

    const chemicals = await this.db.query<ChemicalSchema>(query, params)

    return { chemicals, total }
  }

  /**
   * Update chemical
   */
  async update(id: string, updates: Partial<ChemicalSchema>): Promise<ChemicalSchema | null> {
    const existing = await this.getById(id)
    if (!existing) return null

    const updated: ChemicalSchema = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
        version: existing.metadata.version + 1,
      }
    }

    const query = `
      UPDATE chemicals SET
        name = $2, cas_number = $3, un_number = $4, formula = $5,
        molecular_weight = $6, category = $7, subcategory = $8,
        manufacturer = $9, supplier = $10, hazards = $11, storage = $12,
        transport = $13, compliance = $14, metadata = $15
      WHERE id = $1
      RETURNING *
    `

    const result = await this.db.query<ChemicalSchema>(query, [
      id,
      updated.name,
      updated.casNumber,
      updated.unNumber,
      updated.formula,
      updated.molecularWeight,
      updated.category,
      updated.subcategory,
      updated.manufacturer,
      updated.supplier,
      JSON.stringify(updated.hazards),
      JSON.stringify(updated.storage),
      JSON.stringify(updated.transport),
      JSON.stringify(updated.compliance),
      JSON.stringify(updated.metadata),
    ])

    return result[0] || null
  }

  /**
   * Delete chemical
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM chemicals WHERE id = $1'
    await this.db.execute(query, [id])
    return true
  }

  /**
   * Get all chemicals
   */
  async getAll(limit?: number, offset?: number): Promise<ChemicalSchema[]> {
    let query = 'SELECT * FROM chemicals ORDER BY metadata->>\'createdAt\' DESC'
    const params: any[] = []

    if (limit) {
      query += ` LIMIT $1`
      params.push(limit)
      if (offset) {
        query += ` OFFSET $2`
        params.push(offset)
      }
    }

    return await this.db.query<ChemicalSchema>(query, params)
  }
}











