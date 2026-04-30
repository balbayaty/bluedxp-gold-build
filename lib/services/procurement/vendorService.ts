/**
 * Vendor Service
 * Comprehensive vendor management - master data, onboarding, performance, relationships
 * Multi-industry support with construction specialization (subcontractors)
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  Vendor,
  VendorCreateInput,
  VendorFilter,
  VendorOnboarding,
  VendorPerformance,
  Contact,
  Address,
  Certification,
  License,
  Insurance,
  SafetyRecord,
} from "@/types/vendor";
import type { VendorStatus, VendorClassification } from "@/types/procurement";

// In-memory storage (replace with database in production)
const vendors = new Map<string, Vendor>();
const vendorOnboardings = new Map<string, VendorOnboarding>();
const vendorPerformances = new Map<string, VendorPerformance[]>();

// Vendor number generator
let vendorCounter = 1;

function generateVendorNumber(): string {
  const year = new Date().getFullYear();
  const number = String(vendorCounter++).padStart(6, "0");
  return `VEND-${year}-${number}`;
}

export class VendorService {
  /**
   * Create a new vendor
   */
  async createVendor(
    input: VendorCreateInput,
    userId: string,
  ): Promise<Vendor> {
    const vendorNumber = generateVendorNumber();
    const vendorId = `vendor-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const vendor: Vendor = {
      id: vendorId,
      tenantId: input.tenantId,
      vendorNumber,
      vendorName: input.vendorName,
      legalName: input.legalName,
      status: "PENDING",
      classification: input.classification || "APPROVED",
      email: input.email,
      phone: input.phone,
      website: input.website,
      country: input.country,
      taxId: input.taxId,
      vatNumber: input.vatNumber,
      categories: input.categories,
      currency: input.currency || "SAR",
      paymentTerms: input.paymentTerms,
      contacts: [],
      addresses: [],
      certifications: [],
      isPreferred: false,
      isStrategicPartner: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    vendors.set(vendorId, vendor);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        vendorId,
        vendorNumber,
        tenantId: input.tenantId,
        vendorName: input.vendorName,
        status: vendor.status,
      },
    } as DomainEvent);

    return vendor;
  }

  /**
   * Start vendor onboarding process
   */
  async startOnboarding(
    tenantId: string,
    companyName: string,
    email: string,
    phone: string,
    country: string,
  ): Promise<VendorOnboarding> {
    const onboardingId = `onboarding-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const onboarding: VendorOnboarding = {
      id: onboardingId,
      status: "REGISTRATION",
      companyName,
      email,
      phone,
      country,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vendorOnboardings.set(onboardingId, onboarding);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.onboarding.started",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        onboardingId,
        tenantId,
        companyName,
        email,
      },
    } as DomainEvent);

    return onboarding;
  }

  /**
   * Complete vendor qualification
   */
  async completeQualification(
    onboardingId: string,
    tenantId: string,
    financialAssessment?: {
      creditRating?: string;
      financialHealth?: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
      annualRevenue?: number;
      yearsInBusiness?: number;
    },
    capabilityAssessment?: {
      products?: string[];
      services?: string[];
      capacity?: string;
      geographicCoverage?: string[];
      certifications?: string[];
      experience?: string;
    },
    complianceCheck?: {
      regulatoryCompliance: boolean;
      qualityCompliance: boolean;
      safetyCompliance: boolean;
      environmentalCompliance: boolean;
      certifications?: string[];
      licenses?: string[];
    },
  ): Promise<VendorOnboarding> {
    const onboarding = vendorOnboardings.get(onboardingId);
    if (!onboarding) {
      throw new Error("Onboarding not found");
    }

    onboarding.status = "QUALIFICATION";
    onboarding.financialAssessment = financialAssessment;
    onboarding.capabilityAssessment = capabilityAssessment;
    onboarding.complianceCheck = complianceCheck;
    onboarding.updatedAt = new Date().toISOString();

    vendorOnboardings.set(onboardingId, onboarding);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.onboarding.qualified",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        onboardingId,
        tenantId,
        financialAssessment,
        capabilityAssessment,
        complianceCheck,
      },
    } as DomainEvent);

    return onboarding;
  }

  /**
   * Approve vendor onboarding
   */
  async approveOnboarding(
    onboardingId: string,
    tenantId: string,
    approverId: string,
    vendorData: VendorCreateInput,
  ): Promise<{ onboarding: VendorOnboarding; vendor: Vendor }> {
    const onboarding = vendorOnboardings.get(onboardingId);
    if (!onboarding) {
      throw new Error("Onboarding not found");
    }

    if (onboarding.status !== "QUALIFICATION") {
      throw new Error("Onboarding must be in QUALIFICATION status");
    }

    // Create vendor
    const vendor = await this.createVendor(
      {
        ...vendorData,
        tenantId,
      },
      approverId,
    );

    // Update onboarding
    onboarding.status = "APPROVAL";
    onboarding.vendorId = vendor.id;
    onboarding.vendorNumber = vendor.vendorNumber;
    onboarding.approvedBy = approverId;
    onboarding.approvedAt = new Date().toISOString();
    onboarding.updatedAt = new Date().toISOString();

    // Update vendor status
    vendor.status = "ACTIVE";
    vendors.set(vendor.id, vendor);
    vendorOnboardings.set(onboardingId, onboarding);

    // Complete setup
    onboarding.status = "SETUP";
    onboarding.setupCompletedAt = new Date().toISOString();
    onboarding.status = "COMPLETED";

    // Publish events
    await eventBus.publish({
      type: "procurement.vendor.onboarding.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        onboardingId,
        vendorId: vendor.id,
        vendorNumber: vendor.vendorNumber,
        tenantId,
        approverId,
      },
    } as DomainEvent);

    await eventBus.publish({
      type: "procurement.vendor.activated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        vendorId: vendor.id,
        vendorNumber: vendor.vendorNumber,
        tenantId,
      },
    } as DomainEvent);

    return { onboarding, vendor };
  }

  /**
   * Reject vendor onboarding
   */
  async rejectOnboarding(
    onboardingId: string,
    tenantId: string,
    rejectorId: string,
    rejectionReason: string,
  ): Promise<VendorOnboarding> {
    const onboarding = vendorOnboardings.get(onboardingId);
    if (!onboarding) {
      throw new Error("Onboarding not found");
    }

    onboarding.status = "REJECTED";
    onboarding.rejectedBy = rejectorId;
    onboarding.rejectedAt = new Date().toISOString();
    onboarding.rejectionReason = rejectionReason;
    onboarding.updatedAt = new Date().toISOString();

    vendorOnboardings.set(onboardingId, onboarding);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.onboarding.rejected",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        onboardingId,
        tenantId,
        rejectorId,
        rejectionReason,
      },
    } as DomainEvent);

    return onboarding;
  }

  /**
   * Add vendor contact
   */
  async addContact(
    vendorId: string,
    tenantId: string,
    contact: Omit<Contact, "id" | "vendorId">,
  ): Promise<Contact> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    const contactId = `contact-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newContact: Contact = {
      id: contactId,
      vendorId,
      ...contact,
    };

    vendor.contacts.push(newContact);
    if (newContact.isPrimary) {
      vendor.primaryContact = newContact;
    }

    vendors.set(vendorId, vendor);

    return newContact;
  }

  /**
   * Add vendor address
   */
  async addAddress(
    vendorId: string,
    tenantId: string,
    address: Omit<Address, "id" | "vendorId">,
  ): Promise<Address> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    const addressId = `address-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newAddress: Address = {
      id: addressId,
      vendorId,
      ...address,
    };

    vendor.addresses.push(newAddress);
    if (newAddress.type === "BILLING") {
      vendor.billingAddress = newAddress;
    }
    if (newAddress.type === "SHIPPING") {
      vendor.shippingAddress = newAddress;
    }

    vendors.set(vendorId, vendor);

    return newAddress;
  }

  /**
   * Add vendor certification
   */
  async addCertification(
    vendorId: string,
    tenantId: string,
    certification: Omit<Certification, "id" | "vendorId">,
  ): Promise<Certification> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    const certId = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newCert: Certification = {
      id: certId,
      vendorId,
      ...certification,
    };

    vendor.certifications = vendor.certifications || [];
    vendor.certifications.push(newCert);

    vendors.set(vendorId, vendor);

    return newCert;
  }

  /**
   * Update vendor performance
   */
  async updatePerformance(
    vendorId: string,
    tenantId: string,
    period: string,
    metrics: {
      totalOrders: number;
      totalSpend: number;
      onTimeDeliveryRate: number;
      qualityAcceptanceRate: number;
      averageLeadTime: number;
      defectRate?: number;
      rejectionRate?: number;
    },
    reviewedBy: string,
  ): Promise<VendorPerformance> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    // Calculate scores (0-100 scale)
    const deliveryScore = metrics.onTimeDeliveryRate * 100;
    const qualityScore = metrics.qualityAcceptanceRate * 100;
    const costScore = 80; // Mock - would calculate based on cost competitiveness
    const serviceScore = 85; // Mock - would calculate based on responsiveness

    const overallScore =
      (deliveryScore * 0.3 +
        qualityScore * 0.3 +
        costScore * 0.2 +
        serviceScore * 0.2) /
      100;

    // Calculate rating (1-5)
    const rating = Math.min(5, Math.max(1, Math.ceil(overallScore / 20))) as
      | 1
      | 2
      | 3
      | 4
      | 5;

    const performanceId = `perf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const performance: VendorPerformance = {
      id: performanceId,
      vendorId,
      period,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      ...metrics,
      overallScore,
      deliveryScore,
      qualityScore,
      costScore,
      serviceScore,
      rating,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    };

    // Store performance
    if (!vendorPerformances.has(vendorId)) {
      vendorPerformances.set(vendorId, []);
    }
    vendorPerformances.get(vendorId)!.push(performance);

    // Update vendor performance metrics
    vendor.performanceScore = overallScore;
    vendor.onTimeDeliveryRate = metrics.onTimeDeliveryRate;
    vendor.qualityAcceptanceRate = metrics.qualityAcceptanceRate;
    vendor.averageLeadTime = metrics.averageLeadTime;

    vendors.set(vendorId, vendor);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.performance.updated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        vendorId,
        vendorNumber: vendor.vendorNumber,
        tenantId,
        period,
        overallScore,
        rating,
      },
    } as DomainEvent);

    return performance;
  }

  /**
   * Get vendor by ID
   */
  async getVendor(vendorId: string, tenantId: string): Promise<Vendor | null> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      return null;
    }
    return vendor;
  }

  /**
   * List vendors with filters
   */
  async listVendors(filter: VendorFilter): Promise<Vendor[]> {
    let results = Array.from(vendors.values()).filter(
      (v) => v.tenantId === filter.tenantId,
    );

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      results = results.filter((v) => filter.status!.includes(v.status));
    }

    if (filter.classification && filter.classification.length > 0) {
      results = results.filter((v) =>
        filter.classification!.includes(v.classification),
      );
    }

    if (filter.category && filter.category.length > 0) {
      results = results.filter((v) =>
        v.categories.some((cat) => filter.category!.includes(cat)),
      );
    }

    if (filter.country) {
      results = results.filter((v) => v.country === filter.country);
    }

    if (filter.isPreferred !== undefined) {
      results = results.filter((v) => v.isPreferred === filter.isPreferred);
    }

    if (filter.isStrategicPartner !== undefined) {
      results = results.filter(
        (v) => v.isStrategicPartner === filter.isStrategicPartner,
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      results = results.filter(
        (v) =>
          v.vendorNumber.toLowerCase().includes(searchLower) ||
          v.vendorName.toLowerCase().includes(searchLower) ||
          v.legalName?.toLowerCase().includes(searchLower),
      );
    }

    // Sort by vendor name
    results.sort((a, b) => a.vendorName.localeCompare(b.vendorName));

    return results;
  }

  /**
   * Update vendor
   */
  async updateVendor(
    vendorId: string,
    tenantId: string,
    updates: Partial<Vendor>,
    userId: string,
  ): Promise<Vendor> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    // Update fields
    Object.assign(vendor, updates);
    vendor.updatedAt = new Date().toISOString();
    vendor.updatedBy = userId;

    vendors.set(vendorId, vendor);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.updated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        vendorId,
        vendorNumber: vendor.vendorNumber,
        tenantId,
      },
    } as DomainEvent);

    return vendor;
  }

  /**
   * Suspend vendor
   */
  async suspendVendor(
    vendorId: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ): Promise<Vendor> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    vendor.status = "SUSPENDED";
    vendor.updatedAt = new Date().toISOString();
    vendor.updatedBy = userId;

    vendors.set(vendorId, vendor);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.suspended",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        vendorId,
        vendorNumber: vendor.vendorNumber,
        tenantId,
        reason,
      },
    } as DomainEvent);

    return vendor;
  }

  /**
   * Blacklist vendor
   */
  async blacklistVendor(
    vendorId: string,
    tenantId: string,
    userId: string,
    reason: string,
  ): Promise<Vendor> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    vendor.status = "BLACKLISTED";
    vendor.classification = "BLACKLISTED";
    vendor.blacklistReason = reason;
    vendor.blacklistedAt = new Date().toISOString();
    vendor.updatedAt = new Date().toISOString();
    vendor.updatedBy = userId;

    vendors.set(vendorId, vendor);

    // Publish event
    await eventBus.publish({
      type: "procurement.vendor.blacklisted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        vendorId,
        vendorNumber: vendor.vendorNumber,
        tenantId,
        reason,
      },
    } as DomainEvent);

    return vendor;
  }

  /**
   * Get vendor performance history
   */
  async getVendorPerformance(
    vendorId: string,
    tenantId: string,
  ): Promise<VendorPerformance[]> {
    const vendor = vendors.get(vendorId);
    if (!vendor || vendor.tenantId !== tenantId) {
      throw new Error("Vendor not found");
    }

    return vendorPerformances.get(vendorId) || [];
  }
}

// Singleton instance
export const vendorService = new VendorService();
