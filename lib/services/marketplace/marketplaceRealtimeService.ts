/**
 * Marketplace Real-Time Service
 * WebSocket integration for live updates
 */

import { websocketService } from "@/lib/services/realtime/websocketService";
import type {
  WebSocketEvent,
  WebSocketEventType,
} from "@/lib/services/realtime/websocketService";

export interface MarketplaceRealtimeUpdate {
  type:
    | "listing.updated"
    | "booking.status.changed"
    | "review.added"
    | "availability.changed"
    | "price.changed";
  listingId?: string;
  bookingId?: string;
  data: any;
  timestamp: string;
}

/**
 * Subscribe to marketplace real-time updates
 */
export function subscribeToMarketplaceUpdates(
  userId: string,
  callback: (update: MarketplaceRealtimeUpdate) => void,
): () => void {
  const handler = (event: WebSocketEvent) => {
    if (event.userId === userId || !event.userId) {
      callback({
        type: event.type as any,
        listingId: event.data?.listingId,
        bookingId: event.data?.bookingId,
        data: event.data,
        timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
      });
    }
  };

  // Subscribe to notification events (marketplace updates come through notifications)
  websocketService.on("notification", handler);

  return () => {
    websocketService.off("notification", handler);
  };
}

/**
 * Subscribe to specific listing updates
 */
export function subscribeToListingUpdates(
  listingId: string,
  callback: (update: MarketplaceRealtimeUpdate) => void,
): () => void {
  const handler = (event: WebSocketEvent) => {
    if (event.data?.listingId === listingId) {
      callback({
        type: event.type as any,
        listingId,
        data: event.data,
        timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
      });
    }
  };

  websocketService.on("notification", handler);

  return () => {
    websocketService.off("notification", handler);
  };
}

/**
 * Subscribe to booking updates
 */
export function subscribeToBookingUpdates(
  bookingId: string,
  callback: (update: MarketplaceRealtimeUpdate) => void,
): () => void {
  const handler = (event: WebSocketEvent) => {
    if (event.data?.bookingId === bookingId) {
      callback({
        type: event.type as any,
        bookingId,
        data: event.data,
        timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
      });
    }
  };

  websocketService.on("notification", handler);

  return () => {
    websocketService.off("notification", handler);
  };
}

/**
 * Publish marketplace real-time update
 */
export async function publishMarketplaceUpdate(
  type: MarketplaceRealtimeUpdate["type"],
  data: any,
  listingId?: string,
  bookingId?: string,
): Promise<void> {
  // Real-time updates are sent via notifications
  // The notification service will handle WebSocket broadcasting
  // This function is kept for API compatibility but actual broadcasting
  // happens through the notification service
  console.log("Marketplace real-time update:", {
    type,
    data,
    listingId,
    bookingId,
  });
}

/**
 * Get live viewer count for listing
 */
export function getLiveViewerCount(listingId: string): Promise<number> {
  // In production, this would query WebSocket server for active connections
  return Promise.resolve(0);
}

/**
 * Marketplace Real-Time Service Export
 */
export const marketplaceRealtimeService = {
  subscribeToMarketplaceUpdates,
  subscribeToListingUpdates,
  subscribeToBookingUpdates,
  publishMarketplaceUpdate,
  getLiveViewerCount,
};
