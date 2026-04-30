/**
 * Edge Computing Status Indicator
 *
 * Shows offline/online status and pending operations
 */

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RiWifiLine,
  RiWifiOffLine,
  RiRefreshLine,
  RiCloudLine,
  RiCloudOffLine,
} from "react-icons/ri";

interface EdgeStatusIndicatorProps {
  tenantId: string;
}

export default function EdgeStatusIndicator({
  tenantId,
}: EdgeStatusIndicatorProps) {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    pendingOperations: number;
    lastSyncAt?: Date;
    syncInProgress: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/iso-ims/edge/status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Error fetching edge status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [tenantId]);

  const handleSync = async () => {
    try {
      const response = await fetch("/api/iso-ims/edge/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Error syncing:", error);
    }
  };

  if (loading || !status) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {status.isOnline ? (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <RiWifiLine className="h-3 w-3 mr-1" />
          Online
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <RiWifiOffLine className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}

      {status.pendingOperations > 0 && (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <RiCloudLine className="h-3 w-3 mr-1" />
          {status.pendingOperations} pending
        </Badge>
      )}

      {status.pendingOperations > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={status.syncInProgress}
        >
          <RiRefreshLine className="h-4 w-4 mr-1" />
          Sync
        </Button>
      )}
    </div>
  );
}
