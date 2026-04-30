/**
 * Edge AI Model Deployment UI Component
 *
 * Features:
 * - Model selection and deployment
 * - Device targeting
 * - Deployment status tracking
 * - Model performance monitoring
 *
 * Architecture: Deep layer integration with IoT Manager and Edge AI Processor
 */

"use client";

import { useState, useEffect } from "react";
import { iotManager } from "@/lib/services/iot/iotManager";
import { edgeProcessor } from "@/lib/services/ai/edgeProcessor";
import type { IoTDevice, IoTModelDeployment } from "@/types/iot";
import type { EdgeModel, EdgeNode } from "@/lib/services/ai/edgeProcessor";

interface DeploymentFormData {
  modelName: string;
  modelType:
    | "anomaly_detection"
    | "predictive_maintenance"
    | "optimization"
    | "classification";
  framework: "tensorflow_lite" | "onnx" | "openvino";
  targetDevices: string[];
  deploymentStrategy: "immediate" | "gradual" | "canary";
}

export default function EdgeAIDeployment() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [edgeNodes, setEdgeNodes] = useState<EdgeNode[]>([]);
  const [deployments, setDeployments] = useState<IoTModelDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DeploymentFormData>({
    modelName: "",
    modelType: "anomaly_detection",
    framework: "tensorflow_lite",
    targetDevices: [],
    deploymentStrategy: "gradual",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allDevices = await iotManager.getDevices();
      setDevices(allDevices.filter((d) => d.aiCapabilities?.modelDeployment));

      const nodes = await edgeProcessor.getEdgeNodes();
      setEdgeNodes(nodes);

      // Load existing deployments (would come from API)
      setDeployments([]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!formData.modelName || formData.targetDevices.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const model: EdgeModel = {
        id: `model-${Date.now()}`,
        name: formData.modelName,
        type: formData.modelType,
        framework: formData.framework,
        size: 10, // MB
        version: "1.0.0",
        accuracy: 0.95,
        latency: 50,
        requirements: {
          cpu: 2,
          memory: 512,
          storage: 100,
        },
      };

      // Deploy to edge nodes
      await edgeProcessor.deployModelToEdge(
        model,
        formData.targetDevices,
        formData.deploymentStrategy,
      );

      // Also deploy via IoT Manager
      const deployment = await iotManager.deployAIModel(
        model.id,
        formData.targetDevices,
        {
          name: formData.modelName,
          type: formData.modelType,
          framework: formData.framework,
          size: 10,
          requirements: {
            cpu: 2,
            memory: 512,
            storage: 100,
          },
        },
      );

      setDeployments([...deployments, deployment]);
      alert("Model deployed successfully!");

      // Reset form
      setFormData({
        modelName: "",
        modelType: "anomaly_detection",
        framework: "tensorflow_lite",
        targetDevices: [],
        deploymentStrategy: "gradual",
      });
    } catch (error) {
      console.error("Error deploying model:", error);
      alert("Failed to deploy model");
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = (deviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetDevices: prev.targetDevices.includes(deviceId)
        ? prev.targetDevices.filter((id) => id !== deviceId)
        : [...prev.targetDevices, deviceId],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edge AI Model Deployment</h1>

      {/* Deployment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Deploy New Model</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model Name</label>
            <input
              type="text"
              value={formData.modelName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, modelName: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter model name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Model Type</label>
            <select
              value={formData.modelType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  modelType: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="anomaly_detection">Anomaly Detection</option>
              <option value="predictive_maintenance">
                Predictive Maintenance
              </option>
              <option value="optimization">Optimization</option>
              <option value="classification">Classification</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Framework</label>
            <select
              value={formData.framework}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  framework: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="tensorflow_lite">TensorFlow Lite</option>
              <option value="onnx">ONNX</option>
              <option value="openvino">OpenVINO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Devices
            </label>
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              {devices.map((device) => (
                <label
                  key={device.id}
                  className="flex items-center space-x-2 py-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.targetDevices.includes(device.id)}
                    onChange={() => toggleDevice(device.id)}
                    className="rounded"
                  />
                  <span>
                    {device.name} ({device.type})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deployment Strategy
            </label>
            <select
              value={formData.deploymentStrategy}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deploymentStrategy: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="immediate">Immediate (All devices at once)</option>
              <option value="gradual">Gradual (Rolling deployment)</option>
              <option value="canary">Canary (Test on subset first)</option>
            </select>
          </div>

          <button
            onClick={handleDeploy}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Deploying..." : "Deploy Model"}
          </button>
        </div>
      </div>

      {/* Active Deployments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Deployments</h2>

        {deployments.length === 0 ? (
          <p className="text-gray-500">No active deployments</p>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.modelId} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{deployment.name}</h3>
                    <p className="text-sm text-gray-600">
                      Type: {deployment.type} | Framework:{" "}
                      {deployment.framework}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {deployment.deploymentStatus} | Devices:{" "}
                      {deployment.targetDevices.length}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      deployment.deploymentStatus === "deployed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {deployment.deploymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edge Nodes Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Edge Nodes</h2>

        {edgeNodes.length === 0 ? (
          <p className="text-gray-500">No edge nodes available</p>
        ) : (
          <div className="space-y-2">
            {edgeNodes.map((node) => (
              <div key={node.id} className="border rounded-md p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{node.name}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      node.status === "online"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Location: {node.location} | Models:{" "}
                  {node.deployedModels?.length || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
