import { eventBus } from "@/lib/services/event-store";
import type { MarketplaceProvider } from "@/types/marketplace";

export type VerificationStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "suspended";

export interface VerificationDocument {
  id: string;
  type:
    | "license"
    | "certification"
    | "identity"
    | "business_registration"
    | "insurance"
    | "other";
  name: string;
  fileUrl: string;
  expiryDate?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface VerificationCheck {
  id: string;
  providerId: string;
  type: "kyc" | "background" | "license" | "credit" | "reference";
  status: VerificationStatus;
  result?: "pass" | "fail" | "warning";
  details?: string;
  checkedAt?: string;
  checkedBy?: string;
}

export interface ProviderVerification {
  id: string;
  providerId: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  checks: VerificationCheck[];
  rating: number;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class ProviderVerificationService {
  private verifications: Map<string, ProviderVerification> = new Map();

  /**
   * Initiate verification for a provider
   */
  async initiateVerification(
    providerId: string,
  ): Promise<ProviderVerification> {
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const verification: ProviderVerification = {
      id: verificationId,
      providerId,
      status: "pending",
      documents: [],
      checks: [],
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.verifications.set(verificationId, verification);

    await eventBus.publish("marketplace.verification.initiated", {
      verificationId,
      providerId,
    });

    return verification;
  }

  /**
   * Get verification for a provider
   */
  async getVerification(
    providerId: string,
  ): Promise<ProviderVerification | null> {
    const verifications = Array.from(this.verifications.values());
    return verifications.find((v) => v.providerId === providerId) || null;
  }

  /**
   * Add document to verification
   */
  async addDocument(
    providerId: string,
    document: Omit<
      VerificationDocument,
      "id" | "verified" | "verifiedAt" | "verifiedBy"
    >,
  ): Promise<VerificationDocument> {
    const verification = await this.getVerification(providerId);
    if (!verification) {
      throw new Error(
        "Verification not found. Please initiate verification first.",
      );
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const fullDocument: VerificationDocument = {
      ...document,
      id: docId,
      verified: false,
    };

    verification.documents.push(fullDocument);
    verification.updatedAt = new Date().toISOString();
    this.verifications.set(verification.id, verification);

    await eventBus.publish("marketplace.verification.document.added", {
      verificationId: verification.id,
      providerId,
      documentId: docId,
    });

    return fullDocument;
  }

  /**
   * Verify a document
   */
  async verifyDocument(
    providerId: string,
    documentId: string,
    verifiedBy: string,
    verified: boolean,
  ): Promise<VerificationDocument | null> {
    const verification = await this.getVerification(providerId);
    if (!verification) {
      return null;
    }

    const document = verification.documents.find((d) => d.id === documentId);
    if (!document) {
      return null;
    }

    document.verified = verified;
    document.verifiedAt = verified ? new Date().toISOString() : undefined;
    document.verifiedBy = verified ? verifiedBy : undefined;

    verification.updatedAt = new Date().toISOString();
    this.verifications.set(verification.id, verification);

    // Auto-update verification status if all documents are verified
    if (verification.documents.every((d) => d.verified)) {
      await this.updateVerificationStatus(providerId, "in_review");
    }

    return document;
  }

  /**
   * Add verification check
   */
  async addCheck(
    providerId: string,
    check: Omit<
      VerificationCheck,
      "id" | "providerId" | "checkedAt" | "checkedBy"
    >,
  ): Promise<VerificationCheck> {
    const verification = await this.getVerification(providerId);
    if (!verification) {
      throw new Error(
        "Verification not found. Please initiate verification first.",
      );
    }

    const checkId = `check_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const fullCheck: VerificationCheck = {
      ...check,
      id: checkId,
      providerId,
      checkedAt: new Date().toISOString(),
    };

    verification.checks.push(fullCheck);
    verification.updatedAt = new Date().toISOString();
    this.verifications.set(verification.id, verification);

    await eventBus.publish("marketplace.verification.check.added", {
      verificationId: verification.id,
      providerId,
      checkId,
      type: check.type,
      result: check.result,
    });

    return fullCheck;
  }

  /**
   * Update verification status
   */
  async updateVerificationStatus(
    providerId: string,
    status: VerificationStatus,
    verifiedBy?: string,
    rejectionReason?: string,
  ): Promise<ProviderVerification | null> {
    const verification = await this.getVerification(providerId);
    if (!verification) {
      return null;
    }

    verification.status = status;
    verification.updatedAt = new Date().toISOString();

    if (status === "approved") {
      verification.verifiedAt = new Date().toISOString();
      verification.verifiedBy = verifiedBy;
      verification.rating = this.calculateVerificationRating(verification);
    }

    if (status === "rejected") {
      verification.rejectionReason = rejectionReason;
    }

    this.verifications.set(verification.id, verification);

    await eventBus.publish("marketplace.verification.status.updated", {
      verificationId: verification.id,
      providerId,
      status,
    });

    return verification;
  }

  /**
   * Calculate verification rating based on documents and checks
   */
  private calculateVerificationRating(
    verification: ProviderVerification,
  ): number {
    let rating = 0;
    let maxRating = 0;

    // Document verification (50% weight)
    const verifiedDocs = verification.documents.filter(
      (d) => d.verified,
    ).length;
    const totalDocs = verification.documents.length;
    if (totalDocs > 0) {
      rating += (verifiedDocs / totalDocs) * 50;
    }
    maxRating += 50;

    // Check results (50% weight)
    const passedChecks = verification.checks.filter(
      (c) => c.result === "pass",
    ).length;
    const totalChecks = verification.checks.length;
    if (totalChecks > 0) {
      rating += (passedChecks / totalChecks) * 50;
    }
    maxRating += 50;

    return maxRating > 0 ? Math.round((rating / maxRating) * 100) : 0;
  }

  /**
   * Get verification badge for a provider
   */
  async getVerificationBadge(providerId: string): Promise<{
    verified: boolean;
    status: VerificationStatus;
    badge: string;
    color: string;
  }> {
    const verification = await this.getVerification(providerId);

    if (!verification || verification.status !== "approved") {
      return {
        verified: false,
        status: verification?.status || "pending",
        badge: "Unverified",
        color: "gray",
      };
    }

    const rating = verification.rating;

    if (rating >= 90) {
      return {
        verified: true,
        status: "approved",
        badge: "Premium Verified",
        color: "gold",
      };
    } else if (rating >= 75) {
      return {
        verified: true,
        status: "approved",
        badge: "Verified",
        color: "green",
      };
    } else {
      return {
        verified: true,
        status: "approved",
        badge: "Basic Verified",
        color: "blue",
      };
    }
  }

  /**
   * Get all pending verifications
   */
  async getPendingVerifications(): Promise<ProviderVerification[]> {
    return Array.from(this.verifications.values()).filter(
      (v) => v.status === "pending" || v.status === "in_review",
    );
  }
}

export const providerVerificationService = new ProviderVerificationService();
