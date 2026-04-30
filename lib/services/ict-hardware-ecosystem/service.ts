/**
 * ICT Hardware Ecosystem Service
 * Strategic positioning: Saudi Arabia's first localized digital manufacturing node
 */

import {
  ICTProduct,
  ManufacturingPipeline,
  StrategicPartnership,
  Vision2030Metrics,
  ManufacturingStage,
} from "./types";
import { eventBus } from "@/lib/services/event-bus";
import { evidenceService } from "@/lib/services/evidence";
import { prisma } from "@/lib/services/database/prismaClient";
import type { Prisma } from "@prisma/client";

class ICTHardwareEcosystemService {
  /**
   * Register ICT product
   */
  async registerProduct(
    tenantId: string,
    product: Omit<ICTProduct, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ): Promise<ICTProduct> {
    // Store in database
    const saved = await prisma.iCTProduct.create({
      data: {
        tenantId,
        name: product.name,
        description: product.description,
        category: product.category,
        specifications: product.specifications as any,
        manufacturing: product.manufacturing as any,
        localContent: product.localContent as any,
        status: product.status,
      },
    });

    const newProduct: ICTProduct = {
      id: saved.id,
      tenantId: saved.tenantId,
      name: saved.name,
      description: saved.description,
      category: saved.category as any,
      specifications: saved.specifications as any,
      manufacturing: saved.manufacturing as any,
      localContent: saved.localContent as any,
      status: saved.status as any,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };

    // Emit event
    await eventBus.publish("ict-hardware.product.registered", {
      tenantId,
      productId: newProduct.id,
      category: newProduct.category,
      timestamp: new Date(),
    });

    // Log evidence
    await evidenceService.logAction({
      tenantId,
      actor: "system",
      action: "ict-hardware.product.registered",
      entityType: "ict-product",
      entityId: newProduct.id,
      metadata: {
        name: newProduct.name,
        category: newProduct.category,
        localContent: newProduct.localContent.percentage,
      },
    });

    return newProduct;
  }

  /**
   * Get product catalog
   */
  async getProducts(
    tenantId: string,
    category?: string,
  ): Promise<ICTProduct[]> {
    const where: Prisma.ICTProductWhereInput = { tenantId };
    if (category) {
      where.category = category;
    }

    const products = await prisma.iCTProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      name: p.name,
      description: p.description,
      category: p.category as any,
      specifications: p.specifications as any,
      manufacturing: p.manufacturing as any,
      localContent: p.localContent as any,
      status: p.status as any,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Create manufacturing pipeline
   */
  async createPipeline(
    tenantId: string,
    pipeline: Omit<
      ManufacturingPipeline,
      "id" | "tenantId" | "createdAt" | "updatedAt"
    >,
  ): Promise<ManufacturingPipeline> {
    // Store in database
    const saved = await prisma.manufacturingPipeline.create({
      data: {
        tenantId,
        productId: pipeline.productId,
        orderId: pipeline.orderId,
        stage: pipeline.stage,
        currentMachineId: pipeline.currentMachineId,
        quantity: pipeline.quantity,
        completed: pipeline.completed || 0,
        rejected: pipeline.rejected || 0,
        startDate: pipeline.startDate,
        estimatedCompletion: pipeline.estimatedCompletion,
        actualCompletion: pipeline.actualCompletion,
        qualityMetrics: pipeline.qualityMetrics as any,
      },
    });

    const newPipeline: ManufacturingPipeline = {
      id: saved.id,
      tenantId: saved.tenantId,
      productId: saved.productId,
      orderId: saved.orderId || undefined,
      stage: saved.stage as any,
      currentMachineId: saved.currentMachineId || undefined,
      quantity: saved.quantity,
      completed: saved.completed,
      rejected: saved.rejected,
      startDate: saved.startDate || undefined,
      estimatedCompletion: saved.estimatedCompletion || undefined,
      actualCompletion: saved.actualCompletion || undefined,
      qualityMetrics: saved.qualityMetrics as any,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };

    // Emit event
    await eventBus.publish("ict-hardware.pipeline.created", {
      tenantId,
      pipelineId: newPipeline.id,
      productId: newPipeline.productId,
      stage: newPipeline.stage,
      timestamp: new Date(),
    });

    return newPipeline;
  }

  /**
   * Get manufacturing pipelines
   */
  async getPipelines(
    tenantId: string,
    stage?: ManufacturingStage,
  ): Promise<ManufacturingPipeline[]> {
    const where: Prisma.ManufacturingPipelineWhereInput = { tenantId };
    if (stage) {
      where.stage = stage;
    }

    const pipelines = await prisma.manufacturingPipeline.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return pipelines.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      productId: p.productId,
      orderId: p.orderId || undefined,
      stage: p.stage as any,
      currentMachineId: p.currentMachineId || undefined,
      quantity: p.quantity,
      completed: p.completed,
      rejected: p.rejected,
      startDate: p.startDate || undefined,
      estimatedCompletion: p.estimatedCompletion || undefined,
      actualCompletion: p.actualCompletion || undefined,
      qualityMetrics: p.qualityMetrics as any,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Update pipeline stage
   */
  async updatePipelineStage(
    tenantId: string,
    pipelineId: string,
    stage: ManufacturingStage,
    userId: string,
  ): Promise<void> {
    // Update in database
    await prisma.manufacturingPipeline.update({
      where: { id: pipelineId },
      data: {
        stage,
        updatedAt: new Date(),
      },
    });

    await eventBus.publish("ict-hardware.pipeline.stage.updated", {
      tenantId,
      pipelineId,
      stage,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Register strategic partnership
   */
  async registerPartnership(
    tenantId: string,
    partnership: Omit<
      StrategicPartnership,
      "id" | "tenantId" | "createdAt" | "updatedAt"
    >,
  ): Promise<StrategicPartnership> {
    // Store in database
    const saved = await prisma.strategicPartnership.create({
      data: {
        tenantId,
        partnerName: partnership.partnerName,
        partnerType: partnership.partnerType,
        description: partnership.description,
        status: partnership.status,
        alignment: partnership.alignment as any,
        valueProposition: partnership.valueProposition as any,
        contacts: partnership.contacts as any,
        documents: partnership.documents || [],
      },
    });

    const newPartnership: StrategicPartnership = {
      id: saved.id,
      tenantId: saved.tenantId,
      partnerName: saved.partnerName,
      partnerType: saved.partnerType as any,
      description: saved.description,
      status: saved.status as any,
      alignment: saved.alignment as any,
      valueProposition: saved.valueProposition as any,
      contacts: saved.contacts as any,
      documents: saved.documents || undefined,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };

    // Emit event
    await eventBus.publish("ict-hardware.partnership.registered", {
      tenantId,
      partnershipId: newPartnership.id,
      partnerName: newPartnership.partnerName,
      partnerType: newPartnership.partnerType,
      timestamp: new Date(),
    });

    return newPartnership;
  }

  /**
   * Get strategic partnerships
   */
  async getPartnerships(
    tenantId: string,
    partnerType?: StrategicPartnership["partnerType"],
  ): Promise<StrategicPartnership[]> {
    const where: Prisma.StrategicPartnershipWhereInput = { tenantId };
    if (partnerType) {
      where.partnerType = partnerType;
    }

    const partnerships = await prisma.strategicPartnership.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return partnerships.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      partnerName: p.partnerName,
      partnerType: p.partnerType as any,
      description: p.description,
      status: p.status as any,
      alignment: p.alignment as any,
      valueProposition: p.valueProposition as any,
      contacts: p.contacts as any,
      documents: p.documents || undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Get Vision 2030 metrics
   */
  async getVision2030Metrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Vision2030Metrics> {
    // Calculate from database
    const [products, pipelines, partnerships] = await Promise.all([
      prisma.iCTProduct.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.manufacturingPipeline.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.strategicPartnership.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Calculate local content
    const localContentProducts = products.filter((p) => {
      const localContent = p.localContent as any;
      return localContent?.percentage >= 30;
    });
    const avgLocalContent =
      products.length > 0
        ? products.reduce((sum, p) => {
            const localContent = p.localContent as any;
            return sum + (localContent?.percentage || 0);
          }, 0) / products.length
        : 0;

    // Calculate manufacturing metrics
    const activePipelines = pipelines.filter(
      (p) => !["shipped", "completed"].includes(p.stage),
    );
    const completedPipelines = pipelines.filter(
      (p) => p.stage === "shipped" && p.actualCompletion !== null,
    );

    // Calculate partnership metrics
    const activePartnerships = partnerships.filter(
      (p) => p.status === "active",
    );
    const governmentPartnerships = partnerships.filter(
      (p) => p.partnerType === "government",
    );
    const industrialPartnerships = partnerships.filter(
      (p) => p.partnerType === "industrial",
    );

    return {
      tenantId,
      period: { start: startDate, end: endDate },
      localContent: {
        target: 30,
        actual: Math.round(avgLocalContent),
        products: localContentProducts.length,
      },
      manufacturing: {
        totalProducts: products.length,
        activePipelines: activePipelines.length,
        completedOrders: completedPipelines.length,
      },
      partnerships: {
        total: partnerships.length,
        active: activePartnerships.length,
        government: governmentPartnerships.length,
        industrial: industrialPartnerships.length,
      },
      impact: {
        jobsCreated: completedPipelines.length * 5, // Estimate: 5 jobs per completed order
        technologyTransfer: activePartnerships.filter((p) => {
          const alignment = p.alignment as any;
          return alignment?.technologyTransfer === true;
        }).length,
        exports: completedPipelines.length, // Estimate: 1 export per completed order
        importsReplaced: localContentProducts.length, // Products with local content replace imports
      },
    };
  }

  /**
   * Calculate local content percentage
   */
  async calculateLocalContent(productId: string): Promise<number> {
    // Calculate based on product components
    const product = await prisma.iCTProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const localContent = product.localContent as any;
    if (localContent?.percentage !== undefined) {
      return localContent.percentage;
    }

    // Calculate from components if available
    if (localContent?.components && Array.isArray(localContent.components)) {
      const totalPercentage = localContent.components.reduce(
        (sum: number, comp: any) => sum + (comp.percentage || 0),
        0,
      );
      const localComponents = localContent.components.filter(
        (comp: any) => comp.source === "local",
      );
      const localPercentage = localComponents.reduce(
        (sum: number, comp: any) => sum + (comp.percentage || 0),
        0,
      );
      return totalPercentage > 0
        ? (localPercentage / totalPercentage) * 100
        : 0;
    }

    return 0;
  }
}

export const ictHardwareEcosystemService = new ICTHardwareEcosystemService();
