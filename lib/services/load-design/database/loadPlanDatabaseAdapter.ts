/**
 * Load Plan Database Adapter
 *
 * Database persistence for load plans with support for:
 * - PostgreSQL
 * - MongoDB
 * - SQLite (development)
 * - Automatic fallback to in-memory if database not configured
 *
 * 4IR & 5IR Aligned - Data persistence and analytics ready
 */

import type { LoadPlan } from "@/types/load-design";
import { getDatabaseClient, type DatabaseClient } from "@/lib/database/client";

export interface LoadPlanDatabaseEntry {
  id: string;
  loadNumber: string;
  planType: "SINGLE" | "MULTIMODAL" | "CONSOLIDATED";
  vehicleSpec: any; // JSON
  items: any; // JSON array
  itemPlacements: any; // JSON array
  utilization: any; // JSON
  route: any; // JSON
  cost: any; // JSON
  compliance: any; // JSON
  optimization: any; // JSON
  status: string;
  transportMode: string;
  vehicleType: string;
  carrier: any; // JSON
  createdAt: Date | string;
  updatedAt: Date | string;
  plannedDate?: Date | string;
  estimatedDelivery?: Date | string;
  actualDelivery?: Date | string;
  createdBy?: string;
  tenantId?: string;
}

export class LoadPlanDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase = false;

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
          await this.ensureTables();
          console.log("✅ Load Plan Database adapter: Using database storage");
        }
      } else {
        console.log(
          "⚠️ Load Plan Database adapter: Database not configured, using in-memory fallback",
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Load Plan Database adapter: Failed to connect, using in-memory fallback",
        error,
      );
      this.useDatabase = false;
    }
  }

  /**
   * Ensure database tables exist
   */
  private async ensureTables(): Promise<void> {
    if (!this.dbClient || !this.useDatabase) return;

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS load_plans (
            id VARCHAR(255) PRIMARY KEY,
            load_number VARCHAR(255) UNIQUE NOT NULL,
            plan_type VARCHAR(50) NOT NULL,
            vehicle_spec JSONB,
            items JSONB,
            item_placements JSONB,
            utilization JSONB,
            route JSONB,
            cost JSONB,
            compliance JSONB,
            optimization JSONB,
            status VARCHAR(50) NOT NULL,
            transport_mode VARCHAR(50),
            vehicle_type VARCHAR(50),
            carrier JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            planned_date TIMESTAMP,
            estimated_delivery TIMESTAMP,
            actual_delivery TIMESTAMP,
            created_by VARCHAR(255),
            tenant_id VARCHAR(255)
          )
        `);
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_load_number ON load_plans(load_number)`,
        );
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_status ON load_plans(status)`,
        );
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_created_at ON load_plans(created_at)`,
        );
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_tenant_id ON load_plans(tenant_id)`,
        );
      } else if (dbType === "mongodb") {
        // MongoDB collections are created automatically
        // Just ensure indexes
        const db = (this.dbClient as any).db();
        const collection = db.collection("load_plans");
        await collection.createIndex({ loadNumber: 1 }, { unique: true });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ createdAt: -1 });
        await collection.createIndex({ tenantId: 1 });
      } else if (dbType === "sqlite") {
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS load_plans (
            id TEXT PRIMARY KEY,
            load_number TEXT UNIQUE NOT NULL,
            plan_type TEXT NOT NULL,
            vehicle_spec TEXT,
            items TEXT,
            item_placements TEXT,
            utilization TEXT,
            route TEXT,
            cost TEXT,
            compliance TEXT,
            optimization TEXT,
            status TEXT NOT NULL,
            transport_mode TEXT,
            vehicle_type TEXT,
            carrier TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            planned_date DATETIME,
            estimated_delivery DATETIME,
            actual_delivery DATETIME,
            created_by TEXT,
            tenant_id TEXT
          )
        `);
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_load_number ON load_plans(load_number)`,
        );
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_status ON load_plans(status)`,
        );
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_created_at ON load_plans(created_at)`,
        );
        await this.dbClient.query(
          `CREATE INDEX IF NOT EXISTS idx_tenant_id ON load_plans(tenant_id)`,
        );
      }
    } catch (error) {
      console.error("Failed to ensure load_plans table:", error);
    }
  }

  /**
   * Store load plan in database
   */
  async storeLoadPlan(loadPlan: LoadPlan, tenantId?: string): Promise<string> {
    if (!this.useDatabase || !this.dbClient) {
      return loadPlan.id;
    }

    try {
      const entry: LoadPlanDatabaseEntry = {
        id: loadPlan.id,
        loadNumber: loadPlan.loadNumber,
        planType: loadPlan.planType,
        vehicleSpec: JSON.stringify(loadPlan.vehicleSpec),
        items: JSON.stringify(loadPlan.items),
        itemPlacements: JSON.stringify(loadPlan.itemPlacements),
        utilization: JSON.stringify(loadPlan.utilization),
        route: JSON.stringify(loadPlan.route),
        cost: JSON.stringify(loadPlan.cost),
        compliance: JSON.stringify(loadPlan.compliance),
        optimization: JSON.stringify(loadPlan.optimization),
        status: loadPlan.status,
        transportMode: loadPlan.transportMode || "",
        vehicleType: loadPlan.vehicleType || "",
        carrier: JSON.stringify(loadPlan.carrier || null),
        createdAt: loadPlan.createdAt,
        updatedAt: new Date(),
        plannedDate: loadPlan.plannedDate,
        estimatedDelivery: loadPlan.estimatedDelivery,
        actualDelivery: loadPlan.actualDelivery,
        createdBy: loadPlan.createdBy,
        tenantId: tenantId || process.env.TENANT_ID,
      };

      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO load_plans (
            id, load_number, plan_type, vehicle_spec, items, item_placements,
            utilization, route, cost, compliance, optimization, status,
            transport_mode, vehicle_type, carrier, created_at, updated_at,
            planned_date, estimated_delivery, actual_delivery, created_by, tenant_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          ON CONFLICT (id) DO UPDATE SET
            load_number = EXCLUDED.load_number,
            plan_type = EXCLUDED.plan_type,
            vehicle_spec = EXCLUDED.vehicle_spec,
            items = EXCLUDED.items,
            item_placements = EXCLUDED.item_placements,
            utilization = EXCLUDED.utilization,
            route = EXCLUDED.route,
            cost = EXCLUDED.cost,
            compliance = EXCLUDED.compliance,
            optimization = EXCLUDED.optimization,
            status = EXCLUDED.status,
            transport_mode = EXCLUDED.transport_mode,
            vehicle_type = EXCLUDED.vehicle_type,
            carrier = EXCLUDED.carrier,
            updated_at = EXCLUDED.updated_at,
            planned_date = EXCLUDED.planned_date,
            estimated_delivery = EXCLUDED.estimated_delivery,
            actual_delivery = EXCLUDED.actual_delivery
        `,
          [
            entry.id,
            entry.loadNumber,
            entry.planType,
            entry.vehicleSpec,
            entry.items,
            entry.itemPlacements,
            entry.utilization,
            entry.route,
            entry.cost,
            entry.compliance,
            entry.optimization,
            entry.status,
            entry.transportMode,
            entry.vehicleType,
            entry.carrier,
            entry.createdAt,
            entry.updatedAt,
            entry.plannedDate,
            entry.estimatedDelivery,
            entry.actualDelivery,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const db = (this.dbClient as any).db();
        const collection = db.collection("load_plans");
        await collection.replaceOne({ id: entry.id }, entry, { upsert: true });
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO load_plans (
            id, load_number, plan_type, vehicle_spec, items, item_placements,
            utilization, route, cost, compliance, optimization, status,
            transport_mode, vehicle_type, carrier, created_at, updated_at,
            planned_date, estimated_delivery, actual_delivery, created_by, tenant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            entry.id,
            entry.loadNumber,
            entry.planType,
            entry.vehicleSpec,
            entry.items,
            entry.itemPlacements,
            entry.utilization,
            entry.route,
            entry.cost,
            entry.compliance,
            entry.optimization,
            entry.status,
            entry.transportMode,
            entry.vehicleType,
            entry.carrier,
            entry.createdAt,
            entry.updatedAt,
            entry.plannedDate,
            entry.estimatedDelivery,
            entry.actualDelivery,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }

      return entry.id;
    } catch (error) {
      console.error("Failed to store load plan:", error);
      throw error;
    }
  }

  /**
   * Get load plan from database
   */
  async getLoadPlan(id: string): Promise<LoadPlan | null> {
    if (!this.useDatabase || !this.dbClient) {
      return null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT * FROM load_plans WHERE id = $1",
          [id],
        );
      } else if (dbType === "mongodb") {
        const db = (this.dbClient as any).db();
        const collection = db.collection("load_plans");
        result = await collection.findOne({ id });
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT * FROM load_plans WHERE id = ?",
          [id],
        );
      }

      if (!result || (Array.isArray(result) && result.length === 0)) {
        return null;
      }

      const entry = Array.isArray(result) ? result[0] : result;
      return this.entryToLoadPlan(entry);
    } catch (error) {
      console.error("Failed to get load plan:", error);
      return null;
    }
  }

  /**
   * Get all load plans with filters
   */
  async getAllLoadPlans(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    transportMode?: string;
    vehicleType?: string;
    carrierId?: string;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Promise<LoadPlan[]> {
    if (!this.useDatabase || !this.dbClient) {
      return [];
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let results: any[] = [];

      if (dbType === "postgresql") {
        let query = "SELECT * FROM load_plans WHERE 1=1";
        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.startDate) {
          query += ` AND created_at >= $${paramIndex++}`;
          params.push(filters.startDate);
        }
        if (filters?.endDate) {
          query += ` AND created_at <= $${paramIndex++}`;
          params.push(filters.endDate);
        }
        if (filters?.status) {
          query += ` AND status = $${paramIndex++}`;
          params.push(filters.status);
        }
        if (filters?.transportMode) {
          query += ` AND transport_mode = $${paramIndex++}`;
          params.push(filters.transportMode);
        }
        if (filters?.vehicleType) {
          query += ` AND vehicle_type = $${paramIndex++}`;
          params.push(filters.vehicleType);
        }
        if (filters?.carrierId) {
          query += ` AND carrier->>'id' = $${paramIndex++}`;
          params.push(filters.carrierId);
        }
        if (filters?.tenantId) {
          query += ` AND tenant_id = $${paramIndex++}`;
          params.push(filters.tenantId);
        }

        query += " ORDER BY created_at DESC";

        if (filters?.limit) {
          query += ` LIMIT $${paramIndex++}`;
          params.push(filters.limit);
        }
        if (filters?.offset) {
          query += ` OFFSET $${paramIndex++}`;
          params.push(filters.offset);
        }

        results = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const db = (this.dbClient as any).db();
        const collection = db.collection("load_plans");
        const mongoFilters: any = {};

        if (filters?.startDate)
          mongoFilters.createdAt = { $gte: filters.startDate };
        if (filters?.endDate) {
          mongoFilters.createdAt = {
            ...mongoFilters.createdAt,
            $lte: filters.endDate,
          };
        }
        if (filters?.status) mongoFilters.status = filters.status;
        if (filters?.transportMode)
          mongoFilters.transportMode = filters.transportMode;
        if (filters?.vehicleType)
          mongoFilters.vehicleType = filters.vehicleType;
        if (filters?.carrierId) mongoFilters["carrier.id"] = filters.carrierId;
        if (filters?.tenantId) mongoFilters.tenantId = filters.tenantId;

        const cursor = collection.find(mongoFilters).sort({ createdAt: -1 });
        if (filters?.limit) cursor.limit(filters.limit);
        if (filters?.offset) cursor.skip(filters.offset);
        results = await cursor.toArray();
      } else if (dbType === "sqlite") {
        let query = "SELECT * FROM load_plans WHERE 1=1";
        const params: any[] = [];

        if (filters?.startDate) {
          query += " AND created_at >= ?";
          params.push(filters.startDate.toISOString());
        }
        if (filters?.endDate) {
          query += " AND created_at <= ?";
          params.push(filters.endDate.toISOString());
        }
        if (filters?.status) {
          query += " AND status = ?";
          params.push(filters.status);
        }
        if (filters?.transportMode) {
          query += " AND transport_mode = ?";
          params.push(filters.transportMode);
        }
        if (filters?.vehicleType) {
          query += " AND vehicle_type = ?";
          params.push(filters.vehicleType);
        }
        if (filters?.tenantId) {
          query += " AND tenant_id = ?";
          params.push(filters.tenantId);
        }

        query += " ORDER BY created_at DESC";

        if (filters?.limit) {
          query += " LIMIT ?";
          params.push(filters.limit);
        }
        if (filters?.offset) {
          query += " OFFSET ?";
          params.push(filters.offset);
        }

        results = await this.dbClient.query(query, params);
      }

      return results
        .map((entry) => this.entryToLoadPlan(entry))
        .filter(Boolean) as LoadPlan[];
    } catch (error) {
      console.error("Failed to get load plans:", error);
      return [];
    }
  }

  /**
   * Convert database entry to LoadPlan
   */
  private entryToLoadPlan(entry: any): LoadPlan {
    const dbType = process.env.DATABASE_TYPE || "postgresql";

    // Parse JSON fields based on database type
    const parseJson = (value: any) => {
      if (!value) return null;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      return value;
    };

    return {
      id: entry.id,
      loadNumber: entry.load_number || entry.loadNumber,
      planType: entry.plan_type || entry.planType,
      vehicleSpec: parseJson(entry.vehicle_spec || entry.vehicleSpec),
      items: parseJson(entry.items) || [],
      itemPlacements:
        parseJson(entry.item_placements || entry.itemPlacements) || [],
      utilization: parseJson(entry.utilization) || {
        weightPercent: 0,
        volumePercent: 0,
        cubePercent: 0,
        spaceEfficiency: 0,
      },
      route: parseJson(entry.route),
      cost: parseJson(entry.cost) || {
        base: 0,
        fuel: 0,
        labor: 0,
        total: 0,
        currency: "SAR",
      },
      compliance: parseJson(entry.compliance) || {
        status: "PENDING_VALIDATION",
        checks: [],
        warnings: [],
        errors: [],
      },
      optimization: parseJson(entry.optimization),
      status: entry.status,
      transportMode: entry.transport_mode || entry.transportMode,
      vehicleType: entry.vehicle_type || entry.vehicleType,
      carrier: parseJson(entry.carrier),
      createdAt: entry.created_at || entry.createdAt,
      updatedAt: entry.updated_at || entry.updatedAt,
      plannedDate: entry.planned_date || entry.plannedDate,
      estimatedDelivery: entry.estimated_delivery || entry.estimatedDelivery,
      actualDelivery: entry.actual_delivery || entry.actualDelivery,
      createdBy: entry.created_by || entry.createdBy,
    };
  }

  /**
   * Delete load plan from database
   */
  async deleteLoadPlan(id: string): Promise<boolean> {
    if (!this.useDatabase || !this.dbClient) {
      return false;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.query("DELETE FROM load_plans WHERE id = $1", [id]);
      } else if (dbType === "mongodb") {
        const db = (this.dbClient as any).db();
        const collection = db.collection("load_plans");
        await collection.deleteOne({ id });
      } else if (dbType === "sqlite") {
        await this.dbClient.query("DELETE FROM load_plans WHERE id = ?", [id]);
      }

      return true;
    } catch (error) {
      console.error("Failed to delete load plan:", error);
      return false;
    }
  }
}

export const loadPlanDatabaseAdapter = new LoadPlanDatabaseAdapter();
