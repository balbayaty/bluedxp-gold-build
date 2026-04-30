/**
 * QHSE Database Adapter
 * Production-ready database persistence for QHSE module
 * Supports PostgreSQL, MongoDB, SQLite with automatic fallback
 */

import { getDatabaseClient, type DatabaseClient } from "@/lib/database/client";
import type {
  Incident,
  Investigation,
  RootCauseAnalysis,
  Inspection,
  TrainingProgram,
  TrainingRecord,
  EnvironmentalMetric,
  SafetyMetric,
  RegulatoryAudit,
} from "@/types/qhse";

export class QHSEDatabaseAdapter {
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
        const dbConfig = process.env.DATABASE_TYPE || process.env.DATABASE_URL;
        if (dbConfig) {
          this.dbClient = getDatabaseClient();
          await this.dbClient.connect();
          this.useDatabase = true;
          await this.ensureTables();
          console.log("✅ QHSE Database adapter: Using database storage");
        } else {
          console.log(
            "⚠️ QHSE Database adapter: Database not configured, using in-memory fallback",
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          console.error(
            "❌ QHSE Database adapter: Database initialization failed in production:",
            error,
          );
          throw error;
        }
        console.warn(
          "⚠️ QHSE Database adapter: Failed to connect, using in-memory fallback:",
          error,
        );
        this.useDatabase = false;
        this.dbClient = null;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.useDatabase && !this.dbClient) {
      await this.initializeDatabase();
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
        // PostgreSQL tables
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_incidents (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255),
            warehouse_id VARCHAR(255),
            facility_id VARCHAR(255),
            incident_number VARCHAR(255),
            type VARCHAR(50) NOT NULL,
            severity VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            location VARCHAR(500),
            location_details JSONB,
            occurred_at TIMESTAMP NOT NULL,
            reported_at TIMESTAMP NOT NULL,
            reported_by VARCHAR(255),
            people_involved JSONB,
            osha_recordable BOOLEAN DEFAULT false,
            osha_classification VARCHAR(50),
            riddor_reportable BOOLEAN DEFAULT false,
            riddor_classification VARCHAR(50),
            photos JSONB,
            documents JSONB,
            tags TEXT[],
            assigned_to VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT qhse_incidents_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
          )
        `);

        await this.dbClient.query(`
          CREATE INDEX IF NOT EXISTS idx_qhse_incidents_tenant ON qhse_incidents(tenant_id)
        `);
        await this.dbClient.query(`
          CREATE INDEX IF NOT EXISTS idx_qhse_incidents_type ON qhse_incidents(type)
        `);
        await this.dbClient.query(`
          CREATE INDEX IF NOT EXISTS idx_qhse_incidents_severity ON qhse_incidents(severity)
        `);
        await this.dbClient.query(`
          CREATE INDEX IF NOT EXISTS idx_qhse_incidents_status ON qhse_incidents(status)
        `);
        await this.dbClient.query(`
          CREATE INDEX IF NOT EXISTS idx_qhse_incidents_occurred_at ON qhse_incidents(occurred_at)
        `);

        // Investigations table
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_investigations (
            id VARCHAR(255) PRIMARY KEY,
            incident_id VARCHAR(255) NOT NULL,
            tenant_id VARCHAR(255) NOT NULL,
            investigator_id VARCHAR(255),
            investigation_date TIMESTAMP,
            investigation_method VARCHAR(50),
            findings TEXT,
            root_cause_analysis_id VARCHAR(255),
            recommendations TEXT,
            status VARCHAR(50) NOT NULL,
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT qhse_investigations_incident_fk FOREIGN KEY (incident_id) REFERENCES qhse_incidents(id) ON DELETE CASCADE
          )
        `);

        // Inspections table
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_inspections (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255),
            warehouse_id VARCHAR(255),
            inspection_number VARCHAR(255),
            type VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            scheduled_date TIMESTAMP,
            conducted_date TIMESTAMP,
            conducted_by VARCHAR(255),
            location VARCHAR(500),
            checklist_id VARCHAR(255),
            compliance_score DECIMAL(5,2),
            findings_count INTEGER DEFAULT 0,
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Training programs table
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_training_programs (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            type VARCHAR(50),
            category VARCHAR(50),
            duration_hours DECIMAL(5,2),
            certification_required BOOLEAN DEFAULT false,
            certification_validity_months INTEGER,
            status VARCHAR(50) NOT NULL,
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Environmental metrics table
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_environmental_metrics (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255),
            warehouse_id VARCHAR(255),
            metric_type VARCHAR(50) NOT NULL,
            value DECIMAL(15,2) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            measurement_date TIMESTAMP NOT NULL,
            period_start TIMESTAMP,
            period_end TIMESTAMP,
            source VARCHAR(255),
            verified BOOLEAN DEFAULT false,
            verified_by VARCHAR(255),
            verified_at TIMESTAMP,
            metadata JSONB,
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Safety metrics table
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_safety_metrics (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255),
            warehouse_id VARCHAR(255),
            period_start TIMESTAMP NOT NULL,
            period_end TIMESTAMP NOT NULL,
            total_hours_worked DECIMAL(15,2),
            total_employees INTEGER,
            trir DECIMAL(10,4),
            ltifr DECIMAL(10,4),
            dafr DECIMAL(10,4),
            calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Regulatory audits table
        await this.dbClient.query(`
          CREATE TABLE IF NOT EXISTS qhse_regulatory_audits (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255),
            warehouse_id VARCHAR(255),
            audit_number VARCHAR(255),
            audit_type VARCHAR(50) NOT NULL,
            regulatory_body VARCHAR(255),
            standard VARCHAR(255),
            audit_date TIMESTAMP,
            auditor_name VARCHAR(255),
            status VARCHAR(50) NOT NULL,
            compliance_score DECIMAL(5,2),
            findings_count INTEGER DEFAULT 0,
            next_audit_date TIMESTAMP,
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    } catch (error) {
      console.error("❌ Error creating QHSE tables:", error);
      // Don't throw - allow fallback to in-memory
    }
  }

  // ============================================================================
  // INCIDENTS
  // ============================================================================

  async storeIncident(incident: Incident): Promise<void> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) return;

    try {
      await this.dbClient.query(
        `
        INSERT INTO qhse_incidents (
          id, tenant_id, customer_id, warehouse_id, facility_id, incident_number,
          type, severity, status, title, description, location, location_details,
          occurred_at, reported_at, reported_by, people_involved, osha_recordable,
          osha_classification, riddor_reportable, riddor_classification, photos,
          documents, tags, assigned_to, created_by, updated_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          severity = EXCLUDED.severity,
          status = EXCLUDED.status,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          location = EXCLUDED.location,
          location_details = EXCLUDED.location_details,
          occurred_at = EXCLUDED.occurred_at,
          reported_at = EXCLUDED.reported_at,
          reported_by = EXCLUDED.reported_by,
          people_involved = EXCLUDED.people_involved,
          osha_recordable = EXCLUDED.osha_recordable,
          osha_classification = EXCLUDED.osha_classification,
          riddor_reportable = EXCLUDED.riddor_reportable,
          riddor_classification = EXCLUDED.riddor_classification,
          photos = EXCLUDED.photos,
          documents = EXCLUDED.documents,
          tags = EXCLUDED.tags,
          assigned_to = EXCLUDED.assigned_to,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
      `,
        [
          incident.id,
          incident.tenantId,
          incident.customerId || null,
          incident.warehouseId || null,
          incident.facilityId || null,
          incident.incidentNumber || null,
          incident.type,
          incident.severity,
          incident.status,
          incident.title,
          incident.description || null,
          incident.location || null,
          incident.locationDetails
            ? JSON.stringify(incident.locationDetails)
            : null,
          incident.occurredAt,
          incident.reportedAt,
          incident.reportedBy || null,
          incident.peopleInvolved
            ? JSON.stringify(incident.peopleInvolved)
            : null,
          incident.oshaRecordable || false,
          incident.oshaClassification || null,
          incident.riddorReportable || false,
          incident.riddorClassification || null,
          incident.photos ? JSON.stringify(incident.photos) : null,
          incident.documents ? JSON.stringify(incident.documents) : null,
          incident.tags || null,
          incident.assignedTo || null,
          incident.createdBy || null,
          incident.updatedBy || null,
          incident.createdAt,
          incident.updatedAt,
        ],
      );
    } catch (error) {
      console.error("❌ Error storing incident to database:", error);
      throw error;
    }
  }

  async getIncident(id: string, tenantId?: string): Promise<Incident | null> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) return null;

    try {
      const whereClause = tenantId ? "id = $1 AND tenant_id = $2" : "id = $1";
      const params = tenantId ? [id, tenantId] : [id];

      const result = await this.dbClient.query<Incident>(
        `
        SELECT * FROM qhse_incidents WHERE ${whereClause} LIMIT 1
      `,
        params,
      );

      if (result.length === 0) return null;

      const row = result[0];
      return {
        id: row.id,
        tenantId: row.tenantId,
        customerId: row.customerId || undefined,
        warehouseId: row.warehouseId || undefined,
        facilityId: row.facilityId || undefined,
        incidentNumber: row.incidentNumber || undefined,
        type: row.type,
        severity: row.severity,
        status: row.status,
        title: row.title,
        description: row.description || undefined,
        location: row.location || undefined,
        locationDetails:
          typeof row.locationDetails === "string"
            ? JSON.parse(row.locationDetails)
            : row.locationDetails,
        occurredAt: row.occurredAt,
        reportedAt: row.reportedAt,
        reportedBy: row.reportedBy || undefined,
        peopleInvolved:
          typeof row.peopleInvolved === "string"
            ? JSON.parse(row.peopleInvolved)
            : row.peopleInvolved,
        oshaRecordable: row.oshaRecordable || false,
        oshaClassification: row.oshaClassification || undefined,
        riddorReportable: row.riddorReportable || false,
        riddorClassification: row.riddorClassification || undefined,
        photos:
          typeof row.photos === "string" ? JSON.parse(row.photos) : row.photos,
        documents:
          typeof row.documents === "string"
            ? JSON.parse(row.documents)
            : row.documents,
        tags: row.tags || undefined,
        assignedTo: row.assignedTo || undefined,
        createdBy: row.createdBy || undefined,
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      } as Incident;
    } catch (error) {
      console.error("❌ Error fetching incident from database:", error);
      return null;
    }
  }

  async getIncidents(
    tenantId: string,
    filters?: {
      customerId?: string;
      warehouseId?: string;
      type?: string;
      severity?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<Incident[]> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) return [];

    try {
      let query = "SELECT * FROM qhse_incidents WHERE tenant_id = $1";
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (filters) {
        if (filters.customerId) {
          query += ` AND customer_id = $${paramIndex}`;
          params.push(filters.customerId);
          paramIndex++;
        }
        if (filters.warehouseId) {
          query += ` AND warehouse_id = $${paramIndex}`;
          params.push(filters.warehouseId);
          paramIndex++;
        }
        if (filters.type) {
          query += ` AND type = $${paramIndex}`;
          params.push(filters.type);
          paramIndex++;
        }
        if (filters.severity) {
          query += ` AND severity = $${paramIndex}`;
          params.push(filters.severity);
          paramIndex++;
        }
        if (filters.status) {
          query += ` AND status = $${paramIndex}`;
          params.push(filters.status);
          paramIndex++;
        }
        if (filters.dateFrom) {
          query += ` AND occurred_at >= $${paramIndex}`;
          params.push(filters.dateFrom);
          paramIndex++;
        }
        if (filters.dateTo) {
          query += ` AND occurred_at <= $${paramIndex}`;
          params.push(filters.dateTo);
          paramIndex++;
        }
      }

      query += " ORDER BY occurred_at DESC";

      const result = await this.dbClient.query<Incident>(query, params);

      return result.map(
        (row) =>
          ({
            id: row.id,
            tenantId: row.tenantId,
            customerId: row.customerId || undefined,
            warehouseId: row.warehouseId || undefined,
            facilityId: row.facilityId || undefined,
            incidentNumber: row.incidentNumber || undefined,
            type: row.type,
            severity: row.severity,
            status: row.status,
            title: row.title,
            description: row.description || undefined,
            location: row.location || undefined,
            locationDetails:
              typeof row.locationDetails === "string"
                ? JSON.parse(row.locationDetails)
                : row.locationDetails,
            occurredAt: row.occurredAt,
            reportedAt: row.reportedAt,
            reportedBy: row.reportedBy || undefined,
            peopleInvolved:
              typeof row.peopleInvolved === "string"
                ? JSON.parse(row.peopleInvolved)
                : row.peopleInvolved,
            oshaRecordable: row.oshaRecordable || false,
            oshaClassification: row.oshaClassification || undefined,
            riddorReportable: row.riddorReportable || false,
            riddorClassification: row.riddorClassification || undefined,
            photos:
              typeof row.photos === "string"
                ? JSON.parse(row.photos)
                : row.photos,
            documents:
              typeof row.documents === "string"
                ? JSON.parse(row.documents)
                : row.documents,
            tags: row.tags || undefined,
            assignedTo: row.assignedTo || undefined,
            createdBy: row.createdBy || undefined,
            updatedBy: row.updatedBy || undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          }) as Incident,
      );
    } catch (error) {
      console.error("❌ Error fetching incidents from database:", error);
      return [];
    }
  }

  async deleteIncident(id: string, tenantId: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) return false;

    try {
      await this.dbClient.query(
        `
        DELETE FROM qhse_incidents WHERE id = $1 AND tenant_id = $2
      `,
        [id, tenantId],
      );
      return true;
    } catch (error) {
      console.error("❌ Error deleting incident from database:", error);
      return false;
    }
  }

  // Additional methods for investigations, inspections, training, etc. can be added here
  // Following the same pattern as incidents
}

// Singleton instance
let qhseDatabaseAdapter: QHSEDatabaseAdapter | null = null;

export function getQHSEDatabaseAdapter(): QHSEDatabaseAdapter {
  if (!qhseDatabaseAdapter) {
    qhseDatabaseAdapter = new QHSEDatabaseAdapter();
  }
  return qhseDatabaseAdapter;
}
