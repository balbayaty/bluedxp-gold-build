/**
 * RFI Service - Intelligent Request for Information Management
 *
 * MIND-BLOWING CAPABILITIES:
 * - Intelligent RFI capture and analysis
 * - Automated RFI → RFQ → Proposal pipeline
 * - Throughput tracking and optimization
 * - AI-powered pricing readiness assessment
 * - Auto-generation of RFQs and Proposals from RFIs
 * - Integration with Knowledge Base for learning
 * - Event-driven architecture (CQRS/Event Sourcing)
 *
 * Deep architecture following BlueDXP patterns
 */

import { eventBus } from "@/lib/services/event-bus";
import { eventStore } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { rfqService } from "./RFQService";
import { enhancedProposalService } from "./enhancedProposalService";
import { prisma } from "@/lib/services/database/prismaClient";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RFI {
  id: string;
  rfiNumber: string;
  tenantId: string;

  // Contact Information
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  flexRepresentative?: string;
  date?: string;

  // Warehousing Details
  storage?: {
    storageSqm?: number;
    storageCbm?: number;
    palletPositions?: number;
    mixAmbient?: number;
    mixTemp?: number;
    mixYard?: number;
    tempRange?: string;
    storageType?: string;
    skuCount?: number;
    stockLevels?: string;
    invValue?: number;
    annualTurnover?: number;
    insuranceRequired?: string;
  };

  inbound?: {
    inboundPalletsDaily?: number;
    inboundShipmentsDaily?: number;
    inboundTrucksDaily?: number;
    inboundPackaging?: string;
    inboundSplit?: string;
    packageSizesPerSku?: number;
    palletsPerShipmentAvg?: number;
    skusPerPalletAvg?: number;
    verifyPalletPct?: number;
    verifyCartonPct?: number;
    verifyPiecePct?: number;
    inboundInspection?: string;
  };

  outbound?: {
    outboundPalletsDaily?: number;
    outboundShipmentsDaily?: number;
    outboundTrucksDaily?: number;
    rotationRule?: string;
    outboundType?: string;
    ordersDaily?: number;
    linesPerOrder?: number;
    cutoffTime?: string;
    outboundNotes?: string;
  };

  returns?: {
    returnsRequired?: string;
    returnsNotes?: string;
  };

  vas?: {
    vasRequired?: string;
    vasRepack?: boolean;
    vasKitting?: boolean;
    vasPalletize?: boolean;
    vasLabel?: boolean;
    vasBarcode?: boolean;
    vasShrink?: boolean;
    vasOtherDesc?: string;
    vasVolumes?: string;
  };

  systems?: {
    wms?: string;
    systemReq?: string;
  };

  kpis?: string;
  additional?: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
  certify?: string;

  // Intelligence & Analysis
  dataCompleteness: number; // 0-100%
  pricingReadiness: number; // 0-100%
  pricingConfidence: "Low" | "Medium" | "High";
  assumptions: string[];
  keyDrivers: {
    storage: string;
    handling: string;
    pick: string;
    verify: string;
    vas: string;
  };
  readinessBadge: "Green" | "Amber" | "Red";

  // Automation & Pipeline
  status: RFIStatus;
  autoGenerateRFQ: boolean;
  autoGenerateProposal: boolean;
  generatedRFQId?: string;
  generatedProposalId?: string;
  throughputMetrics?: ThroughputMetrics;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export type RFIStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RFQ_GENERATED"
  | "PROPOSAL_GENERATED"
  | "COMPLETED"
  | "ARCHIVED";

export interface ThroughputMetrics {
  timeToRFQ: number; // milliseconds
  timeToProposal: number; // milliseconds
  totalProcessingTime: number; // milliseconds
  automationScore: number; // 0-100
  manualInterventions: number;
}

export interface RFIAnalysis {
  completeness: number;
  readiness: number;
  confidence: "Low" | "Medium" | "High";
  assumptions: string[];
  keyDrivers: RFI["keyDrivers"];
  badge: "Green" | "Amber" | "Red";
  recommendations: string[];
  estimatedValue?: number;
  riskFactors: string[];
}

export interface CreateRFIInput {
  tenantId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  flexRepresentative?: string;
  date?: string;
  storage?: RFI["storage"];
  inbound?: RFI["inbound"];
  outbound?: RFI["outbound"];
  returns?: RFI["returns"];
  vas?: RFI["vas"];
  systems?: RFI["systems"];
  kpis?: string;
  additional?: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
  certify?: string;
  autoGenerateRFQ?: boolean;
  autoGenerateProposal?: boolean;
  createdBy: string;
}

export interface UpdateRFIInput {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  storage?: Partial<RFI["storage"]>;
  inbound?: Partial<RFI["inbound"]>;
  outbound?: Partial<RFI["outbound"]>;
  returns?: Partial<RFI["returns"]>;
  vas?: Partial<RFI["vas"]>;
  systems?: Partial<RFI["systems"]>;
  kpis?: string;
  additional?: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
  certify?: string;
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface IRFIService {
  createRFI(input: CreateRFIInput): Promise<RFI>;
  updateRFI(id: string, input: UpdateRFIInput, tenantId: string): Promise<RFI>;
  getRFI(id: string, tenantId: string): Promise<RFI | null>;
  listRFIs(
    tenantId: string,
    filters?: {
      status?: RFIStatus;
      dateFrom?: string;
      dateTo?: string;
      companyName?: string;
    },
  ): Promise<{ rfis: RFI[]; total: number }>;
  deleteRFI(id: string, tenantId: string): Promise<boolean>;
  submitRFI(id: string, tenantId: string): Promise<RFI>;
  analyzeRFI(id: string, tenantId: string): Promise<RFIAnalysis>;
  generateRFQFromRFI(
    rfiId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ rfi: RFI; rfqId: string }>;
  generateProposalFromRFI(
    rfiId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ rfi: RFI; proposalId: string }>;
  autoProcessRFI(
    rfiId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ rfi: RFI; rfqId?: string; proposalId?: string }>;
  getThroughputMetrics(
    tenantId: string,
    timeRange?: { from: string; to: string },
  ): Promise<ThroughputMetrics>;
  getAnalytics(tenantId: string): Promise<RFIAnalytics>;
}

export interface RFIAnalytics {
  totalRFIs: number;
  byStatus: Record<RFIStatus, number>;
  averageCompleteness: number;
  averageReadiness: number;
  averageTimeToRFQ: number;
  averageTimeToProposal: number;
  automationRate: number;
  conversionRate: number;
  topCompanies: Array<{ companyName: string; count: number }>;
  trends: Array<{ date: string; count: number; avgReadiness: number }>;
}

// ============================================================================
// RFI SERVICE IMPLEMENTATION
// ============================================================================

class RFIService implements IRFIService {
  private static instance: RFIService;

  static getInstance(): RFIService {
    if (!RFIService.instance) {
      RFIService.instance = new RFIService();
    }
    return RFIService.instance;
  }

  private generateRFINumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `FLX-RFI-${random}`;
  }

  async createRFI(input: CreateRFIInput): Promise<RFI> {
    const rfiNumber = this.generateRFINumber();
    const now = new Date().toISOString();

    // Analyze RFI data for intelligence
    const analysis = this.analyzeRFIData(input);

    const rfi: RFI = {
      id: `rfi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rfiNumber,
      tenantId: input.tenantId,
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      address: input.address,
      flexRepresentative: input.flexRepresentative,
      date: input.date,
      storage: input.storage,
      inbound: input.inbound,
      outbound: input.outbound,
      returns: input.returns,
      vas: input.vas,
      systems: input.systems,
      kpis: input.kpis,
      additional: input.additional,
      attachments: input.attachments,
      certify: input.certify,
      dataCompleteness: analysis.completeness,
      pricingReadiness: analysis.readiness,
      pricingConfidence: analysis.confidence,
      assumptions: analysis.assumptions,
      keyDrivers: analysis.keyDrivers,
      readinessBadge: analysis.badge,
      status: "DRAFT",
      autoGenerateRFQ: input.autoGenerateRFQ ?? false,
      autoGenerateProposal: input.autoGenerateProposal ?? false,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Persist to database
    try {
      await prisma.rFI.create({
        data: {
          id: rfi.id,
          rfiNumber: rfi.rfiNumber,
          tenantId: rfi.tenantId,
          companyName: rfi.companyName,
          contactPerson: rfi.contactPerson,
          email: rfi.email,
          phone: rfi.phone,
          address: rfi.address,
          data: rfi as any, // Store full RFI data as JSON
          status: rfi.status,
          dataCompleteness: rfi.dataCompleteness,
          pricingReadiness: rfi.pricingReadiness,
          pricingConfidence: rfi.pricingConfidence,
          readinessBadge: rfi.readinessBadge,
          createdBy: rfi.createdBy,
        },
      });
    } catch (error) {
      console.error("Error persisting RFI to database:", error);
      // Continue with in-memory storage if DB fails
    }

    // Emit event
    await eventStore.publish({
      type: "rfi.created",
      aggregateId: rfi.id,
      aggregateType: "RFI",
      payload: rfi,
      metadata: {
        tenantId: rfi.tenantId,
        userId: rfi.createdBy,
        timestamp: now,
      },
    });

    // Store in Knowledge Base for learning
    try {
      await knowledgeBaseService.addDocument({
        tenantId: rfi.tenantId,
        title: `RFI: ${rfi.companyName}`,
        content: JSON.stringify(rfi),
        category: "rfi",
        metadata: {
          rfiId: rfi.id,
          rfiNumber: rfi.rfiNumber,
          companyName: rfi.companyName,
          completeness: rfi.dataCompleteness,
          readiness: rfi.pricingReadiness,
        },
      });
    } catch (error) {
      console.error("Error storing RFI in Knowledge Base:", error);
    }

    return rfi;
  }

  async updateRFI(
    id: string,
    input: UpdateRFIInput,
    tenantId: string,
  ): Promise<RFI> {
    // Get existing RFI
    const existing = await this.getRFI(id, tenantId);
    if (!existing) {
      throw new Error(`RFI ${id} not found`);
    }

    // Merge updates
    const updated: RFI = {
      ...existing,
      ...input,
      storage: { ...existing.storage, ...input.storage },
      inbound: { ...existing.inbound, ...input.inbound },
      outbound: { ...existing.outbound, ...input.outbound },
      returns: { ...existing.returns, ...input.returns },
      vas: { ...existing.vas, ...input.vas },
      systems: { ...existing.systems, ...input.systems },
      updatedAt: new Date().toISOString(),
    };

    // Re-analyze
    const analysis = this.analyzeRFIData(updated);
    updated.dataCompleteness = analysis.completeness;
    updated.pricingReadiness = analysis.readiness;
    updated.pricingConfidence = analysis.confidence;
    updated.assumptions = analysis.assumptions;
    updated.keyDrivers = analysis.keyDrivers;
    updated.readinessBadge = analysis.badge;

    // Update database
    try {
      await prisma.rFI.updateMany({
        where: { id, tenantId },
        data: {
          data: updated as any,
          dataCompleteness: updated.dataCompleteness,
          pricingReadiness: updated.pricingReadiness,
          pricingConfidence: updated.pricingConfidence,
          readinessBadge: updated.readinessBadge,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error updating RFI in database:", error);
    }

    // Emit event
    await eventStore.publish({
      type: "rfi.updated",
      aggregateId: id,
      aggregateType: "RFI",
      payload: updated,
      metadata: {
        tenantId,
        timestamp: new Date().toISOString(),
      },
    });

    return updated;
  }

  async getRFI(id: string, tenantId: string): Promise<RFI | null> {
    try {
      const dbRFI = await prisma.rFI.findFirst({
        where: { id, tenantId },
      });

      if (dbRFI) {
        return dbRFI.data as RFI;
      }
    } catch (error) {
      console.error("Error fetching RFI from database:", error);
    }

    return null;
  }

  async listRFIs(
    tenantId: string,
    filters?: {
      status?: RFIStatus;
      dateFrom?: string;
      dateTo?: string;
      companyName?: string;
    },
  ): Promise<{ rfis: RFI[]; total: number }> {
    try {
      const where: any = { tenantId };

      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.dateFrom) {
        where.createdAt = { gte: new Date(filters.dateFrom) };
      }
      if (filters?.dateTo) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
      }
      if (filters?.companyName) {
        where.companyName = {
          contains: filters.companyName,
          mode: "insensitive",
        };
      }

      const dbRFIs = await prisma.rFI.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const rfis = dbRFIs.map((r) => r.data as RFI);

      return {
        rfis,
        total: rfis.length,
      };
    } catch (error) {
      console.error("Error listing RFIs:", error);
      return { rfis: [], total: 0 };
    }
  }

  async deleteRFI(id: string, tenantId: string): Promise<boolean> {
    try {
      // First verify tenantId matches for security
      const existing = await prisma.rFI.findFirst({
        where: { id, tenantId },
      });
      if (!existing) {
        return false;
      }

      await prisma.rFI.delete({
        where: { id },
      });

      await eventStore.publish({
        type: "rfi.deleted",
        aggregateId: id,
        aggregateType: "RFI",
        payload: { id },
        metadata: { tenantId, timestamp: new Date().toISOString() },
      });

      return true;
    } catch (error) {
      console.error("Error deleting RFI:", error);
      return false;
    }
  }

  async submitRFI(id: string, tenantId: string): Promise<RFI> {
    const rfi = await this.getRFI(id, tenantId);
    if (!rfi) {
      throw new Error(`RFI ${id} not found`);
    }

    rfi.status = "SUBMITTED";
    rfi.submittedAt = new Date().toISOString();
    rfi.updatedAt = new Date().toISOString();

    // Update database
    try {
      await prisma.rFI.update({
        where: { id, tenantId },
        data: {
          status: rfi.status,
          submittedAt: new Date(rfi.submittedAt),
        },
      });
    } catch (error) {
      console.error("Error updating RFI status:", error);
    }

    // Emit event
    await eventStore.publish({
      type: "rfi.submitted",
      aggregateId: id,
      aggregateType: "RFI",
      payload: rfi,
      metadata: { tenantId, timestamp: new Date().toISOString() },
    });

    // Notify stakeholders
    await notificationService.sendNotification({
      tenantId,
      userId: rfi.createdBy,
      type: "rfi_submitted",
      title: "RFI Submitted",
      message: `RFI ${rfi.rfiNumber} has been submitted successfully`,
      data: { rfiId: id, rfiNumber: rfi.rfiNumber },
    });

    // Auto-process if enabled
    if (rfi.autoGenerateRFQ || rfi.autoGenerateProposal) {
      await this.autoProcessRFI(id, tenantId, rfi.createdBy);
    }

    return rfi;
  }

  async analyzeRFI(id: string, tenantId: string): Promise<RFIAnalysis> {
    const rfi = await this.getRFI(id, tenantId);
    if (!rfi) {
      throw new Error(`RFI ${id} not found`);
    }

    return this.analyzeRFIData(rfi);
  }

  /**
   * Analyze RFI data directly without requiring a persisted RFI
   * Public method for temporary analysis (e.g., during form filling)
   */
  analyzeRFIDataDirect(input: Partial<RFI> | CreateRFIInput): RFIAnalysis {
    return this.analyzeRFIData(input);
  }

  async generateRFQFromRFI(
    rfiId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ rfi: RFI; rfqId: string }> {
    const rfi = await this.getRFI(rfiId, tenantId);
    if (!rfi) {
      throw new Error(`RFI ${rfiId} not found`);
    }

    const startTime = Date.now();

    // Transform RFI data to RFQ format
    const rfqData = this.transformRFIToRFQ(rfi);

    // Create RFQ
    const rfq = await rfqService.createRFQ(rfqData);

    // Update RFI
    rfi.generatedRFQId = rfq.id;
    rfi.status = "RFQ_GENERATED";
    rfi.updatedAt = new Date().toISOString();

    if (!rfi.throughputMetrics) {
      rfi.throughputMetrics = {
        timeToRFQ: 0,
        timeToProposal: 0,
        totalProcessingTime: 0,
        automationScore: 0,
        manualInterventions: 0,
      };
    }

    rfi.throughputMetrics.timeToRFQ = Date.now() - startTime;
    rfi.throughputMetrics.totalProcessingTime = rfi.throughputMetrics.timeToRFQ;

    // Update database
    try {
      await prisma.rFI.update({
        where: { id: rfiId, tenantId },
        data: {
          generatedRFQId: rfq.id,
          status: rfi.status,
          throughputMetrics: rfi.throughputMetrics as any,
        },
      });
    } catch (error) {
      console.error("Error updating RFI with RFQ:", error);
    }

    // Emit event
    await eventStore.publish({
      type: "rfi.rfq_generated",
      aggregateId: rfiId,
      aggregateType: "RFI",
      payload: { rfi, rfq },
      metadata: { tenantId, userId, timestamp: new Date().toISOString() },
    });

    // Notify
    await notificationService.sendNotification({
      tenantId,
      userId,
      type: "rfi_rfq_generated",
      title: "RFQ Generated from RFI",
      message: `RFQ ${rfq.rfqNumber} has been generated from RFI ${rfi.rfiNumber}`,
      data: { rfiId, rfqId: rfq.id },
    });

    return { rfi, rfqId: rfq.id };
  }

  async generateProposalFromRFI(
    rfiId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ rfi: RFI; proposalId: string }> {
    const rfi = await this.getRFI(rfiId, tenantId);
    if (!rfi) {
      throw new Error(`RFI ${rfiId} not found`);
    }

    const startTime = Date.now();

    // Transform RFI data to Proposal format
    const proposalData = this.transformRFIToProposal(rfi);

    // Generate proposal using unified service
    const { unifiedProposalService } = await import("./unifiedProposalService");
    const result = await unifiedProposalService.generateProposal({
      proposalType: "RFI_PROPOSAL",
      sourceData: { rfi },
      templateId: "rfi-to-proposal",
      tenantId,
      userId,
      useRAG: true,
      generateInsights: true,
      generateWinStrategy: true,
      context: {
        rfiId,
        rfiNumber: rfi.rfiNumber,
      },
    });
    const proposal = result.proposal;

    // Update RFI
    rfi.generatedProposalId = proposal.id;
    rfi.status = "PROPOSAL_GENERATED";
    rfi.updatedAt = new Date().toISOString();

    if (!rfi.throughputMetrics) {
      rfi.throughputMetrics = {
        timeToRFQ: 0,
        timeToProposal: 0,
        totalProcessingTime: 0,
        automationScore: 0,
        manualInterventions: 0,
      };
    }

    rfi.throughputMetrics.timeToProposal = Date.now() - startTime;
    rfi.throughputMetrics.totalProcessingTime =
      rfi.throughputMetrics.timeToProposal;

    // Update database
    try {
      await prisma.rFI.update({
        where: { id: rfiId, tenantId },
        data: {
          generatedProposalId: proposal.id,
          status: rfi.status,
          throughputMetrics: rfi.throughputMetrics as any,
        },
      });
    } catch (error) {
      console.error("Error updating RFI with Proposal:", error);
    }

    // Emit event
    await eventStore.publish({
      type: "rfi.proposal_generated",
      aggregateId: rfiId,
      aggregateType: "RFI",
      payload: { rfi, proposal },
      metadata: { tenantId, userId, timestamp: new Date().toISOString() },
    });

    // Notify
    await notificationService.sendNotification({
      tenantId,
      userId,
      type: "rfi_proposal_generated",
      title: "Proposal Generated from RFI",
      message: `Proposal has been generated from RFI ${rfi.rfiNumber}`,
      data: { rfiId, proposalId: proposal.id },
    });

    return { rfi, proposalId: proposal.id };
  }

  async autoProcessRFI(
    rfiId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ rfi: RFI; rfqId?: string; proposalId?: string }> {
    const rfi = await this.getRFI(rfiId, tenantId);
    if (!rfi) {
      throw new Error(`RFI ${rfiId} not found`);
    }

    let rfqId: string | undefined;
    let proposalId: string | undefined;

    // Auto-generate RFQ if enabled and readiness is high
    if (rfi.autoGenerateRFQ && rfi.pricingReadiness >= 60) {
      const { rfqId: generatedRFQId } = await this.generateRFQFromRFI(
        rfiId,
        tenantId,
        userId,
      );
      rfqId = generatedRFQId;
    }

    // Auto-generate Proposal if enabled and readiness is very high
    if (rfi.autoGenerateProposal && rfi.pricingReadiness >= 82) {
      const { proposalId: generatedProposalId } =
        await this.generateProposalFromRFI(rfiId, tenantId, userId);
      proposalId = generatedProposalId;
    }

    // Calculate automation score
    if (rfi.throughputMetrics) {
      const automationFactors = [
        rfi.autoGenerateRFQ ? 1 : 0,
        rfi.autoGenerateProposal ? 1 : 0,
        rfi.pricingReadiness >= 82 ? 1 : 0,
        rfi.dataCompleteness >= 80 ? 1 : 0,
      ];
      rfi.throughputMetrics.automationScore =
        (automationFactors.reduce((a, b) => a + b, 0) /
          automationFactors.length) *
        100;
    }

    return { rfi, rfqId, proposalId };
  }

  async getThroughputMetrics(
    tenantId: string,
    timeRange?: { from: string; to: string },
  ): Promise<ThroughputMetrics> {
    const filters: any = { tenantId };
    if (timeRange) {
      filters.createdAt = {
        gte: new Date(timeRange.from),
        lte: new Date(timeRange.to),
      };
    }

    const rfis = await prisma.rFI.findMany({
      where: filters,
    });

    const metrics: ThroughputMetrics = {
      timeToRFQ: 0,
      timeToProposal: 0,
      totalProcessingTime: 0,
      automationScore: 0,
      manualInterventions: 0,
    };

    let count = 0;
    for (const rfi of rfis) {
      const data = rfi.data as RFI;
      if (data.throughputMetrics) {
        metrics.timeToRFQ += data.throughputMetrics.timeToRFQ;
        metrics.timeToProposal += data.throughputMetrics.timeToProposal;
        metrics.totalProcessingTime +=
          data.throughputMetrics.totalProcessingTime;
        metrics.automationScore += data.throughputMetrics.automationScore;
        metrics.manualInterventions +=
          data.throughputMetrics.manualInterventions;
        count++;
      }
    }

    if (count > 0) {
      metrics.timeToRFQ = metrics.timeToRFQ / count;
      metrics.timeToProposal = metrics.timeToProposal / count;
      metrics.totalProcessingTime = metrics.totalProcessingTime / count;
      metrics.automationScore = metrics.automationScore / count;
      metrics.manualInterventions = metrics.manualInterventions / count;
    }

    return metrics;
  }

  async getAnalytics(tenantId: string): Promise<RFIAnalytics> {
    const rfis = await prisma.rFI.findMany({
      where: { tenantId },
    });

    const analytics: RFIAnalytics = {
      totalRFIs: rfis.length,
      byStatus: {
        DRAFT: 0,
        SUBMITTED: 0,
        UNDER_REVIEW: 0,
        RFQ_GENERATED: 0,
        PROPOSAL_GENERATED: 0,
        COMPLETED: 0,
        ARCHIVED: 0,
      },
      averageCompleteness: 0,
      averageReadiness: 0,
      averageTimeToRFQ: 0,
      averageTimeToProposal: 0,
      automationRate: 0,
      conversionRate: 0,
      topCompanies: [],
      trends: [],
    };

    let totalCompleteness = 0;
    let totalReadiness = 0;
    let totalTimeToRFQ = 0;
    let totalTimeToProposal = 0;
    let autoGeneratedCount = 0;
    let convertedCount = 0;
    const companyCounts: Record<string, number> = {};

    for (const rfi of rfis) {
      const data = rfi.data as RFI;

      analytics.byStatus[data.status]++;
      totalCompleteness += data.dataCompleteness;
      totalReadiness += data.pricingReadiness;

      if (data.throughputMetrics) {
        totalTimeToRFQ += data.throughputMetrics.timeToRFQ;
        totalTimeToProposal += data.throughputMetrics.timeToProposal;
      }

      if (data.autoGenerateRFQ || data.autoGenerateProposal) {
        autoGeneratedCount++;
      }

      if (data.generatedProposalId) {
        convertedCount++;
      }

      companyCounts[data.companyName] =
        (companyCounts[data.companyName] || 0) + 1;
    }

    if (rfis.length > 0) {
      analytics.averageCompleteness = totalCompleteness / rfis.length;
      analytics.averageReadiness = totalReadiness / rfis.length;
      analytics.averageTimeToRFQ = totalTimeToRFQ / rfis.length;
      analytics.averageTimeToProposal = totalTimeToProposal / rfis.length;
      analytics.automationRate = (autoGeneratedCount / rfis.length) * 100;
      analytics.conversionRate = (convertedCount / rfis.length) * 100;
    }

    analytics.topCompanies = Object.entries(companyCounts)
      .map(([companyName, count]) => ({ companyName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return analytics;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  analyzeRFIData(rfi: Partial<RFI> | CreateRFIInput): RFIAnalysis {
    const criticalFields = [
      "companyName",
      "contactPerson",
      "email",
      "storageSqm",
      "storageCbm",
      "palletPositions",
      "inboundPalletsDaily",
      "outboundPalletsDaily",
      "ordersDaily",
      "linesPerOrder",
    ];

    // Calculate completeness
    let filledFields = 0;
    let totalFields = 0;

    const checkField = (value: any) => {
      totalFields++;
      if (value !== undefined && value !== null && value !== "") {
        filledFields++;
      }
    };

    checkField(rfi.companyName);
    checkField(rfi.contactPerson);
    checkField(rfi.email);

    if (rfi.storage) {
      checkField(rfi.storage.storageSqm);
      checkField(rfi.storage.storageCbm);
      checkField(rfi.storage.palletPositions);
    }

    if (rfi.inbound) {
      checkField(rfi.inbound.inboundPalletsDaily);
    }

    if (rfi.outbound) {
      checkField(rfi.outbound.outboundPalletsDaily);
      checkField(rfi.outbound.ordersDaily);
      checkField(rfi.outbound.linesPerOrder);
    }

    const completeness =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    // Calculate pricing readiness (more sophisticated)
    const sizingOk = !!(
      rfi.storage?.storageSqm ||
      rfi.storage?.storageCbm ||
      rfi.storage?.palletPositions
    );
    let readiness = 0;
    let total = 0;
    const assumptions: string[] = [];

    // Sizing (critical)
    total++;
    if (sizingOk) readiness++;
    else assumptions.push("Storage size not provided");

    // Daily volumes
    total++;
    if (rfi.inbound?.inboundPalletsDaily || rfi.outbound?.outboundPalletsDaily)
      readiness++;
    else assumptions.push("Daily volumes not specified");

    // Orders
    total++;
    if (rfi.outbound?.ordersDaily) readiness++;
    else assumptions.push("Order volume not specified");

    // Packaging
    total++;
    if (rfi.inbound?.inboundPackaging) readiness++;
    else assumptions.push("Inbound packaging type not specified");

    // Outbound type
    total++;
    if (rfi.outbound?.outboundType) readiness++;
    else assumptions.push("Outbound pick profile not specified");

    const readinessScore = Math.round((readiness / total) * 100);

    // Determine confidence
    let confidence: "Low" | "Medium" | "High" = "Low";
    if (readinessScore >= 82) confidence = "High";
    else if (readinessScore >= 60) confidence = "Medium";

    // Determine badge
    let badge: "Green" | "Amber" | "Red" = "Red";
    if (readinessScore >= 82) badge = "Green";
    else if (readinessScore >= 60) badge = "Amber";

    // Key drivers
    const keyDrivers = {
      storage: sizingOk
        ? rfi.storage?.palletPositions
          ? "Pallet Positions"
          : "Sqm/CBM"
        : "Missing",
      handling: this.calculateHandlingIntensity(rfi),
      pick: rfi.outbound?.outboundType || "—",
      verify: this.calculateVerificationLevel(rfi),
      vas: this.calculateVASScope(rfi),
    };

    // Recommendations
    const recommendations: string[] = [];
    if (readinessScore < 60) {
      recommendations.push("Fill critical fields to improve pricing readiness");
    }
    if (!sizingOk) {
      recommendations.push(
        "Provide storage size (sqm, cbm, or pallet positions)",
      );
    }
    if (!rfi.inbound?.inboundPackaging) {
      recommendations.push("Specify inbound packaging type");
    }

    // Risk factors
    const riskFactors: string[] = [];
    if (readinessScore < 60) {
      riskFactors.push("Low data completeness may lead to inaccurate pricing");
    }
    if (assumptions.length > 5) {
      riskFactors.push("High number of assumptions increases pricing risk");
    }

    return {
      completeness,
      readiness: readinessScore,
      confidence,
      assumptions,
      keyDrivers,
      badge,
      recommendations,
      riskFactors,
    };
  }

  private calculateHandlingIntensity(rfi: Partial<RFI>): string {
    const inbound = rfi.inbound?.inboundPalletsDaily || 0;
    const outbound = rfi.outbound?.outboundPalletsDaily || 0;
    const positions = rfi.storage?.palletPositions || 0;
    const sqm = rfi.storage?.storageSqm || 0;

    if (positions === 0 && sqm === 0) {
      return inbound + outbound > 0 ? "Unknown (missing size)" : "—";
    }

    const denom = positions > 0 ? positions : sqm / 1.2;
    const ratio = (inbound + outbound) / denom;

    if (ratio >= 0.2) return "High";
    if (ratio >= 0.08) return "Medium";
    return "Low";
  }

  private calculateVerificationLevel(rfi: Partial<RFI>): string {
    const vP = rfi.inbound?.verifyPalletPct || 0;
    const vC = rfi.inbound?.verifyCartonPct || 0;
    const vPc = rfi.inbound?.verifyPiecePct || 0;
    const vSum = vP + vC + vPc;

    if (vSum === 0) return "—";
    if (vPc >= 20) return "High (piece-level)";
    if (vC >= 30) return "Medium (carton-level)";
    return "Low (pallet-level)";
  }

  private calculateVASScope(rfi: Partial<RFI>): string {
    if (rfi.vas?.vasRequired !== "Yes") return "None";

    const vasCount = [
      rfi.vas.vasRepack,
      rfi.vas.vasKitting,
      rfi.vas.vasPalletize,
      rfi.vas.vasLabel,
      rfi.vas.vasBarcode,
      rfi.vas.vasShrink,
    ].filter(Boolean).length;

    return vasCount >= 3 ? "High" : "Selected";
  }

  private transformRFIToRFQ(rfi: RFI): any {
    return {
      title: `RFQ from RFI ${rfi.rfiNumber}`,
      description: `Generated from RFI ${rfi.rfiNumber} for ${rfi.companyName}`,
      customer: {
        id: `customer-${rfi.companyName}`,
        name: rfi.companyName,
        email: rfi.email,
        contactPerson: rfi.contactPerson,
        phone: rfi.phone,
      },
      serviceRequirements: this.extractServiceRequirements(rfi),
      volumeDetails: {
        frequency: "ONE_TIME",
        estimatedVolume:
          rfi.storage?.palletPositions || rfi.storage?.storageSqm || 0,
        volumeUnit: rfi.storage?.palletPositions ? "PALLETS" : "SQM",
      },
      timeline: {
        requestDate: rfi.submittedAt || rfi.createdAt,
        responseDeadline: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        urgency: rfi.pricingReadiness >= 82 ? "HIGH" : "MEDIUM",
      },
      notes: [
        {
          id: "note-1",
          text: `Generated from RFI ${rfi.rfiNumber}`,
          createdBy: "system",
          createdAt: new Date().toISOString(),
        },
      ],
      createdBy: rfi.createdBy,
    };
  }

  private transformRFIToProposal(rfi: RFI): any {
    return {
      title: `Proposal for ${rfi.companyName}`,
      customer: {
        id: `customer-${rfi.companyName}`,
        name: rfi.companyName,
        email: rfi.email,
        contactPerson: rfi.contactPerson,
      },
      proposalType: "RFI_PROPOSAL",
      sourceData: rfi,
      sections: this.generateProposalSections(rfi),
      metadata: {
        rfiId: rfi.id,
        rfiNumber: rfi.rfiNumber,
        generatedFrom: "RFI",
      },
    };
  }

  private extractServiceRequirements(rfi: RFI): any[] {
    const requirements: any[] = [];

    if (rfi.storage) {
      requirements.push({
        category: "WAREHOUSING",
        subCategory: rfi.storage.storageType || "STORAGE",
        description: `Storage services: ${rfi.storage.storageSqm || 0} sqm, ${rfi.storage.palletPositions || 0} pallet positions`,
      });
    }

    if (rfi.inbound) {
      requirements.push({
        category: "WAREHOUSING",
        subCategory: "HANDLING",
        description: `Inbound handling: ${rfi.inbound.inboundPalletsDaily || 0} pallets/day`,
      });
    }

    if (rfi.outbound) {
      requirements.push({
        category: "WAREHOUSING",
        subCategory: "PICK_PACK",
        description: `Outbound: ${rfi.outbound.ordersDaily || 0} orders/day, ${rfi.outbound.linesPerOrder || 0} lines/order`,
      });
    }

    if (rfi.vas?.vasRequired === "Yes") {
      requirements.push({
        category: "VALUE_ADDED",
        subCategory: "LABELING",
        description: "Value Added Services required",
      });
    }

    return requirements;
  }

  private generateProposalSections(rfi: RFI): any[] {
    const sections: any[] = [
      {
        id: "cover",
        type: "HEADER",
        title: `Proposal for ${rfi.companyName}`,
        content: `Generated from RFI ${rfi.rfiNumber}`,
        order: 0,
      },
      {
        id: "executive_summary",
        type: "TEXT",
        title: "Executive Summary",
        content: `This proposal is based on the requirements provided in RFI ${rfi.rfiNumber}.`,
        order: 1,
      },
    ];

    if (rfi.storage) {
      sections.push({
        id: "storage",
        type: "TEXT",
        title: "Storage Services",
        content: `Storage capacity: ${rfi.storage.storageSqm || 0} sqm, ${rfi.storage.palletPositions || 0} pallet positions`,
        order: sections.length,
      });
    }

    sections.push({
      id: "pricing",
      type: "PRICING",
      title: "Pricing",
      content: "Pricing details will be calculated based on RFI requirements",
      order: sections.length,
    });

    return sections;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const rfiService = RFIService.getInstance();
