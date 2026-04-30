/**
 * IoT Analytics Page
 * Comprehensive IoT analytics and insights
 */

"use client";

import React, { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { iotManager } from "@/lib/services/iot/iotManager";

export default function IoTAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const analyticsData = await iotManager.getAnalytics(timeRange);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="IoT Analytics"
        description="Comprehensive IoT analytics and insights"
        icon="ri-bar-chart-box-line"
      >
        <div className="text-center py-12">Loading analytics...</div>
      </PageTemplate>
    );
  }

  if (!analytics) {
    return (
      <PageTemplate
        title="IoT Analytics"
        description="Comprehensive IoT analytics and insights"
        icon="ri-bar-chart-box-line"
      >
        <div className="text-center py-12 text-muted-foreground">
          No analytics data available
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="IoT Analytics"
      description="Comprehensive IoT analytics and insights"
      icon="ri-bar-chart-box-line"
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.overview.totalDevices}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics.overview.onlineDevices} online,{" "}
                  {analytics.overview.offlineDevices} offline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.overview.averageHealth.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Device health score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.overview.totalAlerts}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics.overview.criticalAlerts} critical
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Average Uptime
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.performance.averageUptime.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Network Latency
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.performance.networkLatency.toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Data Transmission
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.performance.dataTransmission.toFixed(1)} Mbps
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Power Efficiency
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.performance.powerEfficiency.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Devices Needing Maintenance
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.maintenance.devicesNeedingMaintenance}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Average Maintenance Cost
                    </p>
                    <p className="text-2xl font-bold">
                      ${analytics.maintenance.averageMaintenanceCost}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Predicted Failures
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.maintenance.predictedFailures}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Maintenance Efficiency
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.maintenance.maintenanceEfficiency.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Vulnerable Devices
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.security.vulnerableDevices}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Security Score
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.security.securityScore.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Threat Level
                    </p>
                    <Badge
                      variant={
                        analytics.security.threatLevel === "critical"
                          ? "destructive"
                          : analytics.security.threatLevel === "high"
                            ? "default"
                            : "secondary"
                      }
                      className="text-lg px-3 py-1"
                    >
                      {analytics.security.threatLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Security Scan
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(
                        analytics.security.lastSecurityScan,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.trends.map((trend: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{trend.metric}</p>
                        <p className="text-sm text-muted-foreground">
                          {trend.trend === "improving"
                            ? "📈"
                            : trend.trend === "declining"
                              ? "📉"
                              : "➡️"}{" "}
                          {trend.trend}
                        </p>
                      </div>
                      <Badge
                        variant={
                          trend.trend === "improving"
                            ? "default"
                            : trend.trend === "declining"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {trend.changeRate > 0 ? "+" : ""}
                        {trend.changeRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
