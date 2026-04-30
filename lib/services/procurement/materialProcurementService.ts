/**
 * Material Procurement Service
 * Construction materials procurement - MRP, BOM, quantity takeoff, material optimization
 * Integrates with WMS for inventory requirements
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "./requisitionService";
import { purchaseOrderService } from "./purchaseOrderService";
import type { DomainEvent } from "@/types/cqrs";

export interface Material {
  id: string;
  tenantId: string;
  materialCode: string;
  materialName: string;
  description?: string;
  category:
    | "STRUCTURAL"
    | "FINISHES"
    | "MEP"
    | "ARCHITECTURAL"
    | "SITE"
    | "SPECIALIZED";
  subCategory?: string;
  unit: string;
  specifications?: MaterialSpecification;
  standards?: string[]; // ASTM, BS, DIN, ISO
  properties?: MaterialProperties;
  substitutions?: string[]; // Material IDs of approved alternates
  leadTime?: number; // Days
  minOrderQuantity?: number;
  standardPrice?: number;
  currency?: string;
  preferredVendors?: string[];
  createdAt: Date | string;
}

export interface MaterialSpecification {
  dimensions?: string;
  weight?: number;
  strength?: string;
  durability?: string;
  fireRating?: string;
  technicalSpecs?: Record<string, any>;
}

export interface MaterialProperties {
  color?: string;
  finish?: string;
  grade?: string;
  certification?: string[];
  testCertificates?: string[];
}

export interface BillOfMaterials {
  id: string;
  tenantId: string;
  bomNumber: string;
  bomName: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  workPackageId?: string;
  version: string;
  items: BOMItem[];
  createdAt: Date | string;
  createdBy: string;
}

export interface BOMItem {
  id: string;
  bomId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  level: number; // For multi-level BOM
  parentItemId?: string;
  wasteFactor?: number; // Percentage
  notes?: string;
}

export interface MaterialRequirement {
  id: string;
  tenantId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  projectId?: string;
  phaseId?: string;
  workPackageId?: string;
  requiredQuantity: number;
  unit: string;
  requiredDate: Date | string;
  source: "BOM" | "MANUAL" | "DRAWING" | "MRP";
  bomId?: string;
  drawingId?: string;
  orderedQuantity?: number;
  receivedQuantity?: number;
  pendingQuantity: number;
  status: "PENDING" | "ORDERED" | "PARTIAL" | "COMPLETE";
  requisitionIds?: string[];
  purchaseOrderIds?: string[];
}

export interface MaterialTakeoff {
  id: string;
  tenantId: string;
  takeoffNumber: string;
  projectId: string;
  phaseId?: string;
  workPackageId?: string;
  drawingId?: string;
  drawingRevision?: string;
  method: "AUTOMATED" | "MANUAL" | "BIM";
  items: TakeoffItem[];
  status: "DRAFT" | "VERIFIED" | "APPROVED";
  verifiedBy?: string;
  verifiedAt?: Date | string;
  createdAt: Date | string;
  createdBy: string;
}

export interface TakeoffItem {
  id: string;
  takeoffId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  area?: number;
  volume?: number;
  length?: number;
  notes?: string;
}

// In-memory storage
const materials = new Map<string, Material>();
const boms = new Map<string, BillOfMaterials>();
const materialRequirements = new Map<string, MaterialRequirement>();
const materialTakeoffs = new Map<string, MaterialTakeoff>();

export class MaterialProcurementService {
  /**
   * Create material master
   */
  async createMaterial(
    tenantId: string,
    materialCode: string,
    materialName: string,
    category: Material["category"],
    unit: string,
    specifications?: MaterialSpecification,
    standards?: string[],
    properties?: MaterialProperties,
    leadTime?: number,
    standardPrice?: number,
    currency?: string,
  ): Promise<Material> {
    const materialId = `material-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const material: Material = {
      id: materialId,
      tenantId,
      materialCode,
      materialName,
      category,
      unit,
      specifications,
      standards,
      properties,
      leadTime,
      standardPrice,
      currency: currency || "SAR",
      createdAt: new Date().toISOString(),
    };

    materials.set(materialId, material);

    return material;
  }

  /**
   * Create Bill of Materials (BOM)
   */
  async createBOM(
    tenantId: string,
    bomName: string,
    projectId?: string,
    phaseId?: string,
    workPackageId?: string,
    description?: string,
    userId: string = "system",
  ): Promise<BillOfMaterials> {
    const bomNumber = `BOM-${Date.now()}`;
    const bomId = `bom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const bom: BillOfMaterials = {
      id: bomId,
      tenantId,
      bomNumber,
      bomName,
      description,
      projectId,
      phaseId,
      workPackageId,
      version: "1.0",
      items: [],
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    boms.set(bomId, bom);

    return bom;
  }

  /**
   * Add item to BOM
   */
  async addBOMItem(
    bomId: string,
    tenantId: string,
    materialId: string,
    quantity: number,
    level: number = 1,
    parentItemId?: string,
    wasteFactor?: number,
    notes?: string,
  ): Promise<BOMItem> {
    const bom = boms.get(bomId);
    if (!bom || bom.tenantId !== tenantId) {
      throw new Error("BOM not found");
    }

    const material = materials.get(materialId);
    if (!material) {
      throw new Error("Material not found");
    }

    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const item: BOMItem = {
      id: itemId,
      bomId,
      materialId,
      materialCode: material.materialCode,
      materialName: material.materialName,
      quantity,
      unit: material.unit,
      level,
      parentItemId,
      wasteFactor,
      notes,
    };

    bom.items.push(item);
    boms.set(bomId, bom);

    return item;
  }

  /**
   * Generate material requirements from BOM
   */
  async generateMaterialRequirements(
    bomId: string,
    tenantId: string,
    projectId?: string,
    phaseId?: string,
    workPackageId?: string,
    requiredDate?: Date | string,
  ): Promise<MaterialRequirement[]> {
    const bom = boms.get(bomId);
    if (!bom || bom.tenantId !== tenantId) {
      throw new Error("BOM not found");
    }

    const requirements: MaterialRequirement[] = [];

    // Aggregate quantities by material (handle multi-level BOM)
    const materialQuantities = new Map<string, number>();

    bom.items.forEach((item) => {
      const currentQty = materialQuantities.get(item.materialId) || 0;
      const adjustedQty = item.wasteFactor
        ? item.quantity * (1 + item.wasteFactor / 100)
        : item.quantity;
      materialQuantities.set(item.materialId, currentQty + adjustedQty);
    });

    // Create requirements
    materialQuantities.forEach((quantity, materialId) => {
      const material = materials.get(materialId);
      if (!material) return;

      const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const requirement: MaterialRequirement = {
        id: reqId,
        tenantId,
        materialId,
        materialCode: material.materialCode,
        materialName: material.materialName,
        projectId: projectId || bom.projectId,
        phaseId: phaseId || bom.phaseId,
        workPackageId: workPackageId || bom.workPackageId,
        requiredQuantity: quantity,
        unit: material.unit,
        requiredDate: requiredDate || new Date().toISOString(),
        source: "BOM",
        bomId,
        pendingQuantity: quantity,
        status: "PENDING",
      };

      materialRequirements.set(reqId, requirement);
      requirements.push(requirement);
    });

    // Publish event
    await eventBus.publish({
      type: "procurement.material.requirements.generated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        bomId,
        tenantId,
        projectId,
        phaseId,
        workPackageId,
        requirementCount: requirements.length,
      },
    } as DomainEvent);

    return requirements;
  }

  /**
   * Create material takeoff from drawing
   */
  async createMaterialTakeoff(
    tenantId: string,
    projectId: string,
    drawingId: string,
    method: MaterialTakeoff["method"],
    items: Array<{
      materialId: string;
      quantity: number;
      unit: string;
      area?: number;
      volume?: number;
      length?: number;
      notes?: string;
    }>,
    phaseId?: string,
    workPackageId?: string,
    drawingRevision?: string,
    userId: string = "system",
  ): Promise<MaterialTakeoff> {
    const takeoffNumber = `TO-${Date.now()}`;
    const takeoffId = `takeoff-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const takeoffItems: TakeoffItem[] = items.map((item, index) => {
      const material = materials.get(item.materialId);
      if (!material) {
        throw new Error(`Material not found: ${item.materialId}`);
      }

      return {
        id: `item-${takeoffId}-${index + 1}`,
        takeoffId,
        materialId: item.materialId,
        materialCode: material.materialCode,
        materialName: material.materialName,
        quantity: item.quantity,
        unit: item.unit,
        area: item.area,
        volume: item.volume,
        length: item.length,
        notes: item.notes,
      };
    });

    const takeoff: MaterialTakeoff = {
      id: takeoffId,
      tenantId,
      takeoffNumber,
      projectId,
      phaseId,
      workPackageId,
      drawingId,
      drawingRevision,
      method,
      items: takeoffItems,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    materialTakeoffs.set(takeoffId, takeoff);

    // Generate material requirements from takeoff
    items.forEach((item) => {
      const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const material = materials.get(item.materialId)!;

      const requirement: MaterialRequirement = {
        id: reqId,
        tenantId,
        materialId: item.materialId,
        materialCode: material.materialCode,
        materialName: material.materialName,
        projectId,
        phaseId,
        workPackageId,
        requiredQuantity: item.quantity,
        unit: item.unit,
        requiredDate: new Date().toISOString(),
        source: "DRAWING",
        drawingId,
        pendingQuantity: item.quantity,
        status: "PENDING",
      };

      materialRequirements.set(reqId, requirement);
    });

    return takeoff;
  }

  /**
   * Create requisition from material requirements
   */
  async createRequisitionFromRequirements(
    requirementIds: string[],
    tenantId: string,
    requestedBy: string,
    requiredDate?: Date | string,
  ): Promise<{ requisitionId: string; requisitionNumber: string }> {
    const requirements = requirementIds
      .map((id) => materialRequirements.get(id))
      .filter(
        (req): req is MaterialRequirement =>
          req !== undefined && req.tenantId === tenantId,
      );

    if (requirements.length === 0) {
      throw new Error("No valid requirements found");
    }

    // Group by project/phase/work package
    const grouped = new Map<string, MaterialRequirement[]>();
    requirements.forEach((req) => {
      const key = `${req.projectId || "none"}-${req.phaseId || "none"}-${req.workPackageId || "none"}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(req);
    });

    // Create requisition for each group
    const requisitions: Array<{
      requisitionId: string;
      requisitionNumber: string;
    }> = [];

    for (const [key, reqs] of grouped) {
      const items = reqs.map((req) => ({
        itemName: req.materialName,
        itemCode: req.materialCode,
        quantity: req.requiredQuantity,
        unit: req.unit,
        currency: "SAR",
        projectId: req.projectId,
        phaseId: req.phaseId,
        workPackageId: req.workPackageId,
      }));

      const requisition = await requisitionService.createRequisition(
        {
          tenantId,
          type: "MATERIAL",
          title: `Material Requisition - ${reqs[0].projectId ? "Project" : "General"}`,
          requestedBy,
          items,
          requiredDate,
          projectId: reqs[0].projectId,
          phaseId: reqs[0].phaseId,
          workPackageId: reqs[0].workPackageId,
        },
        requestedBy,
      );

      requisitions.push({
        requisitionId: requisition.id,
        requisitionNumber: requisition.requisitionNumber,
      });

      // Update requirements
      reqs.forEach((req) => {
        req.requisitionIds = req.requisitionIds || [];
        req.requisitionIds.push(requisition.id);
        req.status = "ORDERED";
        materialRequirements.set(req.id, req);
      });
    }

    return requisitions[0]; // Return first requisition
  }

  /**
   * Get material by ID
   */
  async getMaterial(
    materialId: string,
    tenantId: string,
  ): Promise<Material | null> {
    const material = materials.get(materialId);
    if (!material || material.tenantId !== tenantId) {
      return null;
    }
    return material;
  }

  /**
   * List materials
   */
  async listMaterials(
    tenantId: string,
    filters?: {
      category?: Material["category"][];
      search?: string;
    },
  ): Promise<Material[]> {
    let results = Array.from(materials.values()).filter(
      (m) => m.tenantId === tenantId,
    );

    if (filters) {
      if (filters.category && filters.category.length > 0) {
        results = results.filter((m) => filters.category!.includes(m.category));
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(
          (m) =>
            m.materialCode.toLowerCase().includes(searchLower) ||
            m.materialName.toLowerCase().includes(searchLower),
        );
      }
    }

    return results;
  }

  /**
   * Get material requirements
   */
  async getMaterialRequirements(
    tenantId: string,
    filters?: {
      projectId?: string;
      phaseId?: string;
      workPackageId?: string;
      status?: MaterialRequirement["status"][];
    },
  ): Promise<MaterialRequirement[]> {
    let results = Array.from(materialRequirements.values()).filter(
      (req) => req.tenantId === tenantId,
    );

    if (filters) {
      if (filters.projectId) {
        results = results.filter((req) => req.projectId === filters.projectId);
      }
      if (filters.phaseId) {
        results = results.filter((req) => req.phaseId === filters.phaseId);
      }
      if (filters.workPackageId) {
        results = results.filter(
          (req) => req.workPackageId === filters.workPackageId,
        );
      }
      if (filters.status && filters.status.length > 0) {
        results = results.filter((req) => filters.status!.includes(req.status));
      }
    }

    return results;
  }
}

// Singleton instance
export const materialProcurementService = new MaterialProcurementService();
