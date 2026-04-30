/**
 * Transportation Database Adapter
 *
 * Database persistence for transportation module
 * Integrates with existing database client (PostgreSQL/MongoDB/SQLite)
 *
 * Compatible with your tech stack:
 * - PostgreSQL (primary)
 * - MongoDB (alternative)
 * - SQLite (development)
 * - Prisma (if used)
 */

import { getDatabaseClient, type DatabaseClient } from "@/lib/database/client";
import type { IntelligentRoutePlan } from "../intelligentRoutePlanningService";
import type { EnhancedTransitTimeCalculation } from "../enhancedTransitTimeCalculator";
import type { LoadPlan } from "../advancedLoadBuildingService";
import type {
  NetworkModel,
  NetworkOptimizationResult,
} from "../networkModelingService";
import type { DeliveryRoute } from "../lastMileOptimizationService";
import type { Touchpoint } from "@/types/touchpoint";
import type {
  Shipment,
  Quote,
  Carrier,
  CustomsBroker,
  CustomsInfo,
  ShipmentDocument,
  CustomsAuthority,
} from "@/types/tms";

// ============================================================================
// TYPES
// ============================================================================

export interface RoutePlanDatabaseEntry {
  id: string;
  name?: string;
  origin: string; // JSON
  destination: string; // JSON
  waypoints?: string; // JSON
  mode: string;
  type: string;
  routePlan: string; // JSON - IntelligentRoutePlan
  transitTime?: string; // JSON - EnhancedTransitTimeCalculation
  cargo: string; // JSON
  compliancePrograms?: string; // JSON
  preferences?: string; // JSON
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId?: string;
}

export interface TouchpointDatabaseEntry {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string; // JSON
  operatingHours?: string; // JSON
  capacity?: string; // JSON
  capabilities?: string; // JSON
  restrictions?: string; // JSON
  compliancePrograms?: string; // JSON
  touchpoint: string; // JSON - Full Touchpoint object
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}

export interface JourneyAnalysisDatabaseEntry {
  id: string;
  journeyId: string;
  shipmentId: string;
  analysis: string; // JSON - EnhancedJourneyAnalysis
  createdAt: Date;
  tenantId?: string;
}

export interface ShipmentDatabaseEntry {
  id: string;
  shipmentNumber: string;
  status: string;
  shipment: string; // JSON - Shipment
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface QuoteDatabaseEntry {
  id: string;
  quoteNumber: string;
  shipmentId?: string;
  status: string;
  quote: string; // JSON - Quote
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface CarrierDatabaseEntry {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  carrier: string; // JSON - Carrier
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface ProposalDatabaseEntry {
  id: string;
  proposalType?: string;
  status?: string;
  proposal: string; // JSON - proposal object (from ProposalGenerator)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface CustomsBrokerDatabaseEntry {
  id: string;
  country?: string;
  status?: string;
  broker: string; // JSON - CustomsBroker
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface CustomsDeclarationDatabaseEntry {
  id: string;
  shipmentId?: string;
  status?: string;
  declaration: string; // JSON - CustomsInfo (+ metadata)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface PaymentDatabaseEntry {
  id: string;
  invoiceId?: string;
  shipmentId?: string;
  carrierId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  payment: string; // JSON - payment object (from financialManagementService)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface TransportationLoadPlanDatabaseEntry {
  id: string;
  vehicleId: string;
  loadPlan: string; // JSON - LoadPlan
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface TransportationNetworkModelDatabaseEntry {
  id: string;
  name?: string;
  model: string; // JSON - NetworkModel
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface TransportationNetworkOptimizationDatabaseEntry {
  id: string;
  modelId: string;
  result: string; // JSON - NetworkOptimizationResult
  createdAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface TransportationLastMileRouteDatabaseEntry {
  id: string;
  route: string; // JSON - DeliveryRoute
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface TransportationIncidentDatabaseEntry {
  id: string;
  riskId?: string;
  status?: string;
  severity?: string;
  priority?: string;
  incident: string; // JSON - incident object (Control Tower / Ops)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface TransportationDocumentDatabaseEntry {
  id: string;
  shipmentId?: string;
  type: string;
  status: string;
  document: string; // JSON - ShipmentDocument
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface CustomsAuthorityDatabaseEntry {
  id: string;
  code: string;
  country: string;
  status: string;
  authority: string; // JSON - CustomsAuthority
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

// ============================================================================
// DATABASE ADAPTER
// ============================================================================

export class TransportationDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase: boolean = true;
  private initPromise: Promise<void> | null = null;

  // In-memory fallback (tenant-scoped)
  private inMemoryShipments: Map<string, Map<string, Shipment>> = new Map();
  private inMemoryQuotes: Map<string, Map<string, Quote>> = new Map();
  private inMemoryCarriers: Map<string, Map<string, Carrier>> = new Map();
  private inMemoryProposals: Map<string, Map<string, Record<string, unknown>>> =
    new Map();
  private inMemoryBrokers: Map<string, Map<string, CustomsBroker>> = new Map();
  private inMemoryDeclarations: Map<
    string,
    Map<string, Record<string, unknown>>
  > = new Map();
  private inMemoryPayments: Map<string, Map<string, Record<string, unknown>>> =
    new Map();
  private inMemoryIncidents: Map<string, Map<string, Record<string, unknown>>> =
    new Map();
  private inMemoryDocuments: Map<string, Map<string, ShipmentDocument>> =
    new Map();
  private inMemoryCustomsAuthorities: Map<
    string,
    Map<string, CustomsAuthority>
  > = new Map();
  private inMemoryLoadPlans: Map<string, Map<string, LoadPlan>> = new Map();
  private inMemoryNetworkModels: Map<string, Map<string, NetworkModel>> =
    new Map();
  private inMemoryNetworkOptimizations: Map<
    string,
    Map<string, NetworkOptimizationResult>
  > = new Map();
  private inMemoryLastMileRoutes: Map<string, Map<string, DeliveryRoute>> =
    new Map();

  constructor() {
    // Check if database is available
    this.useDatabase =
      process.env.DATABASE_URL !== undefined ||
      process.env.DATABASE_TYPE !== undefined ||
      process.env.USE_DATABASE === "true";

    // Strict production mode: Transportation must never silently fall back to in-memory.
    if (process.env.NODE_ENV === "production") {
      this.useDatabase = true;
    }
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    if (this.dbClient) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    if (!this.useDatabase) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Transportation: DATABASE_URL is required in production (in-memory fallback is forbidden).",
        );
      }
      console.log(
        "⚠️ Transportation: Database not configured, using in-memory storage",
      );
      return;
    }

    this.initPromise = (async () => {
      try {
        this.dbClient = getDatabaseClient();
        await this.dbClient.connect();
        await this.ensureTables();
        console.log("✅ Transportation: Database adapter initialized");
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          console.error(
            "❌ Transportation: Database initialization failed in production:",
            error,
          );
          this.dbClient = null;
          throw error instanceof Error ? error : new Error(String(error));
        }
        console.warn(
          "⚠️ Transportation: Database initialization failed, using in-memory storage:",
          error,
        );
        this.useDatabase = false;
        this.dbClient = null;
      } finally {
        this.initPromise = null;
      }
    })();

    await this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.useDatabase && !this.dbClient) {
      await this.initialize();
    }
  }

  /**
   * Ensure database tables exist
   */
  private async ensureTables(): Promise<void> {
    if (!this.dbClient) return;

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.ensurePostgreSQLTables();
      } else if (dbType === "mongodb") {
        // MongoDB collections are created automatically
        await this.ensureMongoDBIndexes();
      } else if (dbType === "sqlite") {
        await this.ensureSQLiteTables();
      }
    } catch (error) {
      // Important: if schema initialization fails, we must fall back safely
      // to in-memory storage rather than leaving a half-open DB client around.
      console.warn(
        "⚠️ Transportation: Failed to ensure tables (falling back to in-memory storage):",
        error,
      );
      throw error;
    }
  }

  /**
   * Ensure PostgreSQL tables
   */
  private async ensurePostgreSQLTables(): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      -- Route Plans Table
      CREATE TABLE IF NOT EXISTS transportation_route_plans (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        origin JSONB NOT NULL,
        destination JSONB NOT NULL,
        waypoints JSONB,
        mode VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        "routePlan" JSONB NOT NULL,
        "transitTime" JSONB,
        cargo JSONB NOT NULL,
        "compliancePrograms" JSONB,
        preferences JSONB,
        score DECIMAL(5, 2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS transportation_route_plans_tenantId_idx ON transportation_route_plans("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_route_plans_createdAt_idx ON transportation_route_plans("createdAt");
      CREATE INDEX IF NOT EXISTS transportation_route_plans_mode_idx ON transportation_route_plans(mode);

      -- Touchpoints Table
      CREATE TABLE IF NOT EXISTS transportation_touchpoints (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location JSONB NOT NULL,
        "operatingHours" JSONB,
        capacity JSONB,
        capabilities JSONB,
        restrictions JSONB,
        "compliancePrograms" JSONB,
        touchpoint JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS transportation_touchpoints_code_idx ON transportation_touchpoints(code);
      CREATE INDEX IF NOT EXISTS transportation_touchpoints_type_idx ON transportation_touchpoints(type);
      CREATE INDEX IF NOT EXISTS transportation_touchpoints_tenantId_idx ON transportation_touchpoints("tenantId");

      -- Journey Analysis Table
      CREATE TABLE IF NOT EXISTS transportation_journey_analysis (
        id VARCHAR(255) PRIMARY KEY,
        "journeyId" VARCHAR(255) NOT NULL,
        "shipmentId" VARCHAR(255) NOT NULL,
        analysis JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS transportation_journey_analysis_journeyId_idx ON transportation_journey_analysis("journeyId");
      CREATE INDEX IF NOT EXISTS transportation_journey_analysis_shipmentId_idx ON transportation_journey_analysis("shipmentId");
      CREATE INDEX IF NOT EXISTS transportation_journey_analysis_tenantId_idx ON transportation_journey_analysis("tenantId");

      -- Shipments Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_shipments (
        id VARCHAR(255) PRIMARY KEY,
        "shipmentNumber" VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        shipment JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS transportation_shipments_tenantId_idx ON transportation_shipments("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_shipments_status_idx ON transportation_shipments(status);
      CREATE INDEX IF NOT EXISTS transportation_shipments_createdAt_idx ON transportation_shipments("createdAt");

      -- Quotes Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_quotes (
        id VARCHAR(255) PRIMARY KEY,
        "quoteNumber" VARCHAR(255) NOT NULL,
        "shipmentId" VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        quote JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_quotes_tenantId_idx ON transportation_quotes("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_quotes_shipmentId_idx ON transportation_quotes("shipmentId");
      CREATE INDEX IF NOT EXISTS transportation_quotes_status_idx ON transportation_quotes(status);

      -- Proposals Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_proposals (
        id VARCHAR(255) PRIMARY KEY,
        "proposalType" VARCHAR(100),
        status VARCHAR(50),
        proposal JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_proposals_tenantId_idx ON transportation_proposals("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_proposals_status_idx ON transportation_proposals(status);

      -- Customs Brokers Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_customs_brokers (
        id VARCHAR(255) PRIMARY KEY,
        country VARCHAR(100),
        status VARCHAR(50),
        broker JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_customs_brokers_tenantId_idx ON transportation_customs_brokers("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_customs_brokers_country_idx ON transportation_customs_brokers(country);
      CREATE INDEX IF NOT EXISTS transportation_customs_brokers_status_idx ON transportation_customs_brokers(status);

      -- Customs Declarations Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_customs_declarations (
        id VARCHAR(255) PRIMARY KEY,
        "shipmentId" VARCHAR(255),
        status VARCHAR(50),
        declaration JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_customs_declarations_tenantId_idx ON transportation_customs_declarations("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_customs_declarations_shipmentId_idx ON transportation_customs_declarations("shipmentId");
      CREATE INDEX IF NOT EXISTS transportation_customs_declarations_status_idx ON transportation_customs_declarations(status);

      -- Payments Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_payments (
        id VARCHAR(255) PRIMARY KEY,
        "invoiceId" VARCHAR(255),
        "shipmentId" VARCHAR(255),
        "carrierId" VARCHAR(255),
        amount DECIMAL(18, 2),
        currency VARCHAR(10),
        status VARCHAR(50),
        payment JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_payments_tenantId_idx ON transportation_payments("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_payments_shipmentId_idx ON transportation_payments("shipmentId");
      CREATE INDEX IF NOT EXISTS transportation_payments_invoiceId_idx ON transportation_payments("invoiceId");
      CREATE INDEX IF NOT EXISTS transportation_payments_status_idx ON transportation_payments(status);

      -- Incidents Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_incidents (
        id VARCHAR(255) PRIMARY KEY,
        "riskId" VARCHAR(255),
        status VARCHAR(50),
        severity VARCHAR(50),
        priority VARCHAR(50),
        incident JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_incidents_tenantId_idx ON transportation_incidents("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_incidents_status_idx ON transportation_incidents(status);
      CREATE INDEX IF NOT EXISTS transportation_incidents_severity_idx ON transportation_incidents(severity);
      CREATE INDEX IF NOT EXISTS transportation_incidents_createdAt_idx ON transportation_incidents("createdAt");

      -- Documents Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_documents (
        id VARCHAR(255) PRIMARY KEY,
        "shipmentId" VARCHAR(255),
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        document JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_documents_tenantId_idx ON transportation_documents("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_documents_shipmentId_idx ON transportation_documents("shipmentId");
      CREATE INDEX IF NOT EXISTS transportation_documents_type_idx ON transportation_documents(type);
      CREATE INDEX IF NOT EXISTS transportation_documents_status_idx ON transportation_documents(status);

      -- Customs Authorities Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_customs_authorities (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        authority JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_customs_authorities_tenantId_idx ON transportation_customs_authorities("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_customs_authorities_country_idx ON transportation_customs_authorities(country);
      CREATE INDEX IF NOT EXISTS transportation_customs_authorities_status_idx ON transportation_customs_authorities(status);
      CREATE INDEX IF NOT EXISTS transportation_customs_authorities_code_idx ON transportation_customs_authorities(code);

      -- Carriers Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_carriers (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        carrier JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_carriers_tenantId_idx ON transportation_carriers("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_carriers_code_idx ON transportation_carriers(code);
      CREATE INDEX IF NOT EXISTS transportation_carriers_type_idx ON transportation_carriers(type);
      CREATE INDEX IF NOT EXISTS transportation_carriers_status_idx ON transportation_carriers(status);

      -- Load Plans Table (tenant-scoped, durable load building history)
      CREATE TABLE IF NOT EXISTS transportation_load_plans (
        id VARCHAR(255) PRIMARY KEY,
        "vehicleId" VARCHAR(255) NOT NULL,
        "loadPlan" JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_load_plans_tenantId_idx ON transportation_load_plans("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_load_plans_vehicleId_idx ON transportation_load_plans("vehicleId");
      CREATE INDEX IF NOT EXISTS transportation_load_plans_createdAt_idx ON transportation_load_plans("createdAt");

      -- Network Models Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_network_models (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        model JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_network_models_tenantId_idx ON transportation_network_models("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_network_models_createdAt_idx ON transportation_network_models("createdAt");

      -- Network Optimizations Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_network_optimizations (
        id VARCHAR(255) PRIMARY KEY,
        "modelId" VARCHAR(255) NOT NULL,
        result JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_network_optimizations_tenantId_idx ON transportation_network_optimizations("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_network_optimizations_modelId_idx ON transportation_network_optimizations("modelId");
      CREATE INDEX IF NOT EXISTS transportation_network_optimizations_createdAt_idx ON transportation_network_optimizations("createdAt");

      -- Last-Mile Routes Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_last_mile_routes (
        id VARCHAR(255) PRIMARY KEY,
        route JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_last_mile_routes_tenantId_idx ON transportation_last_mile_routes("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_last_mile_routes_createdAt_idx ON transportation_last_mile_routes("createdAt");

      -- Insurance Policies Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_insurance_policies (
        id VARCHAR(255) PRIMARY KEY,
        "policyNumber" VARCHAR(255) NOT NULL,
        "shipmentId" VARCHAR(255) NOT NULL,
        "shipmentNumber" VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        "providerId" VARCHAR(255),
        "coverageAmount" DECIMAL(18, 2) NOT NULL,
        premium DECIMAL(18, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        "effectiveDate" TIMESTAMP NOT NULL,
        "expiryDate" TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        "coverageType" VARCHAR(50),
        deductible DECIMAL(18, 2),
        policy JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_insurance_policies_tenantId_idx ON transportation_insurance_policies("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_insurance_policies_shipmentId_idx ON transportation_insurance_policies("shipmentId");
      CREATE INDEX IF NOT EXISTS transportation_insurance_policies_status_idx ON transportation_insurance_policies(status);
      CREATE INDEX IF NOT EXISTS transportation_insurance_policies_policyNumber_idx ON transportation_insurance_policies("policyNumber");

      -- Insurance Claims Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_insurance_claims (
        id VARCHAR(255) PRIMARY KEY,
        "claimNumber" VARCHAR(255) NOT NULL,
        "policyId" VARCHAR(255) NOT NULL,
        "policyNumber" VARCHAR(255) NOT NULL,
        amount DECIMAL(18, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        description TEXT NOT NULL,
        "incidentDate" TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        documents JSONB,
        notes TEXT,
        "reviewedBy" VARCHAR(255),
        "reviewedAt" TIMESTAMP,
        claim JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_insurance_claims_tenantId_idx ON transportation_insurance_claims("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_insurance_claims_policyId_idx ON transportation_insurance_claims("policyId");
      CREATE INDEX IF NOT EXISTS transportation_insurance_claims_status_idx ON transportation_insurance_claims(status);
      CREATE INDEX IF NOT EXISTS transportation_insurance_claims_claimNumber_idx ON transportation_insurance_claims("claimNumber");

      -- Ports Table (tenant-scoped)
      CREATE TABLE IF NOT EXISTS transportation_ports (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        "currentShipments" INTEGER DEFAULT 0,
        containers INTEGER DEFAULT 0,
        "utilizationRate" DECIMAL(5, 2),
        location JSONB,
        "operatingHours" JSONB,
        capacity JSONB,
        port JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS transportation_ports_tenantId_idx ON transportation_ports("tenantId");
      CREATE INDEX IF NOT EXISTS transportation_ports_code_idx ON transportation_ports(code);
      CREATE INDEX IF NOT EXISTS transportation_ports_type_idx ON transportation_ports(type);
      CREATE INDEX IF NOT EXISTS transportation_ports_status_idx ON transportation_ports(status);
    `;

    await this.dbClient.query(sql);
  }

  /**
   * Ensure MongoDB indexes
   */
  private async ensureMongoDBIndexes(): Promise<void> {
    if (!this.dbClient) return;

    // MongoDB indexes are created automatically when collections are used
    // Can add explicit index creation here if needed
  }

  /**
   * Ensure SQLite tables
   */
  private async ensureSQLiteTables(): Promise<void> {
    if (!this.dbClient) return;

    const sql = `
      CREATE TABLE IF NOT EXISTS transportation_route_plans (
        id TEXT PRIMARY KEY,
        name TEXT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        waypoints TEXT,
        mode TEXT NOT NULL,
        type TEXT NOT NULL,
        route_plan TEXT NOT NULL,
        transit_time TEXT,
        cargo TEXT NOT NULL,
        compliance_programs TEXT,
        preferences TEXT,
        score REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_route_plans_tenant ON transportation_route_plans(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_route_plans_created ON transportation_route_plans(created_at);

      CREATE TABLE IF NOT EXISTS transportation_touchpoints (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        location TEXT NOT NULL,
        operating_hours TEXT,
        capacity TEXT,
        capabilities TEXT,
        restrictions TEXT,
        compliance_programs TEXT,
        touchpoint TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tenant_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_touchpoints_code ON transportation_touchpoints(code);
      CREATE INDEX IF NOT EXISTS idx_touchpoints_type ON transportation_touchpoints(type);

      CREATE TABLE IF NOT EXISTS transportation_journey_analysis (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL,
        shipment_id TEXT NOT NULL,
        analysis TEXT NOT NULL,
        created_at TEXT NOT NULL,
        tenant_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_journey_analysis_journey ON transportation_journey_analysis(journey_id);
      CREATE INDEX IF NOT EXISTS idx_journey_analysis_shipment ON transportation_journey_analysis(shipment_id);

      CREATE TABLE IF NOT EXISTS transportation_shipments (
        id TEXT PRIMARY KEY,
        shipment_number TEXT NOT NULL,
        status TEXT NOT NULL,
        shipment TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_shipments_tenant ON transportation_shipments(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_status ON transportation_shipments(status);

      CREATE TABLE IF NOT EXISTS transportation_quotes (
        id TEXT PRIMARY KEY,
        quote_number TEXT NOT NULL,
        shipment_id TEXT,
        status TEXT NOT NULL,
        quote TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON transportation_quotes(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_shipment ON transportation_quotes(shipment_id);

      CREATE TABLE IF NOT EXISTS transportation_proposals (
        id TEXT PRIMARY KEY,
        proposal_type TEXT,
        status TEXT,
        proposal TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON transportation_proposals(tenant_id);

      CREATE TABLE IF NOT EXISTS transportation_customs_brokers (
        id TEXT PRIMARY KEY,
        country TEXT,
        status TEXT,
        broker TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_customs_brokers_tenant ON transportation_customs_brokers(tenant_id);

      CREATE TABLE IF NOT EXISTS transportation_customs_declarations (
        id TEXT PRIMARY KEY,
        shipment_id TEXT,
        status TEXT,
        declaration TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_customs_declarations_tenant ON transportation_customs_declarations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_customs_declarations_shipment ON transportation_customs_declarations(shipment_id);

      CREATE TABLE IF NOT EXISTS transportation_payments (
        id TEXT PRIMARY KEY,
        invoice_id TEXT,
        shipment_id TEXT,
        carrier_id TEXT,
        amount REAL,
        currency TEXT,
        status TEXT,
        payment TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payments_tenant ON transportation_payments(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_payments_shipment ON transportation_payments(shipment_id);

      CREATE TABLE IF NOT EXISTS transportation_incidents (
        id TEXT PRIMARY KEY,
        risk_id TEXT,
        status TEXT,
        severity TEXT,
        priority TEXT,
        incident TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON transportation_incidents(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON transportation_incidents(status);

      CREATE TABLE IF NOT EXISTS transportation_documents (
        id TEXT PRIMARY KEY,
        shipment_id TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        document TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_documents_tenant ON transportation_documents(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_documents_shipment ON transportation_documents(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_documents_type ON transportation_documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON transportation_documents(status);

      CREATE TABLE IF NOT EXISTS transportation_customs_authorities (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        country TEXT NOT NULL,
        status TEXT NOT NULL,
        authority TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_customs_authorities_tenant ON transportation_customs_authorities(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_customs_authorities_country ON transportation_customs_authorities(country);
      CREATE INDEX IF NOT EXISTS idx_customs_authorities_status ON transportation_customs_authorities(status);
      CREATE INDEX IF NOT EXISTS idx_customs_authorities_code ON transportation_customs_authorities(code);

      CREATE TABLE IF NOT EXISTS transportation_carriers (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        carrier TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_carriers_tenant ON transportation_carriers(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_carriers_code ON transportation_carriers(code);
      CREATE INDEX IF NOT EXISTS idx_carriers_type ON transportation_carriers(type);
      CREATE INDEX IF NOT EXISTS idx_carriers_status ON transportation_carriers(status);

      CREATE TABLE IF NOT EXISTS transportation_load_plans (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL,
        load_plan TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_load_plans_tenant ON transportation_load_plans(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_load_plans_vehicle ON transportation_load_plans(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_load_plans_created ON transportation_load_plans(created_at);

      CREATE TABLE IF NOT EXISTS transportation_network_models (
        id TEXT PRIMARY KEY,
        name TEXT,
        model TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_network_models_tenant ON transportation_network_models(tenant_id);

      CREATE TABLE IF NOT EXISTS transportation_network_optimizations (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_network_opt_tenant ON transportation_network_optimizations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_network_opt_model ON transportation_network_optimizations(model_id);

      CREATE TABLE IF NOT EXISTS transportation_last_mile_routes (
        id TEXT PRIMARY KEY,
        route TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_last_mile_routes_tenant ON transportation_last_mile_routes(tenant_id);
    `;

    await this.dbClient.query(sql);
  }

  // ========================================================================
  // ROUTE PLANS
  // ========================================================================

  /**
   * Store route plan
   */
  async storeRoutePlan(
    routePlan: IntelligentRoutePlan,
    metadata: {
      name?: string;
      createdBy: string;
      tenantId?: string;
    },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) {
      return routePlan.id;
    }

    try {
      const entry: RoutePlanDatabaseEntry = {
        id: routePlan.id,
        name: metadata.name,
        origin: JSON.stringify(routePlan.origin),
        destination: JSON.stringify(routePlan.destination),
        waypoints: routePlan.waypoints
          ? JSON.stringify(routePlan.waypoints)
          : undefined,
        mode: routePlan.mode,
        type: routePlan.type || "FTL",
        routePlan: JSON.stringify(routePlan),
        transitTime: routePlan.transitTime
          ? JSON.stringify(routePlan.transitTime)
          : undefined,
        cargo: JSON.stringify(routePlan.cargo || {}),
        compliancePrograms: routePlan.compliancePrograms
          ? JSON.stringify(routePlan.compliancePrograms)
          : undefined,
        preferences: routePlan.preferences
          ? JSON.stringify(routePlan.preferences)
          : undefined,
        score: routePlan.score?.overall,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: metadata.createdBy,
        tenantId: metadata.tenantId,
      };

      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_route_plans (
            id, name, origin, destination, waypoints, mode, type,
            "routePlan", "transitTime", cargo, "compliancePrograms",
            preferences, score, "createdAt", "updatedAt", "createdBy", "tenantId"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            "routePlan" = EXCLUDED."routePlan",
            "transitTime" = EXCLUDED."transitTime",
            score = EXCLUDED.score,
            "updatedAt" = EXCLUDED."updatedAt"
        `,
          [
            entry.id,
            entry.name,
            entry.origin,
            entry.destination,
            entry.waypoints,
            entry.mode,
            entry.type,
            entry.routePlan,
            entry.transitTime,
            entry.cargo,
            entry.compliancePrograms,
            entry.preferences,
            entry.score,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        // MongoDB implementation
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_route_plans");
        await collection.replaceOne({ id: entry.id }, entry, { upsert: true });
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_route_plans (
            id, name, origin, destination, waypoints, mode, type,
            route_plan, transit_time, cargo, compliance_programs,
            preferences, score, created_at, updated_at, created_by, tenant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            entry.id,
            entry.name,
            entry.origin,
            entry.destination,
            entry.waypoints,
            entry.mode,
            entry.type,
            entry.routePlan,
            entry.transitTime,
            entry.cargo,
            entry.compliancePrograms,
            entry.preferences,
            entry.score,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }

      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store route plan in database:",
        error,
      );
      return routePlan.id;
    }
  }

  /**
   * Get route plan by ID
   */
  async getRoutePlan(
    id: string,
    tenantId?: string,
  ): Promise<IntelligentRoutePlan | null> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) {
      return null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        const query = tenantId
          ? 'SELECT "routePlan" AS route_plan FROM transportation_route_plans WHERE id = $1 AND "tenantId" = $2'
          : 'SELECT "routePlan" AS route_plan FROM transportation_route_plans WHERE id = $1';
        const params = tenantId ? [id, tenantId] : [id];
        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_route_plans");
        const doc = tenantId
          ? await collection.findOne({ id, tenantId })
          : await collection.findOne({ id });
        result = doc ? [{ route_plan: doc.routePlan }] : [];
      } else if (dbType === "sqlite") {
        const query = tenantId
          ? "SELECT route_plan FROM transportation_route_plans WHERE id = ? AND tenant_id = ?"
          : "SELECT route_plan FROM transportation_route_plans WHERE id = ?";
        const params = tenantId ? [id, tenantId] : [id];
        result = await this.dbClient.query(query, params);
      }

      if (Array.isArray(result) && result.length > 0) {
        const routePlanData =
          typeof result[0].route_plan === "string"
            ? JSON.parse(result[0].route_plan)
            : result[0].route_plan;
        return routePlanData as IntelligentRoutePlan;
      }

      return null;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get route plan from database:",
        error,
      );
      return null;
    }
  }

  /**
   * List route plans
   */
  async listRoutePlans(options: {
    tenantId?: string;
    mode?: string;
    limit?: number;
    offset?: number;
  }): Promise<IntelligentRoutePlan[]> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) {
      return [];
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        let query =
          'SELECT "routePlan" AS route_plan FROM transportation_route_plans WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (options.tenantId) {
          query += ` AND "tenantId" = $${paramIndex++}`;
          params.push(options.tenantId);
        }
        if (options.mode) {
          query += ` AND mode = $${paramIndex++}`;
          params.push(options.mode);
        }

        query += ` ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(options.limit || 100, options.offset || 0);

        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_route_plans");
        const filter: any = {};
        if (options.tenantId) filter.tenantId = options.tenantId;
        if (options.mode) filter.mode = options.mode;

        const docs = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(options.limit || 100)
          .skip(options.offset || 0)
          .toArray();

        result = docs.map((doc) => ({ route_plan: doc.routePlan }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT route_plan FROM transportation_route_plans WHERE 1=1";
        const params: any[] = [];

        if (options.tenantId) {
          query += " AND tenant_id = ?";
          params.push(options.tenantId);
        }
        if (options.mode) {
          query += " AND mode = ?";
          params.push(options.mode);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 100, options.offset || 0);

        result = await this.dbClient.query(query, params);
      }

      if (Array.isArray(result)) {
        return result.map((row: any) => {
          const routePlanData =
            typeof row.route_plan === "string"
              ? JSON.parse(row.route_plan)
              : row.route_plan;
          return routePlanData as IntelligentRoutePlan;
        });
      }

      return [];
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list route plans from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // TOUCHPOINTS
  // ========================================================================

  /**
   * Store touchpoint
   */
  async storeTouchpoint(
    touchpoint: Touchpoint,
    tenantId?: string,
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) {
      return touchpoint.id;
    }

    try {
      const entry: TouchpointDatabaseEntry = {
        id: touchpoint.id,
        code: touchpoint.code || touchpoint.id,
        name: touchpoint.name,
        type: touchpoint.type,
        location: JSON.stringify(touchpoint.location),
        operatingHours: touchpoint.operatingHours
          ? JSON.stringify(touchpoint.operatingHours)
          : undefined,
        capacity: touchpoint.capacity
          ? JSON.stringify(touchpoint.capacity)
          : undefined,
        capabilities: touchpoint.capabilities
          ? JSON.stringify(touchpoint.capabilities)
          : undefined,
        restrictions: touchpoint.restrictions
          ? JSON.stringify(touchpoint.restrictions)
          : undefined,
        compliancePrograms: touchpoint.preferredPrograms
          ? JSON.stringify(touchpoint.preferredPrograms)
          : undefined,
        touchpoint: JSON.stringify(touchpoint),
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: tenantId || undefined,
      };

      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_touchpoints (
            id, code, name, type, location, operating_hours, capacity,
            capabilities, restrictions, compliance_programs, touchpoint,
            created_at, updated_at, tenant_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            touchpoint = EXCLUDED.touchpoint,
            updated_at = EXCLUDED.updated_at
        `,
          [
            entry.id,
            entry.code,
            entry.name,
            entry.type,
            entry.location,
            entry.operatingHours,
            entry.capacity,
            entry.capabilities,
            entry.restrictions,
            entry.compliancePrograms,
            entry.touchpoint,
            entry.createdAt,
            entry.updatedAt,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_touchpoints");
        await collection.replaceOne({ id: entry.id }, entry, { upsert: true });
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_touchpoints (
            id, code, name, type, location, operating_hours, capacity,
            capabilities, restrictions, compliance_programs, touchpoint,
            created_at, updated_at, tenant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            entry.id,
            entry.code,
            entry.name,
            entry.type,
            entry.location,
            entry.operatingHours,
            entry.capacity,
            entry.capabilities,
            entry.restrictions,
            entry.compliancePrograms,
            entry.touchpoint,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.tenantId,
          ],
        );
      }

      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store touchpoint in database:",
        error,
      );
      return touchpoint.id;
    }
  }

  /**
   * Get touchpoint by ID
   */
  async getTouchpoint(
    id: string,
    tenantId?: string,
  ): Promise<Touchpoint | null> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) {
      return null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        const query = tenantId
          ? "SELECT touchpoint FROM transportation_touchpoints WHERE id = $1 AND tenant_id = $2"
          : "SELECT touchpoint FROM transportation_touchpoints WHERE id = $1";
        const params = tenantId ? [id, tenantId] : [id];
        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_touchpoints");
        const doc = tenantId
          ? await collection.findOne({ id, tenantId })
          : await collection.findOne({ id });
        result = doc ? [{ touchpoint: doc.touchpoint }] : [];
      } else if (dbType === "sqlite") {
        const query = tenantId
          ? "SELECT touchpoint FROM transportation_touchpoints WHERE id = ? AND tenant_id = ?"
          : "SELECT touchpoint FROM transportation_touchpoints WHERE id = ?";
        const params = tenantId ? [id, tenantId] : [id];
        result = await this.dbClient.query(query, params);
      }

      if (Array.isArray(result) && result.length > 0) {
        const touchpointData =
          typeof result[0].touchpoint === "string"
            ? JSON.parse(result[0].touchpoint)
            : result[0].touchpoint;
        return touchpointData as Touchpoint;
      }

      return null;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get touchpoint from database:",
        error,
      );
      return null;
    }
  }

  /**
   * List touchpoints
   */
  async listTouchpoints(options: {
    tenantId?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Touchpoint[]> {
    await this.ensureInitialized();
    if (!this.useDatabase || !this.dbClient) {
      return [];
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        let query =
          "SELECT touchpoint FROM transportation_touchpoints WHERE 1=1";
        const params: any[] = [];
        let paramIndex = 1;

        if (options.tenantId) {
          query += ` AND tenant_id = $${paramIndex++}`;
          params.push(options.tenantId);
        }
        if (options.type) {
          query += ` AND type = $${paramIndex++}`;
          params.push(options.type);
        }

        query += ` ORDER BY name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(options.limit || 100, options.offset || 0);

        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_touchpoints");
        const filter: any = {};
        if (options.tenantId) filter.tenantId = options.tenantId;
        if (options.type) filter.type = options.type;

        const docs = await collection
          .find(filter)
          .sort({ name: 1 })
          .limit(options.limit || 100)
          .skip(options.offset || 0)
          .toArray();

        result = docs.map((doc) => ({ touchpoint: doc.touchpoint }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT touchpoint FROM transportation_touchpoints WHERE 1=1";
        const params: any[] = [];

        if (options.tenantId) {
          query += " AND tenant_id = ?";
          params.push(options.tenantId);
        }
        if (options.type) {
          query += " AND type = ?";
          params.push(options.type);
        }

        query += " ORDER BY name LIMIT ? OFFSET ?";
        params.push(options.limit || 100, options.offset || 0);

        result = await this.dbClient.query(query, params);
      }

      if (Array.isArray(result)) {
        return result.map((row: any) => {
          const touchpointData =
            typeof row.touchpoint === "string"
              ? JSON.parse(row.touchpoint)
              : row.touchpoint;
          return touchpointData as Touchpoint;
        });
      }

      return [];
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list touchpoints from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // SHIPMENTS (tenant-scoped)
  // ========================================================================

  private getTenantShipmentStore(tenantId: string): Map<string, Shipment> {
    if (!this.inMemoryShipments.has(tenantId)) {
      this.inMemoryShipments.set(tenantId, new Map());
    }
    return this.inMemoryShipments.get(tenantId)!;
  }

  // ========================================================================
  // LOAD PLANS (tenant-scoped, durable)
  // ========================================================================

  private getTenantLoadPlanStore(tenantId: string): Map<string, LoadPlan> {
    if (!this.inMemoryLoadPlans.has(tenantId)) {
      this.inMemoryLoadPlans.set(tenantId, new Map());
    }
    return this.inMemoryLoadPlans.get(tenantId)!;
  }

  async storeLoadPlan(
    loadPlan: LoadPlan,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for load plan persistence (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      const store = this.getTenantLoadPlanStore(metadata.tenantId);
      store.set(loadPlan.id, loadPlan);
      return loadPlan.id;
    }

    const entry: TransportationLoadPlanDatabaseEntry = {
      id: loadPlan.id,
      vehicleId: String((loadPlan as any).vehicleId || ""),
      loadPlan: JSON.stringify(loadPlan),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_load_plans (
            id, vehicle_id, load_plan, created_at, updated_at, created_by, tenant_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (id) DO UPDATE SET
            load_plan = EXCLUDED.load_plan,
            updated_at = EXCLUDED.updated_at
        `,
          [
            entry.id,
            entry.vehicleId,
            entry.loadPlan,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_load_plans");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_load_plans (
            id, vehicle_id, load_plan, created_at, updated_at, created_by, tenant_id
          ) VALUES (?,?,?,?,?,?,?)
        `,
          [
            entry.id,
            entry.vehicleId,
            entry.loadPlan,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      if (process.env.NODE_ENV === "production")
        throw error instanceof Error ? error : new Error(String(error));
      console.warn(
        "⚠️ Transportation: Failed to store load plan in database:",
        error,
      );
      const store = this.getTenantLoadPlanStore(metadata.tenantId);
      store.set(loadPlan.id, loadPlan);
      return loadPlan.id;
    }
  }

  async getLoadPlan(
    tenantId: string,
    loadPlanId: string,
  ): Promise<LoadPlan | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to read load plans (multi-tenant day 1)",
      );
    if (!this.useDatabase || !this.dbClient)
      return this.getTenantLoadPlanStore(tenantId).get(loadPlanId) || null;

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT load_plan FROM transportation_load_plans WHERE id = $1 AND tenant_id = $2",
          [loadPlanId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_load_plans");
        const doc = await collection.findOne({ id: loadPlanId, tenantId });
        result = doc ? [{ load_plan: doc.loadPlan || doc.load_plan }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT load_plan FROM transportation_load_plans WHERE id = ? AND tenant_id = ?",
          [loadPlanId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      const data = (row.load_plan ?? row.loadPlan) as any;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return parsed as LoadPlan;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get load plan from database:",
        error,
      );
      return null;
    }
  }

  async listLoadPlans(options: {
    tenantId: string;
    limit?: number;
    offset?: number;
  }): Promise<LoadPlan[]> {
    await this.ensureInitialized();
    const { tenantId, limit = 200, offset = 0 } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list load plans (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(this.getTenantLoadPlanStore(tenantId).values()).slice(
        offset,
        offset + limit,
      );
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT load_plan FROM transportation_load_plans WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [tenantId, limit, offset],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_load_plans");
        const docs = await collection
          .find({ tenantId })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray();
        result = docs.map((d: any) => ({
          load_plan: d.loadPlan || d.load_plan,
        }));
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT load_plan FROM transportation_load_plans WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [tenantId, limit, offset],
        );
      }
      return (Array.isArray(result) ? result : []).map((row: any) => {
        const data = row.load_plan ?? row.loadPlan;
        return (typeof data === "string" ? JSON.parse(data) : data) as LoadPlan;
      });
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list load plans from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // NETWORK MODELING (tenant-scoped, durable)
  // ========================================================================

  private getTenantNetworkModelStore(
    tenantId: string,
  ): Map<string, NetworkModel> {
    if (!this.inMemoryNetworkModels.has(tenantId))
      this.inMemoryNetworkModels.set(tenantId, new Map());
    return this.inMemoryNetworkModels.get(tenantId)!;
  }

  private getTenantNetworkOptimizationStore(
    tenantId: string,
  ): Map<string, NetworkOptimizationResult> {
    if (!this.inMemoryNetworkOptimizations.has(tenantId))
      this.inMemoryNetworkOptimizations.set(tenantId, new Map());
    return this.inMemoryNetworkOptimizations.get(tenantId)!;
  }

  async storeNetworkModel(
    model: NetworkModel,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error("tenantId is required for network model persistence");

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantNetworkModelStore(metadata.tenantId).set(model.id, model);
      return model.id;
    }

    const entry: TransportationNetworkModelDatabaseEntry = {
      id: model.id,
      name: (model as any).name,
      model: JSON.stringify(model),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_network_models (
            id, name, model, created_at, updated_at, created_by, tenant_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (id) DO UPDATE SET
            model = EXCLUDED.model,
            name = EXCLUDED.name,
            updated_at = EXCLUDED.updated_at
        `,
          [
            entry.id,
            entry.name || null,
            entry.model,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_network_models");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_network_models (
            id, name, model, created_at, updated_at, created_by, tenant_id
          ) VALUES (?,?,?,?,?,?,?)
        `,
          [
            entry.id,
            entry.name || null,
            entry.model,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      if (process.env.NODE_ENV === "production")
        throw error instanceof Error ? error : new Error(String(error));
      console.warn(
        "⚠️ Transportation: Failed to store network model in database:",
        error,
      );
      this.getTenantNetworkModelStore(metadata.tenantId).set(model.id, model);
      return model.id;
    }
  }

  async listNetworkModels(options: {
    tenantId: string;
    limit?: number;
    offset?: number;
  }): Promise<NetworkModel[]> {
    await this.ensureInitialized();
    const { tenantId, limit = 200, offset = 0 } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error("tenantId is required to list network models");

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(
        this.getTenantNetworkModelStore(tenantId).values(),
      ).slice(offset, offset + limit);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT model FROM transportation_network_models WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [tenantId, limit, offset],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_network_models");
        const docs = await collection
          .find({ tenantId })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray();
        result = docs.map((d: any) => ({ model: d.model }));
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT model FROM transportation_network_models WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [tenantId, limit, offset],
        );
      }
      return (Array.isArray(result) ? result : []).map((row: any) => {
        const data = row.model;
        return (
          typeof data === "string" ? JSON.parse(data) : data
        ) as NetworkModel;
      });
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list network models from database:",
        error,
      );
      return [];
    }
  }

  async storeNetworkOptimization(
    optimization: NetworkOptimizationResult,
    metadata: { tenantId: string; createdBy: string; optimizationId?: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for network optimization persistence",
      );

    const id =
      metadata.optimizationId || `netopt-${optimization.modelId}-${Date.now()}`;

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantNetworkOptimizationStore(metadata.tenantId).set(
        id,
        optimization,
      );
      return id;
    }

    const entry: TransportationNetworkOptimizationDatabaseEntry = {
      id,
      modelId: optimization.modelId,
      result: JSON.stringify(optimization),
      createdAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_network_optimizations (
            id, model_id, result, created_at, created_by, tenant_id
          ) VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (id) DO UPDATE SET
            result = EXCLUDED.result
        `,
          [
            entry.id,
            entry.modelId,
            entry.result,
            entry.createdAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_network_optimizations");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_network_optimizations (
            id, model_id, result, created_at, created_by, tenant_id
          ) VALUES (?,?,?,?,?,?)
        `,
          [
            entry.id,
            entry.modelId,
            entry.result,
            entry.createdAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      if (process.env.NODE_ENV === "production")
        throw error instanceof Error ? error : new Error(String(error));
      console.warn(
        "⚠️ Transportation: Failed to store network optimization in database:",
        error,
      );
      this.getTenantNetworkOptimizationStore(metadata.tenantId).set(
        id,
        optimization,
      );
      return id;
    }
  }

  async listNetworkOptimizations(options: {
    tenantId: string;
    modelId?: string;
    limit?: number;
    offset?: number;
  }): Promise<NetworkOptimizationResult[]> {
    await this.ensureInitialized();
    const { tenantId, modelId, limit = 200, offset = 0 } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error("tenantId is required to list network optimizations");

    if (!this.useDatabase || !this.dbClient) {
      const all = Array.from(
        this.getTenantNetworkOptimizationStore(tenantId).values(),
      );
      const filtered = modelId ? all.filter((o) => o.modelId === modelId) : all;
      return filtered.slice(offset, offset + limit);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        if (modelId) {
          result = await this.dbClient.query(
            "SELECT result FROM transportation_network_optimizations WHERE tenant_id = $1 AND model_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
            [tenantId, modelId, limit, offset],
          );
        } else {
          result = await this.dbClient.query(
            "SELECT result FROM transportation_network_optimizations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            [tenantId, limit, offset],
          );
        }
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_network_optimizations");
        const q: any = { tenantId };
        if (modelId) q.modelId = modelId;
        const docs = await collection
          .find(q)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray();
        result = docs.map((d: any) => ({ result: d.result }));
      } else if (dbType === "sqlite") {
        if (modelId) {
          result = await this.dbClient.query(
            "SELECT result FROM transportation_network_optimizations WHERE tenant_id = ? AND model_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [tenantId, modelId, limit, offset],
          );
        } else {
          result = await this.dbClient.query(
            "SELECT result FROM transportation_network_optimizations WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [tenantId, limit, offset],
          );
        }
      }
      return (Array.isArray(result) ? result : []).map((row: any) => {
        const data = row.result;
        return (
          typeof data === "string" ? JSON.parse(data) : data
        ) as NetworkOptimizationResult;
      });
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list network optimizations from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // LAST MILE ROUTES (tenant-scoped, durable)
  // ========================================================================

  private getTenantLastMileRouteStore(
    tenantId: string,
  ): Map<string, DeliveryRoute> {
    if (!this.inMemoryLastMileRoutes.has(tenantId))
      this.inMemoryLastMileRoutes.set(tenantId, new Map());
    return this.inMemoryLastMileRoutes.get(tenantId)!;
  }

  async storeLastMileRoute(
    route: DeliveryRoute,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error("tenantId is required for last-mile route persistence");

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantLastMileRouteStore(metadata.tenantId).set(route.id, route);
      return route.id;
    }

    const entry: TransportationLastMileRouteDatabaseEntry = {
      id: route.id,
      route: JSON.stringify(route),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_last_mile_routes (
            id, route, created_at, updated_at, created_by, tenant_id
          ) VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (id) DO UPDATE SET
            route = EXCLUDED.route,
            updated_at = EXCLUDED.updated_at
        `,
          [
            entry.id,
            entry.route,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_last_mile_routes");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_last_mile_routes (
            id, route, created_at, updated_at, created_by, tenant_id
          ) VALUES (?,?,?,?,?,?)
        `,
          [
            entry.id,
            entry.route,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      if (process.env.NODE_ENV === "production")
        throw error instanceof Error ? error : new Error(String(error));
      console.warn(
        "⚠️ Transportation: Failed to store last-mile route in database:",
        error,
      );
      this.getTenantLastMileRouteStore(metadata.tenantId).set(route.id, route);
      return route.id;
    }
  }

  async getLastMileRoute(
    tenantId: string,
    routeId: string,
  ): Promise<DeliveryRoute | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error("tenantId is required to read last-mile routes");
    if (!this.useDatabase || !this.dbClient)
      return this.getTenantLastMileRouteStore(tenantId).get(routeId) || null;

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT route FROM transportation_last_mile_routes WHERE id = $1 AND tenant_id = $2",
          [routeId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_last_mile_routes");
        const doc = await collection.findOne({ id: routeId, tenantId });
        result = doc ? [{ route: doc.route }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT route FROM transportation_last_mile_routes WHERE id = ? AND tenant_id = ?",
          [routeId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      const parsed =
        typeof row.route === "string" ? JSON.parse(row.route) : row.route;
      return parsed as DeliveryRoute;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get last-mile route from database:",
        error,
      );
      return null;
    }
  }

  async listLastMileRoutes(options: {
    tenantId: string;
    limit?: number;
    offset?: number;
  }): Promise<DeliveryRoute[]> {
    await this.ensureInitialized();
    const { tenantId, limit = 200, offset = 0 } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error("tenantId is required to list last-mile routes");

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(
        this.getTenantLastMileRouteStore(tenantId).values(),
      ).slice(offset, offset + limit);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT route FROM transportation_last_mile_routes WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [tenantId, limit, offset],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_last_mile_routes");
        const docs = await collection
          .find({ tenantId })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray();
        result = docs.map((d: any) => ({ route: d.route }));
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT route FROM transportation_last_mile_routes WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [tenantId, limit, offset],
        );
      }
      return (Array.isArray(result) ? result : []).map((row: any) => {
        const data = row.route;
        return (
          typeof data === "string" ? JSON.parse(data) : data
        ) as DeliveryRoute;
      });
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list last-mile routes from database:",
        error,
      );
      return [];
    }
  }

  async storeShipment(
    shipment: Shipment,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for shipment persistence (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      const store = this.getTenantShipmentStore(metadata.tenantId);
      store.set(shipment.id, shipment);
      return shipment.id;
    }

    const entry: ShipmentDatabaseEntry = {
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      shipment: JSON.stringify(shipment),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";

      if (dbType === "postgresql") {
        await this.dbClient.query(
          `
          INSERT INTO transportation_shipments (
            id, shipment_number, status, shipment, created_at, updated_at, created_by, tenant_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            shipment = EXCLUDED.shipment,
            updated_at = EXCLUDED.updated_at
        `,
          [
            entry.id,
            entry.shipmentNumber,
            entry.status,
            entry.shipment,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_shipments");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `
          INSERT OR REPLACE INTO transportation_shipments (
            id, shipment_number, status, shipment, created_at, updated_at, created_by, tenant_id
          ) VALUES (?,?,?,?,?,?,?,?)
        `,
          [
            entry.id,
            entry.shipmentNumber,
            entry.status,
            entry.shipment,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }

      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store shipment in database:",
        error,
      );
      const store = this.getTenantShipmentStore(metadata.tenantId);
      store.set(shipment.id, shipment);
      return shipment.id;
    }
  }

  async getShipment(
    tenantId: string,
    shipmentId: string,
  ): Promise<Shipment | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required to read shipments (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      const store = this.getTenantShipmentStore(tenantId);
      return store.get(shipmentId) || null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT shipment FROM transportation_shipments WHERE id = $1 AND tenant_id = $2",
          [shipmentId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_shipments");
        const doc = await collection.findOne({ id: shipmentId, tenantId });
        result = doc ? [{ shipment: doc.shipment }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT shipment FROM transportation_shipments WHERE id = ? AND tenant_id = ?",
          [shipmentId, tenantId],
        );
      }

      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      const shipmentData =
        typeof row.shipment === "string"
          ? JSON.parse(row.shipment)
          : row.shipment;
      return shipmentData as Shipment;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get shipment from database:",
        error,
      );
      return null;
    }
  }

  async listShipments(options: {
    tenantId: string;
    status?: string;
    carrierId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Shipment[]> {
    // Fast return for demo mode - skip database
    if (
      process.env.ENABLE_DEMO_DATA === "true" ||
      process.env.NODE_ENV === "development"
    ) {
      try {
        const { generateDemoShipments } =
          await import("@/lib/services/demo/demoDataService");
        return generateDemoShipments({ count: options.limit || 50 });
      } catch (error) {
        // Fall through to normal flow if import fails
        console.warn("Failed to load demo data, using normal flow:", error);
      }
    }
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required to list shipments (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      const store = this.getTenantShipmentStore(tenantId);
      let shipments = Array.from(store.values());
      if (options.status) {
        const statuses = options.status
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        shipments = shipments.filter((s) => statuses.includes(s.status));
      }
      if (options.carrierId) {
        shipments = shipments.filter((s) => s.carrierId === options.carrierId);
      }
      return shipments.slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        let query =
          "SELECT shipment FROM transportation_shipments WHERE tenant_id = $1";
        const params: any[] = [tenantId];
        let idx = 2;

        if (options.status) {
          query += ` AND status = $${idx++}`;
          params.push(options.status);
        }

        if (options.carrierId) {
          query += ` AND (shipment->>'carrierId') = $${idx++}`;
          params.push(options.carrierId);
        }

        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(options.limit || 200, options.offset || 0);

        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_shipments");
        const filter: any = { tenantId };
        if (options.status) filter.status = options.status;
        if (options.carrierId) filter["shipment.carrierId"] = options.carrierId;
        const docs = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ shipment: d.shipment }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT shipment FROM transportation_shipments WHERE tenant_id = ?";
        const params: any[] = [tenantId];

        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }

      return (Array.isArray(result) ? result : []).map((row: any) => {
        const shipmentData =
          typeof row.shipment === "string"
            ? JSON.parse(row.shipment)
            : row.shipment;
        return shipmentData as Shipment;
      });
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list shipments from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // QUOTES (tenant-scoped)
  // ========================================================================

  private getTenantQuoteStore(tenantId: string): Map<string, Quote> {
    if (!this.inMemoryQuotes.has(tenantId))
      this.inMemoryQuotes.set(tenantId, new Map());
    return this.inMemoryQuotes.get(tenantId)!;
  }

  async storeQuote(
    quote: Quote,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for quote persistence (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantQuoteStore(metadata.tenantId).set(quote.id, quote);
      return quote.id;
    }

    const entry: QuoteDatabaseEntry = {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      shipmentId: quote.shipmentId,
      status: quote.status,
      quote: JSON.stringify(quote),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_quotes (id, quote_number, shipment_id, status, quote, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET quote = EXCLUDED.quote, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.quoteNumber,
            entry.shipmentId,
            entry.status,
            entry.quote,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_quotes");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_quotes (id, quote_number, shipment_id, status, quote, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.quoteNumber,
            entry.shipmentId,
            entry.status,
            entry.quote,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store quote in database:",
        error,
      );
      this.getTenantQuoteStore(metadata.tenantId).set(quote.id, quote);
      return quote.id;
    }
  }

  async getQuote(tenantId: string, quoteId: string): Promise<Quote | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required to read quotes (multi-tenant day 1)",
      );
    }
    if (!this.useDatabase || !this.dbClient) {
      return this.getTenantQuoteStore(tenantId).get(quoteId) || null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT quote FROM transportation_quotes WHERE id = $1 AND tenant_id = $2",
          [quoteId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_quotes");
        const doc = await collection.findOne({ id: quoteId, tenantId });
        result = doc ? [{ quote: doc.quote }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT quote FROM transportation_quotes WHERE id = ? AND tenant_id = ?",
          [quoteId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      const quoteData =
        typeof row.quote === "string" ? JSON.parse(row.quote) : row.quote;
      return quoteData as Quote;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get quote from database:",
        error,
      );
      return null;
    }
  }

  async listQuotes(options: {
    tenantId: string;
    limit?: number;
    offset?: number;
  }): Promise<Quote[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list quotes (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(this.getTenantQuoteStore(tenantId).values()).slice(
        0,
        options.limit || 200,
      );
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT quote FROM transportation_quotes WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [tenantId, options.limit || 200, options.offset || 0],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_quotes");
        const docs = await collection
          .find({ tenantId })
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ quote: d.quote }));
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT quote FROM transportation_quotes WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [tenantId, options.limit || 200, options.offset || 0],
        );
      }
      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.quote === "string"
            ? JSON.parse(row.quote)
            : row.quote) as Quote,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list quotes from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // CARRIERS (tenant-scoped)
  // ========================================================================

  private getTenantCarrierStore(tenantId: string): Map<string, Carrier> {
    if (!this.inMemoryCarriers.has(tenantId))
      this.inMemoryCarriers.set(tenantId, new Map());
    return this.inMemoryCarriers.get(tenantId)!;
  }

  async storeCarrier(
    carrier: Carrier,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for carrier persistence (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantCarrierStore(metadata.tenantId).set(carrier.id, carrier);
      return carrier.id;
    }

    const entry: CarrierDatabaseEntry = {
      id: carrier.id,
      code: carrier.code,
      name: carrier.name,
      type: carrier.type,
      status: carrier.status,
      carrier: JSON.stringify(carrier),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_carriers (id, code, name, type, status, carrier, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET carrier = EXCLUDED.carrier, name = EXCLUDED.name, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.code,
            entry.name,
            entry.type,
            entry.status,
            entry.carrier,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_carriers");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_carriers (id, code, name, type, status, carrier, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.code,
            entry.name,
            entry.type,
            entry.status,
            entry.carrier,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store carrier in database:",
        error,
      );
      this.getTenantCarrierStore(metadata.tenantId).set(carrier.id, carrier);
      return carrier.id;
    }
  }

  async getCarrier(
    tenantId: string,
    carrierId: string,
  ): Promise<Carrier | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required to read carriers (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      return this.getTenantCarrierStore(tenantId).get(carrierId) || null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        const rows = await this.dbClient.query(
          "SELECT carrier FROM transportation_carriers WHERE id = $1 AND tenant_id = $2",
          [carrierId, tenantId],
        );
        const row = rows[0];
        if (!row) return null;
        return (
          typeof (row as any).carrier === "string"
            ? JSON.parse((row as any).carrier)
            : (row as any).carrier
        ) as Carrier;
      }
      if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_carriers");
        const doc = await collection.findOne({ id: carrierId, tenantId });
        if (!doc) return null;
        return (
          typeof doc.carrier === "string"
            ? JSON.parse(doc.carrier)
            : doc.carrier
        ) as Carrier;
      }
      if (dbType === "sqlite") {
        const rows = await this.dbClient.query(
          "SELECT carrier FROM transportation_carriers WHERE id = ? AND tenant_id = ?",
          [carrierId, tenantId],
        );
        const row = rows[0];
        if (!row) return null;
        return (
          typeof (row as any).carrier === "string"
            ? JSON.parse((row as any).carrier)
            : (row as any).carrier
        ) as Carrier;
      }
      return null;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get carrier from database:",
        error,
      );
      return null;
    }
  }

  async listCarriers(options: {
    tenantId: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Carrier[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list carriers (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      let list = Array.from(this.getTenantCarrierStore(tenantId).values());
      if (options.type) list = list.filter((c) => c.type === options.type);
      if (options.status)
        list = list.filter((c) => c.status === (options.status as any));
      return list.slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        const where: string[] = ["tenant_id = $1"];
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.type) {
          where.push(`type = $${idx++}`);
          params.push(options.type);
        }
        if (options.status) {
          where.push(`status = $${idx++}`);
          params.push(options.status);
        }
        params.push(options.limit || 200, options.offset || 0);
        const rows = await this.dbClient.query(
          `SELECT carrier FROM transportation_carriers WHERE ${where.join(" AND ")} ORDER BY name ASC LIMIT $${idx++} OFFSET $${idx}`,
          params,
        );
        return rows.map(
          (r: any) =>
            (typeof r.carrier === "string"
              ? JSON.parse(r.carrier)
              : r.carrier) as Carrier,
        );
      }
      if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_carriers");
        const q: any = { tenantId };
        if (options.type) q.type = options.type;
        if (options.status) q.status = options.status;
        const docs = await collection
          .find(q)
          .sort({ name: 1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        return docs.map(
          (d: any) =>
            (typeof d.carrier === "string"
              ? JSON.parse(d.carrier)
              : d.carrier) as Carrier,
        );
      }
      if (dbType === "sqlite") {
        let query =
          "SELECT carrier FROM transportation_carriers WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.type) {
          query += " AND type = ?";
          params.push(options.type);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        query += " ORDER BY name ASC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        const rows = await this.dbClient.query(query, params);
        return rows.map(
          (r: any) =>
            (typeof r.carrier === "string"
              ? JSON.parse(r.carrier)
              : r.carrier) as Carrier,
        );
      }
      return [];
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list carriers from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // PROPOSALS (tenant-scoped, stored as JSON)
  // ========================================================================

  private getTenantProposalStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryProposals.has(tenantId))
      this.inMemoryProposals.set(tenantId, new Map());
    return this.inMemoryProposals.get(tenantId)!;
  }

  async storeProposal(
    proposal: Record<string, unknown> & { id: string },
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for proposal persistence (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantProposalStore(metadata.tenantId).set(proposal.id, proposal);
      return proposal.id;
    }

    const entry: ProposalDatabaseEntry = {
      id: proposal.id,
      proposalType: String(
        (proposal as any).proposalType || (proposal as any).type || "",
      ),
      status: String((proposal as any).status || ""),
      proposal: JSON.stringify(proposal),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_proposals (id, proposal_type, status, proposal, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET proposal = EXCLUDED.proposal, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.proposalType,
            entry.status,
            entry.proposal,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_proposals");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_proposals (id, proposal_type, status, proposal, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.proposalType,
            entry.status,
            entry.proposal,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store proposal in database:",
        error,
      );
      this.getTenantProposalStore(metadata.tenantId).set(proposal.id, proposal);
      return proposal.id;
    }
  }

  async getProposal(
    tenantId: string,
    proposalId: string,
  ): Promise<Record<string, unknown> | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to read proposals (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return this.getTenantProposalStore(tenantId).get(proposalId) || null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT proposal FROM transportation_proposals WHERE id = $1 AND tenant_id = $2",
          [proposalId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_proposals");
        const doc = await collection.findOne({ id: proposalId, tenantId });
        result = doc ? [{ proposal: doc.proposal }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT proposal FROM transportation_proposals WHERE id = ? AND tenant_id = ?",
          [proposalId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      return (
        typeof row.proposal === "string"
          ? JSON.parse(row.proposal)
          : row.proposal
      ) as Record<string, unknown>;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get proposal from database:",
        error,
      );
      return null;
    }
  }

  // ========================================================================
  // DOCUMENTS (tenant-scoped)
  // ========================================================================

  private getTenantDocumentStore(
    tenantId: string,
  ): Map<string, ShipmentDocument> {
    if (!this.inMemoryDocuments.has(tenantId))
      this.inMemoryDocuments.set(tenantId, new Map());
    return this.inMemoryDocuments.get(tenantId)!;
  }

  async storeDocument(
    document: ShipmentDocument,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for document persistence (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantDocumentStore(metadata.tenantId).set(document.id, document);
      return document.id;
    }

    const entry: TransportationDocumentDatabaseEntry = {
      id: document.id,
      shipmentId: document.shipmentId || undefined,
      type: String(document.type || ""),
      status: String(document.status || "PENDING"),
      document: JSON.stringify(document),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_documents (id, shipment_id, type, status, document, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.shipmentId,
            entry.type,
            entry.status,
            entry.document,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_documents");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_documents (id, shipment_id, type, status, document, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.shipmentId,
            entry.type,
            entry.status,
            entry.document,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store document in database:",
        error,
      );
      this.getTenantDocumentStore(metadata.tenantId).set(document.id, document);
      return document.id;
    }
  }

  async getDocument(
    tenantId: string,
    documentId: string,
  ): Promise<ShipmentDocument | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to read documents (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return this.getTenantDocumentStore(tenantId).get(documentId) || null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT document FROM transportation_documents WHERE id = $1 AND tenant_id = $2",
          [documentId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_documents");
        const doc = await collection.findOne({ id: documentId, tenantId });
        result = doc ? [{ document: doc.document }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT document FROM transportation_documents WHERE id = ? AND tenant_id = ?",
          [documentId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      return (
        typeof row.document === "string"
          ? JSON.parse(row.document)
          : row.document
      ) as ShipmentDocument;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get document from database:",
        error,
      );
      return null;
    }
  }

  async listDocuments(options: {
    tenantId: string;
    shipmentId?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ShipmentDocument[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list documents (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(this.getTenantDocumentStore(tenantId).values())
        .filter((d) => {
          if (options.shipmentId && d.shipmentId !== options.shipmentId)
            return false;
          if (options.type && d.type !== options.type) return false;
          if (options.status && d.status !== options.status) return false;
          return true;
        })
        .slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        const where: string[] = ["tenant_id = $1"];
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.shipmentId) {
          where.push(`shipment_id = $${idx++}`);
          params.push(options.shipmentId);
        }
        if (options.type) {
          where.push(`type = $${idx++}`);
          params.push(options.type);
        }
        if (options.status) {
          where.push(`status = $${idx++}`);
          params.push(options.status);
        }
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(
          `SELECT document FROM transportation_documents WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
          params,
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_documents");
        const q: any = { tenantId };
        if (options.shipmentId) q.shipmentId = options.shipmentId;
        if (options.type) q.type = options.type;
        if (options.status) q.status = options.status;
        const docs = await collection
          .find(q)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ document: d.document }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT document FROM transportation_documents WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.shipmentId) {
          query += " AND shipment_id = ?";
          params.push(options.shipmentId);
        }
        if (options.type) {
          query += " AND type = ?";
          params.push(options.type);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }

      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.document === "string"
            ? JSON.parse(row.document)
            : row.document) as ShipmentDocument,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list documents from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // CUSTOMS AUTHORITIES (tenant-scoped)
  // ========================================================================

  private getTenantCustomsAuthorityStore(
    tenantId: string,
  ): Map<string, CustomsAuthority> {
    if (!this.inMemoryCustomsAuthorities.has(tenantId))
      this.inMemoryCustomsAuthorities.set(tenantId, new Map());
    return this.inMemoryCustomsAuthorities.get(tenantId)!;
  }

  async storeCustomsAuthority(
    authority: CustomsAuthority,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for customs authority persistence (multi-tenant day 1)",
      );
    }

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantCustomsAuthorityStore(metadata.tenantId).set(
        authority.id,
        authority,
      );
      return authority.id;
    }

    const entry: CustomsAuthorityDatabaseEntry = {
      id: authority.id,
      code: authority.code,
      country: authority.country,
      status: authority.status,
      authority: JSON.stringify(authority),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_customs_authorities (id, code, country, status, authority, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET authority = EXCLUDED.authority, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.code,
            entry.country,
            entry.status,
            entry.authority,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_authorities");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_customs_authorities (id, code, country, status, authority, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.code,
            entry.country,
            entry.status,
            entry.authority,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store customs authority in database:",
        error,
      );
      this.getTenantCustomsAuthorityStore(metadata.tenantId).set(
        authority.id,
        authority,
      );
      return authority.id;
    }
  }

  async getCustomsAuthority(
    tenantId: string,
    authorityId: string,
  ): Promise<CustomsAuthority | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to read customs authorities (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return (
        this.getTenantCustomsAuthorityStore(tenantId).get(authorityId) || null
      );
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT authority FROM transportation_customs_authorities WHERE id = $1 AND tenant_id = $2",
          [authorityId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_authorities");
        const doc = await collection.findOne({ id: authorityId, tenantId });
        result = doc ? [{ authority: doc.authority }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT authority FROM transportation_customs_authorities WHERE id = ? AND tenant_id = ?",
          [authorityId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      return (
        typeof row.authority === "string"
          ? JSON.parse(row.authority)
          : row.authority
      ) as CustomsAuthority;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get customs authority from database:",
        error,
      );
      return null;
    }
  }

  async listCustomsAuthorities(options: {
    tenantId: string;
    country?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CustomsAuthority[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list customs authorities (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(this.getTenantCustomsAuthorityStore(tenantId).values())
        .filter((a) => {
          if (options.country && a.country !== options.country) return false;
          if (options.status && a.status !== (options.status as any))
            return false;
          return true;
        })
        .slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        const where: string[] = ["tenant_id = $1"];
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.country) {
          where.push(`country = $${idx++}`);
          params.push(options.country);
        }
        if (options.status) {
          where.push(`status = $${idx++}`);
          params.push(options.status);
        }
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(
          `SELECT authority FROM transportation_customs_authorities WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
          params,
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_authorities");
        const q: any = { tenantId };
        if (options.country) q.country = options.country;
        if (options.status) q.status = options.status;
        const docs = await collection
          .find(q)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ authority: d.authority }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT authority FROM transportation_customs_authorities WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.country) {
          query += " AND country = ?";
          params.push(options.country);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }
      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.authority === "string"
            ? JSON.parse(row.authority)
            : row.authority) as CustomsAuthority,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list customs authorities from database:",
        error,
      );
      return [];
    }
  }

  async listProposals(options: {
    tenantId: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list proposals (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      return Array.from(this.getTenantProposalStore(tenantId).values()).slice(
        0,
        options.limit || 200,
      );
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT proposal FROM transportation_proposals WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [tenantId, options.limit || 200, options.offset || 0],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_proposals");
        const docs = await collection
          .find({ tenantId })
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ proposal: d.proposal }));
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT proposal FROM transportation_proposals WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [tenantId, options.limit || 200, options.offset || 0],
        );
      }

      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.proposal === "string"
            ? JSON.parse(row.proposal)
            : row.proposal) as Record<string, unknown>,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list proposals from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // CUSTOMS BROKERS (tenant-scoped)
  // ========================================================================

  private getTenantBrokerStore(tenantId: string): Map<string, CustomsBroker> {
    if (!this.inMemoryBrokers.has(tenantId))
      this.inMemoryBrokers.set(tenantId, new Map());
    return this.inMemoryBrokers.get(tenantId)!;
  }

  async storeCustomsBroker(
    broker: CustomsBroker,
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for customs broker persistence (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantBrokerStore(metadata.tenantId).set(broker.id, broker);
      return broker.id;
    }

    const entry: CustomsBrokerDatabaseEntry = {
      id: broker.id,
      country: broker.country,
      status: broker.status,
      broker: JSON.stringify(broker),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_customs_brokers (id, country, status, broker, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET broker = EXCLUDED.broker, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.country,
            entry.status,
            entry.broker,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_brokers");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_customs_brokers (id, country, status, broker, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.country,
            entry.status,
            entry.broker,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store customs broker in database:",
        error,
      );
      this.getTenantBrokerStore(metadata.tenantId).set(broker.id, broker);
      return broker.id;
    }
  }

  async listCustomsBrokers(options: {
    tenantId: string;
    country?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CustomsBroker[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list customs brokers (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      let list = Array.from(this.getTenantBrokerStore(tenantId).values());
      if (options.country)
        list = list.filter((b) => b.country === options.country);
      if (options.status)
        list = list.filter((b) => b.status === options.status);
      return list.slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        let query =
          "SELECT broker FROM transportation_customs_brokers WHERE tenant_id = $1";
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.country) {
          query += ` AND country = $${idx++}`;
          params.push(options.country);
        }
        if (options.status) {
          query += ` AND status = $${idx++}`;
          params.push(options.status);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_brokers");
        const filter: any = { tenantId };
        if (options.country) filter.country = options.country;
        if (options.status) filter.status = options.status;
        const docs = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ broker: d.broker }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT broker FROM transportation_customs_brokers WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.country) {
          query += " AND country = ?";
          params.push(options.country);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }

      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.broker === "string"
            ? JSON.parse(row.broker)
            : row.broker) as CustomsBroker,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list customs brokers from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // CUSTOMS DECLARATIONS (tenant-scoped; stored as JSON)
  // ========================================================================

  private getTenantDeclarationStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryDeclarations.has(tenantId))
      this.inMemoryDeclarations.set(tenantId, new Map());
    return this.inMemoryDeclarations.get(tenantId)!;
  }

  async storeCustomsDeclaration(
    declaration: (CustomsInfo & { id?: string; shipmentId?: string }) & {
      id: string;
    },
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for customs declaration persistence (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantDeclarationStore(metadata.tenantId).set(
        declaration.id,
        declaration as any,
      );
      return declaration.id;
    }

    const entry: CustomsDeclarationDatabaseEntry = {
      id: declaration.id,
      shipmentId: declaration.shipmentId,
      status: (declaration as any).status,
      declaration: JSON.stringify(declaration),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_customs_declarations (id, shipment_id, status, declaration, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET declaration = EXCLUDED.declaration, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.shipmentId,
            entry.status,
            entry.declaration,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_declarations");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_customs_declarations (id, shipment_id, status, declaration, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.shipmentId,
            entry.status,
            entry.declaration,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store customs declaration in database:",
        error,
      );
      this.getTenantDeclarationStore(metadata.tenantId).set(
        entry.id,
        JSON.parse(entry.declaration),
      );
      return entry.id;
    }
  }

  async listCustomsDeclarations(options: {
    tenantId: string;
    shipmentId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list customs declarations (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      let list = Array.from(this.getTenantDeclarationStore(tenantId).values());
      if (options.shipmentId)
        list = list.filter((d: any) => d.shipmentId === options.shipmentId);
      if (options.status)
        list = list.filter(
          (d: any) =>
            d.status === options.status ||
            d.complianceStatus === options.status,
        );
      return list.slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        let query =
          "SELECT declaration FROM transportation_customs_declarations WHERE tenant_id = $1";
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.shipmentId) {
          query += ` AND shipment_id = $${idx++}`;
          params.push(options.shipmentId);
        }
        if (options.status) {
          query += ` AND status = $${idx++}`;
          params.push(options.status);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_declarations");
        const filter: any = { tenantId };
        if (options.shipmentId) filter.shipmentId = options.shipmentId;
        if (options.status) filter.status = options.status;
        const docs = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ declaration: d.declaration }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT declaration FROM transportation_customs_declarations WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.shipmentId) {
          query += " AND shipment_id = ?";
          params.push(options.shipmentId);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }

      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.declaration === "string"
            ? JSON.parse(row.declaration)
            : row.declaration) as Record<string, unknown>,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list customs declarations from database:",
        error,
      );
      return [];
    }
  }

  async getCustomsDeclaration(
    tenantId: string,
    declarationId: string,
  ): Promise<Record<string, unknown> | null> {
    await this.ensureInitialized();
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to read customs declarations (multi-tenant day 1)",
      );
    if (!declarationId || declarationId.trim().length === 0)
      throw new Error("declarationId is required");

    if (!this.useDatabase || !this.dbClient) {
      return (
        this.getTenantDeclarationStore(tenantId).get(declarationId) || null
      );
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        result = await this.dbClient.query(
          "SELECT declaration FROM transportation_customs_declarations WHERE id = $1 AND tenant_id = $2",
          [declarationId, tenantId],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_customs_declarations");
        const doc = await collection.findOne({ id: declarationId, tenantId });
        result = doc ? [{ declaration: doc.declaration }] : [];
      } else if (dbType === "sqlite") {
        result = await this.dbClient.query(
          "SELECT declaration FROM transportation_customs_declarations WHERE id = ? AND tenant_id = ?",
          [declarationId, tenantId],
        );
      }
      const row = Array.isArray(result) ? result[0] : undefined;
      if (!row) return null;
      return (
        typeof row.declaration === "string"
          ? JSON.parse(row.declaration)
          : row.declaration
      ) as Record<string, unknown>;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get customs declaration from database:",
        error,
      );
      return null;
    }
  }

  async updateCustomsDeclaration(options: {
    tenantId: string;
    id: string;
    patch: Record<string, unknown>;
    updatedBy: string;
  }): Promise<Record<string, unknown> | null> {
    const existing = await this.getCustomsDeclaration(
      options.tenantId,
      options.id,
    );
    if (!existing) return null;
    const updated = {
      ...existing,
      ...options.patch,
      id: options.id,
      updatedAt: new Date().toISOString(),
      updatedBy: options.updatedBy,
    };
    await this.storeCustomsDeclaration(updated as any, {
      tenantId: options.tenantId,
      createdBy: String((existing as any).createdBy || options.updatedBy),
    });
    return updated;
  }

  // ========================================================================
  // PAYMENTS (tenant-scoped; stored as JSON)
  // ========================================================================

  private getTenantPaymentStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryPayments.has(tenantId))
      this.inMemoryPayments.set(tenantId, new Map());
    return this.inMemoryPayments.get(tenantId)!;
  }

  async storePayment(
    payment: Record<string, unknown> & { id?: string },
    metadata: {
      tenantId: string;
      createdBy: string;
      invoiceId?: string;
      shipmentId?: string;
      carrierId?: string;
      amount?: number;
      currency?: string;
      status?: string;
    },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for payment persistence (multi-tenant day 1)",
      );
    const id = String(
      (payment as any).id ||
        `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    );
    const record = { ...payment, id };

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantPaymentStore(metadata.tenantId).set(id, record);
      return id;
    }

    const entry: PaymentDatabaseEntry = {
      id,
      invoiceId: metadata.invoiceId,
      shipmentId: metadata.shipmentId,
      carrierId: metadata.carrierId,
      amount: metadata.amount,
      currency: metadata.currency,
      status: metadata.status,
      payment: JSON.stringify(record),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy,
      tenantId: metadata.tenantId,
    };

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_payments (id, invoice_id, shipment_id, carrier_id, amount, currency, status, payment, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (id) DO UPDATE SET payment = EXCLUDED.payment, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
          [
            entry.id,
            entry.invoiceId,
            entry.shipmentId,
            entry.carrierId,
            entry.amount,
            entry.currency,
            entry.status,
            entry.payment,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_payments");
        await collection.replaceOne(
          { id: entry.id, tenantId: entry.tenantId },
          entry,
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_payments (id, invoice_id, shipment_id, carrier_id, amount, currency, status, payment, created_at, updated_at, created_by, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.invoiceId,
            entry.shipmentId,
            entry.carrierId,
            entry.amount,
            entry.currency,
            entry.status,
            entry.payment,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }
      return entry.id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store payment in database:",
        error,
      );
      this.getTenantPaymentStore(metadata.tenantId).set(id, record);
      return id;
    }
  }

  async listPayments(options: {
    tenantId: string;
    shipmentId?: string;
    invoiceId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId || tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required to list payments (multi-tenant day 1)",
      );

    if (!this.useDatabase || !this.dbClient) {
      let list = Array.from(this.getTenantPaymentStore(tenantId).values());
      if (options.shipmentId)
        list = list.filter((p: any) => p.shipmentId === options.shipmentId);
      if (options.invoiceId)
        list = list.filter((p: any) => p.invoiceId === options.invoiceId);
      if (options.status)
        list = list.filter((p: any) => p.status === options.status);
      return list.slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;

      if (dbType === "postgresql") {
        let query =
          "SELECT payment FROM transportation_payments WHERE tenant_id = $1";
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.shipmentId) {
          query += ` AND shipment_id = $${idx++}`;
          params.push(options.shipmentId);
        }
        if (options.invoiceId) {
          query += ` AND invoice_id = $${idx++}`;
          params.push(options.invoiceId);
        }
        if (options.status) {
          query += ` AND status = $${idx++}`;
          params.push(options.status);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_payments");
        const filter: any = { tenantId };
        if (options.shipmentId) filter.shipmentId = options.shipmentId;
        if (options.invoiceId) filter.invoiceId = options.invoiceId;
        if (options.status) filter.status = options.status;
        const docs = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ payment: d.payment }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT payment FROM transportation_payments WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.shipmentId) {
          query += " AND shipment_id = ?";
          params.push(options.shipmentId);
        }
        if (options.invoiceId) {
          query += " AND invoice_id = ?";
          params.push(options.invoiceId);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }

      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.payment === "string"
            ? JSON.parse(row.payment)
            : row.payment) as Record<string, unknown>,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list payments from database:",
        error,
      );
      return [];
    }
  }

  // ========================================================================
  // INSURANCE (tenant-scoped; stored as JSON)
  // ========================================================================

  private inMemoryInsurancePolicies = new Map<
    string,
    Map<string, Record<string, unknown>>
  >();
  private inMemoryInsuranceClaims = new Map<
    string,
    Map<string, Record<string, unknown>>
  >();

  private getTenantInsurancePolicyStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryInsurancePolicies.has(tenantId))
      this.inMemoryInsurancePolicies.set(tenantId, new Map());
    return this.inMemoryInsurancePolicies.get(tenantId)!;
  }

  private getTenantInsuranceClaimStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryInsuranceClaims.has(tenantId))
      this.inMemoryInsuranceClaims.set(tenantId, new Map());
    return this.inMemoryInsuranceClaims.get(tenantId)!;
  }

  async storeInsurancePolicy(
    policy: Record<string, unknown> & { id?: string },
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for insurance policy persistence (multi-tenant day 1)",
      );
    const id = String(
      (policy as any).id ||
        `INS-POL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    );
    const record = { ...policy, id };

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantInsurancePolicyStore(metadata.tenantId).set(id, record);
      return id;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      const policyData = JSON.stringify(record);
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_insurance_policies (id, "policyNumber", "shipmentId", "shipmentNumber", provider, "providerId", "coverageAmount", premium, currency, "effectiveDate", "expiryDate", status, "coverageType", deductible, policy, "createdAt", "updatedAt", "createdBy", "tenantId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           ON CONFLICT (id) DO UPDATE SET policy = EXCLUDED.policy, status = EXCLUDED.status, "updatedAt" = EXCLUDED."updatedAt"`,
          [
            id,
            (policy as any).policyNumber,
            (policy as any).shipmentId,
            (policy as any).shipmentNumber,
            (policy as any).provider,
            (policy as any).providerId,
            (policy as any).coverageAmount,
            (policy as any).premium,
            (policy as any).currency,
            (policy as any).effectiveDate,
            (policy as any).expiryDate,
            (policy as any).status,
            (policy as any).coverageType,
            (policy as any).deductible,
            policyData,
            new Date(),
            new Date(),
            metadata.createdBy,
            metadata.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_insurance_policies");
        await collection.replaceOne(
          { id, tenantId: metadata.tenantId },
          {
            ...record,
            tenantId: metadata.tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: metadata.createdBy,
          },
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_insurance_policies (id, "policyNumber", "shipmentId", "shipmentNumber", provider, "providerId", "coverageAmount", premium, currency, "effectiveDate", "expiryDate", status, "coverageType", deductible, policy, "createdAt", "updatedAt", "createdBy", "tenantId")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            (policy as any).policyNumber,
            (policy as any).shipmentId,
            (policy as any).shipmentNumber,
            (policy as any).provider,
            (policy as any).providerId,
            (policy as any).coverageAmount,
            (policy as any).premium,
            (policy as any).currency,
            (policy as any).effectiveDate,
            (policy as any).expiryDate,
            (policy as any).status,
            (policy as any).coverageType,
            (policy as any).deductible,
            policyData,
            new Date().toISOString(),
            new Date().toISOString(),
            metadata.createdBy,
            metadata.tenantId,
          ],
        );
      }
      return id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store insurance policy in database:",
        error,
      );
      this.getTenantInsurancePolicyStore(metadata.tenantId).set(id, record);
      return id;
    }
  }

  async storeInsuranceClaim(
    claim: Record<string, unknown> & { id?: string },
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for insurance claim persistence (multi-tenant day 1)",
      );
    const id = String(
      (claim as any).id ||
        `INS-CLM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    );
    const record = { ...claim, id };

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantInsuranceClaimStore(metadata.tenantId).set(id, record);
      return id;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      const claimData = JSON.stringify(record);
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_insurance_claims (id, "claimNumber", "policyId", "policyNumber", amount, currency, description, "incidentDate", status, documents, notes, "reviewedBy", "reviewedAt", claim, "createdAt", "updatedAt", "createdBy", "tenantId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO UPDATE SET claim = EXCLUDED.claim, status = EXCLUDED.status, "updatedAt" = EXCLUDED."updatedAt"`,
          [
            id,
            (claim as any).claimNumber,
            (claim as any).policyId,
            (claim as any).policyNumber,
            (claim as any).amount,
            (claim as any).currency,
            (claim as any).description,
            (claim as any).incidentDate,
            (claim as any).status,
            JSON.stringify((claim as any).documents || []),
            (claim as any).notes,
            (claim as any).reviewedBy,
            (claim as any).reviewedAt,
            claimData,
            new Date(),
            new Date(),
            metadata.createdBy,
            metadata.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_insurance_claims");
        await collection.replaceOne(
          { id, tenantId: metadata.tenantId },
          {
            ...record,
            tenantId: metadata.tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: metadata.createdBy,
          },
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_insurance_claims (id, "claimNumber", "policyId", "policyNumber", amount, currency, description, "incidentDate", status, documents, notes, "reviewedBy", "reviewedAt", claim, "createdAt", "updatedAt", "createdBy", "tenantId")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            (claim as any).claimNumber,
            (claim as any).policyId,
            (claim as any).policyNumber,
            (claim as any).amount,
            (claim as any).currency,
            (claim as any).description,
            (claim as any).incidentDate,
            (claim as any).status,
            JSON.stringify((claim as any).documents || []),
            (claim as any).notes,
            (claim as any).reviewedBy,
            (claim as any).reviewedAt,
            claimData,
            new Date().toISOString(),
            new Date().toISOString(),
            metadata.createdBy,
            metadata.tenantId,
          ],
        );
      }
      return id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store insurance claim in database:",
        error,
      );
      this.getTenantInsuranceClaimStore(metadata.tenantId).set(id, record);
      return id;
    }
  }

  // ========================================================================
  // PORTS (tenant-scoped; stored as JSON)
  // ========================================================================

  private inMemoryPorts = new Map<
    string,
    Map<string, Record<string, unknown>>
  >();

  private getTenantPortStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryPorts.has(tenantId))
      this.inMemoryPorts.set(tenantId, new Map());
    return this.inMemoryPorts.get(tenantId)!;
  }

  async storePort(
    port: Record<string, unknown> & { id?: string },
    metadata: { tenantId: string; createdBy: string },
  ): Promise<string> {
    await this.ensureInitialized();
    if (!metadata.tenantId || metadata.tenantId.trim().length === 0)
      throw new Error(
        "tenantId is required for port persistence (multi-tenant day 1)",
      );
    const id = String(
      (port as any).id ||
        `PORT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    );
    const record = { ...port, id };

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantPortStore(metadata.tenantId).set(id, record);
      return id;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      const portData = JSON.stringify(record);
      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_ports (id, code, name, country, type, status, "currentShipments", containers, "utilizationRate", location, "operatingHours", capacity, port, "createdAt", "updatedAt", "createdBy", "tenantId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO UPDATE SET port = EXCLUDED.port, status = EXCLUDED.status, "currentShipments" = EXCLUDED."currentShipments", containers = EXCLUDED.containers, "utilizationRate" = EXCLUDED."utilizationRate", "updatedAt" = EXCLUDED."updatedAt"`,
          [
            id,
            (port as any).code,
            (port as any).name,
            (port as any).country,
            (port as any).type,
            (port as any).status,
            (port as any).currentShipments || 0,
            (port as any).containers || 0,
            (port as any).utilizationRate,
            JSON.stringify((port as any).location || {}),
            JSON.stringify((port as any).operatingHours || {}),
            JSON.stringify((port as any).capacity || {}),
            portData,
            new Date(),
            new Date(),
            metadata.createdBy,
            metadata.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_ports");
        await collection.replaceOne(
          { id, tenantId: metadata.tenantId },
          {
            ...record,
            tenantId: metadata.tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: metadata.createdBy,
          },
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_ports (id, code, name, country, type, status, "currentShipments", containers, "utilizationRate", location, "operatingHours", capacity, port, "createdAt", "updatedAt", "createdBy", "tenantId")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            (port as any).code,
            (port as any).name,
            (port as any).country,
            (port as any).type,
            (port as any).status,
            (port as any).currentShipments || 0,
            (port as any).containers || 0,
            (port as any).utilizationRate,
            JSON.stringify((port as any).location || {}),
            JSON.stringify((port as any).operatingHours || {}),
            JSON.stringify((port as any).capacity || {}),
            portData,
            new Date().toISOString(),
            new Date().toISOString(),
            metadata.createdBy,
            metadata.tenantId,
          ],
        );
      }
      return id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store port in database:",
        error,
      );
      this.getTenantPortStore(metadata.tenantId).set(id, record);
      return id;
    }
  }

  // ========================================================================
  // INCIDENTS (Control Tower / Operations)
  // ========================================================================

  private getTenantIncidentStore(
    tenantId: string,
  ): Map<string, Record<string, unknown>> {
    if (!this.inMemoryIncidents.has(tenantId))
      this.inMemoryIncidents.set(tenantId, new Map());
    return this.inMemoryIncidents.get(tenantId)!;
  }

  async storeIncident(
    incident: Record<string, unknown> & { id?: string },
    metadata: {
      tenantId: string;
      createdBy: string;
      riskId?: string;
      status?: string;
      severity?: string;
      priority?: string;
    },
  ): Promise<string> {
    await this.ensureInitialized();
    const { tenantId } = metadata;
    if (!tenantId) throw new Error("tenantId is required");

    const id = String(
      incident.id ||
        `incident-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    );
    const status = String(
      metadata.status || (incident as any).status || "OPEN",
    );
    const severity = String(
      metadata.severity || (incident as any).severity || "MEDIUM",
    );
    const priority = String(
      metadata.priority || (incident as any).priority || "P3",
    );
    const riskId = metadata.riskId || (incident as any).riskId;

    if (!this.useDatabase || !this.dbClient) {
      this.getTenantIncidentStore(tenantId).set(id, {
        ...incident,
        id,
        riskId,
        status,
        severity,
        priority,
        createdBy: metadata.createdBy,
      });
      return id;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      const now = new Date();
      const entry: TransportationIncidentDatabaseEntry = {
        id,
        riskId,
        status,
        severity,
        priority,
        incident: JSON.stringify({
          ...incident,
          id,
          riskId,
          status,
          severity,
          priority,
        }),
        createdAt: now,
        updatedAt: now,
        createdBy: metadata.createdBy,
        tenantId,
      };

      if (dbType === "postgresql") {
        await this.dbClient.query(
          `INSERT INTO transportation_incidents (id, risk_id, status, severity, priority, incident, created_at, updated_at, created_by, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET
             risk_id=EXCLUDED.risk_id,
             status=EXCLUDED.status,
             severity=EXCLUDED.severity,
             priority=EXCLUDED.priority,
             incident=EXCLUDED.incident,
             updated_at=EXCLUDED.updated_at`,
          [
            entry.id,
            entry.riskId || null,
            entry.status || null,
            entry.severity || null,
            entry.priority || null,
            entry.incident,
            entry.createdAt,
            entry.updatedAt,
            entry.createdBy,
            entry.tenantId,
          ],
        );
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_incidents");
        await collection.updateOne(
          { tenantId, id },
          { $set: { ...entry, incident: JSON.parse(entry.incident) } },
          { upsert: true },
        );
      } else if (dbType === "sqlite") {
        await this.dbClient.query(
          `INSERT OR REPLACE INTO transportation_incidents (id, risk_id, status, severity, priority, incident, created_at, updated_at, created_by, tenant_id)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            entry.id,
            entry.riskId || null,
            entry.status || null,
            entry.severity || null,
            entry.priority || null,
            entry.incident,
            entry.createdAt.toISOString(),
            entry.updatedAt.toISOString(),
            entry.createdBy,
            entry.tenantId,
          ],
        );
      }

      return id;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to store incident in database:",
        error,
      );
      this.getTenantIncidentStore(tenantId).set(id, {
        ...incident,
        id,
        riskId,
        status,
        severity,
        priority,
        createdBy: metadata.createdBy,
      });
      return id;
    }
  }

  async getIncident(options: {
    tenantId: string;
    id: string;
  }): Promise<Record<string, unknown> | null> {
    await this.ensureInitialized();
    const { tenantId, id } = options;
    if (!tenantId) throw new Error("tenantId is required");
    if (!id) throw new Error("id is required");

    if (!this.useDatabase || !this.dbClient) {
      return this.getTenantIncidentStore(tenantId).get(id) || null;
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      if (dbType === "postgresql") {
        const result = await this.dbClient.query(
          "SELECT incident FROM transportation_incidents WHERE tenant_id = $1 AND id = $2 LIMIT 1",
          [tenantId, id],
        );
        const row = Array.isArray(result) ? result[0] : undefined;
        if (!row) return null;
        return (
          typeof row.incident === "string"
            ? JSON.parse(row.incident)
            : row.incident
        ) as Record<string, unknown>;
      }
      if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_incidents");
        const doc = await collection.findOne({ tenantId, id });
        return doc?.incident
          ? (doc.incident as Record<string, unknown>)
          : (doc as any) || null;
      }
      if (dbType === "sqlite") {
        const result = await this.dbClient.query(
          "SELECT incident FROM transportation_incidents WHERE tenant_id = ? AND id = ? LIMIT 1",
          [tenantId, id],
        );
        const row = Array.isArray(result) ? result[0] : undefined;
        if (!row) return null;
        return (
          typeof row.incident === "string"
            ? JSON.parse(row.incident)
            : row.incident
        ) as Record<string, unknown>;
      }
      return null;
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to get incident from database:",
        error,
      );
      return null;
    }
  }

  async listIncidents(options: {
    tenantId: string;
    status?: string;
    severity?: string;
    riskId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    await this.ensureInitialized();
    const { tenantId } = options;
    if (!tenantId) throw new Error("tenantId is required");

    if (!this.useDatabase || !this.dbClient) {
      let list = Array.from(this.getTenantIncidentStore(tenantId).values());
      if (options.status)
        list = list.filter((i: any) => i.status === options.status);
      if (options.severity)
        list = list.filter((i: any) => i.severity === options.severity);
      if (options.riskId)
        list = list.filter((i: any) => i.riskId === options.riskId);
      return list.slice(0, options.limit || 200);
    }

    try {
      const dbType = process.env.DATABASE_TYPE || "postgresql";
      let result: any;
      if (dbType === "postgresql") {
        let query =
          "SELECT incident FROM transportation_incidents WHERE tenant_id = $1";
        const params: any[] = [tenantId];
        let idx = 2;
        if (options.status) {
          query += ` AND status = $${idx++}`;
          params.push(options.status);
        }
        if (options.severity) {
          query += ` AND severity = $${idx++}`;
          params.push(options.severity);
        }
        if (options.riskId) {
          query += ` AND risk_id = $${idx++}`;
          params.push(options.riskId);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      } else if (dbType === "mongodb") {
        const collection = (this.dbClient as any)
          .db()
          .collection("transportation_incidents");
        const filter: any = { tenantId };
        if (options.status) filter.status = options.status;
        if (options.severity) filter.severity = options.severity;
        if (options.riskId) filter.riskId = options.riskId;
        const docs = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(options.limit || 200)
          .skip(options.offset || 0)
          .toArray();
        result = docs.map((d: any) => ({ incident: d.incident || d }));
      } else if (dbType === "sqlite") {
        let query =
          "SELECT incident FROM transportation_incidents WHERE tenant_id = ?";
        const params: any[] = [tenantId];
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        if (options.severity) {
          query += " AND severity = ?";
          params.push(options.severity);
        }
        if (options.riskId) {
          query += " AND risk_id = ?";
          params.push(options.riskId);
        }
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(options.limit || 200, options.offset || 0);
        result = await this.dbClient.query(query, params);
      }

      return (Array.isArray(result) ? result : []).map(
        (row: any) =>
          (typeof row.incident === "string"
            ? JSON.parse(row.incident)
            : row.incident) as Record<string, unknown>,
      );
    } catch (error) {
      console.warn(
        "⚠️ Transportation: Failed to list incidents from database:",
        error,
      );
      return [];
    }
  }

  async updateIncident(options: {
    tenantId: string;
    id: string;
    patch: Record<string, unknown>;
    updatedBy: string;
  }): Promise<Record<string, unknown> | null> {
    const existing = await this.getIncident({
      tenantId: options.tenantId,
      id: options.id,
    });
    if (!existing) return null;
    const updated = {
      ...existing,
      ...options.patch,
      id: options.id,
      updatedAt: new Date().toISOString(),
      updatedBy: options.updatedBy,
    };
    await this.storeIncident(updated, {
      tenantId: options.tenantId,
      createdBy: String((existing as any).createdBy || options.updatedBy),
      riskId: String((updated as any).riskId || ""),
      status: String((updated as any).status || ""),
      severity: String((updated as any).severity || ""),
      priority: String((updated as any).priority || ""),
    });
    return updated;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let transportationDatabaseAdapter: TransportationDatabaseAdapter | null = null;

export function getTransportationDatabaseAdapter(): TransportationDatabaseAdapter {
  if (!transportationDatabaseAdapter) {
    transportationDatabaseAdapter = new TransportationDatabaseAdapter();
  }
  return transportationDatabaseAdapter;
}

export const transportationDatabaseAdapterInstance =
  getTransportationDatabaseAdapter();
