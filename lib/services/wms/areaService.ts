/**
 * Warehouse Area Service
 * Comprehensive area/zone management with capacity tracking and hazard restrictions
 * BlueDXP Platform - 4IR & 5IR Aligned • Integration-First • Event-Driven
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  WarehouseArea,
  WarehouseAreaRequest,
  WarehouseAreaFilters,
  WarehouseAreaImportData,
  WarehouseAreaExport,
} from "@/types/warehouseArea";
import {
  validateAreaRequest,
  validateCrossModuleIntegration,
  DEFAULT_BUSINESS_RULES,
} from "./areaValidationService";

// ============================================================================
// AREA SERVICE INTERFACE
// ============================================================================

export interface WarehouseAreaService {
  // CRUD Operations
  createArea(data: WarehouseAreaRequest): Promise<WarehouseArea>;
  getArea(id: string): Promise<WarehouseArea | null>;
  updateArea(
    id: string,
    data: Partial<WarehouseAreaRequest>,
  ): Promise<WarehouseArea>;
  deleteArea(id: string): Promise<void>;
  listAreas(filters?: WarehouseAreaFilters): Promise<WarehouseArea[]>;

  // Capacity Management
  updateStock(id: string, currentStock: number): Promise<WarehouseArea>;
  getUtilizationPercentage(id: string): Promise<number>;
  getAreasByUtilization(
    warehouseId: string,
    threshold?: number,
  ): Promise<WarehouseArea[]>;

  // Import/Export
  importAreas(
    warehouseId: string,
    data: WarehouseAreaImportData[],
  ): Promise<WarehouseArea[]>;
  exportAreas(filters?: WarehouseAreaFilters): Promise<WarehouseAreaExport[]>;

  // Hazard Class Management
  updateAllowedHazards(
    id: string,
    hazardClasses: string[],
  ): Promise<WarehouseArea>;
  validateHazardCompatibility(
    areaId: string,
    hazardClass: string,
  ): Promise<boolean>;

  // Analytics
  getAreaStatistics(warehouseId: string): Promise<AreaStatistics>;
}

export interface AreaStatistics {
  totalAreas: number;
  activeAreas: number;
  totalCapacity: number;
  totalStock: number;
  averageUtilization: number;
  areasByZone: Record<string, number>;
  areasByHazardClass: Record<string, number>;
}

// ============================================================================
// AREA SERVICE IMPLEMENTATION
// ============================================================================

import { PrismaClient, Prisma } from "@prisma/client";
import type { WarehouseArea as PrismaWarehouseArea } from "@prisma/client";

const prisma = new PrismaClient();

class WarehouseAreaServiceImpl implements WarehouseAreaService {
  async createArea(data: WarehouseAreaRequest): Promise<WarehouseArea> {
    try {
      // ✅ Comprehensive validation
      // Note: We'd need to fetch existing areas from DB for full validation,
      // but for now we'll trust the DB constraints and basic checks.
      const existingAreas = await this.listAreas({
        warehouseId: data.warehouseId,
      });
      const validation = await validateAreaRequest(
        data,
        DEFAULT_BUSINESS_RULES,
        existingAreas,
      );

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // ✅ Cross-module integration validation
      if (data.linkedModuleId) {
        const crossModuleValidation = validateCrossModuleIntegration(
          data,
          data.linkedModuleId,
          data.linkedEntityId,
        );
        if (!crossModuleValidation.valid) {
          throw new Error(
            `Cross-module validation failed: ${crossModuleValidation.errors.join(", ")}`,
          );
        }
      }

      const utilizationPercentage =
        data.capacity > 0
          ? Math.round(((data.currentStock || 0) / data.capacity) * 100)
          : 0;

      // Map request to Prisma input
      const createInput: Prisma.WarehouseAreaCreateInput = {
        name: data.areaName,
        code: data.areaCode,
        zone: data.zone,
        capacity: data.capacity,
        currentStock: data.currentStock || 0,
        temperatureZone: data.tempZone,
        allowedHazards: data.allowedHazards,
        restrictions: data.restrictions,
        linkedModuleId: data.linkedModuleId,
        linkedEntityId: data.linkedEntityId,
        linkedEntityType: data.linkedEntityType,
        warehouse: data.warehouseId
          ? { connect: { id: data.warehouseId } }
          : undefined,
      };

      const created = await prisma.warehouseArea.create({
        data: createInput,
      });

      const area = this.mapPrismaToApp(created);

      // Emit event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.area.created",
        aggregateId: area.id,
        aggregateType: "WAREHOUSE_AREA",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: area,
      });

      return area;
    } catch (error) {
      console.error("Error creating area:", error);
      throw new Error(
        `Failed to create area: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getArea(id: string): Promise<WarehouseArea | null> {
    const found = await prisma.warehouseArea.findUnique({ where: { id } });
    return found ? this.mapPrismaToApp(found) : null;
  }

  async updateArea(
    id: string,
    data: Partial<WarehouseAreaRequest>,
  ): Promise<WarehouseArea> {
    const existing = await this.getArea(id);
    if (!existing) {
      throw new Error(`Area not found: ${id}`);
    }

    // Map partial update to Prisma input
    const updateInput: Prisma.WarehouseAreaUpdateInput = {
      ...(data.areaName && { name: data.areaName }),
      ...(data.areaCode && { code: data.areaCode }),
      ...(data.zone && { zone: data.zone }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.currentStock !== undefined && {
        currentStock: data.currentStock,
      }),
      ...(data.tempZone && { temperatureZone: data.tempZone }),
      ...(data.allowedHazards && { allowedHazards: data.allowedHazards }),
      ...(data.restrictions !== undefined && {
        restrictions: data.restrictions,
      }),
      ...(data.linkedModuleId !== undefined && {
        linkedModuleId: data.linkedModuleId,
      }),
      ...(data.linkedEntityId !== undefined && {
        linkedEntityId: data.linkedEntityId,
      }),
      ...(data.linkedEntityType !== undefined && {
        linkedEntityType: data.linkedEntityType,
      }),
    };

    const updated = await prisma.warehouseArea.update({
      where: { id },
      data: updateInput,
    });

    const area = this.mapPrismaToApp(updated);

    // Emit event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "wms.area.updated",
      aggregateId: area.id,
      aggregateType: "WAREHOUSE_AREA",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: area,
    });

    return area;
  }

  async deleteArea(id: string): Promise<void> {
    await prisma.warehouseArea.delete({ where: { id } });

    // Emit event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "wms.area.deleted",
      aggregateId: id,
      aggregateType: "WAREHOUSE_AREA",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { id },
    });
  }

  async listAreas(filters?: WarehouseAreaFilters): Promise<WarehouseArea[]> {
    const where: Prisma.WarehouseAreaWhereInput = {};

    if (filters) {
      if (filters.warehouseId !== undefined) {
        where.warehouseId = filters.warehouseId || null; // Handle standalone (null warehouseId)
      }
      if (filters.standalone) {
        where.warehouseId = null;
      }
      if (filters.linkedModuleId) {
        where.linkedModuleId = filters.linkedModuleId;
      }
      if (filters.linkedEntityId) {
        where.linkedEntityId = filters.linkedEntityId;
      }
      if (filters.zone) {
        where.zone = filters.zone;
      }
      // Note: 'active' filter is not on the model currently, implicitly all are active
      if (filters.searchQuery) {
        where.OR = [
          { code: { contains: filters.searchQuery, mode: "insensitive" } },
          { name: { contains: filters.searchQuery, mode: "insensitive" } },
          { zone: { contains: filters.searchQuery, mode: "insensitive" } },
        ];
      }
    }

    const areas = await prisma.warehouseArea.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return areas.map(this.mapPrismaToApp);
  }

  async updateStock(id: string, currentStock: number): Promise<WarehouseArea> {
    return this.updateArea(id, { currentStock });
  }

  async getUtilizationPercentage(id: string): Promise<number> {
    const area = await this.getArea(id);
    if (!area) return 0;
    return area.utilizationPercentage ?? 0;
  }

  async getAreasByUtilization(
    warehouseId: string,
    threshold: number = 75,
  ): Promise<WarehouseArea[]> {
    const areas = await this.listAreas({ warehouseId });
    return areas.filter((a) => (a.utilizationPercentage ?? 0) >= threshold);
  }

  async importAreas(
    warehouseId: string,
    data: WarehouseAreaImportData[],
  ): Promise<WarehouseArea[]> {
    const importedAreas: WarehouseArea[] = [];

    // Naive implementation - should use createMany if possible, but validation logic is complex
    for (const item of data) {
      const hazardClasses = Array.isArray(item.allowedHazards)
        ? item.allowedHazards
        : typeof item.allowedHazards === "string"
          ? item.allowedHazards
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      try {
        const area = await this.createArea({
          areaCode: item.areaCode,
          areaName: item.areaName,
          zone: item.zone,
          warehouseId,
          capacity: item.capacity,
          currentStock: item.currentStock || 0,
          allowedHazards: hazardClasses,
          restrictions: item.restrictions || "",
          active: true,
        });
        importedAreas.push(area);
      } catch (e) {
        console.error(`Failed to import area ${item.areaCode}`, e);
      }
    }

    return importedAreas;
  }

  async exportAreas(
    filters?: WarehouseAreaFilters,
  ): Promise<WarehouseAreaExport[]> {
    const areas = await this.listAreas(filters);

    return areas.map((area) => ({
      areaCode: area.areaCode,
      areaName: area.areaName,
      zone: area.zone,
      capacity: area.capacity,
      currentStock: area.currentStock,
      usagePercentage: area.utilizationPercentage ?? 0,
      allowedHazards: area.allowedHazards.join("; "),
      restrictions: area.restrictions,
    }));
  }

  async updateAllowedHazards(
    id: string,
    hazardClasses: string[],
  ): Promise<WarehouseArea> {
    return this.updateArea(id, { allowedHazards: hazardClasses });
  }

  async validateHazardCompatibility(
    areaId: string,
    hazardClass: string,
  ): Promise<boolean> {
    const area = await this.getArea(areaId);
    if (!area) return false;
    return area.allowedHazards.includes(hazardClass);
  }

  async getAreaStatistics(warehouseId?: string): Promise<AreaStatistics> {
    const areas = await this.listAreas(
      warehouseId ? { warehouseId } : undefined,
    );

    const totalAreas = areas.length;
    const activeAreas = areas.filter((a) => a.active).length;
    const totalCapacity = areas.reduce((sum, a) => sum + a.capacity, 0);
    const totalStock = areas.reduce((sum, a) => sum + a.currentStock, 0);
    const averageUtilization =
      areas.length > 0
        ? areas.reduce((sum, a) => sum + (a.utilizationPercentage ?? 0), 0) /
          areas.length
        : 0;

    const areasByZone: Record<string, number> = {};
    const areasByHazardClass: Record<string, number> = {};

    areas.forEach((area) => {
      areasByZone[area.zone] = (areasByZone[area.zone] || 0) + 1;
      area.allowedHazards.forEach((hc) => {
        areasByHazardClass[hc] = (areasByHazardClass[hc] || 0) + 1;
      });
    });

    return {
      totalAreas,
      activeAreas,
      totalCapacity,
      totalStock,
      averageUtilization,
      areasByZone,
      areasByHazardClass,
    };
  }

  // Helper to map Prisma model to App type
  private mapPrismaToApp(prismaArea: PrismaWarehouseArea): WarehouseArea {
    const utilizationPercentage =
      prismaArea.capacity > 0
        ? Math.round((prismaArea.currentStock / prismaArea.capacity) * 100)
        : 0;

    return {
      id: prismaArea.id,
      areaCode: prismaArea.code,
      areaName: prismaArea.name,
      zone: prismaArea.zone,
      warehouseId: prismaArea.warehouseId || undefined,
      capacity: prismaArea.capacity,
      currentStock: prismaArea.currentStock,
      utilizationPercentage,
      allowedHazards: prismaArea.allowedHazards,
      restrictions: prismaArea.restrictions || "",
      active: true, // DB defaults not having active flag yet, assume active
      linkedModuleId: prismaArea.linkedModuleId || undefined,
      linkedEntityId: prismaArea.linkedEntityId || undefined,
      linkedEntityType: prismaArea.linkedEntityType || undefined,
      createdAt: prismaArea.createdAt.toISOString(),
      updatedAt: prismaArea.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// EXPORT SERVICE INSTANCE
// ============================================================================

export const warehouseAreaService = new WarehouseAreaServiceImpl();
export default warehouseAreaService;
