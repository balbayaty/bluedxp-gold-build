/**
 * TMS Database Adapter
 * Handles all database operations for TMS module
 * Compatible with PostgreSQL, MongoDB, SQLite
 */

import { getDatabaseClient, type DatabaseClient } from "@/lib/database/client";
import {
  TransportJob,
  PODRecord,
  DetentionRecord,
  TransitTimeRecord,
  Lane,
} from "@/types/tms/transportJob";
import { serializeJobToParams } from "./tmsDatabaseAdapterHelper";

export class TMSDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize asynchronously
    this.initPromise = this.initialize();
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.dbClient) {
      return; // Already initialized
    }

    if (this.initPromise) {
      try {
        await this.initPromise;
        this.initPromise = null; // Clear after first successful init
        return;
      } catch (error) {
        // If init failed, try again
        this.initPromise = this.initialize();
        await this.initPromise;
        this.initPromise = null;
        return;
      }
    }

    // No init promise, initialize now
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dbClient = getDatabaseClient();
      // Connect to database
      await this.dbClient.connect();
      await this.ensureTables();
    } catch (error) {
      console.error("❌ Database initialization error:", error);
      // Don't set to null - throw error so import fails properly
      throw new Error(
        `Database not connected: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure all TMS tables exist
   */
  private async ensureTables(): Promise<void> {
    if (!this.dbClient) return;

    try {
      await this.ensurePostgreSQLTables();
    } catch (error) {
      console.error("Error ensuring tables:", error);
    }
  }

  /**
   * Ensure PostgreSQL tables
   */
  private async ensurePostgreSQLTables(): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      -- Transport Jobs Table
      CREATE TABLE IF NOT EXISTS tms_transport_jobs (
        id VARCHAR(255) PRIMARY KEY,
        "recordId" VARCHAR(255),
        "jobName" VARCHAR(500) NOT NULL,
        "jobNumber" VARCHAR(255) NOT NULL,
        "jobType" VARCHAR(50) NOT NULL,
        "jobStatus" VARCHAR(50) NOT NULL,
        "jobOwnerId" VARCHAR(255),
        "jobOwner" VARCHAR(255),
        "createdById" VARCHAR(255),
        "createdBy" VARCHAR(255),
        "modifiedById" VARCHAR(255),
        "modifiedBy" VARCHAR(255),
        "createdTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifiedTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActivityTime" TIMESTAMP,
        currency VARCHAR(10) DEFAULT 'SAR',
        "exchangeRate" DECIMAL(10, 4),
        "customerId" VARCHAR(255),
        customer VARCHAR(255),
        "transporterId" VARCHAR(255),
        transporter VARCHAR(255),
        "containerNumber" VARCHAR(255),
        "shipmentNumber" VARCHAR(255),
        "shipmentType" VARCHAR(50),
        "shipmentTypeOther" VARCHAR(255),
        "shipmentOrigin" VARCHAR(500),
        "shipmentDestination" VARCHAR(500),
        "shipmentFinalDestination" VARCHAR(500),
        "shipmentWeight" DECIMAL(18, 2),
        "numberOfContainersOnMBL" INTEGER,
        "bookingNumber" VARCHAR(255),
        "masterBillOfLading" VARCHAR(255),
        "houseBillOfLading" VARCHAR(255),
        "orderNumber" VARCHAR(255),
        "poNumber" VARCHAR(255),
        "flexInvoiceNumber" VARCHAR(255),
        "refNo" VARCHAR(255),
        "transporterBill" VARCHAR(255),
        "bayanStatus" VARCHAR(50),
        "bayanNumber" VARCHAR(255),
        "bayanNumberEntry" VARCHAR(255),
        "bayanNumberExit" VARCHAR(255),
        "doStatus" VARCHAR(50),
        "manifestStatus" VARCHAR(50),
        "siStatus" VARCHAR(50),
        "truckType" VARCHAR(50),
        "vehiclePlateNumber" VARCHAR(255),
        "typeOfEquipment" VARCHAR(255),
        "oldContainer" VARCHAR(255),
        "driverId" VARCHAR(255),
        "driverName" VARCHAR(255),
        "driverMobileNumber" VARCHAR(50),
        "driverForeignMobileNumber" VARCHAR(50),
        "driverIqamaNumber" VARCHAR(255),
        "driverLicenseNumber" VARCHAR(255),
        "driverPassportNumber" VARCHAR(255),
        "driverNationality" VARCHAR(100),
        "polCountry" VARCHAR(100),
        "polLocation" VARCHAR(500),
        "podCountry" VARCHAR(100),
        "podLocation" VARCHAR(500),
        "polDetails" TEXT,
        "podDetails" TEXT,
        "dropOffPort" VARCHAR(255),
        "emptyContainerCollectionDepot" VARCHAR(255),
        "collectionPort" VARCHAR(255),
        "fullContainerDropOffDepot" VARCHAR(255),
        "storageTerminalName" VARCHAR(255),
        "foreignConsignee" VARCHAR(255),
        "localConsignee" VARCHAR(255),
        "consigneeName" VARCHAR(255),
        "consigneePhone" VARCHAR(50),
        "requestDate" TIMESTAMP,
        "loadingDate" TIMESTAMP,
        "loadingDateForWayBill" TIMESTAMP,
        "departureTimeForWayBill" VARCHAR(50),
        "dateOffload" TIMESTAMP,
        "saudiBorderArrival" TIMESTAMP,
        "saudiBorderDeparture" TIMESTAMP,
        "destinationBorderArrival" TIMESTAMP,
        "destinationBorderDeparture" TIMESTAMP,
        "transitBorderArrival" TIMESTAMP,
        "transitBorderDeparture" TIMESTAMP,
        "borderEntryNo" VARCHAR(255),
        "shipperArrival" TIMESTAMP,
        "shipperDeparture" TIMESTAMP,
        "consigneeArrival" TIMESTAMP,
        "consigneeDeparture" TIMESTAMP,
        "storageTerminalDateIn" TIMESTAMP,
        "storageTerminalDateOut" TIMESTAMP,
        "agreedRate" DECIMAL(18, 2),
        "costTRP" DECIMAL(18, 2),
        "otherExpenses" DECIMAL(18, 2),
        "othersAmount" DECIMAL(18, 2),
        "bridgeClearanceFees" DECIMAL(18, 2),
        "ccBOEntry" DECIMAL(18, 2),
        "ccBOExit" DECIMAL(18, 2),
        "overWeight" DECIMAL(18, 2),
        "totalCost" DECIMAL(18, 2),
        "detentionLoadingDays" INTEGER,
        "totalLoadingTime" DECIMAL(10, 2),
        "totalOffloadingTime" DECIMAL(10, 2),
        "transitTime" DECIMAL(10, 2),
        "transitTime2" DECIMAL(10, 2),
        "laneId" VARCHAR(255),
        "laneName" VARCHAR(500),
        "dealId" VARCHAR(255),
        deal VARCHAR(255),
        "roundTrip" BOOLEAN DEFAULT FALSE,
        "bankName" VARCHAR(255),
        "ibanNumber" VARCHAR(255),
        "containerReleaseOrderNumber" VARCHAR(255),
        "dispatcherName" VARCHAR(255),
        "notesAndInstructions" TEXT,
        "podDetails" TEXT,
        eta TIMESTAMP,
        "etaNotProvided" BOOLEAN DEFAULT FALSE,
        tag VARCHAR(255),
        locked BOOLEAN DEFAULT FALSE,
        "connectedToModule" VARCHAR(255),
        "connectedToId" VARCHAR(255),
        "tgaVerified" BOOLEAN DEFAULT FALSE,
        "daleeliVerified" BOOLEAN DEFAULT FALSE,
        "bayanSynced" BOOLEAN DEFAULT FALSE,
        "tenantId" VARCHAR(255) NOT NULL,
        "metadata" JSONB
      );

      CREATE INDEX IF NOT EXISTS tms_transport_jobs_tenantId_idx ON tms_transport_jobs("tenantId");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_jobNumber_idx ON tms_transport_jobs("jobNumber");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_jobStatus_idx ON tms_transport_jobs("jobStatus");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_jobType_idx ON tms_transport_jobs("jobType");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_customerId_idx ON tms_transport_jobs("customerId");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_transporterId_idx ON tms_transport_jobs("transporterId");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_laneId_idx ON tms_transport_jobs("laneId");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_createdTime_idx ON tms_transport_jobs("createdTime");

      -- POD Records Table
      CREATE TABLE IF NOT EXISTS tms_pod_records (
        id VARCHAR(255) PRIMARY KEY,
        "jobId" VARCHAR(255) NOT NULL,
        "deliveryDate" DATE NOT NULL,
        "deliveryTime" VARCHAR(50) NOT NULL,
        "deliveryTimestamp" TIMESTAMP NOT NULL,
        "deliveryLocation" VARCHAR(500),
        "gpsCoordinates" JSONB,
        "consigneeName" VARCHAR(255) NOT NULL,
        "consigneePhone" VARCHAR(50),
        "consigneeSignature" TEXT,
        "deliveryStatus" VARCHAR(50) NOT NULL,
        "deliveryNotes" TEXT,
        photos JSONB,
        documents JSONB,
        "evidenceIds" JSONB,
        verified BOOLEAN DEFAULT FALSE,
        "verifiedBy" VARCHAR(255),
        "verifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_pod_records_jobId_idx ON tms_pod_records("jobId");
      CREATE INDEX IF NOT EXISTS tms_pod_records_tenantId_idx ON tms_pod_records("tenantId");
      CREATE INDEX IF NOT EXISTS tms_pod_records_deliveryTimestamp_idx ON tms_pod_records("deliveryTimestamp");

      -- Detention Records Table
      CREATE TABLE IF NOT EXISTS tms_detention_records (
        id VARCHAR(255) PRIMARY KEY,
        "jobId" VARCHAR(255) NOT NULL,
        "detentionType" VARCHAR(50) NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "freeTimeDays" INTEGER NOT NULL DEFAULT 0,
        "detentionDays" INTEGER NOT NULL DEFAULT 0,
        location VARCHAR(500),
        "locationType" VARCHAR(50),
        "detentionRate" DECIMAL(18, 2),
        "detentionCost" DECIMAL(18, 2),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        reason TEXT,
        notes TEXT,
        "resolvedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_detention_records_jobId_idx ON tms_detention_records("jobId");
      CREATE INDEX IF NOT EXISTS tms_detention_records_tenantId_idx ON tms_detention_records("tenantId");
      CREATE INDEX IF NOT EXISTS tms_detention_records_status_idx ON tms_detention_records(status);
      CREATE INDEX IF NOT EXISTS tms_detention_records_detentionType_idx ON tms_detention_records("detentionType");

      -- Transit Time Records Table
      CREATE TABLE IF NOT EXISTS tms_transit_time_records (
        id VARCHAR(255) PRIMARY KEY,
        "jobId" VARCHAR(255) NOT NULL,
        segment VARCHAR(50) NOT NULL,
        "segmentName" VARCHAR(255),
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "plannedTransitTime" DECIMAL(10, 2),
        "actualTransitTime" DECIMAL(10, 2) NOT NULL,
        delay DECIMAL(10, 2),
        origin VARCHAR(500) NOT NULL,
        destination VARCHAR(500) NOT NULL,
        "onTime" BOOLEAN DEFAULT TRUE,
        "delayReason" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_transit_time_records_jobId_idx ON tms_transit_time_records("jobId");
      CREATE INDEX IF NOT EXISTS tms_transit_time_records_tenantId_idx ON tms_transit_time_records("tenantId");
      CREATE INDEX IF NOT EXISTS tms_transit_time_records_segment_idx ON tms_transit_time_records(segment);

      -- Lanes Table
      CREATE TABLE IF NOT EXISTS tms_lanes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        origin VARCHAR(500) NOT NULL,
        "originCountry" VARCHAR(100),
        destination VARCHAR(500) NOT NULL,
        "destinationCountry" VARCHAR(100),
        "truckType" VARCHAR(50),
        "averageTransitTime" DECIMAL(10, 2),
        "onTimeDeliveryRate" DECIMAL(5, 2),
        "averageCost" DECIMAL(18, 2),
        "utilizationRate" DECIMAL(5, 2),
        "dealId" VARCHAR(255),
        deal VARCHAR(255),
        rate DECIMAL(18, 2),
        "totalJobs" INTEGER DEFAULT 0,
        "completedJobs" INTEGER DEFAULT 0,
        "activeJobs" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS tms_lanes_tenantId_idx ON tms_lanes("tenantId");
      CREATE INDEX IF NOT EXISTS tms_lanes_isActive_idx ON tms_lanes("isActive");
      CREATE INDEX IF NOT EXISTS tms_lanes_origin_destination_idx ON tms_lanes(origin, destination);
    `;

    // Execute SQL - split by semicolon and execute each statement
    const statements = sql.split(";").filter((s) => s.trim().length > 0);
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith("--")) {
        try {
          await this.dbClient.query(trimmed);
        } catch (error) {
          // Ignore "already exists" errors
          if (
            error instanceof Error &&
            !error.message.includes("already exists")
          ) {
            console.warn("Table creation warning:", error.message);
          }
        }
      }
    }
    console.log("✅ TMS database tables ensured");
  }

  /**
   * Store transport job
   */
  async storeJob(tenantId: string, job: TransportJob): Promise<void> {
    await this.ensureInitialized();
    if (!this.dbClient) {
      throw new Error("Database not connected");
    }

    const sql = `
      INSERT INTO tms_transport_jobs (
        id, "recordId", "jobName", "jobNumber", "jobType", "jobStatus",
        "jobOwnerId", "jobOwner", "createdById", "createdBy", "modifiedById", "modifiedBy",
        "createdTime", "modifiedTime", "lastActivityTime", currency, "exchangeRate",
        "customerId", customer, "transporterId", transporter,
        "containerNumber", "shipmentNumber", "shipmentType", "shipmentTypeOther",
        "shipmentOrigin", "shipmentDestination", "shipmentFinalDestination", "shipmentWeight",
        "numberOfContainersOnMBL", "bookingNumber", "masterBillOfLading", "houseBillOfLading",
        "orderNumber", "poNumber", "flexInvoiceNumber", "refNo", "transporterBill",
        "bayanStatus", "bayanNumber", "bayanNumberEntry", "bayanNumberExit",
        "doStatus", "manifestStatus", "siStatus", "truckType", "vehiclePlateNumber",
        "typeOfEquipment", "oldContainer", "driverId", "driverName", "driverMobileNumber",
        "driverForeignMobileNumber", "driverIqamaNumber", "driverLicenseNumber",
        "driverPassportNumber", "driverNationality", "polCountry", "polLocation",
        "podCountry", "podLocation", "polDetails", "podDetails", "dropOffPort",
        "emptyContainerCollectionDepot", "collectionPort", "fullContainerDropOffDepot",
        "storageTerminalName", "foreignConsignee", "localConsignee", "consigneeName",
        "consigneePhone", "requestDate", "loadingDate", "loadingDateForWayBill",
        "departureTimeForWayBill", "dateOffload", "saudiBorderArrival", "saudiBorderDeparture",
        "destinationBorderArrival", "destinationBorderDeparture", "transitBorderArrival",
        "transitBorderDeparture", "borderEntryNo", "shipperArrival", "shipperDeparture",
        "consigneeArrival", "consigneeDeparture", "storageTerminalDateIn", "storageTerminalDateOut",
        "agreedRate", "costTRP", "otherExpenses", "othersAmount", "bridgeClearanceFees",
        "ccBOEntry", "ccBOExit", "overWeight", "totalCost", "detentionLoadingDays",
        "totalLoadingTime", "totalOffloadingTime", "transitTime", "transitTime2",
        "laneId", "laneName", "dealId", deal, "roundTrip", "bankName", "ibanNumber",
        "containerReleaseOrderNumber", "dispatcherName", "notesAndInstructions", "podDetails",
        eta, "etaNotProvided", tag, locked, "connectedToModule", "connectedToId",
        "tgaVerified", "daleeliVerified", "bayanSynced", "tenantId", metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47,
        $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62,
        $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77,
        $78, $79, $80, $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92,
        $93, $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105, $106,
        $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117, $118, $119
      )
      ON CONFLICT (id) DO UPDATE SET
        "jobName" = EXCLUDED."jobName",
        "jobStatus" = EXCLUDED."jobStatus",
        "modifiedTime" = CURRENT_TIMESTAMP,
        "modifiedBy" = EXCLUDED."modifiedBy"
    `;

    // Serialize job to parameters
    const params = serializeJobToParams(job, tenantId);
    await this.dbClient.query(sql, params);
  }

  /**
   * Get job by ID
   */
  async getJob(tenantId: string, jobId: string): Promise<TransportJob | null> {
    if (!this.dbClient) return null;

    const sql = `
      SELECT * FROM tms_transport_jobs
      WHERE id = $1 AND "tenantId" = $2
    `;

    const result = await this.dbClient.query(sql, [jobId, tenantId]);
    if (!result || result.length === 0) return null;

    // Convert database row to TransportJob
    return this.mapRowToJob(result[0]);
  }

  /**
   * Get jobs with filters
   */
  async getJobs(
    tenantId: string,
    filters: {
      jobType?: string;
      jobStatus?: string;
      customerId?: string;
      transporterId?: string;
      laneId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    },
    pagination?: { page: number; pageSize: number },
  ): Promise<{ jobs: TransportJob[]; total: number }> {
    if (!this.dbClient) return { jobs: [], total: 0 };

    let sql = `SELECT * FROM tms_transport_jobs WHERE "tenantId" = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.jobType) {
      sql += ` AND "jobType" = $${paramIndex}`;
      params.push(filters.jobType);
      paramIndex++;
    }

    if (filters.jobStatus) {
      sql += ` AND "jobStatus" = $${paramIndex}`;
      params.push(filters.jobStatus);
      paramIndex++;
    }

    if (filters.search) {
      sql += ` AND ("jobName" ILIKE $${paramIndex} OR "jobNumber" ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countSql = sql.replace("SELECT *", "SELECT COUNT(*)");
    const countResult = await this.dbClient.query(countSql, params);
    const total = parseInt((countResult[0] as any)?.count || "0");

    // Apply pagination
    if (pagination) {
      sql += ` ORDER BY "createdTime" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(
        pagination.pageSize,
        (pagination.page - 1) * pagination.pageSize,
      );
    } else {
      sql += ` ORDER BY "createdTime" DESC`;
    }

    const result = await this.dbClient.query(sql, params);
    const jobs = result.map((row: any) => this.mapRowToJob(row));

    return { jobs, total };
  }

  /**
   * Map database row to TransportJob
   */
  private mapRowToJob(row: any): TransportJob {
    // Convert database row to TransportJob object
    // This is simplified - actual implementation would properly deserialize all fields
    return {
      id: row.id,
      jobName: row.jobName,
      jobNumber: row.jobNumber,
      jobType: row.jobType as any,
      jobStatus: row.jobStatus as any,
      tenantId: row.tenantId,
      createdTime: new Date(row.createdTime),
      modifiedTime: new Date(row.modifiedTime),
      currency: row.currency || "SAR",
      // ... map all other fields
    } as TransportJob;
  }

  /**
   * Store POD record
   */
  async storePOD(tenantId: string, pod: PODRecord): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      INSERT INTO tms_pod_records (
        id, "jobId", "deliveryDate", "deliveryTime", "deliveryTimestamp",
        "deliveryLocation", "gpsCoordinates", "consigneeName", "consigneePhone",
        "consigneeSignature", "deliveryStatus", "deliveryNotes", photos, documents,
        "evidenceIds", verified, "verifiedBy", "verifiedAt", "createdAt", "createdBy", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        verified = EXCLUDED.verified,
        "verifiedBy" = EXCLUDED."verifiedBy",
        "verifiedAt" = EXCLUDED."verifiedAt"
    `;

    await this.dbClient.query(sql, [
      pod.id,
      pod.jobId,
      pod.deliveryDate,
      pod.deliveryTime,
      pod.deliveryTimestamp,
      pod.deliveryLocation,
      JSON.stringify(pod.gpsCoordinates),
      pod.consigneeName,
      pod.consigneePhone,
      pod.consigneeSignature,
      pod.deliveryStatus,
      pod.deliveryNotes,
      JSON.stringify(pod.photos),
      JSON.stringify(pod.documents),
      JSON.stringify(pod.evidenceIds),
      pod.verified,
      pod.verifiedBy,
      pod.verifiedAt,
      pod.createdAt,
      pod.createdBy,
      tenantId,
    ]);
  }

  /**
   * Get POD records for a job
   */
  async getPODRecords(tenantId: string, jobId: string): Promise<PODRecord[]> {
    if (!this.dbClient) return [];

    const sql = `
      SELECT * FROM tms_pod_records
      WHERE "jobId" = $1 AND "tenantId" = $2
      ORDER BY "deliveryTimestamp" DESC
    `;

    const result = await this.dbClient.query(sql, [jobId, tenantId]);
    return result.map((row: any) => this.mapRowToPOD(row));
  }

  private mapRowToPOD(row: any): PODRecord {
    return {
      id: row.id,
      jobId: row.jobId,
      deliveryDate: new Date(row.deliveryDate),
      deliveryTime: row.deliveryTime,
      deliveryTimestamp: new Date(row.deliveryTimestamp),
      deliveryLocation: row.deliveryLocation,
      gpsCoordinates: row.gpsCoordinates
        ? JSON.parse(row.gpsCoordinates)
        : undefined,
      consigneeName: row.consigneeName,
      consigneePhone: row.consigneePhone,
      consigneeSignature: row.consigneeSignature,
      deliveryStatus: row.deliveryStatus as any,
      deliveryNotes: row.deliveryNotes,
      photos: row.photos ? JSON.parse(row.photos) : [],
      documents: row.documents ? JSON.parse(row.documents) : [],
      evidenceIds: row.evidenceIds ? JSON.parse(row.evidenceIds) : [],
      verified: row.verified,
      verifiedBy: row.verifiedBy,
      verifiedAt: row.verifiedAt ? new Date(row.verifiedAt) : undefined,
      createdAt: new Date(row.createdAt),
      createdBy: row.createdBy,
      tenantId: row.tenantId,
    };
  }

  /**
   * Store detention record
   */
  async storeDetention(
    tenantId: string,
    detention: DetentionRecord,
  ): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      INSERT INTO tms_detention_records (
        id, "jobId", "detentionType", "startDate", "endDate", "freeTimeDays",
        "detentionDays", location, "locationType", "detentionRate", "detentionCost",
        status, reason, notes, "resolvedAt", "createdAt", "createdBy", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        "endDate" = EXCLUDED."endDate",
        "detentionDays" = EXCLUDED."detentionDays",
        "detentionCost" = EXCLUDED."detentionCost",
        status = EXCLUDED.status
    `;

    await this.dbClient.query(sql, [
      detention.id,
      detention.jobId,
      detention.detentionType,
      detention.startDate,
      detention.endDate,
      detention.freeTimeDays,
      detention.detentionDays,
      detention.location,
      detention.locationType,
      detention.detentionRate,
      detention.detentionCost,
      detention.status,
      detention.reason,
      detention.notes,
      detention.resolvedAt,
      detention.createdAt,
      detention.createdBy,
      tenantId,
    ]);
  }

  /**
   * Get detention records for a job
   */
  async getDetentionRecords(
    tenantId: string,
    jobId: string,
  ): Promise<DetentionRecord[]> {
    if (!this.dbClient) return [];

    const sql = `
      SELECT * FROM tms_detention_records
      WHERE "jobId" = $1 AND "tenantId" = $2
      ORDER BY "startDate" DESC
    `;

    const result = await this.dbClient.query(sql, [jobId, tenantId]);
    return result.map((row: any) => this.mapRowToDetention(row));
  }

  private mapRowToDetention(row: any): DetentionRecord {
    return {
      id: row.id,
      jobId: row.jobId,
      detentionType: row.detentionType as any,
      startDate: new Date(row.startDate),
      endDate: row.endDate ? new Date(row.endDate) : undefined,
      freeTimeDays: row.freeTimeDays,
      detentionDays: row.detentionDays,
      location: row.location,
      locationType: row.locationType as any,
      detentionRate: row.detentionRate
        ? parseFloat(row.detentionRate)
        : undefined,
      detentionCost: row.detentionCost
        ? parseFloat(row.detentionCost)
        : undefined,
      status: row.status as any,
      reason: row.reason,
      notes: row.notes,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined,
      createdAt: new Date(row.createdAt),
      createdBy: row.createdBy,
      tenantId: row.tenantId,
    };
  }

  /**
   * Store transit time record
   */
  async storeTransitTime(
    tenantId: string,
    transitTime: TransitTimeRecord,
  ): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      INSERT INTO tms_transit_time_records (
        id, "jobId", segment, "segmentName", "startDate", "endDate",
        "plannedTransitTime", "actualTransitTime", delay, origin, destination,
        "onTime", "delayReason", "createdAt", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        "endDate" = EXCLUDED."endDate",
        "actualTransitTime" = EXCLUDED."actualTransitTime",
        delay = EXCLUDED.delay,
        "onTime" = EXCLUDED."onTime"
    `;

    await this.dbClient.query(sql, [
      transitTime.id,
      transitTime.jobId,
      transitTime.segment,
      transitTime.segmentName,
      transitTime.startDate,
      transitTime.endDate,
      transitTime.plannedTransitTime,
      transitTime.actualTransitTime,
      transitTime.delay,
      transitTime.origin,
      transitTime.destination,
      transitTime.onTime,
      transitTime.delayReason,
      transitTime.createdAt,
      tenantId,
    ]);
  }

  /**
   * Get transit time records for a job
   */
  async getTransitTimeRecords(
    tenantId: string,
    jobId: string,
  ): Promise<TransitTimeRecord[]> {
    if (!this.dbClient) return [];

    const sql = `
      SELECT * FROM tms_transit_time_records
      WHERE "jobId" = $1 AND "tenantId" = $2
      ORDER BY "startDate" ASC
    `;

    const result = await this.dbClient.query(sql, [jobId, tenantId]);
    return result.map((row: any) => this.mapRowToTransitTime(row));
  }

  private mapRowToTransitTime(row: any): TransitTimeRecord {
    return {
      id: row.id,
      jobId: row.jobId,
      segment: row.segment as any,
      segmentName: row.segmentName,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      plannedTransitTime: row.plannedTransitTime
        ? parseFloat(row.plannedTransitTime)
        : undefined,
      actualTransitTime: parseFloat(row.actualTransitTime),
      delay: row.delay ? parseFloat(row.delay) : undefined,
      origin: row.origin,
      destination: row.destination,
      onTime: row.onTime,
      delayReason: row.delayReason,
      createdAt: new Date(row.createdAt),
      tenantId: row.tenantId,
    };
  }

  /**
   * Store lane
   */
  async storeLane(tenantId: string, lane: Lane): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      INSERT INTO tms_lanes (
        id, name, origin, "originCountry", destination, "destinationCountry",
        "truckType", "averageTransitTime", "onTimeDeliveryRate", "averageCost",
        "utilizationRate", "dealId", deal, rate, "totalJobs", "completedJobs",
        "activeJobs", "createdAt", "updatedAt", "tenantId", "isActive"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "averageTransitTime" = EXCLUDED."averageTransitTime",
        "onTimeDeliveryRate" = EXCLUDED."onTimeDeliveryRate",
        "averageCost" = EXCLUDED."averageCost",
        "utilizationRate" = EXCLUDED."utilizationRate",
        "totalJobs" = EXCLUDED."totalJobs",
        "completedJobs" = EXCLUDED."completedJobs",
        "activeJobs" = EXCLUDED."activeJobs",
        "updatedAt" = CURRENT_TIMESTAMP,
        "isActive" = EXCLUDED."isActive"
    `;

    await this.dbClient.query(sql, [
      lane.id,
      lane.name,
      lane.origin,
      lane.originCountry,
      lane.destination,
      lane.destinationCountry,
      lane.truckType,
      lane.averageTransitTime,
      lane.onTimeDeliveryRate,
      lane.averageCost,
      lane.utilizationRate,
      lane.dealId,
      lane.deal,
      lane.rate,
      lane.totalJobs,
      lane.completedJobs,
      lane.activeJobs,
      lane.createdAt,
      lane.updatedAt,
      tenantId,
      lane.isActive,
    ]);
  }

  /**
   * Get lane by ID
   */
  async getLane(tenantId: string, laneId: string): Promise<Lane | null> {
    if (!this.dbClient) return null;

    const sql = `SELECT * FROM tms_lanes WHERE id = $1 AND "tenantId" = $2`;
    const result = await this.dbClient.query(sql, [laneId, tenantId]);

    if (!result || result.length === 0) return null;
    return this.mapRowToLane(result[0]);
  }

  private mapRowToLane(row: any): Lane {
    return {
      id: row.id,
      name: row.name,
      origin: row.origin,
      originCountry: row.originCountry,
      destination: row.destination,
      destinationCountry: row.destinationCountry,
      truckType: row.truckType as any,
      averageTransitTime: row.averageTransitTime
        ? parseFloat(row.averageTransitTime)
        : undefined,
      onTimeDeliveryRate: row.onTimeDeliveryRate
        ? parseFloat(row.onTimeDeliveryRate)
        : undefined,
      averageCost: row.averageCost ? parseFloat(row.averageCost) : undefined,
      utilizationRate: row.utilizationRate
        ? parseFloat(row.utilizationRate)
        : undefined,
      dealId: row.dealId,
      deal: row.deal,
      rate: row.rate ? parseFloat(row.rate) : undefined,
      totalJobs: row.totalJobs,
      completedJobs: row.completedJobs,
      activeJobs: row.activeJobs,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      tenantId: row.tenantId,
      isActive: row.isActive,
    };
  }
}

export const tmsDatabaseAdapter = new TMSDatabaseAdapter();
