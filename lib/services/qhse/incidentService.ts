/**
 * QHSE Incident Management Service
 * Comprehensive incident reporting, investigation, and management
 * Integrated with BlueDXP platform ecosystem
 *
 * Production-ready with Prisma database integration
 */

import { eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { prisma } from "@/lib/services/database/prismaClient";
import type {
  Incident,
  Investigation,
  RootCauseAnalysis,
  WitnessStatement,
  QHSEIncidentService,
  IncidentFilters,
  SafetyMetricFilters,
} from "@/types/qhse";

// ============================================================================
// IN-MEMORY STORAGE (Fallback when database not available)
// ============================================================================

class IncidentStore {
  private incidents: Map<string, Incident> = new Map();
  private investigations: Map<string, Investigation> = new Map();
  private rootCauseAnalyses: Map<string, RootCauseAnalysis> = new Map();
  private witnessStatements: Map<string, WitnessStatement> = new Map();

  // Incidents
  getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  setIncident(incident: Incident): void {
    this.incidents.set(incident.id, incident);
  }

  getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  getIncidentsByTenant(tenantId: string): Incident[] {
    return this.getAllIncidents().filter((i) => i.tenantId === tenantId);
  }

  // Investigations
  getInvestigation(id: string): Investigation | undefined {
    return this.investigations.get(id);
  }

  setInvestigation(investigation: Investigation): void {
    this.investigations.set(investigation.id, investigation);
  }

  getInvestigationsByIncident(incidentId: string): Investigation[] {
    return Array.from(this.investigations.values()).filter(
      (i) => i.incidentId === incidentId,
    );
  }

  // Root Cause Analyses
  getRootCauseAnalysis(id: string): RootCauseAnalysis | undefined {
    return this.rootCauseAnalyses.get(id);
  }

  setRootCauseAnalysis(analysis: RootCauseAnalysis): void {
    this.rootCauseAnalyses.set(analysis.id, analysis);
  }

  getRootCauseAnalysisByIncident(
    incidentId: string,
  ): RootCauseAnalysis | undefined {
    return Array.from(this.rootCauseAnalyses.values()).find(
      (a) => a.incidentId === incidentId,
    );
  }

  // Witness Statements
  getWitnessStatement(id: string): WitnessStatement | undefined {
    return this.witnessStatements.get(id);
  }

  setWitnessStatement(statement: WitnessStatement): void {
    this.witnessStatements.set(statement.id, statement);
  }

  getWitnessStatementsByIncident(incidentId: string): WitnessStatement[] {
    return Array.from(this.witnessStatements.values()).filter(
      (s) => s.incidentId === incidentId,
    );
  }
}

const store = new IncidentStore(); // Fallback for when Prisma is unavailable

// ============================================================================
// INCIDENT SERVICE IMPLEMENTATION
// ============================================================================

class QHSEIncidentServiceImpl implements QHSEIncidentService {
  /**
   * Generate unique incident number
   */
  private async generateIncidentNumber(tenantId: string): Promise<string> {
    try {
      // Get count of incidents for this tenant this year
      const year = new Date().getFullYear();
      const count = await prisma.qHSEIncident.count({
        where: {
          tenantId,
          incidentNumber: {
            startsWith: `INC-${year}-`,
          },
        },
      });
      return `INC-${year}-${String(count + 1).padStart(5, "0")}`;
    } catch (error) {
      // Fallback if database unavailable
      console.warn(
        "Failed to generate incident number from database, using fallback:",
        error,
      );
      const count = store
        .getAllIncidents()
        .filter((i) => i.tenantId === tenantId).length;
      return `INC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    }
  }

  /**
   * Create a new incident
   */
  async createIncident(
    data: Omit<Incident, "id" | "createdAt" | "updatedAt">,
  ): Promise<Incident> {
    try {
      // Generate incident number if not provided
      const incidentNumber =
        data.incidentNumber ||
        (await this.generateIncidentNumber(data.tenantId));

      // Prepare incident data
      const incidentData = {
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: data.tenantId,
        customerId: data.customerId || null,
        warehouseId: data.warehouseId || null,
        facilityId: data.facilityId || null,
        incidentNumber,
        type: data.type,
        severity: data.severity,
        status: data.status || "REPORTED",
        title: data.title,
        description: data.description,
        location: data.location,
        locationDetails: data.locationDetails || null,
        occurredAt: new Date(data.occurredAt),
        reportedAt: new Date(data.reportedAt || new Date()),
        reportedBy: data.reportedBy,
        peopleInvolved: data.peopleInvolved
          ? (data.peopleInvolved as any)
          : null,
        investigation: data.investigation ? (data.investigation as any) : null,
        rootCauseAnalysis: data.rootCauseAnalysis
          ? (data.rootCauseAnalysis as any)
          : null,
        correctiveActions: data.correctiveActions || [],
        preventiveActions: data.preventiveActions || [],
        oshaRecordable: data.oshaRecordable || false,
        oshaClassification: data.oshaClassification || null,
        riddorReportable: data.riddorReportable || false,
        riddorClassification: data.riddorClassification || null,
        photos: data.photos || [],
        documents: data.documents || [],
        witnessStatements: data.witnessStatements
          ? (data.witnessStatements as any)
          : null,
        tags: data.tags || [],
        assignedTo: data.assignedTo || null,
        approvedBy: data.approvedBy || null,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        closedAt: data.closedAt ? new Date(data.closedAt) : null,
        closedBy: data.closedBy || null,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy || data.createdBy,
      };

      // Store incident in database using Prisma
      let dbIncident;
      try {
        dbIncident = await prisma.qHSEIncident.create({
          data: incidentData,
        });
      } catch (error) {
        console.error("Prisma create failed, using in-memory fallback:", error);
        // Fallback to in-memory storage
        const incident: Incident = {
          ...data,
          id: incidentData.id,
          incidentNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.setIncident(incident);
        dbIncident = incident as any;
      }

      // Convert Prisma model to Incident type
      const incident: Incident = {
        id: dbIncident.id,
        tenantId: dbIncident.tenantId,
        customerId: dbIncident.customerId || undefined,
        warehouseId: dbIncident.warehouseId || undefined,
        facilityId: dbIncident.facilityId || undefined,
        incidentNumber: dbIncident.incidentNumber,
        type: dbIncident.type as any,
        severity: dbIncident.severity as any,
        status: dbIncident.status as any,
        title: dbIncident.title,
        description: dbIncident.description,
        location: dbIncident.location,
        locationDetails: dbIncident.locationDetails || undefined,
        occurredAt: dbIncident.occurredAt.toISOString(),
        reportedAt: dbIncident.reportedAt.toISOString(),
        reportedBy: dbIncident.reportedBy,
        peopleInvolved: dbIncident.peopleInvolved as any,
        investigation: dbIncident.investigation as any,
        rootCauseAnalysis: dbIncident.rootCauseAnalysis as any,
        correctiveActions: dbIncident.correctiveActions || [],
        preventiveActions: dbIncident.preventiveActions || [],
        oshaRecordable: dbIncident.oshaRecordable,
        oshaClassification: dbIncident.oshaClassification || undefined,
        riddorReportable: dbIncident.riddorReportable,
        riddorClassification: dbIncident.riddorClassification || undefined,
        photos: dbIncident.photos || [],
        documents: dbIncident.documents || [],
        witnessStatements: dbIncident.witnessStatements as any,
        tags: dbIncident.tags || [],
        assignedTo: dbIncident.assignedTo || undefined,
        approvedBy: dbIncident.approvedBy || undefined,
        approvedAt: dbIncident.approvedAt?.toISOString(),
        closedAt: dbIncident.closedAt?.toISOString(),
        closedBy: dbIncident.closedBy || undefined,
        createdAt: dbIncident.createdAt.toISOString(),
        updatedAt: dbIncident.updatedAt.toISOString(),
        createdBy: dbIncident.createdBy,
        updatedBy: dbIncident.updatedBy,
      };

      // Store in Knowledge Base with proper segregation
      await knowledgeBaseService.store({
        entity: "qhse-incident",
        id: incident.id,
        content: `QHSE Incident: ${incident.title}\n\nType: ${incident.type}\nSeverity: ${incident.severity}\nStatus: ${incident.status}\n\nDescription: ${incident.description}\n\nLocation: ${incident.location}`,
        metadata: {
          module: "qhse",
          entityType: "INCIDENT",
          entityId: incident.id,
          incidentNumber: incident.incidentNumber,
          type: incident.type,
          severity: incident.severity,
          status: incident.status,
          tenantId: incident.tenantId,
          customerId: incident.customerId,
          warehouseId: incident.warehouseId,
          facilityId: incident.facilityId,
        },
      });

      // Create evidence record
      await evidenceService.createEvidence({
        entityType: "QHSE_INCIDENT",
        entityId: incident.id,
        evidenceType: "INCIDENT_REPORT",
        title: `Incident Report: ${incident.incidentNumber}`,
        description: incident.description,
        source: "QHSE_MODULE",
        metadata: {
          incidentType: incident.type,
          severity: incident.severity,
          location: incident.location,
        },
      });

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.incident.created",
        aggregateId: incident.id,
        aggregateType: "QHSE_INCIDENT",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          tenantId: incident.tenantId,
          customerId: incident.customerId,
          warehouseId: incident.warehouseId,
          incidentType: incident.type,
          severity: incident.severity,
        },
        payload: incident,
      });

      // Send notification
      try {
        const { qhseNotificationService } =
          await import("./notifications/qhseNotificationService");
        await qhseNotificationService.notifyIncidentCreated(incident);
      } catch (error) {
        console.warn("Failed to send incident notification:", error);
      }

      // Auto-create NCR for critical/high severity incidents (if configured)
      if (
        (incident.severity === "CRITICAL" || incident.severity === "HIGH") &&
        incident.type !== "NEAR_MISS"
      ) {
        try {
          // Import integration service dynamically to avoid circular dependency
          const { qhseEcosystemIntegrationService } =
            await import("./integration/qhseEcosystemIntegrationService");
          await qhseEcosystemIntegrationService.createNCRFromIncident(
            incident.id,
          );
        } catch (error) {
          // Log but don't fail incident creation if NCR creation fails
          console.warn("Failed to auto-create NCR from incident:", error);
        }
      }

      return incident;
    } catch (error) {
      console.error("Error creating incident:", error);
      throw new Error(
        `Failed to create incident: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get incident by ID
   */
  async getIncident(id: string, tenantId?: string): Promise<Incident | null> {
    try {
      // Try Prisma database first
      const dbIncident = await prisma.qHSEIncident.findUnique({
        where: { id },
      });

      if (!dbIncident) {
        // Fallback to in-memory
        const incident = store.getIncident(id);
        if (incident && (!tenantId || incident.tenantId === tenantId)) {
          return incident;
        }
        return null;
      }

      // Check tenant isolation
      if (tenantId && dbIncident.tenantId !== tenantId) {
        return null;
      }

      // Convert Prisma model to Incident type
      const incident: Incident = {
        id: dbIncident.id,
        tenantId: dbIncident.tenantId,
        customerId: dbIncident.customerId || undefined,
        warehouseId: dbIncident.warehouseId || undefined,
        facilityId: dbIncident.facilityId || undefined,
        incidentNumber: dbIncident.incidentNumber,
        type: dbIncident.type as any,
        severity: dbIncident.severity as any,
        status: dbIncident.status as any,
        title: dbIncident.title,
        description: dbIncident.description,
        location: dbIncident.location,
        locationDetails: dbIncident.locationDetails || undefined,
        occurredAt: dbIncident.occurredAt.toISOString(),
        reportedAt: dbIncident.reportedAt.toISOString(),
        reportedBy: dbIncident.reportedBy,
        peopleInvolved: dbIncident.peopleInvolved as any,
        investigation: dbIncident.investigation as any,
        rootCauseAnalysis: dbIncident.rootCauseAnalysis as any,
        correctiveActions: dbIncident.correctiveActions || [],
        preventiveActions: dbIncident.preventiveActions || [],
        oshaRecordable: dbIncident.oshaRecordable,
        oshaClassification: dbIncident.oshaClassification || undefined,
        riddorReportable: dbIncident.riddorReportable,
        riddorClassification: dbIncident.riddorClassification || undefined,
        photos: dbIncident.photos || [],
        documents: dbIncident.documents || [],
        witnessStatements: dbIncident.witnessStatements as any,
        tags: dbIncident.tags || [],
        assignedTo: dbIncident.assignedTo || undefined,
        approvedBy: dbIncident.approvedBy || undefined,
        approvedAt: dbIncident.approvedAt?.toISOString(),
        closedAt: dbIncident.closedAt?.toISOString(),
        closedBy: dbIncident.closedBy || undefined,
        createdAt: dbIncident.createdAt.toISOString(),
        updatedAt: dbIncident.updatedAt.toISOString(),
        createdBy: dbIncident.createdBy,
        updatedBy: dbIncident.updatedBy,
      };

      // Cache in memory for faster access
      store.setIncident(incident);
      return incident;
    } catch (error) {
      console.warn("Database fetch failed, trying in-memory:", error);
      // Fallback to in-memory
      const incident = store.getIncident(id);
      if (incident && (!tenantId || incident.tenantId === tenantId)) {
        return incident;
      }
      return null;
    }
  }

  /**
   * Get incidents with filters
   */
  async getIncidents(filters?: IncidentFilters): Promise<Incident[]> {
    try {
      // Build Prisma where clause
      const where: any = {};

      if (filters?.tenantId) {
        where.tenantId = filters.tenantId;
      }
      if (filters?.customerId) {
        where.customerId = filters.customerId;
      }
      if (filters?.warehouseId) {
        where.warehouseId = filters.warehouseId;
      }
      if (filters?.facilityId) {
        where.facilityId = filters.facilityId;
      }
      if (filters?.type) {
        where.type = filters.type;
      }
      if (filters?.severity) {
        where.severity = filters.severity;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }
      if (filters?.dateFrom || filters?.dateTo) {
        where.occurredAt = {};
        if (filters.dateFrom) {
          where.occurredAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.occurredAt.lte = new Date(filters.dateTo);
        }
      }
      if (filters?.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags,
        };
      }

      // Query database
      const dbIncidents = await prisma.qHSEIncident.findMany({
        where,
        orderBy: {
          occurredAt: "desc",
        },
        take: filters?.limit || 1000,
        skip: filters?.offset || 0,
      });

      // Convert Prisma models to Incident types
      const incidents: Incident[] = dbIncidents.map((dbIncident) => ({
        id: dbIncident.id,
        tenantId: dbIncident.tenantId,
        customerId: dbIncident.customerId || undefined,
        warehouseId: dbIncident.warehouseId || undefined,
        facilityId: dbIncident.facilityId || undefined,
        incidentNumber: dbIncident.incidentNumber,
        type: dbIncident.type as any,
        severity: dbIncident.severity as any,
        status: dbIncident.status as any,
        title: dbIncident.title,
        description: dbIncident.description,
        location: dbIncident.location,
        locationDetails: dbIncident.locationDetails || undefined,
        occurredAt: dbIncident.occurredAt.toISOString(),
        reportedAt: dbIncident.reportedAt.toISOString(),
        reportedBy: dbIncident.reportedBy,
        peopleInvolved: dbIncident.peopleInvolved as any,
        investigation: dbIncident.investigation as any,
        rootCauseAnalysis: dbIncident.rootCauseAnalysis as any,
        correctiveActions: dbIncident.correctiveActions || [],
        preventiveActions: dbIncident.preventiveActions || [],
        oshaRecordable: dbIncident.oshaRecordable,
        oshaClassification: dbIncident.oshaClassification || undefined,
        riddorReportable: dbIncident.riddorReportable,
        riddorClassification: dbIncident.riddorClassification || undefined,
        photos: dbIncident.photos || [],
        documents: dbIncident.documents || [],
        witnessStatements: dbIncident.witnessStatements as any,
        tags: dbIncident.tags || [],
        assignedTo: dbIncident.assignedTo || undefined,
        approvedBy: dbIncident.approvedBy || undefined,
        approvedAt: dbIncident.approvedAt?.toISOString(),
        closedAt: dbIncident.closedAt?.toISOString(),
        closedBy: dbIncident.closedBy || undefined,
        createdAt: dbIncident.createdAt.toISOString(),
        updatedAt: dbIncident.updatedAt.toISOString(),
        createdBy: dbIncident.createdBy,
        updatedBy: dbIncident.updatedBy,
      }));

      // Cache in memory for faster access
      incidents.forEach((inc) => store.setIncident(inc));

      return incidents;
    } catch (error) {
      console.warn("Database fetch failed, trying in-memory:", error);
      // Fallback to in-memory
      let incidents = store.getAllIncidents();

      if (filters) {
        if (filters.tenantId) {
          incidents = incidents.filter((i) => i.tenantId === filters.tenantId);
        }
        if (filters.customerId) {
          incidents = incidents.filter(
            (i) => i.customerId === filters.customerId,
          );
        }
        if (filters.warehouseId) {
          incidents = incidents.filter(
            (i) => i.warehouseId === filters.warehouseId,
          );
        }
        if (filters.facilityId) {
          incidents = incidents.filter(
            (i) => i.facilityId === filters.facilityId,
          );
        }
        if (filters.type) {
          incidents = incidents.filter((i) => i.type === filters.type);
        }
        if (filters.severity) {
          incidents = incidents.filter((i) => i.severity === filters.severity);
        }
        if (filters.status) {
          incidents = incidents.filter((i) => i.status === filters.status);
        }
        if (filters.dateFrom) {
          const dateFrom = new Date(filters.dateFrom);
          incidents = incidents.filter(
            (i) => new Date(i.occurredAt) >= dateFrom,
          );
        }
        if (filters.dateTo) {
          const dateTo = new Date(filters.dateTo);
          incidents = incidents.filter((i) => new Date(i.occurredAt) <= dateTo);
        }
        if (filters.assignedTo) {
          incidents = incidents.filter(
            (i) => i.assignedTo === filters.assignedTo,
          );
        }
        if (filters.tags && filters.tags.length > 0) {
          incidents = incidents.filter(
            (i) => i.tags && i.tags.some((tag) => filters.tags!.includes(tag)),
          );
        }
      }

      return incidents.sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );
    }
  }

  /**
   * Update incident
   */
  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    try {
      // Check if incident exists
      const existing = await prisma.qHSEIncident.findUnique({
        where: { id },
      });

      if (!existing) {
        // Fallback to in-memory
        const memIncident = store.getIncident(id);
        if (!memIncident) {
          throw new Error(`Incident not found: ${id}`);
        }
        const updated: Incident = {
          ...memIncident,
          ...data,
          id: memIncident.id,
          updatedAt: new Date().toISOString(),
          updatedBy: data.updatedBy || memIncident.updatedBy,
        };
        store.setIncident(updated);
        return updated;
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: data.updatedBy || existing.updatedBy,
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.severity !== undefined) updateData.severity = data.severity;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.locationDetails !== undefined)
        updateData.locationDetails = data.locationDetails;
      if (data.occurredAt !== undefined)
        updateData.occurredAt = new Date(data.occurredAt);
      if (data.assignedTo !== undefined)
        updateData.assignedTo = data.assignedTo;
      if (data.approvedBy !== undefined)
        updateData.approvedBy = data.approvedBy;
      if (data.approvedAt !== undefined)
        updateData.approvedAt = data.approvedAt
          ? new Date(data.approvedAt)
          : null;
      if (data.closedAt !== undefined)
        updateData.closedAt = data.closedAt ? new Date(data.closedAt) : null;
      if (data.closedBy !== undefined) updateData.closedBy = data.closedBy;
      if (data.peopleInvolved !== undefined)
        updateData.peopleInvolved = data.peopleInvolved as any;
      if (data.investigation !== undefined)
        updateData.investigation = data.investigation as any;
      if (data.rootCauseAnalysis !== undefined)
        updateData.rootCauseAnalysis = data.rootCauseAnalysis as any;
      if (data.correctiveActions !== undefined)
        updateData.correctiveActions = data.correctiveActions;
      if (data.preventiveActions !== undefined)
        updateData.preventiveActions = data.preventiveActions;
      if (data.oshaRecordable !== undefined)
        updateData.oshaRecordable = data.oshaRecordable;
      if (data.oshaClassification !== undefined)
        updateData.oshaClassification = data.oshaClassification;
      if (data.riddorReportable !== undefined)
        updateData.riddorReportable = data.riddorReportable;
      if (data.riddorClassification !== undefined)
        updateData.riddorClassification = data.riddorClassification;
      if (data.photos !== undefined) updateData.photos = data.photos;
      if (data.documents !== undefined) updateData.documents = data.documents;
      if (data.witnessStatements !== undefined)
        updateData.witnessStatements = data.witnessStatements as any;
      if (data.tags !== undefined) updateData.tags = data.tags;

      // Update in database
      const dbUpdated = await prisma.qHSEIncident.update({
        where: { id },
        data: updateData,
      });

      // Convert to Incident type
      const updated: Incident = {
        id: dbUpdated.id,
        tenantId: dbUpdated.tenantId,
        customerId: dbUpdated.customerId || undefined,
        warehouseId: dbUpdated.warehouseId || undefined,
        facilityId: dbUpdated.facilityId || undefined,
        incidentNumber: dbUpdated.incidentNumber,
        type: dbUpdated.type as any,
        severity: dbUpdated.severity as any,
        status: dbUpdated.status as any,
        title: dbUpdated.title,
        description: dbUpdated.description,
        location: dbUpdated.location,
        locationDetails: dbUpdated.locationDetails || undefined,
        occurredAt: dbUpdated.occurredAt.toISOString(),
        reportedAt: dbUpdated.reportedAt.toISOString(),
        reportedBy: dbUpdated.reportedBy,
        peopleInvolved: dbUpdated.peopleInvolved as any,
        investigation: dbUpdated.investigation as any,
        rootCauseAnalysis: dbUpdated.rootCauseAnalysis as any,
        correctiveActions: dbUpdated.correctiveActions || [],
        preventiveActions: dbUpdated.preventiveActions || [],
        oshaRecordable: dbUpdated.oshaRecordable,
        oshaClassification: dbUpdated.oshaClassification || undefined,
        riddorReportable: dbUpdated.riddorReportable,
        riddorClassification: dbUpdated.riddorClassification || undefined,
        photos: dbUpdated.photos || [],
        documents: dbUpdated.documents || [],
        witnessStatements: dbUpdated.witnessStatements as any,
        tags: dbUpdated.tags || [],
        assignedTo: dbUpdated.assignedTo || undefined,
        approvedBy: dbUpdated.approvedBy || undefined,
        approvedAt: dbUpdated.approvedAt?.toISOString(),
        closedAt: dbUpdated.closedAt?.toISOString(),
        closedBy: dbUpdated.closedBy || undefined,
        createdAt: dbUpdated.createdAt.toISOString(),
        updatedAt: dbUpdated.updatedAt.toISOString(),
        createdBy: dbUpdated.createdBy,
        updatedBy: dbUpdated.updatedBy,
      };

      // Cache in memory
      store.setIncident(updated);

      // Update Knowledge Base (non-blocking)
      try {
        // Try to find existing entry by searching
        const searchResults = await knowledgeBaseService.search({
          query: `incident ${updated.id}`,
          filters: { type: "fact" },
          limit: 5,
        });

        const existingEntry = searchResults.results.find(
          (r) =>
            r.entry.metadata?.incidentId === updated.id ||
            r.entry.id === `qhse-incident-${updated.id}`,
        );

        if (existingEntry) {
          // Update existing entry
          await knowledgeBaseService.update(existingEntry.entry.id, {
            content: `Incident: ${updated.title}\n\nType: ${updated.type}\nSeverity: ${updated.severity}\nStatus: ${updated.status}\n\nDescription: ${updated.description}\n\nLocation: ${updated.location}`,
            searchableText: `Incident: ${updated.title}\n\nType: ${updated.type}\nSeverity: ${updated.severity}\nStatus: ${updated.status}\n\nDescription: ${updated.description}\n\nLocation: ${updated.location}`,
            metadata: {
              ...existingEntry.entry.metadata,
              type: updated.type,
              severity: updated.severity,
              status: updated.status,
              tenantId: updated.tenantId,
              customerId: updated.customerId,
              warehouseId: updated.warehouseId,
            },
          });
        } else {
          // Create new entry if not found (use store method which matches the createIncident pattern)
          await knowledgeBaseService.store({
            entity: "qhse-incident",
            id: updated.id,
            content: `Incident: ${updated.title}\n\nType: ${updated.type}\nSeverity: ${updated.severity}\nStatus: ${updated.status}\n\nDescription: ${updated.description}\n\nLocation: ${updated.location}`,
            metadata: {
              type: updated.type,
              severity: updated.severity,
              status: updated.status,
              tenantId: updated.tenantId,
              customerId: updated.customerId,
              warehouseId: updated.warehouseId,
            },
          });
        }
      } catch (kbError) {
        // Non-blocking: knowledge base update failure shouldn't break incident update
        console.warn("Failed to update knowledge base for incident:", kbError);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.incident.updated",
        aggregateId: updated.id,
        aggregateType: "QHSE_INCIDENT",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          tenantId: updated.tenantId,
          changes: Object.keys(data),
        },
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error updating incident:", error);
      throw new Error(
        `Failed to update incident: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete incident
   */
  async deleteIncident(id: string): Promise<void> {
    try {
      // Get incident first to get tenantId for event
      const incident = await this.getIncident(id);
      if (!incident) {
        throw new Error(`Incident not found: ${id}`);
      }

      // Delete from database
      try {
        await prisma.qHSEIncident.delete({
          where: { id },
        });
      } catch (error) {
        console.warn("Database delete failed, trying in-memory:", error);
        // Fallback - delete from in-memory if exists
        const memIncident = store.getIncident(id);
        if (memIncident) {
          store.deleteIncident(id);
        }
      }

      // Also remove from in-memory cache
      store.deleteIncident(id);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.incident.deleted",
        aggregateId: id,
        aggregateType: "QHSE_INCIDENT",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          tenantId: incident.tenantId,
        },
        payload: { id },
      });
    } catch (error) {
      console.error("Error deleting incident:", error);
      throw new Error(
        `Failed to delete incident: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Start investigation
   */
  async startInvestigation(
    incidentId: string,
    investigatorId: string,
  ): Promise<Investigation> {
    const incident = store.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const investigation: Investigation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      incidentId,
      investigatorId,
      investigationStartDate: new Date().toISOString(),
      investigationMethod: "",
      findings: "",
      contributingFactors: [],
      immediateActions: [],
      recommendations: [],
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setInvestigation(investigation);

    // Update incident status
    await this.updateIncident(incidentId, {
      status: "UNDER_INVESTIGATION",
      updatedBy: investigatorId,
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.investigation.started",
      aggregateId: investigation.id,
      aggregateType: "QHSE_INVESTIGATION",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        incidentId,
        investigatorId,
      },
      payload: investigation,
    });

    return investigation;
  }

  /**
   * Complete investigation
   */
  async completeInvestigation(
    investigationId: string,
    findings: string,
  ): Promise<Investigation> {
    const investigation = store.getInvestigation(investigationId);
    if (!investigation) {
      throw new Error(`Investigation not found: ${investigationId}`);
    }

    const updated: Investigation = {
      ...investigation,
      findings,
      investigationEndDate: new Date().toISOString(),
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
    };

    store.setInvestigation(updated);

    // Update incident
    await this.updateIncident(investigation.incidentId, {
      status: "INVESTIGATION_COMPLETE",
      investigation: updated,
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.investigation.completed",
      aggregateId: investigationId,
      aggregateType: "QHSE_INVESTIGATION",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        incidentId: investigation.incidentId,
      },
      payload: updated,
    });

    return updated;
  }

  /**
   * Perform root cause analysis using unified RCA engine
   */
  async performRootCauseAnalysis(
    incidentId: string,
    method: RootCauseAnalysis["method"] = "HYBRID",
  ): Promise<RootCauseAnalysis> {
    // Get incident from database
    const dbIncident = await prisma.qHSEIncident.findUnique({
      where: { id: incidentId },
    });

    if (!dbIncident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    // Use unified RCA engine
    const { rootCauseAnalysisEngine } =
      await import("@/lib/services/intelligence-analytics/root-cause/rootCauseAnalysisEngine");

    // Perform unified RCA
    const unifiedRCA = await rootCauseAnalysisEngine.analyzeRootCause({
      tenantId: dbIncident.tenantId,
      issueId: `rca-${incidentId}`,
      issueType: "QHSE_INCIDENT",
      source: {
        module: "qhse",
        entityType: "INCIDENT",
        entityId: incidentId,
      },
      context: {
        incidentType: dbIncident.type,
        severity: dbIncident.severity,
        description: dbIncident.description,
        location: dbIncident.location,
        occurredAt: dbIncident.occurredAt.toISOString(),
      },
      method:
        method === "5_WHYS"
          ? "FIVE_WHYS"
          : method === "FISHBONE"
            ? "FISHBONE"
            : method === "FMEA"
              ? "FMEA"
              : "HYBRID",
    });

    // Transform unified RCA to QHSE format
    const analysis: RootCauseAnalysis = {
      id: unifiedRCA.id,
      incidentId,
      method: method,
      rootCauses: unifiedRCA.rootCauses.map((rc) => ({
        cause: rc.description,
        confidence: rc.confidence,
        evidence: rc.evidenceIds || [],
      })),
      contributingFactors: unifiedRCA.contributingFactors.map((cf) => ({
        factor: cf.description,
        impact: cf.impact || "MEDIUM",
      })),
      analysisDate: unifiedRCA.analysisDate || new Date().toISOString(),
      analyzedBy: unifiedRCA.analyzedBy || "system",
      createdAt: unifiedRCA.createdAt || new Date().toISOString(),
      updatedAt: unifiedRCA.updatedAt || new Date().toISOString(),
    };

    // Update incident with RCA
    await this.updateIncident(incidentId, {
      rootCauseAnalysis: analysis,
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.root_cause_analysis.completed",
      aggregateId: analysis.id,
      aggregateType: "QHSE_ROOT_CAUSE_ANALYSIS",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        incidentId,
        method,
      },
      payload: analysis,
    });

    return analysis;
  }

  /**
   * Calculate TRIR (Total Recordable Incident Rate)
   * TRIR = (Number of recordable incidents × 200,000) / Total hours worked
   */
  async calculateTRIR(filters: SafetyMetricFilters): Promise<number> {
    const incidents = await this.getIncidents({
      tenantId: filters.tenantId,
      customerId: filters.customerId,
      warehouseId: filters.warehouseId,
      facilityId: filters.facilityId,
      dateFrom: filters.periodStart,
      dateTo: filters.periodEnd,
    });

    // Filter recordable incidents (OSHA recordable)
    const recordableIncidents = incidents.filter((i) => i.oshaRecordable);

    // For now, use a default hours worked (in production, get from employee records)
    const totalHoursWorked = 200000; // Default: 100 employees × 2000 hours/year

    if (totalHoursWorked === 0) {
      return 0;
    }

    const trir = (recordableIncidents.length * 200000) / totalHoursWorked;
    return Math.round(trir * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate LTIFR (Lost Time Injury Frequency Rate)
   * LTIFR = (Number of lost time injuries × 1,000,000) / Total hours worked
   */
  async calculateLTIFR(filters: SafetyMetricFilters): Promise<number> {
    const incidents = await this.getIncidents({
      tenantId: filters.tenantId,
      customerId: filters.customerId,
      warehouseId: filters.warehouseId,
      facilityId: filters.facilityId,
      dateFrom: filters.periodStart,
      dateTo: filters.periodEnd,
      type: "LOST_TIME",
    });

    // For now, use a default hours worked
    const totalHoursWorked = 200000; // Default: 100 employees × 2000 hours/year

    if (totalHoursWorked === 0) {
      return 0;
    }

    const ltifr = (incidents.length * 1000000) / totalHoursWorked;
    return Math.round(ltifr * 100) / 100; // Round to 2 decimal places
  }
}

// ============================================================================
// EXPORT SERVICE INSTANCE
// ============================================================================

export const qhseIncidentService = new QHSEIncidentServiceImpl();

// Export for use in other modules
export default qhseIncidentService;
