/**
 * ICT Hardware Ecosystem - Type Definitions
 * Links injection molding MaaS to ICT hardware manufacturing
 */

export type ICTProductCategory =
  | "casing"
  | "enclosure"
  | "protective_system"
  | "connector"
  | "housing"
  | "bracket"
  | "other";

export type ManufacturingStage =
  | "design"
  | "tooling"
  | "prototype"
  | "production"
  | "quality_control"
  | "packaging"
  | "shipped";

export interface ICTProduct {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: ICTProductCategory;
  specifications: {
    material: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: "mm" | "cm" | "m";
    };
    weight?: number;
    color?: string;
    finish?: string;
    certifications?: string[];
  };
  manufacturing: {
    injectionMoldRequired: boolean;
    machineId?: string;
    estimatedCycleTime?: number;
    toolingCost?: number;
    materialCost?: number;
  };
  localContent: {
    percentage: number;
    components: Array<{
      component: string;
      source: "local" | "imported";
      percentage: number;
    }>;
  };
  status: "design" | "prototype" | "production" | "discontinued";
  createdAt: Date;
  updatedAt: Date;
}

export interface ManufacturingPipeline {
  id: string;
  tenantId: string;
  productId: string;
  orderId?: string;
  stage: ManufacturingStage;
  currentMachineId?: string;
  quantity: number;
  completed: number;
  rejected: number;
  startDate?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  qualityMetrics: {
    firstPassYield: number;
    rejectionRate: number;
    reworkRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategicPartnership {
  id: string;
  tenantId: string;
  partnerName: string;
  partnerType: "government" | "industrial" | "academic" | "technology";
  description: string;
  status: "exploring" | "negotiating" | "active" | "paused";
  alignment: {
    vision2030: boolean;
    localContent: boolean;
    technologyTransfer: boolean;
    jointDevelopment: boolean;
  };
  valueProposition: {
    governmentSupport: boolean;
    grants: boolean;
    industrialPartnerships: boolean;
    marketAccess: boolean;
  };
  contacts: Array<{
    name: string;
    role: string;
    email: string;
    phone?: string;
  }>;
  documents?: string[]; // Document IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Vision2030Metrics {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  localContent: {
    target: number;
    actual: number;
    products: number;
  };
  manufacturing: {
    totalProducts: number;
    activePipelines: number;
    completedOrders: number;
  };
  partnerships: {
    total: number;
    active: number;
    government: number;
    industrial: number;
  };
  impact: {
    jobsCreated: number;
    technologyTransfer: number;
    exports: number;
    importsReplaced: number;
  };
}
