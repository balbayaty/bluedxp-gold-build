"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import { marketplaceRealtimeService } from "@/lib/services/marketplace/marketplaceRealtimeService";

interface RealTimeIndicatorProps {
  listingId?: string;
  bookingId?: string;
  showViewerCount?: boolean;
}

export default function RealTimeIndicator({
  listingId,
  bookingId,
  showViewerCount = false,
}: RealTimeIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = listingId
      ? marketplaceRealtimeService.subscribeToListingUpdates(
          listingId,
          (update) => {
            setLastUpdate(new Date());
          },
        )
      : bookingId
        ? marketplaceRealtimeService.subscribeToBookingUpdates(
            bookingId,
            (update) => {
              setLastUpdate(new Date());
            },
          )
        : null;

    setIsConnected(true);

    // Get viewer count
    if (showViewerCount && listingId) {
      marketplaceRealtimeService.getLiveViewerCount(listingId).then((count) => {
        setViewerCount(count);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      setIsConnected(false);
    };
  }, [listingId, bookingId, showViewerCount]);

  if (!isConnected) return null;

  return (
    <div className="flex items-center space-x-2 text-sm text-slate-500">
      <div className="flex items-center space-x-1">
        <Radio className="w-3 h-3 text-green-500 animate-pulse" />
        <span>Live</span>
      </div>
      {showViewerCount && viewerCount > 0 && (
        <span className="text-slate-400">
          {viewerCount} {viewerCount === 1 ? "person" : "people"} viewing
        </span>
      )}
      {lastUpdate && (
        <span className="text-slate-400">
          Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago
        </span>
      )}
    </div>
  );
}
