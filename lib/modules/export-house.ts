/**
 * Export House License Module
 * SEDA (Saudi Export Development Authority) Export Houses license management
 */

import { ModuleDefinition } from './registry';

export const exportHouseModule: ModuleDefinition = {
  id: 'export-house',
  name: 'Export House License',
  description: 'Saudi Export Development Authority (SEDA) Export Houses license management and compliance',
  version: '1.0.0',
  category: 'compliance',
  standalone: false,
  dependencies: ['compliance', 'trade-compliance'],
  enabled: true,
  routes: [
    {
      path: '/export-house',
      component: 'app/export-house/page',
      title: 'Export House License',
      icon: 'ri-global-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'LEGAL_ADVISOR'],
    },
    {
      path: '/export-house/application',
      component: 'app/export-house/application/page',
      title: 'License Application',
      icon: 'ri-file-add-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      path: '/export-house/compliance',
      component: 'app/export-house/compliance/page',
      title: 'Compliance Tracking',
      icon: 'ri-shield-check-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      path: '/export-house/business-plan',
      component: 'app/export-house/business-plan/page',
      title: '3-Year Business Plan',
      icon: 'ri-file-chart-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'LEGAL_ADVISOR'],
    },
  ],
  components: [
    'components/export-house/ExportHouseDashboard.tsx',
    'components/export-house/ApplicationForm.tsx',
    'components/export-house/ComplianceTracker.tsx',
    'components/export-house/BusinessPlanEditor.tsx',
  ],
  services: [
    'lib/services/export-house',
  ],
  apis: [
    {
      endpoint: '/api/export-house/status',
      method: 'GET',
      description: 'Get export house license status',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      endpoint: '/api/export-house/application',
      method: 'POST',
      description: 'Submit export house license application',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      endpoint: '/api/export-house/compliance',
      method: 'GET',
      description: 'Get compliance status',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      endpoint: '/api/export-house/business-plan',
      method: 'GET',
      description: 'Get 3-year business plan',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'LEGAL_ADVISOR'],
    },
    {
      endpoint: '/api/export-house/business-plan',
      method: 'PUT',
      description: 'Update 3-year business plan',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER'],
    },
  ],
  settings: [
    {
      key: 'sedaPortalEnabled',
      value: false,
      type: 'boolean',
      description: 'Enable SEDA portal integration',
      required: false,
      default: false,
    },
    {
      key: 'autoComplianceTracking',
      value: true,
      type: 'boolean',
      description: 'Automatically track compliance requirements',
      required: false,
      default: true,
    },
  ],
  featureFlags: {
    sedaIntegration: false,
    businessPlanGenerator: true,
    complianceTracking: true,
    documentManagement: true,
  },
  config: {
    sedaPortalEnabled: false,
    autoComplianceTracking: true,
  },
};













