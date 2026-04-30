/**
 * Universal Proposal Database Adapter
 *
 * Comprehensive database persistence for universal intelligent proposals
 * Supports PostgreSQL, MongoDB, SQLite with automatic fallback
 * Multi-tenant isolation enforced
 *
 * NOTE: This adapter is used by universalIntelligentProposalService for cross-module proposals.
 * For standard proposal operations, proposalDatabaseService (Prisma-based) is simpler and faster.
 * Both can work together - this adapter provides more flexibility for universal proposals.
 */

import { getDatabaseClient, type DatabaseClient } from "@/lib/database/client";
import type { Proposal } from "@/types/proposals";
import type {
  AIProposalInsight,
  ProposalWinStrategy,
  UniversalProposalConfig,
} from "../universalIntelligentProposalService";

export interface UniversalProposalDatabaseEntry {
  id: string;
  tenantId: string;
  proposalId: string;
  moduleId: string;
  proposalType: string;
  customerId?: string;
  customerName?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  config: any; // JSON
  insights: any; // JSON - AIProposalInsight[]
  winStrategy: any; // JSON - ProposalWinStrategy
  crossModuleData: any; // JSON - CrossModuleProposalData
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export class UniversalProposalDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.dbClient = await getDatabaseClient();
        this.useDatabase = this.dbClient !== null;

        if (this.useDatabase) {
          await this.createTables();
        }
      } catch (error) {
        console.warn(
          "[Universal Proposal DB] Database not available, using in-memory:",
          error,
        );
        this.useDatabase = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Create database tables if using SQL database
   */
  private async createTables(): Promise<void> {
    if (!this.dbClient || this.dbClient.type === "mongodb") {
      return; // MongoDB uses collections, not tables
    }

    try {
      // Create universal_proposals table
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS universal_proposals (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL,
          proposal_id VARCHAR(255) NOT NULL,
          module_id VARCHAR(255) NOT NULL,
          proposal_type VARCHAR(255) NOT NULL,
          customer_id VARCHAR(255),
          customer_name VARCHAR(255),
          related_entity_id VARCHAR(255),
          related_entity_type VARCHAR(255),
          config JSONB,
          insights JSONB,
          win_strategy JSONB,
          cross_module_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255) NOT NULL,
          UNIQUE(tenant_id, proposal_id)
        )
      `);

      // Create indexes
      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_universal_proposals_tenant_id 
        ON universal_proposals(tenant_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_universal_proposals_proposal_id 
        ON universal_proposals(proposal_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_universal_proposals_module_id 
        ON universal_proposals(module_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_universal_proposals_customer_id 
        ON universal_proposals(customer_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_universal_proposals_created_at 
        ON universal_proposals(created_at)
      `);

      // Create proposal_insights table for individual insights
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS proposal_insights (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL,
          proposal_id VARCHAR(255) NOT NULL,
          insight_type VARCHAR(255) NOT NULL,
          priority VARCHAR(255) NOT NULL,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          recommendation TEXT,
          impact JSONB,
          confidence INTEGER,
          actionable BOOLEAN,
          source VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tenant_id, proposal_id, id)
        )
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_proposal_insights_proposal_id 
        ON proposal_insights(proposal_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_proposal_insights_tenant_id 
        ON proposal_insights(tenant_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_proposal_insights_priority 
        ON proposal_insights(priority)
      `);

      // Create proposal_win_strategies table
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS proposal_win_strategies (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL,
          proposal_id VARCHAR(255) NOT NULL UNIQUE,
          win_probability INTEGER NOT NULL,
          key_strengths JSONB,
          potential_weaknesses JSONB,
          recommended_actions JSONB,
          competitive_advantages JSONB,
          risk_factors JSONB,
          pricing_strategy JSONB,
          timing_strategy JSONB,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tenant_id, proposal_id)
        )
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_proposal_win_strategies_proposal_id 
        ON proposal_win_strategies(proposal_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_proposal_win_strategies_tenant_id 
        ON proposal_win_strategies(tenant_id)
      `);

      await this.dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_proposal_win_strategies_win_probability 
        ON proposal_win_strategies(win_probability)
      `);

      console.log("[Universal Proposal DB] Tables created successfully");
    } catch (error) {
      console.error("[Universal Proposal DB] Error creating tables:", error);
      throw error;
    }
  }

  // ============================================================================
  // PROPOSAL STORAGE
  // ============================================================================

  /**
   * Store universal proposal data
   */
  async storeUniversalProposal(
    tenantId: string,
    proposalId: string,
    data: {
      moduleId: string;
      proposalType: string;
      customerId?: string;
      customerName?: string;
      relatedEntityId?: string;
      relatedEntityType?: string;
      config: UniversalProposalConfig;
      insights: AIProposalInsight[];
      winStrategy: ProposalWinStrategy;
      crossModuleData: any;
      createdBy: string;
    },
  ): Promise<void> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return; // In-memory storage handled by service
    }

    try {
      const entry: UniversalProposalDatabaseEntry = {
        id: `universal-${proposalId}`,
        tenantId,
        proposalId,
        moduleId: data.moduleId,
        proposalType: data.proposalType,
        customerId: data.customerId,
        customerName: data.customerName,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
        config: data.config as any,
        insights: data.insights as any,
        winStrategy: data.winStrategy as any,
        crossModuleData: data.crossModuleData as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: data.createdBy,
      };

      if (this.dbClient.type === "mongodb") {
        await this.dbClient
          .collection("universal_proposals")
          .replaceOne({ tenantId, proposalId }, entry, { upsert: true });
      } else {
        // PostgreSQL or SQLite
        await this.dbClient.query(
          `
          INSERT INTO universal_proposals (
            id, tenant_id, proposal_id, module_id, proposal_type,
            customer_id, customer_name, related_entity_id, related_entity_type,
            config, insights, win_strategy, cross_module_data,
            created_at, updated_at, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (tenant_id, proposal_id) 
          DO UPDATE SET
            module_id = EXCLUDED.module_id,
            proposal_type = EXCLUDED.proposal_type,
            customer_id = EXCLUDED.customer_id,
            customer_name = EXCLUDED.customer_name,
            related_entity_id = EXCLUDED.related_entity_id,
            related_entity_type = EXCLUDED.related_entity_type,
            config = EXCLUDED.config,
            insights = EXCLUDED.insights,
            win_strategy = EXCLUDED.win_strategy,
            cross_module_data = EXCLUDED.cross_module_data,
            updated_at = EXCLUDED.updated_at
        `,
          [
            entry.id,
            entry.tenantId,
            entry.proposalId,
            entry.moduleId,
            entry.proposalType,
            entry.customerId || null,
            entry.customerName || null,
            entry.relatedEntityId || null,
            entry.relatedEntityType || null,
            JSON.stringify(entry.config),
            JSON.stringify(entry.insights),
            JSON.stringify(entry.winStrategy),
            JSON.stringify(entry.crossModuleData),
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
          ],
        );
      }

      // Store individual insights
      await this.storeInsights(tenantId, proposalId, data.insights);

      // Store win strategy
      await this.storeWinStrategy(tenantId, proposalId, data.winStrategy);
    } catch (error) {
      console.error("[Universal Proposal DB] Error storing proposal:", error);
      throw error;
    }
  }

  /**
   * Get universal proposal data
   */
  async getUniversalProposal(
    tenantId: string,
    proposalId: string,
  ): Promise<UniversalProposalDatabaseEntry | null> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return null; // In-memory storage handled by service
    }

    try {
      if (this.dbClient.type === "mongodb") {
        const result = await this.dbClient
          .collection("universal_proposals")
          .findOne({
            tenantId,
            proposalId,
          });
        return result as UniversalProposalDatabaseEntry | null;
      } else {
        const result = await this.dbClient.query(
          `
          SELECT * FROM universal_proposals
          WHERE tenant_id = $1 AND proposal_id = $2
        `,
          [tenantId, proposalId],
        );

        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            tenantId: row.tenant_id,
            proposalId: row.proposal_id,
            moduleId: row.module_id,
            proposalType: row.proposal_type,
            customerId: row.customer_id,
            customerName: row.customer_name,
            relatedEntityId: row.related_entity_id,
            relatedEntityType: row.related_entity_type,
            config:
              typeof row.config === "string"
                ? JSON.parse(row.config)
                : row.config,
            insights:
              typeof row.insights === "string"
                ? JSON.parse(row.insights)
                : row.insights,
            winStrategy:
              typeof row.win_strategy === "string"
                ? JSON.parse(row.win_strategy)
                : row.win_strategy,
            crossModuleData:
              typeof row.cross_module_data === "string"
                ? JSON.parse(row.cross_module_data)
                : row.cross_module_data,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
          };
        }
      }
    } catch (error) {
      console.error("[Universal Proposal DB] Error getting proposal:", error);
      return null;
    }

    return null;
  }

  /**
   * List universal proposals
   */
  async listUniversalProposals(
    tenantId: string,
    filters?: {
      moduleId?: string;
      proposalType?: string;
      customerId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<UniversalProposalDatabaseEntry[]> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return []; // In-memory storage handled by service
    }

    try {
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      if (this.dbClient.type === "mongodb") {
        const query: any = { tenantId };
        if (filters?.moduleId) query.moduleId = filters.moduleId;
        if (filters?.proposalType) query.proposalType = filters.proposalType;
        if (filters?.customerId) query.customerId = filters.customerId;

        const results = await this.dbClient
          .collection("universal_proposals")
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 })
          .toArray();

        return results as UniversalProposalDatabaseEntry[];
      } else {
        let query = "SELECT * FROM universal_proposals WHERE tenant_id = $1";
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (filters?.moduleId) {
          query += ` AND module_id = $${paramIndex}`;
          params.push(filters.moduleId);
          paramIndex++;
        }

        if (filters?.proposalType) {
          query += ` AND proposal_type = $${paramIndex}`;
          params.push(filters.proposalType);
          paramIndex++;
        }

        if (filters?.customerId) {
          query += ` AND customer_id = $${paramIndex}`;
          params.push(filters.customerId);
          paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await this.dbClient.query(query, params);

        return result.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          proposalId: row.proposal_id,
          moduleId: row.module_id,
          proposalType: row.proposal_type,
          customerId: row.customer_id,
          customerName: row.customer_name,
          relatedEntityId: row.related_entity_id,
          relatedEntityType: row.related_entity_type,
          config:
            typeof row.config === "string"
              ? JSON.parse(row.config)
              : row.config,
          insights:
            typeof row.insights === "string"
              ? JSON.parse(row.insights)
              : row.insights,
          winStrategy:
            typeof row.win_strategy === "string"
              ? JSON.parse(row.win_strategy)
              : row.win_strategy,
          crossModuleData:
            typeof row.cross_module_data === "string"
              ? JSON.parse(row.cross_module_data)
              : row.cross_module_data,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by,
        }));
      }
    } catch (error) {
      console.error("[Universal Proposal DB] Error listing proposals:", error);
      return [];
    }
  }

  // ============================================================================
  // INSIGHTS STORAGE
  // ============================================================================

  /**
   * Store insights
   */
  async storeInsights(
    tenantId: string,
    proposalId: string,
    insights: AIProposalInsight[],
  ): Promise<void> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return;
    }

    try {
      for (const insight of insights) {
        if (this.dbClient.type === "mongodb") {
          await this.dbClient.collection("proposal_insights").replaceOne(
            { tenantId, proposalId, id: insight.id },
            {
              id: insight.id,
              tenantId,
              proposalId,
              insightType: insight.type,
              priority: insight.priority,
              title: insight.title,
              description: insight.description,
              recommendation: insight.recommendation,
              impact: insight.impact,
              confidence: insight.confidence,
              actionable: insight.actionable,
              source: insight.source,
              metadata: insight.metadata || {},
              createdAt: new Date().toISOString(),
            },
            { upsert: true },
          );
        } else {
          await this.dbClient.query(
            `
            INSERT INTO proposal_insights (
              id, tenant_id, proposal_id, insight_type, priority,
              title, description, recommendation, impact, confidence,
              actionable, source, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (tenant_id, proposal_id, id) 
            DO UPDATE SET
              insight_type = EXCLUDED.insight_type,
              priority = EXCLUDED.priority,
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              recommendation = EXCLUDED.recommendation,
              impact = EXCLUDED.impact,
              confidence = EXCLUDED.confidence,
              actionable = EXCLUDED.actionable,
              source = EXCLUDED.source,
              metadata = EXCLUDED.metadata
          `,
            [
              insight.id,
              tenantId,
              proposalId,
              insight.type,
              insight.priority,
              insight.title,
              insight.description,
              insight.recommendation,
              JSON.stringify(insight.impact || {}),
              insight.confidence,
              insight.actionable,
              insight.source,
              JSON.stringify(insight.metadata || {}),
              new Date().toISOString(),
            ],
          );
        }
      }
    } catch (error) {
      console.error("[Universal Proposal DB] Error storing insights:", error);
    }
  }

  /**
   * Get insights for a proposal
   */
  async getInsights(
    tenantId: string,
    proposalId: string,
  ): Promise<AIProposalInsight[]> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return [];
    }

    try {
      if (this.dbClient.type === "mongodb") {
        const results = await this.dbClient
          .collection("proposal_insights")
          .find({ tenantId, proposalId })
          .sort({ priority: -1, confidence: -1 })
          .toArray();

        return results.map((row: any) => ({
          id: row.id,
          type: row.insightType,
          priority: row.priority,
          title: row.title,
          description: row.description,
          recommendation: row.recommendation,
          impact: row.impact,
          confidence: row.confidence,
          actionable: row.actionable,
          source: row.source,
          metadata: row.metadata,
        })) as AIProposalInsight[];
      } else {
        const result = await this.dbClient.query(
          `
          SELECT * FROM proposal_insights
          WHERE tenant_id = $1 AND proposal_id = $2
          ORDER BY 
            CASE priority
              WHEN 'CRITICAL' THEN 4
              WHEN 'HIGH' THEN 3
              WHEN 'MEDIUM' THEN 2
              WHEN 'LOW' THEN 1
            END DESC,
            confidence DESC
        `,
          [tenantId, proposalId],
        );

        return result.rows.map((row: any) => ({
          id: row.id,
          type: row.insight_type,
          priority: row.priority,
          title: row.title,
          description: row.description,
          recommendation: row.recommendation,
          impact:
            typeof row.impact === "string"
              ? JSON.parse(row.impact)
              : row.impact,
          confidence: row.confidence,
          actionable: row.actionable,
          source: row.source,
          metadata:
            typeof row.metadata === "string"
              ? JSON.parse(row.metadata)
              : row.metadata,
        })) as AIProposalInsight[];
      }
    } catch (error) {
      console.error("[Universal Proposal DB] Error getting insights:", error);
      return [];
    }
  }

  // ============================================================================
  // WIN STRATEGY STORAGE
  // ============================================================================

  /**
   * Store win strategy
   */
  async storeWinStrategy(
    tenantId: string,
    proposalId: string,
    winStrategy: ProposalWinStrategy,
  ): Promise<void> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return;
    }

    try {
      if (this.dbClient.type === "mongodb") {
        await this.dbClient.collection("proposal_win_strategies").replaceOne(
          { tenantId, proposalId },
          {
            id: `win-strategy-${proposalId}`,
            tenantId,
            proposalId,
            winProbability: winStrategy.winProbability,
            keyStrengths: winStrategy.keyStrengths,
            potentialWeaknesses: winStrategy.potentialWeaknesses,
            recommendedActions: winStrategy.recommendedActions,
            competitiveAdvantages: winStrategy.competitiveAdvantages,
            riskFactors: winStrategy.riskFactors,
            pricingStrategy: winStrategy.pricingStrategy,
            timingStrategy: winStrategy.timingStrategy,
            generatedAt: winStrategy.generatedAt,
          },
          { upsert: true },
        );
      } else {
        await this.dbClient.query(
          `
          INSERT INTO proposal_win_strategies (
            id, tenant_id, proposal_id, win_probability,
            key_strengths, potential_weaknesses, recommended_actions,
            competitive_advantages, risk_factors, pricing_strategy,
            timing_strategy, generated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (tenant_id, proposal_id) 
          DO UPDATE SET
            win_probability = EXCLUDED.win_probability,
            key_strengths = EXCLUDED.key_strengths,
            potential_weaknesses = EXCLUDED.potential_weaknesses,
            recommended_actions = EXCLUDED.recommended_actions,
            competitive_advantages = EXCLUDED.competitive_advantages,
            risk_factors = EXCLUDED.risk_factors,
            pricing_strategy = EXCLUDED.pricing_strategy,
            timing_strategy = EXCLUDED.timing_strategy,
            generated_at = EXCLUDED.generated_at
        `,
          [
            `win-strategy-${proposalId}`,
            tenantId,
            proposalId,
            winStrategy.winProbability,
            JSON.stringify(winStrategy.keyStrengths),
            JSON.stringify(winStrategy.potentialWeaknesses),
            JSON.stringify(winStrategy.recommendedActions),
            JSON.stringify(winStrategy.competitiveAdvantages),
            JSON.stringify(winStrategy.riskFactors),
            JSON.stringify(winStrategy.pricingStrategy || {}),
            JSON.stringify(winStrategy.timingStrategy || {}),
            winStrategy.generatedAt,
          ],
        );
      }
    } catch (error) {
      console.error(
        "[Universal Proposal DB] Error storing win strategy:",
        error,
      );
    }
  }

  /**
   * Get win strategy for a proposal
   */
  async getWinStrategy(
    tenantId: string,
    proposalId: string,
  ): Promise<ProposalWinStrategy | null> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return null;
    }

    try {
      if (this.dbClient.type === "mongodb") {
        const result = await this.dbClient
          .collection("proposal_win_strategies")
          .findOne({
            tenantId,
            proposalId,
          });

        if (result) {
          return {
            proposalId: result.proposalId,
            winProbability: result.winProbability,
            keyStrengths: result.keyStrengths,
            potentialWeaknesses: result.potentialWeaknesses,
            recommendedActions: result.recommendedActions,
            competitiveAdvantages: result.competitiveAdvantages,
            riskFactors: result.riskFactors,
            pricingStrategy: result.pricingStrategy,
            timingStrategy: result.timingStrategy,
            generatedAt: result.generatedAt,
          } as ProposalWinStrategy;
        }
      } else {
        const result = await this.dbClient.query(
          `
          SELECT * FROM proposal_win_strategies
          WHERE tenant_id = $1 AND proposal_id = $2
        `,
          [tenantId, proposalId],
        );

        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          return {
            proposalId: row.proposal_id,
            winProbability: row.win_probability,
            keyStrengths:
              typeof row.key_strengths === "string"
                ? JSON.parse(row.key_strengths)
                : row.key_strengths,
            potentialWeaknesses:
              typeof row.potential_weaknesses === "string"
                ? JSON.parse(row.potential_weaknesses)
                : row.potential_weaknesses,
            recommendedActions:
              typeof row.recommended_actions === "string"
                ? JSON.parse(row.recommended_actions)
                : row.recommended_actions,
            competitiveAdvantages:
              typeof row.competitive_advantages === "string"
                ? JSON.parse(row.competitive_advantages)
                : row.competitive_advantages,
            riskFactors:
              typeof row.risk_factors === "string"
                ? JSON.parse(row.risk_factors)
                : row.risk_factors,
            pricingStrategy:
              typeof row.pricing_strategy === "string"
                ? JSON.parse(row.pricing_strategy)
                : row.pricing_strategy,
            timingStrategy:
              typeof row.timing_strategy === "string"
                ? JSON.parse(row.timing_strategy)
                : row.timing_strategy,
            generatedAt: row.generated_at,
          } as ProposalWinStrategy;
        }
      }
    } catch (error) {
      console.error(
        "[Universal Proposal DB] Error getting win strategy:",
        error,
      );
      return null;
    }

    return null;
  }

  /**
   * Delete universal proposal data
   */
  async deleteUniversalProposal(
    tenantId: string,
    proposalId: string,
  ): Promise<void> {
    await this.initializeDatabase();

    if (!this.useDatabase || !this.dbClient) {
      return;
    }

    try {
      if (this.dbClient.type === "mongodb") {
        await this.dbClient.collection("universal_proposals").deleteOne({
          tenantId,
          proposalId,
        });
        await this.dbClient.collection("proposal_insights").deleteMany({
          tenantId,
          proposalId,
        });
        await this.dbClient.collection("proposal_win_strategies").deleteOne({
          tenantId,
          proposalId,
        });
      } else {
        await this.dbClient.query(
          `
          DELETE FROM universal_proposals
          WHERE tenant_id = $1 AND proposal_id = $2
        `,
          [tenantId, proposalId],
        );

        await this.dbClient.query(
          `
          DELETE FROM proposal_insights
          WHERE tenant_id = $1 AND proposal_id = $2
        `,
          [tenantId, proposalId],
        );

        await this.dbClient.query(
          `
          DELETE FROM proposal_win_strategies
          WHERE tenant_id = $1 AND proposal_id = $2
        `,
          [tenantId, proposalId],
        );
      }
    } catch (error) {
      console.error("[Universal Proposal DB] Error deleting proposal:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const universalProposalDatabaseAdapter =
  new UniversalProposalDatabaseAdapter();
