import { prisma } from "../database/prismaClient";
import type { MaterialMaster } from "@prisma/client";

export type CreateMaterialInput = {
  tenantId: string;
  materialNumber: string;
  description: string;
  category?: string;
  type?: string;
  baseUnit?: string;
  weight?: number;
  volume?: number;
  standardPrice?: number;
  currency?: string;
  isHazardous?: boolean;
  hazmatClass?: string;
  isBatchManaged?: boolean;
  isSerialManaged?: boolean;
  requiresTempControl?: boolean;
};

export class MaterialService {
  /**
   * Create or Update a Material Master Record
   */
  static async upsertMaterial(
    data: CreateMaterialInput,
  ): Promise<MaterialMaster> {
    return await prisma.materialMaster.upsert({
      where: {
        tenantId_materialNumber: {
          tenantId: data.tenantId,
          materialNumber: data.materialNumber,
        },
      },
      update: {
        description: data.description,
        category: data.category,
        type: data.type,
        baseUnit: data.baseUnit,
        weight: data.weight,
        volume: data.volume,
        standardPrice: data.standardPrice,
        currency: data.currency,
        isHazardous: data.isHazardous,
        hazmatClass: data.hazmatClass,
        isBatchManaged: data.isBatchManaged,
        isSerialManaged: data.isSerialManaged,
        requiresTempControl: data.requiresTempControl,
      },
      create: {
        ...data,
        category: data.category || "GENERAL",
        type: data.type || "FINISHED_GOOD",
        baseUnit: data.baseUnit || "EA",
        standardPrice: data.standardPrice || 0,
        currency: data.currency || "SAR",
      },
    });
  }

  /**
   * Get Material by SKU (with caching implication likely needed later)
   */
  static async getMaterial(
    tenantId: string,
    materialNumber: string,
  ): Promise<MaterialMaster | null> {
    return await prisma.materialMaster.findUnique({
      where: {
        tenantId_materialNumber: {
          tenantId,
          materialNumber,
        },
      },
    });
  }

  /**
   * Search Materials
   */
  static async searchMaterials(tenantId: string, query: string) {
    return await prisma.materialMaster.findMany({
      where: {
        tenantId,
        OR: [
          { materialNumber: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 50,
    });
  }

  /**
   * Get All Materials for a Tenant
   */
  static async getAllMaterials(tenantId: string) {
    return await prisma.materialMaster.findMany({
      where: { tenantId },
      orderBy: { materialNumber: "asc" },
    });
  }
}
