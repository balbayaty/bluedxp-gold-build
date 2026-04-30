/**
 * Procurement Services Index
 * Central export for all procurement services
 */

// Core Services
export { requisitionService } from "./requisitionService";
export { purchaseOrderService } from "./purchaseOrderService";
export { vendorService } from "./vendorService";
export { sourcingService } from "./sourcingService";
export { goodsReceiptService } from "./goodsReceiptService";
export { invoiceService } from "./invoiceService";
export { contractService } from "./contractService";
export { catalogService } from "./catalogService";

// Construction-Specific Services
export { projectProcurementService } from "./projectProcurementService";
export { materialProcurementService } from "./materialProcurementService";
export { equipmentProcurementService } from "./equipmentProcurementService";
export { subcontractorService } from "./subcontractorService";

// Integration Services
export { financeIntegrationService } from "./integration/financeIntegration";

// Analytics Services
export { spendAnalyticsService } from "./analytics/spendAnalyticsService";
export { vendorAnalyticsService } from "./analytics/vendorAnalyticsService";
export { riskAnalyticsService } from "./analytics/riskAnalyticsService";

// AI Services
export { aiSourcingService } from "./aiSourcingService";
export { predictiveAnalyticsService } from "./predictiveAnalyticsService";

// Integration Services
export { marketplaceIntegrationService } from "./integration/marketplaceIntegration";
export { wmsIntegrationService } from "./integration/wmsIntegration";
export { tmsIntegrationService } from "./integration/tmsIntegration";
export { erpIntegrationService } from "./integration/erpIntegration";

// Blockchain Service
export { blockchainService } from "./blockchainService";

// Payment & Currency Services
export { paymentProcessingService } from "./paymentProcessingService";
export { currencyManagementService } from "./currencyManagementService";

// E-Invoicing Service
export { eInvoicingService } from "./eInvoicingService";

// Integration Services (Zero Duplication)
export { hrIntegrationService } from "./integration/hrIntegration";
export { facilityIntegrationService } from "./integration/facilityIntegration";
export { qualityComplianceIntegrationService } from "./integration/qualityComplianceIntegration";
export { safetyEnvironmentalIntegrationService } from "./integration/safetyEnvironmentalIntegration";
export { drawingBIMIntegrationService } from "./integration/drawingBIMIntegration";

// AI Services
export { nlpService } from "./nlpService";
export { computerVisionService } from "./computerVisionService";

// Advanced Services
export { defiIntegrationService } from "./defiIntegrationService";
export { iotIntegrationService } from "./iotIntegrationService";
export { digitalTwinService } from "./digitalTwinService";
