/**
 * NCR Service - Intelligent Non-Conformance Reports Management
 *
 * Deep architecture service with AI-powered root cause analysis,
 * predictive analytics, and comprehensive cross-module integration
 *
 * This is the COMPLIANCE ENGINE - most intelligent module in the app
 */

import { eventBus, createEvent } from "@/lib/services/event-bus";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { evidenceService } from "@/lib/services/evidence";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { auditService } from "@/lib/services/audit/auditService";
import { capaService } from "./capaService";
import type {
  NCR,
  NCRStatus,
  NCRPriority,
  NCRSeverity,
  NCRType,
  ISOIMSQuery,
  ISOIMSFilter,
  ApprovalStep,
  Comment,
} from "./types";
import { prisma } from "@/lib/services/database/prismaClient";

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface INCRService {
  createNCR(input: CreateNCRInput): Promise<NCR>;
  updateNCR(
    id: string,
    input: UpdateNCRInput,
    tenantId: string,
    userId: string,
  ): Promise<NCR>;
  getNCR(id: string, tenantId: string): Promise<NCR | null>;
  getNCRs(query: ISOIMSQuery): Promise<{ ncrs: NCR[]; total: number }>;
  deleteNCR(id: string, tenantId: string): Promise<boolean>;
  updateStatus(
    id: string,
    status: NCRStatus,
    tenantId: string,
    userId: string,
  ): Promise<NCR>;
  performRootCauseAnalysis(
    ncrId: string,
    method: "5_WHY" | "FISHBONE" | "FMEA" | "PARETO" | "AI_AUTO",
    tenantId: string,
  ): Promise<NCR>;
  suggestCAPAs(
    ncrId: string,
    tenantId: string,
  ): Promise<
    Array<{
      capaId?: string;
      suggestion: string;
      confidence: number;
      priority: string;
    }>
  >;
  autoCreateCAPA(
    ncrId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ ncr: NCR; capaId: string }>;
  addComment(
    ncrId: string,
    comment: Omit<Comment, "id" | "createdAt">,
    tenantId: string,
  ): Promise<NCR>;
  linkToMaterial(
    ncrId: string,
    materialId: string,
    tenantId: string,
  ): Promise<NCR>;
  linkToOrder(ncrId: string, orderId: string, tenantId: string): Promise<NCR>;
  linkToCAPA(ncrId: string, capaId: string, tenantId: string): Promise<NCR>;
  getAIInsights(ncrId: string, tenantId: string): Promise<NCR["aiInsights"]>;
  getPredictiveAnalytics(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<NCRPredictiveAnalytics>;
  getAnalytics(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<NCRAnalytics>;
  detectPatterns(
    tenantId: string,
    filters?: ISOIMSFilter,
  ): Promise<NCRPattern[]>;
  getSimilarNCRs(ncrId: string, tenantId: string): Promise<NCR[]>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateNCRInput {
  tenantId: string;
  customerId?: string;
  warehouseId?: string;
  subject: string;
  description: string;
  priority: NCRPriority;
  severity: NCRSeverity;
  ncType: NCRType;
  reportedBy: string;
  reportedDate: Date;
  reportedLocation?: string;
  immediateAction?: string;
  assignedTo?: string;
  department?: string;
  linkedMaterial?: string;
  linkedBatch?: string;
  linkedSO?: string;
  linkedPO?: string;
  linkedLocation?: string;
  linkedCustomer?: string;
  linkedSupplier?: string;
  linkedAudit?: string;
  linkedInspection?: string;
}

export interface UpdateNCRInput {
  subject?: string;
  description?: string;
  priority?: NCRPriority;
  severity?: NCRSeverity;
  status?: NCRStatus;
  assignedTo?: string;
  department?: string;
  immediateAction?: string;
  rootCause?: string;
  containmentAction?: string;
}

export interface NCRPattern {
  id: string;
  patternType: "RECURRING" | "TREND" | "CLUSTER" | "CORRELATION";
  description: string;
  affectedNCRs: string[];
  confidence: number;
  recommendations: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface NCRAnalytics {
  total: number;
  byStatus: Record<NCRStatus, number>;
  byPriority: Record<NCRPriority, number>;
  bySeverity: Record<NCRSeverity, number>;
  byType: Record<NCRType, number>;
  averageResolutionTime: number;
  ncrToCAPAConversionRate: number;
  recurringNCRs: number;
  trends: Array<{ date: string; count: number; severity: NCRSeverity }>;
  topRootCauses: Array<{ cause: string; count: number; percentage: number }>;
  topAffectedAreas: Array<{ area: string; count: number; percentage: number }>;
}

export interface NCRPredictiveAnalytics {
  predictedNCRs: number;
  predictedRiskAreas: Array<{
    area: string;
    riskScore: number;
    likelihood: number;
  }>;
  predictedTrends: Array<{
    date: string;
    predictedCount: number;
    confidence: number;
  }>;
  earlyWarningSignals: Array<{
    signal: string;
    severity: string;
    recommendation: string;
  }>;
}

// ============================================================================
// NCR SERVICE IMPLEMENTATION
// ============================================================================

class NCRService implements INCRService {
  /**
   * Generate unique NCR number
   */
  private async generateNCRNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.iSOIMSNCR.count({
      where: {
        tenantId,
        ncrNumber: { startsWith: `NCR-${year}-` },
      },
    });
    return `NCR-${year}-${String(count + 1).padStart(6, "0")}`;
  }

  /**
   * Convert Prisma model to NCR type
   */
  private prismaToNCR(prismaNCR: any): NCR {
    return {
      id: prismaNCR.id,
      ncrNumber: prismaNCR.ncrNumber,
      tenantId: prismaNCR.tenantId,
      customerId: prismaNCR.customerId || undefined,
      warehouseId: prismaNCR.warehouseId || undefined,
      subject: prismaNCR.subject,
      description: prismaNCR.description,
      status: prismaNCR.status as NCRStatus,
      priority: prismaNCR.priority as NCRPriority,
      severity: prismaNCR.severity as NCRSeverity,
      ncType: prismaNCR.ncType as NCRType,
      reportedBy: prismaNCR.reportedBy,
      reportedDate: prismaNCR.reportedDate,
      reportedLocation: prismaNCR.reportedLocation || undefined,
      immediateAction: prismaNCR.immediateAction || undefined,
      immediateActionTaken: prismaNCR.immediateActionTaken,
      assignedTo: prismaNCR.assignedTo || undefined,
      department: prismaNCR.department || undefined,
      rootCause: prismaNCR.rootCause || undefined,
      rootCauseAnalysis: (prismaNCR.rootCauseAnalysis as any) || undefined,
      correctiveAction: prismaNCR.correctiveAction || undefined,
      linkedCAPA: prismaNCR.linkedCAPA || undefined,
      linkedAudit: prismaNCR.linkedAudit || undefined,
      linkedMaterial: prismaNCR.linkedMaterial || undefined,
      linkedOrder: prismaNCR.linkedOrder || undefined,
      linkedLocation: prismaNCR.linkedLocation || undefined,
      linkedCustomer: prismaNCR.linkedCustomer || undefined,
      linkedSupplier: prismaNCR.linkedSupplier || undefined,
      linkedInspection: prismaNCR.linkedInspection || undefined,
      aiInsights: (prismaNCR.aiInsights as any) || undefined,
      createdAt: prismaNCR.createdAt,
      updatedAt: prismaNCR.updatedAt,
      createdBy: prismaNCR.reportedBy,
      recordStatus: "ACTIVE" as const,
      comments: [],
      attachments: [],
      approvalChain: [],
      workflowStage: prismaNCR.status as any,
    };
  }

  /**
   * Create new NCR with intelligent analysis
   */
  async createNCR(input: CreateNCRInput): Promise<NCR> {
    try {
      const ncrNumber = await this.generateNCRNumber(input.tenantId);

      const ncr: NCR = {
        id: `ncr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        ncrNumber,
        tenantId: input.tenantId,
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        subject: input.subject,
        description: input.description,
        status: "OPEN",
        priority: input.priority,
        severity: input.severity,
        ncType: input.ncType,
        reportedBy: input.reportedBy,
        reportedDate: input.reportedDate,
        reportedLocation: input.reportedLocation,
        immediateAction: input.immediateAction,
        immediateActionTaken: false,
        assignedTo: input.assignedTo,
        department: input.department,
        linkedMaterial: input.linkedMaterial,
        linkedBatch: input.linkedBatch,
        linkedSO: input.linkedSO,
        linkedPO: input.linkedPO,
        linkedLocation: input.linkedLocation,
        linkedCustomer: input.linkedCustomer,
        linkedSupplier: input.linkedSupplier,
        linkedAudit: input.linkedAudit,
        linkedInspection: input.linkedInspection,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: input.reportedBy,
        recordStatus: "ACTIVE",
        comments: [],
        attachments: [],
        approvalChain: [],
        workflowStage: "OPEN",
      };

      // Save to database
      const prismaNCR = await prisma.iSOIMSNCR.create({
        data: {
          tenantId: input.tenantId,
          customerId: input.customerId,
          warehouseId: input.warehouseId,
          ncrNumber,
          subject: input.subject,
          description: input.description,
          status: "OPEN",
          priority: input.priority,
          severity: input.severity,
          ncType: input.ncType,
          reportedBy: input.reportedBy,
          reportedDate: input.reportedDate,
          reportedLocation: input.reportedLocation,
          immediateAction: input.immediateAction,
          immediateActionTaken: false,
          assignedTo: input.assignedTo,
          department: input.department,
          linkedMaterial: input.linkedMaterial,
          linkedOrder: input.linkedPO,
          linkedLocation: input.linkedLocation,
          linkedCustomer: input.linkedCustomer,
          linkedSupplier: input.linkedSupplier,
          linkedAudit: input.linkedAudit,
          linkedInspection: input.linkedInspection,
          rootCauseAnalysis: ncr.rootCauseAnalysis
            ? JSON.parse(JSON.stringify(ncr.rootCauseAnalysis))
            : null,
          aiInsights: ncr.aiInsights
            ? JSON.parse(JSON.stringify(ncr.aiInsights))
            : null,
        },
      });

      // Convert back to NCR type
      ncr.id = prismaNCR.id;
      ncr.createdAt = prismaNCR.createdAt;
      ncr.updatedAt = prismaNCR.updatedAt;

      // Intelligent Analysis - Get AI insights immediately
      ncr.aiInsights = await this.getAIInsights(ncr.id, input.tenantId);

      // Check for similar NCRs (pattern detection)
      const similarNCRs = await this.getSimilarNCRs(ncr.id, input.tenantId);
      if (similarNCRs.length > 0) {
        // Update AI insights with pattern detection
        ncr.aiInsights = {
          ...ncr.aiInsights,
          similarNCRs: similarNCRs.map((n) => n.id),
          recommendations: [
            ...(ncr.aiInsights?.recommendations || []),
            `Found ${similarNCRs.length} similar NCRs. Consider reviewing patterns.`,
          ],
        };
      }

      // Publish event
      const createEvent_obj = createEvent(
        "iso-ims.ncr.created",
        ncr.id, // aggregateId
        "NCR", // aggregateType
        {
          ncrId: ncr.id,
          ncrNumber: ncr.ncrNumber,
          tenantId: input.tenantId,
          customerId: input.customerId,
          warehouseId: input.warehouseId,
          severity: ncr.severity,
          priority: ncr.priority,
          reportedBy: input.reportedBy,
        },
        1, // version
        {
          tenantId: input.tenantId,
          userId: input.reportedBy,
        },
      );
      await eventBus.publish(createEvent_obj);

      // Audit log
      await auditService.log({
        action: "CREATE",
        entityType: "NCR",
        entityId: ncr.id,
        userId: input.reportedBy,
        tenantId: input.tenantId,
        metadata: {
          ncrNumber: ncr.ncrNumber,
          severity: ncr.severity,
          priority: ncr.priority,
        },
      });

      // Send notifications
      if (input.assignedTo) {
        await notificationService.send({
          tenantId: input.tenantId,
          userId: input.assignedTo,
          type: "alert" as any, // Using 'alert' as NCR_ASSIGNED is not in NotificationType
          title: `New NCR Assigned: ${ncr.ncrNumber}`,
          message: `You have been assigned to ${ncr.subject}`,
          channel: "in-app",
          data: { ncrId: ncr.id, priority: ncr.priority },
        });
      }

      // Auto-suggest CAPA for critical NCRs
      if (ncr.severity === "CRITICAL" || ncr.priority === "CRITICAL") {
        const capaSuggestions = await this.suggestCAPAs(ncr.id, input.tenantId);
        if (capaSuggestions.length > 0) {
          await notificationService.send({
            tenantId: input.tenantId,
            userId: input.reportedBy,
            type: "alert" as any, // Using 'alert' as NCR_CAPA_SUGGESTED is not in NotificationType
            title: `CAPA Suggested for ${ncr.ncrNumber}`,
            message: `AI suggests creating a CAPA for this critical NCR`,
            channel: "in-app",
            data: { ncrId: ncr.id, suggestions: capaSuggestions },
          });
        }
      }

      return ncr;
    } catch (error) {
      console.error("Error creating NCR:", error);
      throw new Error(
        `Failed to create NCR: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update NCR
   */
  async updateNCR(
    id: string,
    input: UpdateNCRInput,
    tenantId: string,
    userId: string,
  ): Promise<NCR> {
    try {
      const existingNCR = await this.getNCR(id, tenantId);
      if (!existingNCR) {
        throw new Error(`NCR ${id} not found`);
      }

      const updatedNCR: NCR = {
        ...existingNCR,
        ...input,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      // If status changed to CLOSED, set closedDate
      if (input.status === "CLOSED" && existingNCR.status !== "CLOSED") {
        updatedNCR.closedDate = new Date();
      }

      // If root cause was added, re-analyze
      if (input.rootCause && input.rootCause !== existingNCR.rootCause) {
        updatedNCR.aiInsights = await this.getAIInsights(id, tenantId);
      }

      // Save to database
      const prismaNCR = await prisma.iSOIMSNCR.update({
        where: { id },
        data: {
          subject: input.subject,
          description: input.description,
          priority: input.priority,
          severity: input.severity,
          status: input.status,
          assignedTo: input.assignedTo,
          department: input.department,
          immediateAction: input.immediateAction,
          rootCause: input.rootCause,
          correctiveAction: input.containmentAction,
          closedDate: updatedNCR.closedDate || undefined,
          rootCauseAnalysis: updatedNCR.rootCauseAnalysis
            ? JSON.parse(JSON.stringify(updatedNCR.rootCauseAnalysis))
            : undefined,
          aiInsights: updatedNCR.aiInsights
            ? JSON.parse(JSON.stringify(updatedNCR.aiInsights))
            : undefined,
        },
      });

      updatedNCR.id = prismaNCR.id;
      updatedNCR.createdAt = prismaNCR.createdAt;
      updatedNCR.updatedAt = prismaNCR.updatedAt;
      updatedNCR.closedDate =
        prismaNCR.closedDate || updatedNCR.closedDate || undefined;

      // Publish event
      const updateEvent = createEvent(
        "iso-ims.ncr.updated",
        id, // aggregateId
        "NCR", // aggregateType
        {
          ncrId: id,
          tenantId,
          updates: input,
        },
        1, // version
        { tenantId, userId },
      );
      await eventBus.publish(updateEvent);

      // If status changed to CLOSED, publish closed event for Pulse integration
      if (input.status === "CLOSED" && updatedNCR.status === "CLOSED") {
        const closedEvent = createEvent(
          "iso-ims.ncr.closed",
          id,
          "NCR",
          {
            ncrId: id,
            ncrNumber: updatedNCR.ncrNumber,
            tenantId,
            assignedTo: updatedNCR.assignedTo,
            closedAt: updatedNCR.closedDate || new Date(),
          },
          1,
          { tenantId, userId },
        );
        await eventBus.publish(closedEvent);
      }

      // Audit log
      await auditService.log({
        action: "UPDATE",
        entityType: "NCR",
        entityId: id,
        userId,
        tenantId,
        metadata: { updates: input },
      });

      return updatedNCR;
    } catch (error) {
      console.error("Error updating NCR:", error);
      throw new Error(
        `Failed to update NCR: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get NCR by ID
   */
  async getNCR(id: string, tenantId: string): Promise<NCR | null> {
    try {
      const prismaNCR = await prisma.iSOIMSNCR.findFirst({
        where: { id, tenantId },
      });

      if (!prismaNCR) return null;

      // Convert Prisma model to NCR type
      const ncr: NCR = {
        id: prismaNCR.id,
        ncrNumber: prismaNCR.ncrNumber,
        tenantId: prismaNCR.tenantId,
        customerId: prismaNCR.customerId || undefined,
        warehouseId: prismaNCR.warehouseId || undefined,
        subject: prismaNCR.subject,
        description: prismaNCR.description,
        status: prismaNCR.status as NCRStatus,
        priority: prismaNCR.priority as NCRPriority,
        severity: prismaNCR.severity as NCRSeverity,
        ncType: prismaNCR.ncType as NCRType,
        reportedBy: prismaNCR.reportedBy,
        reportedDate: prismaNCR.reportedDate,
        reportedLocation: prismaNCR.reportedLocation || undefined,
        immediateAction: prismaNCR.immediateAction || undefined,
        immediateActionTaken: prismaNCR.immediateActionTaken,
        assignedTo: prismaNCR.assignedTo || undefined,
        department: prismaNCR.department || undefined,
        rootCause: prismaNCR.rootCause || undefined,
        rootCauseAnalysis: (prismaNCR.rootCauseAnalysis as any) || undefined,
        correctiveAction: prismaNCR.correctiveAction || undefined,
        linkedCAPA: prismaNCR.linkedCAPA || undefined,
        linkedAudit: prismaNCR.linkedAudit || undefined,
        linkedMaterial: prismaNCR.linkedMaterial || undefined,
        linkedOrder: prismaNCR.linkedOrder || undefined,
        linkedLocation: prismaNCR.linkedLocation || undefined,
        linkedCustomer: prismaNCR.linkedCustomer || undefined,
        linkedSupplier: prismaNCR.linkedSupplier || undefined,
        linkedInspection: prismaNCR.linkedInspection || undefined,
        aiInsights: (prismaNCR.aiInsights as any) || undefined,
        createdAt: prismaNCR.createdAt,
        updatedAt: prismaNCR.updatedAt,
        createdBy: prismaNCR.reportedBy,
        recordStatus: "ACTIVE" as const,
        comments: [],
        attachments: [],
        approvalChain: [],
        workflowStage: prismaNCR.status as any,
      };

      return ncr;
    } catch (error) {
      console.error("Error fetching NCR:", error);
      return null;
    }
  }

  /**
   * Get NCRs with filtering and pagination
   */
  async getNCRs(query: ISOIMSQuery): Promise<{ ncrs: NCR[]; total: number }> {
    try {
      const where: any = {
        tenantId: query.filters?.tenantId,
      };

      if (query.filters) {
        if (query.filters.customerId)
          where.customerId = query.filters.customerId;
        if (query.filters.warehouseId)
          where.warehouseId = query.filters.warehouseId;
        if (query.filters.status) where.status = query.filters.status;
        if (query.filters.priority) where.priority = query.filters.priority;
        if (query.filters.severity) where.severity = query.filters.severity;
      }

      const [prismaNCRs, total] = await Promise.all([
        prisma.iSOIMSNCR.findMany({
          where,
          skip: query.pagination?.offset || 0,
          take: query.pagination?.limit || 50,
          orderBy: query.sort
            ? {
                [query.sort.field]: query.sort.direction.toLowerCase(),
              }
            : { createdAt: "desc" },
        }),
        prisma.iSOIMSNCR.count({ where }),
      ]);

      // Convert Prisma models to NCR types
      const ncrs: NCR[] = prismaNCRs.map((prismaNCR) =>
        this.prismaToNCR(prismaNCR),
      );

      return { ncrs, total };
    } catch (error) {
      console.error("Error fetching NCRs:", error);
      return { ncrs: [], total: 0 };
    }
  }

  /**
   * Delete NCR (soft delete - archive)
   */
  async deleteNCR(id: string, tenantId: string): Promise<boolean> {
    try {
      // Soft delete - update record status
      await prisma.iSOIMSNCR.update({
        where: { id },
        data: {
          recordStatus: "ARCHIVED",
          status: "CANCELLED",
          updatedBy: "system",
        },
      });

      const deleteEvent = createEvent(
        "iso-ims.ncr.deleted",
        id, // aggregateId
        "NCR", // aggregateType
        { ncrId: id, tenantId },
        1, // version
        { tenantId },
      );
      await eventBus.publish(deleteEvent);
      return true;
    } catch (error) {
      console.error("Error deleting NCR:", error);
      return false;
    }
  }

  /**
   * Update NCR status
   */
  async updateStatus(
    id: string,
    status: NCRStatus,
    tenantId: string,
    userId: string,
  ): Promise<NCR> {
    return this.updateNCR(id, { status }, tenantId, userId);
  }

  /**
   * Perform intelligent root cause analysis
   */
  async performRootCauseAnalysis(
    ncrId: string,
    method: "5_WHY" | "FISHBONE" | "FMEA" | "PARETO" | "AI_AUTO",
    tenantId: string,
  ): Promise<NCR> {
    const ncr = await this.getNCR(ncrId, tenantId);
    if (!ncr) {
      throw new Error(`NCR ${ncrId} not found`);
    }

    let analysis: NCR["rootCauseAnalysis"];

    if (method === "AI_AUTO") {
      // Use AI to automatically determine best method and perform analysis
      try {
        // Search knowledge base for similar NCRs to learn from
        const similarCases = await knowledgeBaseService.search({
          query: `${ncr.subject} ${ncr.description} root cause analysis`,
          category: "ISO_IMS",
          tenantId,
          limit: 5,
        });

        // Determine best method based on NCR characteristics
        let bestMethod: "5_WHY" | "FISHBONE" | "FMEA" | "PARETO" = "5_WHY";
        const description = (ncr.description || "").toLowerCase();

        if (
          description.includes("multiple") ||
          description.includes("various") ||
          description.includes("several")
        ) {
          bestMethod = "PARETO";
        } else if (
          description.includes("process") ||
          description.includes("system") ||
          description.includes("procedure")
        ) {
          bestMethod = "FISHBONE";
        } else if (
          description.includes("failure") ||
          description.includes("risk") ||
          description.includes("mode")
        ) {
          bestMethod = "FMEA";
        }

        // Extract insights from similar cases
        const historicalInsights = similarCases.results
          .filter((r) => r.entry.content)
          .map((r) => r.entry.content)
          .slice(0, 3);

        const contributingFactors = this.inferContributingFactors(
          ncr,
          historicalInsights,
        );

        analysis = {
          method: bestMethod,
          analysis:
            `AI-selected ${bestMethod} analysis: Based on pattern matching with ${similarCases.results.length} similar NCRs. ` +
            `The non-conformance "${ncr.subject}" appears to be related to ${this.categorizeIssue(ncr)}. ` +
            `Root cause likely involves: ${contributingFactors.slice(0, 3).join(", ") || "requires investigation"}.`,
          contributingFactors,
        };
      } catch (error) {
        console.warn("[NCRService] AI analysis failed, using fallback:", error);
        analysis = {
          method: "5_WHY",
          analysis:
            "Analysis pending - automated root cause analysis could not be completed. Manual review recommended.",
          contributingFactors: ["Investigation required"],
        };
      }
    } else {
      // Perform analysis using specified method
      switch (method) {
        case "5_WHY":
          analysis = this.perform5WhyAnalysis(ncr);
          break;
        case "FISHBONE":
          analysis = this.performFishboneAnalysis(ncr);
          break;
        case "FMEA":
          analysis = this.performFMEAAnalysis(ncr);
          break;
        case "PARETO":
          analysis = this.performParetoAnalysis(ncr);
          break;
        default:
          analysis = {
            method,
            analysis: `Root cause analysis using ${method} method`,
            contributingFactors: [],
          };
      }
    }

    return this.updateNCR(
      ncrId,
      {
        rootCauseAnalysis: analysis,
        rootCause: analysis.analysis,
      } as UpdateNCRInput,
      tenantId,
      "system",
    );
  }

  /**
   * AI-powered CAPA suggestions
   */
  async suggestCAPAs(
    ncrId: string,
    tenantId: string,
  ): Promise<
    Array<{
      capaId?: string;
      suggestion: string;
      confidence: number;
      priority: string;
    }>
  > {
    try {
      const ncr = await this.getNCR(ncrId, tenantId);
      if (!ncr) {
        return [];
      }

      // Search knowledge base for similar NCRs and their CAPAs
      const similarCases = await knowledgeBaseService.search({
        query: `${ncr.subject} ${ncr.description} ${ncr.rootCause || ""}`,
        category: "ISO_IMS",
        tenantId,
        limit: 10,
      });

      // Analyze similar cases for CAPA suggestions
      const suggestions: Array<{
        capaId?: string;
        suggestion: string;
        confidence: number;
        priority: string;
      }> = [];

      // Get CAPAs linked to similar NCRs
      const similarNCRIds = similarCases.results
        .map(
          (r) =>
            r.entry.metadata?.ncrId || r.entry.id.replace("iso-ims-ncr-", ""),
        )
        .filter((id) => id && id !== ncrId);

      if (similarNCRIds.length > 0) {
        const similarNCRs = await prisma.iSOIMSNCR.findMany({
          where: {
            id: { in: similarNCRIds },
            tenantId,
            linkedCAPA: { not: null },
          },
          take: 5,
        });

        similarNCRs.forEach((similar) => {
          if (similar.linkedCAPA) {
            suggestions.push({
              capaId: similar.linkedCAPA,
              suggestion: `Similar NCR was addressed by CAPA ${similar.linkedCAPA}`,
              confidence: 85,
              priority: similar.priority,
            });
          }
        });
      }

      // Generate generic suggestions based on NCR characteristics
      if (suggestions.length === 0) {
        suggestions.push({
          suggestion: `Implement corrective action to address ${ncr.subject}`,
          confidence: 85,
          priority: ncr.priority,
        });

        if (ncr.ncType === "PROCESS") {
          suggestions.push({
            suggestion: `Review and update ${ncr.ncType.toLowerCase()} procedures`,
            confidence: 78,
            priority: "HIGH",
          });
        }

        if (ncr.severity === "CRITICAL" || ncr.severity === "MAJOR") {
          suggestions.push({
            suggestion:
              "Conduct immediate containment action and root cause analysis",
            confidence: 90,
            priority: "CRITICAL",
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error("Error suggesting CAPAs:", error);
      return [];
    }
  }

  /**
   * Auto-create CAPA from NCR
   */
  async autoCreateCAPA(
    ncrId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ ncr: NCR; capaId: string }> {
    const ncr = await this.getNCR(ncrId, tenantId);
    if (!ncr) {
      throw new Error(`NCR ${ncrId} not found`);
    }

    // Get AI suggestions
    const suggestions = await this.suggestCAPAs(ncrId, tenantId);
    if (suggestions.length === 0) {
      throw new Error("No CAPA suggestions available");
    }

    // Use best suggestion
    const bestSuggestion = suggestions[0];

    // Create CAPA
    const capa = await capaService.createCAPA({
      tenantId,
      customerId: ncr.customerId,
      warehouseId: ncr.warehouseId,
      subject: `CAPA for ${ncr.ncrNumber}: ${ncr.subject}`,
      description: bestSuggestion.suggestion,
      priority:
        ncr.priority === "CRITICAL"
          ? "CRITICAL"
          : ncr.priority === "HIGH"
            ? "HIGH"
            : "MEDIUM",
      capaType: "CORRECTIVE_ACTION",
      capaSource: "NCR",
      assignedTo: ncr.assignedTo || userId,
      department: ncr.department || "",
      owner: userId,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      rootCause: ncr.rootCause,
      actionPlan: bestSuggestion.suggestion,
      linkedNCR: ncrId,
      linkedMaterial: ncr.linkedMaterial,
      linkedOrder: ncr.linkedSO || ncr.linkedPO,
      linkedLocation: ncr.linkedLocation,
      linkedCustomer: ncr.linkedCustomer,
      linkedSupplier: ncr.linkedSupplier,
      createdBy: userId,
    });

    // Link NCR to CAPA
    await this.linkToCAPA(ncrId, capa.id, tenantId);

    // Update NCR status
    await this.updateStatus(ncrId, "CAPA_ASSIGNED", tenantId, userId);

    return { ncr, capaId: capa.id };
  }

  /**
   * Add comment
   */
  async addComment(
    ncrId: string,
    comment: Omit<Comment, "id" | "createdAt">,
    tenantId: string,
  ): Promise<NCR> {
    const ncr = await this.getNCR(ncrId, tenantId);
    if (!ncr) {
      throw new Error(`NCR ${ncrId} not found`);
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...comment,
      createdAt: new Date(),
    };

    const updatedComments = [...(ncr.comments || []), newComment];

    return this.updateNCR(
      ncrId,
      { comments: updatedComments } as UpdateNCRInput,
      tenantId,
      comment.userId,
    );
  }

  /**
   * Link NCR to Material
   */
  async linkToMaterial(
    ncrId: string,
    materialId: string,
    tenantId: string,
  ): Promise<NCR> {
    return this.updateNCR(
      ncrId,
      { linkedMaterial: materialId } as UpdateNCRInput,
      tenantId,
      "system",
    );
  }

  /**
   * Link NCR to Order
   */
  async linkToOrder(
    ncrId: string,
    orderId: string,
    tenantId: string,
  ): Promise<NCR> {
    const ncr = await this.getNCR(ncrId, tenantId);
    if (!ncr) {
      throw new Error(`NCR ${ncrId} not found`);
    }

    // Determine if it's SO or PO based on context
    const updates: UpdateNCRInput = ncr.linkedSO
      ? { linkedPO: orderId }
      : { linkedSO: orderId };
    return this.updateNCR(ncrId, updates, tenantId, "system");
  }

  /**
   * Link NCR to CAPA
   */
  async linkToCAPA(
    ncrId: string,
    capaId: string,
    tenantId: string,
  ): Promise<NCR> {
    return this.updateNCR(
      ncrId,
      { linkedCAPA: capaId } as UpdateNCRInput,
      tenantId,
      "system",
    );
  }

  /**
   * Get AI-powered insights
   */
  async getAIInsights(
    ncrId: string,
    tenantId: string,
  ): Promise<NCR["aiInsights"]> {
    try {
      const ncr = await this.getNCR(ncrId, tenantId);
      if (!ncr) {
        return undefined;
      }

      // Search for similar NCRs
      const similarNCRs = await this.getSimilarNCRs(ncrId, tenantId);

      // Analyze historical NCRs for root cause patterns
      const historicalNCRs = await prisma.iSOIMSNCR.findMany({
        where: {
          tenantId,
          ncType: ncr.ncType,
          recordStatus: "ACTIVE",
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

      // Extract common root causes
      const rootCauses: string[] = [];
      historicalNCRs.forEach((hNcr) => {
        if (hNcr.rootCause && !rootCauses.includes(hNcr.rootCause)) {
          rootCauses.push(hNcr.rootCause);
        }
      });

      // Suggest CAPAs based on similar NCRs
      const suggestedCAPAs: string[] = [];
      similarNCRs.forEach((similar) => {
        if (
          similar.linkedCAPA &&
          !suggestedCAPAs.includes(similar.linkedCAPA)
        ) {
          suggestedCAPAs.push(similar.linkedCAPA);
        }
      });

      // Generate recommendations
      const recommendations: string[] = [];
      if (!ncr.rootCause) {
        recommendations.push(
          "Perform root cause analysis using 5-Why or Fishbone method",
        );
      }
      if (!ncr.immediateAction) {
        recommendations.push("Define immediate containment action");
      }
      if (ncr.severity === "CRITICAL" && !ncr.linkedCAPA) {
        recommendations.push("Create CAPA to address systematic issues");
      }
      if (similarNCRs.length > 0) {
        recommendations.push(
          "Review similar NCRs for patterns and systemic issues",
        );
      }

      return {
        suggestedRootCause: rootCauses.slice(0, 5),
        suggestedCAPAs: suggestedCAPAs.slice(0, 5),
        riskLevel:
          ncr.severity === "CRITICAL"
            ? "HIGH"
            : ncr.severity === "MAJOR"
              ? "MEDIUM"
              : "LOW",
        similarNCRs: similarNCRs.map((n) => n.id),
        recommendations,
      };
    } catch (error) {
      console.error("Error getting AI insights:", error);
      return undefined;
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<NCRPredictiveAnalytics> {
    try {
      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      // Get historical NCRs for analysis
      const historicalNCRs = await prisma.iSOIMSNCR.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // Calculate monthly trends
      const monthlyCounts: Record<string, number> = {};
      historicalNCRs.forEach((ncr) => {
        const month = ncr.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      });

      // Predict next month's NCRs using simple moving average
      const months = Object.keys(monthlyCounts).sort().slice(-6); // Last 6 months
      const avgMonthly =
        months.length > 0
          ? Math.round(
              months.reduce((sum, m) => sum + monthlyCounts[m], 0) /
                months.length,
            )
          : 0;

      // Identify risk areas based on frequency
      const areaCounts: Record<string, number> = {};
      historicalNCRs.forEach((ncr) => {
        const location = ncr.reportedLocation || "Unknown";
        areaCounts[location] = (areaCounts[location] || 0) + 1;
      });
      const predictedRiskAreas = Object.entries(areaCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([area]) => area);

      // Generate trends
      const predictedTrends = months.map((month) => ({
        period: month,
        predictedCount: avgMonthly,
        confidence: 0.7,
      }));

      // Early warning signals
      const earlyWarningSignals: string[] = [];
      if (avgMonthly > 10) {
        earlyWarningSignals.push(
          "High NCR volume detected - review quality processes",
        );
      }
      const criticalCount = historicalNCRs.filter(
        (n) => n.severity === "CRITICAL",
      ).length;
      if (criticalCount > 3) {
        earlyWarningSignals.push(
          "Multiple critical NCRs - immediate management review required",
        );
      }

      return {
        predictedNCRs: avgMonthly,
        predictedRiskAreas,
        predictedTrends,
        earlyWarningSignals,
      };
    } catch (error) {
      console.error("Error getting predictive analytics:", error);
      throw error;
    }
  }

  /**
   * Get NCR analytics
   */
  async getAnalytics(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<NCRAnalytics> {
    try {
      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      // Get all NCRs
      const allNCRs = await prisma.iSOIMSNCR.findMany({ where });

      // Calculate statistics
      const total = allNCRs.length;

      // By status
      const byStatus: Record<NCRStatus, number> = {
        DRAFT: 0,
        OPEN: 0,
        IN_PROGRESS: 0,
        CLOSED: 0,
        CANCELLED: 0,
      };
      allNCRs.forEach((ncr) => {
        const status = ncr.status as NCRStatus;
        if (status in byStatus) {
          byStatus[status] = (byStatus[status] || 0) + 1;
        }
      });

      // By priority
      const byPriority: Record<NCRPriority, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };
      allNCRs.forEach((ncr) => {
        const priority = ncr.priority as NCRPriority;
        if (priority in byPriority) {
          byPriority[priority] = (byPriority[priority] || 0) + 1;
        }
      });

      // By severity
      const bySeverity: Record<NCRSeverity, number> = {
        MINOR: 0,
        MAJOR: 0,
        CRITICAL: 0,
      };
      allNCRs.forEach((ncr) => {
        const severity = ncr.severity as NCRSeverity;
        if (severity in bySeverity) {
          bySeverity[severity] = (bySeverity[severity] || 0) + 1;
        }
      });

      // By type
      const byType: Record<NCRType, number> = {
        PRODUCT: 0,
        PROCESS: 0,
        SYSTEM: 0,
        SUPPLIER: 0,
        CUSTOMER: 0,
        DOCUMENTATION: 0,
        TRAINING: 0,
        OTHER: 0,
      };
      allNCRs.forEach((ncr) => {
        const type = ncr.ncType as NCRType;
        if (type in byType) {
          byType[type] = (byType[type] || 0) + 1;
        }
      });

      // Calculate average resolution time
      const closedNCRs = allNCRs.filter(
        (n) => n.status === "CLOSED" && n.closedDate,
      );
      const resolutionTimes = closedNCRs.map((ncr) => {
        if (ncr.closedDate) {
          return (
            (ncr.closedDate.getTime() - ncr.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
          ); // days
        }
        return 0;
      });
      const averageResolutionTime =
        resolutionTimes.length > 0
          ? Math.round(
              resolutionTimes.reduce((sum, t) => sum + t, 0) /
                resolutionTimes.length,
            )
          : 0;

      // NCR to CAPA conversion rate
      const withCAPA = allNCRs.filter((n) => n.linkedCAPA).length;
      const ncrToCAPAConversionRate = total > 0 ? (withCAPA / total) * 100 : 0;

      // Recurring NCRs (same type, same location)
      const recurringNCRs = allNCRs.filter((ncr) => {
        return (
          allNCRs.filter(
            (n) =>
              n.ncType === ncr.ncType &&
              n.reportedLocation === ncr.reportedLocation &&
              n.id !== ncr.id,
          ).length > 0
        );
      }).length;

      // Trends (last 12 months)
      const trends: Array<{ date: string; count: number }> = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().substring(0, 7);
        const count = allNCRs.filter((n) => {
          const ncrMonth = n.createdAt.toISOString().substring(0, 7);
          return ncrMonth === monthStr;
        }).length;
        trends.push({ date: monthStr, count });
      }

      // Top root causes
      const rootCauseCounts: Record<string, number> = {};
      allNCRs.forEach((ncr) => {
        if (ncr.rootCause) {
          rootCauseCounts[ncr.rootCause] =
            (rootCauseCounts[ncr.rootCause] || 0) + 1;
        }
      });
      const topRootCauses = Object.entries(rootCauseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cause, count]) => ({ cause, count }));

      // Top affected areas
      const areaCounts: Record<string, number> = {};
      allNCRs.forEach((ncr) => {
        const location = ncr.reportedLocation || "Unknown";
        areaCounts[location] = (areaCounts[location] || 0) + 1;
      });
      const topAffectedAreas = Object.entries(areaCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));

      return {
        total,
        byStatus,
        byPriority,
        bySeverity,
        byType,
        averageResolutionTime,
        ncrToCAPAConversionRate:
          Math.round(ncrToCAPAConversionRate * 100) / 100,
        recurringNCRs,
        trends,
        topRootCauses,
        topAffectedAreas,
      };
    } catch (error) {
      console.error("Error getting NCR analytics:", error);
      throw error;
    }
  }

  /**
   * Detect patterns in NCRs
   */
  async detectPatterns(
    tenantId: string,
    filters?: ISOIMSFilter,
  ): Promise<NCRPattern[]> {
    try {
      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.priority) where.priority = filters.priority;
        if (filters.severity) where.severity = filters.severity;
        if (filters.ncType) where.ncType = filters.ncType;
      }

      const ncrs = await prisma.iSOIMSNCR.findMany({ where, take: 100 });

      const patterns: NCRPattern[] = [];

      // Pattern 1: Location-based clustering
      const locationGroups: Record<string, any[]> = {};
      ncrs.forEach((ncr) => {
        const location = ncr.reportedLocation || "Unknown";
        if (!locationGroups[location]) {
          locationGroups[location] = [];
        }
        locationGroups[location].push(ncr);
      });

      Object.entries(locationGroups).forEach(([location, groupNCRs]) => {
        if (groupNCRs.length >= 3) {
          patterns.push({
            type: "LOCATION_CLUSTER",
            description: `Multiple NCRs in ${location}`,
            frequency: groupNCRs.length,
            affectedItems: groupNCRs.map((n) => n.id),
            severity: groupNCRs.some((n) => n.severity === "CRITICAL")
              ? "HIGH"
              : "MEDIUM",
            recommendation: `Investigate root cause in ${location}`,
          });
        }
      });

      // Pattern 2: Type-based clustering
      const typeGroups: Record<string, any[]> = {};
      ncrs.forEach((ncr) => {
        const type = ncr.ncType;
        if (!typeGroups[type]) {
          typeGroups[type] = [];
        }
        typeGroups[type].push(ncr);
      });

      Object.entries(typeGroups).forEach(([type, groupNCRs]) => {
        if (groupNCRs.length >= 5) {
          patterns.push({
            type: "TYPE_CLUSTER",
            description: `Recurring ${type} NCRs`,
            frequency: groupNCRs.length,
            affectedItems: groupNCRs.map((n) => n.id),
            severity: "MEDIUM",
            recommendation: `Review ${type} processes for systemic issues`,
          });
        }
      });

      // Pattern 3: Time-based trends
      const monthlyGroups: Record<string, any[]> = {};
      ncrs.forEach((ncr) => {
        const month = ncr.createdAt.toISOString().substring(0, 7);
        if (!monthlyGroups[month]) {
          monthlyGroups[month] = [];
        }
        monthlyGroups[month].push(ncr);
      });

      const months = Object.keys(monthlyGroups).sort();
      if (months.length >= 3) {
        const recentCount =
          monthlyGroups[months[months.length - 1]]?.length || 0;
        const previousCount =
          monthlyGroups[months[months.length - 2]]?.length || 0;
        if (recentCount > previousCount * 1.5) {
          patterns.push({
            type: "TREND",
            description: "Increasing NCR trend detected",
            frequency: recentCount,
            affectedItems: [],
            severity: "MEDIUM",
            recommendation:
              "Investigate recent process changes or training gaps",
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error("Error detecting patterns:", error);
      return [];
    }
  }

  /**
   * Get similar NCRs
   */
  async getSimilarNCRs(ncrId: string, tenantId: string): Promise<NCR[]> {
    try {
      const ncr = await this.getNCR(ncrId, tenantId);
      if (!ncr) {
        return [];
      }

      // Search knowledge base for similar NCRs
      const similar = await knowledgeBaseService.search({
        query: `${ncr.subject} ${ncr.description} ${ncr.ncType}`,
        category: "ISO_IMS",
        tenantId,
        limit: 10,
      });

      // Fetch actual NCRs from database based on similarity
      const similarIds = similar.results
        .map((r) => {
          const id =
            r.entry.metadata?.ncrId || r.entry.id.replace("iso-ims-ncr-", "");
          return id;
        })
        .filter((id) => id && id !== ncrId);

      if (similarIds.length === 0) {
        return [];
      }

      // Get similar NCRs by type and location
      const similarNCRs = await prisma.iSOIMSNCR.findMany({
        where: {
          id: { in: similarIds },
          tenantId,
          recordStatus: "ACTIVE",
        },
        take: 5,
      });

      // Also find by type and location
      const byTypeAndLocation = await prisma.iSOIMSNCR.findMany({
        where: {
          tenantId,
          ncType: ncr.ncType,
          reportedLocation: ncr.reportedLocation || undefined,
          id: { not: ncrId },
          recordStatus: "ACTIVE",
        },
        take: 5,
      });

      // Combine and deduplicate
      const allSimilar = [...similarNCRs, ...byTypeAndLocation];
      const uniqueSimilar = Array.from(
        new Map(allSimilar.map((n) => [n.id, n])).values(),
      ).slice(0, 5);

      return uniqueSimilar.map((n) => this.prismaToNCR(n));
    } catch (error) {
      console.error("Error getting similar NCRs:", error);
      return [];
    }
  }

  // ============================================================================
  // ROOT CAUSE ANALYSIS METHODS
  // ============================================================================

  /**
   * Perform 5 Why Analysis
   */
  private perform5WhyAnalysis(ncr: NCR): NCR["rootCauseAnalysis"] {
    const description = ncr.description || ncr.subject || "";

    // Generate progressive "why" questions based on NCR details
    const whyChain = [
      `Why did "${ncr.subject}" occur? - Initial investigation needed to identify immediate cause.`,
      `Why was the immediate cause present? - Process or procedure gap likely.`,
      `Why was the process/procedure gap not detected? - Control mechanisms may be insufficient.`,
      `Why are control mechanisms insufficient? - Training, resources, or design issues.`,
      `Why do these systemic issues exist? - Root cause: organizational/system level improvement needed.`,
    ];

    return {
      method: "5_WHY",
      analysis:
        `5 Why Analysis for "${ncr.subject}":\n` +
        whyChain.map((w, i) => `${i + 1}. ${w}`).join("\n") +
        `\n\nConclusion: The root cause requires investigation into systemic factors affecting ${ncr.ncType} incidents.`,
      contributingFactors: [
        "Process/Procedure",
        "Training/Competency",
        "Resources/Equipment",
        "Oversight/Controls",
        "Systemic Issues",
      ],
    };
  }

  /**
   * Perform Fishbone (Ishikawa) Analysis
   */
  private performFishboneAnalysis(ncr: NCR): NCR["rootCauseAnalysis"] {
    // 6M Categories: Man, Machine, Method, Material, Measurement, Mother Nature (Environment)
    const categories = {
      Man: [
        "Training gaps",
        "Skill deficiency",
        "Communication issues",
        "Workload",
      ],
      Machine: [
        "Equipment malfunction",
        "Maintenance issues",
        "Calibration",
        "Wear and tear",
      ],
      Method: [
        "Procedure inadequate",
        "Process not followed",
        "Documentation gaps",
        "Workflow issues",
      ],
      Material: [
        "Quality issues",
        "Supplier problems",
        "Specification errors",
        "Storage conditions",
      ],
      Measurement: [
        "Inspection gaps",
        "Testing inadequate",
        "Monitoring insufficient",
        "Data accuracy",
      ],
      Environment: [
        "Temperature/humidity",
        "Space constraints",
        "Contamination",
        "External factors",
      ],
    };

    // Identify likely contributing categories based on NCR type
    const likelyCategories = this.identifyLikelyCategories(ncr);

    return {
      method: "FISHBONE",
      analysis:
        `Fishbone (Ishikawa) Analysis for "${ncr.subject}":\n\n` +
        `Primary Categories to Investigate:\n` +
        likelyCategories
          .map(
            (cat) =>
              `• ${cat}: ${categories[cat as keyof typeof categories]?.slice(0, 2).join(", ")}`,
          )
          .join("\n") +
        `\n\nRecommendation: Focus investigation on ${likelyCategories[0]} and ${likelyCategories[1]} categories based on NCR characteristics.`,
      contributingFactors: likelyCategories.flatMap(
        (cat) => categories[cat as keyof typeof categories]?.slice(0, 2) || [],
      ),
    };
  }

  /**
   * Perform FMEA Analysis
   */
  private performFMEAAnalysis(ncr: NCR): NCR["rootCauseAnalysis"] {
    // Estimate Severity, Occurrence, Detection scores
    const severityScore = this.estimateFMEASeverity(ncr);
    const occurrenceScore = this.estimateFMEAOccurrence(ncr);
    const detectionScore = this.estimateFMEADetection(ncr);
    const rpn = severityScore * occurrenceScore * detectionScore;

    return {
      method: "FMEA",
      analysis:
        `FMEA Analysis for "${ncr.subject}":\n\n` +
        `• Severity Score: ${severityScore}/10 - ${this.getFMEADescription("severity", severityScore)}\n` +
        `• Occurrence Score: ${occurrenceScore}/10 - ${this.getFMEADescription("occurrence", occurrenceScore)}\n` +
        `• Detection Score: ${detectionScore}/10 - ${this.getFMEADescription("detection", detectionScore)}\n\n` +
        `Risk Priority Number (RPN): ${rpn}\n` +
        `Risk Level: ${rpn > 200 ? "HIGH - Immediate action required" : rpn > 100 ? "MEDIUM - Action needed" : "LOW - Monitor"}\n\n` +
        `Recommended Actions: ${this.getFMEARecommendations(severityScore, occurrenceScore, detectionScore)}`,
      contributingFactors: [
        `Severity (${severityScore})`,
        `Occurrence (${occurrenceScore})`,
        `Detection (${detectionScore})`,
        `RPN: ${rpn}`,
      ],
    };
  }

  /**
   * Perform Pareto Analysis
   */
  private performParetoAnalysis(ncr: NCR): NCR["rootCauseAnalysis"] {
    return {
      method: "PARETO",
      analysis:
        `Pareto Analysis for "${ncr.subject}":\n\n` +
        `This analysis identifies the "vital few" causes that contribute to the majority of the problem.\n\n` +
        `Based on the NCR description, the following categories should be analyzed:\n` +
        `• Frequency analysis of similar defects/issues\n` +
        `• Cost impact by cause category\n` +
        `• Time/duration patterns\n\n` +
        `Recommendation: Collect data on similar ${ncr.ncType} NCRs to identify the 20% of causes ` +
        `responsible for 80% of occurrences. Focus corrective actions on top contributors.`,
      contributingFactors: [
        "Data collection required",
        "Frequency analysis",
        "Cost impact analysis",
        "Prioritization needed",
      ],
    };
  }

  /**
   * Infer contributing factors from NCR and historical data
   */
  private inferContributingFactors(
    ncr: NCR,
    historicalInsights: string[],
  ): string[] {
    const factors: string[] = [];
    const description = (ncr.description || "").toLowerCase();

    if (description.includes("training") || description.includes("skill")) {
      factors.push("Training/Competency gaps");
    }
    if (description.includes("procedure") || description.includes("process")) {
      factors.push("Procedure/Process issues");
    }
    if (description.includes("equipment") || description.includes("machine")) {
      factors.push("Equipment/Machine factors");
    }
    if (description.includes("material") || description.includes("supply")) {
      factors.push("Material/Supply issues");
    }
    if (
      description.includes("communication") ||
      description.includes("information")
    ) {
      factors.push("Communication gaps");
    }
    if (
      description.includes("time") ||
      description.includes("deadline") ||
      description.includes("rush")
    ) {
      factors.push("Time pressure/Scheduling");
    }

    // Add generic factors if none identified
    if (factors.length === 0) {
      factors.push("Investigation required", "Root cause to be determined");
    }

    return factors;
  }

  /**
   * Categorize the issue type
   */
  private categorizeIssue(ncr: NCR): string {
    const type = ncr.ncType?.toLowerCase() || "";
    const description = (ncr.description || "").toLowerCase();

    if (type.includes("product") || description.includes("product")) {
      return "product quality issues";
    }
    if (type.includes("process") || description.includes("process")) {
      return "process deviations";
    }
    if (type.includes("safety") || description.includes("safety")) {
      return "safety concerns";
    }
    if (type.includes("document") || description.includes("document")) {
      return "documentation gaps";
    }
    return "quality management issues";
  }

  /**
   * Identify likely contributing categories based on NCR
   */
  private identifyLikelyCategories(ncr: NCR): string[] {
    const description = (ncr.description || "").toLowerCase();
    const categories: string[] = [];

    if (
      description.includes("person") ||
      description.includes("operator") ||
      description.includes("staff")
    ) {
      categories.push("Man");
    }
    if (
      description.includes("equipment") ||
      description.includes("machine") ||
      description.includes("tool")
    ) {
      categories.push("Machine");
    }
    if (
      description.includes("procedure") ||
      description.includes("method") ||
      description.includes("process")
    ) {
      categories.push("Method");
    }
    if (
      description.includes("material") ||
      description.includes("component") ||
      description.includes("supply")
    ) {
      categories.push("Material");
    }
    if (
      description.includes("measure") ||
      description.includes("test") ||
      description.includes("inspect")
    ) {
      categories.push("Measurement");
    }
    if (
      description.includes("environment") ||
      description.includes("temperature") ||
      description.includes("condition")
    ) {
      categories.push("Environment");
    }

    // Default to Method and Man if none identified
    if (categories.length === 0) {
      categories.push("Method", "Man");
    }

    return categories.slice(0, 4);
  }

  /**
   * Estimate FMEA Severity score
   */
  private estimateFMEASeverity(ncr: NCR): number {
    const severity = ncr.severity?.toUpperCase() || "";
    if (severity === "CRITICAL") return 10;
    if (severity === "HIGH" || severity === "MAJOR") return 8;
    if (severity === "MEDIUM" || severity === "MODERATE") return 5;
    if (severity === "LOW" || severity === "MINOR") return 3;
    return 5; // Default
  }

  /**
   * Estimate FMEA Occurrence score
   */
  private estimateFMEAOccurrence(ncr: NCR): number {
    // Would need historical data; estimate based on priority
    const priority = ncr.priority?.toUpperCase() || "";
    if (priority === "CRITICAL" || priority === "URGENT") return 8;
    if (priority === "HIGH") return 6;
    if (priority === "MEDIUM") return 4;
    if (priority === "LOW") return 2;
    return 4; // Default
  }

  /**
   * Estimate FMEA Detection score
   */
  private estimateFMEADetection(ncr: NCR): number {
    // Lower detection score = easier to detect (better)
    // Estimate based on how NCR was reported
    return 5; // Default - moderate detection capability
  }

  /**
   * Get FMEA score description
   */
  private getFMEADescription(type: string, score: number): string {
    if (type === "severity") {
      if (score >= 9) return "Hazardous - potential safety issue";
      if (score >= 7) return "High - major impact";
      if (score >= 4) return "Moderate - noticeable effect";
      return "Low - minor or no effect";
    }
    if (type === "occurrence") {
      if (score >= 9) return "Very high - almost certain";
      if (score >= 7) return "High - repeated failures";
      if (score >= 4) return "Moderate - occasional failures";
      return "Low - unlikely";
    }
    if (type === "detection") {
      if (score >= 9) return "Very low - almost no detection";
      if (score >= 7) return "Low - poor detection";
      if (score >= 4) return "Moderate - some detection";
      return "High - good detection capability";
    }
    return "";
  }

  /**
   * Get FMEA recommendations
   */
  private getFMEARecommendations(
    severity: number,
    occurrence: number,
    detection: number,
  ): string {
    const recommendations: string[] = [];

    if (severity >= 7) {
      recommendations.push(
        "Implement design/process changes to reduce severity",
      );
    }
    if (occurrence >= 7) {
      recommendations.push("Add preventive controls to reduce occurrence");
    }
    if (detection >= 7) {
      recommendations.push(
        "Improve detection methods and inspection frequency",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring, consider improvements");
    }

    return recommendations.join(". ");
  }
}

// Export singleton instance
export const ncrService = new NCRService();
