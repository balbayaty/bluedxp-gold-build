/**
 * MaaS (Manufacturing as a Service) Types
 *
 * Types for Manufacturing as a Service module
 * 12 shared services pillars, revenue model
 *
 * @module maas
 */

// ============================================================================
// MAAS TYPES
// ============================================================================

/**
 * MaaS pillar
 */
export type MAASPillar =
  | "SMART_FACTORY_INFRASTRUCTURE"
  | "ROBOTICS_AUTOMATION"
  | "QUALITY_ASSURANCE_LABS"
  | "LOGISTICS_HUB"
  | "TALENT_TRAINING_ACADEMY"
  | "PROCUREMENT_CONSORTIUM"
  | "SUSTAINABILITY_SERVICES"
  | "DIGITAL_TWIN_PLATFORM"
  | "COMPLIANCE_CERTIFICATION"
  | "RD_COLLABORATION_HUB"
  | "FINANCIAL_SERVICES"
  | "CUSTOMER_SUCCESS_PLATFORM";

/**
 * MaaS pillar definition
 */
export interface MAASPillarDefinition {
  id: number;
  name: string;
  type: MAASPillar;
  description: string;
  services: string[];
  revenue: string;
  pricing: {
    model: string;
    basePrice?: number;
    unitPrice?: number;
    margin: string;
  };
}

/**
 * MaaS tenant
 */
export interface MaaSTenant {
  id: string;
  name: string;
  tenantId: string;
  pillars: MAASPillar[];
  utilization: Record<MAASPillar, number>; // 0-1
  revenue: number;
  createdAt: Date;
}

/**
 * MaaS resource allocation
 */
export interface MaaSResourceAllocation {
  pillar: MAASPillar;
  resourceId: string;
  tenantId: string;
  allocated: number;
  utilized: number;
  startDate: Date;
  endDate?: Date;
}

/**
 * MaaS revenue model
 */
export interface MaaSRevenueModel {
  streams: {
    infrastructureLease: {
      description: string;
      pricing: string;
      margin: string;
    };
    equipmentAsService: {
      description: string;
      pricing: string;
      margin: string;
    };
    managedServices: { description: string; pricing: string; margin: string };
    transactionFees: { description: string; pricing: string; margin: string };
  };
  projections: Record<
    string,
    { revenue: number; customers: number; utilization: number }
  >;
}
