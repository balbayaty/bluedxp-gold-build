/**
 * Operational Dashboard Component
 * Real-time ASN queue and operational metrics
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OperationalDashboardData, ASN } from "@/types/asn";
import {
  RiInboxLine,
  RiTimeLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
} from "react-icons/ri";
import Link from "next/link";

interface OperationalDashboardProps {
  tenantId?: string;
}

export function OperationalDashboard({ tenantId }: OperationalDashboardProps) {
  const [data, setData] = useState<OperationalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/asn/analytics/dashboard?type=operational",
      );

      if (!response.ok) {
        throw new Error("Failed to load operational dashboard");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { queue, today, alerts } = data;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                  </div>
                  {alert.actionUrl && (
                    <Link href={alert.actionUrl}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expected Today
            </CardTitle>
            <RiTimeLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{today.expected.length}</div>
            <p className="text-xs text-muted-foreground">ASNs scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrived Today</CardTitle>
            <RiInboxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {today.arrived.length}
            </div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <RiCheckboxCircleLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {today.completed.length}
            </div>
            <p className="text-xs text-muted-foreground">Processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pending</CardTitle>
              <Badge variant="outline">{queue.pending.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {queue.pending.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending ASNs
                </p>
              ) : (
                queue.pending.map((asn) => (
                  <AsnQueueItem key={asn.id} asn={asn} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* In Progress Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">In Progress</CardTitle>
              <Badge variant="outline">{queue.inProgress.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {queue.inProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ASNs in progress
                </p>
              ) : (
                queue.inProgress.map((asn) => (
                  <AsnQueueItem key={asn.id} asn={asn} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exceptions Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Exceptions</CardTitle>
              <Badge variant="destructive">{queue.exceptions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {queue.exceptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No exceptions
                </p>
              ) : (
                queue.exceptions.map((asn) => (
                  <AsnQueueItem key={asn.id} asn={asn} isException />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AsnQueueItem({
  asn,
  isException = false,
}: {
  asn: ASN;
  isException?: boolean;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "receiving":
        return "bg-purple-100 text-purple-800";
      case "exception":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Link href={`/asn/processing/${asn.id}`}>
      <div
        className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
          isException ? "border-red-200 bg-red-50" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="font-medium text-sm">{asn.asnNumber}</p>
            <p className="text-xs text-muted-foreground">{asn.supplierName}</p>
          </div>
          <Badge className={getStatusColor(asn.status)}>
            {asn.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{asn.totalItems} items</span>
          <span className="text-muted-foreground">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: asn.currency || "SAR",
              minimumFractionDigits: 0,
            }).format(asn.totalValue)}
          </span>
        </div>

        {asn.expectedArrivalDate && (
          <div className="mt-2 text-xs text-muted-foreground">
            Expected: {new Date(asn.expectedArrivalDate).toLocaleDateString()}
          </div>
        )}

        {isException && (
          <div className="mt-2 flex items-center text-xs text-red-600">
            <RiAlertLine className="h-3 w-3 mr-1" />
            Requires attention
          </div>
        )}
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
