/**
 * Facility Management Integration Service
 * Integration with Facility module - MRO procurement, asset procurement, utility procurement
 * ZERO DUPLICATION - Reuses Facility services
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "../requisitionService";
import { purchaseOrderService } from "../purchaseOrderService";
import type { DomainEvent } from "@/types/cqrs";

// TODO: Import Facility services when available
// import { assetService } from '@/lib/services/facility/asset/assetService'
// import { maintenanceService } from '@/lib/services/facility/maintenance/maintenanceService'
// import { workOrderService } from '@/lib/services/facility/maintenance/workOrderService'
// import { utilityBillService } from '@/lib/services/facility/utility-bills/utilityBillService'

export interface MRORequirement {
  assetId?: string;
  workOrderId?: string;
  maintenanceType: "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY";
  items: Array<{
    itemName: string;
    itemCode?: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }>;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiredDate?: Date | string;
}

export interface UtilityProcurement {
  utilityType:
    | "ELECTRICITY"
    | "WATER"
    | "GAS"
    | "WASTE"
    | "INTERNET"
    | "TELECOM";
  facilityId: string;
  providerId?: string;
  contractStartDate: Date | string;
  contractEndDate?: Date | string;
  estimatedMonthlyCost: number;
  currency: string;
}

export class FacilityIntegrationService {
  /**
   * Create MRO requisition from work order
   * Auto-generate requisition for maintenance parts/supplies
   */
  async createMRORequisition(
    tenantId: string,
    requirement: MRORequirement,
  ): Promise<{ requisitionId: string; requisitionNumber: string }> {
    // TODO: Get work order details from Facility service
    // const workOrder = requirement.workOrderId
    //   ? await workOrderService.getWorkOrder(requirement.workOrderId, tenantId)
    //   : null

    const requisition = await requisitionService.createRequisition(
      {
        tenantId,
        type: "MATERIAL",
        title: `MRO Requisition: ${requirement.maintenanceType} Maintenance`,
        requestedBy: "system",
        items: requirement.items.map((item) => ({
          itemName: item.itemName,
          itemCode: item.itemCode,
          quantity: item.quantity,
          unit: item.unit,
          currency: "SAR",
          specifications: item.specifications,
        })),
        priority:
          requirement.urgency === "CRITICAL"
            ? "URGENT"
            : requirement.urgency === "HIGH"
              ? "HIGH"
              : "MEDIUM",
        notes: `MRO requirement for ${requirement.maintenanceType} maintenance. ${requirement.workOrderId ? `Work Order: ${requirement.workOrderId}` : ""} ${requirement.assetId ? `Asset: ${requirement.assetId}` : ""}`,
      },
      "system",
    );

    await eventBus.publish({
      type: "procurement.facility.mro-requisition.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        requisitionId: requisition.id,
        workOrderId: requirement.workOrderId,
        assetId: requirement.assetId,
        maintenanceType: requirement.maintenanceType,
      },
    } as DomainEvent);

    return {
      requisitionId: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
    };
  }

  /**
   * Create asset procurement requisition
   * For facility assets, equipment, infrastructure
   */
  async createAssetProcurementRequisition(
    tenantId: string,
    assetData: {
      assetName: string;
      assetType: string;
      specifications: string;
      quantity: number;
      facilityId: string;
      estimatedCost: number;
      currency: string;
    },
  ): Promise<{ requisitionId: string; requisitionNumber: string }> {
    const requisition = await requisitionService.createRequisition(
      {
        tenantId,
        type: "CAPITAL",
        title: `Asset Procurement: ${assetData.assetName}`,
        requestedBy: "system",
        items: [
          {
            itemName: assetData.assetName,
            quantity: assetData.quantity,
            unit: "UNIT",
            currency: assetData.currency,
            unitPrice: assetData.estimatedCost / assetData.quantity,
            specifications: assetData.specifications,
          },
        ],
        notes: `Asset procurement for facility ${assetData.facilityId}. Asset Type: ${assetData.assetType}`,
      },
      "system",
    );

    await eventBus.publish({
      type: "procurement.facility.asset-requisition.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        requisitionId: requisition.id,
        facilityId: assetData.facilityId,
        assetType: assetData.assetType,
      },
    } as DomainEvent);

    return {
      requisitionId: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
    };
  }

  /**
   * Create utility procurement contract
   * For energy, water, waste, telecom services
   */
  async createUtilityProcurement(
    tenantId: string,
    utility: UtilityProcurement,
  ): Promise<{ contractId: string; contractNumber: string }> {
    // TODO: Create contract using Contract Service
    // const contract = await contractService.createContract({
    //   tenantId,
    //   type: 'SERVICE',
    //   vendorId: utility.providerId,
    //   title: `Utility Contract: ${utility.utilityType}`,
    //   startDate: utility.contractStartDate,
    //   endDate: utility.contractEndDate,
    //   pricingType: 'FIXED',
    //   currency: utility.currency,
    // })

    const contractId = `contract-${Date.now()}`;
    const contractNumber = `CNT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8)}`;

    await eventBus.publish({
      type: "procurement.facility.utility-contract.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        contractId,
        facilityId: utility.facilityId,
        utilityType: utility.utilityType,
      },
    } as DomainEvent);

    return { contractId, contractNumber };
  }

  /**
   * Get MRO requirements from preventive maintenance schedule
   * Auto-generate requisitions for scheduled maintenance
   */
  async getMRORequirementsFromSchedule(
    tenantId: string,
    facilityId: string,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<MRORequirement[]> {
    // TODO: Call Facility maintenance service
    // const maintenanceSchedule = await maintenanceService.getScheduledMaintenance({
    //   tenantId,
    //   facilityId,
    //   startDate,
    //   endDate,
    // })
    // const requirements = maintenanceSchedule.map(schedule => ({
    //   assetId: schedule.assetId,
    //   maintenanceType: 'PREVENTIVE',
    //   items: schedule.requiredParts,
    //   urgency: 'MEDIUM',
    //   requiredDate: schedule.scheduledDate,
    // }))

    // Mock requirements
    return [
      {
        maintenanceType: "PREVENTIVE",
        items: [
          {
            itemName: "Filter Replacement",
            quantity: 2,
            unit: "UNIT",
          },
        ],
        urgency: "MEDIUM",
        requiredDate: startDate,
      },
    ];
  }

  /**
   * Initialize Facility event subscriptions
   */
  initializeFacilityEventSubscriptions(): void {
    // Subscribe to work order events
    eventBus.subscribe(
      "facility.work-order.created",
      async (event: DomainEvent) => {
        console.log("Facility work order created:", event.data);
        // Auto-create MRO requisition if parts needed
        const { tenantId, workOrderId, requiredParts } = event.data;
        if (requiredParts && requiredParts.length > 0) {
          await this.createMRORequisition(tenantId, {
            workOrderId,
            maintenanceType: "CORRECTIVE",
            items: requiredParts,
            urgency: "HIGH",
          });
        }
      },
    );

    // Subscribe to preventive maintenance events
    eventBus.subscribe(
      "facility.maintenance.scheduled",
      async (event: DomainEvent) => {
        console.log("Facility maintenance scheduled:", event.data);
        // Auto-create MRO requisition for scheduled maintenance
      },
    );

    // Subscribe to asset procurement events
    eventBus.subscribe(
      "facility.asset.requirement-identified",
      async (event: DomainEvent) => {
        console.log("Facility asset requirement:", event.data);
        // Auto-create asset procurement requisition
      },
    );
  }
}

// Singleton instance
export const facilityIntegrationService = new FacilityIntegrationService();

// Initialize event subscriptions
facilityIntegrationService.initializeFacilityEventSubscriptions();
