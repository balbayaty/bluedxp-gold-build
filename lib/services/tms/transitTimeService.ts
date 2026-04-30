/**
 * Transit Time Analytics Service
 * Handles transit time tracking, analysis, prediction, and optimization
 */

import {
  TransitTimeRecord,
  TransportJob,
  Lane,
} from "@/types/tms/transportJob";
import { tmsDatabaseAdapter } from "./database/tmsDatabaseAdapter";

export interface TransitTimePrediction {
  predictedTransitTime: number; // hours
  confidence: number; // 0-1
  factors: Array<{
    factor: string;
    impact: number; // positive or negative hours
    reason: string;
  }>;
}

export interface TransitTimeAnalytics {
  averageTransitTime: number;
  medianTransitTime: number;
  minTransitTime: number;
  maxTransitTime: number;
  onTimeRate: number; // percentage
  averageDelay: number;
  delayReasons: Array<{ reason: string; count: number; avgDelay: number }>;
  performanceByLane: Array<{
    laneId: string;
    laneName: string;
    avgTransitTime: number;
    onTimeRate: number;
    jobCount: number;
  }>;
  performanceByTruckType: Record<
    string,
    {
      avgTransitTime: number;
      onTimeRate: number;
      jobCount: number;
    }
  >;
  performanceByTimeOfDay: Array<{
    hour: number;
    avgTransitTime: number;
    jobCount: number;
  }>;
}

export interface RouteSegment {
  segment: TransitTimeRecord["segment"];
  origin: string;
  destination: string;
  startDate: Date;
  endDate?: Date;
  plannedTime?: number;
  actualTime?: number;
}

/**
 * Transit Time Analytics Service
 */
export class TransitTimeService {
  /**
   * Calculate transit time from start to end date
   */
  calculateTransitTime(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return diffTime / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Create transit time record
   */
  async createTransitTimeRecord(
    jobId: string,
    segment: RouteSegment,
    tenantId: string,
  ): Promise<TransitTimeRecord> {
    const endDate = segment.endDate || new Date();
    const actualTransitTime = segment.actualTime
      ? segment.actualTime
      : this.calculateTransitTime(segment.startDate, endDate);

    const delay = segment.plannedTime
      ? actualTransitTime - segment.plannedTime
      : undefined;

    const record: TransitTimeRecord = {
      id: `transit_${jobId}_${Date.now()}`,
      jobId,
      segment: segment.segment,
      segmentName: this.getSegmentName(segment.segment),
      startDate: segment.startDate,
      endDate,
      plannedTransitTime: segment.plannedTime,
      actualTransitTime,
      delay,
      origin: segment.origin,
      destination: segment.destination,
      onTime: delay !== undefined ? delay <= 0 : true,
      delayReason:
        delay && delay > 0
          ? await this.inferDelayReason(segment, delay)
          : undefined,
      createdAt: new Date(),
      tenantId,
    };

    // Store in database
    await tmsDatabaseAdapter.storeTransitTime(tenantId, record);

    return record;
  }

  /**
   * Calculate transit times for a job
   */
  async calculateJobTransitTimes(
    job: TransportJob,
  ): Promise<TransitTimeRecord[]> {
    const records: TransitTimeRecord[] = [];

    // Full transit (POL to POD)
    if (job.shipperDeparture && job.consigneeArrival) {
      const fullTransit = await this.createTransitTimeRecord(
        job.id,
        {
          segment: "full",
          origin: job.polLocation || job.shipmentOrigin || "",
          destination: job.podLocation || job.shipmentDestination || "",
          startDate: job.shipperDeparture,
          endDate: job.consigneeArrival,
          plannedTime: job.eta
            ? this.calculateTransitTime(job.shipperDeparture, job.eta)
            : undefined,
        },
        job.tenantId,
      );
      records.push(fullTransit);
    }

    // POL to Border segment
    if (job.shipperDeparture && job.saudiBorderArrival) {
      const polToBorder = await this.createTransitTimeRecord(
        job.id,
        {
          segment: "pol_to_border",
          origin: job.polLocation || job.shipmentOrigin || "",
          destination: "Saudi Border",
          startDate: job.shipperDeparture,
          endDate: job.saudiBorderArrival,
        },
        job.tenantId,
      );
      records.push(polToBorder);
    }

    // Border to POD segment
    if (job.saudiBorderDeparture && job.consigneeArrival) {
      const borderToPod = await this.createTransitTimeRecord(
        job.id,
        {
          segment: "border_to_pod",
          origin: "Saudi Border",
          destination: job.podLocation || job.shipmentDestination || "",
          startDate: job.saudiBorderDeparture,
          endDate: job.consigneeArrival,
        },
        job.tenantId,
      );
      records.push(borderToPod);
    }

    // Transit border segment (if applicable)
    if (job.transitBorderArrival && job.transitBorderDeparture) {
      const transitBorder = await this.createTransitTimeRecord(
        job.id,
        {
          segment: "transit_border",
          origin: "Transit Border",
          destination: "Transit Border",
          startDate: job.transitBorderArrival,
          endDate: job.transitBorderDeparture,
        },
        job.tenantId,
      );
      records.push(transitBorder);
    }

    // Use existing transit time if available
    if (job.transitTime) {
      const existingFull = records.find((r) => r.segment === "full");
      if (existingFull) {
        existingFull.actualTransitTime = job.transitTime;
        if (existingFull.plannedTransitTime) {
          existingFull.delay =
            job.transitTime - existingFull.plannedTransitTime;
          existingFull.onTime = existingFull.delay <= 0;
        }
      }
    }

    // Use transit time 2 if available (typically represents border-to-POD or second segment)
    if (job.transitTime2) {
      // transitTime2 typically represents the second leg of the journey
      // (e.g., border-to-destination when transitTime is origin-to-border)
      const borderToDestRecord = records.find(
        (r) => r.segment === "border_to_pod",
      );
      if (borderToDestRecord) {
        // Apply transitTime2 to border-to-pod segment
        borderToDestRecord.actualTransitTime = job.transitTime2;
        if (borderToDestRecord.plannedTransitTime) {
          borderToDestRecord.delay =
            job.transitTime2 - borderToDestRecord.plannedTransitTime;
          borderToDestRecord.onTime = borderToDestRecord.delay <= 0;
        }
      } else if (job.saudiBorderDeparture && job.consigneeArrival) {
        // Create a new record for the second segment if it doesn't exist
        const secondSegment = await this.createTransitTimeRecord(
          job.id,
          {
            segment: "border_to_pod",
            origin: "Saudi Border",
            destination: job.podLocation || job.shipmentDestination || "",
            startDate: job.saudiBorderDeparture,
            endDate: job.consigneeArrival,
            actualTime: job.transitTime2,
          },
          job.tenantId,
        );
        records.push(secondSegment);
      }
    }

    return records;
  }

  /**
   * Get segment name
   */
  private getSegmentName(segment: TransitTimeRecord["segment"]): string {
    const names: Record<TransitTimeRecord["segment"], string> = {
      full: "Full Route (POL to POD)",
      pol_to_border: "POL to Border",
      border_to_pod: "Border to POD",
      transit_border: "Transit Border",
      custom: "Custom Segment",
    };
    return names[segment] || segment;
  }

  /**
   * Estimate distance impact on transit time
   * Uses a simplified location-based estimation (in production, integrate with mapping APIs)
   */
  private estimateDistanceImpact(
    origin: string,
    destination: string,
  ): { impact: number; reason: string } {
    const originLower = origin.toLowerCase();
    const destLower = destination.toLowerCase();

    // Known city/region pairs with approximate additional transit time in hours
    const routeModifiers: Record<string, number> = {
      // Gulf region cities
      "riyadh-jeddah": 12,
      "riyadh-dammam": 5,
      "jeddah-dammam": 14,
      "dubai-riyadh": 10,
      "dubai-jeddah": 16,
      "dubai-dammam": 6,
      // Cross-border routes (border crossing adds time)
      border: 4, // Generic border crossing addition
      customs: 3, // Customs processing
    };

    // Check for known routes
    for (const [route, hours] of Object.entries(routeModifiers)) {
      const [city1, city2] = route.split("-");
      if (
        (originLower.includes(city1) && destLower.includes(city2)) ||
        (originLower.includes(city2) && destLower.includes(city1))
      ) {
        return {
          impact: hours,
          reason: `Route-specific estimation for ${city1} ↔ ${city2}`,
        };
      }
    }

    // Check for border/customs keywords
    if (originLower.includes("border") || destLower.includes("border")) {
      return {
        impact: routeModifiers["border"],
        reason: "Border crossing included in route",
      };
    }

    if (originLower.includes("customs") || destLower.includes("customs")) {
      return {
        impact: routeModifiers["customs"],
        reason: "Customs processing included",
      };
    }

    // International routes (different countries detected)
    const gccCountries = ["saudi", "uae", "qatar", "bahrain", "oman", "kuwait"];
    const originCountry = gccCountries.find((c) => originLower.includes(c));
    const destCountry = gccCountries.find((c) => destLower.includes(c));

    if (originCountry && destCountry && originCountry !== destCountry) {
      return {
        impact: 8,
        reason: `International route: ${originCountry} → ${destCountry}`,
      };
    }

    // Default: no specific adjustment
    return {
      impact: 0,
      reason: "Standard route - no specific distance adjustment",
    };
  }

  /**
   * Infer delay reason from transit data
   */
  private async inferDelayReason(
    segment: RouteSegment,
    delay: number,
  ): Promise<string> {
    // Analyze delay based on segment and delay amount
    if (delay > 24) {
      return "Major delay - possible border issues or route problems";
    }
    if (delay > 12) {
      return "Significant delay - possible traffic or customs clearance";
    }
    if (delay > 6) {
      return "Moderate delay - possible traffic or minor issues";
    }
    if (segment.segment === "border_to_pod") {
      return "Border crossing delay";
    }
    if (segment.segment === "transit_border") {
      return "Transit border processing delay";
    }
    return "Minor delay";
  }

  /**
   * Predict transit time for a route
   */
  async predictTransitTime(
    origin: string,
    destination: string,
    truckType?: string,
    laneId?: string,
    historicalData?: TransitTimeRecord[],
  ): Promise<TransitTimePrediction> {
    // Base prediction on historical data
    let predictedTime = 24; // Default 24 hours
    let confidence = 0.5;

    // If lane data available, use lane average
    if (laneId && historicalData) {
      const laneRecords = historicalData.filter((r) =>
        r.jobId.includes(laneId),
      );
      if (laneRecords.length > 0) {
        const avgTime =
          laneRecords.reduce((sum, r) => sum + r.actualTransitTime, 0) /
          laneRecords.length;
        predictedTime = avgTime;
        confidence = Math.min(0.9, 0.5 + laneRecords.length * 0.1);
      }
    }

    // If historical data available, use average
    if (historicalData && historicalData.length > 0) {
      const avgTime =
        historicalData.reduce((sum, r) => sum + r.actualTransitTime, 0) /
        historicalData.length;
      predictedTime = avgTime;
      confidence = Math.min(0.95, 0.6 + historicalData.length * 0.05);
    }

    // Adjust based on truck type
    const factors: TransitTimePrediction["factors"] = [];
    if (truckType) {
      // Reefer trailers typically take longer
      if (truckType.toLowerCase().includes("reefer")) {
        predictedTime += 2;
        factors.push({
          factor: "Truck Type",
          impact: 2,
          reason: "Reefer trailers require additional handling time",
        });
      }
    }

    // Adjust based on distance estimation
    if (origin && destination) {
      const distanceEstimate = this.estimateDistanceImpact(origin, destination);
      if (distanceEstimate.impact !== 0) {
        predictedTime += distanceEstimate.impact;
        factors.push({
          factor: "Route Distance",
          impact: distanceEstimate.impact,
          reason: distanceEstimate.reason,
        });
      }
    }

    return {
      predictedTransitTime: Math.round(predictedTime * 10) / 10,
      confidence,
      factors,
    };
  }

  /**
   * Get transit time analytics
   */
  async getTransitTimeAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    laneId?: string,
  ): Promise<TransitTimeAnalytics> {
    // Fetch transit time records from database
    const records = await tmsDatabaseAdapter.getAllTransitTimeRecords(
      tenantId,
      {
        startDate,
        endDate,
        laneId,
      },
    );

    if (records.length === 0) {
      return {
        averageTransitTime: 0,
        medianTransitTime: 0,
        minTransitTime: 0,
        maxTransitTime: 0,
        onTimeRate: 0,
        averageDelay: 0,
        delayReasons: [],
        performanceByLane: [],
        performanceByTruckType: {},
        performanceByTimeOfDay: [],
      };
    }

    // Calculate basic statistics
    const transitTimes = records.map((r) => r.actualTransitTime);
    const sortedTimes = [...transitTimes].sort((a, b) => a - b);

    const sum = transitTimes.reduce((acc, t) => acc + t, 0);
    const averageTransitTime = sum / transitTimes.length;

    const medianTransitTime =
      sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] +
            sortedTimes[sortedTimes.length / 2]) /
          2
        : sortedTimes[Math.floor(sortedTimes.length / 2)];

    const minTransitTime = sortedTimes[0];
    const maxTransitTime = sortedTimes[sortedTimes.length - 1];

    // Calculate on-time rate
    const onTimeCount = records.filter((r) => r.onTime).length;
    const onTimeRate = (onTimeCount / records.length) * 100;

    // Calculate average delay (only for delayed records)
    const delayedRecords = records.filter((r) => r.delay && r.delay > 0);
    const averageDelay =
      delayedRecords.length > 0
        ? delayedRecords.reduce((acc, r) => acc + (r.delay || 0), 0) /
          delayedRecords.length
        : 0;

    // Aggregate delay reasons
    const delayReasonMap = new Map<
      string,
      { count: number; totalDelay: number }
    >();
    for (const record of delayedRecords) {
      const reason = record.delayReason || "Unknown";
      const existing = delayReasonMap.get(reason) || {
        count: 0,
        totalDelay: 0,
      };
      existing.count++;
      existing.totalDelay += record.delay || 0;
      delayReasonMap.set(reason, existing);
    }

    const delayReasons = Array.from(delayReasonMap.entries())
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        avgDelay: data.totalDelay / data.count,
      }))
      .sort((a, b) => b.count - a.count);

    // Group by lane
    const laneMap = new Map<
      string,
      { times: number[]; onTime: number; total: number }
    >();
    for (const record of records) {
      const lane = record.origin + " → " + record.destination;
      const existing = laneMap.get(lane) || { times: [], onTime: 0, total: 0 };
      existing.times.push(record.actualTransitTime);
      existing.onTime += record.onTime ? 1 : 0;
      existing.total++;
      laneMap.set(lane, existing);
    }

    const performanceByLane = Array.from(laneMap.entries()).map(
      ([laneName, data]) => ({
        laneId: laneName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(),
        laneName,
        avgTransitTime:
          data.times.reduce((a, b) => a + b, 0) / data.times.length,
        onTimeRate: (data.onTime / data.total) * 100,
        jobCount: data.total,
      }),
    );

    // Group by time of day
    const hourMap = new Map<number, { times: number[]; count: number }>();
    for (const record of records) {
      const hour = new Date(record.startDate).getHours();
      const existing = hourMap.get(hour) || { times: [], count: 0 };
      existing.times.push(record.actualTransitTime);
      existing.count++;
      hourMap.set(hour, existing);
    }

    const performanceByTimeOfDay = Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour,
        avgTransitTime:
          data.times.reduce((a, b) => a + b, 0) / data.times.length,
        jobCount: data.count,
      }))
      .sort((a, b) => a.hour - b.hour);

    return {
      averageTransitTime,
      medianTransitTime,
      minTransitTime,
      maxTransitTime,
      onTimeRate,
      averageDelay,
      delayReasons,
      performanceByLane,
      performanceByTruckType: {}, // Would need truck type data in records
      performanceByTimeOfDay,
    };
  }

  /**
   * Optimize transit time
   * Finds the best lane and provides alternatives based on historical data
   */
  async optimizeTransitTime(
    origin: string,
    destination: string,
    tenantId: string,
    constraints?: {
      maxTime?: number;
      preferredLanes?: string[];
      truckType?: string;
    },
  ): Promise<{
    recommendedLane?: string;
    estimatedTime: number;
    alternatives: Array<{
      lane: string;
      estimatedTime: number;
      confidence: number;
      onTimeRate: number;
    }>;
    optimizationFactors: {
      historicalDataPoints: number;
      routeComplexity: "low" | "medium" | "high";
      seasonalAdjustment: number;
    };
  }> {
    // Get analytics for this route
    const analytics = await this.getTransitTimeAnalytics(tenantId);

    // Find lanes matching this origin/destination
    const matchingLanes = analytics.performanceByLane.filter((lane) => {
      const laneLower = lane.laneName.toLowerCase();
      const originLower = origin.toLowerCase();
      const destLower = destination.toLowerCase();
      return laneLower.includes(originLower) || laneLower.includes(destLower);
    });

    // If no matching lanes, use general prediction
    if (matchingLanes.length === 0) {
      const prediction = await this.predictTransitTime(
        origin,
        destination,
        constraints?.truckType,
      );
      return {
        estimatedTime: prediction.predictedTransitTime,
        alternatives: [],
        optimizationFactors: {
          historicalDataPoints: 0,
          routeComplexity: "medium",
          seasonalAdjustment: 1.0,
        },
      };
    }

    // Score and rank lanes
    const scoredLanes = matchingLanes
      .map((lane) => {
        let score = 100;

        // Penalize based on transit time (lower is better)
        score -= (lane.avgTransitTime / 24) * 20;

        // Bonus for on-time rate
        score += (lane.onTimeRate / 100) * 30;

        // Bonus for more data points (more confidence)
        score += Math.min(20, lane.jobCount * 2);

        // Bonus if in preferred lanes
        if (constraints?.preferredLanes?.includes(lane.laneId)) {
          score += 15;
        }

        // Penalty if exceeds max time constraint
        if (constraints?.maxTime && lane.avgTransitTime > constraints.maxTime) {
          score -= 30;
        }

        return {
          ...lane,
          score,
          confidence: Math.min(0.95, 0.5 + lane.jobCount * 0.05),
        };
      })
      .sort((a, b) => b.score - a.score);

    // Calculate route complexity
    const routeComplexity: "low" | "medium" | "high" =
      origin.toLowerCase().includes("border") ||
      destination.toLowerCase().includes("border")
        ? "high"
        : analytics.averageTransitTime > 48
          ? "high"
          : analytics.averageTransitTime > 24
            ? "medium"
            : "low";

    // Seasonal adjustment (mock - in production, use actual seasonal data)
    const currentMonth = new Date().getMonth();
    const seasonalAdjustment =
      currentMonth >= 5 && currentMonth <= 7
        ? 1.15 // Summer - slightly longer
        : currentMonth >= 10 || currentMonth <= 1
          ? 1.1 // Winter
          : 1.0;

    const recommended = scoredLanes[0];
    const alternatives = scoredLanes.slice(1, 4).map((lane) => ({
      lane: lane.laneName,
      estimatedTime:
        Math.round(lane.avgTransitTime * seasonalAdjustment * 10) / 10,
      confidence: lane.confidence,
      onTimeRate: lane.onTimeRate,
    }));

    return {
      recommendedLane: recommended?.laneName,
      estimatedTime:
        Math.round(
          (recommended?.avgTransitTime || analytics.averageTransitTime || 24) *
            seasonalAdjustment *
            10,
        ) / 10,
      alternatives,
      optimizationFactors: {
        historicalDataPoints: matchingLanes.reduce(
          (sum, l) => sum + l.jobCount,
          0,
        ),
        routeComplexity,
        seasonalAdjustment,
      },
    };
  }

  /**
   * Get transit time records for a job
   */
  async getTransitTimeRecords(
    jobId: string,
    tenantId: string,
  ): Promise<TransitTimeRecord[]> {
    return tmsDatabaseAdapter.getTransitTimeRecords(tenantId, jobId);
  }

  /**
   * Compare transit times across lanes
   */
  async compareLaneTransitTimes(
    laneIds: string[],
    tenantId: string,
  ): Promise<
    Array<{
      laneId: string;
      laneName: string;
      avgTransitTime: number;
      onTimeRate: number;
      jobCount: number;
      minTransitTime: number;
      maxTransitTime: number;
      avgDelay: number;
      reliability: number;
    }>
  > {
    // Get analytics which includes lane performance
    const analytics = await this.getTransitTimeAnalytics(tenantId);

    // Filter and enhance lane data
    const results = analytics.performanceByLane
      .filter((lane) => laneIds.length === 0 || laneIds.includes(lane.laneId))
      .map((lane) => {
        // Calculate reliability score (combination of on-time rate and consistency)
        const reliability =
          lane.onTimeRate * 0.7 + (100 - (lane.avgTransitTime / 24) * 10) * 0.3;

        return {
          laneId: lane.laneId,
          laneName: lane.laneName,
          avgTransitTime: Math.round(lane.avgTransitTime * 10) / 10,
          onTimeRate: Math.round(lane.onTimeRate * 10) / 10,
          jobCount: lane.jobCount,
          minTransitTime: Math.round(lane.avgTransitTime * 0.7 * 10) / 10, // Estimate
          maxTransitTime: Math.round(lane.avgTransitTime * 1.5 * 10) / 10, // Estimate
          avgDelay: Math.round(((100 - lane.onTimeRate) / 10) * 10) / 10, // Estimate in hours
          reliability:
            Math.round(Math.max(0, Math.min(100, reliability)) * 10) / 10,
        };
      })
      .sort((a, b) => b.reliability - a.reliability);

    return results;
  }
}

export const transitTimeService = new TransitTimeService();
