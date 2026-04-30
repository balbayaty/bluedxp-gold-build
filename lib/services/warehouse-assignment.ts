/**
 * Warehouse Assignment Recommendation Service
 * Recommends warehouses based on MSDS compliance requirements, space availability, and commercial agreements
 */

import {
  MSDSStorageRequirements,
  WarehouseAssignmentRecommendation,
  WarehouseAssignmentConfig,
  FilteredWarehouseDiagnostic,
} from "./warehouse-assignment-types";
import { PrismaClient } from "@prisma/client";
import type { Facility, Warehouse, WarehouseArea } from "@prisma/client";

const prisma = new PrismaClient();

// Extended type to include relations
type WarehouseWithRelations = Warehouse & {
  facility: Facility;
  areas: WarehouseArea[];
};

// Track filtered warehouses for diagnostics
let lastFilteredWarehouses: FilteredWarehouseDiagnostic[] = [];

export const warehouseAssignmentService = {
  /**
   * Calculate compatibility score (0-100)
   */
  calculateComplianceScore(
    requirements: MSDSStorageRequirements,
    facility: Facility,
    area: WarehouseArea,
  ): { score: number; reasons: string[] } {
    let score = 100;
    const reasons: string[] = [];

    // 1. Hazard Class Compatibility
    if (requirements.hazardClass) {
      // Check Facility Permit
      // If facility is strictly "General" and hazmat is required, penalize.
      if (
        facility.type === "GENERAL_STORAGE" &&
        ["1", "2", "3", "4", "5", "6", "7", "8"].some((h) =>
          requirements.hazardClass?.startsWith(h),
        )
      ) {
        score -= 100; // Critical fail
        reasons.push(`Facility ${facility.name} is not HAZMAT certified`);
      }

      // Check Area Allowed Hazards
      if (
        !area.allowedHazards.includes(requirements.hazardClass) &&
        !area.allowsHazards
      ) {
        score -= 100;
        reasons.push(
          `Area ${area.name} does not accept hazard class ${requirements.hazardClass}`,
        );
      }
    }

    // 2. Temperature Control
    if (requirements.temperatureControlled) {
      if (!area.temperatureZone && !area.temperatureMin) {
        score -= 100;
        reasons.push(`Area ${area.name} is not temperature controlled`);
      } else if (
        requirements.minTemperature !== undefined &&
        requirements.maxTemperature !== undefined
      ) {
        // Check range
        const areaMin = area.temperatureMin ?? -999;
        const areaMax = area.temperatureMax ?? 999;

        if (
          areaMin > requirements.maxTemperature ||
          areaMax < requirements.minTemperature
        ) {
          score -= 100;
          reasons.push(
            `Temperature mismatch: Req ${requirements.minTemperature} to ${requirements.maxTemperature}, Area ${areaMin} to ${areaMax}`,
          );
        }
      }
    }

    // 3. Separation/Segregation (Advanced) - future functionality
    // ...

    return { score: Math.max(0, score), reasons };
  },

  /**
   * Main recommendation engine
   */
  async getWarehouseRecommendations(
    msdsRequirements: MSDSStorageRequirements,
    // Optional: pass specific warehouses, otherwise we fetch all
    candidates?: WarehouseWithRelations[],
    config: WarehouseAssignmentConfig = {
      minScore: 70,
      maxResults: 5,
      prioritizeOwned: true,
    },
  ): Promise<WarehouseAssignmentRecommendation[]> {
    // 1. Fetch Candidates if not provided
    let warehouses = candidates;
    if (!warehouses) {
      warehouses = await prisma.warehouse.findMany({
        include: {
          facility: true,
          areas: true,
        },
      });
    }

    const recommendations: WarehouseAssignmentRecommendation[] = [];
    // Reset filtered warehouses tracking for this call
    lastFilteredWarehouses = [];

    for (const warehouse of warehouses) {
      // Find best area within warehouse
      let bestArea: WarehouseArea | null = null;
      let bestAreaScore = 0;
      let bestAreaReasons: string[] = [];

      for (const area of warehouse.areas) {
        const { score, reasons } = this.calculateComplianceScore(
          msdsRequirements,
          warehouse.facility,
          area,
        );

        if (score > bestAreaScore) {
          bestAreaScore = score;
          bestArea = area;
          bestAreaReasons = reasons;
        }
      }

      // If no valid area found (score 0), track as filtered
      if (!bestArea || bestAreaScore === 0) {
        const primaryReason =
          bestAreaReasons.length > 0
            ? bestAreaReasons[0]
            : "No compatible area found in warehouse";
        lastFilteredWarehouses.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          reason: primaryReason,
          score: bestAreaScore,
          details: bestAreaReasons,
        });
        continue;
      }

      // Calculate other scores (Commercial, Space)
      // Space Score
      const utilization =
        bestArea.capacity > 0
          ? (bestArea.currentStock / bestArea.capacity) * 100
          : 100;
      const spaceScore = Math.max(0, 100 - utilization); // Simple logic: more empty space = better

      // Commercial Score (Mock for now)
      const commercialScore = 80;

      // Weighted Total
      const factors = config.weightFactors || {
        compliance: 0.6,
        space: 0.2,
        commercial: 0.2,
        distance: 0,
      };
      const totalScore =
        bestAreaScore * factors.compliance +
        spaceScore * factors.space +
        commercialScore * factors.commercial;

      if (totalScore >= config.minScore) {
        recommendations.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          score: Math.round(totalScore),
          breakdown: {
            compliance: bestAreaScore,
            space: spaceScore,
            commercial: commercialScore,
            distance: this.calculateGeoDistance(
              (warehouse.location as any)?.lat ?? 0,
              (warehouse.location as any)?.lng ?? 0,
              criteria.preferredLocation?.lat ?? 0,
              criteria.preferredLocation?.lng ?? 0,
            ),
          },
          matchingAreas: [bestArea.name],
          reasons:
            bestAreaReasons.length > 0 ? bestAreaReasons : ["Fully compatible"],
          location: {
            lat: (warehouse.location as any)?.lat ?? 0,
            lng: (warehouse.location as any)?.lng ?? 0,
            address: warehouse.facility.address ?? "",
          },
        });
      } else {
        // Track warehouses filtered due to low score
        lastFilteredWarehouses.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          reason: `Total score ${Math.round(totalScore)} below minimum threshold of ${config.minScore}`,
          score: Math.round(totalScore),
          details: [
            `Compliance score: ${bestAreaScore}`,
            `Space score: ${spaceScore}`,
            `Commercial score: ${commercialScore}`,
          ],
        });
      }
    }

    // Sort by score
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxResults);
  },

  /**
   * Calculate geographic distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  calculateGeoDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Return 0 if any coordinates are missing
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return 0;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  },

  /**
   * Convert degrees to radians
   */
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Get diagnostic information about warehouses that were filtered out
   * during the last recommendation call
   */
  getFilteredWarehousesDiagnostics(): FilteredWarehouseDiagnostic[] {
    return lastFilteredWarehouses;
  },
};
