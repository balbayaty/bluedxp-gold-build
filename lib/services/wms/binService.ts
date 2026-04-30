import { PrismaClient, Prisma } from "@prisma/client";
import type { StorageBin } from "@prisma/client";

const prisma = new PrismaClient();

export type StorageBinCreateInput = Prisma.StorageBinCreateInput;
export type StorageBinUpdateInput = Prisma.StorageBinUpdateInput;

export interface StorageBinFilters {
  areaId?: string;
  status?: string;
  type?: string;
  barcode?: string;
  searchQuery?: string;
}

export const binService = {
  /**
   * List all bins with optional filtering
   */
  async listBins(filters?: StorageBinFilters) {
    const where: Prisma.StorageBinWhereInput = {};

    if (filters?.areaId) {
      where.areaId = filters.areaId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.barcode) {
      where.barcode = filters.barcode;
    }

    if (filters?.searchQuery) {
      where.OR = [
        { code: { contains: filters.searchQuery, mode: "insensitive" } },
        { barcode: { contains: filters.searchQuery, mode: "insensitive" } },
      ];
    }

    return prisma.storageBin.findMany({
      where,
      include: {
        area: true, // Include area details
      },
      orderBy: { code: "asc" },
    });
  },

  /**
   * Get a single bin by ID
   */
  async getBin(id: string) {
    return prisma.storageBin.findUnique({
      where: { id },
      include: {
        area: true,
      },
    });
  },

  /**
   * Get a single bin by Code
   */
  async getBinByCode(code: string) {
    return prisma.storageBin.findFirst({
      where: { code },
      include: {
        area: true,
      },
    });
  },

  /**
   * Create a new bin
   */
  async createBin(data: StorageBinCreateInput) {
    return prisma.storageBin.create({
      data,
    });
  },

  /**
   * Update an existing bin
   */
  async updateBin(id: string, data: StorageBinUpdateInput) {
    return prisma.storageBin.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a bin
   */
  async deleteBin(id: string) {
    return prisma.storageBin.delete({
      where: { id },
    });
  },

  /**
   * Generate bins in bulk for an aisle
   * naming convention: {Aisle}-{Bay}-{Level}-{Position}
   */
  async generateBinsForAisle(
    areaId: string,
    config: {
      aisle: string;
      bays: number;
      levels: number;
      positions?: number; // default 1
    },
  ) {
    const positions = config.positions || 1;
    const binsToCreate: Prisma.StorageBinCreateManyInput[] = [];

    for (let b = 1; b <= config.bays; b++) {
      for (let l = 1; l <= config.levels; l++) {
        for (let p = 1; p <= positions; p++) {
          const bayStr = b.toString().padStart(2, "0");
          const levelStr = l.toString().padStart(2, "0");
          const posStr = p.toString().padStart(2, "0");
          const code = `${config.aisle}-${bayStr}-${levelStr}-${posStr}`;

          binsToCreate.push({
            areaId,
            code,
            type: "SHELF",
            status: "EMPTY",
            bay: b,
            level: l,
          });
        }
      }
    }

    // Use createMany for efficiency
    return prisma.storageBin.createMany({
      data: binsToCreate,
      skipDuplicates: true,
    });
  },

  /**
   * Find the best bin in an area for putaway
   * Strategy: First Empty Bin (Simple)
   */
  async findBestBinInArea(areaId: string, sku?: string, qty?: number) {
    // 1. Try to find existing bin with same SKU (Consolidation) - Not implemented yet

    // 2. Find first empty bin
    const emptyBin = await prisma.storageBin.findFirst({
      where: {
        areaId,
        status: "EMPTY",
      },
      orderBy: {
        code: "asc", // Fill sequentially
      },
    });

    return emptyBin;
  },
};
