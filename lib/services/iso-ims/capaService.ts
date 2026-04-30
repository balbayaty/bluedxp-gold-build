/**
 * CAPA Service - Comprehensive Corrective & Preventive Actions Management
 *
 * Deep architecture service for managing CAPAs with:
 * - Full CRUD operations
 * - Workflow management
 * - AI-powered insights
 * - Cross-module interconnections
 * - Event-driven updates
 * - Analytics and reporting
 *
 * Integrated with BlueDXP platform architecture
 */

import { eventBus, createEvent } from "@/lib/services/event-bus";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { evidenceService } from "@/lib/services/evidence";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { auditService } from "@/lib/services/audit/auditService";
import { prisma } from "@/lib/services/database/prismaClient";
import type {
  CAPA,
  CAPAStatus,
  CAPAPriority,
  CAPAType,
  CAPASource,
  CAPAActionItem,
  ISOIMSQuery,
  ISOIMSFilter,
  ApprovalStep,
  Comment,
} from "./types";

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface ICAPAService {
  createCAPA(input: CreateCAPAInput): Promise<CAPA>;
  updateCAPA(
    id: string,
    input: UpdateCAPAInput,
    tenantId: string,
    userId: string,
  ): Promise<CAPA>;
  getCAPA(id: string, tenantId: string): Promise<CAPA | null>;
  getCAPAs(query: ISOIMSQuery): Promise<{ capas: CAPA[]; total: number }>;
  deleteCAPA(id: string, tenantId: string): Promise<boolean>;
  updateStatus(
    id: string,
    status: CAPAStatus,
    tenantId: string,
    userId: string,
  ): Promise<CAPA>;
  addActionItem(
    capaId: string,
    actionItem: Omit<CAPAActionItem, "id">,
    tenantId: string,
  ): Promise<CAPA>;
  updateActionItem(
    capaId: string,
    actionItemId: string,
    updates: Partial<CAPAActionItem>,
    tenantId: string,
  ): Promise<CAPA>;
  addComment(
    capaId: string,
    comment: Omit<Comment, "id" | "createdAt">,
    tenantId: string,
  ): Promise<CAPA>;
  approve(
    capaId: string,
    approverId: string,
    comments?: string,
    tenantId: string,
  ): Promise<CAPA>;
  reject(
    capaId: string,
    approverId: string,
    reason: string,
    tenantId: string,
  ): Promise<CAPA>;
  linkToNCR(capaId: string, ncrId: string, tenantId: string): Promise<CAPA>;
  linkToAudit(capaId: string, auditId: string, tenantId: string): Promise<CAPA>;
  linkToMaterial(
    capaId: string,
    materialId: string,
    tenantId: string,
  ): Promise<CAPA>;
  linkToOrder(capaId: string, orderId: string, tenantId: string): Promise<CAPA>;
  getAIInsights(capaId: string, tenantId: string): Promise<CAPA["aiInsights"]>;
  getAnalytics(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<CAPAAnalytics>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateCAPAInput {
  tenantId: string;
  customerId?: string;
  warehouseId?: string;
  subject: string;
  description: string;
  priority: CAPAPriority;
  capaType: CAPAType;
  capaSource: CAPASource;
  assignedTo: string;
  department: string;
  owner: string;
  targetDate: Date;
  rootCause?: string;
  actionPlan: string;
  resourcesRequired?: string;
  estimatedCost?: number;
  linkedNCR?: string;
  linkedAudit?: string;
  linkedMaterial?: string;
  linkedOrder?: string;
  linkedLocation?: string;
  linkedCustomer?: string;
  linkedSupplier?: string;
  linkedRisk?: string;
  linkedIncident?: string;
  createdBy: string;
}

export interface UpdateCAPAInput {
  subject?: string;
  description?: string;
  priority?: CAPAPriority;
  status?: CAPAStatus;
  assignedTo?: string;
  department?: string;
  owner?: string;
  targetDate?: Date;
  rootCause?: string;
  actionPlan?: string;
  resourcesRequired?: string;
  estimatedCost?: number;
  effectivenessReview?: string;
  effectivenessScore?: number;
  lessonsLearned?: string;
}

export interface CAPAAnalytics {
  total: number;
  byStatus: Record<CAPAStatus, number>;
  byPriority: Record<CAPAPriority, number>;
  byType: Record<CAPAType, number>;
  bySource: Record<CAPASource, number>;
  averageClosureTime: number;
  averageEffectivenessScore: number;
  overdueCount: number;
  completionRate: number;
  trends: Array<{ date: string; count: number }>;
}

// ============================================================================
// CAPA SERVICE IMPLEMENTATION
// ============================================================================

class CAPAService implements ICAPAService {
  /**
   * Generate unique CAPA number
   */
  private async generateCAPANumber(tenantId: string): Promise<string> {
    try {
      // Get count of CAPAs for this tenant this year
      const year = new Date().getFullYear();
      const count = await prisma.iSOIMSCAPA.count({
        where: {
          tenantId,
          capaNumber: {
            startsWith: `CAPA-${year}-`,
          },
        },
      });
      const tenantPrefix = tenantId.substring(0, 3).toUpperCase();
      return `CAPA-${tenantPrefix}-${year}-${String(count + 1).padStart(5, "0")}`;
    } catch (error) {
      // Fallback if database unavailable
      console.warn(
        "Failed to generate CAPA number from database, using fallback:",
        error,
      );
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `CAPA-${tenantId.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;
    }
  }

  /**
   * Create new CAPA
   */
  async createCAPA(input: CreateCAPAInput): Promise<CAPA> {
    try {
      const capaNumber = await this.generateCAPANumber(input.tenantId);

      const capa: CAPA = {
        id: `capa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        capaNumber,
        tenantId: input.tenantId,
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        subject: input.subject,
        description: input.description,
        status: "DRAFT",
        priority: input.priority,
        capaType: input.capaType,
        capaSource: input.capaSource,
        assignedTo: input.assignedTo,
        department: input.department,
        owner: input.owner,
        targetDate: input.targetDate,
        rootCause: input.rootCause,
        actionPlan: input.actionPlan,
        actionItems: [],
        resourcesRequired: input.resourcesRequired,
        estimatedCost: input.estimatedCost,
        linkedNCR: input.linkedNCR,
        linkedAudit: input.linkedAudit,
        linkedMaterial: input.linkedMaterial,
        linkedOrder: input.linkedOrder,
        linkedLocation: input.linkedLocation,
        linkedCustomer: input.linkedCustomer,
        linkedSupplier: input.linkedSupplier,
        linkedRisk: input.linkedRisk,
        linkedIncident: input.linkedIncident,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: input.createdBy,
        recordStatus: "ACTIVE" as const,
        comments: [],
        attachments: [],
        approvalChain: [],
        workflowStage: "DRAFT",
      };

      // Save to database using Prisma
      try {
        console.log("Saving CAPA to database:", {
          id: capa.id,
          capaNumber: capa.capaNumber,
          tenantId: capa.tenantId,
        });
        const dbCAPA = await prisma.iSOIMSCAPA.create({
          data: {
            id: capa.id,
            tenantId: capa.tenantId,
            customerId: capa.customerId || null,
            warehouseId: capa.warehouseId || null,
            capaNumber: capa.capaNumber,
            subject: capa.subject,
            description: capa.description,
            status: capa.status,
            priority: capa.priority,
            capaType: capa.capaType,
            capaSource: capa.capaSource,
            assignedTo: capa.assignedTo,
            assignedToName: null,
            department: capa.department,
            owner: capa.owner,
            ownerName: null,
            targetDate: capa.targetDate,
            rootCause: capa.rootCause || null,
            rootCauseAnalysis: capa.rootCauseAnalysis
              ? (capa.rootCauseAnalysis as any)
              : null,
            actionPlan: capa.actionPlan,
            actionItems: capa.actionItems as any,
            resourcesRequired: capa.resourcesRequired || null,
            estimatedCost: capa.estimatedCost || null,
            linkedNCR: capa.linkedNCR || null,
            linkedNCRNumber: null,
            linkedAudit: capa.linkedAudit || null,
            linkedAuditNumber: null,
            linkedMaterial: capa.linkedMaterial || null,
            linkedMaterialNumber: null,
            linkedOrder: capa.linkedOrder || null,
            linkedOrderNumber: null,
            linkedLocation: capa.linkedLocation || null,
            linkedLocationCode: null,
            linkedCustomer: capa.linkedCustomer || null,
            linkedCustomerNumber: null,
            linkedSupplier: capa.linkedSupplier || null,
            linkedSupplierNumber: null,
            linkedRisk: capa.linkedRisk || null,
            linkedIncident: capa.linkedIncident || null,
            workflowStage: capa.workflowStage || null,
            approvalChain: capa.approvalChain
              ? (capa.approvalChain as any)
              : null,
            currentApprover: null,
            comments: capa.comments ? (capa.comments as any) : null,
            attachments: capa.attachments || [],
            recordStatus: capa.recordStatus,
            metadata: null,
            createdBy: capa.createdBy,
            updatedBy: capa.updatedBy || capa.createdBy,
          },
        });
        console.log("CAPA saved successfully:", {
          id: dbCAPA.id,
          capaNumber: dbCAPA.capaNumber,
        });
        // Update capa with database timestamps
        capa.createdAt = dbCAPA.createdAt;
        capa.updatedAt = dbCAPA.updatedAt;
      } catch (error) {
        console.error("Failed to save CAPA to database:", error);
        // Re-throw the error so the API can handle it properly
        throw new Error(
          `Database error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Publish event
      const event = createEvent(
        "iso-ims.capa.created",
        capa.id, // aggregateId
        "CAPA", // aggregateType
        {
          capaId: capa.id,
          capaNumber: capa.capaNumber,
          tenantId: input.tenantId,
          customerId: input.customerId,
          warehouseId: input.warehouseId,
          createdBy: input.createdBy,
        },
        1, // version
        {
          tenantId: input.tenantId,
          userId: input.createdBy,
        },
      );
      await eventBus.publish(event);

      // Audit log
      await auditService.log({
        action: "CREATE",
        entityType: "CAPA",
        entityId: capa.id,
        userId: input.createdBy,
        tenantId: input.tenantId,
        metadata: { capaNumber: capa.capaNumber },
      });

      // Get AI insights
      capa.aiInsights = await this.getAIInsights(capa.id, input.tenantId);

      // Send notification to assignee
      await notificationService.send({
        tenantId: input.tenantId,
        userId: input.assignedTo,
        type: "alert" as any, // Using 'alert' as CAPA_ASSIGNED is not in NotificationType
        title: `New CAPA Assigned: ${capa.capaNumber}`,
        message: `You have been assigned to ${capa.subject}`,
        channel: "in-app",
        data: { capaId: capa.id },
      });

      return capa;
    } catch (error) {
      console.error("Error creating CAPA:", error);
      throw new Error(
        `Failed to create CAPA: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update CAPA
   */
  async updateCAPA(
    id: string,
    input: UpdateCAPAInput,
    tenantId: string,
    userId: string,
  ): Promise<CAPA> {
    try {
      // Fetch from database
      const existing = await prisma.iSOIMSCAPA.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new Error(`CAPA ${id} not found`);
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: userId,
      };

      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) {
        updateData.status = input.status;
        // If status changed to CLOSED, set completionDate
        if (
          input.status === "CLOSED" &&
          existing.status !== "CLOSED" &&
          !existing.completionDate
        ) {
          updateData.completionDate = new Date();
        }
      }
      if (input.assignedTo !== undefined)
        updateData.assignedTo = input.assignedTo;
      if (input.department !== undefined)
        updateData.department = input.department;
      if (input.owner !== undefined) updateData.owner = input.owner;
      if (input.targetDate !== undefined)
        updateData.targetDate = input.targetDate;
      if (input.rootCause !== undefined) updateData.rootCause = input.rootCause;
      if (input.actionPlan !== undefined)
        updateData.actionPlan = input.actionPlan;
      if (input.resourcesRequired !== undefined)
        updateData.resourcesRequired = input.resourcesRequired;
      if (input.estimatedCost !== undefined)
        updateData.estimatedCost = input.estimatedCost;
      if (input.effectivenessReview !== undefined)
        updateData.effectivenessReview = input.effectivenessReview;
      if (input.effectivenessScore !== undefined)
        updateData.effectivenessScore = input.effectivenessScore;
      if (input.lessonsLearned !== undefined)
        updateData.lessonsLearned = input.lessonsLearned;

      // Update in database
      const dbUpdated = await prisma.iSOIMSCAPA.update({
        where: { id },
        data: updateData,
      });

      // Convert to CAPA type
      const updatedCAPA: CAPA = {
        id: dbUpdated.id,
        tenantId: dbUpdated.tenantId,
        customerId: dbUpdated.customerId || undefined,
        warehouseId: dbUpdated.warehouseId || undefined,
        capaNumber: dbUpdated.capaNumber,
        subject: dbUpdated.subject,
        description: dbUpdated.description,
        status: dbUpdated.status as CAPAStatus,
        priority: dbUpdated.priority as CAPAPriority,
        capaType: dbUpdated.capaType as CAPAType,
        capaSource: dbUpdated.capaSource as CAPASource,
        assignedTo: dbUpdated.assignedTo,
        assignedToName: dbUpdated.assignedToName || undefined,
        department: dbUpdated.department,
        owner: dbUpdated.owner,
        ownerName: dbUpdated.ownerName || undefined,
        targetDate: dbUpdated.targetDate,
        completionDate:
          dbUpdated.completionDate ||
          (dbUpdated.status === "CLOSED" ? new Date() : undefined),
        effectivenessReviewDate: dbUpdated.effectivenessReviewDate || undefined,
        rootCause: dbUpdated.rootCause || undefined,
        rootCauseAnalysis: dbUpdated.rootCauseAnalysis as any,
        actionPlan: dbUpdated.actionPlan,
        actionItems: dbUpdated.actionItems as any,
        resourcesRequired: dbUpdated.resourcesRequired || undefined,
        estimatedCost: dbUpdated.estimatedCost || undefined,
        effectivenessReview: dbUpdated.effectivenessReview || undefined,
        effectivenessScore: dbUpdated.effectivenessScore || undefined,
        lessonsLearned: dbUpdated.lessonsLearned || undefined,
        linkedNCR: dbUpdated.linkedNCR || undefined,
        linkedNCRNumber: dbUpdated.linkedNCRNumber || undefined,
        linkedAudit: dbUpdated.linkedAudit || undefined,
        linkedAuditNumber: dbUpdated.linkedAuditNumber || undefined,
        linkedMaterial: dbUpdated.linkedMaterial || undefined,
        linkedMaterialNumber: dbUpdated.linkedMaterialNumber || undefined,
        linkedOrder: dbUpdated.linkedOrder || undefined,
        linkedOrderNumber: dbUpdated.linkedOrderNumber || undefined,
        linkedLocation: dbUpdated.linkedLocation || undefined,
        linkedLocationCode: dbUpdated.linkedLocationCode || undefined,
        linkedCustomer: dbUpdated.linkedCustomer || undefined,
        linkedCustomerNumber: dbUpdated.linkedCustomerNumber || undefined,
        linkedSupplier: dbUpdated.linkedSupplier || undefined,
        linkedSupplierNumber: dbUpdated.linkedSupplierNumber || undefined,
        linkedRisk: dbUpdated.linkedRisk || undefined,
        linkedIncident: dbUpdated.linkedIncident || undefined,
        aiInsights: dbUpdated.aiInsights as any,
        workflowStage: dbUpdated.workflowStage || undefined,
        approvalChain: dbUpdated.approvalChain as any,
        currentApprover: dbUpdated.currentApprover || undefined,
        comments: dbUpdated.comments as any,
        attachments: dbUpdated.attachments || [],
        daysOpen: dbUpdated.daysOpen || undefined,
        daysToComplete: dbUpdated.daysToComplete || undefined,
        effectivenessRating: dbUpdated.effectivenessRating || undefined,
        recordStatus: dbUpdated.recordStatus as any,
        metadata: dbUpdated.metadata as any,
        createdAt: dbUpdated.createdAt,
        updatedAt: dbUpdated.updatedAt,
        createdBy: dbUpdated.createdBy,
        updatedBy: dbUpdated.updatedBy || undefined,
      };

      // Publish event
      const updateEvent = createEvent(
        "iso-ims.capa.updated",
        id, // aggregateId
        "CAPA", // aggregateType
        {
          capaId: id,
          tenantId: updatedCAPA.tenantId,
          updates: input,
        },
        1, // version
        {
          tenantId: updatedCAPA.tenantId,
          userId,
        },
      );
      await eventBus.publish(updateEvent);

      // If status changed to CLOSED, publish closed event for Pulse integration
      if (input.status === "CLOSED" && updatedCAPA.status === "CLOSED") {
        const closedEvent = createEvent(
          "iso-ims.capa.closed",
          id,
          "CAPA",
          {
            capaId: id,
            capaNumber: updatedCAPA.capaNumber,
            tenantId: updatedCAPA.tenantId,
            assignedTo: updatedCAPA.assignedTo,
            closedAt: updatedCAPA.completionDate || new Date(),
          },
          1,
          {
            tenantId: updatedCAPA.tenantId,
            userId,
          },
        );
        await eventBus.publish(closedEvent);
      }

      // Audit log
      await auditService.log({
        action: "UPDATE",
        entityType: "CAPA",
        entityId: id,
        userId: updatedCAPA.updatedBy || "system",
        tenantId: updatedCAPA.tenantId,
        metadata: { updates: input },
      });

      return updatedCAPA;
    } catch (error) {
      console.error("Error updating CAPA:", error);
      throw new Error(
        `Failed to update CAPA: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get CAPA by ID
   */
  async getCAPA(id: string, tenantId: string): Promise<CAPA | null> {
    try {
      const dbCAPA = await prisma.iSOIMSCAPA.findFirst({
        where: { id, tenantId },
      });

      if (!dbCAPA) {
        return null;
      }

      // Convert to CAPA type
      return {
        id: dbCAPA.id,
        tenantId: dbCAPA.tenantId,
        customerId: dbCAPA.customerId || undefined,
        warehouseId: dbCAPA.warehouseId || undefined,
        capaNumber: dbCAPA.capaNumber,
        subject: dbCAPA.subject,
        description: dbCAPA.description,
        status: dbCAPA.status as CAPAStatus,
        priority: dbCAPA.priority as CAPAPriority,
        capaType: dbCAPA.capaType as CAPAType,
        capaSource: dbCAPA.capaSource as CAPASource,
        assignedTo: dbCAPA.assignedTo,
        assignedToName: dbCAPA.assignedToName || undefined,
        department: dbCAPA.department,
        owner: dbCAPA.owner,
        ownerName: dbCAPA.ownerName || undefined,
        targetDate: dbCAPA.targetDate,
        completionDate: dbCAPA.completionDate || undefined,
        effectivenessReviewDate: dbCAPA.effectivenessReviewDate || undefined,
        rootCause: dbCAPA.rootCause || undefined,
        rootCauseAnalysis: dbCAPA.rootCauseAnalysis as any,
        actionPlan: dbCAPA.actionPlan,
        actionItems: dbCAPA.actionItems as any,
        resourcesRequired: dbCAPA.resourcesRequired || undefined,
        estimatedCost: dbCAPA.estimatedCost || undefined,
        effectivenessReview: dbCAPA.effectivenessReview || undefined,
        effectivenessScore: dbCAPA.effectivenessScore || undefined,
        lessonsLearned: dbCAPA.lessonsLearned || undefined,
        linkedNCR: dbCAPA.linkedNCR || undefined,
        linkedNCRNumber: dbCAPA.linkedNCRNumber || undefined,
        linkedAudit: dbCAPA.linkedAudit || undefined,
        linkedAuditNumber: dbCAPA.linkedAuditNumber || undefined,
        linkedMaterial: dbCAPA.linkedMaterial || undefined,
        linkedMaterialNumber: dbCAPA.linkedMaterialNumber || undefined,
        linkedOrder: dbCAPA.linkedOrder || undefined,
        linkedOrderNumber: dbCAPA.linkedOrderNumber || undefined,
        linkedLocation: dbCAPA.linkedLocation || undefined,
        linkedLocationCode: dbCAPA.linkedLocationCode || undefined,
        linkedCustomer: dbCAPA.linkedCustomer || undefined,
        linkedCustomerNumber: dbCAPA.linkedCustomerNumber || undefined,
        linkedSupplier: dbCAPA.linkedSupplier || undefined,
        linkedSupplierNumber: dbCAPA.linkedSupplierNumber || undefined,
        linkedRisk: dbCAPA.linkedRisk || undefined,
        linkedIncident: dbCAPA.linkedIncident || undefined,
        aiInsights: dbCAPA.aiInsights as any,
        workflowStage: dbCAPA.workflowStage || undefined,
        approvalChain: dbCAPA.approvalChain as any,
        currentApprover: dbCAPA.currentApprover || undefined,
        comments: dbCAPA.comments as any,
        attachments: dbCAPA.attachments || [],
        daysOpen: dbCAPA.daysOpen || undefined,
        daysToComplete: dbCAPA.daysToComplete || undefined,
        effectivenessRating: dbCAPA.effectivenessRating || undefined,
        recordStatus: dbCAPA.recordStatus as any,
        metadata: dbCAPA.metadata as any,
        createdAt: dbCAPA.createdAt,
        updatedAt: dbCAPA.updatedAt,
        createdBy: dbCAPA.createdBy,
        updatedBy: dbCAPA.updatedBy || undefined,
      };
    } catch (error) {
      console.error("Error fetching CAPA:", error);
      return null;
    }
  }

  /**
   * Get CAPAs with filtering and pagination
   */
  async getCAPAs(
    query: ISOIMSQuery,
  ): Promise<{ capas: CAPA[]; total: number }> {
    try {
      console.log("Fetching CAPAs with query:", {
        tenantId: query.tenantId,
        filter: query.filter,
        pagination: query.pagination,
      });

      // Build where clause
      const where: any = {
        tenantId: query.tenantId,
        recordStatus: "ACTIVE",
      };

      if (query.customerId) where.customerId = query.customerId;
      if (query.warehouseId) where.warehouseId = query.warehouseId;

      if (query.filter) {
        if (query.filter.status && query.filter.status.length > 0) {
          where.status = { in: query.filter.status };
        }
        if (query.filter.priority && query.filter.priority.length > 0) {
          where.priority = { in: query.filter.priority };
        }
        if (query.filter.assignedTo && query.filter.assignedTo.length > 0) {
          where.assignedTo = { in: query.filter.assignedTo };
        }
        if (query.filter.dateFrom || query.filter.dateTo) {
          where.targetDate = {};
          if (query.filter.dateFrom)
            where.targetDate.gte = new Date(query.filter.dateFrom);
          if (query.filter.dateTo)
            where.targetDate.lte = new Date(query.filter.dateTo);
        }
        if (query.filter.searchQuery) {
          where.OR = [
            {
              subject: {
                contains: query.filter.searchQuery,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query.filter.searchQuery,
                mode: "insensitive",
              },
            },
            {
              capaNumber: {
                contains: query.filter.searchQuery,
                mode: "insensitive",
              },
            },
          ];
        }
      }

      console.log("CAPA query where clause:", JSON.stringify(where, null, 2));

      // Get total count
      const total = await prisma.iSOIMSCAPA.count({ where });
      console.log("Total CAPAs found:", total);

      // Get pagination params
      const page = query.pagination?.page || 1;
      const pageSize = query.pagination?.pageSize || 50;
      const skip = (page - 1) * pageSize;

      // Get sorting
      const sortField = query.sort?.field || "createdAt";
      const sortDirection = query.sort?.direction === "ASC" ? "asc" : "desc";

      // Get CAPAs with pagination
      const dbCAPAs = await prisma.iSOIMSCAPA.findMany({
        where,
        orderBy: {
          [sortField]: sortDirection,
        },
        take: pageSize,
        skip,
      });

      console.log("CAPAs retrieved from database:", dbCAPAs.length);

      // Convert to CAPA types
      const capas: CAPA[] = dbCAPAs.map((dbCAPA) => ({
        id: dbCAPA.id,
        tenantId: dbCAPA.tenantId,
        customerId: dbCAPA.customerId || undefined,
        warehouseId: dbCAPA.warehouseId || undefined,
        capaNumber: dbCAPA.capaNumber,
        subject: dbCAPA.subject,
        description: dbCAPA.description,
        status: dbCAPA.status as CAPAStatus,
        priority: dbCAPA.priority as CAPAPriority,
        capaType: dbCAPA.capaType as CAPAType,
        capaSource: dbCAPA.capaSource as CAPASource,
        assignedTo: dbCAPA.assignedTo,
        assignedToName: dbCAPA.assignedToName || undefined,
        department: dbCAPA.department,
        owner: dbCAPA.owner,
        ownerName: dbCAPA.ownerName || undefined,
        targetDate: dbCAPA.targetDate,
        completionDate: dbCAPA.completionDate || undefined,
        effectivenessReviewDate: dbCAPA.effectivenessReviewDate || undefined,
        rootCause: dbCAPA.rootCause || undefined,
        rootCauseAnalysis: dbCAPA.rootCauseAnalysis as any,
        actionPlan: dbCAPA.actionPlan,
        actionItems: dbCAPA.actionItems as any,
        resourcesRequired: dbCAPA.resourcesRequired || undefined,
        estimatedCost: dbCAPA.estimatedCost || undefined,
        effectivenessReview: dbCAPA.effectivenessReview || undefined,
        effectivenessScore: dbCAPA.effectivenessScore || undefined,
        lessonsLearned: dbCAPA.lessonsLearned || undefined,
        linkedNCR: dbCAPA.linkedNCR || undefined,
        linkedNCRNumber: dbCAPA.linkedNCRNumber || undefined,
        linkedAudit: dbCAPA.linkedAudit || undefined,
        linkedAuditNumber: dbCAPA.linkedAuditNumber || undefined,
        linkedMaterial: dbCAPA.linkedMaterial || undefined,
        linkedMaterialNumber: dbCAPA.linkedMaterialNumber || undefined,
        linkedOrder: dbCAPA.linkedOrder || undefined,
        linkedOrderNumber: dbCAPA.linkedOrderNumber || undefined,
        linkedLocation: dbCAPA.linkedLocation || undefined,
        linkedLocationCode: dbCAPA.linkedLocationCode || undefined,
        linkedCustomer: dbCAPA.linkedCustomer || undefined,
        linkedCustomerNumber: dbCAPA.linkedCustomerNumber || undefined,
        linkedSupplier: dbCAPA.linkedSupplier || undefined,
        linkedSupplierNumber: dbCAPA.linkedSupplierNumber || undefined,
        linkedRisk: dbCAPA.linkedRisk || undefined,
        linkedIncident: dbCAPA.linkedIncident || undefined,
        aiInsights: dbCAPA.aiInsights as any,
        workflowStage: dbCAPA.workflowStage || undefined,
        approvalChain: dbCAPA.approvalChain as any,
        currentApprover: dbCAPA.currentApprover || undefined,
        comments: dbCAPA.comments as any,
        attachments: dbCAPA.attachments || [],
        daysOpen: dbCAPA.daysOpen || undefined,
        daysToComplete: dbCAPA.daysToComplete || undefined,
        effectivenessRating: dbCAPA.effectivenessRating || undefined,
        recordStatus: dbCAPA.recordStatus as any,
        metadata: dbCAPA.metadata as any,
        createdAt: dbCAPA.createdAt,
        updatedAt: dbCAPA.updatedAt,
        createdBy: dbCAPA.createdBy,
        updatedBy: dbCAPA.updatedBy || undefined,
      }));

      return { capas, total };
    } catch (error) {
      console.error("Error fetching CAPAs:", error);
      return { capas: [], total: 0 };
    }
  }

  /**
   * Delete CAPA
   */
  async deleteCAPA(id: string, tenantId: string): Promise<boolean> {
    try {
      // Soft delete in database (set recordStatus to ARCHIVED)
      await prisma.iSOIMSCAPA.update({
        where: { id },
        data: {
          recordStatus: "ARCHIVED",
          updatedAt: new Date(),
        },
      });

      // Publish event
      const deleteEvent = createEvent(
        "iso-ims.capa.deleted",
        id, // aggregateId
        "CAPA", // aggregateType
        { capaId: id, tenantId },
        1, // version
        { tenantId },
      );
      await eventBus.publish(deleteEvent);

      return true;
    } catch (error) {
      console.error("Error deleting CAPA:", error);
      return false;
    }
  }

  /**
   * Update CAPA status
   */
  async updateStatus(
    id: string,
    status: CAPAStatus,
    tenantId: string,
    userId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(id, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${id} not found`);
    }

    return this.updateCAPA(id, { status }, tenantId, userId);
  }

  /**
   * Add action item to CAPA
   */
  async addActionItem(
    capaId: string,
    actionItem: Omit<CAPAActionItem, "id">,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    const newActionItem: CAPAActionItem = {
      id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...actionItem,
    };

    const updatedActionItems = [...(capa.actionItems || []), newActionItem];

    return this.updateCAPA(
      capaId,
      { actionItems: updatedActionItems },
      tenantId,
      "system",
    );
  }

  /**
   * Update action item
   */
  async updateActionItem(
    capaId: string,
    actionItemId: string,
    updates: Partial<CAPAActionItem>,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    const updatedActionItems = (capa.actionItems || []).map((item) =>
      item.id === actionItemId ? { ...item, ...updates } : item,
    );

    return this.updateCAPA(
      capaId,
      { actionItems: updatedActionItems },
      tenantId,
      "system",
    );
  }

  /**
   * Add comment to CAPA
   */
  async addComment(
    capaId: string,
    comment: Omit<Comment, "id" | "createdAt">,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...comment,
      createdAt: new Date(),
    };

    const updatedComments = [...(capa.comments || []), newComment];

    return this.updateCAPA(
      capaId,
      { comments: updatedComments } as UpdateCAPAInput,
      tenantId,
      comment.userId,
    );
  }

  /**
   * Approve CAPA
   */
  async approve(
    capaId: string,
    approverId: string,
    comments?: string,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    // Update approval chain
    const updatedApprovalChain = (capa.approvalChain || []).map((step) =>
      step.approverId === approverId && step.status === "PENDING"
        ? {
            ...step,
            status: "APPROVED" as const,
            approvedAt: new Date(),
            comments,
          }
        : step,
    );

    // Check if all required approvals are done
    const allApproved = updatedApprovalChain
      .filter((step) => step.required)
      .every((step) => step.status === "APPROVED");

    const newStatus = allApproved ? "APPROVED" : capa.status;

    return this.updateCAPA(
      capaId,
      {
        approvalChain: updatedApprovalChain,
        status: newStatus as CAPAStatus,
      } as UpdateCAPAInput,
      tenantId,
      approverId,
    );
  }

  /**
   * Reject CAPA
   */
  async reject(
    capaId: string,
    approverId: string,
    reason: string,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    const updatedApprovalChain = (capa.approvalChain || []).map((step) =>
      step.approverId === approverId && step.status === "PENDING"
        ? {
            ...step,
            status: "REJECTED" as const,
            rejectedAt: new Date(),
            comments: reason,
          }
        : step,
    );

    return this.updateCAPA(
      capaId,
      {
        approvalChain: updatedApprovalChain,
        status: "DRAFT" as CAPAStatus,
      } as UpdateCAPAInput,
      tenantId,
      approverId,
    );
  }

  /**
   * Link CAPA to NCR
   */
  async linkToNCR(
    capaId: string,
    ncrId: string,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    return this.updateCAPA(
      capaId,
      { linkedNCR: ncrId } as UpdateCAPAInput,
      tenantId,
      "system",
    );
  }

  /**
   * Link CAPA to Audit
   */
  async linkToAudit(
    capaId: string,
    auditId: string,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    return this.updateCAPA(
      capaId,
      { linkedAudit: auditId } as UpdateCAPAInput,
      tenantId,
      "system",
    );
  }

  /**
   * Link CAPA to Material
   */
  async linkToMaterial(
    capaId: string,
    materialId: string,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    return this.updateCAPA(
      capaId,
      { linkedMaterial: materialId } as UpdateCAPAInput,
      tenantId,
      "system",
    );
  }

  /**
   * Link CAPA to Order
   */
  async linkToOrder(
    capaId: string,
    orderId: string,
    tenantId: string,
  ): Promise<CAPA> {
    const capa = await this.getCAPA(capaId, tenantId);
    if (!capa) {
      throw new Error(`CAPA ${capaId} not found`);
    }

    return this.updateCAPA(
      capaId,
      { linkedOrder: orderId } as UpdateCAPAInput,
      tenantId,
      "system",
    );
  }

  /**
   * Get AI-powered insights for CAPA
   */
  async getAIInsights(
    capaId: string,
    tenantId: string,
  ): Promise<CAPA["aiInsights"]> {
    try {
      const capa = await this.getCAPA(capaId, tenantId);
      if (!capa) {
        return undefined;
      }

      // Search knowledge base for similar CAPAs
      const similarCAPAs = await knowledgeBaseService.search({
        query: `${capa.subject} ${capa.rootCause} ${capa.actionPlan}`,
        category: "ISO_IMS",
        tenantId,
        limit: 5,
      });

      // Analyze historical CAPAs for action suggestions
      const historicalCAPAs = await prisma.iSOIMSCAPA.findMany({
        where: {
          tenantId,
          capaType: capa.capaType,
          recordStatus: "ACTIVE",
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

      // Extract successful action items
      const suggestedActions: string[] = [];
      historicalCAPAs.forEach((hCapa) => {
        const actionItems = (hCapa.actionItems as any) || [];
        actionItems.forEach((item: any) => {
          if (item.status === "COMPLETED" && item.description) {
            if (!suggestedActions.includes(item.description)) {
              suggestedActions.push(item.description);
            }
          }
        });
      });

      // Determine risk level
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
      if (capa.priority === "CRITICAL") {
        riskLevel = "HIGH";
      } else if (capa.priority === "LOW") {
        riskLevel = "LOW";
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (!capa.rootCause) {
        recommendations.push("Perform detailed root cause analysis");
      }
      if (capa.actionItems.length === 0) {
        recommendations.push("Define specific, measurable action items");
      }
      if (capa.status === "OPEN" && new Date(capa.targetDate) < new Date()) {
        recommendations.push(
          "Target date has passed - review and update timeline",
        );
      }
      if (
        capa.effectivenessScore === undefined &&
        capa.status === "COMPLETED"
      ) {
        recommendations.push(
          "Conduct effectiveness review to measure CAPA success",
        );
      }

      return {
        suggestedActions: suggestedActions.slice(0, 5),
        riskLevel,
        similarCAPAs: similarCAPAs.results
          .map((c) => {
            const id =
              c.entry.metadata?.capaId ||
              c.entry.id.replace("iso-ims-capa-", "");
            return id;
          })
          .filter((id) => id && id !== capaId),
        recommendations,
      };
    } catch (error) {
      console.error("Error getting AI insights:", error);
      return undefined;
    }
  }

  /**
   * Get CAPA analytics
   */
  async getAnalytics(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<CAPAAnalytics> {
    try {
      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      // Get all CAPAs
      const allCAPAs = await prisma.iSOIMSCAPA.findMany({ where });

      // Calculate statistics
      const total = allCAPAs.length;

      // By status
      const byStatus: Record<CAPAStatus, number> = {
        DRAFT: 0,
        OPEN: 0,
        IN_PROGRESS: 0,
        UNDER_REVIEW: 0,
        AWAITING_APPROVAL: 0,
        APPROVED: 0,
        IMPLEMENTED: 0,
        EFFECTIVENESS_REVIEW: 0,
        COMPLETED: 0,
        CLOSED: 0,
        CANCELLED: 0,
      };
      allCAPAs.forEach((capa) => {
        const status = capa.status as CAPAStatus;
        if (status in byStatus) {
          byStatus[status] = (byStatus[status] || 0) + 1;
        }
      });

      // By priority
      const byPriority: Record<CAPAPriority, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };
      allCAPAs.forEach((capa) => {
        const priority = capa.priority as CAPAPriority;
        if (priority in byPriority) {
          byPriority[priority] = (byPriority[priority] || 0) + 1;
        }
      });

      // By type
      const byType: Record<CAPAType, number> = {
        CORRECTIVE_ACTION: 0,
        PREVENTIVE_ACTION: 0,
      };
      allCAPAs.forEach((capa) => {
        const type = capa.capaType as CAPAType;
        if (type in byType) {
          byType[type] = (byType[type] || 0) + 1;
        }
      });

      // By source
      const bySource: Record<CAPASource, number> = {
        NCR: 0,
        AUDIT: 0,
        RISK_ASSESSMENT: 0,
        CUSTOMER_COMPLAINT: 0,
        MANAGEMENT_REVIEW: 0,
        INCIDENT: 0,
        INTERNAL_REVIEW: 0,
        OTHER: 0,
      };
      allCAPAs.forEach((capa) => {
        const source = capa.capaSource as CAPASource;
        if (source in bySource) {
          bySource[source] = (bySource[source] || 0) + 1;
        }
      });

      // Calculate average closure time
      const closedCAPAs = allCAPAs.filter(
        (c) => c.status === "CLOSED" && c.completionDate,
      );
      const closureTimes = closedCAPAs.map((capa) => {
        if (capa.completionDate) {
          return (
            (capa.completionDate.getTime() - capa.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
          ); // days
        }
        return 0;
      });
      const averageClosureTime =
        closureTimes.length > 0
          ? Math.round(
              closureTimes.reduce((sum, t) => sum + t, 0) / closureTimes.length,
            )
          : 0;

      // Average effectiveness score
      const withScore = allCAPAs.filter(
        (c) =>
          c.effectivenessScore !== null && c.effectivenessScore !== undefined,
      );
      const scores = withScore.map((c) => c.effectivenessScore!);
      const averageEffectivenessScore =
        scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 0;

      // Overdue count
      const now = new Date();
      const overdueCount = allCAPAs.filter((c) => {
        return (
          c.status !== "CLOSED" &&
          c.status !== "COMPLETED" &&
          c.status !== "CANCELLED" &&
          new Date(c.targetDate) < now
        );
      }).length;

      // Completion rate
      const completed = allCAPAs.filter(
        (c) => c.status === "CLOSED" || c.status === "COMPLETED",
      ).length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Trends (last 12 months)
      const trends: Array<{ date: string; count: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().substring(0, 7);
        const count = allCAPAs.filter((c) => {
          const capaMonth = c.createdAt.toISOString().substring(0, 7);
          return capaMonth === monthStr;
        }).length;
        trends.push({ date: monthStr, count });
      }

      return {
        total,
        byStatus,
        byPriority,
        byType,
        bySource,
        averageClosureTime,
        averageEffectivenessScore,
        overdueCount,
        completionRate: Math.round(completionRate * 100) / 100,
        trends,
      };
    } catch (error) {
      console.error("Error getting CAPA analytics:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const capaService = new CAPAService();
