/**
 * IoT Devices Page
 * Device management and monitoring
 */

"use client";

import React, { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iotManager } from "@/lib/services/iot/iotManager";
import type { IoTDevice, IoTDeviceType, IoTDeviceStatus } from "@/types/iot";
import { PremiumLoader } from "@/components/loading";

export default function IoTDevicesPage() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const allDevices = await iotManager.getDevices();
      setDevices(allDevices);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || device.type === filterType;
    const matchesStatus =
      filterStatus === "all" || device.status.operational === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const deviceTypes: IoTDeviceType[] = [
    "sensor",
    "camera",
    "actuator",
    "gateway",
    "edge_compute",
  ];
  const deviceStatuses: IoTDeviceStatus[] = [
    "online",
    "offline",
    "maintenance",
    "error",
    "degraded",
  ];

  return (
    <PageTemplate
      title="IoT Devices"
      description="Manage and monitor IoT devices across your network"
      icon="ri-device-line"
      stats={[
        {
          label: "Total Devices",
          value: devices.length,
          icon: "ri-device-line",
        },
        {
          label: "Online",
          value: devices.filter((d) => d.status.operational === "online")
            .length,
          icon: "ri-wifi-line",
        },
        {
          label: "Offline",
          value: devices.filter((d) => d.status.operational === "offline")
            .length,
          icon: "ri-wifi-off-line",
        },
        {
          label: "Average Health",
          value: `${Math.round(
            devices.length > 0
              ? devices.reduce((sum, d) => sum + d.status.health, 0) /
                  devices.length
              : 0,
          )}%`,
          icon: "ri-heart-pulse-line",
        },
      ]}
      actions={
        <Button asChild>
          <a href="/iot/device-discovery">
            <i className="ri-radar-line mr-2"></i>
            Discover Devices
          </a>
        </Button>
      }
    >
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <Input
            type="text"
            placeholder="Search devices by name, manufacturer, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {deviceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {deviceStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Devices List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <PremiumLoader
            message="Loading IoT devices..."
            size="lg"
            variant="default"
          />
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-device-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">No devices found</p>
          <Button asChild className="mt-4">
            <a href="/iot/device-discovery">Discover Devices</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {device.manufacturer} {device.model}
                    </p>
                  </div>
                  <Badge
                    variant={
                      device.status.operational === "online"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {device.status.operational}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{device.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Protocol</p>
                      <Badge variant="outline" className="mt-1">
                        {device.connectivity.protocol.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Health</p>
                      <p className="font-medium">{device.status.health}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Signal</p>
                      <p className="font-medium">
                        {device.connectivity.signalStrength} dBm
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">
                      {device.location.facility} - {device.location.zone}
                    </p>
                  </div>
                  {device.aiCapabilities?.edgeProcessing && (
                    <Badge variant="outline" className="w-full justify-center">
                      <i className="ri-brain-line mr-1"></i>
                      Edge AI Capable
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}
