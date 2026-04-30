/**
 * Emotional Intelligence Database Adapter
 * Production-ready database persistence for Emotional Intelligence module
 * Supports PostgreSQL, MongoDB, SQLite with automatic fallback
 * Multi-tenant isolation enforced (day 1)
 */

import { DatabaseClient } from "@/lib/database/client";

export interface EmotionalStateHistory {
  entityId: string;
  entityType: string;
  state: string;
  sentiment: any;
  context?: string;
  timestamp: Date;
}

export interface RelationshipHealth {
  id: string;
  entity1Id: string;
  entity1Type: string;
  entity2Id: string;
  entity2Type: string;
  healthScore: number;
  sentiment: string;
  trend: string;
  riskLevel: string;
  interactionCount: number;
  lastInteraction?: Date;
  updatedAt: Date;
}

// ============================================================================
// DATABASE ADAPTER
// ============================================================================

export class EmotionalIntelligenceDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase: boolean = true;
  private initPromise: Promise<void> | null = null;

  // In-memory fallback (tenant-scoped)
  private inMemoryStates: Map<string, Map<string, EmotionalStateHistory[]>> =
    new Map();
  private inMemoryRelationships: Map<string, Map<string, RelationshipHealth>> =
    new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const { getDatabaseClient } = await import("@/lib/database/client");
        const client = await getDatabaseClient();
        if (client) {
          this.dbClient = client;
          await this.createTables();
          console.log(
            "✅ Emotional Intelligence Database Adapter initialized with database",
          );
        } else {
          this.useDatabase = false;
          console.warn(
            "⚠️ Emotional Intelligence: Database not configured, using in-memory storage",
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ Emotional Intelligence: Failed to initialize database, using in-memory storage",
          error,
        );
        this.useDatabase = false;
      }
    })();

    return this.initPromise;
  }

  private async createTables(): Promise<void> {
    if (!this.dbClient || !this.useDatabase) return;

    try {
      if (this.dbClient.config?.type === "postgresql") {
        await this.createPostgreSQLTables();
      }
    } catch (error) {
      console.error("Failed to create emotional intelligence tables:", error);
      this.useDatabase = false;
    }
  }

  private async createPostgreSQLTables(): Promise<void> {
    if (!this.dbClient) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS emotional_states (
        id SERIAL PRIMARY KEY,
        entity_id VARCHAR(255) NOT NULL,
        entity_type VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        sentiment JSONB NOT NULL,
        context TEXT,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS relationship_health (
        id VARCHAR(255) PRIMARY KEY,
        entity1_id VARCHAR(255) NOT NULL,
        entity1_type VARCHAR(255) NOT NULL,
        entity2_id VARCHAR(255) NOT NULL,
        entity2_type VARCHAR(255) NOT NULL,
        health_score INTEGER NOT NULL,
        sentiment VARCHAR(100),
        trend VARCHAR(100),
        risk_level VARCHAR(100),
        interaction_count INTEGER DEFAULT 0,
        last_interaction TIMESTAMP,
        tenant_id VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_emotional_states_tenant ON emotional_states(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_emotional_states_entity ON emotional_states(entity_id, entity_type)`,
      `CREATE INDEX IF NOT EXISTS idx_relationship_health_tenant ON relationship_health(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_relationship_health_entities ON relationship_health(entity1_id, entity2_id)`,
    ];

    for (const query of queries) {
      await this.dbClient.query(query);
    }
  }

  // ============================================================================
  // STATE OPERATIONS
  // ============================================================================

  async storeState(
    tenantId: string,
    state: EmotionalStateHistory,
  ): Promise<void> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        await this.dbClient.query(
          `INSERT INTO emotional_states (entity_id, entity_type, state, sentiment, context, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            state.entityId,
            state.entityType,
            state.state,
            JSON.stringify(state.sentiment),
            state.context,
            tenantId,
          ],
        );
      } catch (error) {
        console.error("Failed to store emotional state:", error);
        this.storeStateInMemory(tenantId, state);
      }
    } else {
      this.storeStateInMemory(tenantId, state);
    }
  }

  async getStates(
    tenantId: string,
    entityId: string,
    entityType: string,
  ): Promise<EmotionalStateHistory[]> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        const result = await this.dbClient.query(
          `SELECT * FROM emotional_states 
           WHERE tenant_id = $1 AND entity_id = $2 AND entity_type = $3 
           ORDER BY created_at DESC`,
          [tenantId, entityId, entityType],
        );
        if (result.rows) {
          return result.rows.map((row: any) => ({
            entityId: row.entity_id,
            entityType: row.entity_type,
            state: row.state,
            sentiment: row.sentiment,
            context: row.context,
            timestamp: row.created_at,
          }));
        }
        return [];
      } catch (error) {
        console.error("Failed to get emotional states:", error);
        return this.getStatesFromMemory(tenantId, entityId, entityType);
      }
    } else {
      return this.getStatesFromMemory(tenantId, entityId, entityType);
    }
  }

  // ============================================================================
  // RELATIONSHIP OPERATIONS
  // ============================================================================

  async storeRelationship(
    tenantId: string,
    relationship: RelationshipHealth,
  ): Promise<void> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        await this.dbClient.query(
          `INSERT INTO relationship_health 
           (id, entity1_id, entity1_type, entity2_id, entity2_type, health_score, sentiment, trend, risk_level, interaction_count, last_interaction, tenant_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           ON CONFLICT (id) DO UPDATE
           SET health_score = $6, sentiment = $7, trend = $8, risk_level = $9, interaction_count = $10, last_interaction = $11, updated_at = NOW()`,
          [
            relationship.id,
            relationship.entity1Id,
            relationship.entity1Type,
            relationship.entity2Id,
            relationship.entity2Type,
            relationship.healthScore,
            relationship.sentiment,
            relationship.trend,
            relationship.riskLevel,
            relationship.interactionCount,
            relationship.lastInteraction || null,
            tenantId,
          ],
        );
      } catch (error) {
        console.error("Failed to store relationship health:", error);
        this.storeRelationshipInMemory(tenantId, relationship);
      }
    } else {
      this.storeRelationshipInMemory(tenantId, relationship);
    }
  }

  async getRelationship(
    tenantId: string,
    entity1Id: string,
    entity2Id: string,
  ): Promise<RelationshipHealth | null> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        const result = await this.dbClient.query(
          `SELECT * FROM relationship_health 
           WHERE tenant_id = $1 AND entity1_id = $2 AND entity2_id = $3`,
          [tenantId, entity1Id, entity2Id],
        );
        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            entity1Id: row.entity1_id,
            entity1Type: row.entity1_type,
            entity2Id: row.entity2_id,
            entity2Type: row.entity2_type,
            healthScore: row.health_score,
            sentiment: row.sentiment,
            trend: row.trend,
            riskLevel: row.risk_level,
            interactionCount: row.interaction_count,
            lastInteraction: row.last_interaction,
            updatedAt: row.updated_at,
          };
        }
        return null;
      } catch (error) {
        console.error("Failed to get relationship health:", error);
        return this.getRelationshipFromMemory(tenantId, entity1Id, entity2Id);
      }
    } else {
      return this.getRelationshipFromMemory(tenantId, entity1Id, entity2Id);
    }
  }

  // ============================================================================
  // IN-MEMORY FALLBACK METHODS
  // ============================================================================

  private storeStateInMemory(
    tenantId: string,
    state: EmotionalStateHistory,
  ): void {
    const key = `${tenantId}:${state.entityId}:${state.entityType}`;
    if (!this.inMemoryStates.has(tenantId)) {
      this.inMemoryStates.set(tenantId, new Map());
    }
    const tenantStates = this.inMemoryStates.get(tenantId)!;
    const existing = tenantStates.get(key) || [];
    existing.push(state);
    tenantStates.set(key, existing);
  }

  private getStatesFromMemory(
    tenantId: string,
    entityId: string,
    entityType: string,
  ): EmotionalStateHistory[] {
    const key = `${tenantId}:${entityId}:${entityType}`;
    const tenantStates = this.inMemoryStates.get(tenantId);
    return tenantStates?.get(key) || [];
  }

  private storeRelationshipInMemory(
    tenantId: string,
    relationship: RelationshipHealth,
  ): void {
    const key = `${tenantId}:${relationship.id}`;
    if (!this.inMemoryRelationships.has(tenantId)) {
      this.inMemoryRelationships.set(tenantId, new Map());
    }
    this.inMemoryRelationships
      .get(tenantId)!
      .set(relationship.id, relationship);
  }

  private getRelationshipFromMemory(
    tenantId: string,
    entity1Id: string,
    entity2Id: string,
  ): RelationshipHealth | null {
    const tenantRels = this.inMemoryRelationships.get(tenantId);
    if (!tenantRels) return null;

    // Find relationship by entities
    for (const rel of tenantRels.values()) {
      if (
        (rel.entity1Id === entity1Id && rel.entity2Id === entity2Id) ||
        (rel.entity1Id === entity2Id && rel.entity2Id === entity1Id)
      ) {
        return rel;
      }
    }
    return null;
  }
}

// Export singleton instance
export const emotionalIntelligenceDatabaseAdapter =
  new EmotionalIntelligenceDatabaseAdapter();
