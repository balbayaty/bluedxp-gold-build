/**
 * Module Licensing Service
 * License validation, feature gating, and usage tracking
 */

import { prisma } from "@/lib/services/database/prismaClient";

export interface LicenseValidationResult {
  valid: boolean;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  features: string[];
  expiresAt?: Date;
  message?: string;
}

export class ModuleLicenseService {
  /**
   * Validate module license
   */
  async validateLicense(
    tenantId: string,
    moduleId: string,
  ): Promise<LicenseValidationResult> {
    try {
      const license = await prisma.moduleLicense.findFirst({
        where: {
          tenantId,
          moduleId,
          status: {
            not: "REVOKED",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!license) {
        return {
          valid: false,
          status: "REVOKED",
          features: [],
          message: "No license found for this module",
        };
      }

      // Check expiration
      if (license.expiresAt && license.expiresAt < new Date()) {
        // Update status to expired
        await prisma.moduleLicense.update({
          where: { id: license.id },
          data: { status: "EXPIRED" },
        });

        return {
          valid: false,
          status: "EXPIRED",
          features: license.features,
          expiresAt: license.expiresAt,
          message: "License has expired",
        };
      }

      // Check status
      if (license.status !== "ACTIVE") {
        return {
          valid: false,
          status: license.status as any,
          features: license.features,
          expiresAt: license.expiresAt || undefined,
          message: `License status: ${license.status}`,
        };
      }

      return {
        valid: true,
        status: "ACTIVE",
        features: license.features,
        expiresAt: license.expiresAt || undefined,
      };
    } catch (error) {
      console.error("Error validating license:", error);
      return {
        valid: false,
        status: "REVOKED",
        features: [],
        message: "Error validating license",
      };
    }
  }

  /**
   * Check if feature is enabled
   */
  async isFeatureEnabled(
    tenantId: string,
    moduleId: string,
    feature: string,
  ): Promise<boolean> {
    const validation = await this.validateLicense(tenantId, moduleId);
    if (!validation.valid) {
      return false;
    }

    return (
      validation.features.includes(feature) || validation.features.includes("*")
    );
  }

  /**
   * Create or update license
   */
  async upsertLicense(data: {
    tenantId: string;
    moduleId: string;
    licenseKey: string;
    status: string;
    expiresAt?: Date;
    features: string[];
  }) {
    return prisma.moduleLicense.upsert({
      where: { licenseKey: data.licenseKey },
      update: {
        tenantId: data.tenantId,
        moduleId: data.moduleId,
        status: data.status,
        expiresAt: data.expiresAt,
        features: data.features,
      },
      create: data,
    });
  }

  /**
   * Revoke license
   */
  async revokeLicense(licenseKey: string) {
    return prisma.moduleLicense.update({
      where: { licenseKey },
      data: { status: "REVOKED" },
    });
  }

  /**
   * Get all licenses for tenant
   */
  async getTenantLicenses(tenantId: string) {
    return prisma.moduleLicense.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Track feature usage
   */
  async trackUsage(tenantId: string, moduleId: string, feature: string) {
    // In a full implementation, this would track usage metrics
    // For now, we just validate the license
    const enabled = await this.isFeatureEnabled(tenantId, moduleId, feature);
    if (!enabled) {
      throw new Error(
        `Feature ${feature} is not enabled for module ${moduleId}`,
      );
    }
    return true;
  }
}

export const moduleLicenseService = new ModuleLicenseService();
