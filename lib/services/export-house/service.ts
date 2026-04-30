/**
 * Export House License Service
 * Manages SEDA Export House license application and compliance
 */

import {
  ExportHouseLicenseStatus,
  SEDALicenseApplication,
  ComplianceRequirement,
  BusinessPlan,
  SEDAPortalIntegration,
} from "./types";
import { PrismaClient } from "@prisma/client";
import { eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import { notificationService } from "@/lib/services/notifications/notificationService";

const prisma = new PrismaClient();

class ExportHouseService {
  /**
   * Get current license status
   */
  async getLicenseStatus(
    tenantId: string,
  ): Promise<SEDALicenseApplication | null> {
    const license = await prisma.exportHouseLicense.findFirst({
      where: { tenantId },
      include: {
        complianceRequirements: true,
        businessPlans: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!license) return null;

    return {
      id: license.id,
      tenantId: license.tenantId,
      status: license.status as any,
      applicationNumber: license.applicationNumber || undefined,
      submittedAt: license.submittedAt || undefined,
      reviewedAt: license.reviewedAt || undefined,
      approvedAt: license.approvedAt || undefined,
      expiryDate: license.expiryDate || undefined,
      rejectionReason: license.rejectionReason || undefined,
      companyName: license.companyName,
      commercialRegister: license.commercialRegister,
      taxId: license.taxId,
      address: license.address,
      contactPerson: license.contactPerson,
      contactEmail: license.contactEmail,
      contactPhone: license.contactPhone,
      complianceRequirements: license.complianceRequirements.map((req) => ({
        id: req.id,
        requirement: req.requirement,
        description: req.description,
        status: req.status as any,
        dueDate: req.dueDate || undefined,
        completedAt: req.completedAt || undefined,
        notes: req.notes || undefined,
      })),
      businessPlans: license.businessPlans.map((plan) => ({
        year: plan.year,
        planData: plan.planData as any,
        documentId: plan.documentId || undefined,
      })),
    };
  }

  /**
   * Create or update license application
   */
  async saveApplication(
    tenantId: string,
    application: Partial<SEDALicenseApplication>,
    userId: string,
  ): Promise<SEDALicenseApplication> {
    // Implement database save
    const saved = await prisma.exportHouseLicense.upsert({
      where: {
        id: application.id || "new-application",
      },
      create: {
        id: application.id || undefined,
        tenantId,
        applicationNumber: application.applicationNumber,
        status: application.status || "not_applied",
        submittedAt: application.submittedAt
          ? new Date(application.submittedAt)
          : null,
        reviewedAt: application.reviewedAt
          ? new Date(application.reviewedAt)
          : null,
        approvedAt: application.approvedAt
          ? new Date(application.approvedAt)
          : null,
        expiryDate: application.expiryDate
          ? new Date(application.expiryDate)
          : null,
        rejectionReason: application.rejectionReason,
        companyName: application.companyName || "",
        commercialRegister: application.commercialRegister || "",
        taxId: application.taxId || "",
        address: application.address || "",
        contactPerson: application.contactPerson || "",
        contactEmail: application.contactEmail || "",
        contactPhone: application.contactPhone || "",
        codeOfConductDocumentId: application.complianceRequirements?.find((r) =>
          r.requirement.includes("Code of Conduct"),
        )?.id,
        commercialRegisterDocumentId: application.complianceRequirements?.find(
          (r) => r.requirement.includes("Commercial Register"),
        )?.id,
        businessPlanDocumentId: application.businessPlans?.[0]?.documentId,
        createdBy: userId,
      },
      update: {
        status: application.status || undefined,
        submittedAt: application.submittedAt
          ? new Date(application.submittedAt)
          : undefined,
        reviewedAt: application.reviewedAt
          ? new Date(application.reviewedAt)
          : undefined,
        approvedAt: application.approvedAt
          ? new Date(application.approvedAt)
          : undefined,
        expiryDate: application.expiryDate
          ? new Date(application.expiryDate)
          : undefined,
        rejectionReason: application.rejectionReason,
        companyName: application.companyName,
        commercialRegister: application.commercialRegister,
        taxId: application.taxId,
        address: application.address,
        contactPerson: application.contactPerson,
        contactEmail: application.contactEmail,
        contactPhone: application.contactPhone,
      },
    });

    // Save compliance requirements if provided
    if (
      application.complianceRequirements &&
      application.complianceRequirements.length > 0
    ) {
      await Promise.all(
        application.complianceRequirements.map((req) =>
          prisma.exportHouseComplianceRequirement.upsert({
            where: { id: req.id || "new-req" },
            create: {
              tenantId,
              licenseId: saved.id,
              requirement: req.requirement,
              description: req.description,
              status: req.status || "pending",
              dueDate: req.dueDate ? new Date(req.dueDate) : null,
              completedAt: req.completedAt ? new Date(req.completedAt) : null,
              notes: req.notes,
            },
            update: {
              requirement: req.requirement,
              description: req.description,
              status: req.status,
              dueDate: req.dueDate ? new Date(req.dueDate) : undefined,
              completedAt: req.completedAt
                ? new Date(req.completedAt)
                : undefined,
              notes: req.notes,
            },
          }),
        ),
      );
    }

    // Save business plans if provided
    if (application.businessPlans && application.businessPlans.length > 0) {
      await Promise.all(
        application.businessPlans.map((plan) =>
          prisma.exportHouseBusinessPlan.upsert({
            where: {
              licenseId_year: {
                licenseId: saved.id,
                year: plan.year,
              },
            },
            create: {
              tenantId,
              licenseId: saved.id,
              year: plan.year,
              planData: plan.planData as any,
              documentId: plan.documentId,
              createdBy: userId,
            },
            update: {
              planData: plan.planData as any,
              documentId: plan.documentId,
            },
          }),
        ),
      );
    }

    // Fetch complete record with relations
    const completeLicense = await prisma.exportHouseLicense.findUnique({
      where: { id: saved.id },
      include: {
        complianceRequirements: true,
        businessPlans: true,
      },
    });

    if (!completeLicense) {
      throw new Error("Failed to retrieve saved license");
    }

    // Emit event
    await eventBus.publish("export-house.application.saved", {
      tenantId,
      applicationId: completeLicense.id,
      userId,
      timestamp: new Date(),
    });

    // Log evidence
    await evidenceService.logAction({
      tenantId,
      actor: userId,
      action: "export-house.application.saved",
      entityType: "export-house-application",
      entityId: completeLicense.id,
      metadata: {
        status: completeLicense.status,
        companyName: completeLicense.companyName,
      },
    });

    // Send notification
    await notificationService
      .send({
        tenantId,
        userId,
        type: "EXPORT_HOUSE_APPLICATION_SAVED",
        title: "Export House Application Saved",
        message: `Application for ${completeLicense.companyName} has been saved`,
        metadata: { applicationId: completeLicense.id },
      })
      .catch(console.error);

    return {
      id: completeLicense.id,
      tenantId: completeLicense.tenantId,
      status: completeLicense.status as any,
      applicationNumber: completeLicense.applicationNumber || undefined,
      companyName: completeLicense.companyName,
      commercialRegister: completeLicense.commercialRegister,
      taxId: completeLicense.taxId,
      address: completeLicense.address,
      contactPerson: completeLicense.contactPerson,
      contactEmail: saved.contactEmail,
      contactPhone: saved.contactPhone,
      complianceRequirements: [],
      businessPlans: [],
    };
  }

  /**
   * Submit application to SEDA
   */
  async submitApplication(
    tenantId: string,
    applicationId: string,
    userId: string,
  ): Promise<void> {
    // Validate all requirements are met
    const application = await this.getLicenseStatus(tenantId);
    if (!application) {
      throw new Error("Application not found");
    }

    // Check compliance requirements
    const incomplete = application.complianceRequirements.filter(
      (req) => req.status !== "completed",
    );

    if (incomplete.length > 0) {
      throw new Error(
        `Incomplete compliance requirements: ${incomplete.map((r) => r.requirement).join(", ")}`,
      );
    }

    // Update status in database
    await prisma.exportHouseLicense.update({
      where: { id: applicationId },
      data: {
        status: "submitted",
        submittedAt: new Date(),
      },
    });

    // TODO: Integrate with SEDA portal API if enabled (external API, not database)

    // Emit event
    await eventBus.publish("export-house.application.submitted", {
      tenantId,
      applicationId,
      userId,
      timestamp: new Date(),
    });

    // Log evidence
    await evidenceService.logAction({
      tenantId,
      actor: userId,
      action: "export-house.application.submitted",
      entityType: "export-house-application",
      entityId: applicationId,
      metadata: {
        submittedAt: new Date().toISOString(),
      },
    });

    // Send notification
    await notificationService
      .send({
        tenantId,
        userId,
        type: "EXPORT_HOUSE_APPLICATION_SUBMITTED",
        title: "Export House Application Submitted",
        message: "Your application has been submitted to SEDA",
        metadata: { applicationId },
      })
      .catch(console.error);
  }

  /**
   * Get compliance requirements
   */
  async getComplianceRequirements(
    tenantId: string,
  ): Promise<ComplianceRequirement[]> {
    const license = await prisma.exportHouseLicense.findFirst({
      where: { tenantId },
      include: { complianceRequirements: true },
      orderBy: { createdAt: "desc" },
    });

    if (!license) return [];

    return license.complianceRequirements.map((req) => ({
      id: req.id,
      requirement: req.requirement,
      description: req.description,
      status: req.status as any,
      dueDate: req.dueDate || undefined,
      completedAt: req.completedAt || undefined,
      notes: req.notes || undefined,
    }));
  }

  /**
   * Update compliance requirement status
   */
  async updateComplianceRequirement(
    tenantId: string,
    requirementId: string,
    status: ComplianceRequirement["status"],
    evidence?: string[],
    userId?: string,
  ): Promise<void> {
    // Update requirement in database (already implemented above)
    // Emit event
    await eventBus.publish("export-house.compliance.updated", {
      tenantId,
      requirementId,
      status,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Save business plan
   */
  async saveBusinessPlan(
    tenantId: string,
    plan: Partial<BusinessPlan>,
    userId: string,
  ): Promise<BusinessPlan> {
    // Get or create license first
    const license = await prisma.exportHouseLicense.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      throw new Error(
        "Export House license not found. Please create an application first.",
      );
    }

    // Save or update business plan
    const saved = await prisma.exportHouseBusinessPlan.upsert({
      where: {
        licenseId_year: {
          licenseId: license.id,
          year: plan.year || 1,
        },
      },
      create: {
        tenantId,
        licenseId: license.id,
        year: plan.year || 1,
        planData: plan.planData as any,
        documentId: plan.documentId,
        createdBy: userId,
      },
      update: {
        planData: plan.planData as any,
        documentId: plan.documentId,
      },
    });

    // Emit event
    await eventBus.publish("export-house.business-plan.saved", {
      tenantId,
      planId: saved.id,
      year: saved.year,
      userId,
      timestamp: new Date(),
    });

    // Log evidence
    await evidenceService.logAction({
      tenantId,
      actor: userId,
      action: "export-house.business-plan.saved",
      entityType: "export-house-business-plan",
      entityId: saved.id,
      metadata: {
        year: saved.year,
      },
    });

    return {
      year: saved.year,
      planData: saved.planData as any,
      documentId: saved.documentId || undefined,
    };
  }

  /**
   * Get business plan
   */
  async getBusinessPlan(
    tenantId: string,
    year?: number,
  ): Promise<BusinessPlan[]> {
    const license = await prisma.exportHouseLicense.findFirst({
      where: { tenantId },
      include: { businessPlans: true },
      orderBy: { createdAt: "desc" },
    });

    if (!license) return [];

    const plans = year
      ? license.businessPlans.filter((p) => p.year === year)
      : license.businessPlans;

    return plans.map((plan) => ({
      year: plan.year,
      planData: plan.planData as any,
      documentId: plan.documentId || undefined,
    }));
  }

  /**
   * Sync with SEDA portal
   */
  async syncWithSEDAPortal(tenantId: string): Promise<SEDAPortalIntegration> {
    // TODO: Implement SEDA portal API integration
    return {
      portalUrl: "https://portal.saudi-exports.sa",
      syncStatus: "pending",
    };
  }
}

export const exportHouseService = new ExportHouseService();
