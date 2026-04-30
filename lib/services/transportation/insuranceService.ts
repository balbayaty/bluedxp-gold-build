/**
 * Insurance Management Service
 *
 * Manage cargo insurance policies, claims, and coverage
 * Integrates with shipment service and financial management
 */

import type { Shipment } from "@/types/tms";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  shipmentId: string;
  shipmentNumber: string;
  provider: string;
  providerId?: string;
  coverageAmount: number;
  premium: number;
  currency: string;
  effectiveDate: Date | string;
  expiryDate: Date | string;
  status: "ACTIVE" | "EXPIRED" | "CLAIMED" | "CANCELLED";
  coverageType: "ALL_RISK" | "FPA" | "WPA" | "CUSTOM";
  deductible?: number;
  claims?: InsuranceClaim[];
  metadata?: {
    terms?: string;
    exclusions?: string[];
    conditions?: string[];
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  tenantId: string;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  amount: number;
  currency: string;
  description: string;
  incidentDate: Date | string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID";
  documents?: string[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  tenantId: string;
}

export interface CreatePolicyRequest {
  shipmentId: string;
  shipmentNumber: string;
  provider: string;
  providerId?: string;
  coverageAmount: number;
  premium: number;
  currency?: string;
  effectiveDate: Date | string;
  expiryDate: Date | string;
  coverageType?: "ALL_RISK" | "FPA" | "WPA" | "CUSTOM";
  deductible?: number;
  metadata?: {
    terms?: string;
    exclusions?: string[];
    conditions?: string[];
  };
  createdBy: string;
  tenantId: string;
}

export interface CreateClaimRequest {
  policyId: string;
  amount: number;
  currency?: string;
  description: string;
  incidentDate: Date | string;
  documents?: string[];
  notes?: string;
  createdBy: string;
  tenantId: string;
}

export interface InsuranceStatistics {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  totalCoverage: number;
  totalPremiums: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  totalClaimAmount: number;
  averagePremium: number;
  claimsRatio: number; // percentage
}

export class InsuranceService {
  private policies: Map<string, InsurancePolicy> = new Map();
  private claims: Map<string, InsuranceClaim> = new Map();

  /**
   * Create insurance policy
   */
  async createPolicy(request: CreatePolicyRequest): Promise<InsurancePolicy> {
    const policy: InsurancePolicy = {
      id: `insurance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      policyNumber: `INS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      shipmentId: request.shipmentId,
      shipmentNumber: request.shipmentNumber,
      provider: request.provider,
      providerId: request.providerId,
      coverageAmount: request.coverageAmount,
      premium: request.premium,
      currency: request.currency || "SAR",
      effectiveDate: request.effectiveDate,
      expiryDate: request.expiryDate,
      status: "ACTIVE",
      coverageType: request.coverageType || "ALL_RISK",
      deductible: request.deductible,
      metadata: request.metadata,
      claims: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: request.createdBy,
      tenantId: request.tenantId,
    };

    this.policies.set(policy.id, policy);

    // Publish event
    await eventBus.publish(
      createEvent(
        "transportation.insurance.policy.created",
        policy.id,
        "InsurancePolicy",
        {
          policyId: policy.id,
          policyNumber: policy.policyNumber,
          shipmentId: policy.shipmentId,
          coverageAmount: policy.coverageAmount,
          premium: policy.premium,
        },
        1,
        { tenantId: request.tenantId, userId: request.createdBy },
      ),
    );

    return policy;
  }

  /**
   * Get policy by ID
   */
  async getPolicy(
    policyId: string,
    tenantId: string,
  ): Promise<InsurancePolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy || policy.tenantId !== tenantId) {
      return null;
    }
    return policy;
  }

  /**
   * Get policies by shipment
   */
  async getPoliciesByShipment(
    shipmentId: string,
    tenantId: string,
  ): Promise<InsurancePolicy[]> {
    return Array.from(this.policies.values()).filter(
      (p) => p.shipmentId === shipmentId && p.tenantId === tenantId,
    );
  }

  /**
   * Get all policies
   */
  async getPolicies(
    tenantId: string,
    filters?: {
      status?: string;
      provider?: string;
      from?: Date;
      to?: Date;
    },
  ): Promise<InsurancePolicy[]> {
    let policies = Array.from(this.policies.values()).filter(
      (p) => p.tenantId === tenantId,
    );

    if (filters?.status) {
      policies = policies.filter((p) => p.status === filters.status);
    }
    if (filters?.provider) {
      policies = policies.filter((p) => p.provider === filters.provider);
    }
    if (filters?.from) {
      policies = policies.filter(
        (p) => new Date(p.effectiveDate) >= filters.from!,
      );
    }
    if (filters?.to) {
      policies = policies.filter(
        (p) => new Date(p.effectiveDate) <= filters.to!,
      );
    }

    return policies;
  }

  /**
   * Update policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<InsurancePolicy>,
    tenantId: string,
  ): Promise<InsurancePolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy || policy.tenantId !== tenantId) {
      return null;
    }

    const updated = {
      ...policy,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(policyId, updated);

    await eventBus.publish(
      createEvent(
        "transportation.insurance.policy.updated",
        policyId,
        "InsurancePolicy",
        { policyId, updates },
        1,
        { tenantId, userId: "system" },
      ),
    );

    return updated;
  }

  /**
   * Create claim
   */
  async createClaim(request: CreateClaimRequest): Promise<InsuranceClaim> {
    const policy = this.policies.get(request.policyId);
    if (!policy || policy.tenantId !== request.tenantId) {
      throw new Error("Policy not found");
    }

    if (policy.status !== "ACTIVE") {
      throw new Error(
        `Cannot create claim for policy with status ${policy.status}`,
      );
    }

    const claim: InsuranceClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      claimNumber: `CLM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      policyId: request.policyId,
      policyNumber: policy.policyNumber,
      amount: request.amount,
      currency: request.currency || policy.currency,
      description: request.description,
      incidentDate: request.incidentDate,
      status: "PENDING",
      documents: request.documents,
      notes: request.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: request.createdBy,
      tenantId: request.tenantId,
    };

    this.claims.set(claim.id, claim);

    // Add claim to policy
    if (!policy.claims) {
      policy.claims = [];
    }
    policy.claims.push(claim);
    policy.updatedAt = new Date().toISOString();
    this.policies.set(request.policyId, policy);

    // Publish event
    await eventBus.publish(
      createEvent(
        "transportation.insurance.claim.created",
        claim.id,
        "InsuranceClaim",
        {
          claimId: claim.id,
          claimNumber: claim.claimNumber,
          policyId: request.policyId,
          amount: claim.amount,
        },
        1,
        { tenantId: request.tenantId, userId: request.createdBy },
      ),
    );

    return claim;
  }

  /**
   * Get claim by ID
   */
  async getClaim(
    claimId: string,
    tenantId: string,
  ): Promise<InsuranceClaim | null> {
    const claim = this.claims.get(claimId);
    if (!claim || claim.tenantId !== tenantId) {
      return null;
    }
    return claim;
  }

  /**
   * Get claims by policy
   */
  async getClaimsByPolicy(
    policyId: string,
    tenantId: string,
  ): Promise<InsuranceClaim[]> {
    return Array.from(this.claims.values()).filter(
      (c) => c.policyId === policyId && c.tenantId === tenantId,
    );
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(
    claimId: string,
    status: InsuranceClaim["status"],
    reviewedBy: string,
    notes?: string,
    tenantId?: string,
  ): Promise<InsuranceClaim | null> {
    const claim = this.claims.get(claimId);
    if (!claim || (tenantId && claim.tenantId !== tenantId)) {
      return null;
    }

    const updated = {
      ...claim,
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      notes: notes || claim.notes,
      updatedAt: new Date().toISOString(),
    };

    this.claims.set(claimId, updated);

    // Update policy if claim is approved/paid
    if (status === "APPROVED" || status === "PAID") {
      const policy = this.policies.get(claim.policyId);
      if (policy) {
        policy.status = "CLAIMED";
        policy.updatedAt = new Date().toISOString();
        this.policies.set(claim.policyId, policy);
      }
    }

    await eventBus.publish(
      createEvent(
        "transportation.insurance.claim.updated",
        claimId,
        "InsuranceClaim",
        { claimId, status, reviewedBy },
        1,
        { tenantId: claim.tenantId, userId: reviewedBy },
      ),
    );

    return updated;
  }

  /**
   * Get statistics
   */
  async getStatistics(
    tenantId: string,
    filters?: {
      from?: Date;
      to?: Date;
    },
  ): Promise<InsuranceStatistics> {
    let policies = Array.from(this.policies.values()).filter(
      (p) => p.tenantId === tenantId,
    );
    let claims = Array.from(this.claims.values()).filter(
      (c) => c.tenantId === tenantId,
    );

    if (filters?.from) {
      policies = policies.filter((p) => new Date(p.createdAt) >= filters.from!);
      claims = claims.filter((c) => new Date(c.createdAt) >= filters.from!);
    }
    if (filters?.to) {
      policies = policies.filter((p) => new Date(p.createdAt) <= filters.to!);
      claims = claims.filter((c) => new Date(c.createdAt) <= filters.to!);
    }

    const activePolicies = policies.filter((p) => p.status === "ACTIVE").length;
    const expiredPolicies = policies.filter(
      (p) => p.status === "EXPIRED",
    ).length;
    const totalCoverage = policies.reduce(
      (sum, p) => sum + p.coverageAmount,
      0,
    );
    const totalPremiums = policies.reduce((sum, p) => sum + p.premium, 0);
    const totalClaims = claims.length;
    const pendingClaims = claims.filter((c) => c.status === "PENDING").length;
    const approvedClaims = claims.filter(
      (c) => c.status === "APPROVED" || c.status === "PAID",
    ).length;
    const totalClaimAmount = claims.reduce((sum, c) => sum + c.amount, 0);

    return {
      totalPolicies: policies.length,
      activePolicies,
      expiredPolicies,
      totalCoverage,
      totalPremiums,
      totalClaims,
      pendingClaims,
      approvedClaims,
      totalClaimAmount,
      averagePremium: policies.length > 0 ? totalPremiums / policies.length : 0,
      claimsRatio:
        totalPremiums > 0 ? (totalClaimAmount / totalPremiums) * 100 : 0,
    };
  }

  /**
   * Check and update expired policies
   */
  async checkExpiredPolicies(tenantId: string): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    for (const policy of this.policies.values()) {
      if (policy.tenantId === tenantId && policy.status === "ACTIVE") {
        const expiryDate = new Date(policy.expiryDate);
        if (expiryDate < now) {
          policy.status = "EXPIRED";
          policy.updatedAt = new Date().toISOString();
          this.policies.set(policy.id, policy);
          expiredCount++;

          await eventBus.publish(
            createEvent(
              "transportation.insurance.policy.expired",
              policy.id,
              "InsurancePolicy",
              { policyId: policy.id, policyNumber: policy.policyNumber },
              1,
              { tenantId, userId: "system" },
            ),
          );
        }
      }
    }

    return expiredCount;
  }
}

export const insuranceService = new InsuranceService();
