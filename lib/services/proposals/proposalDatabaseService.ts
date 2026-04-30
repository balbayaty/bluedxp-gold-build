/**
 * Proposal Database Service
 * Prisma-based persistence layer for proposals
 *
 * NOTE: This service uses Prisma for standard proposal operations.
 * For universal proposals with multi-database support, see universalProposalDatabaseAdapter.
 * Both can work together - this service is simpler and faster for standard operations.
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// PROPOSAL DATABASE OPERATIONS
// ============================================================================

export class ProposalDatabaseService {
  /**
   * Create proposal in database
   */
  async createProposal(data: {
    id?: string; // Optional: if provided, use this ID instead of auto-generating
    tenantId: string;
    proposalNumber: string;
    title: string;
    description?: string;
    executiveSummary?: string;
    proposalType: string;
    status: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    rfqId?: string;
    rfqReference?: string;
    sections: any[];
    pricing: any;
    totalAmount?: number;
    currency?: string;
    branding?: any;
    validUntil?: Date;
    recipients?: any[];
    metadata?: any;
    tags?: string[];
    trackingEnabled?: boolean;
    signatureRequired?: boolean;
    createdBy: string;
  }) {
    const createData: any = {
      ...data,
      sections: data.sections as any,
      pricing: data.pricing as any,
      branding: data.branding as any,
      recipients: data.recipients as any,
      metadata: data.metadata as any,
      tags: data.tags || [],
      totalAmount: data.totalAmount ? data.totalAmount.toString() : null,
    };

    // If ID is provided, use it (for proposals created with specific IDs)
    if (data.id) {
      createData.id = data.id;
    }

    // Optimize: Only include necessary fields, avoid heavy includes
    const startTime = Date.now();

    // Add timeout protection for database operation
    const createPromise = prisma.proposal.create({
      data: createData,
      // Don't include relations on create - they're not needed and slow down the query
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database operation timeout after 5 seconds")),
        5000,
      ),
    );

    const result = (await Promise.race([createPromise, timeoutPromise])) as any;

    const duration = Date.now() - startTime;
    if (duration > 1000) {
      console.warn(
        `[ProposalDatabaseService] Slow create operation: ${duration}ms`,
      );
    }
    if (duration > 5000) {
      console.error(
        `[ProposalDatabaseService] ⚠️ VERY SLOW create operation: ${duration}ms - Database may be overloaded`,
      );
    }
    return result;
  }

  /**
   * Get proposal by ID
   */
  async getProposal(proposalId: string) {
    return await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        rfq: true,
        collaborations: true,
        tracking: true,
        signatures: true,
        translations: true,
        abTests: true,
        followUps: true,
        richMedia: true,
        interactive: true,
        versions: true,
        comments: true,
      },
    });
  }

  /**
   * List proposals with filters
   */
  async listProposals(filters: {
    tenantId?: string;
    status?: string;
    proposalType?: string;
    customerId?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.status) where.status = filters.status;
    if (filters.proposalType) where.proposalType = filters.proposalType;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.createdBy) where.createdBy = filters.createdBy;

    return await prisma.proposal.findMany({
      where,
      include: {
        tracking: true,
        signatures: true,
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  /**
   * Update proposal
   */
  async updateProposal(proposalId: string, updates: any) {
    const updateData: any = { ...updates };

    // Convert decimal amounts
    if (updates.totalAmount !== undefined) {
      updateData.totalAmount = updates.totalAmount.toString();
    }

    // Convert JSON fields
    if (updates.sections) updateData.sections = updates.sections as any;
    if (updates.pricing) updateData.pricing = updates.pricing as any;
    if (updates.branding) updateData.branding = updates.branding as any;
    if (updates.recipients) updateData.recipients = updates.recipients as any;
    if (updates.metadata) updateData.metadata = updates.metadata as any;

    return await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
    });
  }

  /**
   * Delete proposal
   */
  async deleteProposal(proposalId: string) {
    return await prisma.proposal.delete({
      where: { id: proposalId },
    });
  }

  /**
   * Create RFQ
   */
  async createRFQ(data: {
    tenantId: string;
    rfqNumber: string;
    title: string;
    description?: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    status: string;
    priority: string;
    dueDate: Date;
    submissionDeadline: Date;
    requirements: any[];
    serviceCategories: string[];
    budget?: number;
    currency?: string;
    metadata?: any;
    tags?: string[];
    source?: string;
    sourceId?: string;
    createdBy: string;
  }) {
    return await (prisma as any).rFQ.create({
      data: {
        ...data,
        requirements: data.requirements as any,
        serviceCategories: data.serviceCategories || [],
        metadata: data.metadata as any,
        tags: data.tags || [],
        budget: data.budget ? data.budget.toString() : null,
      },
    });
  }

  /**
   * Get RFQ by ID
   */
  async getRFQ(rfqId: string) {
    return await (prisma as any).rFQ.findUnique({
      where: { id: rfqId },
      include: {
        proposals: true,
      },
    });
  }

  /**
   * Create tracking record
   */
  async createTracking(data: {
    proposalId: string;
    recipients: any[];
    totalOpens?: number;
    totalViews?: number;
    totalDownloads?: number;
    totalClicks?: number;
    engagementScore?: number;
    conversionProbability?: number;
    heatmap?: any;
  }) {
    return await prisma.proposalTracking.create({
      data: {
        ...data,
        recipients: data.recipients as any,
        heatmap: data.heatmap as any,
        engagementScore: data.engagementScore?.toString() || "0",
        conversionProbability: data.conversionProbability?.toString(),
      },
    });
  }

  /**
   * Update tracking
   */
  async updateTracking(proposalId: string, updates: any) {
    const updateData: any = { ...updates };
    if (updates.recipients) updateData.recipients = updates.recipients as any;
    if (updates.heatmap) updateData.heatmap = updates.heatmap as any;
    if (updates.engagementScore !== undefined) {
      updateData.engagementScore = updates.engagementScore.toString();
    }
    if (updates.conversionProbability !== undefined) {
      updateData.conversionProbability =
        updates.conversionProbability.toString();
    }

    return await prisma.proposalTracking.update({
      where: { proposalId },
      data: updateData,
    });
  }

  /**
   * Create collaboration
   */
  async createCollaboration(data: {
    proposalId: string;
    userId: string;
    userName: string;
    role: string;
    addedBy: string;
  }) {
    return await prisma.proposalCollaboration.create({
      data,
    });
  }

  /**
   * Create comment
   */
  async createComment(data: {
    proposalId: string;
    sectionId?: string;
    userId: string;
    userName: string;
    content: string;
    parentId?: string;
    mentions?: string[];
  }) {
    return await prisma.proposalComment.create({
      data: {
        ...data,
        mentions: data.mentions || [],
      },
    });
  }

  /**
   * Create version
   */
  async createVersion(data: {
    proposalId: string;
    version: number;
    proposalData: any;
    createdBy: string;
  }) {
    return await prisma.proposalVersion.create({
      data: {
        ...data,
        proposalData: data.proposalData as any,
      },
    });
  }

  /**
   * Create content block
   */
  async createContentBlock(data: {
    tenantId: string;
    title: string;
    content: string;
    category: string;
    tags?: string[];
    type: string;
    status?: string;
    createdBy: string;
    metadata?: any;
  }) {
    return await prisma.contentBlockLibrary.create({
      data: {
        ...data,
        tags: data.tags || [],
        status: data.status || "DRAFT",
        metadata: data.metadata as any,
      },
    });
  }

  /**
   * Get content blocks
   */
  async getContentBlocks(filters: {
    tenantId?: string;
    category?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;

    return await prisma.contentBlockLibrary.findMany({
      where,
      orderBy: { usageCount: "desc" },
    });
  }
}

export const proposalDatabaseService = new ProposalDatabaseService();
