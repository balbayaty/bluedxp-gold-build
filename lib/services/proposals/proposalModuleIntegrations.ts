/**
 * Proposal Module Integrations
 *
 * Helper functions to integrate proposals with different modules
 * Makes it easy to generate proposals from module-specific contexts
 */

import { universalIntelligentProposalService } from "./universalIntelligentProposalService";
import type { ModuleProposalType } from "./universalIntelligentProposalService";

// ============================================================================
// WMS INTEGRATIONS
// ============================================================================

export interface WMSProposalContext {
  warehouseId?: string;
  warehouseName?: string;
  capacity?: number;
  utilization?: number;
  services?: string[];
  customerId?: string;
  customerName?: string;
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for WMS module
 */
export async function generateWMSProposal(context: WMSProposalContext) {
  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "wms",
    proposalType: "WMS_WAREHOUSING",
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.warehouseId,
    relatedEntityType: "WAREHOUSE",
    context: {
      title: context.warehouseName
        ? `Warehousing Services Proposal - ${context.warehouseName}`
        : "Warehousing Services Proposal",
      warehouseId: context.warehouseId,
      warehouseName: context.warehouseName,
      capacity: context.capacity,
      utilization: context.utilization,
      services: context.services,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// TMS INTEGRATIONS
// ============================================================================

export interface TMSProposalContext {
  shipmentId?: string;
  routeId?: string;
  carrierId?: string;
  origin?: string;
  destination?: string;
  customerId?: string;
  customerName?: string;
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for TMS module
 */
export async function generateTMSProposal(context: TMSProposalContext) {
  const proposalType: ModuleProposalType = context.shipmentId
    ? "TMS_TRANSPORTATION"
    : "TMS_FREIGHT";

  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "tms",
    proposalType,
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.shipmentId || context.routeId,
    relatedEntityType: context.shipmentId ? "SHIPMENT" : "ROUTE",
    context: {
      title: "Transportation Services Proposal",
      shipmentId: context.shipmentId,
      routeId: context.routeId,
      carrierId: context.carrierId,
      origin: context.origin,
      destination: context.destination,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// MARKETPLACE INTEGRATIONS
// ============================================================================

export interface MarketplaceProposalContext {
  listingId: string;
  listingType?: "STORAGE" | "TRANSPORTATION" | "CONSULTING" | "SERVICE";
  customerId?: string;
  customerName?: string;
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for Marketplace module
 */
export async function generateMarketplaceProposal(
  context: MarketplaceProposalContext,
) {
  // Map listing type to proposal type
  const proposalTypeMap: Record<string, ModuleProposalType> = {
    STORAGE: "MARKETPLACE_STORAGE",
    TRANSPORTATION: "MARKETPLACE_TRANSPORTATION",
    CONSULTING: "MARKETPLACE_CONSULTING",
    SERVICE: "MARKETPLACE_SERVICE",
  };

  const proposalType =
    proposalTypeMap[context.listingType || "SERVICE"] || "MARKETPLACE_SERVICE";

  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "marketplace",
    proposalType,
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.listingId,
    relatedEntityType: "SERVICE_LISTING",
    context: {
      title: "Marketplace Service Proposal",
      listingId: context.listingId,
      listingType: context.listingType,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// TRADE COMPLIANCE INTEGRATIONS
// ============================================================================

export interface TradeComplianceProposalContext {
  complianceCaseId?: string;
  customerId?: string;
  customerName?: string;
  serviceType?: "CUSTOMS_CLEARANCE" | "TRADE_COMPLIANCE";
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for Trade Compliance module
 */
export async function generateTradeComplianceProposal(
  context: TradeComplianceProposalContext,
) {
  const proposalType: ModuleProposalType =
    context.serviceType === "CUSTOMS_CLEARANCE"
      ? "CUSTOMS_CLEARANCE"
      : "TRADE_COMPLIANCE";

  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "trade-compliance",
    proposalType,
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.complianceCaseId,
    relatedEntityType: "COMPLIANCE_CASE",
    context: {
      title:
        context.serviceType === "CUSTOMS_CLEARANCE"
          ? "Customs Clearance Services Proposal"
          : "Trade Compliance Services Proposal",
      complianceCaseId: context.complianceCaseId,
      serviceType: context.serviceType,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// ISO-IMS INTEGRATIONS
// ============================================================================

export interface ISOIMSProposalContext {
  qualityCaseId?: string;
  customerId?: string;
  customerName?: string;
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for ISO-IMS module
 */
export async function generateISOIMSProposal(context: ISOIMSProposalContext) {
  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "iso-ims",
    proposalType: "ISO_IMS_QUALITY",
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.qualityCaseId,
    relatedEntityType: "QUALITY_CASE",
    context: {
      title: "Quality Management Services Proposal",
      qualityCaseId: context.qualityCaseId,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// QHSE INTEGRATIONS
// ============================================================================

export interface QHSEProposalContext {
  safetyCaseId?: string;
  customerId?: string;
  customerName?: string;
  serviceType?: "SAFETY" | "ENVIRONMENTAL";
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for QHSE module
 */
export async function generateQHSEProposal(context: QHSEProposalContext) {
  const proposalType: ModuleProposalType =
    context.serviceType === "ENVIRONMENTAL"
      ? "QHSE_ENVIRONMENTAL"
      : "QHSE_SAFETY";

  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "qhse",
    proposalType,
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.safetyCaseId,
    relatedEntityType: "SAFETY_CASE",
    context: {
      title:
        context.serviceType === "ENVIRONMENTAL"
          ? "Environmental Services Proposal"
          : "Safety Services Proposal",
      safetyCaseId: context.safetyCaseId,
      serviceType: context.serviceType,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// MULTIMODAL / COMPLETE SUPPLY CHAIN
// ============================================================================

export interface MultimodalProposalContext {
  customerId?: string;
  customerName?: string;
  services?: string[];
  tenantId: string;
  userId: string;
}

/**
 * Generate comprehensive multimodal proposal
 */
export async function generateMultimodalProposal(
  context: MultimodalProposalContext,
) {
  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "proposals-rfq",
    proposalType: "COMPLETE_SUPPLY_CHAIN",
    customerId: context.customerId,
    customerName: context.customerName,
    context: {
      title: "Complete Supply Chain Solutions Proposal",
      services: context.services || [
        "Warehousing",
        "Transportation",
        "Customs Clearance",
      ],
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// MAAS INTEGRATIONS
// ============================================================================

export interface MAASProposalContext {
  pillarId?: string;
  pillarName?: string;
  tenantId?: string;
  tenantName?: string;
  serviceType?: string;
  customerId?: string;
  customerName?: string;
  tenantId: string;
  userId: string;
}

/**
 * Generate proposal for MAAS module
 */
export async function generateMAASProposal(context: MAASProposalContext) {
  return universalIntelligentProposalService.generateUniversalProposal({
    moduleId: "maas",
    proposalType: "CUSTOM", // MAAS is custom
    customerId: context.customerId,
    customerName: context.customerName,
    relatedEntityId: context.pillarId || context.tenantId,
    relatedEntityType: context.pillarId ? "MAAS_PILLAR" : "MAAS_TENANT",
    context: {
      title: context.pillarName
        ? `MaaS Services Proposal - ${context.pillarName}`
        : "Manufacturing as a Service Proposal",
      pillarId: context.pillarId,
      pillarName: context.pillarName,
      tenantId: context.tenantId,
      tenantName: context.tenantName,
      serviceType: context.serviceType,
    },
    tenantId: context.tenantId,
    userId: context.userId,
  });
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const proposalModuleIntegrations = {
  generateWMSProposal,
  generateTMSProposal,
  generateMarketplaceProposal,
  generateTradeComplianceProposal,
  generateISOIMSProposal,
  generateQHSEProposal,
  generateMAASProposal,
  generateMultimodalProposal,
};
