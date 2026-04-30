import {
  InventoryService,
  StockOverviewItem,
} from "@/lib/services/wms/inventoryService";

export interface ImpactedBatch {
  sku: string;
  batchNumber: string;
  chemicalName: string;
  quantity: number;
  location: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  projectedLoss: number; // Value in $
  timeToSpoilage: number; // Hours
}

export class InventoryImpactService {
  /**
   * Calculates which inventory items are at risk based on failed Sentinel nodes.
   * @param failedNodeIds List of IDs of nodes that have failed (e.g. '3' for Chiller A)
   */
  static async getImpactedInventory(
    failedNodeIds: string[],
  ): Promise<ImpactedBatch[]> {
    // In a real implementation, this would query the DB for:
    // SELECT * FROM InventoryQuant WHERE location_zone_id IN (SELECT zone_id FROM FacilityNodes WHERE id IN failedNodeIds)

    // For this prototype, we will return simulated real-world data based on the scenario.

    const impacts: ImpactedBatch[] = [];

    // Scenario 1: Cooling Chiller A Failed (Node 3) or Temp Control Sys Failed (Node 6)
    if (failedNodeIds.includes("3") || failedNodeIds.includes("6")) {
      impacts.push(
        {
          sku: "CHEM-092-A",
          batchNumber: "B-2024-001",
          chemicalName: "Acetone (High Purity)",
          quantity: 500,
          location: "Zone 1 - Rack A",
          riskLevel: "HIGH",
          projectedLoss: 12500,
          timeToSpoilage: 4.5,
        },
        {
          sku: "CHEM-105-X",
          batchNumber: "B-2024-045",
          chemicalName: "Benzene Derivative",
          quantity: 120,
          location: "Zone 1 - Rack B",
          riskLevel: "CRITICAL",
          projectedLoss: 45000,
          timeToSpoilage: 1.2,
        },
      );
    }

    // Scenario 2: Ventilation Unit Failed (Node 8)
    if (failedNodeIds.includes("8")) {
      impacts.push({
        sku: "CHEM-VOL-01",
        batchNumber: "B-2023-889",
        chemicalName: "Volatile Organic Compound",
        quantity: 1000,
        location: "Zone 1 - Floor",
        riskLevel: "MEDIUM",
        projectedLoss: 5000,
        timeToSpoilage: 12.0,
      });
    }

    // Scenario 3: Main Power Grid Failed (Node 1) -> Everything is at risk
    if (failedNodeIds.includes("1")) {
      // Add a generic impact for catastrophic failure
      impacts.push({
        sku: "ALL-INVENTORY",
        batchNumber: "N/A",
        chemicalName: "TOTAL FACILITY INVENTORY",
        quantity: 50000,
        location: "Entire Facility",
        riskLevel: "CRITICAL",
        projectedLoss: 2500000,
        timeToSpoilage: 6.0,
      });
    }

    return impacts;
  }
}
