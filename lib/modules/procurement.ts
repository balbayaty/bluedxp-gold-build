/**
 * Procurement & Purchasing Module
 * Comprehensive procurement and purchasing management for all industries with deep construction specialization
 * DEEP INTEGRATION with Finance, Marketplace, WMS, TMS, HR modules (ZERO DUPLICATION)
 */

import { ModuleDefinition } from './registry'

export const procurementModule: ModuleDefinition = {
  id: 'procurement',
  name: 'Procurement & Purchasing',
  description: 'Comprehensive procurement and purchasing management for all industries with deep construction specialization',
  icon: '🛒',
  color: '#3B82F6',
  category: 'other' as const,
  version: '1.0.0',
  enabled: true,
  dependencies: ['finance', 'marketplace', 'wms', 'hr'],
  
  routes: [
    {
      path: '/procurement/dashboard',
      name: 'Procurement Dashboard',
      component: 'app/procurement/page',
      icon: 'dashboard',
      requiresAuth: true,
      permissions: ['procurement.dashboard'],
    },
    {
      path: '/procurement/requisitions',
      name: 'Requisitions',
      component: 'app/procurement/requisitions/page',
      icon: 'file-text',
      requiresAuth: true,
      permissions: ['procurement.requisitions'],
    },
    {
      path: '/procurement/purchase-orders',
      name: 'Purchase Orders',
      component: 'app/procurement/purchase-orders/page',
      icon: 'shopping-cart',
      requiresAuth: true,
      permissions: ['procurement.purchase_orders'],
    },
    {
      path: '/procurement/vendors',
      name: 'Vendors',
      component: 'app/procurement/vendors/page',
      icon: 'building',
      requiresAuth: true,
      permissions: ['procurement.vendors'],
    },
    {
      path: '/procurement/contracts',
      name: 'Contracts',
      component: 'app/procurement/contracts/page',
      icon: 'file-contract',
      requiresAuth: true,
      permissions: ['procurement.contracts'],
    },
    {
      path: '/procurement/goods-receipt',
      name: 'Goods Receipt',
      component: 'app/procurement/goods-receipt/page',
      icon: 'inbox',
      requiresAuth: true,
      permissions: ['procurement.goods_receipt'],
    },
    {
      path: '/procurement/invoices',
      name: 'Invoices',
      component: 'app/procurement/invoices/page',
      icon: 'file-invoice',
      requiresAuth: true,
      permissions: ['procurement.invoices'],
    },
    {
      path: '/procurement/projects',
      name: 'Project Procurement',
      component: 'app/procurement/projects/page',
      icon: 'folder',
      requiresAuth: true,
      permissions: ['procurement.projects'],
    },
    {
      path: '/procurement/materials',
      name: 'Materials',
      component: 'app/procurement/materials/page',
      icon: 'box',
      requiresAuth: true,
      permissions: ['procurement.materials'],
    },
    {
      path: '/procurement/equipment',
      name: 'Equipment',
      component: 'app/procurement/equipment/page',
      icon: 'wrench',
      requiresAuth: true,
      permissions: ['procurement.equipment'],
    },
    {
      path: '/procurement/subcontractors',
      name: 'Subcontractors',
      component: 'app/procurement/subcontractors/page',
      icon: 'users',
      requiresAuth: true,
      permissions: ['procurement.subcontractors'],
    },
    {
      path: '/procurement/analytics',
      name: 'Analytics',
      component: 'app/procurement/analytics/page',
      icon: 'bar-chart',
      requiresAuth: true,
      permissions: ['procurement.analytics'],
    },
    {
      path: '/procurement/settings',
      name: 'Settings',
      component: 'app/procurement/settings/page',
      icon: 'settings',
      requiresAuth: true,
      permissions: ['procurement.settings'],
    },
  ],

  services: [
    {
      name: 'Requisition Service',
      path: 'lib/services/procurement/requisitionService',
      description: 'Requisition management - creation, approval, tracking',
    },
    {
      name: 'Purchase Order Service',
      path: 'lib/services/procurement/purchaseOrderService',
      description: 'Purchase order management - creation, approval, tracking, lifecycle',
    },
    {
      name: 'Vendor Service',
      path: 'lib/services/procurement/vendorService',
      description: 'Vendor management - master data, onboarding, performance, relationships',
    },
    {
      name: 'Sourcing Service',
      path: 'lib/services/procurement/sourcingService',
      description: 'Sourcing and vendor selection - RFQ, RFP, RFI, auctions, negotiation',
    },
    {
      name: 'Goods Receipt Service',
      path: 'lib/services/procurement/goodsReceiptService',
      description: 'Goods receipt and inspection - GRN, quality inspection, matching',
    },
    {
      name: 'Invoice Service',
      path: 'lib/services/procurement/invoiceService',
      description: 'Invoice processing - receipt, matching, approval, payment scheduling',
    },
    {
      name: 'Contract Service',
      path: 'lib/services/procurement/contractService',
      description: 'Contract management - creation, negotiation, execution, compliance',
    },
    {
      name: 'Catalog Service',
      path: 'lib/services/procurement/catalogService',
      description: 'Catalog management - internal catalog, vendor catalog, marketplace catalog',
    },
    {
      name: 'Project Procurement Service',
      path: 'lib/services/procurement/projectProcurementService',
      description: 'Project-based procurement - construction projects, phases, work packages',
    },
    {
      name: 'Material Procurement Service',
      path: 'lib/services/procurement/materialProcurementService',
      description: 'Materials procurement - MRP, BOM, quantity takeoff, material optimization',
    },
    {
      name: 'Equipment Procurement Service',
      path: 'lib/services/procurement/equipmentProcurementService',
      description: 'Equipment procurement - equipment master, tracking, maintenance, utilization',
    },
    {
      name: 'Subcontractor Service',
      path: 'lib/services/procurement/subcontractorService',
      description: 'Subcontractor management - work packages, progress billing, retention',
    },
    {
      name: 'Finance Integration Service',
      path: 'lib/services/procurement/integration/financeIntegration',
      description: 'Deep Finance integration - budget checking, commitments, AP, cost accounting',
    },
    {
      name: 'Marketplace Integration Service',
      path: 'lib/services/procurement/integration/marketplaceIntegration',
      description: 'Marketplace integration - service procurement, RFQ integration, vendor discovery',
    },
    {
      name: 'WMS Integration Service',
      path: 'lib/services/procurement/integration/wmsIntegration',
      description: 'WMS integration - inventory requirements, goods receipt, material tracking',
    },
    {
      name: 'ERP Integration Service',
      path: 'lib/services/procurement/integration/erpIntegration',
      description: 'ERP integration - SAP, Oracle, Microsoft, ERPNext - master data sync, transaction sync',
    },
    {
      name: 'TMS Integration Service',
      path: 'lib/services/procurement/integration/tmsIntegration',
      description: 'TMS integration - transportation quotes, delivery tracking, carrier performance',
    },
    {
      name: 'Blockchain Service',
      path: 'lib/services/procurement/blockchainService',
      description: 'Blockchain integration - smart contracts, tokenization, supply chain transparency',
    },
    {
      name: 'Spend Analytics Service',
      path: 'lib/services/procurement/analytics/spendAnalyticsService',
      description: 'Spend analytics - category spend, vendor spend, project spend, trend analysis',
    },
    {
      name: 'Vendor Analytics Service',
      path: 'lib/services/procurement/analytics/vendorAnalyticsService',
      description: 'Vendor analytics - performance metrics, scorecards, trends',
    },
    {
      name: 'AI Sourcing Service',
      path: 'lib/services/procurement/aiSourcingService',
      description: 'AI-powered sourcing - vendor discovery, predictive sourcing, automated negotiation',
    },
    {
      name: 'Predictive Analytics Service',
      path: 'lib/services/procurement/predictiveAnalyticsService',
      description: 'Predictive analytics - demand forecasting, price forecasting, risk prediction',
    },
    {
      name: 'Risk Analytics Service',
      path: 'lib/services/procurement/analytics/riskAnalyticsService',
      description: 'Risk analytics - supply risk, vendor risk, delivery risk, quality risk, financial risk',
    },
    {
      name: 'Payment Processing Service',
      path: 'lib/services/procurement/paymentProcessingService',
      description: 'Payment processing - automated scheduling, early payment discounts, payment terms',
    },
    {
      name: 'Currency Management Service',
      path: 'lib/services/procurement/currencyManagementService',
      description: 'Currency management - multi-currency, FX rates, hedging, exposure tracking',
    },
    {
      name: 'E-Invoicing Service',
      path: 'lib/services/procurement/eInvoicingService',
      description: 'E-invoicing - ZATCA, PEPPOL, UBL support, invoice validation',
    },
    {
      name: 'HR Integration Service',
      path: 'lib/services/procurement/integration/hrIntegration',
      description: 'HR integration - manpower procurement, contractor management, skills-based sourcing',
    },
    {
      name: 'Facility Integration Service',
      path: 'lib/services/procurement/integration/facilityIntegration',
      description: 'Facility integration - MRO procurement, asset procurement, utility procurement',
    },
    {
      name: 'Quality & Compliance Integration Service',
      path: 'lib/services/procurement/integration/qualityComplianceIntegration',
      description: 'Quality integration - material certificates, inspection, NCR management (reuses QHSE)',
    },
    {
      name: 'Safety & Environmental Integration Service',
      path: 'lib/services/procurement/integration/safetyEnvironmentalIntegration',
      description: 'Safety integration - safety compliance, environmental compliance, sustainability (reuses QHSE)',
    },
    {
      name: 'Drawing & BIM Integration Service',
      path: 'lib/services/procurement/integration/drawingBIMIntegration',
      description: 'Drawing & BIM integration - drawing management, BIM integration, quantity takeoff (reuses Facility BIM)',
    },
    {
      name: 'NLP Service',
      path: 'lib/services/procurement/nlpService',
      description: 'NLP service - voice requisitions, natural language processing, intelligent document processing',
    },
    {
      name: 'Computer Vision Service',
      path: 'lib/services/procurement/computerVisionService',
      description: 'Computer vision - image-based procurement, quality inspection, receipt verification (reuses AI Vision)',
    },
    {
      name: 'DeFi Integration Service',
      path: 'lib/services/procurement/defiIntegrationService',
      description: 'DeFi integration - supply chain finance, vendor financing, invoice financing',
    },
    {
      name: 'IoT Integration Service',
      path: 'lib/services/procurement/iotIntegrationService',
      description: 'IoT integration - smart procurement, asset tracking, quality monitoring (reuses Facility IoT)',
    },
    {
      name: 'Digital Twin Service',
      path: 'lib/services/procurement/digitalTwinService',
      description: 'Digital twin - procurement digital twin, supply chain digital twin (reuses Facility Digital Twin)',
    },
  ],

  features: [
    {
      id: 'procurement.requisitions',
      name: 'Requisition Management',
      description: 'Material, service, capital, and project requisitions with multi-level approval',
      enabled: true,
    },
    {
      id: 'procurement.purchase_orders',
      name: 'Purchase Order Management',
      description: 'Complete PO lifecycle - creation, approval, tracking, goods receipt, invoicing',
      enabled: true,
    },
    {
      id: 'procurement.vendors',
      name: 'Vendor Management',
      description: 'Vendor master data, onboarding, performance management, relationships',
      enabled: true,
    },
    {
      id: 'procurement.sourcing',
      name: 'Sourcing & Vendor Selection',
      description: 'RFQ, RFP, RFI, auctions, intelligent vendor matching, negotiation',
      enabled: true,
    },
    {
      id: 'procurement.contracts',
      name: 'Contract Management',
      description: 'Contract lifecycle - creation, negotiation, execution, compliance monitoring',
      enabled: true,
    },
    {
      id: 'procurement.goods_receipt',
      name: 'Goods Receipt & Inspection',
      description: 'GRN creation, quality inspection, 2-way/3-way/4-way matching',
      enabled: true,
    },
    {
      id: 'procurement.invoices',
      name: 'Invoice Processing',
      description: 'Invoice receipt, matching, approval, payment scheduling',
      enabled: true,
    },
    {
      id: 'procurement.projects',
      name: 'Project-Based Procurement',
      description: 'Construction project procurement - phases, work packages, cost codes',
      enabled: true,
    },
    {
      id: 'procurement.materials',
      name: 'Materials Procurement',
      description: 'Construction materials - MRP, BOM, quantity takeoff, material optimization',
      enabled: true,
    },
    {
      id: 'procurement.equipment',
      name: 'Equipment Procurement',
      description: 'Equipment procurement - tracking, maintenance, utilization',
      enabled: true,
    },
    {
      id: 'procurement.subcontractors',
      name: 'Subcontractor Management',
      description: 'Subcontractor procurement - work packages, progress billing, retention',
      enabled: true,
    },
    {
      id: 'procurement.analytics',
      name: 'Procurement Analytics',
      description: 'Spend analytics, vendor analytics, predictive analytics, prescriptive analytics',
      enabled: true,
    },
    {
      id: 'procurement.finance_integration',
      name: 'Finance Integration',
      description: 'Deep Finance integration - budget checking, commitments, AP, cost accounting',
      enabled: true,
    },
    {
      id: 'procurement.ai',
      name: 'AI-Powered Intelligence',
      description: 'Intelligent sourcing, predictive analytics, NLP, computer vision',
      enabled: true,
    },
    {
      id: 'procurement.blockchain',
      name: 'Blockchain & Tokenization',
      description: 'Smart contracts, tokenization, DeFi integration, NFT support',
      enabled: true,
    },
  ],

  integrations: [
    {
      module: 'finance',
      type: 'deep',
      description: 'Budget checking, commitments, AP automation, cost accounting, GL posting',
    },
    {
      module: 'marketplace',
      type: 'integration',
      description: 'Service procurement, RFQ integration, vendor discovery, dynamic pricing',
    },
    {
      module: 'wms',
      type: 'integration',
      description: 'Inventory requirements, goods receipt, material tracking, warehouse network',
    },
    {
      module: 'tms',
      type: 'integration',
      description: 'Freight procurement, logistics costs, delivery tracking',
    },
    {
      module: 'hr',
      type: 'integration',
      description: 'Manpower procurement, skills-based sourcing, labor cost tracking',
    },
    {
      module: 'facility-management',
      type: 'integration',
      description: 'MRO procurement, asset procurement, utility procurement',
    },
  ],

  config: {
    enableBudgetChecking: true,
    enableCommitmentTracking: true,
    enableAutoAPCreation: true,
    enableCostAllocation: true,
    enableProjectProcurement: true,
    enableConstructionFeatures: true,
    enableAISourcing: true,
    enableBlockchain: false, // Future feature
    enableTokenization: false, // Future feature
    enableDeFi: false, // Future feature
  },
}





