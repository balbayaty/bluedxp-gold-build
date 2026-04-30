/**
 * Analytical Dashboard Component
 * Deep-dive analytics, insights, and recommendations
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticalDashboardData, DashboardInsight } from "@/types/asn";
import {
  RiBarChartBoxLine,
  RiLightbulbLine,
  RiArrowUpLine as RiTrendingUpLine,
  RiArrowDownLine as RiTrendingDownLine,
  RiAlertLine,
  RiThumbUpLine,
} from "react-icons/ri";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticalDashboardProps {
  tenantId?: string;
  days?: number;
}

export function AnalyticalDashboard({
  tenantId,
  days = 30,
}: AnalyticalDashboardProps) {
  const [data, setData] = useState<AnalyticalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [tenantId, days]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/asn/analytics/dashboard?type=analytical&days=${days}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load analytical dashboard");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { analytics, insights, recommendations } = data;

  // Prepare chart data
  const volumeChartData = analytics.dailyVolume.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  const exceptionChartData = analytics.exceptionTrend.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  const statusChartData = Object.entries(analytics.statusBreakdown).map(
    ([status, count]) => ({
      status: status.replace("_", " "),
      count,
    }),
  );

  const exceptionTypeChartData = Object.entries(
    analytics.exceptionBreakdown,
  ).map(([type, count]) => ({
    type: type.replace("_", " "),
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <RiTrendingUpLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.onTimeArrivalRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.onTimeArrivalRate >= 0.9
                ? "Excellent"
                : analytics.onTimeArrivalRate >= 0.8
                  ? "Good"
                  : "Needs Improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Exception Rate
            </CardTitle>
            <RiAlertLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(analytics.exceptionRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.exceptionRate < 0.1
                ? "Low"
                : analytics.exceptionRate < 0.2
                  ? "Moderate"
                  : "High"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Processing Time
            </CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageProcessingTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageProcessingTime < 2
                ? "Fast"
                : analytics.averageProcessingTime < 4
                  ? "Normal"
                  : "Slow"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <RiBarChartBoxLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              }).format(analytics.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              }).format(analytics.averageCostPerAsn)}{" "}
              per ASN
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RiLightbulbLine className="h-5 w-5" />
              <CardTitle>AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No insights available
                </p>
              ) : (
                insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RiThumbUpLine className="h-5 w-5" />
              <CardTitle>Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recommendations
                </p>
              ) : (
                recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-accent rounded-lg"
                  >
                    <RiThumbUpLine className="h-4 w-4 mt-0.5 text-primary" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList>
          <TabsTrigger value="volume">Volume Trends</TabsTrigger>
          <TabsTrigger value="exceptions">Exception Trends</TabsTrigger>
          <TabsTrigger value="status">Status Breakdown</TabsTrigger>
          <TabsTrigger value="exception-types">Exception Types</TabsTrigger>
        </TabsList>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>ASN Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="ASN Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions">
          <Card>
            <CardHeader>
              <CardTitle>Exception Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={exceptionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ff7300"
                    name="Exceptions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exception-types">
          <Card>
            <CardHeader>
              <CardTitle>Exception Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exceptionTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ff7300" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Suppliers Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topSuppliers.slice(0, 10).map((supplier) => (
              <div
                key={supplier.supplierId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium">{supplier.supplierName}</p>
                    <Badge
                      variant={
                        supplier.riskLevel === "low"
                          ? "default"
                          : supplier.riskLevel === "medium"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {supplier.riskLevel} risk
                    </Badge>
                    {supplier.performanceTrend === "improving" && (
                      <RiTrendingUpLine className="h-4 w-4 text-green-600" />
                    )}
                    {supplier.performanceTrend === "declining" && (
                      <RiTrendingDownLine className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">On-Time Rate</p>
                      <p className="font-medium">
                        {(supplier.onTimeDeliveryRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quality Score</p>
                      <p className="font-medium">
                        {supplier.qualityScore.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Exception Rate</p>
                      <p className="font-medium">
                        {(supplier.exceptionRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Overall Score</p>
                      <p className="font-medium text-lg">
                        {supplier.overallScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({ insight }: { insight: DashboardInsight }) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case "trend":
        return <RiTrendingUpLine className="h-4 w-4" />;
      case "anomaly":
        return <RiAlertLine className="h-4 w-4" />;
      case "opportunity":
        return <RiLightbulbLine className="h-4 w-4" />;
      case "risk":
        return <RiAlertLine className="h-4 w-4" />;
      default:
        return <RiBarChartBoxLine className="h-4 w-4" />;
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case "trend":
        return "bg-blue-50 border-blue-200";
      case "anomaly":
        return "bg-yellow-50 border-yellow-200";
      case "opportunity":
        return "bg-green-50 border-green-200";
      case "risk":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`p-4 border-2 rounded-lg ${getInsightColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getInsightIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium">{insight.title}</p>
            <Badge variant="outline">{insight.impact} impact</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {insight.description}
          </p>
          {insight.recommendations && insight.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Recommendations:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {insight.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Confidence: {(insight.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
