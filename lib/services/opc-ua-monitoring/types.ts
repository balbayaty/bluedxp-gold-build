/**
 * OPC UA Machine Monitoring - Type Definitions
 * EUROMAP-77 compliant injection molding machine monitoring
 */

export interface OPCUAMachine {
  id: string;
  tenantId: string;
  name: string;
  machineType: "injection_molding" | "assembly" | "other";
  manufacturer: string;
  model: string;
  serialNumber: string;
  opcuaEndpoint: string;
  opcuaSecurityMode?: "None" | "Sign" | "SignAndEncrypt";
  opcuaSecurityPolicy?: string;
  euromapVersion?: "77" | "63" | "none";
  status: "online" | "offline" | "error";
  lastConnected?: Date;
  metadata?: Record<string, any>;
}

export interface OPCUANode {
  nodeId: string;
  browseName: string;
  nodeClass: "Variable" | "Object" | "Method";
  dataType?: string;
  value?: any;
  timestamp?: Date;
}

export interface MachineTelemetry {
  machineId: string;
  timestamp: Date;
  // Production Metrics
  cycleTime?: number; // seconds
  shotCount?: number;
  partsProduced?: number;
  partsRejected?: number;
  // Machine State
  machineState?: "idle" | "running" | "setup" | "maintenance" | "error";
  currentCycle?: number;
  // Energy
  energyConsumption?: number; // kWh
  powerConsumption?: number; // kW
  // Temperature
  barrelTemperature?: number[];
  moldTemperature?: number[];
  // Pressure
  injectionPressure?: number; // bar
  holdingPressure?: number; // bar
  // Alarms
  activeAlarms?: Alarm[];
  // OEE Components
  availability?: number; // 0-100
  performance?: number; // 0-100
  quality?: number; // 0-100
  oee?: number; // 0-100
}

export interface Alarm {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  code?: string;
  timestamp: Date;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface OEEAggregate {
  machineId: string;
  period: {
    start: Date;
    end: Date;
  };
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  plannedProductionTime: number; // minutes
  actualProductionTime: number; // minutes
  idealCycleTime: number; // seconds
  actualCycleTime: number; // seconds
  totalParts: number;
  goodParts: number;
  rejectedParts: number;
}

export interface MachineConfiguration {
  machineId: string;
  euromap77Nodes?: {
    productionCounter?: string;
    cycleTime?: string;
    machineState?: string;
    energyConsumption?: string;
    alarms?: string;
  };
  customNodes?: Record<string, string>; // nodeId -> description
  pollingInterval?: number; // milliseconds
  alarmThresholds?: {
    cycleTimeMax?: number;
    temperatureMax?: number;
    pressureMax?: number;
    energyMax?: number;
  };
}
