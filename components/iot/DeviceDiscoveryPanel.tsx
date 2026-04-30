/**
 * 🔍 DEVICE DISCOVERY PANEL COMPONENT
 * Multi-protocol IoT device discovery interface
 * Full implementation with protocol selection and discovery results
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { advancedDeviceDiscoveryService } from "@/lib/services/iot/advancedDeviceDiscoveryService";
import type {
  DeviceDiscoveryConfig,
  DeviceDiscoveryResult,
  IoTConnectivityProtocol,
} from "@/lib/services/iot/advancedDeviceDiscoveryService";
import type { IoTDevice } from "@/types/iot";

export default function DeviceDiscoveryPanel() {
  const [discovering, setDiscovering] = useState(false);
  const [result, setResult] = useState<DeviceDiscoveryResult | null>(null);
  const [networks, setNetworks] = useState<string[]>(["192.168.1.0/24"]);
  const [selectedProtocols, setSelectedProtocols] = useState<
    IoTConnectivityProtocol[]
  >(["wifi", "ethernet", "lora", "zigbee", "bluetooth", "5g", "satellite"]);
  const [deepScan, setDeepScan] = useState(false);
  const [securityScan, setSecurityScan] = useState(true);
  const [autoRegister, setAutoRegister] = useState(false);

  const allProtocols: IoTConnectivityProtocol[] = [
    "wifi",
    "ethernet",
    "lora",
    "zigbee",
    "bluetooth",
    "5g",
    "satellite",
  ];

  const handleDiscover = async () => {
    setDiscovering(true);
    setResult(null);

    try {
      const config: DeviceDiscoveryConfig = {
        networks,
        protocols: selectedProtocols,
        scanTimeout: 30000,
        deepScan,
        securityScan,
        autoRegister,
      };

      const discoveryResult =
        await advancedDeviceDiscoveryService.discoverDevices(config);
      setResult(discoveryResult);
    } catch (error) {
      console.error("Discovery error:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const toggleProtocol = (protocol: IoTConnectivityProtocol) => {
    setSelectedProtocols((prev) =>
      prev.includes(protocol)
        ? prev.filter((p) => p !== protocol)
        : [...prev, protocol],
    );
  };

  const getProtocolIcon = (protocol: IoTConnectivityProtocol): string => {
    const icons: Record<IoTConnectivityProtocol, string> = {
      wifi: "ri-wifi-line",
      ethernet: "ri-router-line",
      lora: "ri-signal-tower-line",
      zigbee: "ri-node-tree",
      bluetooth: "ri-bluetooth-line",
      "5g": "ri-5g-line",
      satellite: "ri-satellite-line",
    };
    return icons[protocol] || "ri-device-line";
  };

  const getProtocolColor = (protocol: IoTConnectivityProtocol): string => {
    const colors: Record<IoTConnectivityProtocol, string> = {
      wifi: "bg-blue-500",
      ethernet: "bg-green-500",
      lora: "bg-purple-500",
      zigbee: "bg-orange-500",
      bluetooth: "bg-cyan-500",
      "5g": "bg-red-500",
      satellite: "bg-yellow-500",
    };
    return colors[protocol] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Discovery Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Device Discovery Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Ranges */}
          <div>
            <Label>Network Ranges</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={networks[0] || ""}
                onChange={(e) => setNetworks([e.target.value])}
                placeholder="192.168.1.0/24"
              />
              <Button
                variant="outline"
                onClick={() => setNetworks([...networks, ""])}
                disabled={networks.length >= 5}
              >
                Add Network
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter IP ranges or network IDs to scan (e.g., 192.168.1.0/24)
            </p>
          </div>

          {/* Protocol Selection */}
          <div>
            <Label>Protocols to Scan</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {allProtocols.map((protocol) => (
                <div
                  key={protocol}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProtocols.includes(protocol)
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                  onClick={() => toggleProtocol(protocol)}
                >
                  <Checkbox
                    checked={selectedProtocols.includes(protocol)}
                    onCheckedChange={() => toggleProtocol(protocol)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <i className={`${getProtocolIcon(protocol)} text-lg`}></i>
                    <span className="text-sm font-medium capitalize">
                      {protocol}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deepScan"
                checked={deepScan}
                onCheckedChange={(checked) => setDeepScan(checked as boolean)}
              />
              <Label htmlFor="deepScan" className="cursor-pointer">
                Deep Scan (Active Discovery)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="securityScan"
                checked={securityScan}
                onCheckedChange={(checked) =>
                  setSecurityScan(checked as boolean)
                }
              />
              <Label htmlFor="securityScan" className="cursor-pointer">
                Security Assessment
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoRegister"
                checked={autoRegister}
                onCheckedChange={(checked) =>
                  setAutoRegister(checked as boolean)
                }
              />
              <Label htmlFor="autoRegister" className="cursor-pointer">
                Auto-Register Discovered Devices
              </Label>
            </div>
          </div>

          <Button
            onClick={handleDiscover}
            disabled={discovering || selectedProtocols.length === 0}
            className="w-full"
          >
            {discovering ? "Discovering Devices..." : "Start Discovery"}
          </Button>
        </CardContent>
      </Card>

      {/* Discovery Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Discovery Results</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Scanned</p>
                <p className="text-2xl font-bold">{result.totalScanned}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Validated</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.validated}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.failed}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(result.scanDuration / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Discovered Devices */}
            {result.discoveredDevices.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">
                  Discovered Devices ({result.discoveredDevices.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.discoveredDevices.map((device) => (
                    <div
                      key={device.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
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
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {device.type}
                            </div>
                            <div>
                              <span className="font-medium">Protocol:</span>{" "}
                              <Badge variant="outline" className="ml-1">
                                {device.connectivity.protocol.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium">Manufacturer:</span>{" "}
                              {device.manufacturer}
                            </div>
                            <div>
                              <span className="font-medium">Health:</span>{" "}
                              {device.status.health}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Findings */}
            {result.securityFindings.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Security Findings</h3>
                <div className="space-y-2">
                  {result.securityFindings.map((finding, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        finding.severity === "CRITICAL"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200"
                          : finding.severity === "HIGH"
                            ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200"
                            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              finding.severity === "CRITICAL"
                                ? "destructive"
                                : finding.severity === "HIGH"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {finding.severity}
                          </Badge>
                          <span className="font-medium">
                            {finding.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{finding.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Recommendation:</span>{" "}
                        {finding.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Protocols Used */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Protocols Scanned:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.protocols.map((protocol) => (
                  <Badge
                    key={protocol}
                    variant="outline"
                    className="capitalize"
                  >
                    <i className={`${getProtocolIcon(protocol)} mr-1`}></i>
                    {protocol}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
