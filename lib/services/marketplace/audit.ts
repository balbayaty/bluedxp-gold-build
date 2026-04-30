/**
 * Marketplace Audit Service
 * Comprehensive audit logging for all marketplace operations
 * Tracks every action for compliance and security
 */

import { marketplaceDatabaseAdapter } from "./database/marketplaceDatabaseAdapter";

export interface AuditLogEntry {
  entityType:
    | "LISTING"
    | "PROVIDER"
    | "BOOKING"
    | "REVIEW"
    | "CONTRACT"
    | "PAYMENT";
  entityId: string;
  action: string;
  userId: string;
  userRole?: string;
  actionData?: any;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

export class MarketplaceAuditService {
  /**
   * Log an audit entry
   */
  async log(tenantId: string, entry: AuditLogEntry): Promise<string> {
    return await marketplaceDatabaseAdapter.logAudit(tenantId, {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      userId: entry.userId,
      userRole: entry.userRole,
      actionData: entry.actionData,
      changes: entry.changes,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  }

  /**
   * Log listing creation
   */
  async logListingCreated(
    tenantId: string,
    listingId: string,
    userId: string,
    userRole: string | undefined,
    listingData: any,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "LISTING",
      entityId: listingId,
      action: "marketplace.listing.created",
      userId,
      userRole,
      actionData: {
        providerId: listingData.providerId,
        category: listingData.serviceCategory,
        title: listingData.title,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Log listing update
   */
  async logListingUpdated(
    tenantId: string,
    listingId: string,
    userId: string,
    userRole: string | undefined,
    changes: { before: any; after: any },
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "LISTING",
      entityId: listingId,
      action: "marketplace.listing.updated",
      userId,
      userRole,
      changes,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Log listing deletion
   */
  async logListingDeleted(
    tenantId: string,
    listingId: string,
    userId: string,
    userRole: string | undefined,
    listingData: any,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "LISTING",
      entityId: listingId,
      action: "marketplace.listing.deleted",
      userId,
      userRole,
      actionData: {
        providerId: listingData.providerId,
        category: listingData.serviceCategory,
        title: listingData.title,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Log booking creation
   */
  async logBookingCreated(
    tenantId: string,
    bookingId: string,
    userId: string,
    userRole: string | undefined,
    bookingData: any,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "BOOKING",
      entityId: bookingId,
      action: "marketplace.booking.created",
      userId,
      userRole,
      actionData: {
        bookingNumber: bookingData.bookingNumber,
        customerId: bookingData.customerId,
        providerId: bookingData.providerId,
        listingId: bookingData.serviceId,
        category: bookingData.serviceCategory,
        status: bookingData.status,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Log booking status update
   */
  async logBookingStatusUpdated(
    tenantId: string,
    bookingId: string,
    userId: string,
    userRole: string | undefined,
    oldStatus: string,
    newStatus: string,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "BOOKING",
      entityId: bookingId,
      action: "marketplace.booking.status.updated",
      userId,
      userRole,
      changes: {
        before: { status: oldStatus },
        after: { status: newStatus },
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Log provider creation
   */
  async logProviderCreated(
    tenantId: string,
    providerId: string,
    userId: string,
    userRole: string | undefined,
    providerData: any,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "PROVIDER",
      entityId: providerId,
      action: "marketplace.provider.created",
      userId,
      userRole,
      actionData: {
        name: providerData.name,
        email: providerData.email,
        verificationStatus: providerData.verificationStatus,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Log review creation
   */
  async logReviewCreated(
    tenantId: string,
    reviewId: string,
    userId: string,
    userRole: string | undefined,
    reviewData: any,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    return await this.log(tenantId, {
      entityType: "REVIEW",
      entityId: reviewId,
      action: "marketplace.review.created",
      userId,
      userRole,
      actionData: {
        bookingId: reviewData.bookingId,
        listingId: reviewData.listingId,
        providerId: reviewData.providerId,
        rating: reviewData.rating,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }
}

export const marketplaceAuditService = new MarketplaceAuditService();
