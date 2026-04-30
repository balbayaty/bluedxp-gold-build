/**
 * IoT Dashboard Page
 * Overview of IoT devices and network
 */

"use client";

import React, { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { iotManager } from "@/lib/services/iot/iotManager";
import { advancedNetworkTopologyService } from "@/lib/services/iot/advancedNetworkTopologyService";
import type { IoTDevice } from "@/types/iot";

export default function IoTDashboardPage() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allDevices = await iotManager.getDevices();
      setDevices(allDevices);

      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const analyticsData = await iotManager.getAnalytics(timeRange);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading IoT data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onlineDevices = devices.filter(
    (d) => d.status.operational === "online",
  );
  const offlineDevices = devices.filter(
    (d) => d.status.operational === "offline",
  );
  const averageHealth =
    devices.length > 0
      ? devices.reduce((sum, d) => sum + d.status.health, 0) / devices.length
      : 0;

  return (
    <PageTemplate
      title="IoT Dashboard"
      description="Comprehensive IoT device management and network monitoring"
      icon="ri-radar-line"
      stats={[
        {
          label: "Total Devices",
          value: devices.length,
          icon: "ri-device-line",
        },
        {
          label: "Online Devices",
          value: onlineDevices.length,
          icon: "ri-wifi-line",
        },
        {
          label: "Average Health",
          value: `${Math.round(averageHealth)}%`,
          icon: "ri-heart-pulse-line",
        },
        {
          label: "Network Health",
          value: analytics?.overview
            ? `${analytics.overview.averageHealth.toFixed(0)}%`
            : "N/A",
          icon: "ri-node-tree",
        },
      ]}
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/iot/device-discovery">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <i className="ri-radar-line text-3xl text-blue-500"></i>
                  <div>
                    <h3 className="font-semibold">Device Discovery</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover devices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/iot/network-topology">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <i className="ri-node-tree text-3xl text-green-500"></i>
                  <div>
                    <h3 className="font-semibold">Network Topology</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize network
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/iot/edge-ai">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <i className="ri-brain-line text-3xl text-purple-500"></i>
                  <div>
                    <h3 className="font-semibold">Edge AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Deploy AI models
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/iot/device-groups">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <i className="ri-group-line text-3xl text-orange-500"></i>
                  <div>
                    <h3 className="font-semibold">Device Groups</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage groups
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle>Device Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No devices registered. Start by discovering devices.
              </div>
            ) : (
              <div className="space-y-3">
                {devices.slice(0, 10).map((device) => (
                  <div key={device.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{device.name}</h4>
                          <Badge
                            variant={
                              device.status.operational === "online"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {device.status.operational}
                          </Badge>
                          <Badge variant="outline">{device.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Protocol:</span>{" "}
                            {device.connectivity.protocol}
                          </div>
                          <div>
                            <span className="font-medium">Health:</span>{" "}
                            {device.status.health}%
                          </div>
                          <div>
                            <span className="font-medium">Signal:</span>{" "}
                            {device.connectivity.signalStrength} dBm
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>{" "}
                            {device.location.zone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {devices.length > 10 && (
                  <div className="text-center pt-4">
                    <Link href="/iot/devices">
                      <Button variant="outline">
                        View All Devices ({devices.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                      Power Efficiency
                    </p>
                    <p className="text-2xl font-bold">
                      {analytics.performance.powerEfficiency.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
        )}
      </div>
    </PageTemplate>
  );
}
