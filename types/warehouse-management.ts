/**
 * Warehouse Management Types
 * Comprehensive types for warehouse management with IoT integration
 * Migrated from chemcheck-analysis to BlueDXP
 */

export interface Warehouse {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  type: 'main' | 'distribution' | 'cold_storage' | 'hazmat' | 'raw_materials';
  status: 'operational' | 'maintenance' | 'offline' | 'emergency';
  capacity: {
    total: number;
    used: number;
    available: number;
    unit: string;
  };
  zones: WarehouseZone[];
  environmental: {
    temperature: number;
    humidity: number;
    airQuality: number;
    lighting: number;
    noise: number;
  };
  security: {
    cameras: number;
    accessPoints: number;
    alarms: number;
    lastIncident: Date | null;
  };
  iot: {
    sensors: number;
    connectedDevices: number;
    networkStatus: 'excellent' | 'good' | 'poor' | 'disconnected';
    dataPoints: number;
  };
  performance: {
    throughput: number;
    accuracy: number;
    efficiency: number;
    uptime: number;
  };
  staff: {
    total: number;
    onDuty: number;
    shift: 'morning' | 'afternoon' | 'night';
  };
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: 'storage' | 'loading' | 'quality_control' | 'staging' | 'office';
  area: number; // square meters
  capacity: number;
  utilization: number;
  temperature: number;
  humidity: number;
  hazardLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  restrictions: string[];
  equipment: Equipment[];
  inventory: InventoryItem[];
}

export interface Equipment {
  id: string;
  name: string;
  type: 'forklift' | 'scanner' | 'conveyor' | 'crane' | 'robot' | 'hvac' | 'safety';
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  battery?: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
  efficiency: number;
  location: { x: number; y: number; z?: number };
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  hazardClass?: string;
  temperature?: number;
  expiryDate?: Date;
  lastMoved: Date;
  value: number;
  supplier: string;
}

export interface IoTSensor {
  id: string;
  warehouseId: string;
  zoneId: string;
  type: 'temperature' | 'humidity' | 'air_quality' | 'motion' | 'pressure' | 'weight' | 'rfid';
  name: string;
  value: number;
  unit: string;
  status: 'online' | 'offline' | 'error' | 'calibrating';
  lastReading: Date;
  batteryLevel?: number;
  threshold: { min: number; max: number };
  alerts: boolean;
}

// AI Vision Overlay Types
export interface CameraTile {
  id: string;
  name: string;
  zone: string;
}

export interface VehicleState {
  plate: string;
  cameraId: string;
  startedAt: string;
}

export interface VehicleStats {
  avgDwellSec: number;
  parkedCount: number;
  slaSeconds: number;
  slaCompliance: number;
}

// Emergency Response Types
export interface EmergencyDrill {
  id: string;
  name: string;
  zone: string;
  lastRun: string;
  nextRun: string;
  status: 'scheduled' | 'running' | 'completed';
}

// Security Monitoring Types
export interface SecurityCamera {
  id: string;
  name: string;
  location: string;
  zone: string;
  type: 'dome' | 'bullet' | 'ptz' | 'thermal' | 'ai-enhanced';
  status: 'online' | 'offline' | 'maintenance' | 'alert';
  resolution: string;
  fps: number;
  nightVision: boolean;
  aiFeatures: string[];
  lastActivity: Date;
  alertCount: number;
  recordingActive: boolean;
  coordinates: { x: number; y: number };
  coverage: number;
  signalStrength: number;
}

export interface SecurityAlert {
  id: string;
  type: 'intrusion' | 'unauthorized-access' | 'safety-violation' | 'equipment-failure' | 'fire' | 'chemical-spill';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  cameraId: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'false-positive';
  assignedTo?: string;
  responseTime?: number;
  aiConfidence: number;
  evidence: {
    type: 'image' | 'video' | 'sensor';
    url: string;
    timestamp: Date;
  }[];
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: 'entry' | 'exit' | 'access-granted' | 'access-denied';
  location: string;
  timestamp: Date;
  method: 'badge' | 'biometric' | 'keypad' | 'mobile';
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface EnvironmentalSensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'air-quality' | 'gas' | 'pressure' | 'vibration';
  location: string;
  zone: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  threshold: { min: number; max: number };
  lastUpdate: Date;
  trend: 'stable' | 'rising' | 'falling';
}

// Smart Inventory Types
export interface SmartInventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'chemicals' | 'equipment' | 'supplies' | 'safety' | 'raw-materials';
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  optimalStock: number;
  unitPrice: number;
  totalValue: number;
  location: {
    warehouse: string;
    zone: string;
    shelf: string;
    bin: string;
  };
  supplier: {
    name: string;
    contact: string;
    leadTime: number;
    reliability: number;
  };
  lastUpdated: Date;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstocked' | 'pending-order';
  movements: {
    date: Date;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    user: string;
  }[];
  aiPredictions: {
    demandForecast: number;
    reorderDate: Date;
    suggestedQuantity: number;
    confidenceLevel: number;
  };
  qualityInfo?: {
    batchNumber: string;
    expiryDate: Date;
    qualityGrade: string;
    certifications: string[];
  };
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  turnoverRate: number;
  accuracyRate: number;
  automatedOrders: number;
  costSavings: number;
}











