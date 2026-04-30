/**
 * Transportation Analytics Service
 *
 * Comprehensive analytics with advanced metrics, reporting, and insights
 */

import type {
  Shipment,
  TransportationAnalytics,
  TransportMode,
  ShipmentType,
  ShipmentStatus,
} from "@/types/tms";

export interface AnalyticsRequest {
  filters?: {
    dateFrom?: Date | string;
    dateTo?: Date | string;
    mode?: TransportMode[];
    type?: ShipmentType[];
    status?: ShipmentStatus[];
    carrierId?: string[];
    origin?: string;
    destination?: string;
  };
  groupBy?:
    | "DAY"
    | "WEEK"
    | "MONTH"
    | "QUARTER"
    | "YEAR"
    | "MODE"
    | "CARRIER"
    | "TYPE";
  metrics?: string[];
}

export class TransportationAnalyticsService {
  /**
   * Get comprehensive analytics
   */
  async getAnalytics(
    shipments: Shipment[],
    request?: AnalyticsRequest,
  ): Promise<TransportationAnalytics> {
    const { filters, groupBy } = request || {};

    // Filter shipments
    let filteredShipments = this.filterShipments(shipments, filters);

    // Calculate metrics
    const totalShipments = filteredShipments.length;
    const activeShipments = filteredShipments.filter((s) =>
      [
        "BOOKED",
        "PICKED_UP",
        "IN_TRANSIT",
        "AT_PORT",
        "CUSTOMS_CLEARANCE",
        "OUT_FOR_DELIVERY",
      ].includes(s.status),
    ).length;
    const deliveredShipments = filteredShipments.filter(
      (s) => s.status === "DELIVERED",
    ).length;
    const inTransitShipments = filteredShipments.filter(
      (s) => s.status === "IN_TRANSIT",
    ).length;

    // Performance metrics
    const onTimeDeliveryRate =
      this.calculateOnTimeDeliveryRate(filteredShipments);
    const averageTransitTime =
      this.calculateAverageTransitTime(filteredShipments);
    const exceptionRate = this.calculateExceptionRate(filteredShipments);

    // Financial metrics
    const totalFreightCost = this.calculateTotalFreightCost(filteredShipments);
    const averageCostPerShipment = totalFreightCost / (totalShipments || 1);
    const currency = filteredShipments[0]?.currency || "USD";

    // Mode distribution
    const modeDistribution = this.calculateModeDistribution(filteredShipments);

    // Carrier performance
    const carrierPerformance =
      this.calculateCarrierPerformance(filteredShipments);

    // Customs metrics
    const customsClearanceRate =
      this.calculateCustomsClearanceRate(filteredShipments);
    const averageClearanceTime =
      this.calculateAverageClearanceTime(filteredShipments);

    // Period
    const period = {
      start:
        filters?.dateFrom ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: filters?.dateTo || new Date().toISOString(),
    };

    return {
      totalShipments,
      activeShipments,
      deliveredShipments,
      inTransitShipments,
      onTimeDeliveryRate,
      averageTransitTime,
      exceptionRate,
      totalFreightCost,
      averageCostPerShipment,
      currency,
      modeDistribution,
      carrierPerformance,
      customsClearanceRate,
      averageClearanceTime,
      period,
    };
  }

  /**
   * Filter shipments based on criteria
   */
  private filterShipments(
    shipments: Shipment[],
    filters?: AnalyticsRequest["filters"],
  ): Shipment[] {
    if (!filters) return shipments;

    return shipments.filter((shipment) => {
      // Date filter
      if (filters.dateFrom) {
        const shipmentDate = new Date(shipment.createdAt);
        const fromDate = new Date(filters.dateFrom);
        if (shipmentDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const shipmentDate = new Date(shipment.createdAt);
        const toDate = new Date(filters.dateTo);
        if (shipmentDate > toDate) return false;
      }

      // Mode filter
      if (filters.mode && filters.mode.length > 0) {
        if (!filters.mode.includes(shipment.mode)) return false;
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(shipment.type)) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(shipment.status)) return false;
      }

      // Carrier filter
      if (filters.carrierId && filters.carrierId.length > 0) {
        if (
          !shipment.carrierId ||
          !filters.carrierId.includes(shipment.carrierId)
        )
          return false;
      }

      // Origin filter
      if (filters.origin) {
        if (
          shipment.origin.address.country !== filters.origin &&
          shipment.origin.address.city !== filters.origin
        )
          return false;
      }

      // Destination filter
      if (filters.destination) {
        if (
          shipment.destination.address.country !== filters.destination &&
          shipment.destination.address.city !== filters.destination
        )
          return false;
      }

      return true;
    });
  }

  /**
   * Calculate on-time delivery rate
   */
  private calculateOnTimeDeliveryRate(shipments: Shipment[]): number {
    const delivered = shipments.filter(
      (s) =>
        s.status === "DELIVERED" && s.actualDelivery && s.estimatedDelivery,
    );
    if (delivered.length === 0) return 0;

    const onTime = delivered.filter((s) => {
      const actual = new Date(s.actualDelivery!);
      const estimated = new Date(s.estimatedDelivery!);
      return actual <= estimated;
    }).length;

    return (onTime / delivered.length) * 100;
  }

  /**
   * Calculate average transit time
   */
  private calculateAverageTransitTime(shipments: Shipment[]): number {
    const delivered = shipments.filter(
      (s) => s.status === "DELIVERED" && s.actualDelivery && s.pickupDate,
    );

    if (delivered.length === 0) return 0;

    const totalHours = delivered.reduce((sum, s) => {
      const pickup = new Date(s.pickupDate!);
      const delivery = new Date(s.actualDelivery!);
      return sum + (delivery.getTime() - pickup.getTime()) / (1000 * 60 * 60);
    }, 0);

    return totalHours / delivered.length;
  }

  /**
   * Calculate exception rate
   */
  private calculateExceptionRate(shipments: Shipment[]): number {
    const withExceptions = shipments.filter((s) => s.exceptions.length > 0);
    return (withExceptions.length / (shipments.length || 1)) * 100;
  }

  /**
   * Calculate total freight cost
   */
  private calculateTotalFreightCost(shipments: Shipment[]): number {
    return shipments.reduce(
      (sum, s) => sum + (s.freightCharges?.total || 0),
      0,
    );
  }

  /**
   * Calculate mode distribution
   */
  private calculateModeDistribution(
    shipments: Shipment[],
  ): TransportationAnalytics["modeDistribution"] {
    const modeCounts = new Map<TransportMode, number>();

    shipments.forEach((s) => {
      const count = modeCounts.get(s.mode) || 0;
      modeCounts.set(s.mode, count + 1);
    });

    const total = shipments.length || 1;
    return Array.from(modeCounts.entries()).map(([mode, count]) => ({
      mode,
      count,
      percentage: (count / total) * 100,
    }));
  }

  /**
   * Calculate carrier performance
   */
  private calculateCarrierPerformance(
    shipments: Shipment[],
  ): TransportationAnalytics["carrierPerformance"] {
    const carrierData = new Map<
      string,
      {
        name: string;
        shipments: number;
        onTime: number;
        total: number;
        totalCost: number;
      }
    >();

    shipments.forEach((s) => {
      if (!s.carrierId || !s.carrierName) return;

      const data = carrierData.get(s.carrierId) || {
        name: s.carrierName,
        shipments: 0,
        onTime: 0,
        total: 0,
        totalCost: 0,
      };

      data.shipments++;
      data.totalCost += s.freightCharges?.total || 0;

      if (s.status === "DELIVERED" && s.actualDelivery && s.estimatedDelivery) {
        data.total++;
        const actual = new Date(s.actualDelivery);
        const estimated = new Date(s.estimatedDelivery);
        if (actual <= estimated) {
          data.onTime++;
        }
      }

      carrierData.set(s.carrierId, data);
    });

    return Array.from(carrierData.entries()).map(([carrierId, data]) => ({
      carrierId,
      carrierName: data.name,
      shipmentCount: data.shipments,
      onTimeRate: data.total > 0 ? (data.onTime / data.total) * 100 : 0,
      averageCost: data.shipments > 0 ? data.totalCost / data.shipments : 0,
    }));
  }

  /**
   * Calculate customs clearance rate
   */
  private calculateCustomsClearanceRate(shipments: Shipment[]): number {
    const withCustoms = shipments.filter((s) => s.customs);
    if (withCustoms.length === 0) return 0;

    const cleared = withCustoms.filter(
      (s) => s.customs?.status === "CLEARED",
    ).length;
    return (cleared / withCustoms.length) * 100;
  }

  /**
   * Calculate average clearance time
   */
  private calculateAverageClearanceTime(shipments: Shipment[]): number {
    const cleared = shipments.filter(
      (s) =>
        s.customs?.status === "CLEARED" &&
        s.customs?.clearanceDate &&
        s.bookingDate,
    );

    if (cleared.length === 0) return 0;

    const totalHours = cleared.reduce((sum, s) => {
      const booking = new Date(s.bookingDate!);
      const clearance = new Date(s.customs!.clearanceDate!);
      return sum + (clearance.getTime() - booking.getTime()) / (1000 * 60 * 60);
    }, 0);

    return totalHours / cleared.length;
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(
    shipments: Shipment[],
    metric: "COST" | "TIME" | "VOLUME" | "EXCEPTIONS",
    period: "DAY" | "WEEK" | "MONTH",
  ): Promise<Array<{ period: string; value: number }>> {
    // Group shipments by period
    const grouped = new Map<string, Shipment[]>();

    shipments.forEach((s) => {
      const date = new Date(s.createdAt);
      let key = "";

      if (period === "DAY") {
        key = date.toISOString().split("T")[0];
      } else if (period === "WEEK") {
        const week = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
      } else if (period === "MONTH") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      const group = grouped.get(key) || [];
      group.push(s);
      grouped.set(key, group);
    });

    // Calculate metric for each period
    return Array.from(grouped.entries())
      .map(([period, periodShipments]) => {
        let value = 0;

        if (metric === "COST") {
          value = this.calculateTotalFreightCost(periodShipments);
        } else if (metric === "TIME") {
          value = this.calculateAverageTransitTime(periodShipments);
        } else if (metric === "VOLUME") {
          value = periodShipments.length;
        } else if (metric === "EXCEPTIONS") {
          value = this.calculateExceptionRate(periodShipments);
        }

        return { period, value };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}

export const transportationAnalyticsService =
  new TransportationAnalyticsService();
