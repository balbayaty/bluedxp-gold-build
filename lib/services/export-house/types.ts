/**
 * Export House License - Type Definitions
 */

export type ExportHouseLicenseStatus =
  | "not_applied"
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "expired";

export type ComplianceRequirementStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue";

export interface SEDALicenseApplication {
  id: string;
  tenantId: string;
  applicationNumber?: string;
  status: ExportHouseLicenseStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  expiryDate?: Date;
  rejectionReason?: string;

  // Company Information
  companyName: string;
  commercialRegister: string;
  taxId: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;

  // Application Documents
  codeOfConduct?: string; // Document ID
  commercialRegisterCopy?: string;
  businessPlan?: string; // Document ID
  complianceDocuments?: string[]; // Document IDs

  // Compliance Requirements
  complianceRequirements: ComplianceRequirement[];

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ComplianceRequirement {
  id: string;
  requirement: string;
  description: string;
  status: ComplianceRequirementStatus;
  dueDate?: Date;
  completedAt?: Date;
  evidence?: string[]; // Document IDs
  notes?: string;
}

export interface BusinessPlan {
  id: string;
  tenantId: string;
  year: number; // 1, 2, or 3
  planData: {
    exportTargets: {
      productCategories: string[];
      targetMarkets: string[];
      revenueTarget: number;
      volumeTarget: number;
    };
    serviceOfferings: {
      exportEnablement: boolean;
      complianceCoordination: boolean;
      logisticsOrchestration: boolean;
      marketIntelligence: boolean;
    };
    operationalPlan: {
      staffing: number;
      infrastructure: string[];
      partnerships: string[];
    };
    financialProjections: {
      revenue: number;
      costs: number;
      profitability: number;
    };
    riskMitigation: {
      risks: string[];
      mitigationStrategies: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SEDAPortalIntegration {
  portalUrl: string;
  apiKey?: string;
  lastSync?: Date;
  syncStatus: "success" | "failed" | "pending";
}
