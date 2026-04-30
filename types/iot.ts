/**
 * IoT Device Management Types
 * Comprehensive type definitions for IoT device management system
 * Source: Adapted from chemcheck-analysis/lib/iot/advanced-iot-manager.ts
 */

export type IoTDeviceType = 'sensor' | 'camera' | 'actuator' | 'gateway' | 'edge_compute';
export type IoTConnectivityProtocol = 'wifi' | 'ethernet' | 'lora' | 'zigbee' | 'bluetooth' | '5g' | 'satellite';
export type IoTPowerSource = 'mains' | 'battery' | 'solar' | 'fuel_cell';
export type IoTDeviceStatusType = 'online' | 'offline' | 'maintenance' | 'error' | 'degraded';
export type IoTSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IoTAlertType = 
  | 'threshold_exceeded' 
  | 'device_offline' 
  | 'battery_low' 
  | 'security_breach' 
  | 'calibration_due' 
  | 'maintenance_due';
export type IoTActionType = 'notify' | 'actuate' | 'log' | 'escalate' | 'shutdown';
export type IoTMaintenanceType = 'preventive' | 'corrective' | 'emergency';
export type IoTModelFramework = 'tensorflow_lite' | 'onnx' | 'openvino';
export type IoTModelType = 'anomaly_detection' | 'predictive_maintenance' | 'optimization' | 'classification';
export type IoTOptimizationType = 'protocol_switch' | 'load_balancing' | 'routing_optimization' | 'frequency_tuning';
export type IoTTrendDirection = 'increasing' | 'decreasing' | 'stable';
export type IoTThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IoTDeviceLocation {
  facility: string;
  zone: string;
  coordinates: { lat: number; lng: number; elevation?: number };
  floor?: number;
  room?: string;
  warehouseId?: string;
  customerId?: string;
}

export interface IoTDeviceConnectivity {
  protocol: IoTConnectivityProtocol;
  networkId: string;
  signalStrength: number; // dBm
  bandwidth: number; // Mbps
  latency: number; // ms
  lastConnected?: Date;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface IoTDevicePower {
  source: IoTPowerSource;
  batteryLevel?: number; // 0-100%
  powerConsumption: number; // watts
  estimatedLife?: number; // hours
  lastCharged?: Date;
  chargingStatus?: 'charging' | 'discharging' | 'full' | 'low';
}

export interface IoTDeviceSpecifications {
  range?: { min: number; max: number; unit: string };
  accuracy?: number; // percentage
  resolution?: number;
  samplingRate?: number; // Hz
  operatingTemperature?: { min: number; max: number };
  enclosureRating?: string; // IP67, etc.
  dataFormat?: string;
  supportedProtocols?: IoTConnectivityProtocol[];
}

export interface IoTDeviceCalibration {
  lastCalibrated: Date;
  nextCalibration: Date;
  calibrationHistory: Array<{
    date: Date;
    technician: string;
    results: any;
    status: 'passed' | 'failed' | 'adjusted';
    certificate?: string;
  }>;
  calibrationInterval?: number; // days
  isCalibrated?: boolean;
}

export interface IoTDeviceMaintenance {
  lastMaintenance: Date;
  nextMaintenance: Date;
  maintenanceHistory: Array<{
    date: Date;
    type: IoTMaintenanceType;
    technician: string;
    description: string;
    cost: number;
    parts?: string[];
    warranty?: { start: Date; end: Date };
  }>;
  maintenanceInterval?: number; // days
  totalMaintenanceCost?: number;
}

export interface IoTDeviceStatus {
  operational: 'online' | 'offline' | 'maintenance' | 'error' | 'degraded';
  health: number; // 0-100%
  lastSeen: Date;
  uptime: number; // percentage
  errors: Array<{
    timestamp: Date;
    code: string;
    message: string;
    severity: IoTSeverity;
    resolved?: boolean;
    resolvedAt?: Date;
  }>;
  performance?: {
    responseTime?: number; // ms
    throughput?: number; // data points per second
    reliability?: number; // percentage
  };
}

export interface IoTDeviceSecurity {
  encrypted: boolean;
  authenticated: boolean;
  certificateExpiry?: Date;
  lastSecurityScan: Date;
  vulnerabilities: Array<{
    id: string;
    severity: IoTSeverity;
    description: string;
    discovered: Date;
    patched?: Date;
    cveId?: string;
  }>;
  securityScore?: number; // 0-100
  complianceStatus?: 'compliant' | 'non_compliant' | 'pending';
}

export interface IoTDeviceAICapabilities {
  edgeProcessing: boolean;
  modelDeployment: boolean;
  autonomousOperation: boolean;
  predictiveAnalytics: boolean;
  deployedModels?: string[];
  edgeComputeResources?: {
    cpu: number;
    memory: number; // MB
    storage: number; // MB
  };
}

export interface IoTDevice {
  id: string;
  name: string;
  type: IoTDeviceType;
  category: string; // temperature, humidity, gas, vibration, etc.
  manufacturer: string;
  model: string;
  serialNumber?: string;
  firmwareVersion: string;
  location: IoTDeviceLocation;
  connectivity: IoTDeviceConnectivity;
  power: IoTDevicePower;
  specifications: IoTDeviceSpecifications;
  calibration: IoTDeviceCalibration;
  maintenance: IoTDeviceMaintenance;
  status: IoTDeviceStatus;
  security: IoTDeviceSecurity;
  aiCapabilities?: IoTDeviceAICapabilities;
  tags: string[];
  metadata: { [key: string]: any };
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface IoTDeviceGroup {
  id: string;
  name: string;
  description: string;
  devices: string[]; // device IDs
  location?: string;
  purpose: string;
  rules: IoTAutomationRule[];
  aggregationRules: IoTDataAggregation[];
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IoTAutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggers: Array<{
    deviceId: string;
    condition: string; // JavaScript expression
    threshold?: number;
    operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
  }>;
  actions: Array<{
    type: IoTActionType;
    target: string;
    parameters: any;
    delay?: number; // seconds
  }>;
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  priority: IoTSeverity;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IoTDataAggregation {
  id: string;
  sourceDevices: string[];
  function: 'avg' | 'sum' | 'max' | 'min' | 'median' | 'custom';
  windowSize: number; // seconds
  outputDevice?: string;
  storageLocation: string;
  tenantId?: string;
}

export interface IoTAlert {
  id: string;
  deviceId: string;
  type: IoTAlertType;
  severity: IoTSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actions: Array<{
    type: string;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    executedAt?: Date;
  }>;
  metadata?: { [key: string]: any };
  tenantId?: string;
}

export interface IoTAnalytics {
  deviceId: string;
  timeRange: { start: Date; end: Date };
  metrics: {
    availability: number; // percentage
    reliability: number; // percentage
    performance: number; // percentage
    efficiency: number; // percentage
  };
  trends: Array<{
    metric: string;
    direction: IoTTrendDirection;
    rate: number; // units per day
    confidence: number; // 0-1
  }>;
  anomalies: Array<{
    timestamp: Date;
    metric: string;
    value: number;
    expectedValue: number;
    severity: IoTSeverity;
    explanation: string;
  }>;
  predictions: Array<{
    metric: string;
    timeHorizon: number; // hours
    predictedValue: number;
    confidence: number; // 0-1
    scenario: 'best' | 'expected' | 'worst';
  }>;
}

export interface IoTMaintenanceRecommendation {
  deviceId: string;
  type: 'calibration' | 'cleaning' | 'replacement' | 'repair';
  urgency: IoTSeverity;
  description: string;
  estimatedCost: number;
  scheduledDate: Date;
  predictedFailureDate?: Date;
  costSavings?: number;
  riskReduction?: number;
}

export interface IoTNetworkOptimization {
  optimizations: Array<{
    type: IoTOptimizationType;
    description: string;
    expectedImprovement: number; // percentage
    devices: string[];
  }>;
  networkHealth: number; // 0-100
  latencyReduction: number; // ms
  throughputIncrease: number; // percentage
}

export interface IoTModelDeployment {
  modelId: string;
  name: string;
  type: IoTModelType;
  framework: IoTModelFramework;
  size: number; // MB
  requirements: {
    cpu: number;
    memory: number; // MB
    storage: number; // MB
  };
  targetDevices: string[];
  deploymentStatus: 'pending' | 'deploying' | 'deployed' | 'failed';
  deployedAt?: Date;
  accuracy?: number;
  latency?: number; // ms
  powerConsumption?: number; // watts
}

export interface IoTDeviceDiscoveryResult {
  devices: IoTDevice[];
  totalDiscovered: number;
  validated: number;
  failed: number;
  scanDuration: number; // ms
  networks: string[];
  protocols: IoTConnectivityProtocol[];
}

export interface IoTComprehensiveAnalytics {
  overview: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    averageHealth: number;
    totalAlerts: number;
    criticalAlerts: number;
  };
  performance: {
    averageUptime: number;
    networkLatency: number;
    dataTransmission: number;
    powerEfficiency: number;
  };
  maintenance: {
    devicesNeedingMaintenance: number;
    averageMaintenanceCost: number;
    predictedFailures: number;
    maintenanceEfficiency: number;
  };
  security: {
    vulnerableDevices: number;
    securityScore: number;
    lastSecurityScan: Date;
    threatLevel: IoTThreatLevel;
  };
  trends: Array<{
    metric: string;
    trend: IoTTrendDirection;
    changeRate: number;
  }>;
}

