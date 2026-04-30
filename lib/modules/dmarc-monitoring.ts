/**
 * DMARC Monitoring Module
 * Email deliverability tracking and domain reputation monitoring
 */

import { ModuleDefinition } from './registry';

export const dmarcMonitoringModule: ModuleDefinition = {
  id: 'dmarc-monitoring',
  name: 'DMARC Monitoring',
  description: 'Email deliverability tracking, DMARC report analysis, and domain reputation monitoring',
  version: '1.0.0',
  category: 'compliance',
  standalone: true,
  dependencies: [],
  enabled: true,
  routes: [
    {
      path: '/dmarc-monitoring',
      component: 'app/dmarc-monitoring/page',
      title: 'DMARC Monitoring',
      icon: 'ri-mail-check-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      path: '/dmarc-monitoring/reports',
      component: 'app/dmarc-monitoring/reports/page',
      title: 'DMARC Reports',
      icon: 'ri-file-chart-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      path: '/dmarc-monitoring/reputation',
      component: 'app/dmarc-monitoring/reputation/page',
      title: 'Domain Reputation',
      icon: 'ri-shield-star-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'COMPLIANCE_OFFICER'],
    },
  ],
  components: [
    'components/dmarc/DMARCDashboard.tsx',
    'components/dmarc/DMARCReportViewer.tsx',
    'components/dmarc/DomainReputationCard.tsx',
  ],
  services: [
    'lib/services/dmarc-monitoring',
  ],
  apis: [
    {
      endpoint: '/api/dmarc-monitoring/aggregates',
      method: 'GET',
      description: 'Get DMARC aggregates for domain',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/dmarc-monitoring/reputation',
      method: 'GET',
      description: 'Get domain reputation score',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'COMPLIANCE_OFFICER'],
    },
    {
      endpoint: '/api/dmarc-monitoring/alerts',
      method: 'GET',
      description: 'Get active DMARC alerts',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/dmarc-monitoring/validate',
      method: 'POST',
      description: 'Validate SPF/DKIM configuration',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
  ],
  settings: [
    {
      key: 'autoProcessReports',
      value: true,
      type: 'boolean',
      description: 'Automatically process incoming DMARC reports',
      required: false,
      default: true,
    },
    {
      key: 'alertThreshold',
      value: 0.9,
      type: 'number',
      description: 'Alert threshold for DMARC pass rate (0-1)',
      required: false,
      default: 0.9,
    },
  ],
  featureFlags: {
    realTimeMonitoring: true,
    blacklistChecking: true,
    reputationScoring: true,
    alerting: true,
  },
  config: {
    autoProcessReports: true,
    alertThreshold: 0.9,
  },
};













