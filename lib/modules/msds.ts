/**
 * MSDS Module Definition
 * Material Safety Data Sheets (SDS/MSDS) management and cross-module intelligence.
 *
 * Design goals:
 * - Standalone sellable module (no hard dependencies)
 * - Integration-ready: publishes msds.* events and supports cross-module lookups
 * - Multi-tenant from day 1 (tenant context required at API boundary)
 */

import { ModuleDefinition } from './registry'

export const msdsModule: ModuleDefinition = {
  id: 'msds',
  name: 'MSDS / Chemical Safety',
  description:
    'MSDS/SDS management with AI extraction, review/approval workflow, cross-module sharing (WMS/TMS/Compliance/QHSE), and truth/evidence integration.',
  version: '1.0.0',
  category: 'msds',
  standalone: true,
  enabled: true,
  dependencies: [],
  routes: [
    {
      path: '/msds',
      component: 'app/msds/page',
      title: 'MSDS Management',
      icon: 'ri-file-shield-2-line',
      requiresAuth: true,
    },
    {
      path: '/msds-sku-linking',
      component: 'app/msds-sku-linking/page',
      title: 'MSDS ↔ SKU Linking',
      icon: 'ri-link-m',
      requiresAuth: true,
    },
    {
      path: '/chemical-safety/sds-analysis',
      component: 'app/chemical-safety/sds-analysis/page',
      title: 'SDS Analysis',
      icon: 'ri-flask-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/msds/WarehouseRecommendations',
    'components/msds/PDFViewer',
    'components/qr/DocumentQRGenerator',
    'components/msds-sku-linking/MatchingSuggestions',
    'components/msds-sku-linking/LinkedItemsList',
  ],
  services: [
    'lib/services/chemical/msdsStorage',
    'lib/services/chemical/msdsService',
    'lib/services/chemical/msdsDomainService',
    'lib/services/msds-sku-linking',
    'lib/services/truth-engine/integrations/msdsIntegration',
  ],
  apis: [
    // Jobs-based batch processing (preferred)
    { endpoint: '/api/chemical/msds/jobs', method: 'POST', description: 'Create MSDS batch processing job', requiresAuth: true },
    { endpoint: '/api/chemical/msds/jobs', method: 'GET', description: 'List MSDS jobs for tenant', requiresAuth: true },
    { endpoint: '/api/chemical/msds/jobs/[id]', method: 'GET', description: 'Get MSDS job status/results', requiresAuth: true },
    { endpoint: '/api/chemical/msds/jobs/[id]', method: 'POST', description: 'Resume/retry MSDS job (reruns failed items)', requiresAuth: true },
    // Legacy endpoint (kept for backward compatibility; prefer jobs)
    { endpoint: '/api/chemical/msds/batch', method: 'POST', description: 'DEPRECATED: Batch process MSDS files', requiresAuth: true },
    { endpoint: '/api/chemical/msds/compare', method: 'POST', description: 'Compare two MSDS versions', requiresAuth: true },
    { endpoint: '/api/chemical/msds/compliance', method: 'POST', description: 'Check MSDS compliance', requiresAuth: true },
    { endpoint: '/api/chemical/msds/get-for-module', method: 'GET', description: 'Cross-module MSDS lookup', requiresAuth: true },
    { endpoint: '/api/chemical/msds/update-compliance', method: 'POST', description: 'Update MSDS compliance metadata', requiresAuth: true },
    { endpoint: '/api/chemical/msds/update-transportation', method: 'POST', description: 'Update MSDS transportation metadata', requiresAuth: true },
    { endpoint: '/api/chemical/msds/bulk-approve', method: 'POST', description: 'Bulk approve MSDS documents', requiresAuth: true },
    { endpoint: '/api/chemical/msds/bulk-reject', method: 'POST', description: 'Bulk reject MSDS documents', requiresAuth: true },
  ],
  featureFlags: {
    aiExtraction: true,
    duplicateDetection: true,
    crossModuleLookup: true,
    truthEngineIntegration: true,
  },
  settings: [
    {
      key: 'msdsSkuLinkingRbac',
      value: {
        readerRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'WMS_MANAGER', 'WAREHOUSE_MANAGER', 'CUSTOMER_ADMIN', 'CUSTOMER_USER'],
        writerRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'WMS_MANAGER', 'WAREHOUSE_MANAGER'],
        approverRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
      },
      type: 'object',
      description: 'RBAC roles for MSDS↔SKU Linking endpoints (read/write/approve). Change any time without code changes.',
      required: true,
      default: {
        readerRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'WMS_MANAGER', 'WAREHOUSE_MANAGER', 'CUSTOMER_ADMIN', 'CUSTOMER_USER'],
        writerRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'WMS_MANAGER', 'WAREHOUSE_MANAGER'],
        approverRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
      },
    },
  ],
  config: {
    msdsSkuLinkingRbac: {
      readerRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'WMS_MANAGER', 'WAREHOUSE_MANAGER', 'CUSTOMER_ADMIN', 'CUSTOMER_USER'],
      writerRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'WMS_MANAGER', 'WAREHOUSE_MANAGER'],
      approverRoles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
  },
}


