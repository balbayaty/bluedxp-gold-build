"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import AIVisionOverlay from "@/components/warehouse/AIVisionOverlay";
import EmergencyResponseCenter from "@/components/warehouse/EmergencyResponseCenter";
import SustainabilityDashboard from "@/components/wms/SustainabilityDashboard";
import SmartInventoryManagement from "@/components/warehouse/SmartInventoryManagement";
import SecurityMonitoringSystem from "@/components/warehouse/SecurityMonitoringSystem";
import WarehouseLayoutVisualizer from "@/components/warehouse/WarehouseLayoutVisualizer";
import WarehouseAIAnalytics from "@/components/warehouse/WarehouseAIAnalytics";
import WarehouseQuickActions from "@/components/warehouse/WarehouseQuickActions";
import WarehouseExportOptions from "@/components/warehouse/WarehouseExportOptions";
import WarehouseAlerts from "@/components/warehouse/WarehouseAlerts";
import LiveOperationsDashboard from "@/components/warehouse/LiveOperationsDashboard";
import WarehouseNetworkView from "@/components/warehouse/WarehouseNetworkView";
import WarehouseLifecycleReporting from "@/components/warehouse/WarehouseLifecycleReporting";
import MobileWarehouseScanner from "@/components/warehouse/MobileWarehouseScanner";
import WarehouseProcessMiningView from "@/components/warehouse/WarehouseProcessMiningView";
import WarehouseDigitalTwinView from "@/components/warehouse/WarehouseDigitalTwinView";
import RoboticHubView from "@/components/warehouse/RoboticHubView";
import OrderStreamingView from "@/components/warehouse/OrderStreamingView";
import VoicePickingView from "@/components/warehouse/VoicePickingView";
import ERPConnectorsView from "@/components/warehouse/ERPConnectorsView";
import ResourceRebalancingView from "@/components/warehouse/ResourceRebalancingView";
import NetworkSimulationView from "@/components/warehouse/NetworkSimulationView";
import ContinuousLearningView from "@/components/warehouse/ContinuousLearningView";
import IndustryBenchmarkingView from "@/components/warehouse/IndustryBenchmarkingView";
import WarehouseKnowledgeBase from "@/components/warehouse/WarehouseKnowledgeBase";
import WarehouseCopilot from "@/components/warehouse/WarehouseCopilot";
import WarehouseEntityGraph from "@/components/warehouse/WarehouseEntityGraph";
import WarehouseDecisionSupport from "@/components/warehouse/WarehouseDecisionSupport";
import WarehouseTruthView from "@/components/warehouse/WarehouseTruthView";
import WarehouseFinancialView from "@/components/warehouse/WarehouseFinancialView";
import WarehouseWorkforceView from "@/components/warehouse/WarehouseWorkforceView";
import WarehouseSafetyView from "@/components/warehouse/WarehouseSafetyView";
import CrossModuleAnalyticsView from "@/components/warehouse/CrossModuleAnalyticsView";
import WarehouseImageVerification from "@/components/warehouse/WarehouseImageVerification";
import WarehouseWhatsAppIntegration from "@/components/warehouse/WarehouseWhatsAppIntegration";
import WarehouseBrandMessaging from "@/components/warehouse/WarehouseBrandMessaging";
import WarehouseQRIntegration from "@/components/warehouse/WarehouseQRIntegration";
import WarehouseWorkflowIntegration from "@/components/warehouse/WarehouseWorkflowIntegration";
import WarehouseFacilityManagement from "@/components/warehouse/WarehouseFacilityManagement";
import WarehouseErrorBoundary from "@/components/warehouse/ErrorBoundary";
import { Warehouse, IoTSensor } from "@/types/warehouse-management";

interface WarehouseDetailPageProps {}

const WarehouseDetailPage: React.FC<WarehouseDetailPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    loadWarehouseData();

    // Set up real-time IoT updates via polling (fallback)
    const interval = setInterval(() => {
      updateIoTData();
    }, 5000);

    // Try to connect to WebSocket for real-time updates
    if (typeof window !== "undefined") {
      try {
        const wsUrl =
          process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
          (window.location.protocol === "https:" ? "wss:" : "ws:") +
            "//" +
            window.location.host +
            "/api/realtime";

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          logger.info("WebSocket connected for warehouse updates", undefined, {
            module: "warehouse",
            service: "realtime",
            warehouseId,
          });
          setIsRealtimeConnected(true);

          // Subscribe to warehouse updates
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channel: `warehouse:${warehouseId}`,
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "warehouse_update" &&
              data.warehouseId === warehouseId
            ) {
              // Update warehouse data in real-time
              if (data.warehouse) {
                setWarehouse(data.warehouse);
              }
              if (data.sensors) {
                setSensors(data.sensors);
              }
            } else if (
              data.type === "sensor_update" &&
              data.warehouseId === warehouseId
            ) {
              // Update specific sensor
              setSensors((prev) =>
                prev.map((s) =>
                  s.id === data.sensor.id ? { ...s, ...data.sensor } : s,
                ),
              );
            }
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            logger.error("Error parsing WebSocket message", err, {
              module: "warehouse",
              service: "realtime",
              warehouseId,
            });
            errorTrackingService.captureException(err, {
              module: "warehouse",
              service: "realtime",
            });
          }
        };

        ws.onerror = (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error("WebSocket error", err, {
            module: "warehouse",
            service: "realtime",
            warehouseId,
          });
          errorTrackingService.captureException(err, {
            module: "warehouse",
            service: "realtime",
          });
          setIsRealtimeConnected(false);
        };

        ws.onclose = () => {
          logger.info("WebSocket disconnected", undefined, {
            module: "warehouse",
            service: "realtime",
            warehouseId,
          });
          setIsRealtimeConnected(false);
        };

        return () => {
          ws.close();
          clearInterval(interval);
        };
      } catch (error) {
        logger.warn(
          "WebSocket not available, using polling fallback",
          error instanceof Error ? error : new Error(String(error)),
          {
            module: "warehouse",
            service: "realtime",
            warehouseId,
          },
        );
        return () => clearInterval(interval);
      }
    }

    return () => clearInterval(interval);
  }, [warehouseId]);

  const loadWarehouseData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from API first
      const response = await fetch(`/api/warehouse/${warehouseId}`);
      if (response.ok) {
        const data = await response.json();
        setWarehouse(data.warehouse);
        setSensors(data.sensors || []);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading warehouse", err, {
        module: "warehouse",
        service: "detail",
        warehouseId,
      });
      errorTrackingService.captureException(err, {
        module: "warehouse",
        service: "detail",
      });
    }

    // Fallback to mock data
    const mockWarehouses: Warehouse[] = [
      {
        id: "wh-001",
        name: "Riyadh Central Distribution Center",
        location: {
          address: "King Fahd Industrial City",
          city: "Riyadh",
          country: "Saudi Arabia",
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        type: "main",
        status: "operational",
        capacity: {
          total: 50000,
          used: 42500,
          available: 7500,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: 23.2,
          humidity: 48,
          airQuality: 85,
          lighting: 92,
          noise: 45,
        },
        security: {
          cameras: 156,
          accessPoints: 24,
          alarms: 8,
          lastIncident: null,
        },
        iot: {
          sensors: 234,
          connectedDevices: 189,
          networkStatus: "excellent",
          dataPoints: 15600,
        },
        performance: {
          throughput: 94.5,
          accuracy: 99.7,
          efficiency: 91.2,
          uptime: 99.9,
        },
        staff: {
          total: 45,
          onDuty: 32,
          shift: "morning",
        },
      },
      {
        id: "wh-002",
        name: "Jeddah Port Facility",
        location: {
          address: "Islamic Port of Jeddah",
          city: "Jeddah",
          country: "Saudi Arabia",
          coordinates: { lat: 21.4858, lng: 39.1925 },
        },
        type: "distribution",
        status: "operational",
        capacity: {
          total: 35000,
          used: 28900,
          available: 6100,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: 28.7,
          humidity: 62,
          airQuality: 78,
          lighting: 88,
          noise: 52,
        },
        security: {
          cameras: 98,
          accessPoints: 18,
          alarms: 6,
          lastIncident: new Date("2024-01-10"),
        },
        iot: {
          sensors: 167,
          connectedDevices: 134,
          networkStatus: "good",
          dataPoints: 9800,
        },
        performance: {
          throughput: 87.3,
          accuracy: 98.9,
          efficiency: 86.7,
          uptime: 98.5,
        },
        staff: {
          total: 38,
          onDuty: 26,
          shift: "afternoon",
        },
      },
      {
        id: "wh-003",
        name: "Dammam Cold Storage",
        location: {
          address: "King Abdul Aziz Port",
          city: "Dammam",
          country: "Saudi Arabia",
          coordinates: { lat: 26.4207, lng: 50.0888 },
        },
        type: "cold_storage",
        status: "operational",
        capacity: {
          total: 15000,
          used: 12800,
          available: 2200,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: -18.5,
          humidity: 85,
          airQuality: 95,
          lighting: 85,
          noise: 38,
        },
        security: {
          cameras: 67,
          accessPoints: 12,
          alarms: 4,
          lastIncident: null,
        },
        iot: {
          sensors: 89,
          connectedDevices: 78,
          networkStatus: "excellent",
          dataPoints: 5340,
        },
        performance: {
          throughput: 92.1,
          accuracy: 99.9,
          efficiency: 88.9,
          uptime: 99.8,
        },
        staff: {
          total: 22,
          onDuty: 16,
          shift: "night",
        },
      },
      {
        id: "wh-004",
        name: "Jubail HAZMAT Facility",
        location: {
          address: "Jubail Industrial City",
          city: "Jubail",
          country: "Saudi Arabia",
          coordinates: { lat: 27.0174, lng: 49.6003 },
        },
        type: "hazmat",
        status: "maintenance",
        capacity: {
          total: 8000,
          used: 5400,
          available: 2600,
          unit: "m³",
        },
        zones: [],
        environmental: {
          temperature: 24.1,
          humidity: 42,
          airQuality: 92,
          lighting: 95,
          noise: 41,
        },
        security: {
          cameras: 45,
          accessPoints: 8,
          alarms: 12,
          lastIncident: new Date("2023-12-15"),
        },
        iot: {
          sensors: 156,
          connectedDevices: 145,
          networkStatus: "good",
          dataPoints: 8900,
        },
        performance: {
          throughput: 0,
          accuracy: 99.95,
          efficiency: 0,
          uptime: 85.2,
        },
        staff: {
          total: 28,
          onDuty: 8,
          shift: "morning",
        },
      },
    ];

    const foundWarehouse =
      mockWarehouses.find((w) => w.id === warehouseId) || mockWarehouses[0];
    setWarehouse(foundWarehouse);

    // Load sensors for this warehouse
    const mockSensors: IoTSensor[] = [
      {
        id: "sensor-001",
        warehouseId: foundWarehouse.id,
        zoneId: "zone-001",
        type: "temperature",
        name: "Temperature Sensor A1",
        value: foundWarehouse.environmental.temperature,
        unit: "°C",
        status: "online",
        lastReading: new Date(),
        batteryLevel: 87,
        threshold: { min: 18, max: 25 },
        alerts: false,
      },
      {
        id: "sensor-002",
        warehouseId: foundWarehouse.id,
        zoneId: "zone-001",
        type: "humidity",
        name: "Humidity Sensor A1",
        value: foundWarehouse.environmental.humidity,
        unit: "%",
        status: "online",
        lastReading: new Date(),
        batteryLevel: 92,
        threshold: { min: 30, max: 60 },
        alerts: false,
      },
      {
        id: "sensor-003",
        warehouseId: foundWarehouse.id,
        zoneId: "zone-001",
        type: "air_quality",
        name: "Air Quality Monitor A1",
        value: foundWarehouse.environmental.airQuality,
        unit: "AQI",
        status: "online",
        lastReading: new Date(),
        threshold: { min: 0, max: 100 },
        alerts: false,
      },
    ];
    setSensors(mockSensors.filter((s) => s.warehouseId === foundWarehouse.id));
    setIsLoading(false);
  };

  const updateIoTData = () => {
    if (!warehouse) return;

    setSensors((prev) =>
      prev.map((sensor) => ({
        ...sensor,
        value: sensor.value + (Math.random() - 0.5) * 2,
        lastReading: new Date(),
        batteryLevel: sensor.batteryLevel
          ? Math.max(0, sensor.batteryLevel - Math.random() * 0.1)
          : undefined,
      })),
    );

    setWarehouse((prev) =>
      prev
        ? {
            ...prev,
            environmental: {
              ...prev.environmental,
              temperature:
                prev.environmental.temperature + (Math.random() - 0.5) * 0.5,
              humidity: Math.max(
                0,
                Math.min(
                  100,
                  prev.environmental.humidity + (Math.random() - 0.5) * 2,
                ),
              ),
              airQuality: Math.max(
                0,
                Math.min(
                  100,
                  prev.environmental.airQuality + (Math.random() - 0.5) * 1,
                ),
              ),
            },
            iot: {
              ...prev.iot,
              dataPoints: prev.iot.dataPoints + Math.floor(Math.random() * 50),
            },
          }
        : null,
    );
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    updateIoTData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "maintenance":
      case "calibrating":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "offline":
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "emergency":
        return "bg-red-600/20 text-red-500 border-red-600/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-blue-400";
      case "poor":
        return "text-yellow-400";
      case "disconnected":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <WarehouseErrorBoundary>
        <PageTemplate
          title="Loading Warehouse..."
          description="Please wait while we load warehouse details"
          icon="ri-building-line"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
              <p className="text-white text-lg">
                Loading warehouse information...
              </p>
            </div>
          </div>
        </PageTemplate>
      </WarehouseErrorBoundary>
    );
  }

  if (!warehouse) {
    return (
      <WarehouseErrorBoundary>
        <PageTemplate
          title="Warehouse Not Found"
          description="The requested warehouse could not be found"
          icon="ri-building-line"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
              <p className="text-white text-lg mb-4">Warehouse not found</p>
              <button
                onClick={() => router.push("/warehouses")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Warehouses
              </button>
            </div>
          </div>
        </PageTemplate>
      </WarehouseErrorBoundary>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: "ri-focus-3-line" },
    { id: "layout", name: "Layout & Map", icon: "ri-map-2-line" },
    { id: "operations", name: "Operations", icon: "ri-settings-3-line" },
    { id: "network", name: "Network", icon: "ri-networks-line" },
    { id: "inventory", name: "Inventory", icon: "ri-box-3-line" },
    { id: "iot", name: "IoT & Sensors", icon: "ri-wifi-line" },
    { id: "security", name: "Security", icon: "ri-shield-check-line" },
    { id: "analytics", name: "AI Analytics", icon: "ri-bar-chart-line" },
    {
      id: "lifecycle",
      name: "Lifecycle & Reports",
      icon: "ri-file-chart-line",
    },
    {
      id: "process-mining",
      name: "Process Mining",
      icon: "ri-flow-chart-line",
    },
    { id: "digital-twin", name: "Digital Twin", icon: "ri-3d-view" },
    { id: "mobile", name: "Mobile Scanner", icon: "ri-qr-scan-2-line" },
    { id: "robotic-hub", name: "Robotic Hub", icon: "ri-robot-line" },
    {
      id: "order-streaming",
      name: "Order Streaming",
      icon: "ri-send-plane-line",
    },
    { id: "voice-picking", name: "Voice Picking", icon: "ri-mic-line" },
    {
      id: "resource-rebalancing",
      name: "Resource Rebalancing",
      icon: "ri-refresh-line",
    },
    {
      id: "network-simulation",
      name: "Network Simulation",
      icon: "ri-simulator-line",
    },
    {
      id: "continuous-learning",
      name: "Continuous Learning",
      icon: "ri-brain-line",
    },
    {
      id: "benchmarking",
      name: "Industry Benchmarking",
      icon: "ri-trophy-line",
    },
    { id: "erp-connectors", name: "ERP Connectors", icon: "ri-plug-line" },
    { id: "knowledge", name: "Knowledge Base", icon: "ri-book-open-line" },
    { id: "copilot", name: "AI Assistant", icon: "ri-robot-line" },
    { id: "entity-graph", name: "Entity Graph", icon: "ri-node-tree" },
    { id: "decisions", name: "Decision Support", icon: "ri-lightbulb-line" },
    { id: "truth", name: "Truth Engine", icon: "ri-shield-check-line" },
    { id: "finance", name: "Finance", icon: "ri-money-dollar-circle-line" },
    { id: "workforce", name: "Workforce", icon: "ri-team-line" },
    { id: "safety", name: "Safety & QHSE", icon: "ri-shield-star-line" },
    {
      id: "cross-analytics",
      name: "Cross-Module Analytics",
      icon: "ri-bar-chart-box-line",
    },
    {
      id: "image-verification",
      name: "Image Verification",
      icon: "ri-image-line",
    },
    { id: "whatsapp", name: "WhatsApp", icon: "ri-whatsapp-line" },
    {
      id: "brand-messaging",
      name: "Brand Messaging",
      icon: "ri-message-2-line",
    },
    { id: "qr-services", name: "QR Services", icon: "ri-qr-code-line" },
    { id: "workflow", name: "Workflows", icon: "ri-flow-chart-line" },
    { id: "facility", name: "Facility Management", icon: "ri-building-line" },
    { id: "integration", name: "TMS & Compliance", icon: "ri-links-line" },
    { id: "sustainability", name: "Sustainability", icon: "ri-leaf-line" },
    { id: "vision", name: "AI Vision", icon: "ri-eye-line" },
    { id: "emergency", name: "Emergency", icon: "ri-alert-line" },
  ];

  const stats = [
    {
      label: "Status",
      value: warehouse.status,
      icon: "ri-checkbox-circle-line",
      tooltip: "Warehouse operational status",
      trend:
        warehouse.status === "operational"
          ? ("up" as const)
          : ("neutral" as const),
    },
    {
      label: "Capacity Used",
      value: `${((warehouse.capacity.used / warehouse.capacity.total) * 100).toFixed(1)}%`,
      icon: "ri-layout-grid-line",
      tooltip: "Storage capacity utilization",
      trend: "neutral" as const,
    },
    {
      label: "IoT Sensors",
      value: warehouse.iot.sensors,
      icon: "ri-wifi-line",
      tooltip: "Connected IoT sensors",
      trend: "up" as const,
    },
    {
      label: "Uptime",
      value: `${warehouse.performance.uptime.toFixed(1)}%`,
      icon: "ri-time-line",
      tooltip: "System uptime percentage",
      trend: "up" as const,
    },
  ];

  if (!warehouse) {
    return (
      <PageTemplate
        title="Warehouse Not Found"
        description="The requested warehouse could not be found"
        icon="ri-building-line"
      >
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <i className="ri-error-warning-line text-6xl text-gray-500"></i>
          <p className="text-gray-400">Warehouse not found</p>
          <button
            onClick={() => router.push("/warehouses")}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
          >
            Back to Warehouses
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <WarehouseErrorBoundary>
      <PageTemplate
        title={warehouse.name}
        description={`${warehouse.location.city}, ${warehouse.location.country} • ${warehouse.type.replace("_", " ")}`}
        icon="ri-building-line"
        systemInfo={{
          sap: "Warehouse Management, Warehouse Master",
          oracle: "Warehouse Administration, Facility Management",
          manhattan: "Warehouse Management, Multi-Warehouse",
        }}
        examples={[
          "Real-time warehouse monitoring",
          "IoT sensor integration",
          "Advanced analytics",
          "Security and access control",
          "AI-powered insights",
        ]}
        stats={stats}
        actions={
          <div className="flex items-center gap-2">
            <WarehouseExportOptions
              warehouseId={warehouse.id}
              warehouseName={warehouse.name}
            />
            <button
              onClick={() => router.push("/warehouses")}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30"
            >
              <i className="ri-arrow-left-line mr-1"></i>
              Back
            </button>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRefreshing
                  ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRefreshing ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1"></i>
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="ri-refresh-line mr-1"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        }
      >
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-white/10">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    selectedTab === tab.id
                      ? "border-green-500 text-green-400"
                      : "border-transparent text-[#9ca3af] hover:text-white hover:border-white/30"
                  }
                `}
                >
                  <i className={`${tab.icon} w-4 h-4`}></i>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {selectedTab === "overview" && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <i className="ri-flashlight-line mr-2 text-yellow-400"></i>
                    Quick Actions
                  </h3>
                  <WarehouseQuickActions warehouseId={warehouse.id} />
                </motion.div>

                {/* Alerts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <WarehouseAlerts warehouseId={warehouse.id} />
                </motion.div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Capacity</p>
                        <p className="text-2xl font-bold text-white">
                          {(
                            (warehouse.capacity.used /
                              warehouse.capacity.total) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <i className="ri-box-3-line w-8 h-8 text-blue-400"></i>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          warehouse.capacity.used / warehouse.capacity.total >
                          0.9
                            ? "bg-red-400"
                            : warehouse.capacity.used /
                                  warehouse.capacity.total >
                                0.8
                              ? "bg-yellow-400"
                              : "bg-green-400"
                        }`}
                        style={{
                          width: `${(warehouse.capacity.used / warehouse.capacity.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-2">
                      {warehouse.capacity.used.toLocaleString()} /{" "}
                      {warehouse.capacity.total.toLocaleString()}{" "}
                      {warehouse.capacity.unit}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Performance</p>
                        <p className="text-2xl font-bold text-white">
                          {warehouse.performance.efficiency.toFixed(1)}%
                        </p>
                      </div>
                      <i className="ri-speed-up-line w-8 h-8 text-green-400"></i>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#9ca3af]">Throughput</span>
                        <span className="text-white">
                          {warehouse.performance.throughput.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9ca3af]">Accuracy</span>
                        <span className="text-white">
                          {warehouse.performance.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Staff</p>
                        <p className="text-2xl font-bold text-white">
                          {warehouse.staff.onDuty}/{warehouse.staff.total}
                        </p>
                      </div>
                      <i className="ri-user-line w-8 h-8 text-orange-400"></i>
                    </div>
                    <p className="text-xs text-[#9ca3af]">
                      {warehouse.staff.shift} shift
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#9ca3af]">IoT Network</p>
                        <p className="text-2xl font-bold text-white capitalize">
                          {warehouse.iot.networkStatus}
                        </p>
                      </div>
                      <i
                        className={`ri-wifi-line w-8 h-8 ${getNetworkStatusColor(warehouse.iot.networkStatus)}`}
                      ></i>
                    </div>
                    <p className="text-xs text-[#9ca3af]">
                      {warehouse.iot.connectedDevices} devices connected
                    </p>
                  </motion.div>
                </div>

                {/* Environmental Conditions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <i className="ri-temp-cold-line mr-2 text-blue-400"></i>
                      Environmental Conditions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#9ca3af] mb-1">
                          Temperature
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {warehouse.environmental.temperature.toFixed(1)}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#9ca3af] mb-1">Humidity</p>
                        <p className="text-2xl font-bold text-white">
                          {warehouse.environmental.humidity.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#9ca3af] mb-1">
                          Air Quality
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {warehouse.environmental.airQuality.toFixed(0)} AQI
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#9ca3af] mb-1">Lighting</p>
                        <p className="text-2xl font-bold text-white">
                          {warehouse.environmental.lighting.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <i className="ri-shield-check-line mr-2 text-green-400"></i>
                      Security Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Security Cameras
                        </span>
                        <span className="text-white font-medium">
                          {warehouse.security.cameras}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Access Points
                        </span>
                        <span className="text-white font-medium">
                          {warehouse.security.accessPoints}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Alarm Systems
                        </span>
                        <span className="text-white font-medium">
                          {warehouse.security.alarms}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Last Incident
                        </span>
                        <span className="text-white font-medium">
                          {warehouse.security.lastIncident
                            ? new Date(
                                warehouse.security.lastIncident,
                              ).toLocaleDateString()
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Location & Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <i className="ri-map-pin-line mr-2 text-red-400"></i>
                    Location & Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-1">Address</p>
                      <p className="text-white">{warehouse.location.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-1">City</p>
                      <p className="text-white">{warehouse.location.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-1">Country</p>
                      <p className="text-white">{warehouse.location.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-1">Coordinates</p>
                      <p className="text-white">
                        {warehouse.location.coordinates.lat.toFixed(4)},{" "}
                        {warehouse.location.coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {selectedTab === "layout" && warehouse && (
              <div className="space-y-6">
                <WarehouseLayoutVisualizer
                  warehouse={warehouse}
                  viewMode="2d"
                  onZoneClick={(zone) =>
                    router.push(`/warehouses/${warehouseId}/zones/${zone.id}`)
                  }
                />
              </div>
            )}

            {selectedTab === "inventory" && (
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                <SmartInventoryManagement />
              </div>
            )}

            {selectedTab === "iot" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Total Sensors</p>
                        <p className="text-2xl font-bold text-white">
                          {sensors.length}
                        </p>
                      </div>
                      <i className="ri-cpu-line w-8 h-8 text-blue-400"></i>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Data Points</p>
                        <p className="text-2xl font-bold text-white">
                          {(warehouse.iot.dataPoints / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <i className="ri-database-2-line w-8 h-8 text-green-400"></i>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Online Sensors</p>
                        <p className="text-2xl font-bold text-white">
                          {sensors.filter((s) => s.status === "online").length}
                        </p>
                      </div>
                      <i className="ri-checkbox-circle-line w-8 h-8 text-green-400"></i>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#9ca3af]">Avg Battery</p>
                        <p className="text-2xl font-bold text-white">
                          {Math.round(
                            sensors
                              .filter((s) => s.batteryLevel)
                              .reduce(
                                (sum, s) => sum + (s.batteryLevel || 0),
                                0,
                              ) /
                              sensors.filter((s) => s.batteryLevel).length || 0,
                          )}
                          %
                        </p>
                      </div>
                      <i className="ri-flashlight-line w-8 h-8 text-purple-400"></i>
                    </div>
                  </motion.div>
                </div>

                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Real-time Sensor Data
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isRealtimeConnected && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Live</span>
                        </div>
                      )}
                      <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
                      >
                        {isRefreshing ? (
                          <>
                            <i className="ri-loader-4-line animate-spin"></i>
                            <span>Refreshing...</span>
                          </>
                        ) : (
                          <>
                            <i className="ri-refresh-line"></i>
                            <span>Refresh</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sensors.map((sensor) => (
                      <motion.div
                        key={sensor.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:border-cyan-500/50 hover:bg-white/10 transition-all group"
                        onClick={() =>
                          router.push(
                            `/warehouses/${warehouseId}/sensors/${sensor.id}`,
                          )
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`p-2 rounded ${
                              sensor.type === "temperature"
                                ? "bg-red-500/20 text-red-400"
                                : sensor.type === "humidity"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : sensor.type === "air_quality"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            <i
                              className={`ri-${sensor.type === "temperature" ? "temp-cold" : sensor.type === "humidity" ? "water-percent" : "eye"}-line w-4 h-4`}
                            ></i>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs border ${getStatusColor(sensor.status)}`}
                          >
                            {sensor.status}
                          </span>
                        </div>

                        <h4 className="font-medium text-sm mb-2 text-white">
                          {sensor.name}
                        </h4>

                        <div className="flex items-baseline space-x-2 mb-2">
                          <span className="text-xl font-bold text-white">
                            {sensor.value.toFixed(1)}
                          </span>
                          <span className="text-sm text-[#9ca3af]">
                            {sensor.unit}
                          </span>
                        </div>

                        {sensor.batteryLevel && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#9ca3af]">Battery</span>
                              <span className="text-white">
                                {Math.round(sensor.batteryLevel)}%
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  sensor.batteryLevel > 50
                                    ? "bg-green-400"
                                    : sensor.batteryLevel > 20
                                      ? "bg-yellow-400"
                                      : "bg-red-400"
                                }`}
                                style={{ width: `${sensor.batteryLevel}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                          <span className="text-xs text-[#6b7280]">
                            Updated: {sensor.lastReading.toLocaleTimeString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/warehouses/${warehouseId}/sensors/${sensor.id}`,
                              );
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 flex items-center space-x-1"
                          >
                            <span>View Details</span>
                            <i className="ri-arrow-right-line"></i>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "security" && (
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                <SecurityMonitoringSystem />
              </div>
            )}

            {selectedTab === "operations" && warehouse && (
              <div className="space-y-6">
                {/* Live Operations Dashboard */}
                <LiveOperationsDashboard warehouseId={warehouse.id} />

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all group"
                    onClick={() => router.push("/inbound")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                        <i className="ri-inbox-line text-2xl"></i>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Inbound Operations
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      Manage receiving, ASN, goods receipt, and putaway
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">Today</span>
                        <p className="text-white font-medium">12 Receipts</p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Pending</span>
                        <p className="text-white font-medium">3 ASNs</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all group"
                    onClick={() => router.push("/outbound")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                        <i className="ri-ship-line text-2xl"></i>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Outbound Operations
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      Manage shipping, picking, wave planning, and POD
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">Today</span>
                        <p className="text-white font-medium">28 Shipments</p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Pending</span>
                        <p className="text-white font-medium">5 Waves</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all group"
                    onClick={() => router.push("/task-management")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                        <i className="ri-task-line text-2xl"></i>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Task Management
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      Monitor and manage warehouse tasks and assignments
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">Active</span>
                        <p className="text-white font-medium">15 Tasks</p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Completed</span>
                        <p className="text-white font-medium">42 Today</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all group"
                    onClick={() => router.push("/picking")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-orange-500/20 text-orange-400">
                        <i className="ri-handbag-line text-2xl"></i>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Picking Operations
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      Optimize pick paths and manage picking tasks
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">In Progress</span>
                        <p className="text-white font-medium">8 Picks</p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Efficiency</span>
                        <p className="text-green-400 font-medium">94.2%</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all group"
                    onClick={() => router.push("/putaway")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <i className="ri-stack-line text-2xl"></i>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Putaway Operations
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      AI-optimized putaway with space utilization
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">Pending</span>
                        <p className="text-white font-medium">6 Putaways</p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Space Used</span>
                        <p className="text-white font-medium">85%</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all group"
                    onClick={() => router.push("/cycle-counting")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-400">
                        <i className="ri-file-list-3-line text-2xl"></i>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Cycle Counting
                    </h3>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      Real-time inventory accuracy and cycle counts
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">Accuracy</span>
                        <p className="text-white font-medium">
                          {warehouse.performance.accuracy.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Scheduled</span>
                        <p className="text-white font-medium">3 Today</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Operations Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <i className="ri-dashboard-line mr-2 text-cyan-400"></i>
                    Operations Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-[#9ca3af] mb-1">Throughput</p>
                      <p className="text-2xl font-bold text-white">
                        {warehouse.performance.throughput.toFixed(1)}%
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        ↑ 2.3% vs last week
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-[#9ca3af] mb-1">Efficiency</p>
                      <p className="text-2xl font-bold text-white">
                        {warehouse.performance.efficiency.toFixed(1)}%
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        ↑ 1.8% vs last week
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-[#9ca3af] mb-1">
                        Orders Today
                      </p>
                      <p className="text-2xl font-bold text-white">156</p>
                      <p className="text-xs text-blue-400 mt-1">12 pending</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-[#9ca3af] mb-1">
                        Tasks Active
                      </p>
                      <p className="text-2xl font-bold text-white">23</p>
                      <p className="text-xs text-purple-400 mt-1">
                        8 high priority
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {selectedTab === "analytics" && warehouse && (
              <div className="space-y-6">
                <WarehouseAIAnalytics warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "lifecycle" && warehouse && (
              <div className="space-y-6">
                <WarehouseLifecycleReporting warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "integration" && warehouse && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <i className="ri-truck-line mr-2 text-blue-400"></i>
                      Transportation (TMS) Integration
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#9ca3af]">
                            Active Shipments
                          </span>
                          <span className="text-white font-bold">12</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#9ca3af]">
                            Pending Pickups
                          </span>
                          <span className="text-white font-bold">5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#9ca3af]">
                            Carrier Performance
                          </span>
                          <span className="text-green-400 font-medium">
                            94.2%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push("/tracking")}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <i className="ri-external-link-line"></i>
                        <span>View TMS Dashboard</span>
                      </button>
                      <button
                        onClick={() => router.push("/routes")}
                        className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <i className="ri-route-line"></i>
                        <span>Route Optimization</span>
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <i className="ri-shield-check-line mr-2 text-green-400"></i>
                      Compliance Integration
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#9ca3af]">
                            Compliance Score
                          </span>
                          <span className="text-green-400 font-bold">
                            98.5%
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#9ca3af]">
                            Active Certifications
                          </span>
                          <span className="text-white font-bold">8</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#9ca3af]">
                            Pending Reviews
                          </span>
                          <span className="text-yellow-400 font-medium">2</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push("/compliance")}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <i className="ri-external-link-line"></i>
                        <span>View Compliance Dashboard</span>
                      </button>
                      <button
                        onClick={() => router.push("/trade-compliance")}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <i className="ri-file-shield-line"></i>
                        <span>Trade Compliance</span>
                      </button>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <i className="ri-link-m mr-2 text-cyan-400"></i>
                    Cross-Module Data Flow
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="ri-warehouse-line text-blue-400"></i>
                        <span className="text-white font-medium">WMS</span>
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        Inventory levels, capacity, and operations data shared
                        with TMS and Compliance modules
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="ri-truck-line text-green-400"></i>
                        <span className="text-white font-medium">TMS</span>
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        Shipment tracking, route optimization, and carrier
                        performance integrated with warehouse operations
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="ri-shield-check-line text-purple-400"></i>
                        <span className="text-white font-medium">
                          Compliance
                        </span>
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        Regulatory compliance, certifications, and approvals
                        linked to warehouse and transportation operations
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {selectedTab === "sustainability" && (
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                <SustainabilityDashboard
                  warehouseId={warehouse.id}
                  warehouseName={warehouse.name}
                />
              </div>
            )}

            {selectedTab === "vision" && <AIVisionOverlay />}

            {selectedTab === "emergency" && <EmergencyResponseCenter />}

            {selectedTab === "process-mining" && warehouse && (
              <div className="space-y-6">
                <WarehouseProcessMiningView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "digital-twin" && warehouse && (
              <div className="space-y-6">
                <WarehouseDigitalTwinView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "mobile" && warehouse && (
              <div className="space-y-6">
                <MobileWarehouseScanner warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "robotic-hub" && warehouse && (
              <div className="space-y-6">
                <RoboticHubView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "order-streaming" && warehouse && (
              <div className="space-y-6">
                <OrderStreamingView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "voice-picking" && warehouse && (
              <div className="space-y-6">
                <VoicePickingView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "resource-rebalancing" && warehouse && (
              <div className="space-y-6">
                <ResourceRebalancingView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "network-simulation" && warehouse && (
              <div className="space-y-6">
                <NetworkSimulationView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "continuous-learning" && warehouse && (
              <div className="space-y-6">
                <ContinuousLearningView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "benchmarking" && warehouse && (
              <div className="space-y-6">
                <IndustryBenchmarkingView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "erp-connectors" && warehouse && (
              <div className="space-y-6">
                <ERPConnectorsView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "knowledge" && warehouse && (
              <div className="space-y-6">
                <WarehouseKnowledgeBase warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "copilot" && warehouse && (
              <div className="space-y-6">
                <WarehouseCopilot warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "entity-graph" && warehouse && (
              <div className="space-y-6">
                <WarehouseEntityGraph warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "decisions" && warehouse && (
              <div className="space-y-6">
                <WarehouseDecisionSupport warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "truth" && warehouse && (
              <div className="space-y-6">
                <WarehouseTruthView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "finance" && warehouse && (
              <div className="space-y-6">
                <WarehouseFinancialView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "workforce" && warehouse && (
              <div className="space-y-6">
                <WarehouseWorkforceView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "safety" && warehouse && (
              <div className="space-y-6">
                <WarehouseSafetyView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "cross-analytics" && warehouse && (
              <div className="space-y-6">
                <CrossModuleAnalyticsView warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "image-verification" && warehouse && (
              <div className="space-y-6">
                <WarehouseImageVerification warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "whatsapp" && warehouse && (
              <div className="space-y-6">
                <WarehouseWhatsAppIntegration warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "brand-messaging" && warehouse && (
              <div className="space-y-6">
                <WarehouseBrandMessaging warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "qr-services" && warehouse && (
              <div className="space-y-6">
                <WarehouseQRIntegration warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "workflow" && warehouse && (
              <div className="space-y-6">
                <WarehouseWorkflowIntegration warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "facility" && warehouse && (
              <div className="space-y-6">
                <WarehouseFacilityManagement warehouseId={warehouse.id} />
              </div>
            )}

            {selectedTab === "network" && warehouse && (
              <div className="space-y-6">
                <WarehouseNetworkView warehouseId={warehouse.id} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </PageTemplate>
    </WarehouseErrorBoundary>
  );
};

export default WarehouseDetailPage;
