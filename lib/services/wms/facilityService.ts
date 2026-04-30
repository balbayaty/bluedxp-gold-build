import { PrismaClient, Prisma } from "@prisma/client";
import type { Facility } from "@prisma/client";

const prisma = new PrismaClient();

export type FacilityCreateInput = Prisma.FacilityCreateInput;
export type FacilityUpdateInput = Prisma.FacilityUpdateInput;

export const facilityService = {
  /**
   * List all facilities with optional filtering
   */
  async listFacilities(filters?: {
    countryCode?: string;
    complianceStatus?: string;
    fireSuppressionType?: string;
  }) {
    const where: Prisma.FacilityWhereInput = {};

    if (filters?.countryCode) {
      where.countryCode = filters.countryCode;
    }

    if (filters?.complianceStatus) {
      where.complianceStatus = filters.complianceStatus;
    }

    if (filters?.fireSuppressionType) {
      where.fireSuppressionType = filters.fireSuppressionType;
    }

    return prisma.facility.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single facility by ID
   */
  async getFacility(id: string) {
    return prisma.facility.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new facility
   */
  async createFacility(data: FacilityCreateInput) {
    return prisma.facility.create({
      data,
    });
  },

  /**
   * Update an existing facility
   */
  async updateFacility(id: string, data: FacilityUpdateInput) {
    return prisma.facility.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a facility
   */
  async deleteFacility(id: string) {
    return prisma.facility.delete({
      where: { id },
    });
  },

  /**
   * Generate a facility code based on country and city
   */
  async generateFacilityCode(
    countryCode: string,
    cityCode: string,
  ): Promise<string> {
    const prefix = `${countryCode}-${cityCode}`;
    const count = await prisma.facility.count({
      where: {
        code: { startsWith: prefix },
      },
    });

    // Auto-increment logic: FAC-US-NY-001
    return `${prefix}-${(count + 1).toString().padStart(3, "0")}`;
  },

  /**
   * Validate compliance for a facility
   */
  async validateCompliance(
    id: string,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const facility = await this.getFacility(id);
    if (!facility) throw new Error("Facility not found");

    const issues: string[] = [];

    if (!facility.civilDefenseLicense) {
      issues.push("Missing Civil Defense License");
    }

    if (!facility.fireSuppressionType) {
      issues.push("Missing Fire Suppression System configuration");
    }

    // Example logic: Check if inspection is overdue (1 year validity)
    if (facility.lastInspection) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (facility.lastInspection < oneYearAgo) {
        issues.push("Annual Fire Safety Inspection is overdue");
      }
    } else {
      issues.push("No inspection record found");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },
};
