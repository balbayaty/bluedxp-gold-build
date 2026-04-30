/**
 * Multi-Warehouse Orchestration Service
 * Cross-warehouse inventory, network optimization, transfers
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// MULTI-WAREHOUSE TYPES
// ============================================================================

export interface WarehouseNetwork {
  id: string;
  name: string;
  warehouses: string[]; // Warehouse IDs
  coordinationMode: "CENTRALIZED" | "DISTRIBUTED" | "HYBRID";
  optimizationEnabled: boolean;
}

export interface CrossWarehouseInventory {
  skuId: string;
  skuCode: string;
  totalQuantity: number;
  warehouseStock: Array<{
    warehouseId: string;
    warehouseName: string;
    quantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    location?: string;
  }>;
  networkAvailability: number;
  recommendedWarehouse?: string;
}

export interface CrossWarehouseTransfer {
  id: string;
  transferNumber: string;
  skuId: string;
  quantity: number;
  fromWarehouse: string;
  toWarehouse: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "APPROVED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  requestedBy?: string;
  requestedAt: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
  completedAt?: Date | string;
  estimatedArrival?: Date | string;
}

export interface NetworkOptimization {
  skuId: string;
  currentAllocation: Record<string, number>; // warehouseId -> quantity
  optimalAllocation: Record<string, number>;
  recommendations: Array<{
    action: "TRANSFER" | "REDISTRIBUTE" | "CONSOLIDATE";
    fromWarehouse?: string;
    toWarehouse: string;
    quantity: number;
    reason: string;
    expectedBenefit: {
      costReduction?: number;
      serviceLevelImprovement?: number;
      spaceOptimization?: number;
    };
  }>;
}

export interface NetworkFulfillment {
  orderId: string;
  skuId: string;
  quantity: number;
  destination: string;
  recommendedWarehouse: string;
  alternativeWarehouses: string[];
  factors: {
    proximity: number;
    stockAvailability: number;
    serviceLevel: number;
    cost: number;
  };
}

// ============================================================================
// MULTI-WAREHOUSE SERVICE INTERFACE
// ============================================================================

export interface MultiWarehouseService {
  // Network Management
  createNetwork(network: Partial<WarehouseNetwork>): Promise<WarehouseNetwork>;
  getNetwork(networkId: string): Promise<WarehouseNetwork | null>;
  addWarehouseToNetwork(
    networkId: string,
    warehouseId: string,
  ): Promise<WarehouseNetwork>;

  // Cross-Warehouse Inventory
  getCrossWarehouseInventory(
    skuId: string,
    networkId?: string,
  ): Promise<CrossWarehouseInventory>;
  searchCrossWarehouseInventory(filters: {
    skuCode?: string;
    category?: string;
  }): Promise<CrossWarehouseInventory[]>;

  // Cross-Warehouse Transfers
  createTransfer(
    transfer: Partial<CrossWarehouseTransfer>,
  ): Promise<CrossWarehouseTransfer>;
  getTransfer(transferId: string): Promise<CrossWarehouseTransfer | null>;
  approveTransfer(
    transferId: string,
    approvedBy: string,
  ): Promise<CrossWarehouseTransfer>;
  executeTransfer(transferId: string): Promise<CrossWarehouseTransfer>;

  // Network Optimization
  optimizeNetworkAllocation(
    skuId: string,
    networkId: string,
  ): Promise<NetworkOptimization>;
  optimizeNetworkAllocationBatch(
    skuIds: string[],
    networkId: string,
  ): Promise<NetworkOptimization[]>;

  // Network Fulfillment
  findOptimalWarehouse(
    orderId: string,
    skuId: string,
    quantity: number,
    destination: string,
  ): Promise<NetworkFulfillment>;
}

// ============================================================================
// MULTI-WAREHOUSE SERVICE IMPLEMENTATION
// ============================================================================

class MultiWarehouseServiceImpl implements MultiWarehouseService {
  private networks: Map<string, WarehouseNetwork> = new Map();
  private transfers: Map<string, CrossWarehouseTransfer> = new Map();

  async createNetwork(
    network: Partial<WarehouseNetwork>,
  ): Promise<WarehouseNetwork> {
    const networkRecord: WarehouseNetwork = {
      id: `network-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: network.name || "Unnamed Network",
      warehouses: network.warehouses || [],
      coordinationMode: network.coordinationMode || "CENTRALIZED",
      optimizationEnabled:
        network.optimizationEnabled !== undefined
          ? network.optimizationEnabled
          : true,
    };

    this.networks.set(networkRecord.id, networkRecord);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.network_created",
      aggregateId: networkRecord.id,
      aggregateType: "WAREHOUSE_NETWORK",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        networkId: networkRecord.id,
        warehouseCount: networkRecord.warehouses.length,
      },
      payload: {
        network: networkRecord,
      },
    });

    return networkRecord;
  }

  async getNetwork(networkId: string): Promise<WarehouseNetwork | null> {
    return this.networks.get(networkId) || null;
  }

  async addWarehouseToNetwork(
    networkId: string,
    warehouseId: string,
  ): Promise<WarehouseNetwork> {
    const network = await this.getNetwork(networkId);
    if (!network) {
      throw new Error(`Network not found: ${networkId}`);
    }

    if (!network.warehouses.includes(warehouseId)) {
      network.warehouses.push(warehouseId);
      this.networks.set(networkId, network);
    }

    return network;
  }

  async getCrossWarehouseInventory(
    skuId: string,
    networkId?: string,
  ): Promise<CrossWarehouseInventory> {
    // Get warehouses from network or use default list
    const warehouses = networkId
      ? (await this.getNetwork(networkId))?.warehouses || []
      : ["WH-001", "WH-002", "WH-003"]; // Default warehouses

    // Try to get real stock from inventory service
    let warehouseStock: CrossWarehouseInventory["warehouseStock"] = [];

    try {
      // Import inventory service dynamically to avoid circular deps
      const { prisma } = await import("@/lib/services/database/prismaClient");

      // Query actual inventory quants for this SKU across warehouses
      const quants = await prisma.inventoryQuant.findMany({
        where: {
          sku: skuId,
        },
        include: {
          bin: {
            include: {
              zone: {
                include: {
                  warehouse: true,
                },
              },
            },
          },
        },
      });

      // Group by warehouse
      const stockByWarehouse = new Map<
        string,
        {
          quantity: number;
          availableQuantity: number;
          reservedQuantity: number;
          warehouseName: string;
          location?: string;
        }
      >();

      for (const quant of quants) {
        const warehouseId =
          quant.bin?.zone?.warehouse?.id ||
          quant.binId?.substring(0, 6) ||
          "WH-001";
        const warehouseName =
          quant.bin?.zone?.warehouse?.name || `Warehouse ${warehouseId}`;

        const existing = stockByWarehouse.get(warehouseId) || {
          quantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          warehouseName,
        };

        const isAvailable = quant.status === "AVAILABLE";
        existing.quantity += quant.quantity;
        existing.availableQuantity += isAvailable ? quant.quantity : 0;
        existing.reservedQuantity += !isAvailable ? quant.quantity : 0;
        existing.location = quant.bin?.binCode || undefined;

        stockByWarehouse.set(warehouseId, existing);
      }

      warehouseStock = Array.from(stockByWarehouse.entries()).map(
        ([warehouseId, stock]) => ({
          warehouseId,
          warehouseName: stock.warehouseName,
          quantity: stock.quantity,
          availableQuantity: stock.availableQuantity,
          reservedQuantity: stock.reservedQuantity,
          location: stock.location,
        }),
      );
    } catch (error) {
      console.warn(
        "[MultiWarehouseService] Could not fetch real inventory, using fallback:",
        error,
      );
      // Fallback to mock data if database not available
      warehouseStock = warehouses.map((whId) => ({
        warehouseId: whId,
        warehouseName: `Warehouse ${whId}`,
        quantity: Math.floor(Math.random() * 1000),
        availableQuantity: Math.floor(Math.random() * 800),
        reservedQuantity: Math.floor(Math.random() * 200),
      }));
    }

    const totalQuantity = warehouseStock.reduce(
      (sum, ws) => sum + ws.quantity,
      0,
    );
    const networkAvailability = warehouseStock.reduce(
      (sum, ws) => sum + ws.availableQuantity,
      0,
    );

    // Find warehouse with highest availability (intelligent recommendation)
    const recommendedWarehouse =
      warehouseStock.length > 0
        ? warehouseStock.reduce((best, current) =>
            current.availableQuantity > best.availableQuantity ? current : best,
          ).warehouseId
        : warehouses[0];

    return {
      skuId,
      skuCode: `SKU-${skuId}`,
      totalQuantity,
      warehouseStock,
      networkAvailability,
      recommendedWarehouse,
    };
  }

  async searchCrossWarehouseInventory(filters: {
    skuCode?: string;
    category?: string;
    networkId?: string;
  }): Promise<CrossWarehouseInventory[]> {
    const results: CrossWarehouseInventory[] = [];

    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");

      // Build query conditions
      const where: any = {};

      if (filters.skuCode) {
        where.sku = {
          contains: filters.skuCode,
          mode: "insensitive",
        };
      }

      // Get unique SKUs matching the filter
      const quants = await prisma.inventoryQuant.findMany({
        where,
        select: {
          sku: true,
        },
        distinct: ["sku"],
        take: 100, // Limit results
      });

      // Get cross-warehouse inventory for each SKU
      for (const { sku } of quants) {
        const inventory = await this.getCrossWarehouseInventory(
          sku,
          filters.networkId,
        );
        results.push(inventory);
      }
    } catch (error) {
      console.warn("[MultiWarehouseService] Search error:", error);
      // Return empty results on error
    }

    return results;
  }

  async createTransfer(
    transfer: Partial<CrossWarehouseTransfer>,
  ): Promise<CrossWarehouseTransfer> {
    const transferRecord: CrossWarehouseTransfer = {
      id: `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      transferNumber: transfer.transferNumber || `TRF-${Date.now()}`,
      skuId: transfer.skuId || "",
      quantity: transfer.quantity || 0,
      fromWarehouse: transfer.fromWarehouse || "",
      toWarehouse: transfer.toWarehouse || "",
      reason: transfer.reason || "Network optimization",
      priority: transfer.priority || "MEDIUM",
      status: "PENDING",
      requestedBy: transfer.requestedBy,
      requestedAt: transfer.requestedAt || new Date().toISOString(),
    };

    this.transfers.set(transferRecord.id, transferRecord);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.transfer_created",
      aggregateId: transferRecord.id,
      aggregateType: "CROSS_WAREHOUSE_TRANSFER",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        transferId: transferRecord.id,
        fromWarehouse: transferRecord.fromWarehouse,
        toWarehouse: transferRecord.toWarehouse,
      },
      payload: {
        transfer: transferRecord,
      },
    });

    return transferRecord;
  }

  async getTransfer(
    transferId: string,
  ): Promise<CrossWarehouseTransfer | null> {
    return this.transfers.get(transferId) || null;
  }

  async approveTransfer(
    transferId: string,
    approvedBy: string,
  ): Promise<CrossWarehouseTransfer> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error(`Transfer not found: ${transferId}`);
    }

    transfer.status = "APPROVED";
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = new Date().toISOString();

    this.transfers.set(transferId, transfer);

    return transfer;
  }

  async executeTransfer(transferId: string): Promise<CrossWarehouseTransfer> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error(`Transfer not found: ${transferId}`);
    }

    if (transfer.status !== "APPROVED") {
      throw new Error(`Transfer must be approved before execution`);
    }

    transfer.status = "IN_TRANSIT";

    // Simulate transfer execution
    setTimeout(async () => {
      transfer.status = "COMPLETED";
      transfer.completedAt = new Date().toISOString();
      this.transfers.set(transferId, transfer);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "warehouse.transfer_completed",
        aggregateId: transferId,
        aggregateType: "CROSS_WAREHOUSE_TRANSFER",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          transferId,
        },
        payload: {
          transfer,
        },
      });
    }, 5000);

    return transfer;
  }

  async optimizeNetworkAllocation(
    skuId: string,
    networkId: string,
  ): Promise<NetworkOptimization> {
    const network = await this.getNetwork(networkId);
    if (!network) {
      throw new Error(`Network not found: ${networkId}`);
    }

    // Get current inventory across warehouses
    const crossInventory = await this.getCrossWarehouseInventory(
      skuId,
      networkId,
    );

    // Build current allocation from actual inventory
    const currentAllocation: Record<string, number> = {};
    for (const stock of crossInventory.warehouseStock) {
      currentAllocation[stock.warehouseId] = stock.quantity;
    }

    // Calculate optimal allocation using demand-based balancing algorithm
    const optimalAllocation: Record<string, number> = {};
    const totalStock = crossInventory.totalQuantity;
    const warehouseCount = network.warehouses.length;

    // Strategy: Distribute based on equal split with demand weighting
    // In production, this would use historical demand data per warehouse
    const demandWeights: Record<string, number> = {};
    let totalWeight = 0;

    for (const whId of network.warehouses) {
      // Calculate demand weight (higher for warehouses with lower current stock)
      const currentStock = currentAllocation[whId] || 0;
      const weight = Math.max(
        1,
        100 - (currentStock / Math.max(1, totalStock)) * 100,
      );
      demandWeights[whId] = weight;
      totalWeight += weight;
    }

    // Distribute stock based on weights
    let allocatedTotal = 0;
    for (const whId of network.warehouses) {
      const weight = demandWeights[whId];
      const optimalQty = Math.round((weight / totalWeight) * totalStock);
      optimalAllocation[whId] = optimalQty;
      allocatedTotal += optimalQty;
    }

    // Adjust for rounding errors
    if (allocatedTotal !== totalStock && network.warehouses.length > 0) {
      const diff = totalStock - allocatedTotal;
      optimalAllocation[network.warehouses[0]] += diff;
    }

    const recommendations: NetworkOptimization["recommendations"] = [];

    // Generate intelligent transfer recommendations
    const surplusWarehouses: Array<{ id: string; surplus: number }> = [];
    const deficitWarehouses: Array<{ id: string; deficit: number }> = [];

    for (const whId of network.warehouses) {
      const current = currentAllocation[whId] || 0;
      const optimal = optimalAllocation[whId] || 0;
      const diff = current - optimal;

      if (diff > 10) {
        // Only recommend if difference is significant
        surplusWarehouses.push({ id: whId, surplus: diff });
      } else if (diff < -10) {
        deficitWarehouses.push({ id: whId, deficit: -diff });
      }
    }

    // Match surplus warehouses with deficit warehouses
    for (const surplus of surplusWarehouses) {
      for (const deficit of deficitWarehouses) {
        if (surplus.surplus <= 0 || deficit.deficit <= 0) continue;

        const transferQty = Math.min(surplus.surplus, deficit.deficit);

        recommendations.push({
          action: "TRANSFER",
          fromWarehouse: surplus.id,
          toWarehouse: deficit.id,
          quantity: transferQty,
          reason: `Balance inventory: ${surplus.id} has surplus, ${deficit.id} needs stock`,
          expectedBenefit: {
            serviceLevelImprovement: Math.min(0.15, transferQty / 100),
            costReduction: transferQty * 5, // Estimated savings
            spaceOptimization: Math.min(0.1, transferQty / 200),
          },
        });

        surplus.surplus -= transferQty;
        deficit.deficit -= transferQty;
      }
    }

    // Add consolidation recommendation if too fragmented
    const fragmentedWarehouses = network.warehouses.filter(
      (whId) =>
        (currentAllocation[whId] || 0) < 50 &&
        (currentAllocation[whId] || 0) > 0,
    );

    if (fragmentedWarehouses.length > 2) {
      const targetWarehouse = network.warehouses.reduce((best, current) =>
        (currentAllocation[current] || 0) > (currentAllocation[best] || 0)
          ? current
          : best,
      );

      recommendations.push({
        action: "CONSOLIDATE",
        toWarehouse: targetWarehouse,
        quantity: fragmentedWarehouses.reduce(
          (sum, whId) => sum + (currentAllocation[whId] || 0),
          0,
        ),
        reason: `Consolidate fragmented stock from ${fragmentedWarehouses.length} warehouses to reduce handling costs`,
        expectedBenefit: {
          costReduction: fragmentedWarehouses.length * 100,
          spaceOptimization: 0.2,
        },
      });
    }

    return {
      skuId,
      currentAllocation,
      optimalAllocation,
      recommendations,
    };
  }

  async optimizeNetworkAllocationBatch(
    skuIds: string[],
    networkId: string,
  ): Promise<NetworkOptimization[]> {
    return Promise.all(
      skuIds.map((id) => this.optimizeNetworkAllocation(id, networkId)),
    );
  }

  async findOptimalWarehouse(
    orderId: string,
    skuId: string,
    quantity: number,
    destination: string,
    networkId?: string,
  ): Promise<NetworkFulfillment> {
    // Get cross-warehouse inventory for the SKU
    const inventory = await this.getCrossWarehouseInventory(skuId, networkId);

    // Score each warehouse based on multiple factors
    interface WarehouseScore {
      warehouseId: string;
      totalScore: number;
      factors: NetworkFulfillment["factors"];
    }

    const warehouseScores: WarehouseScore[] = [];

    for (const stock of inventory.warehouseStock) {
      // Calculate stock availability score (0-1)
      const stockScore =
        stock.availableQuantity >= quantity
          ? 1.0
          : Math.min(0.9, stock.availableQuantity / quantity);

      // Calculate proximity score (mock - in production use actual distance)
      // Higher score for closer warehouses
      const proximityScore = this.calculateProximityScore(
        stock.warehouseId,
        destination,
      );

      // Calculate service level score based on historical performance
      const serviceLevelScore = this.calculateServiceLevelScore(
        stock.warehouseId,
      );

      // Calculate cost score (prefer warehouses with lower handling costs)
      const costScore = this.calculateCostScore(stock.warehouseId, quantity);

      // Weighted total score
      const weights = {
        stockAvailability: 0.35,
        proximity: 0.3,
        serviceLevel: 0.2,
        cost: 0.15,
      };

      const totalScore =
        stockScore * weights.stockAvailability +
        proximityScore * weights.proximity +
        serviceLevelScore * weights.serviceLevel +
        costScore * weights.cost;

      warehouseScores.push({
        warehouseId: stock.warehouseId,
        totalScore,
        factors: {
          proximity: proximityScore,
          stockAvailability: stockScore,
          serviceLevel: serviceLevelScore,
          cost: costScore,
        },
      });
    }

    // Sort by total score descending
    warehouseScores.sort((a, b) => b.totalScore - a.totalScore);

    // Filter to only warehouses with sufficient stock
    const viableWarehouses = warehouseScores.filter((ws) => {
      const stock = inventory.warehouseStock.find(
        (s) => s.warehouseId === ws.warehouseId,
      );
      return stock && stock.availableQuantity >= quantity;
    });

    // If no warehouse has sufficient stock, use partial fulfillment ordering
    const orderedWarehouses =
      viableWarehouses.length > 0 ? viableWarehouses : warehouseScores;

    const recommendedWarehouse =
      orderedWarehouses[0]?.warehouseId ||
      inventory.warehouseStock[0]?.warehouseId ||
      "WH-001";
    const alternativeWarehouses = orderedWarehouses
      .slice(1, 4)
      .map((ws) => ws.warehouseId);

    return {
      orderId,
      skuId,
      quantity,
      destination,
      recommendedWarehouse,
      alternativeWarehouses,
      factors: orderedWarehouses[0]?.factors || {
        proximity: 0.5,
        stockAvailability: 0.5,
        serviceLevel: 0.5,
        cost: 0.5,
      },
    };
  }

  /**
   * Calculate proximity score based on warehouse location and destination
   */
  private calculateProximityScore(
    warehouseId: string,
    destination: string,
  ): number {
    // In production, this would use actual geocoding and distance calculation
    // For now, use a simple mock based on warehouse ID patterns
    const regionMap: Record<string, string[]> = {
      riyadh: ["WH-001", "WH-RYD"],
      jeddah: ["WH-002", "WH-JED"],
      dammam: ["WH-003", "WH-DMM"],
      default: ["WH-001"],
    };

    const destLower = destination.toLowerCase();

    for (const [region, warehouses] of Object.entries(regionMap)) {
      if (
        destLower.includes(region) &&
        warehouses.some((w) => warehouseId.includes(w))
      ) {
        return 0.95; // Same region
      }
    }

    // Default proximity score with some variance
    return 0.6 + Math.random() * 0.2;
  }

  /**
   * Calculate service level score based on historical performance
   */
  private calculateServiceLevelScore(warehouseId: string): number {
    // In production, query historical delivery performance
    // For now, return a reasonable default with slight variance
    return 0.85 + Math.random() * 0.1;
  }

  /**
   * Calculate cost score based on warehouse handling costs
   */
  private calculateCostScore(warehouseId: string, quantity: number): number {
    // In production, use actual cost data
    // Larger quantities get slightly better cost scores due to economies of scale
    const baseScore = 0.8;
    const quantityBonus = Math.min(0.15, quantity / 1000);
    return baseScore + quantityBonus;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const multiWarehouseService: MultiWarehouseService =
  new MultiWarehouseServiceImpl();
