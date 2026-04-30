/**
 * Unified SLA/KPI Dashboard
 *
 * Single dashboard for all SLA and KPI metrics across all modules
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
} from "lucide-react";

interface SLADashboard {
  overallCompliance: number;
  activeSLAs: number;
  compliantSLAs: number;
  breachedSLAs: number;
  atRiskSLAs: number;
  slaByModule: Record<
    string,
    {
      total: number;
      compliant: number;
      breached: number;
      complianceRate: number;
    }
  >;
  slaByParty: Record<
    string,
    {
      total: number;
      compliant: number;
      breached: number;
      complianceRate: number;
    }
  >;
  recentBreaches: Array<{
    id: string;
    slaName: string;
    partyName: string;
    status: string;
    calculatedAt: string;
  }>;
}

interface KPIDashboard {
  overallPerformance: number;
  activeKPIs: number;
  onTargetKPIs: number;
  belowTargetKPIs: number;
  kpiByModule: Record<
    string,
    {
      total: number;
      onTarget: number;
      belowTarget: number;
      averagePerformance: number;
    }
  >;
  topKPIs: Array<{
    kpiId: string;
    kpiName: string;
    value: number;
    target: number;
    status: string;
  }>;
}

export default function UnifiedSlaKpiDashboard() {
  const [slaDashboard, setSlaDashboard] = useState<SLADashboard | null>(null);
  const [kpiDashboard, setKpiDashboard] = useState<KPIDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const tenantId = "default"; // TODO: Get from auth context

  const loadDashboards = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(
          `/api/sla-kpi/unified?tenantId=${tenantId}&type=both`,
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to load dashboards: ${response.status}`,
          );
        }

        const data = await response.json();
        if (data.success && data.data) {
          setSlaDashboard(data.data.sla || null);
          setKpiDashboard(data.data.kpi || null);
          setLastUpdated(new Date());
        } else {
          throw new Error(data.message || "Failed to load dashboards");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error loading dashboards:", err);
        // Set empty dashboards on error so UI still renders
        setSlaDashboard(null);
        setKpiDashboard(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tenantId],
  );

  useEffect(() => {
    loadDashboards();

    if (!autoRefresh) return;

    // Refresh every 30 seconds when auto-refresh is enabled
    const interval = setInterval(() => {
      loadDashboards(true);
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [loadDashboards, autoRefresh]);

  const handleRefresh = () => {
    loadDashboards(true);
  };

  if (loading && !slaDashboard && !kpiDashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Loading unified dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified SLA/KPI Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive performance metrics across all modules
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label
              htmlFor="auto-refresh"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Activity
                className={`h-4 w-4 ${autoRefresh ? "text-green-500 animate-pulse" : "text-muted-foreground"}`}
              />
              <span className="text-sm">Auto-refresh</span>
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sla" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
          <TabsTrigger value="kpi">KPI Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="space-y-4">
          {slaDashboard ? (
            <>
              {/* Overall Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Overall Compliance
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {slaDashboard.overallCompliance.toFixed(1)}%
                    </div>
                    <Progress
                      value={slaDashboard.overallCompliance}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active SLAs
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {slaDashboard.activeSLAs}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total active SLAs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Compliant
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {slaDashboard.compliantSLAs}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Meeting targets
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Breached
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {slaDashboard.breachedSLAs}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requiring attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Breaches */}
              {slaDashboard.recentBreaches &&
                slaDashboard.recentBreaches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Breaches</CardTitle>
                      <CardDescription>
                        SLAs that have been breached recently
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {slaDashboard.recentBreaches
                          .slice(0, 5)
                          .map((breach) => (
                            <div
                              key={breach.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{breach.slaName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {breach.partyName}
                                </p>
                              </div>
                              <Badge variant="destructive">
                                {breach.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* By Party */}
              {Object.keys(slaDashboard.slaByParty).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance by Party</CardTitle>
                    <CardDescription>
                      Performance breakdown by responsible parties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(slaDashboard.slaByParty)
                        .slice(0, 10)
                        .map(([party, data]) => {
                          const complianceRate =
                            data.total > 0
                              ? (data.compliant / data.total) * 100
                              : 0;
                          return (
                            <div
                              key={party}
                              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {party.replace("-", " ")}
                                </span>
                                <Badge
                                  variant={
                                    complianceRate >= 95
                                      ? "default"
                                      : complianceRate >= 80
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {complianceRate.toFixed(1)}%
                                </Badge>
                              </div>
                              <Progress
                                value={complianceRate}
                                className="mb-2"
                              />
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span className="text-green-600">
                                  {data.compliant} compliant
                                </span>
                                <span className="text-red-600">
                                  {data.breached} breached
                                </span>
                                <span>{data.total} total</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By Module */}
              {Object.keys(slaDashboard.slaByModule).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance by Module</CardTitle>
                    <CardDescription>
                      Performance across different modules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(slaDashboard.slaByModule).map(
                        ([module, data]) => (
                          <div
                            key={module}
                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize">
                                {module.replace(/_/g, " ")}
                              </span>
                              <Badge
                                variant={
                                  data.complianceRate >= 95
                                    ? "default"
                                    : data.complianceRate >= 80
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {data.complianceRate.toFixed(1)}%
                              </Badge>
                            </div>
                            <Progress
                              value={data.complianceRate}
                              className="mb-2"
                            />
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span className="text-green-600">
                                {data.compliant} compliant
                              </span>
                              <span className="text-red-600">
                                {data.breached} breached
                              </span>
                              <span>{data.total} total</span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                slaDashboard.activeSLAs > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Active SLAs</CardTitle>
                      <CardDescription>
                        {slaDashboard.activeSLAs} SLA
                        {slaDashboard.activeSLAs !== 1 ? "s" : ""} configured
                        and ready to track
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          Compliance data will appear here as transactions are
                          processed and tracked.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          The service automatically tracks shipments, ASNs,
                          orders, and other events.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2 font-medium">
                    No SLA data available yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    SLAs will appear here once they are created and tracked
                  </p>
                  <Alert className="mt-4">
                    <AlertDescription>
                      <strong>To populate this dashboard:</strong>
                      <br />
                      Run the seed script:{" "}
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        npx tsx scripts/seed-unified-sla-kpi.ts
                      </code>
                      <br />
                      <span className="text-xs text-muted-foreground mt-2 block">
                        This will create default SLA templates for
                        Transportation, WMS, Customs, and Geofence modules.
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          {kpiDashboard ? (
            <>
              {/* Overall Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Overall Performance
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpiDashboard.overallPerformance.toFixed(1)}%
                    </div>
                    <Progress
                      value={kpiDashboard.overallPerformance}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active KPIs
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpiDashboard.activeKPIs}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total active KPIs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      On Target
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {kpiDashboard.onTargetKPIs}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Meeting targets
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Below Target
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {kpiDashboard.belowTargetKPIs}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Needs improvement
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top KPIs */}
              {kpiDashboard.topKPIs && kpiDashboard.topKPIs.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Top KPIs</CardTitle>
                    <CardDescription>
                      Key performance indicators with current values
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {kpiDashboard.topKPIs.slice(0, 10).map((kpi) => {
                        const percentage =
                          kpi.target > 0 ? (kpi.value / kpi.target) * 100 : 0;
                        const isOnTarget = percentage >= 100;
                        const isWarning = percentage >= 80 && percentage < 100;
                        return (
                          <div
                            key={kpi.kpiId}
                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{kpi.kpiName}</span>
                              <Badge
                                variant={
                                  kpi.status === "MET" || isOnTarget
                                    ? "default"
                                    : kpi.status === "WARNING" || isWarning
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {kpi.status}
                              </Badge>
                            </div>
                            <Progress
                              value={Math.min(percentage, 100)}
                              className={`mb-2 ${isOnTarget ? "" : isWarning ? "bg-yellow-500" : "bg-red-500"}`}
                            />
                            <div className="flex gap-4 text-xs">
                              <span
                                className={
                                  isOnTarget
                                    ? "text-green-600 font-medium"
                                    : isWarning
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                Value: {kpi.value.toFixed(2)}
                              </span>
                              <span className="text-muted-foreground">
                                Target: {kpi.target.toFixed(2)}
                              </span>
                              <span
                                className={
                                  isOnTarget
                                    ? "text-green-600 font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                kpiDashboard.activeKPIs > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Active KPIs</CardTitle>
                      <CardDescription>
                        {kpiDashboard.activeKPIs} KPI
                        {kpiDashboard.activeKPIs !== 1 ? "s" : ""} configured
                        and ready to track
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          KPI values will appear here as calculations are
                          performed.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          KPIs are calculated based on real-time data from your
                          operations.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2 font-medium">
                    No KPI data available yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    KPIs will appear here once they are created and calculated
                  </p>
                  <Alert className="mt-4">
                    <AlertDescription>
                      <strong>To populate this dashboard:</strong>
                      <br />
                      Run the seed script:{" "}
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        npx tsx scripts/seed-unified-sla-kpi.ts
                      </code>
                      <br />
                      <span className="text-xs text-muted-foreground mt-2 block">
                        This will create default KPI templates for performance
                        tracking across all modules.
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
