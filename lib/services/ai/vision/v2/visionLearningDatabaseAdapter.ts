/**
 * Vision Learning Database Adapter
 * Provides database persistence for vision learning patterns and feedback
 * Falls back to in-memory storage if database is not configured
 */

import { DatabaseClient, getDatabaseClient } from "@/lib/database/client";
import { DamagePattern, LearningFeedback } from "./selfLearningVisionService";

interface VisionLearningStorageEntry {
  id: string;
  pattern?: DamagePattern;
  feedback?: LearningFeedback;
  type: "pattern" | "feedback";
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export class VisionLearningDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase: boolean = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const dbConfig = process.env.DATABASE_TYPE;
      if (
        dbConfig &&
        (dbConfig === "postgresql" ||
          dbConfig === "mongodb" ||
          dbConfig === "sqlite")
      ) {
        this.dbClient = getDatabaseClient();
        if (this.dbClient) {
          await this.dbClient.connect();
          this.useDatabase = true;
          await this.createTables();
          console.log(
            "✅ Vision Learning Database adapter: Using database storage",
          );
        }
      } else {
        console.log(
          "⚠️ Vision Learning Database adapter: Database not configured, using in-memory fallback",
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Vision Learning Database adapter: Failed to connect, using in-memory fallback",
        error,
      );
      this.useDatabase = false;
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables() {
    if (!this.useDatabase || !this.dbClient) return;

    const dbType = process.env.DATABASE_TYPE || "postgresql";

    try {
      if (dbType === "postgresql") {
        // Patterns table
        await this.dbClient.execute(`
          CREATE TABLE IF NOT EXISTS vision_learning_patterns (
            id VARCHAR(255) PRIMARY KEY,
            pattern_id VARCHAR(255) NOT NULL,
            name VARCHAR(500) NOT NULL,
            description TEXT,
            visual_features JSONB,
            context JSONB,
            confidence DECIMAL(5,2) DEFAULT 0,
            occurrence_count INTEGER DEFAULT 0,
            accuracy DECIMAL(5,2) DEFAULT 0,
            last_seen TIMESTAMP,
            first_seen TIMESTAMP,
            auto_generated_rules JSONB,
            prevention_suggestions JSONB,
            tags JSONB,
            tenant_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Feedback table
        await this.dbClient.execute(`
          CREATE TABLE IF NOT EXISTS vision_learning_feedback (
            id VARCHAR(255) PRIMARY KEY,
            pattern_id VARCHAR(255) NOT NULL,
            photo_id VARCHAR(255) NOT NULL,
            damage_record_id VARCHAR(255) NOT NULL,
            user_correction JSONB,
            validated BOOLEAN DEFAULT FALSE,
            validated_by VARCHAR(255),
            validated_at TIMESTAMP,
            learning_impact JSONB,
            tenant_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Indexes
        await this.dbClient.execute(`
          CREATE INDEX IF NOT EXISTS idx_patterns_tenant ON vision_learning_patterns(tenant_id)
        `);
        await this.dbClient.execute(`
          CREATE INDEX IF NOT EXISTS idx_patterns_pattern_id ON vision_learning_patterns(pattern_id)
        `);
        await this.dbClient.execute(`
          CREATE INDEX IF NOT EXISTS idx_feedback_pattern_id ON vision_learning_feedback(pattern_id)
        `);
        await this.dbClient.execute(`
          CREATE INDEX IF NOT EXISTS idx_feedback_tenant ON vision_learning_feedback(tenant_id)
        `);
      } else if (dbType === "mongodb") {
        // MongoDB collections are created automatically
        console.log("MongoDB collections will be created automatically");
      } else if (dbType === "sqlite") {
        // SQLite tables
        await this.dbClient.execute(`
          CREATE TABLE IF NOT EXISTS vision_learning_patterns (
            id TEXT PRIMARY KEY,
            pattern_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            visual_features TEXT,
            context TEXT,
            confidence REAL DEFAULT 0,
            occurrence_count INTEGER DEFAULT 0,
            accuracy REAL DEFAULT 0,
            last_seen TEXT,
            first_seen TEXT,
            auto_generated_rules TEXT,
            prevention_suggestions TEXT,
            tags TEXT,
            tenant_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await this.dbClient.execute(`
          CREATE TABLE IF NOT EXISTS vision_learning_feedback (
            id TEXT PRIMARY KEY,
            pattern_id TEXT NOT NULL,
            photo_id TEXT NOT NULL,
            damage_record_id TEXT NOT NULL,
            user_correction TEXT,
            validated INTEGER DEFAULT 0,
            validated_by TEXT,
            validated_at TEXT,
            learning_impact TEXT,
            tenant_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    } catch (error) {
      console.warn("Error creating vision learning tables:", error);
    }
  }

  /**
   * Store pattern in database
   */
  async storePattern(pattern: DamagePattern): Promise<string> {
    if (!this.useDatabase || !this.dbClient) {
      return pattern.id;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.execute(
          `INSERT INTO vision_learning_patterns (
            id, pattern_id, name, description, visual_features, context,
            confidence, occurrence_count, accuracy, last_seen, first_seen,
            auto_generated_rules, prevention_suggestions, tags, tenant_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            visual_features = EXCLUDED.visual_features,
            context = EXCLUDED.context,
            confidence = EXCLUDED.confidence,
            occurrence_count = EXCLUDED.occurrence_count,
            accuracy = EXCLUDED.accuracy,
            last_seen = EXCLUDED.last_seen,
            auto_generated_rules = EXCLUDED.auto_generated_rules,
            prevention_suggestions = EXCLUDED.prevention_suggestions,
            tags = EXCLUDED.tags,
            updated_at = CURRENT_TIMESTAMP`,
          [
            pattern.id,
            pattern.patternId,
            pattern.name,
            pattern.description,
            JSON.stringify(pattern.visualFeatures),
            JSON.stringify(pattern.context),
            pattern.confidence,
            pattern.occurrenceCount,
            pattern.accuracy,
            typeof pattern.lastSeen === "string"
              ? pattern.lastSeen
              : new Date(pattern.lastSeen).toISOString(),
            typeof pattern.firstSeen === "string"
              ? pattern.firstSeen
              : new Date(pattern.firstSeen).toISOString(),
            JSON.stringify(pattern.autoGeneratedRules),
            JSON.stringify(pattern.preventionSuggestions),
            JSON.stringify(pattern.tags),
            pattern.tenantId,
            typeof pattern.createdAt === "string"
              ? pattern.createdAt
              : new Date(pattern.createdAt).toISOString(),
            typeof pattern.updatedAt === "string"
              ? pattern.updatedAt
              : new Date(pattern.updatedAt).toISOString(),
          ],
        );
      } else if (dbType === "mongodb") {
        const collection =
          this.dbClient.getCollection?.("vision_learning_patterns") || null;
        if (collection) {
          await collection.updateOne(
            { id: pattern.id, tenantId: pattern.tenantId },
            { $set: { ...pattern, updatedAt: new Date() } },
            { upsert: true },
          );
        }
      } else if (dbType === "sqlite") {
        await this.dbClient.execute(
          `INSERT OR REPLACE INTO vision_learning_patterns (
            id, pattern_id, name, description, visual_features, context,
            confidence, occurrence_count, accuracy, last_seen, first_seen,
            auto_generated_rules, prevention_suggestions, tags, tenant_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pattern.id,
            pattern.patternId,
            pattern.name,
            pattern.description,
            JSON.stringify(pattern.visualFeatures),
            JSON.stringify(pattern.context),
            pattern.confidence,
            pattern.occurrenceCount,
            pattern.accuracy,
            typeof pattern.lastSeen === "string"
              ? pattern.lastSeen
              : new Date(pattern.lastSeen).toISOString(),
            typeof pattern.firstSeen === "string"
              ? pattern.firstSeen
              : new Date(pattern.firstSeen).toISOString(),
            JSON.stringify(pattern.autoGeneratedRules),
            JSON.stringify(pattern.preventionSuggestions),
            JSON.stringify(pattern.tags),
            pattern.tenantId,
            typeof pattern.createdAt === "string"
              ? pattern.createdAt
              : new Date(pattern.createdAt).toISOString(),
            typeof pattern.updatedAt === "string"
              ? pattern.updatedAt
              : new Date(pattern.updatedAt).toISOString(),
          ],
        );
      }

      return pattern.id;
    } catch (error) {
      console.error("Error storing pattern:", error);
      throw error;
    }
  }

  /**
   * Get pattern from database
   */
  async getPattern(
    patternId: string,
    tenantId?: string,
  ): Promise<DamagePattern | null> {
    if (!this.useDatabase || !this.dbClient) {
      return null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        const query = tenantId
          ? `SELECT * FROM vision_learning_patterns WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`
          : `SELECT * FROM vision_learning_patterns WHERE id = $1`;
        const params = tenantId ? [patternId, tenantId] : [patternId];
        result = await this.dbClient.execute(query, params);
      } else if (dbType === "mongodb") {
        const collection =
          this.dbClient.getCollection?.("vision_learning_patterns") || null;
        if (collection) {
          result = await collection.findOne({
            id: patternId,
            ...(tenantId ? { tenantId } : {}),
          });
        }
      } else if (dbType === "sqlite") {
        const query = tenantId
          ? `SELECT * FROM vision_learning_patterns WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)`
          : `SELECT * FROM vision_learning_patterns WHERE id = ?`;
        const params = tenantId ? [patternId, tenantId] : [patternId];
        result = await this.dbClient.execute(query, params);
      }

      if (!result || (Array.isArray(result) && result.length === 0)) {
        return null;
      }

      const row = Array.isArray(result) ? result[0] : result;
      return this.mapRowToPattern(row);
    } catch (error) {
      console.error("Error getting pattern:", error);
      return null;
    }
  }

  /**
   * Get all patterns from database
   */
  async getAllPatterns(tenantId?: string): Promise<DamagePattern[]> {
    if (!this.useDatabase || !this.dbClient) {
      return [];
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any[];

      if (dbType === "postgresql") {
        const query = tenantId
          ? `SELECT * FROM vision_learning_patterns WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY updated_at DESC`
          : `SELECT * FROM vision_learning_patterns ORDER BY updated_at DESC`;
        const params = tenantId ? [tenantId] : [];
        result = (await this.dbClient.execute(query, params)) || [];
      } else if (dbType === "mongodb") {
        const collection =
          this.dbClient.getCollection?.("vision_learning_patterns") || null;
        if (collection) {
          result = await collection
            .find(tenantId ? { tenantId } : {})
            .toArray();
        } else {
          result = [];
        }
      } else if (dbType === "sqlite") {
        const query = tenantId
          ? `SELECT * FROM vision_learning_patterns WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY updated_at DESC`
          : `SELECT * FROM vision_learning_patterns ORDER BY updated_at DESC`;
        const params = tenantId ? [tenantId] : [];
        result = (await this.dbClient.execute(query, params)) || [];
      } else {
        result = [];
      }

      return result
        .map((row) => this.mapRowToPattern(row))
        .filter((p) => p !== null) as DamagePattern[];
    } catch (error) {
      console.error("Error getting all patterns:", error);
      return [];
    }
  }

  /**
   * Store feedback in database
   */
  async storeFeedback(feedback: LearningFeedback): Promise<string> {
    if (!this.useDatabase || !this.dbClient) {
      return feedback.id;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.execute(
          `INSERT INTO vision_learning_feedback (
            id, pattern_id, photo_id, damage_record_id, user_correction,
            validated, validated_by, validated_at, learning_impact, tenant_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            feedback.id,
            feedback.patternId,
            feedback.photoId,
            feedback.damageRecordId,
            feedback.userCorrection
              ? JSON.stringify(feedback.userCorrection)
              : null,
            feedback.validated,
            feedback.validatedBy,
            feedback.validatedAt
              ? typeof feedback.validatedAt === "string"
                ? feedback.validatedAt
                : new Date(feedback.validatedAt).toISOString()
              : null,
            JSON.stringify(feedback.learningImpact),
            (feedback as any).tenantId,
            typeof feedback.createdAt === "string"
              ? feedback.createdAt
              : new Date(feedback.createdAt).toISOString(),
          ],
        );
      } else if (dbType === "mongodb") {
        const collection =
          this.dbClient.getCollection?.("vision_learning_feedback") || null;
        if (collection) {
          await collection.insertOne(feedback);
        }
      } else if (dbType === "sqlite") {
        await this.dbClient.execute(
          `INSERT INTO vision_learning_feedback (
            id, pattern_id, photo_id, damage_record_id, user_correction,
            validated, validated_by, validated_at, learning_impact, tenant_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            feedback.id,
            feedback.patternId,
            feedback.photoId,
            feedback.damageRecordId,
            feedback.userCorrection
              ? JSON.stringify(feedback.userCorrection)
              : null,
            feedback.validated ? 1 : 0,
            feedback.validatedBy,
            feedback.validatedAt
              ? typeof feedback.validatedAt === "string"
                ? feedback.validatedAt
                : new Date(feedback.validatedAt).toISOString()
              : null,
            JSON.stringify(feedback.learningImpact),
            (feedback as any).tenantId,
            typeof feedback.createdAt === "string"
              ? feedback.createdAt
              : new Date(feedback.createdAt).toISOString(),
          ],
        );
      }

      return feedback.id;
    } catch (error) {
      console.error("Error storing feedback:", error);
      throw error;
    }
  }

  /**
   * Get all feedback from database
   */
  async getAllFeedback(
    patternId?: string,
    tenantId?: string,
  ): Promise<LearningFeedback[]> {
    if (!this.useDatabase || !this.dbClient) {
      return [];
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any[];

      if (dbType === "postgresql") {
        let query = `SELECT * FROM vision_learning_feedback WHERE 1=1`;
        const params: any[] = [];
        let paramIndex = 1;

        if (patternId) {
          query += ` AND pattern_id = $${paramIndex}`;
          params.push(patternId);
          paramIndex++;
        }
        if (tenantId) {
          query += ` AND (tenant_id = $${paramIndex} OR tenant_id IS NULL)`;
          params.push(tenantId);
          paramIndex++;
        }
        query += ` ORDER BY created_at DESC`;

        result = (await this.dbClient.execute(query, params)) || [];
      } else if (dbType === "mongodb") {
        const collection =
          this.dbClient.getCollection?.("vision_learning_feedback") || null;
        if (collection) {
          const filter: any = {};
          if (patternId) filter.patternId = patternId;
          if (tenantId) filter.tenantId = tenantId;
          result = await collection.find(filter).toArray();
        } else {
          result = [];
        }
      } else if (dbType === "sqlite") {
        let query = `SELECT * FROM vision_learning_feedback WHERE 1=1`;
        const params: any[] = [];

        if (patternId) {
          query += ` AND pattern_id = ?`;
          params.push(patternId);
        }
        if (tenantId) {
          query += ` AND (tenant_id = ? OR tenant_id IS NULL)`;
          params.push(tenantId);
        }
        query += ` ORDER BY created_at DESC`;

        result = (await this.dbClient.execute(query, params)) || [];
      } else {
        result = [];
      }

      return result
        .map((row) => this.mapRowToFeedback(row))
        .filter((f) => f !== null) as LearningFeedback[];
    } catch (error) {
      console.error("Error getting feedback:", error);
      return [];
    }
  }

  /**
   * Map database row to DamagePattern
   */
  private mapRowToPattern(row: any): DamagePattern | null {
    try {
      return {
        id: row.id,
        patternId: row.pattern_id,
        name: row.name,
        description: row.description || "",
        visualFeatures:
          typeof row.visual_features === "string"
            ? JSON.parse(row.visual_features)
            : row.visual_features,
        context:
          typeof row.context === "string"
            ? JSON.parse(row.context)
            : row.context,
        confidence: parseFloat(row.confidence) || 0,
        occurrenceCount: parseInt(row.occurrence_count) || 0,
        accuracy: parseFloat(row.accuracy) || 0,
        lastSeen: row.last_seen,
        firstSeen: row.first_seen,
        autoGeneratedRules:
          typeof row.auto_generated_rules === "string"
            ? JSON.parse(row.auto_generated_rules)
            : row.auto_generated_rules || [],
        preventionSuggestions:
          typeof row.prevention_suggestions === "string"
            ? JSON.parse(row.prevention_suggestions)
            : row.prevention_suggestions || [],
        tags:
          typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || [],
        tenantId: row.tenant_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Error mapping row to pattern:", error);
      return null;
    }
  }

  /**
   * Map database row to LearningFeedback
   */
  private mapRowToFeedback(row: any): LearningFeedback | null {
    try {
      return {
        id: row.id,
        patternId: row.pattern_id,
        photoId: row.photo_id,
        damageRecordId: row.damage_record_id,
        userCorrection: row.user_correction
          ? typeof row.user_correction === "string"
            ? JSON.parse(row.user_correction)
            : row.user_correction
          : undefined,
        validated: row.validated === true || row.validated === 1,
        validatedBy: row.validated_by,
        validatedAt: row.validated_at,
        learningImpact:
          typeof row.learning_impact === "string"
            ? JSON.parse(row.learning_impact)
            : row.learning_impact,
        createdAt: row.created_at,
      };
    } catch (error) {
      console.error("Error mapping row to feedback:", error);
      return null;
    }
  }

  /**
   * Delete pattern from database
   */
  async deletePattern(patternId: string, tenantId?: string): Promise<boolean> {
    if (!this.useDatabase || !this.dbClient) {
      return false;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        const query = tenantId
          ? `DELETE FROM vision_learning_patterns WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`
          : `DELETE FROM vision_learning_patterns WHERE id = $1`;
        const params = tenantId ? [patternId, tenantId] : [patternId];
        await this.dbClient.execute(query, params);
      } else if (dbType === "mongodb") {
        const collection =
          this.dbClient.getCollection?.("vision_learning_patterns") || null;
        if (collection) {
          await collection.deleteOne({
            id: patternId,
            ...(tenantId ? { tenantId } : {}),
          });
        }
      } else if (dbType === "sqlite") {
        const query = tenantId
          ? `DELETE FROM vision_learning_patterns WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)`
          : `DELETE FROM vision_learning_patterns WHERE id = ?`;
        const params = tenantId ? [patternId, tenantId] : [patternId];
        await this.dbClient.execute(query, params);
      }

      return true;
    } catch (error) {
      console.error("Error deleting pattern:", error);
      return false;
    }
  }
}

// Singleton instance
export const visionLearningDatabaseAdapter =
  new VisionLearningDatabaseAdapter();
