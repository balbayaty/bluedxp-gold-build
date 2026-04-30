/**
 * Utility Bill Integration Service
 *
 * Integrates utility bills with:
 * - Energy Service (for electricity bills)
 * - Facility Management
 * - Warehouse Management
 * - QHSE Compliance
 * - Financial Systems
 */

import { getUtilityBillService } from "./utilityBillService";
import { getEnergyService } from "@/lib/services/facility/energy/energyService";
import type {
  UtilityBill,
  EnergyServiceIntegration,
  FacilityIntegration,
} from "@/types/utility-bills";
import type { EnergyConsumption } from "@/types/facility";

export interface IntegrationConfig {
  enableEnergySync?: boolean;
  enableFacilitySync?: boolean;
  enableWarehouseSync?: boolean;
  autoSyncOnCreate?: boolean;
}

/**
 * Utility Bill Integration Service
 */
export class UtilityBillIntegrationService {
  private config: IntegrationConfig;
  private billService = getUtilityBillService();
  private energyService = getEnergyService();

  constructor(config: IntegrationConfig = {}) {
    this.config = {
      enableEnergySync: true,
      enableFacilitySync: true,
      enableWarehouseSync: true,
      autoSyncOnCreate: true,
      ...config,
    };
  }

  /**
   * Integrate bill with energy service
   */
  async integrateWithEnergyService(
    billId: string,
  ): Promise<EnergyServiceIntegration> {
    const bill = await this.billService.getBill(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.utilityType !== "electricity") {
      throw new Error(
        "Energy service integration only available for electricity bills",
      );
    }

    if (!bill.consumption) {
      return {
        billId,
        energyConsumptionId: "",
        syncStatus: "pending",
        discrepancies: [],
      };
    }

    // Create energy consumption record
    const energyConsumption: Omit<EnergyConsumption, "id" | "createdAt"> = {
      facilityId: bill.facilityId || "",
      period: bill.billingPeriod,
      electricity: {
        consumption: bill.consumption.quantity,
        cost: bill.totalAmount,
      },
      water: {
        consumption: 0,
        cost: 0,
      },
      carbonFootprint: {
        emissions: bill.consumption.quantity * 0.5, // kg CO2 per kWh
        scope2: bill.consumption.quantity * 0.5,
      },
      tenantId: bill.tenantId,
    };

    const createdConsumption = await this.energyService.recordEnergyConsumption(
      bill.facilityId || "",
      energyConsumption,
    );

    // Update bill traceability
    await this.billService.updateBill(billId, {
      traceability: {
        ...bill.traceability,
        linkedEnergyConsumptionId: createdConsumption.id,
      },
    });

    return {
      billId,
      energyConsumptionId: createdConsumption.id,
      syncStatus: "synced",
      syncDate: new Date(),
      discrepancies: [],
    };
  }

  /**
   * Integrate bill with facility
   */
  async integrateWithFacility(
    billId: string,
    facilityId: string,
  ): Promise<FacilityIntegration> {
    const bill = await this.billService.getBill(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Link bill to facility
    await this.billService.linkBillToFacility(billId, { facilityId });

    return {
      billId,
      facilityId,
      integrationStatus: "linked",
    };
  }

  /**
   * Integrate bill with warehouse
   */
  async integrateWithWarehouse(
    billId: string,
    warehouseId: string,
  ): Promise<FacilityIntegration> {
    const bill = await this.billService.getBill(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Link bill to warehouse
    await this.billService.linkBillToFacility(billId, { warehouseId });

    return {
      billId,
      facilityId: bill.facilityId || "",
      integrationStatus: "linked",
    };
  }

  /**
   * Full integration (energy + facility + warehouse)
   */
  async performFullIntegration(billId: string): Promise<{
    energy?: EnergyServiceIntegration;
    facility?: FacilityIntegration;
    warehouse?: FacilityIntegration;
  }> {
    const bill = await this.billService.getBill(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    const results: {
      energy?: EnergyServiceIntegration;
      facility?: FacilityIntegration;
      warehouse?: FacilityIntegration;
    } = {};

    // Integrate with energy service if electricity bill
    if (this.config.enableEnergySync && bill.utilityType === "electricity") {
      try {
        results.energy = await this.integrateWithEnergyService(billId);
      } catch (error) {
        console.error("Error integrating with energy service:", error);
      }
    }

    // Integrate with facility
    if (this.config.enableFacilitySync && bill.facilityId) {
      try {
        results.facility = await this.integrateWithFacility(
          billId,
          bill.facilityId,
        );
      } catch (error) {
        console.error("Error integrating with facility:", error);
      }
    }

    // Integrate with warehouse
    if (this.config.enableWarehouseSync && bill.warehouseId) {
      try {
        results.warehouse = await this.integrateWithWarehouse(
          billId,
          bill.warehouseId,
        );
      } catch (error) {
        console.error("Error integrating with warehouse:", error);
      }
    }

    return results;
  }
}

// Singleton instance
let integrationServiceInstance: UtilityBillIntegrationService | null = null;

export function getUtilityBillIntegrationService(
  config?: IntegrationConfig,
): UtilityBillIntegrationService {
  if (!integrationServiceInstance) {
    integrationServiceInstance = new UtilityBillIntegrationService(config);
  }
  return integrationServiceInstance;
}
