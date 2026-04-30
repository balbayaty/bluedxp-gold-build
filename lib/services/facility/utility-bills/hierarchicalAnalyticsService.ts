/**
 * Hierarchical Analytics Service for Utility Bills
 *
 * Multi-layered breakdown and analysis:
 * - Warehouse → Sub-Warehouse → Area → Zone → Location
 * - Cross-module integration (WMS, Facility, Energy)
 * - Intelligent savings insights across all layers
 * - Support for complex tariff structures
 * - Enhanced visibility for hundreds of warehouses
 */

import type { UtilityBill } from "@/types/utility-bills";
import { getUtilityBillService } from "./utilityBillService";

export interface HierarchicalStructure {
  level: "warehouse" | "sub-warehouse" | "area" | "zone" | "location";
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  children?: HierarchicalStructure[];
  metadata?: {
    type?: string;
    capacity?: number;
    utilization?: number;
    [key: string]: any;
  };
}

export interface HierarchicalBreakdown {
  level: string;
  id: string;
  name: string;
  code?: string;
  bills: UtilityBill[];
  summary: {
    totalBills: number;
    totalAmount: number;
    totalConsumption: number;
    averageAmount: number;
    averageConsumption: number;
    costPerUnit: number;
    efficiency: number;
  };
  children?: HierarchicalBreakdown[];
  savings: SavingsInsight[];
  anomalies: number;
  trends: {
    period: string;
    amount: number;
    consumption: number;
    trend: "increasing" | "decreasing" | "stable";
  }[];
}

export interface SavingsInsight {
  id: string;
  type:
    | "cost-reduction"
    | "consumption-optimization"
    | "tariff-optimization"
    | "efficiency-improvement"
    | "load-shifting";
  category: string;
  title: string;
  description: string;
  currentState: {
    amount: number;
    consumption: number;
    costPerUnit: number;
    efficiency: number;
  };
  potentialSavings: {
    amount: number; // SAR
    percentage: number;
    consumptionReduction?: number;
    annualSavings?: number;
  };
  recommendations: {
    action: string;
    impact: number;
    effort: "low" | "medium" | "high";
    priority: "critical" | "high" | "medium" | "low";
    implementationSteps: string[];
  }[];
  confidence: number; // 0-100
  relatedEntities: {
    type: "warehouse" | "sub-warehouse" | "area" | "zone" | "location";
    ids: string[];
  };
  estimatedROI?: number;
  paybackPeriod?: number; // months
}

export interface TariffAnalysis {
  tariffStructure: {
    type: "flat" | "tiered" | "time-of-use" | "demand-based" | "hybrid";
    rates: {
      tier?: number;
      minQuantity?: number;
      maxQuantity?: number;
      timePeriod?: "peak" | "off-peak" | "shoulder";
      rate: number;
      unit: string;
    }[];
    fixedCharges?: {
      type: string;
      amount: number;
    }[];
    demandCharges?: {
      peakDemand: number;
      rate: number;
    };
  };
  currentUsage: {
    totalConsumption: number;
    consumptionByTier?: Record<number, number>;
    consumptionByTime?: {
      peak: number;
      offPeak: number;
      shoulder?: number;
    };
    peakDemand?: number;
  };
  currentCost: number;
  optimizedCost: number;
  savings: {
    amount: number;
    percentage: number;
    strategies: string[];
  };
  recommendations: {
    strategy: string;
    impact: number;
    effort: "low" | "medium" | "high";
  }[];
}

export interface CrossModuleInsights {
  module: "wms" | "facility" | "energy" | "qhse" | "maintenance";
  insights: {
    type: string;
    title: string;
    description: string;
    impact: {
      savings?: number;
      efficiency?: number;
      risk?: "low" | "medium" | "high";
    };
    relatedBills: string[];
    relatedEntities: string[];
  }[];
}

/**
 * Hierarchical Analytics Service
 */
export class HierarchicalAnalyticsService {
  private billService = getUtilityBillService();

  /**
   * Get hierarchical breakdown of bills
   */
  async getHierarchicalBreakdown(
    structure: HierarchicalStructure[],
    period?: { start: Date; end: Date },
  ): Promise<HierarchicalBreakdown[]> {
    const breakdowns: HierarchicalBreakdown[] = [];

    for (const node of structure) {
      const breakdown = await this.analyzeNode(node, period);
      breakdowns.push(breakdown);
    }

    return breakdowns;
  }

  /**
   * Get intelligent savings insights across all layers
   */
  async getSavingsInsights(
    structure: HierarchicalStructure[],
    period?: { start: Date; end: Date },
  ): Promise<SavingsInsight[]> {
    const allInsights: SavingsInsight[] = [];

    // Get breakdown for all levels
    const breakdowns = await this.getHierarchicalBreakdown(structure, period);

    // Analyze each level for savings opportunities
    for (const breakdown of breakdowns) {
      const insights = await this.analyzeSavingsOpportunities(
        breakdown,
        breakdowns,
      );
      allInsights.push(...insights);
    }

    // Cross-level analysis
    const crossLevelInsights =
      await this.analyzeCrossLevelOpportunities(breakdowns);
    allInsights.push(...crossLevelInsights);

    // Sort by potential savings
    return allInsights.sort(
      (a, b) => b.potentialSavings.amount - a.potentialSavings.amount,
    );
  }

  /**
   * Analyze tariff optimization opportunities
   */
  async analyzeTariffOptimization(
    bills: UtilityBill[],
    tariffStructure: TariffAnalysis["tariffStructure"],
  ): Promise<TariffAnalysis> {
    // Calculate current usage
    const totalConsumption = bills.reduce(
      (sum, b) => sum + (b.consumption?.quantity || 0),
      0,
    );
    const currentCost = bills.reduce((sum, b) => sum + b.totalAmount, 0);

    // Analyze consumption by tier/time
    const consumptionByTier: Record<number, number> = {};
    const consumptionByTime = {
      peak: 0,
      offPeak: 0,
      shoulder: 0,
    };

    let peakDemand = 0;

    for (const bill of bills) {
      if (bill.consumption) {
        // Analyze by tier if tiered pricing
        if (tariffStructure.type === "tiered" && bill.consumption.quantity) {
          for (const rate of tariffStructure.rates) {
            if (rate.tier && rate.minQuantity !== undefined) {
              const tierConsumption = Math.min(
                bill.consumption.quantity,
                (rate.maxQuantity || Infinity) - (rate.minQuantity || 0),
              );
              consumptionByTier[rate.tier] =
                (consumptionByTier[rate.tier] || 0) + tierConsumption;
            }
          }
        }

        // Analyze by time if time-of-use pricing
        if (
          tariffStructure.type === "time-of-use" &&
          bill.consumption.quantity
        ) {
          // This would require hourly data - simplified for now
          consumptionByTime.offPeak += bill.consumption.quantity * 0.6; // Estimate
          consumptionByTime.peak += bill.consumption.quantity * 0.4; // Estimate
        }

        // Track peak demand
        if (bill.consumption.peakDemand) {
          peakDemand = Math.max(peakDemand, bill.consumption.peakDemand);
        }
      }
    }

    // Calculate optimized cost
    let optimizedCost = currentCost;
    const strategies: string[] = [];
    const recommendations: TariffAnalysis["recommendations"] = [];

    // Tiered pricing optimization
    if (tariffStructure.type === "tiered") {
      // Strategy: Reduce consumption to stay in lower tiers
      const highestTier = Math.max(
        ...tariffStructure.rates.map((r) => r.tier || 0),
      );
      if (highestTier > 1) {
        const highestTierRate = tariffStructure.rates.find(
          (r) => r.tier === highestTier,
        );
        const lowerTierRate = tariffStructure.rates.find(
          (r) => r.tier === highestTier - 1,
        );

        if (
          highestTierRate &&
          lowerTierRate &&
          consumptionByTier[highestTier]
        ) {
          const savings =
            consumptionByTier[highestTier] *
            (highestTierRate.rate - lowerTierRate.rate);
          optimizedCost -= savings;
          strategies.push(
            `Reduce consumption by ${consumptionByTier[highestTier].toFixed(0)} units to stay in lower tier`,
          );
          recommendations.push({
            strategy: "Tier Optimization",
            impact: savings,
            effort: "medium",
          });
        }
      }
    }

    // Time-of-use optimization
    if (tariffStructure.type === "time-of-use") {
      const peakRate =
        tariffStructure.rates.find((r) => r.timePeriod === "peak")?.rate || 0;
      const offPeakRate =
        tariffStructure.rates.find((r) => r.timePeriod === "off-peak")?.rate ||
        0;

      if (peakRate > offPeakRate && consumptionByTime.peak > 0) {
        // Strategy: Shift 20% of peak consumption to off-peak
        const shiftable = consumptionByTime.peak * 0.2;
        const savings = shiftable * (peakRate - offPeakRate);
        optimizedCost -= savings;
        strategies.push(
          `Shift ${shiftable.toFixed(0)} units from peak to off-peak hours`,
        );
        recommendations.push({
          strategy: "Load Shifting",
          impact: savings,
          effort: "medium",
        });
      }
    }

    // Demand charge optimization
    if (tariffStructure.demandCharges && peakDemand > 0) {
      // Strategy: Reduce peak demand by 10%
      const reduction = peakDemand * 0.1;
      const savings = reduction * tariffStructure.demandCharges.rate;
      optimizedCost -= savings;
      strategies.push(`Reduce peak demand by ${reduction.toFixed(2)} kW`);
      recommendations.push({
        strategy: "Peak Demand Reduction",
        impact: savings,
        effort: "high",
      });
    }

    const savings = currentCost - optimizedCost;
    const savingsPercentage =
      currentCost > 0 ? (savings / currentCost) * 100 : 0;

    return {
      tariffStructure,
      currentUsage: {
        totalConsumption,
        consumptionByTier:
          Object.keys(consumptionByTier).length > 0
            ? consumptionByTier
            : undefined,
        consumptionByTime:
          tariffStructure.type === "time-of-use"
            ? consumptionByTime
            : undefined,
        peakDemand: peakDemand > 0 ? peakDemand : undefined,
      },
      currentCost,
      optimizedCost,
      savings: {
        amount: savings,
        percentage: savingsPercentage,
        strategies,
      },
      recommendations,
    };
  }

  /**
   * Get cross-module insights
   */
  async getCrossModuleInsights(
    bills: UtilityBill[],
    facilityId?: string,
    warehouseId?: string,
  ): Promise<CrossModuleInsights[]> {
    const insights: CrossModuleInsights[] = [];

    // WMS Integration Insights
    const wmsInsights = await this.analyzeWMSIntegration(bills, warehouseId);
    if (wmsInsights.insights.length > 0) {
      insights.push(wmsInsights);
    }

    // Facility Integration Insights
    const facilityInsights = await this.analyzeFacilityIntegration(
      bills,
      facilityId,
    );
    if (facilityInsights.insights.length > 0) {
      insights.push(facilityInsights);
    }

    // Energy Integration Insights
    const energyInsights = await this.analyzeEnergyIntegration(
      bills,
      facilityId,
    );
    if (energyInsights.insights.length > 0) {
      insights.push(energyInsights);
    }

    return insights;
  }

  /**
   * Get multi-dimensional breakdown
   */
  async getMultiDimensionalBreakdown(
    bills: UtilityBill[],
    dimensions: Array<
      | "warehouse"
      | "sub-warehouse"
      | "area"
      | "zone"
      | "utility-type"
      | "period"
    >,
  ): Promise<Record<string, any>> {
    const breakdown: Record<string, any> = {};

    for (const dimension of dimensions) {
      switch (dimension) {
        case "warehouse":
          breakdown.warehouse = this.groupByWarehouse(bills);
          break;
        case "sub-warehouse":
          breakdown.subWarehouse = this.groupBySubWarehouse(bills);
          break;
        case "area":
          breakdown.area = this.groupByArea(bills);
          break;
        case "zone":
          breakdown.zone = this.groupByZone(bills);
          break;
        case "utility-type":
          breakdown.utilityType = this.groupByUtilityType(bills);
          break;
        case "period":
          breakdown.period = this.groupByPeriod(bills);
          break;
      }
    }

    return breakdown;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async analyzeNode(
    node: HierarchicalStructure,
    period?: { start: Date; end: Date },
  ): Promise<HierarchicalBreakdown> {
    // Get bills for this node
    const { bills } = await this.billService.getBills({
      filters: {
        warehouseIds: node.level === "warehouse" ? [node.id] : undefined,
        dateRange: period,
      },
    });

    // Filter bills that match this node
    const nodeBills = bills.filter((bill) => {
      if (node.level === "warehouse" && bill.warehouseId === node.id)
        return true;
      if (
        node.level === "sub-warehouse" &&
        bill.warehouseName?.includes(node.name)
      )
        return true;
      // Add more matching logic for area, zone, location
      return false;
    });

    // Calculate summary
    const summary = this.calculateSummary(nodeBills);

    // Get savings insights
    const savings = await this.analyzeSavingsOpportunities(
      {
        level: node.level,
        id: node.id,
        name: node.name,
        bills: nodeBills,
        summary,
      } as HierarchicalBreakdown,
      [],
    );

    // Calculate trends
    const trends = this.calculateTrends(nodeBills);

    // Analyze children if any
    const children: HierarchicalBreakdown[] = [];
    if (node.children) {
      for (const child of node.children) {
        const childBreakdown = await this.analyzeNode(child, period);
        children.push(childBreakdown);
      }
    }

    return {
      level: node.level,
      id: node.id,
      name: node.name,
      code: node.code,
      bills: nodeBills,
      summary,
      children: children.length > 0 ? children : undefined,
      savings,
      anomalies: 0, // Would calculate from anomaly detection
      trends,
    };
  }

  private calculateSummary(
    bills: UtilityBill[],
  ): HierarchicalBreakdown["summary"] {
    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalConsumption = bills.reduce(
      (sum, b) => sum + (b.consumption?.quantity || 0),
      0,
    );
    const averageAmount = totalBills > 0 ? totalAmount / totalBills : 0;
    const averageConsumption =
      totalBills > 0 ? totalConsumption / totalBills : 0;
    const costPerUnit =
      totalConsumption > 0 ? totalAmount / totalConsumption : 0;
    const efficiency = this.calculateEfficiency(bills);

    return {
      totalBills,
      totalAmount,
      totalConsumption,
      averageAmount,
      averageConsumption,
      costPerUnit,
      efficiency,
    };
  }

  private calculateEfficiency(bills: UtilityBill[]): number {
    // Efficiency score based on cost per unit compared to benchmark
    const costPerUnit = this.calculateSummary(bills).costPerUnit;
    const benchmark = 0.25; // SAR per kWh (example benchmark)
    const efficiency =
      benchmark > 0
        ? Math.max(
            0,
            Math.min(100, (1 - (costPerUnit - benchmark) / benchmark) * 100),
          )
        : 50;
    return efficiency;
  }

  private calculateTrends(
    bills: UtilityBill[],
  ): HierarchicalBreakdown["trends"] {
    // Group by month
    const monthlyGroups = new Map<string, UtilityBill[]>();
    for (const bill of bills) {
      const monthKey = `${bill.issueDate.getFullYear()}-${String(bill.issueDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(bill);
    }

    const trends: HierarchicalBreakdown["trends"] = [];
    for (const [period, periodBills] of monthlyGroups.entries()) {
      const summary = this.calculateSummary(periodBills);
      const prevPeriod = trends[trends.length - 1];
      const trend = prevPeriod
        ? summary.amount > prevPeriod.amount
          ? "increasing"
          : summary.amount < prevPeriod.amount
            ? "decreasing"
            : "stable"
        : "stable";

      trends.push({
        period,
        amount: summary.totalAmount,
        consumption: summary.totalConsumption,
        trend,
      });
    }

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private async analyzeSavingsOpportunities(
    breakdown: HierarchicalBreakdown,
    allBreakdowns: HierarchicalBreakdown[],
  ): Promise<SavingsInsight[]> {
    const insights: SavingsInsight[] = [];

    // Compare with peers
    const peers = allBreakdowns.filter(
      (b) =>
        b.level === breakdown.level &&
        b.id !== breakdown.id &&
        b.summary.totalConsumption > 0,
    );

    if (peers.length > 0) {
      const peerAvgCostPerUnit =
        peers.reduce((sum, p) => sum + p.summary.costPerUnit, 0) / peers.length;

      if (breakdown.summary.costPerUnit > peerAvgCostPerUnit * 1.1) {
        const savings =
          (breakdown.summary.costPerUnit - peerAvgCostPerUnit) *
          breakdown.summary.totalConsumption;
        insights.push({
          id: `insight-${breakdown.id}-peer-comparison`,
          type: "cost-reduction",
          category: "peer-comparison",
          title: `Higher Cost Per Unit Than Peers`,
          description: `${breakdown.name} has ${(((breakdown.summary.costPerUnit - peerAvgCostPerUnit) / peerAvgCostPerUnit) * 100).toFixed(1)}% higher cost per unit than peer average`,
          currentState: {
            amount: breakdown.summary.totalAmount,
            consumption: breakdown.summary.totalConsumption,
            costPerUnit: breakdown.summary.costPerUnit,
            efficiency: breakdown.summary.efficiency,
          },
          potentialSavings: {
            amount: savings,
            percentage:
              ((breakdown.summary.costPerUnit - peerAvgCostPerUnit) /
                breakdown.summary.costPerUnit) *
              100,
            annualSavings: savings * 12,
          },
          recommendations: [
            {
              action:
                "Review operational practices compared to efficient peers",
              impact: savings * 0.5,
              effort: "medium",
              priority: "high",
              implementationSteps: [
                "Compare operational schedules with efficient peers",
                "Identify best practices from top performers",
                "Implement efficiency improvements",
                "Monitor and track progress",
              ],
            },
          ],
          confidence: 80,
          relatedEntities: {
            type: breakdown.level as any,
            ids: [breakdown.id],
          },
        });
      }
    }

    // Efficiency improvement opportunities
    if (breakdown.summary.efficiency < 70) {
      const potentialImprovement = (70 - breakdown.summary.efficiency) / 100;
      const savings = breakdown.summary.totalAmount * potentialImprovement;
      insights.push({
        id: `insight-${breakdown.id}-efficiency`,
        type: "efficiency-improvement",
        category: "efficiency",
        title: `Efficiency Improvement Opportunity`,
        description: `Improving efficiency from ${breakdown.summary.efficiency.toFixed(1)}% to 70% could save ${savings.toFixed(2)} SAR`,
        currentState: {
          amount: breakdown.summary.totalAmount,
          consumption: breakdown.summary.totalConsumption,
          costPerUnit: breakdown.summary.costPerUnit,
          efficiency: breakdown.summary.efficiency,
        },
        potentialSavings: {
          amount: savings,
          percentage: potentialImprovement * 100,
          annualSavings: savings * 12,
        },
        recommendations: [
          {
            action: "Implement energy efficiency measures",
            impact: savings * 0.6,
            effort: "medium",
            priority: "high",
            implementationSteps: [
              "Conduct energy audit",
              "Identify inefficiencies",
              "Implement efficiency improvements",
              "Monitor results",
            ],
          },
        ],
        confidence: 75,
        relatedEntities: {
          type: breakdown.level as any,
          ids: [breakdown.id],
        },
        estimatedROI: 150,
        paybackPeriod: 18,
      });
    }

    return insights;
  }

  private async analyzeCrossLevelOpportunities(
    breakdowns: HierarchicalBreakdown[],
  ): Promise<SavingsInsight[]> {
    const insights: SavingsInsight[] = [];

    // Find best practices across levels
    const bestPerformers = breakdowns
      .filter((b) => b.summary.totalConsumption > 0)
      .sort((a, b) => a.summary.costPerUnit - b.summary.costPerUnit)
      .slice(0, 3);

    if (bestPerformers.length > 0) {
      const bestCostPerUnit = bestPerformers[0].summary.costPerUnit;
      const worstPerformers = breakdowns
        .filter(
          (b) =>
            b.summary.totalConsumption > 0 &&
            b.summary.costPerUnit > bestCostPerUnit * 1.2,
        )
        .sort((a, b) => b.summary.costPerUnit - a.summary.costPerUnit);

      for (const worst of worstPerformers) {
        const savings =
          (worst.summary.costPerUnit - bestCostPerUnit) *
          worst.summary.totalConsumption;
        insights.push({
          id: `insight-cross-${worst.id}`,
          type: "cost-reduction",
          category: "best-practice-adoption",
          title: `Adopt Best Practices from ${bestPerformers[0].name}`,
          description: `By adopting practices from ${bestPerformers[0].name}, ${worst.name} could reduce costs by ${savings.toFixed(2)} SAR`,
          currentState: {
            amount: worst.summary.totalAmount,
            consumption: worst.summary.totalConsumption,
            costPerUnit: worst.summary.costPerUnit,
            efficiency: worst.summary.efficiency,
          },
          potentialSavings: {
            amount: savings,
            percentage:
              ((worst.summary.costPerUnit - bestCostPerUnit) /
                worst.summary.costPerUnit) *
              100,
            annualSavings: savings * 12,
          },
          recommendations: [
            {
              action: `Study and replicate practices from ${bestPerformers[0].name}`,
              impact: savings * 0.7,
              effort: "medium",
              priority: "high",
              implementationSteps: [
                `Analyze operations at ${bestPerformers[0].name}`,
                "Identify key success factors",
                `Implement similar practices at ${worst.name}`,
                "Monitor and optimize",
              ],
            },
          ],
          confidence: 85,
          relatedEntities: {
            type: worst.level as any,
            ids: [worst.id, bestPerformers[0].id],
          },
        });
      }
    }

    return insights;
  }

  private async analyzeWMSIntegration(
    bills: UtilityBill[],
    warehouseId?: string,
  ): Promise<CrossModuleInsights> {
    const insights: CrossModuleInsights["insights"] = [];

    // Analyze inventory levels vs energy consumption
    // This would integrate with WMS to get inventory data
    // For now, provide structure

    return {
      module: "wms",
      insights,
    };
  }

  private async analyzeFacilityIntegration(
    bills: UtilityBill[],
    facilityId?: string,
  ): Promise<CrossModuleInsights> {
    const insights: CrossModuleInsights["insights"] = [];

    // Analyze facility assets vs energy consumption
    // This would integrate with Facility Management

    return {
      module: "facility",
      insights,
    };
  }

  private async analyzeEnergyIntegration(
    bills: UtilityBill[],
    facilityId?: string,
  ): Promise<CrossModuleInsights> {
    const insights: CrossModuleInsights["insights"] = [];

    // Analyze energy consumption patterns
    // This would integrate with Energy Service

    return {
      module: "energy",
      insights,
    };
  }

  private groupByWarehouse(
    bills: UtilityBill[],
  ): Record<string, UtilityBill[]> {
    const grouped: Record<string, UtilityBill[]> = {};
    for (const bill of bills) {
      const key = bill.warehouseId || bill.warehouseName || "unknown";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bill);
    }
    return grouped;
  }

  private groupBySubWarehouse(
    bills: UtilityBill[],
  ): Record<string, UtilityBill[]> {
    // Extract sub-warehouse from warehouse name (e.g., "Block 12 WH 04" → "WH 04")
    const grouped: Record<string, UtilityBill[]> = {};
    for (const bill of bills) {
      const match = bill.warehouseName?.match(/WH\s*(\d+)/i);
      const key = match ? `WH ${match[1]}` : "unknown";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bill);
    }
    return grouped;
  }

  private groupByArea(bills: UtilityBill[]): Record<string, UtilityBill[]> {
    // Extract area from warehouse name (e.g., "Block 12 WH 04" → "Block 12")
    const grouped: Record<string, UtilityBill[]> = {};
    for (const bill of bills) {
      const match = bill.warehouseName?.match(/Block\s*(\d+)/i);
      const key = match ? `Block ${match[1]}` : "unknown";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bill);
    }
    return grouped;
  }

  private groupByZone(bills: UtilityBill[]): Record<string, UtilityBill[]> {
    // Would need zone data from WMS
    const grouped: Record<string, UtilityBill[]> = {};
    for (const bill of bills) {
      const key = "unknown"; // Would get from WMS integration
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bill);
    }
    return grouped;
  }

  private groupByUtilityType(
    bills: UtilityBill[],
  ): Record<string, UtilityBill[]> {
    const grouped: Record<string, UtilityBill[]> = {};
    for (const bill of bills) {
      const key = bill.utilityType;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bill);
    }
    return grouped;
  }

  private groupByPeriod(bills: UtilityBill[]): Record<string, UtilityBill[]> {
    const grouped: Record<string, UtilityBill[]> = {};
    for (const bill of bills) {
      const monthKey = `${bill.issueDate.getFullYear()}-${String(bill.issueDate.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(bill);
    }
    return grouped;
  }
}

// Singleton instance
let hierarchicalAnalyticsInstance: HierarchicalAnalyticsService | null = null;

export function getHierarchicalAnalyticsService(): HierarchicalAnalyticsService {
  if (!hierarchicalAnalyticsInstance) {
    hierarchicalAnalyticsInstance = new HierarchicalAnalyticsService();
  }
  return hierarchicalAnalyticsInstance;
}
