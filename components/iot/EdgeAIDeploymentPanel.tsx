/**
 * 🤖 EDGE AI DEPLOYMENT PANEL COMPONENT
 * Deploy AI models to IoT edge devices
 * Full implementation with model selection and deployment tracking
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { iotManager } from "@/lib/services/iot/iotManager";
import { edgeAIService } from "@/lib/services/iot/edgeAIService";
import type { IoTDevice, IoTModelType, IoTModelFramework } from "@/types/iot";

export default function EdgeAIDeploymentPanel() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [modelType, setModelType] = useState<IoTModelType>("anomaly_detection");
  const [framework, setFramework] =
    useState<IoTModelFramework>("tensorflow_lite");
  const [deploying, setDeploying] = useState(false);
  const [deploymentResults, setDeploymentResults] = useState<any[]>([]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const allDevices = await iotManager.getDevices();
      // Filter devices that support edge AI
      const edgeCapableDevices = allDevices.filter(
        (d) => d.aiCapabilities?.modelDeployment === true,
      );
      setDevices(edgeCapableDevices);
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const handleDeploy = async () => {
    if (selectedDevices.length === 0) return;

    setDeploying(true);
    setDeploymentResults([]);

    try {
      const modelId = `model-${Date.now()}`;
      const model = {
        name: `${modelType} Model`,
        type: modelType,
        framework: framework,
        size: modelType === "classification" ? 25 : 5, // MB
        requirements: {
          cpu: modelType === "classification" ? 4 : 1,
          memory: modelType === "classification" ? 128 : 32, // MB
          storage: modelType === "classification" ? 50 : 10, // MB
        },
      };

      const deployment = await iotManager.deployAIModel(
        modelId,
        selectedDevices,
        model,
      );
      setDeploymentResults([deployment]);
    } catch (error) {
      console.error("Deployment error:", error);
    } finally {
      setDeploying(false);
    }
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId],
    );
  };

  return (
    <div className="space-y-6">
      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Model Type</Label>
            <Select
              value={modelType}
              onValueChange={(value) => setModelType(value as IoTModelType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anomaly_detection">
                  Anomaly Detection
                </SelectItem>
                <SelectItem value="predictive_maintenance">
                  Predictive Maintenance
                </SelectItem>
                <SelectItem value="optimization">Optimization</SelectItem>
                <SelectItem value="classification">Classification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Framework</Label>
            <Select
              value={framework}
              onValueChange={(value) =>
                setFramework(value as IoTModelFramework)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tensorflow_lite">TensorFlow Lite</SelectItem>
                <SelectItem value="onnx">ONNX</SelectItem>
                <SelectItem value="openvino">OpenVINO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Device Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Target Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No edge-capable devices found. Devices must support model
              deployment.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDevices.includes(device.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:bg-muted/50"
                  }`}
                  onClick={() => toggleDevice(device.id)}
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
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {device.type}
                        </div>
                        <div>
                          <span className="font-medium">Protocol:</span>{" "}
                          {device.connectivity.protocol}
                        </div>
                        <div>
                          <span className="font-medium">Health:</span>{" "}
                          {device.status.health}%
                        </div>
                        <div>
                          <span className="font-medium">Edge AI:</span>{" "}
                          {device.aiCapabilities?.edgeProcessing ? "✅" : "❌"}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={() => toggleDevice(device.id)}
                      className="ml-4"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {devices.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedDevices.length} of {devices.length} devices selected
              </p>
              <Button
                onClick={handleDeploy}
                disabled={deploying || selectedDevices.length === 0}
              >
                {deploying ? "Deploying..." : "Deploy Model"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Results */}
      {deploymentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Results</CardTitle>
          </CardHeader>
          <CardContent>
            {deploymentResults.map((result, index) => (
              <div key={index} className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{result.name}</h4>
                    <Badge
                      variant={
                        result.deploymentStatus === "deployed"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {result.deploymentStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {result.type}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Framework:</span>{" "}
                      {result.framework}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>{" "}
                      {result.size} MB
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accuracy:</span>{" "}
                      {(result.accuracy * 100).toFixed(1)}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">Latency:</span>{" "}
                      {result.latency}ms
                    </div>
                    <div>
                      <span className="text-muted-foreground">Power:</span>{" "}
                      {result.powerConsumption}W
                    </div>
                    <div>
                      <span className="text-muted-foreground">Devices:</span>{" "}
                      {result.targetDevices.length}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deployed:</span>{" "}
                      {new Date(result.deployedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
