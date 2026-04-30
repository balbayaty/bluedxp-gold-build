/**
 * Equipment Procurement Service
 * Construction equipment procurement - equipment master, tracking, maintenance, utilization
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "./requisitionService";
import { purchaseOrderService } from "./purchaseOrderService";
import type { DomainEvent } from "@/types/cqrs";

export interface Equipment {
  id: string;
  tenantId: string;
  equipmentCode: string;
  equipmentName: string;
  description?: string;
  category:
    | "HEAVY_MACHINERY"
    | "CONSTRUCTION_VEHICLES"
    | "POWER_TOOLS"
    | "SAFETY_EQUIPMENT"
    | "TESTING_EQUIPMENT"
    | "TEMPORARY_FACILITIES";
  subCategory?: string;
  specifications?: EquipmentSpecification;
  standards?: string[];
  certifications?: string[];
  leadTime?: number;
  purchasePrice?: number;
  leaseRate?: number; // Per day/month
  currency?: string;
  preferredVendors?: string[];
  createdAt: Date | string;
}

export interface EquipmentSpecification {
  capacity?: string;
  power?: string;
  dimensions?: string;
  weight?: number;
  certifications?: string[];
  operatorRequirements?: string[];
}

export interface EquipmentRequirement {
  id: string;
  tenantId: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  projectId: string;
  phaseId?: string;
  workPackageId?: string;
  requiredQuantity: number;
  requiredFrom: Date | string;
  requiredTo?: Date | string;
  utilizationType: "PURCHASE" | "LEASE" | "RENTAL";
  status: "PENDING" | "ORDERED" | "DELIVERED" | "COMMISSIONED" | "RETURNED";
  requisitionId?: string;
  purchaseOrderId?: string;
  equipmentInstanceIds?: string[];
}

export interface EquipmentInstance {
  id: string;
  tenantId: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  serialNumber?: string;
  assetTag?: string;
  projectId?: string;
  phaseId?: string;
  workPackageId?: string;
  assignedTo?: string; // Operator/Project
  location?: string;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
  purchaseDate?: Date | string;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
  utilization?: EquipmentUtilization;
  maintenance?: EquipmentMaintenance[];
}

export interface EquipmentUtilization {
  totalHours: number;
  projectHours: number;
  utilizationRate: number; // Percentage
  efficiency: number; // Percentage
  downtime: number; // Hours
  lastUsed?: Date | string;
}

export interface EquipmentMaintenance {
  id: string;
  equipmentInstanceId: string;
  maintenanceType: "PREVENTIVE" | "REPAIR" | "INSPECTION";
  scheduledDate: Date | string;
  completedDate?: Date | string;
  performedBy?: string;
  cost?: number;
  currency?: string;
  description?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
}

// In-memory storage
const equipment = new Map<string, Equipment>();
const equipmentRequirements = new Map<string, EquipmentRequirement>();
const equipmentInstances = new Map<string, EquipmentInstance>();

export class EquipmentProcurementService {
  /**
   * Create equipment master
   */
  async createEquipment(
    tenantId: string,
    equipmentCode: string,
    equipmentName: string,
    category: Equipment["category"],
    specifications?: EquipmentSpecification,
    standards?: string[],
    certifications?: string[],
    leadTime?: number,
    purchasePrice?: number,
    leaseRate?: number,
    currency?: string,
  ): Promise<Equipment> {
    const equipmentId = `equipment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const equip: Equipment = {
      id: equipmentId,
      tenantId,
      equipmentCode,
      equipmentName,
      category,
      specifications,
      standards,
      certifications,
      leadTime,
      purchasePrice,
      leaseRate,
      currency: currency || "SAR",
      createdAt: new Date().toISOString(),
    };

    equipment.set(equipmentId, equip);

    return equip;
  }

  /**
   * Create equipment requirement
   */
  async createEquipmentRequirement(
    tenantId: string,
    equipmentId: string,
    projectId: string,
    requiredQuantity: number,
    requiredFrom: Date | string,
    requiredTo?: Date | string,
    utilizationType: EquipmentRequirement["utilizationType"] = "LEASE",
    phaseId?: string,
    workPackageId?: string,
  ): Promise<EquipmentRequirement> {
    const equip = equipment.get(equipmentId);
    if (!equip || equip.tenantId !== tenantId) {
      throw new Error("Equipment not found");
    }

    const reqId = `eq-req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const requirement: EquipmentRequirement = {
      id: reqId,
      tenantId,
      equipmentId,
      equipmentCode: equip.equipmentCode,
      equipmentName: equip.equipmentName,
      projectId,
      phaseId,
      workPackageId,
      requiredQuantity,
      requiredFrom,
      requiredTo,
      utilizationType,
      status: "PENDING",
    };

    equipmentRequirements.set(reqId, requirement);

    // Publish event
    await eventBus.publish({
      type: "procurement.equipment.requirement.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requirementId: reqId,
        tenantId,
        equipmentId,
        projectId,
        requiredQuantity,
        utilizationType,
      },
    } as DomainEvent);

    return requirement;
  }

  /**
   * Create requisition from equipment requirement
   */
  async createRequisitionFromRequirement(
    requirementId: string,
    tenantId: string,
    requestedBy: string,
    vendorId?: string,
  ): Promise<{ requisitionId: string; requisitionNumber: string }> {
    const requirement = equipmentRequirements.get(requirementId);
    if (!requirement || requirement.tenantId !== tenantId) {
      throw new Error("Equipment requirement not found");
    }

    const equip = equipment.get(requirement.equipmentId);
    if (!equip) {
      throw new Error("Equipment not found");
    }

    const unitPrice =
      requirement.utilizationType === "PURCHASE"
        ? equip.purchasePrice || 0
        : equip.leaseRate || 0;

    const requisition = await requisitionService.createRequisition(
      {
        tenantId,
        type: "EQUIPMENT",
        title: `Equipment Requisition - ${equip.equipmentName}`,
        requestedBy,
        items: [
          {
            itemName: equip.equipmentName,
            itemCode: equip.equipmentCode,
            quantity: requirement.requiredQuantity,
            unit: "UNIT",
            unitPrice,
            currency: equip.currency || "SAR",
            projectId: requirement.projectId,
            phaseId: requirement.phaseId,
            workPackageId: requirement.workPackageId,
          },
        ],
        preferredVendorId: vendorId,
        requiredDate: requirement.requiredFrom,
      },
      requestedBy,
    );

    requirement.requisitionId = requisition.id;
    requirement.status = "ORDERED";
    equipmentRequirements.set(requirementId, requirement);

    return {
      requisitionId: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
    };
  }

  /**
   * Register equipment instance (when delivered)
   */
  async registerEquipmentInstance(
    tenantId: string,
    equipmentId: string,
    purchaseOrderId: string,
    serialNumber?: string,
    assetTag?: string,
    projectId?: string,
    phaseId?: string,
    workPackageId?: string,
  ): Promise<EquipmentInstance> {
    const equip = equipment.get(equipmentId);
    if (!equip || equip.tenantId !== tenantId) {
      throw new Error("Equipment not found");
    }

    const instanceId = `instance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const instance: EquipmentInstance = {
      id: instanceId,
      tenantId,
      equipmentId,
      equipmentCode: equip.equipmentCode,
      equipmentName: equip.equipmentName,
      serialNumber,
      assetTag,
      projectId,
      phaseId,
      workPackageId,
      status: "AVAILABLE",
      utilization: {
        totalHours: 0,
        projectHours: 0,
        utilizationRate: 0,
        efficiency: 100,
        downtime: 0,
      },
      maintenance: [],
    };

    equipmentInstances.set(instanceId, instance);

    // Update requirement
    const requirements = Array.from(equipmentRequirements.values()).filter(
      (req) => req.purchaseOrderId === purchaseOrderId,
    );
    requirements.forEach((req) => {
      req.equipmentInstanceIds = req.equipmentInstanceIds || [];
      req.equipmentInstanceIds.push(instanceId);
      if (req.equipmentInstanceIds.length >= req.requiredQuantity) {
        req.status = "DELIVERED";
      }
      equipmentRequirements.set(req.id, req);
    });

    // Publish event
    await eventBus.publish({
      type: "procurement.equipment.instance.registered",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        instanceId,
        tenantId,
        equipmentId,
        purchaseOrderId,
        serialNumber,
        assetTag,
      },
    } as DomainEvent);

    return instance;
  }

  /**
   * Update equipment utilization
   */
  async updateUtilization(
    instanceId: string,
    tenantId: string,
    hours: number,
    projectId?: string,
  ): Promise<EquipmentInstance> {
    const instance = equipmentInstances.get(instanceId);
    if (!instance || instance.tenantId !== tenantId) {
      throw new Error("Equipment instance not found");
    }

    if (!instance.utilization) {
      instance.utilization = {
        totalHours: 0,
        projectHours: 0,
        utilizationRate: 0,
        efficiency: 100,
        downtime: 0,
      };
    }

    instance.utilization.totalHours += hours;
    if (projectId) {
      instance.utilization.projectHours += hours;
    }
    instance.utilization.lastUsed = new Date().toISOString();

    // Calculate utilization rate (simplified)
    instance.utilization.utilizationRate = Math.min(
      100,
      (instance.utilization.totalHours / 2000) * 100,
    ); // Assuming 2000 hours/year

    instance.status = "IN_USE";
    equipmentInstances.set(instanceId, instance);

    return instance;
  }

  /**
   * Schedule equipment maintenance
   */
  async scheduleMaintenance(
    instanceId: string,
    tenantId: string,
    maintenanceType: EquipmentMaintenance["maintenanceType"],
    scheduledDate: Date | string,
    description?: string,
    cost?: number,
    currency?: string,
  ): Promise<EquipmentMaintenance> {
    const instance = equipmentInstances.get(instanceId);
    if (!instance || instance.tenantId !== tenantId) {
      throw new Error("Equipment instance not found");
    }

    const maintenanceId = `maint-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const maintenance: EquipmentMaintenance = {
      id: maintenanceId,
      equipmentInstanceId: instanceId,
      maintenanceType,
      scheduledDate,
      description,
      cost,
      currency,
      status: "SCHEDULED",
    };

    instance.maintenance = instance.maintenance || [];
    instance.maintenance.push(maintenance);
    instance.status = "MAINTENANCE";
    equipmentInstances.set(instanceId, instance);

    return maintenance;
  }

  /**
   * Get equipment by ID
   */
  async getEquipment(
    equipmentId: string,
    tenantId: string,
  ): Promise<Equipment | null> {
    const equip = equipment.get(equipmentId);
    if (!equip || equip.tenantId !== tenantId) {
      return null;
    }
    return equip;
  }

  /**
   * List equipment
   */
  async listEquipment(
    tenantId: string,
    filters?: {
      category?: Equipment["category"][];
      search?: string;
    },
  ): Promise<Equipment[]> {
    let results = Array.from(equipment.values()).filter(
      (e) => e.tenantId === tenantId,
    );

    if (filters) {
      if (filters.category && filters.category.length > 0) {
        results = results.filter((e) => filters.category!.includes(e.category));
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(
          (e) =>
            e.equipmentCode.toLowerCase().includes(searchLower) ||
            e.equipmentName.toLowerCase().includes(searchLower),
        );
      }
    }

    return results;
  }

  /**
   * Get equipment instances
   */
  async getEquipmentInstances(
    tenantId: string,
    filters?: {
      equipmentId?: string;
      projectId?: string;
      status?: EquipmentInstance["status"][];
    },
  ): Promise<EquipmentInstance[]> {
    let results = Array.from(equipmentInstances.values()).filter(
      (inst) => inst.tenantId === tenantId,
    );

    if (filters) {
      if (filters.equipmentId) {
        results = results.filter(
          (inst) => inst.equipmentId === filters.equipmentId,
        );
      }
      if (filters.projectId) {
        results = results.filter(
          (inst) => inst.projectId === filters.projectId,
        );
      }
      if (filters.status && filters.status.length > 0) {
        results = results.filter((inst) =>
          filters.status!.includes(inst.status),
        );
      }
    }

    return results;
  }
}

// Singleton instance
export const equipmentProcurementService = new EquipmentProcurementService();
