"use client";

/**
 * Maintenance Manager Component
 *
 * Enterprise-grade maintenance management with:
 * - Preventive & predictive maintenance
 * - Work order management
 * - Maintenance scheduling
 * - Cost tracking
 * - AI-powered insights
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiHammerLine,
  RiAddLine,
  RiCalendarLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiBrainLine,
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

export default function MaintenanceManager() {
  const [loading, setLoading] = useState(true);
  const [maintenanceData, setMaintenanceData] = useState<
    Array<{
      month: string;
      preventive: number;
      corrective: number;
      emergency: number;
    }>
  >([]);
  const [stats, setStats] = useState({
    totalWorkOrders: 0,
    open: 0,
    completed: 0,
    overdue: 0,
    preventiveRate: 0,
    totalCost: 0,
    averageResponseTime: 0,
  });
  const [predictiveInsights, setPredictiveInsights] = useState<
    Array<{
      assetId: string;
      assetName: string;
      riskLevel: "critical" | "high" | "medium" | "low";
      confidence: number;
      message: string;
    }>
  >([]);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        setLoading(true);
        const facilityId = "facility-1"; // In real app, get from context/params

        // Fetch maintenance records with predictive insights
        const response = await fetch(
          `/api/facility/maintenance?facilityId=${facilityId}&includePredictive=true`,
        );
        const result = await response.json();

        if (result.success) {
          // Process stats
          const maintenanceStats = result.stats || {};
          setStats({
            totalWorkOrders: maintenanceStats.total || 0,
            open: maintenanceStats.scheduled + maintenanceStats.inProgress || 0,
            completed: maintenanceStats.completed || 0,
            overdue: maintenanceStats.overdue || 0,
            preventiveRate:
              maintenanceStats.total > 0
                ? (maintenanceStats.preventive / maintenanceStats.total) * 100
                : 0,
            totalCost: maintenanceStats.totalCost || 0,
            averageResponseTime: maintenanceStats.averageResponseTime || 0,
          });

          // Process maintenance data by month
          const maintenanceByMonth: Record<
            string,
            { preventive: number; corrective: number; emergency: number }
          > = {};

          result.data.forEach((record: any) => {
            if (record.scheduledDate || record.completedDate) {
              const date = new Date(
                record.scheduledDate || record.completedDate,
              );
              const monthKey = date.toLocaleDateString("en-US", {
                month: "short",
              });
              if (!maintenanceByMonth[monthKey]) {
                maintenanceByMonth[monthKey] = {
                  preventive: 0,
                  corrective: 0,
                  emergency: 0,
                };
              }
              if (record.type === "preventive")
                maintenanceByMonth[monthKey].preventive++;
              else if (record.type === "corrective")
                maintenanceByMonth[monthKey].corrective++;
              else if (record.type === "emergency")
                maintenanceByMonth[monthKey].emergency++;
            }
          });

          // Convert to array format (last 6 months)
          const maintenanceArray = Object.entries(maintenanceByMonth)
            .map(([month, data]) => ({ month, ...data }))
            .slice(-6);

          setMaintenanceData(
            maintenanceArray.length > 0
              ? maintenanceArray
              : [
                  { month: "Jan", preventive: 0, corrective: 0, emergency: 0 },
                  { month: "Feb", preventive: 0, corrective: 0, emergency: 0 },
                ],
          );

          // Process predictive insights
          if (result.predictiveInsights) {
            const insights = Array.isArray(result.predictiveInsights)
              ? result.predictiveInsights
              : Object.entries(result.predictiveInsights).map(
                  ([assetId, data]: [string, any]) => ({
                    assetId,
                    assetName: data.assetName || assetId,
                    riskLevel: data.riskLevel || "medium",
                    confidence: data.confidence || 0.5,
                    message:
                      data.recommendedActions?.[0] || "Maintenance recommended",
                  }),
                );
            setPredictiveInsights(insights);
          }
        }
      } catch (error) {
        console.error("Error fetching maintenance data:", error);
        // Keep default/empty data on error
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiHammerLine className="h-8 w-8 text-primary" />
            Maintenance Management
          </h1>
          <p className="text-muted-foreground mt-1">
            CMMS with Predictive Maintenance & AI-Powered Insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="gap-2">
            <RiCalendarLine className="h-4 w-4" />
            Schedule Maintenance
          </Button>
          <Button variant="primary" size="lg" className="gap-2">
            <RiAddLine className="h-4 w-4" />
            Create Work Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdue} overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preventive Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.preventiveRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry avg: 70%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalCost / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageResponseTime}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">Response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.overdue > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RiAlertLine className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">
                Overdue Work Orders
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              {stats.overdue} work orders are overdue and require immediate
              attention
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              View Overdue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictive">
            <RiBrainLine className="h-4 w-4 mr-2" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Trends</CardTitle>
                <CardDescription>
                  Preventive vs Corrective vs Emergency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={maintenanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="preventive"
                      fill="#10b981"
                      name="Preventive"
                    />
                    <Bar
                      dataKey="corrective"
                      fill="#f59e0b"
                      name="Corrective"
                    />
                    <Bar dataKey="emergency" fill="#ef4444" name="Emergency" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Predictive maintenance recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {predictiveInsights.length > 0 ? (
                  <div className="space-y-3">
                    {predictiveInsights.slice(0, 5).map((insight, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              insight.riskLevel === "critical"
                                ? "error"
                                : insight.riskLevel === "high"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {insight.riskLevel.charAt(0).toUpperCase() +
                              insight.riskLevel.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="font-medium">{insight.assetName}</p>
                        <p className="text-sm text-muted-foreground">
                          {insight.message}
                        </p>
                        <Button
                          variant={
                            insight.riskLevel === "critical"
                              ? "primary"
                              : "outline"
                          }
                          size="sm"
                          className="mt-2"
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No predictive insights available. Predictive maintenance
                    will appear here when data is available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RiBrainLine className="h-5 w-5" />
                Predictive Maintenance
              </CardTitle>
              <CardDescription>
                AI-powered failure prediction and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictiveInsights.length > 0 ? (
                <div className="space-y-4">
                  {predictiveInsights.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {insight.assetName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Asset ID: {insight.assetId}
                          </p>
                        </div>
                        <Badge
                          variant={
                            insight.riskLevel === "critical"
                              ? "error"
                              : insight.riskLevel === "high"
                                ? "warning"
                                : insight.riskLevel === "medium"
                                  ? "default"
                                  : "success"
                          }
                        >
                          {insight.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Confidence Level
                          </span>
                          <span className="font-semibold">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              insight.riskLevel === "critical"
                                ? "bg-red-500"
                                : insight.riskLevel === "high"
                                  ? "bg-orange-500"
                                  : insight.riskLevel === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                            }`}
                            style={{ width: `${insight.confidence * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {insight.message}
                        </p>
                        <Button variant="outline" size="sm" className="mt-3">
                          View Asset Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No predictive maintenance insights available. AI-powered
                  predictions will appear here when sufficient data is
                  collected.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
