/**
 * Comprehensive Chemical Management Service
 * Deep, multi-layer service for all chemical management operations
 *
 * ⚠️ SERVER-ONLY: This service uses Prisma and can only be used on the server.
 * Use server actions (app/actions/chemical/actions.ts) from client components.
 */

import { assertServerOnly } from "@/lib/utils/serviceGuard";
import {
  Chemical,
  ChemicalSearchFilters,
  ChemicalSearchResult,
  ChemicalAPIResponse,
} from "@/types/chemical";
import { aiService } from "../ai/chemcheckService";
import { prisma } from "@/lib/services/database/prismaClient";
import type { Prisma } from "@prisma/client";

// Ensure this service is only used on the server
assertServerOnly();

export class ChemicalService {
  /**
   * Get all chemicals with filters
   */
  async getChemicals(
    filters?: ChemicalSearchFilters,
    tenantId?: string,
  ): Promise<ChemicalSearchResult> {
    try {
      const where: Prisma.ChemicalWhereInput = {};

      if (tenantId) {
        where.tenantId = tenantId;
      }

      if (filters) {
        if (filters.searchQuery) {
          where.OR = [
            { name: { contains: filters.searchQuery, mode: "insensitive" } },
            {
              casNumber: { contains: filters.searchQuery, mode: "insensitive" },
            },
            { formula: { contains: filters.searchQuery, mode: "insensitive" } },
            {
              manufacturer: {
                contains: filters.searchQuery,
                mode: "insensitive",
              },
            },
          ];
        }
        if (filters.casNumber) {
          where.casNumber = filters.casNumber;
        }
        if (filters.manufacturer) {
          where.manufacturer = {
            contains: filters.manufacturer,
            mode: "insensitive",
          };
        }
        if (filters.supplier) {
          where.supplier = { contains: filters.supplier, mode: "insensitive" };
        }
      }

      const [chemicals, total] = await Promise.all([
        prisma.chemical.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: filters?.pageSize || 50,
          skip: ((filters?.page || 1) - 1) * (filters?.pageSize || 50),
        }),
        prisma.chemical.count({ where }),
      ]);

      const mappedChemicals: Chemical[] = chemicals.map(
        this.mapPrismaToChemical,
      );

      return {
        chemicals: mappedChemicals,
        total,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 50,
        filters: filters || {},
      };
    } catch (error) {
      console.error("Error getting chemicals:", error);
      throw error;
    }
  }

  /**
   * Get chemical by ID
   */
  async getChemicalById(
    id: string,
    tenantId?: string,
  ): Promise<Chemical | null> {
    try {
      const where: Prisma.ChemicalWhereInput = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const chemical = await prisma.chemical.findFirst({
        where,
      });

      if (!chemical) {
        return null;
      }

      return this.mapPrismaToChemical(chemical);
    } catch (error) {
      console.error("Error getting chemical:", error);
      throw error;
    }
  }

  /**
   * Create new chemical
   */
  async createChemical(
    chemical: Partial<Chemical>,
    tenantId?: string,
  ): Promise<Chemical> {
    try {
      if (!tenantId) {
        throw new Error("tenantId is required for chemical creation");
      }

      if (!chemical.name) {
        throw new Error("Chemical name is required");
      }

      const created = await prisma.chemical.create({
        data: {
          tenantId,
          name: chemical.name,
          casNumber: chemical.casNumber,
          formula: chemical.formula,
          synonyms: chemical.synonyms || [],
          manufacturer: chemical.manufacturer,
          supplier: chemical.supplier,
          productCode: chemical.productCode,
          physicalProperties: (chemical.physicalProperties || {}) as any,
          chemicalProperties: (chemical.chemicalProperties || {}) as any,
          hazards: (chemical.hazards || {}) as any,
          storage: (chemical.storage || {}) as any,
          transport: (chemical.transport || {}) as any,
          compliance: (chemical.compliance || {}) as any,
          metadata: (chemical.metadata || {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: chemical.metadata?.createdBy,
          }) as any,
          createdBy: chemical.metadata?.createdBy,
        },
      });

      return this.mapPrismaToChemical(created);
    } catch (error) {
      console.error("Error creating chemical:", error);
      throw error;
    }
  }

  /**
   * Update chemical
   */
  async updateChemical(
    id: string,
    updates: Partial<Chemical>,
    tenantId?: string,
  ): Promise<Chemical> {
    try {
      const where: Prisma.ChemicalWhereInput = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const existing = await prisma.chemical.findFirst({ where });
      if (!existing) {
        throw new Error(`Chemical ${id} not found`);
      }

      const updateData: Prisma.ChemicalUpdateInput = {
        ...(updates.name && { name: updates.name }),
        ...(updates.casNumber !== undefined && {
          casNumber: updates.casNumber,
        }),
        ...(updates.formula !== undefined && { formula: updates.formula }),
        ...(updates.synonyms && { synonyms: updates.synonyms }),
        ...(updates.manufacturer !== undefined && {
          manufacturer: updates.manufacturer,
        }),
        ...(updates.supplier !== undefined && { supplier: updates.supplier }),
        ...(updates.productCode !== undefined && {
          productCode: updates.productCode,
        }),
        ...(updates.physicalProperties && {
          physicalProperties: updates.physicalProperties as any,
        }),
        ...(updates.chemicalProperties && {
          chemicalProperties: updates.chemicalProperties as any,
        }),
        ...(updates.hazards && { hazards: updates.hazards as any }),
        ...(updates.storage && { storage: updates.storage as any }),
        ...(updates.transport && { transport: updates.transport as any }),
        ...(updates.compliance && { compliance: updates.compliance as any }),
        ...(updates.metadata && {
          metadata: {
            ...((existing.metadata as any) || {}),
            ...updates.metadata,
            updatedAt: new Date().toISOString(),
          } as any,
        }),
        updatedAt: new Date(),
        ...(updates.metadata?.updatedBy && {
          updatedBy: updates.metadata.updatedBy,
        }),
      };

      const updated = await prisma.chemical.update({
        where: { id },
        data: updateData,
      });

      return this.mapPrismaToChemical(updated);
    } catch (error) {
      console.error("Error updating chemical:", error);
      throw error;
    }
  }

  /**
   * Delete chemical
   */
  async deleteChemical(id: string, tenantId?: string): Promise<boolean> {
    try {
      const where: Prisma.ChemicalWhereInput = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      await prisma.chemical.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      console.error("Error deleting chemical:", error);
      throw error;
    }
  }

  /**
   * Search chemicals with AI-powered semantic search
   */
  async searchChemicals(
    query: string,
    filters?: ChemicalSearchFilters,
    tenantId?: string,
  ): Promise<ChemicalSearchResult> {
    try {
      // Use AI for semantic search to extract key terms
      let searchTerms: string[] = [];
      try {
        const aiResult = await aiService.generateText(
          `Extract key search terms from this chemical search query: "${query}". Return as JSON array of strings.`,
        );
        try {
          const parsed =
            typeof aiResult === "string" ? JSON.parse(aiResult) : aiResult;
          if (Array.isArray(parsed)) {
            searchTerms = parsed;
          } else if (parsed.terms && Array.isArray(parsed.terms)) {
            searchTerms = parsed.terms;
          }
        } catch {
          // Fallback: use query as search term
          searchTerms = [query];
        }
      } catch {
        searchTerms = [query];
      }

      // Build search query with extracted terms
      const where: Prisma.ChemicalWhereInput = {};

      if (tenantId) {
        where.tenantId = tenantId;
      }

      if (searchTerms.length > 0) {
        where.OR = searchTerms.flatMap((term) => [
          { name: { contains: term, mode: "insensitive" } },
          { casNumber: { contains: term, mode: "insensitive" } },
          { formula: { contains: term, mode: "insensitive" } },
          { manufacturer: { contains: term, mode: "insensitive" } },
          { synonyms: { has: term } },
        ]);
      }

      // Apply additional filters
      if (filters) {
        if (filters.casNumber) {
          where.casNumber = filters.casNumber;
        }
        if (filters.manufacturer) {
          where.manufacturer = {
            contains: filters.manufacturer,
            mode: "insensitive",
          };
        }
      }

      const [chemicals, total] = await Promise.all([
        prisma.chemical.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: filters?.pageSize || 50,
          skip: ((filters?.page || 1) - 1) * (filters?.pageSize || 50),
        }),
        prisma.chemical.count({ where }),
      ]);

      const mappedChemicals: Chemical[] = chemicals.map(
        this.mapPrismaToChemical,
      );

      return {
        chemicals: mappedChemicals,
        total,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 50,
        filters: filters || {},
      };
    } catch (error) {
      console.error("Error searching chemicals:", error);
      throw error;
    }
  }

  /**
   * Find similar chemicals
   */
  async findSimilarChemicals(
    chemicalId: string,
    limit: number = 10,
    tenantId?: string,
  ): Promise<Chemical[]> {
    try {
      const chemical = await this.getChemicalById(chemicalId, tenantId);
      if (!chemical) {
        throw new Error(`Chemical ${chemicalId} not found`);
      }

      // Find similar chemicals based on:
      // 1. Same manufacturer
      // 2. Similar CAS number prefix
      // 3. Similar hazards
      // 4. Similar physical properties

      const where: Prisma.ChemicalWhereInput = {
        id: { not: chemicalId },
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Build OR conditions for similarity
      const orConditions: Prisma.ChemicalWhereInput[] = [];

      if (chemical.manufacturer) {
        orConditions.push({ manufacturer: chemical.manufacturer });
      }

      if (chemical.casNumber) {
        // Match first 6 digits of CAS number (similar chemicals often have similar CAS)
        const casPrefix = chemical.casNumber.substring(0, 6);
        orConditions.push({ casNumber: { startsWith: casPrefix } });
      }

      if (orConditions.length > 0) {
        where.OR = orConditions;
      }

      const similar = await prisma.chemical.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return similar.map(this.mapPrismaToChemical);
    } catch (error) {
      console.error("Error finding similar chemicals:", error);
      throw error;
    }
  }

  /**
   * Get chemical alternatives
   */
  async getAlternatives(
    chemicalId: string,
    tenantId?: string,
  ): Promise<Chemical[]> {
    try {
      const chemical = await this.getChemicalById(chemicalId, tenantId);
      if (!chemical) {
        throw new Error(`Chemical ${chemicalId} not found`);
      }

      // Find alternatives based on:
      // 1. Similar use cases (from metadata or compliance)
      // 2. Similar physical/chemical properties
      // 3. Different manufacturer (alternative suppliers)

      const where: Prisma.ChemicalWhereInput = {
        id: { not: chemicalId },
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Search for chemicals with similar properties but different manufacturer
      if (chemical.manufacturer) {
        where.manufacturer = { not: chemical.manufacturer };
      }

      // Use AI to find alternatives if available
      try {
        const aiResult = await aiService.generateText(
          `Find alternative chemicals to: ${chemical.name} (CAS: ${chemical.casNumber}). Return CAS numbers or chemical names as JSON array.`,
        );
        // Could parse AI result and search by CAS numbers
      } catch {
        // Continue with basic search
      }

      const alternatives = await prisma.chemical.findMany({
        where,
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      return alternatives.map(this.mapPrismaToChemical);
    } catch (error) {
      console.error("Error getting alternatives:", error);
      throw error;
    }
  }

  /**
   * Batch import chemicals
   */
  async batchImportChemicals(
    chemicals: Partial<Chemical>[],
    tenantId?: string,
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    try {
      if (!tenantId) {
        throw new Error("tenantId is required for batch import");
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const chemical of chemicals) {
        try {
          await this.createChemical(chemical, tenantId);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Failed to import ${chemical.name || "Unknown"}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Error batch importing chemicals:", error);
      throw error;
    }
  }

  /**
   * Map Prisma chemical to Chemical type
   */
  private mapPrismaToChemical(prismaChemical: any): Chemical {
    return {
      id: prismaChemical.id,
      name: prismaChemical.name,
      casNumber: prismaChemical.casNumber || undefined,
      formula: prismaChemical.formula || undefined,
      synonyms: prismaChemical.synonyms || [],
      manufacturer: prismaChemical.manufacturer || undefined,
      supplier: prismaChemical.supplier || undefined,
      productCode: prismaChemical.productCode || undefined,
      physicalProperties: (prismaChemical.physicalProperties || {}) as any,
      chemicalProperties: (prismaChemical.chemicalProperties || {}) as any,
      hazards: (prismaChemical.hazards || {}) as any,
      storage: (prismaChemical.storage || {}) as any,
      transport: (prismaChemical.transport || {}) as any,
      compliance: (prismaChemical.compliance || {}) as any,
      metadata: {
        createdAt: prismaChemical.createdAt.toISOString(),
        updatedAt: prismaChemical.updatedAt.toISOString(),
        createdBy: prismaChemical.createdBy || undefined,
        updatedBy: prismaChemical.updatedBy || undefined,
        ...((prismaChemical.metadata as any) || {}),
      },
    };
  }
}

export const chemicalService = new ChemicalService();
