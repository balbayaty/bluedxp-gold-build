/**
 * Marketplace Notification Service
 * Handles all notifications for marketplace activities
 * Integrates with the platform notification service
 */

import { notificationService } from "@/lib/services/notifications/notificationService";
import type {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from "@/lib/services/notifications/notificationService";
import { marketplaceService } from "./marketplaceService";
import type {
  MarketplaceBooking,
  MarketplaceServiceListing,
} from "@/types/marketplace";

/**
 * Send notification when booking is created
 */
export async function notifyBookingCreated(
  booking: MarketplaceBooking,
  listing: MarketplaceServiceListing,
): Promise<void> {
  // Notify customer
  await notificationService.send({
    type: "success",
    priority: "medium",
    channel: ["in-app", "email"],
    title: "Booking Created Successfully",
    message: `Your booking for "${listing.title}" has been created and is pending confirmation.`,
    userId: booking.customerId,
    data: {
      bookingId: booking.id,
      listingId: listing.id,
      actionUrl: `/marketplace/bookings/${booking.id}`,
    },
  });

  // Notify provider
  const provider = await marketplaceService.getProvider(listing.providerId);
  if (provider?.userId) {
    await notificationService.send({
      type: "alert",
      priority: "high",
      channel: ["in-app", "email", "sms"],
      title: "New Booking Request",
      message: `You have a new booking request for "${listing.title}" from ${booking.customerName || "a customer"}.`,
      userId: provider.userId,
      data: {
        bookingId: booking.id,
        listingId: listing.id,
        actionUrl: `/marketplace/providers/bookings?bookingId=${booking.id}`,
      },
    });
  }
}

/**
 * Send notification when booking status changes
 */
export async function notifyBookingStatusChange(
  booking: MarketplaceBooking,
  oldStatus: string,
  newStatus: string,
): Promise<void> {
  const listing = await marketplaceService.getListing(booking.listingId);
  if (!listing) return;

  const statusMessages: Record<
    string,
    { title: string; message: string; priority: NotificationPriority }
  > = {
    CONFIRMED: {
      title: "Booking Confirmed!",
      message: `Your booking for "${listing.title}" has been confirmed.`,
      priority: "high",
    },
    REJECTED: {
      title: "Booking Rejected",
      message: `Your booking for "${listing.title}" has been rejected by the provider.`,
      priority: "high",
    },
    IN_PROGRESS: {
      title: "Service Started",
      message: `Your booking for "${listing.title}" has started.`,
      priority: "medium",
    },
    COMPLETED: {
      title: "Service Completed",
      message: `Your booking for "${listing.title}" has been completed. Please leave a review!`,
      priority: "high",
    },
    CANCELLED: {
      title: "Booking Cancelled",
      message: `Your booking for "${listing.title}" has been cancelled.`,
      priority: "medium",
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (statusInfo) {
    // Notify customer
    await notificationService.send({
      type:
        newStatus === "REJECTED" || newStatus === "CANCELLED"
          ? "warning"
          : "success",
      priority: statusInfo.priority,
      channel: ["in-app", "email"],
      title: statusInfo.title,
      message: statusInfo.message,
      userId: booking.customerId,
      data: {
        bookingId: booking.id,
        listingId: listing.id,
        oldStatus,
        newStatus,
        actionUrl: `/marketplace/bookings/${booking.id}`,
      },
    });
  }
}

/**
 * Send notification when review is submitted
 */
export async function notifyReviewSubmitted(
  reviewId: string,
  listingId: string,
  providerId: string,
): Promise<void> {
  const listing = await marketplaceService.getListing(listingId);
  const provider = await marketplaceService.getProvider(providerId);

  if (provider?.userId) {
    await notificationService.send({
      type: "info",
      priority: "medium",
      channel: ["in-app", "email"],
      title: "New Review Received",
      message: `You received a new review for "${listing?.title || "your service"}".`,
      userId: provider.userId,
      data: {
        reviewId,
        listingId,
        actionUrl: `/marketplace/listings/${listingId}#reviews`,
      },
    });
  }
}

/**
 * Send notification when listing is approved/rejected
 */
export async function notifyListingStatusChange(
  listingId: string,
  status: "APPROVED" | "REJECTED",
  providerId: string,
  reason?: string,
): Promise<void> {
  const provider = await marketplaceService.getProvider(providerId);
  const listing = await marketplaceService.getListing(listingId);

  if (provider?.userId) {
    await notificationService.send({
      type: status === "APPROVED" ? "success" : "error",
      priority: "high",
      channel: ["in-app", "email"],
      title: status === "APPROVED" ? "Listing Approved" : "Listing Rejected",
      message:
        status === "APPROVED"
          ? `Your listing "${listing?.title || "service"}" has been approved and is now live!`
          : `Your listing "${listing?.title || "service"}" has been rejected. ${reason || ""}`,
      userId: provider.userId,
      data: {
        listingId,
        status,
        actionUrl: `/marketplace/listings/${listingId}`,
      },
    });
  }
}

/**
 * Send notification for RFQ suggestions
 */
export async function notifyRFQSuggestions(
  rfqId: string,
  suggestions: MarketplaceServiceListing[],
): Promise<void> {
  await notificationService.send({
    type: "info",
    priority: "medium",
    channel: ["in-app"],
    title: "Marketplace Suggestions Available",
    message: `We found ${suggestions.length} marketplace services that match your RFQ.`,
    data: {
      rfqId,
      suggestions: suggestions.map((s) => ({
        listingId: s.id,
        title: s.title,
        providerName: s.providerName,
      })),
      actionUrl: `/proposals/rfq/${rfqId}?tab=suggestions`,
    },
  });
}

/**
 * Send notification for low availability
 */
export async function notifyLowAvailability(
  listingId: string,
  providerId: string,
  availableCapacity: number,
): Promise<void> {
  const provider = await marketplaceService.getProvider(providerId);
  const listing = await marketplaceService.getListing(listingId);

  if (provider?.userId && availableCapacity < 10) {
    await notificationService.send({
      type: "warning",
      priority: "medium",
      channel: ["in-app", "email"],
      title: "Low Availability Alert",
      message: `Your listing "${listing?.title || "service"}" is running low on availability (${availableCapacity} remaining).`,
      userId: provider.userId,
      data: {
        listingId,
        availableCapacity,
        actionUrl: `/marketplace/listings/${listingId}`,
      },
    });
  }
}

/**
 * Send notification for new message/chat
 */
export async function notifyNewMessage(
  bookingId: string,
  fromUserId: string,
  toUserId: string,
  message: string,
): Promise<void> {
  await notificationService.send({
    type: "info",
    priority: "low",
    channel: ["in-app", "push"],
    title: "New Message",
    message: message.substring(0, 100),
    userId: toUserId,
    data: {
      bookingId,
      fromUserId,
      actionUrl: `/marketplace/bookings/${bookingId}?tab=messages`,
    },
  });
}

/**
 * Send notification for price change
 */
export async function notifyPriceChange(
  listingId: string,
  oldPrice: number,
  newPrice: number,
  customerIds: string[],
): Promise<void> {
  const listing = await marketplaceService.getListing(listingId);
  const isDecrease = newPrice < oldPrice;

  for (const customerId of customerIds) {
    await notificationService.send({
      type: isDecrease ? "success" : "warning",
      priority: "low",
      channel: ["in-app"],
      title: isDecrease ? "Price Decreased!" : "Price Update",
      message: `The price for "${listing?.title || "service"}" has ${isDecrease ? "decreased" : "changed"} from ${oldPrice} to ${newPrice} SAR.`,
      userId: customerId,
      data: {
        listingId,
        oldPrice,
        newPrice,
        actionUrl: `/marketplace/listings/${listingId}`,
      },
    });
  }
}

/**
 * Send notification when contract is created
 */
export async function notifyContractCreated(
  contractId: string,
  providerId: string,
  customerId: string,
): Promise<void> {
  await notificationService.send({
    type: "success",
    priority: "high",
    channel: ["in-app", "email"],
    title: "Contract Created",
    message: "A new contract has been created and is ready for signature.",
    userId: customerId,
    data: {
      contractId,
      actionUrl: `/marketplace/contracts/${contractId}`,
    },
  });

  const provider = await marketplaceService.getProvider(providerId);
  if (provider?.userId) {
    await notificationService.send({
      type: "alert",
      priority: "high",
      channel: ["in-app", "email"],
      title: "Contract Created",
      message: "A new contract has been created and is ready for signature.",
      userId: provider.userId,
      data: {
        contractId,
        actionUrl: `/marketplace/contracts/${contractId}`,
      },
    });
  }
}

/**
 * Send notification when contract signature is requested
 */
export async function notifyContractSignatureRequested(
  contractId: string,
  signerId: string,
): Promise<void> {
  await notificationService.send({
    type: "alert",
    priority: "high",
    channel: ["in-app", "email", "sms"],
    title: "Signature Required",
    message: "A contract requires your signature. Please review and sign.",
    userId: signerId,
    data: {
      contractId,
      actionUrl: `/marketplace/contracts/${contractId}/sign`,
    },
  });
}

/**
 * Send notification when contract signature is received
 */
export async function notifyContractSignatureReceived(
  contractId: string,
  signerId: string,
): Promise<void> {
  await notificationService.send({
    type: "success",
    priority: "medium",
    channel: ["in-app", "email"],
    title: "Signature Received",
    message: "A signature has been received for the contract.",
    userId: signerId,
    data: {
      contractId,
      actionUrl: `/marketplace/contracts/${contractId}`,
    },
  });
}

/**
 * Send notification when contract is activated
 */
export async function notifyContractActivated(
  contractId: string,
  providerId: string,
  customerId: string,
): Promise<void> {
  await notificationService.send({
    type: "success",
    priority: "high",
    channel: ["in-app", "email"],
    title: "Contract Activated",
    message: "The contract has been activated and is now in effect.",
    userId: customerId,
    data: {
      contractId,
      actionUrl: `/marketplace/contracts/${contractId}`,
    },
  });

  const provider = await marketplaceService.getProvider(providerId);
  if (provider?.userId) {
    await notificationService.send({
      type: "success",
      priority: "high",
      channel: ["in-app", "email"],
      title: "Contract Activated",
      message: "The contract has been activated and is now in effect.",
      userId: provider.userId,
      data: {
        contractId,
        actionUrl: `/marketplace/contracts/${contractId}`,
      },
    });
  }
}

/**
 * Marketplace Notification Service Export
 */
export const marketplaceNotificationService = {
  notifyBookingCreated,
  notifyBookingStatusChange,
  notifyReviewSubmitted,
  notifyListingStatusChange,
  notifyRFQSuggestions,
  notifyLowAvailability,
  notifyNewMessage,
  notifyContractCreated,
  notifyContractSignatureRequested,
  notifyContractSignatureReceived,
  notifyContractActivated,
  notifyPriceChange,
};
